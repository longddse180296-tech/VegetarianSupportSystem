// Chức năng: bình luận và tương tác cộng đồng. Tầng Domain mô tả dữ liệu hoặc quy tắc nghiệp vụ, không phụ thuộc HTTP hay cơ sở dữ liệu.
namespace Domain.Enums;

// CommentTargetType: định nghĩa các giá trị trạng thái được phép.
public enum CommentTargetType { Article = 1, Video = 2 }
// CommentStatus: định nghĩa các giá trị trạng thái được phép.
public enum CommentStatus { Visible = 1, Hidden = 2, Removed = 3 }
// ReactionTargetType: định nghĩa các giá trị trạng thái được phép.
public enum ReactionTargetType { ArticleHelpful = 1, VideoLike = 2, CommentLike = 3 }
