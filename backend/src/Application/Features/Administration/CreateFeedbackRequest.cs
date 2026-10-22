namespace Application.Features.Administration;

public sealed record CreateFeedbackRequest(string? Name, string? Email, string? Subject, string? Message);
