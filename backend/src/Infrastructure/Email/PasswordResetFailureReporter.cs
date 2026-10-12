using Application.Features.Auth;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Email;

public sealed class PasswordResetFailureReporter(ILogger<PasswordResetFailureReporter> logger)
    : IPasswordResetFailureReporter
{
    public void EmailDeliveryFailed(string errorType) =>
        logger.LogError("Password reset email delivery failed ({ErrorType}).", errorType);
}
