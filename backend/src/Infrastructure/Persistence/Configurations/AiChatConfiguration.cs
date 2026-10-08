using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class AiChatConversationConfiguration : IEntityTypeConfiguration<AiChatConversation>
{
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

public sealed class AiChatMessageConfiguration : IEntityTypeConfiguration<AiChatMessage>
{
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
