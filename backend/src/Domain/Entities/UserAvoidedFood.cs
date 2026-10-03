namespace Domain.Entities;

public sealed class UserAvoidedFood
{
    private UserAvoidedFood() { }

    private UserAvoidedFood(string userId, string name, DateTimeOffset createdAtUtc)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Name = name;
        NormalizedName = name.ToUpperInvariant();
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string NormalizedName { get; private set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; private set; }

    public static UserAvoidedFood Create(string userId, string name, DateTimeOffset createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("A user ID is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 150)
            throw new ArgumentException("Avoided food name must be 1 to 150 characters.", nameof(name));

        return new UserAvoidedFood(userId.Trim(), name.Trim(), createdAtUtc);
    }

    internal void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 150)
            throw new ArgumentException("Avoided food name must be 1 to 150 characters.", nameof(name));

        Name = name.Trim();
        NormalizedName = Name.ToUpperInvariant();
    }
}
