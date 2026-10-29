// Chức năng: kiểm duyệt nội dung và kết quả kiểm tra AI. Tầng Infrastructure thực hiện truy vấn, lưu trữ hoặc giao tiếp dịch vụ ngoài.
using Application.Abstractions.AI;
using Application.Features.Moderation;
using Domain.Enums;
using Infrastructure.AI.Gemini;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundJobs;

// A database-backed queue: Checking submissions survive a process restart.
// ModerationAiWorker: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
public sealed class ModerationAiWorker(IServiceScopeFactory scopes, ILogger<ModerationAiWorker> logger)
    : BackgroundService
{
    // ExecuteAsync: Chạy xử lý nền theo vòng đời ứng dụng và dừng theo tín hiệu hủy.
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

    // ProcessBatchAsync: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
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
                // Chỉ ghi mã lỗi kỹ thuật; không ghi nội dung bài viết hoặc khóa truy cập vào log.
                if (status == AiFlagStatus.Failed)
                    logger.LogWarning("AI moderation unavailable for submission {SubmissionId}: {ErrorCode}", id, result.ErrorCode);
                await moderation.RecordAiResultAsync(id, new ModerationAiResult(
                    status,
                    status == AiFlagStatus.Failed ? ModerationFailureMessage.For(result.ErrorCode) :
                        (result.Summary ?? "Hệ thống đã kiểm tra phạm vi được ghi nhận."),
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
                        AiFlagStatus.Failed, "Hệ thống hiện không thể kiểm tra nội dung. Quản trị viên cần xem trực tiếp toàn bộ bài viết.",
                        null, null, null), cancellationToken);
                }
                catch (ModerationException) { }
            }
        }
    }
}
