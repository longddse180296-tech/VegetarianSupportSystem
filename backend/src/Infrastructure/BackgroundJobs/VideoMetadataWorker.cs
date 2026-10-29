// Bổ sung metadata video cũ theo lô nhỏ; lỗi công cụ không làm dừng API hoặc mất video.
using Application.Features.Videos;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundJobs;

public sealed class VideoMetadataWorker(IServiceScopeFactory scopes, ILogger<VideoMetadataWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<VideoMetadataService>().BackfillAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                // Không ghi đường dẫn tệp hoặc nội dung riêng tư ra log.
                logger.LogWarning("Chưa thể bổ sung metadata video ({ErrorType}); sẽ thử lại sau.", ex.GetType().Name);
            }
            try { await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}
