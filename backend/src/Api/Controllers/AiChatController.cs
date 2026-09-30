using System.Security.Claims;
using System.Text.Json;
using Application.Features.AiChat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/ai-chat")]
public sealed class AiChatController(
    AiChatService chatService,
    AiChatGuestService guestChatService) : ControllerBase
{
    private const int MaxPromptLength = 4000;
    private const string GuestSessionKey = "AiChat.GuestState.v1";

    [HttpPost("conversations")]
    [Authorize]
    public async Task<ActionResult<AiChatConversationDto>> CreateConversation(
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
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

    [HttpGet("conversations")]
    [Authorize]
    public async Task<ActionResult<AiChatPage<AiChatConversationDto>>> ListConversations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = CurrentUserId();
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

    [HttpGet("conversations/{conversationId:guid}")]
    [Authorize]
    public async Task<ActionResult<AiChatConversationDto>> GetConversation(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var conversation = await chatService.GetConversationAsync(
            conversationId, userId, cancellationToken);
        return conversation is null ? NotFound() : Ok(conversation);
    }

    [HttpGet("conversations/{conversationId:guid}/messages")]
    [Authorize]
    public async Task<ActionResult<AiChatPage<AiChatMessageDto>>> ListMessages(
        Guid conversationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = CurrentUserId();
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

    [HttpPost("conversations/{conversationId:guid}/messages")]
    [Authorize]
    public async Task<ActionResult<AiChatSubmissionDto>> SubmitMessage(
        Guid conversationId,
        [FromBody] AiChatMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = CurrentUserId();
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

    [HttpGet("guest/session")]
    [AllowAnonymous]
    public ActionResult<AiChatGuestSessionInfo> GetGuestSession()
    {
        return Ok(guestChatService.GetSessionInfo(ReadGuestState()));
    }

    [HttpPost("guest/messages")]
    [AllowAnonymous]
    public async Task<ActionResult<GuestChatResponse>> SubmitGuestMessage(
        [FromBody] AiChatMessageRequest request,
        CancellationToken cancellationToken)
    {
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

    private string? CurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                     User.FindFirstValue("sub");
        return string.IsNullOrWhiteSpace(userId) || userId.Length > 450
            ? null
            : userId;
    }

    private AiChatGuestState ReadGuestState()
    {
        var json = HttpContext.Session.GetString(GuestSessionKey);
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

    private static bool TryNormalizePrompt(string? value, out string content)
    {
        content = value?.Trim() ?? string.Empty;
        return content.Length is >= 1 and <= MaxPromptLength;
    }

    private static bool IsValidPaging(int page, int pageSize) =>
        page >= 1 &&
        pageSize is >= 1 and <= 100 &&
        (long)(page - 1) * pageSize <= int.MaxValue;

    private ActionResult InvalidPrompt()
    {
        ModelState.AddModelError(nameof(AiChatMessageRequest.Content),
            $"Content must contain 1 to {MaxPromptLength} characters.");
        return ValidationProblem(ModelState);
    }

    private ActionResult InvalidPaging()
    {
        ModelState.AddModelError("pagination", "Page must be positive and pageSize must be between 1 and 100.");
        return ValidationProblem(ModelState);
    }

    public sealed record AiChatMessageRequest(string? Content);

    public sealed record GuestChatResponse(
        string Status,
        string? Answer,
        int RemainingQuestions);
}
