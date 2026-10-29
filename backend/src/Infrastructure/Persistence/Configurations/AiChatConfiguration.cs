// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

// AiChatConversationConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class AiChatConversationConfiguration : IEntityTypeConfiguration<AiChatConversation>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<AiChatConversation> builder)
    {
        builder.ToTable("AiChatConversations");
        builder.HasKey(conversation => conversation.Id);
        builder.Property(conversation => conversation.UserId)
            .IsRequired()
            .HasMaxLength(450);
        builder.Property(conversation => conversation.CreatedAtUtc).IsRequired();
        builder.Property(conversation => conversation.UpdatedAtUtc).IsRequired();
        builder.HasIndex(conversation => new
        {
            conversation.UserId,
            conversation.UpdatedAtUtc
        });
        builder.HasMany<AiChatMessage>()
            .WithOne()
            .HasForeignKey(message => message.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

// AiChatMessageConfiguration: ánh xạ entity, kiểu cột và ràng buộc dữ liệu khi làm việc với SQL Server.
public sealed class AiChatMessageConfiguration : IEntityTypeConfiguration<AiChatMessage>
{
    // Configure: Ánh xạ entity, ràng buộc và quan hệ cho cơ sở dữ liệu.
    public void Configure(EntityTypeBuilder<AiChatMessage> builder)
    {
        builder.ToTable("AiChatMessages");
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Role)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();
        builder.Property(message => message.Content).IsRequired();
        builder.Property(message => message.CreatedAtUtc).IsRequired();
        builder.HasIndex(message => new
        {
            message.ConversationId,
            message.CreatedAtUtc,
            message.Id
        });
    }
}
