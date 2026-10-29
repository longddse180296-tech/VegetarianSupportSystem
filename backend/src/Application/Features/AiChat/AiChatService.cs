// Chức năng: hội thoại hỗ trợ ăn chay. Tầng Application điều phối nghiệp vụ, kiểm tra dữ liệu và định nghĩa hợp đồng với hạ tầng.
using Domain.Entities;
using Domain.Enums;

namespace Application.Features.AiChat;

// AiChatService: điều phối các bước nghiệp vụ và xử lý kết quả cho bên gọi.
public sealed class AiChatService(
    IAiChatRepository repository,
    IAiChatAnswerService answerService,
    IAiChatContextRepository contextRepository)
{
    private const int HistoryLimit = 20;

    // CreateConversationAsync: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    public async Task<AiChatConversationDto> CreateConversationAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        var conversation = await repository.CreateConversationAsync(userId, cancellationToken);
        return ToDto(conversation);
    }

    // GetConversationAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<AiChatConversationDto?> GetConversationAsync(
        Guid conversationId,
        string userId,
        CancellationToken cancellationToken)
    {
        var conversation = await repository.GetConversationForUserAsync(
            conversationId, userId, cancellationToken);
        return conversation is null ? null : ToDto(conversation);
    }

    // ListConversationsAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<AiChatPage<AiChatConversationDto>> ListConversationsAsync(
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var result = await repository.ListConversationsForUserAsync(
            userId, page, pageSize, cancellationToken);
        return new AiChatPage<AiChatConversationDto>(
            result.Items.Select(ToDto).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    // ListMessagesAsync: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    public async Task<AiChatPage<AiChatMessageDto>?> ListMessagesAsync(
        Guid conversationId,
        string userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.GetConversationForUserAsync(
                conversationId, userId, cancellationToken) is null)
        {
            return null;
        }

        var result = await repository.ListMessagesAsync(
            conversationId, page, pageSize, cancellationToken);
        return new AiChatPage<AiChatMessageDto>(
            result.Items.Select(ToDto).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount);
    }

    // SubmitMessageAsync: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    public async Task<AiChatSubmissionDto?> SubmitMessageAsync(
        Guid conversationId,
        string userId,
        string content,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (await repository.GetConversationForUserAsync(
                conversationId, userId, cancellationToken) is null)
        {
            return null;
        }

        var history = await repository.GetRecentMessagesAsync(
            conversationId, HistoryLimit, cancellationToken);
        var userMessage = await repository.AddMessageAsync(
            conversationId, AiChatMessageRole.User, content, cancellationToken);

        var turns = history
            .Select(message => new AiChatTurn(message.Role, message.Content))
            .ToArray();
        var profileContext = await contextRepository.GetProfileContextAsync(userId, cancellationToken);
        var answer = await answerService.GenerateAsync(content, turns, cancellationToken, profileContext);

        if (!answer.IsAvailable || string.IsNullOrWhiteSpace(answer.Answer))
        {
            return new AiChatSubmissionDto(
                ToDto(userMessage), null, AiChatAnswerStatus.Unavailable, []);
        }

        var assistantMessage = await repository.AddMessageAsync(
            conversationId,
            AiChatMessageRole.Assistant,
            answer.Answer.Trim(),
            cancellationToken);

        var recipes = content.Contains("công thức", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("món", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("gợi ý", StringComparison.OrdinalIgnoreCase)
            ? await contextRepository.GetActiveRecipesAsync(cancellationToken) : [];
        return new AiChatSubmissionDto(
            ToDto(userMessage), ToDto(assistantMessage), AiChatAnswerStatus.Answered, recipes);
    }

    // ToDto: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static AiChatConversationDto ToDto(AiChatConversation conversation) =>
        new(conversation.Id, conversation.CreatedAtUtc, conversation.UpdatedAtUtc);

    // ToDto: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static AiChatMessageDto ToDto(AiChatMessage message) =>
        new(message.Id, message.ConversationId, message.Role, message.Content, message.CreatedAtUtc);
}
