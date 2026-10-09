using Application.Abstractions.AI;
using Application.Features.Moderation;
using Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundJobs;

// A database-backed queue: Checking submissions survive a process restart.
public sealed class ModerationAiWorker(IServiceScopeFactory scopes, ILogger<ModerationAiWorker> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
        do
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Moderation worker batch failed.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IModerationRepository>();
        var ids = await repository.GetCheckingIdsAsync(10, cancellationToken);
        foreach (var id in ids)
        {
            using var itemScope = scopes.CreateScope();
            var itemRepository = itemScope.ServiceProvider.GetRequiredService<IModerationRepository>();
            var submission = await itemRepository.GetByIdAsync(id, cancellationToken);
            if (submission?.AiFlagStatus != AiFlagStatus.Checking) continue;
            var latest = await itemRepository.GetLatestForContentAsync(submission.ContentId, cancellationToken);
            if (latest?.Id != id) continue;

            var ai = itemScope.ServiceProvider.GetRequiredService<IGeminiService>();
            var moderation = itemScope.ServiceProvider.GetRequiredService<ModerationService>();
            try
            {
                var result = await ai.CheckContentAsync(new(
                    submission.ContentType, submission.Title, submission.TextContent,
                    submission.MediaReference is null ? [] : [submission.MediaReference]), cancellationToken);
                var status = result.IsAvailable && result.AiFlagStatus is { } validStatus
                    ? validStatus : AiFlagStatus.Failed;
                await moderation.RecordAiResultAsync(id, new ModerationAiResult(
                    status,
                    status == AiFlagStatus.Failed ? "AI hiện không thể kiểm tra nội dung. Hãy thử lại sau." :
                        (result.Summary ?? "AI đã kiểm tra phạm vi được ghi nhận."),
                    status == AiFlagStatus.Failed ? null : result.CheckedScope,
                    status == AiFlagStatus.Partial ? result.UncheckedScope : null,
                    status is AiFlagStatus.Flagged or AiFlagStatus.Partial ? result.FlagReason : null,
                    result.FlagType, result.Priority, result.Evidence), cancellationToken);
            }
            catch (ModerationException exception) when (exception.Error == ModerationError.Conflict)
            {
                // A retry, version change, or another worker already completed this submission.
            }
            catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogError(exception, "AI check failed for submission {SubmissionId}", id);
                try
                {
                    await moderation.RecordAiResultAsync(id, new ModerationAiResult(
                        AiFlagStatus.Failed, "AI hiện không thể kiểm tra nội dung. Hãy thử lại sau.",
                        null, null, null), cancellationToken);
                }
                catch (ModerationException) { }
            }
        }
    }
}
