// Chức năng: xác thực danh tính và mã truy cập. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Features.Auth;
using Domain.Entities;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Identity;

// InitialAdminSeeder: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public static class InitialAdminSeeder
{
    // SeedAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration, CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!configuration.GetValue<bool>("InitialAdmin:Enabled")) return;

        var fullName = configuration["InitialAdmin:FullName"]?.Trim();
        var email = configuration["InitialAdmin:Email"]?.Trim();
        var password = configuration["InitialAdmin:Password"];
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email) ||
            !new EmailAddressAttribute().IsValid(email) ||
            password is null || password.Length is < 6 or > 128 ||
            password.Any(char.IsWhiteSpace))
            throw new InvalidOperationException("InitialAdmin requires FullName, Email, and a 6-128 character Password without whitespace from a secret source.");

        using var scope = services.CreateScope();
        var accounts = scope.ServiceProvider.GetRequiredService<IUserAccountRepository>();
        if (await accounts.HasAdminAsync(cancellationToken)) return;
        if (await accounts.FindByEmailAsync(email.ToUpperInvariant(), cancellationToken) is not null)
            throw new InvalidOperationException("InitialAdmin email belongs to an existing account.");

        var hasher = scope.ServiceProvider.GetRequiredService<IAccountPasswordHasher>();
        var admin = User.CreateInitialAdmin(fullName, email, hasher.Hash(password), DateTimeOffset.UtcNow);
        await accounts.AddAsync(admin, cancellationToken);
    }
}
