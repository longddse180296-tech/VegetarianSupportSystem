using Domain.Enums;

namespace Domain.Entities;

public sealed class User
{
    private User() { }

    private User(string fullName, string email, string passwordHash, UserRole role, DateTimeOffset createdAtUtc)
    {
        Id = Guid.NewGuid().ToString("N");
        FullName = fullName;
        Email = email;
        NormalizedEmail = email.ToUpperInvariant();
        PasswordHash = passwordHash;
        Role = role;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
        Profile = UserProfile.Create(Id, createdAtUtc);
    }

    public string Id { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string NormalizedEmail { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public bool IsLocked { get; private set; }
    public string? LockReason { get; private set; }
    public DateTimeOffset? LockedAtUtc { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public UserProfile? Profile { get; private set; }

    public static User Register(string fullName, string email, string passwordHash, DateTimeOffset createdAtUtc)
    {
        fullName = RequireText(fullName, 150, nameof(fullName));
        email = RequireText(email, 254, nameof(email));
        passwordHash = RequireText(passwordHash, 1_000, nameof(passwordHash));
        return new User(fullName, email, passwordHash, UserRole.User, createdAtUtc);
    }

    // Only the opt-in internal bootstrap calls this factory. Public registration uses Register.
    public static User CreateInitialAdmin(string fullName, string email, string passwordHash, DateTimeOffset createdAtUtc)
    {
        fullName = RequireText(fullName, 150, nameof(fullName));
        email = RequireText(email, 254, nameof(email));
        passwordHash = RequireText(passwordHash, 1_000, nameof(passwordHash));
        return new User(fullName, email, passwordHash, UserRole.Admin, createdAtUtc);
    }

    public void UpdateContact(string fullName, string email, DateTimeOffset updatedAtUtc)
    {
        FullName = RequireText(fullName, 150, nameof(fullName));
        Email = RequireText(email, 254, nameof(email));
        NormalizedEmail = Email.ToUpperInvariant();
        UpdatedAtUtc = updatedAtUtc;
    }

    public void ChangePasswordHash(string passwordHash, DateTimeOffset updatedAtUtc)
    {
        PasswordHash = RequireText(passwordHash, 1_000, nameof(passwordHash));
        UpdatedAtUtc = updatedAtUtc;
    }

    public void Lock(string reason, DateTimeOffset lockedAtUtc)
    {
        if (IsLocked)
            throw new InvalidOperationException("The account is already locked.");

        LockReason = RequireText(reason, 1_000, nameof(reason));
        IsLocked = true;
        LockedAtUtc = lockedAtUtc;
        UpdatedAtUtc = lockedAtUtc;
    }

    public void Unlock(DateTimeOffset unlockedAtUtc)
    {
        if (!IsLocked)
            throw new InvalidOperationException("The account is not locked.");

        IsLocked = false;
        LockReason = null;
        LockedAtUtc = null;
        UpdatedAtUtc = unlockedAtUtc;
    }

    private static string RequireText(string value, int maxLength, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Trim().Length > maxLength)
            throw new ArgumentException($"{parameterName} is required and must be at most {maxLength} characters.", parameterName);

        return value.Trim();
    }
}
