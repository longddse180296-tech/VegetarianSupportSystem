// Kiểm thử upload thật, âm thanh và snapshot trên database/tệp riêng; không dùng media người dùng.
using System.Net;
using System.Net.Http.Json;
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreDataChecks;

internal static class VideoMetadataApiChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, IServiceProvider services, Action<bool, string> check)
    {
        var fixtureRoot = Environment.GetEnvironmentVariable("VIDEO_METADATA_TEST_FIXTURES");
        if (string.IsNullOrEmpty(fixtureRoot))
        {
            Console.WriteLine("SKIP: real video metadata API checks need VIDEO_METADATA_TEST_FIXTURES (audio.mp4, silent.webm).");
            return;
        }
        var originalRole = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var roles) ? roles.ToArray() : [];
        var originalId = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var ids) ? ids.ToArray() : [];
        void Caller(string? id)
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
            if (id is null) return;
            client.DefaultRequestHeaders.Add("Test-Role", "User"); client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
        async Task<HttpResponseMessage> Upload(Guid id, byte[] bytes, string name)
        {
            using var form = new MultipartFormDataContent();
            form.Add(new ByteArrayContent(bytes), "file", name);
            return await client.PostAsync($"/api/me/videos/{id}/media", form);
        }
        try
        {
            Caller("video-metadata-owner");
            var create = await client.PostAsJsonAsync("/api/me/videos", new { title = "Video metadata test", description = "Integration test only", categoryId = (Guid?)null });
            var video = (await create.Content.ReadFromJsonAsync<VideoDetails>())!;
            check(create.StatusCode == HttpStatusCode.Created && video.DurationSeconds is null && video.MetadataStatus == "Unavailable", "new draft has no invented duration");
            var audioBytes = await File.ReadAllBytesAsync(Path.Combine(fixtureRoot, "audio.mp4"));
            Caller("other-video-owner");
            check((await Upload(video.Id, audioBytes, "audio.mp4")).StatusCode == HttpStatusCode.NotFound, "another owner cannot upload media");
            Caller("video-metadata-owner");
            var upload = await Upload(video.Id, audioBytes, "audio.mp4");
            check(upload.StatusCode == HttpStatusCode.OK, "real MP4 upload succeeds");
            var uploaded = (await upload.Content.ReadFromJsonAsync<VideoDetails>())!;
            check(uploaded.DurationSeconds is > 1.9 and < 2.2 && uploaded.HasAudio == true && uploaded.MetadataStatus == "Ready", "upload returns measured duration and audio stream");
            var entity = await db.Videos.AsNoTracking().SingleAsync(x => x.Id == video.Id);
            var oldKey = entity.MediaKey!;
            check(await db.VideoMediaMetadata.AsNoTracking().AnyAsync(x => x.MediaKey == oldKey && x.HasAudio == true), "duration persists in SQL by media key");
            var ownPage = await client.GetFromJsonAsync<VideoPage>("/api/me/videos");
            check(ownPage!.Items.Single(x => x.Id == video.Id).DurationSeconds == uploaded.DurationSeconds, "profile list receives persisted duration");
            Caller(null);
            check((await client.GetAsync($"/api/videos/{video.Id}")).StatusCode == HttpStatusCode.NotFound, "metadata does not publish private video");

            // Tạo snapshot công khai bằng nghiệp vụ Domain trong database test; upload nháp mới phải giữ bản cũ.
            db.ChangeTracker.Clear();
            var tracked = await db.Videos.SingleAsync(x => x.Id == video.Id);
            var submission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video, tracked.OwnerUserId,
                tracked.Title, tracked.Description, oldKey, DateTimeOffset.UtcNow);
            submission.Decide(ModerationDecisionType.Approve, "metadata-test-admin", "Test publication", DateTimeOffset.UtcNow);
            tracked.Publish(submission.Id);
            db.ModerationSubmissions.Add(submission);
            await db.SaveChangesAsync();
            Caller("video-metadata-owner");
            var silentBytes = await File.ReadAllBytesAsync(Path.Combine(fixtureRoot, "silent.webm"));
            var replace = await Upload(video.Id, silentBytes, "silent.webm");
            var replaced = (await replace.Content.ReadFromJsonAsync<VideoDetails>())!;
            check(replace.IsSuccessStatusCode && replaced.HasAudio == false && replaced.DurationSeconds is > 2.9 and < 3.2, "silent WEBM is valid and duration is measured");
            Caller(null);
            var publicVideo = await client.GetFromJsonAsync<VideoDetails>($"/api/videos/{video.Id}");
            check(publicVideo!.DurationSeconds == uploaded.DurationSeconds && publicVideo.HasAudio == true, "public snapshot keeps original duration and audio");
            var publicPage = await client.GetFromJsonAsync<VideoPage>("/api/videos?pageSize=100");
            check(publicPage!.Items.Single(x => x.Id == video.Id).DurationSeconds == uploaded.DurationSeconds, "public cards receive original duration");
            using var publicMedia = await client.GetAsync($"/api/videos/{video.Id}/media");
            check(publicMedia.IsSuccessStatusCode && (await publicMedia.Content.ReadAsByteArrayAsync()).SequenceEqual(audioBytes), "playback preserves original video and audio bytes");
            using var range = new HttpRequestMessage(HttpMethod.Get, $"/api/videos/{video.Id}/media");
            range.Headers.Range = new(0, 99);
            check((await client.SendAsync(range)).StatusCode == HttpStatusCode.PartialContent, "video playback still supports seeking via HTTP Range");
            Caller("video-metadata-owner");
            var configuration = services.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
            var mediaRoot = configuration["Storage:PrivateRoot"]!;
            var beforeRejectedUpload = Directory.GetFiles(mediaRoot).Length;
            check((await Upload(video.Id, audioBytes[..12], "broken.mp4")).StatusCode == HttpStatusCode.BadRequest, "fake MP4 header without playable video is rejected");
            check(Directory.GetFiles(mediaRoot).Length == beforeRejectedUpload, "rejected upload leaves no orphan media file");
            var originalProbe = configuration["VideoMetadata:FfprobePath"];
            try
            {
                configuration["VideoMetadata:FfprobePath"] = Path.Combine(fixtureRoot, "ffprobe-not-installed.exe");
                check((await Upload(video.Id, audioBytes, "audio.mp4")).StatusCode == HttpStatusCode.ServiceUnavailable, "unavailable probe returns retryable 503 instead of fake success");
                check(Directory.GetFiles(mediaRoot).Length == beforeRejectedUpload, "probe service failure preserves old media and cleans only the new file");
            }
            finally { configuration["VideoMetadata:FfprobePath"] = originalProbe; }

            // Xóa riêng metadata test rồi chạy backfill; tệp công khai và nháp đều được khôi phục chính xác.
            await db.VideoMediaMetadata.Where(x => x.MediaKey == oldKey).ExecuteDeleteAsync();
            await using var scope = services.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<VideoMetadataService>().BackfillAsync(default);
            var restored = await client.GetFromJsonAsync<VideoDetails>($"/api/videos/{video.Id}");
            check(restored!.DurationSeconds == uploaded.DurationSeconds && restored.HasAudio == true, "legacy published file gets metadata backfilled");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId");
            if (originalRole.Length > 0) client.DefaultRequestHeaders.Add("Test-Role", originalRole);
            if (originalId.Length > 0) client.DefaultRequestHeaders.Add("Test-UserId", originalId);
        }
    }
}
