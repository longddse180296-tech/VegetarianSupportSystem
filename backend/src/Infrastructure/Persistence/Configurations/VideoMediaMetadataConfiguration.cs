// Ánh xạ thời lượng, audio và trạng thái đọc metadata của tệp video sang bảng SQL cùng các ràng buộc dữ liệu.
// Ánh xạ metadata độc lập theo tệp để giữ đúng thông tin của các phiên bản video.
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public sealed class VideoMediaMetadataConfiguration : IEntityTypeConfiguration<VideoMediaMetadata>
{
    public void Configure(EntityTypeBuilder<VideoMediaMetadata> builder)
    {
        builder.ToTable("VideoMediaMetadata", table => table.HasCheckConstraint("CK_VideoMediaMetadata_Duration", "[DurationSeconds] IS NULL OR [DurationSeconds] > 0"));
        builder.HasKey(x => x.MediaKey);
        builder.Property(x => x.MediaKey).HasMaxLength(200).ValueGeneratedNever();
    }
}
