using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users", table =>
            table.HasCheckConstraint("CK_Users_Role", "[Role] IN ('User', 'Admin')"));
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasMaxLength(450).ValueGeneratedNever();
        builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(254).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(30);
        builder.Property(x => x.NormalizedEmail).HasMaxLength(254).IsRequired();
        builder.Property(x => x.PasswordHash).HasMaxLength(1_000).IsRequired();
        builder.Property(x => x.Role).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(x => x.LockReason).HasMaxLength(1_000);
        builder.HasIndex(x => x.NormalizedEmail).IsUnique();
        builder.HasIndex(x => new { x.CreatedAtUtc, x.Id });
        builder.HasOne(x => x.Profile)
            .WithOne()
            .HasForeignKey<UserProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfiles", table =>
        {
            table.HasCheckConstraint("CK_UserProfiles_HeightCm", "[HeightCm] IS NULL OR ([HeightCm] > 0 AND [HeightCm] <= 300)");
            table.HasCheckConstraint("CK_UserProfiles_WeightKg", "[WeightKg] IS NULL OR ([WeightKg] > 0 AND [WeightKg] <= 1000)");
        });
        builder.HasKey(x => x.UserId);
        builder.Property(x => x.UserId).HasMaxLength(450).ValueGeneratedNever();
        builder.Property(x => x.Diet).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.BirthDate).HasColumnType("date");
        builder.Property(x => x.SexForEnergyEstimate).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.HeightCm).HasPrecision(5, 2);
        builder.Property(x => x.WeightKg).HasPrecision(6, 2);
        builder.Property(x => x.ActivityLevel).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.WeightGoal).HasConversion<string>().HasMaxLength(16);
        builder.Property(x => x.RestaurantArea).HasMaxLength(200);
        builder.HasMany(x => x.Allergies)
            .WithOne()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.AvoidedFoods)
            .WithOne()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class UserAllergyConfiguration : IEntityTypeConfiguration<UserAllergy>
{
    public void Configure(EntityTypeBuilder<UserAllergy> builder)
    {
        builder.ToTable("UserAllergies");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.NormalizedName).HasMaxLength(150).IsRequired();
        builder.HasIndex(x => new { x.UserId, x.NormalizedName }).IsUnique();
    }
}

public sealed class UserAvoidedFoodConfiguration : IEntityTypeConfiguration<UserAvoidedFood>
{
    public void Configure(EntityTypeBuilder<UserAvoidedFood> builder)
    {
        builder.ToTable("UserAvoidedFoods");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.UserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.NormalizedName).HasMaxLength(150).IsRequired();
        builder.HasIndex(x => new { x.UserId, x.NormalizedName }).IsUnique();
    }
}
