// Chức năng: kết nối Gemini để phân tích nội dung. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Enums;

namespace Application.Abstractions.AI;

// The application depends on this contract; only Infrastructure may talk to Gemini.
// IGeminiService: định nghĩa hợp đồng xử lý giữa các tầng.
public interface IGeminiService
{
    // CheckContentAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<GeminiModerationResponse> CheckContentAsync(
        GeminiModerationRequest request,
        CancellationToken cancellationToken = default);

    // GenerateChatReplyAsync: Tạo kết quả dựa trên đầu vào và các ràng buộc đang áp dụng.
    Task<GeminiChatResponse> GenerateChatReplyAsync(
        GeminiChatRequest request,
        CancellationToken cancellationToken = default);

    // AnalyzeDishImageAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    Task<GeminiDishImageResponse> AnalyzeDishImageAsync(
        GeminiDishImageRequest request,
        CancellationToken cancellationToken = default);

    // ReadIngredientLabelAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    Task<GeminiLabelResponse> ReadIngredientLabelAsync(
        GeminiDishImageRequest request,
        CancellationToken cancellationToken = default);
}

// GeminiModerationRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiModerationRequest(
    ModeratedContentType ContentType,
    string Title,
    string Text,
    IReadOnlyList<string> MediaReferences);

// A status is deliberately absent when the provider has not completed a check.
// GeminiModerationResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiModerationResponse(
    bool IsAvailable,
    AiFlagStatus? AiFlagStatus,
    string? Summary,
    string? CheckedScope,
    string? UncheckedScope,
    string? ErrorCode = null,
    string? FlagReason = null,
    string? FlagType = null,
    string? Priority = null,
    string? Evidence = null);

// GeminiChatTurn: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiChatTurn(string Role, string Text);

// GeminiChatRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiChatRequest(
    string Prompt,
    IReadOnlyList<GeminiChatTurn> History,
    string? ProfileContext = null);

// GeminiChatResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiChatResponse(
    bool IsAvailable,
    string? Answer,
    string? ErrorCode = null);

// GeminiDishImageRequest: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiDishImageRequest(byte[] ImageBytes, string MimeType);

// GeminiDishImageResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiDishImageResponse(
    bool IsAvailable,
    string? SuggestedDishName,
    IReadOnlyList<string> VisibleIngredients,
    IReadOnlyList<string> UnknownFactors,
    IReadOnlyList<string> FollowUpQuestions,
    string? ErrorCode = null,
    IReadOnlyList<IngredientKind>? SuggestedIngredientKinds = null);

// GeminiLabelResponse: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiLabelResponse(bool IsAvailable, string? ExtractedText,
    bool IsIncomplete, string? ErrorCode = null,
    IReadOnlyList<GeminiLabelIngredient>? SuggestedIngredients = null);

// GeminiLabelIngredient: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record GeminiLabelIngredient(string Name, IngredientKind Kind);
