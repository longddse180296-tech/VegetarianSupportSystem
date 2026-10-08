using System.Security.Cryptography;
using Application.Features.Auth;

namespace Infrastructure.Identity;

public sealed class Pbkdf2PasswordHasher : IAccountPasswordHasher
{
    private const int Iterations = 600_000;
    private const int SaltLength = 16;
    private const int KeyLength = 32;
    private const string Version = "pbkdf2-sha256";

    public string Hash(string password)
    {
        ArgumentNullException.ThrowIfNull(password);
        var salt = RandomNumberGenerator.GetBytes(SaltLength);
        var key = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, KeyLength);
        return $"{Version}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }

    public bool Verify(string hash, string password)
    {
        if (string.IsNullOrEmpty(hash) || password is null) return false;
        var parts = hash.Split('$');
        if (parts.Length != 4 || parts[0] != Version ||
            !int.TryParse(parts[1], out var iterations) || iterations is < 100_000 or > 2_000_000)
            return false;

        try
        {
            var salt = Convert.FromBase64String(parts[2]);
            var expected = Convert.FromBase64String(parts[3]);
            if (salt.Length != SaltLength || expected.Length != KeyLength) return false;
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, KeyLength);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
