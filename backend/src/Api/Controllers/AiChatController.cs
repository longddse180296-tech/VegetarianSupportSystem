// Chức năng: hội thoại hỗ trợ ăn chay. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Security.Claims;
using System.Text.Json;
using Application.Features.AiChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// AiChatController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/ai-chat")]
public sealed class AiChatController(
    AiChatService chatService,
    AiChatGuestService guestChatService) : ControllerBase
{
    private const int MaxPromptLength = 4000;
    private const string GuestSessionKey = "AiChat.GuestState.v1";

    // CreateConversation: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPost("conversations")]
    [Authorize]
    public async Task<ActionResult<AiChatConversationDto>> CreateConversation(
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (userId is null)
        {
            return Unauthorized();
        }

        var conversation = await chatService.CreateConversationAsync(userId, cancellationToken);
        return CreatedAtAction(
            nameof(GetConversation),
            new { conversationId = conversation.Id },
            conversation);
    }

    // ListConversations: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("conversations")]
    [Authorize]
    public async Task<ActionResult<AiChatPage<AiChatConversationDto>>> ListConversations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = CurrentUserId();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (userId is null)
        {
            return Unauthorized();
        }

        if (!IsValidPaging(page, pageSize))
        {
            return InvalidPaging();
        }

        return Ok(await chatService.ListConversationsAsync(
            userId, page, pageSize, cancellationToken));
    }

    // GetConversation: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("conversations/{conversationId:guid}")]
    [Authorize]
    public async Task<ActionResult<AiChatConversationDto>> GetConversation(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (userId is null)
        {
            return Unauthorized();
        }

        var conversation = await chatService.GetConversationAsync(
            conversationId, userId, cancellationToken);
        return conversation is null ? NotFound() : Ok(conversation);
    }

    // ListMessages: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("conversations/{conversationId:guid}/messages")]
    [Authorize]
    public async Task<ActionResult<AiChatPage<AiChatMessageDto>>> ListMessages(
        Guid conversationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = CurrentUserId();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (userId is null)
        {
            return Unauthorized();
        }

        if (!IsValidPaging(page, pageSize))
        {
            return InvalidPaging();
        }

        var messages = await chatService.ListMessagesAsync(
            conversationId, userId, page, pageSize, cancellationToken);
        return messages is null ? NotFound() : Ok(messages);
    }

    // SubmitMessage: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    [HttpPost("conversations/{conversationId:guid}/messages")]
    [Authorize]
    public async Task<ActionResult<AiChatSubmissionDto>> SubmitMessage(
        Guid conversationId,
        [FromBody] AiChatMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (userId is null)
        {
            return Unauthorized();
        }

        if (!TryNormalizePrompt(request.Content, out var content))
        {
            return InvalidPrompt();
        }

        var submission = await chatService.SubmitMessageAsync(
            conversationId, userId, content, cancellationToken);
        return submission is null ? NotFound() : Ok(submission);
    }

    // GetGuestSession: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet("guest/session")]
    [AllowAnonymous]
    public ActionResult<AiChatGuestSessionInfo> GetGuestSession()
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (User.Identity?.IsAuthenticated == true) return Forbid();
        return Ok(guestChatService.GetSessionInfo(ReadGuestState()));
    }

    // SubmitGuestMessage: Chuyển bản nội dung hợp lệ sang quy trình gửi duyệt.
    [HttpPost("guest/messages")]
    [AllowAnonymous]
    public async Task<ActionResult<GuestChatResponse>> SubmitGuestMessage(
        [FromBody] AiChatMessageRequest request,
        CancellationToken cancellationToken)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (User.Identity?.IsAuthenticated == true) return Forbid();
        if (!TryNormalizePrompt(request.Content, out var content))
        {
            return InvalidPrompt();
        }

        var result = await guestChatService.SubmitAsync(
            ReadGuestState(), content, cancellationToken);
        if (result.Status == AiChatGuestAnswerStatus.Answered)
        {
            HttpContext.Session.SetString(
                GuestSessionKey, JsonSerializer.Serialize(result.State));
        }

        var response = new GuestChatResponse(
            result.Status.ToString(), result.Answer, result.RemainingQuestions);
        return result.Status switch
        {
            AiChatGuestAnswerStatus.LimitReached =>
                StatusCode(StatusCodes.Status429TooManyRequests, response),
            AiChatGuestAnswerStatus.Unavailable =>
                StatusCode(StatusCodes.Status503ServiceUnavailable, response),
            _ => Ok(response)
        };
    }

    // CurrentUserId: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private string? CurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                     User.FindFirstValue("sub");
        return string.IsNullOrWhiteSpace(userId) || userId.Length > 450
            ? null
            : userId;
    }

    // ReadGuestState: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    private AiChatGuestState ReadGuestState()
    {
        var json = HttpContext.Session.GetString(GuestSessionKey);
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (json is null)
        {
            return new AiChatGuestState();
        }

        try
        {
            return guestChatService.NormalizeState(
                JsonSerializer.Deserialize<AiChatGuestState>(json));
        }
        catch (JsonException)
        {
            // Treat a damaged server-side session value as an empty guest session.
        }

        return new AiChatGuestState();
    }

    // TryNormalizePrompt: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private static bool TryNormalizePrompt(string? value, out string content)
    {
        content = value?.Trim() ?? string.Empty;
        return content.Length is >= 1 and <= MaxPromptLength;
    }

    // IsValidPaging: Đánh giá điều kiện nghiệp vụ để quyết định nhánh xử lý.
    private static bool IsValidPaging(int page, int pageSize) =>
        page >= 1 &&
        pageSize is >= 1 and <= 100 &&
        (long)(page - 1) * pageSize <= int.MaxValue;

    // InvalidPrompt: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ActionResult InvalidPrompt()
    {
        ModelState.AddModelError(nameof(AiChatMessageRequest.Content),
            $"Content must contain 1 to {MaxPromptLength} characters.");
        return ValidationProblem(ModelState);
    }

    // InvalidPaging: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ActionResult InvalidPaging()
    {
        ModelState.AddModelError("pagination", "Page must be positive and pageSize must be between 1 and 100.");
        return ValidationProblem(ModelState);
    }

    // AiChatMessageRequest: định nghĩa dữ liệu trao đổi của tính năng.
    public sealed record AiChatMessageRequest(string? Content);

    // GuestChatResponse: định nghĩa dữ liệu trao đổi của tính năng.
    public sealed record GuestChatResponse(
        string Status,
        string? Answer,
        int RemainingQuestions);
}
