// Kiểm tra ảnh/thời lượng video đã lưu lấy từ phiên bản công khai, không dùng bản nháp đang sửa.
using System.Net.Http.Json;
using Application.Features.Favorites;
using Application.Features.Videos;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;
namespace CoreDataChecks;
internal static class FavoriteVideoChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, IServiceProvider services, Action<bool,string> check)
    {
        var store = services.GetRequiredService<IPrivateMediaStore>();
        var bytes = await File.ReadAllBytesAsync(Path.Combine(AppContext.BaseDirectory,"Fixtures","Moderation","cooking-cover.png"));
        var thumbnail = await store.SaveAsync(new MemoryStream(bytes),"png",10*1024*1024,default);
        var video = Video.Create("saved-video-owner","Video công khai","Hướng dẫn nấu rau",null);
        video.SetMedia("published-test.mp4"); video.SetThumbnail(thumbnail);
        var submission = ModerationSubmission.Submit(video.Id,1,ModeratedContentType.Video,video.OwnerUserId,video.Title,video.Description,video.MediaKey,DateTimeOffset.UtcNow);
        submission.Decide(ModerationDecisionType.Approve,"test-admin","Đã xem",DateTimeOffset.UtcNow);
        video.Publish(submission.Id);
        db.Videos.Add(video); db.ModerationSubmissions.Add(submission);
        db.VideoMediaMetadata.Add(VideoMediaMetadata.Create("published-test.mp4",26.52,false));
        await db.SaveChangesAsync();
        video.SetMedia("draft-new.mp4"); video.SetThumbnail("unpublished.png");
        db.VideoMediaMetadata.Add(VideoMediaMetadata.Create("draft-new.mp4",99,true));
        await db.SaveChangesAsync();
        client.DefaultRequestHeaders.Add("Test-Role","User"); client.DefaultRequestHeaders.Add("Test-UserId","saved-video-viewer");
        var response = await client.PostAsJsonAsync("/api/favorites",new FavoriteRequest {TargetType=FavoriteTargetType.Video,TargetId=video.Id});
        check(response.IsSuccessStatusCode,"save published video succeeds");
        var saved = (await response.Content.ReadFromJsonAsync<FavoriteResponse>())!;
        check(string.Equals(saved.ImageUrl, $"/api/videos/{video.Id}/thumbnail", StringComparison.OrdinalIgnoreCase) && saved.DurationSeconds is > 26.51 and < 26.53,"save returns published thumbnail and real duration");
        var page = (await client.GetFromJsonAsync<FavoritePage>("/api/favorites?targetType=Video"))!;
        check(page.Items.Single().ImageUrl == saved.ImageUrl && page.Items.Single().DurationSeconds is > 26.51 and < 26.53,"saved list does not expose draft metadata");
        var image = await client.GetAsync(saved.ImageUrl);
        check(image.IsSuccessStatusCode && (await image.Content.ReadAsByteArrayAsync()).SequenceEqual(bytes),"thumbnail endpoint serves correct published image");
        submission.Decide(ModerationDecisionType.Remove,"test-admin","Gỡ test",DateTimeOffset.UtcNow);
        await db.SaveChangesAsync();
        check((await client.GetFromJsonAsync<FavoritePage>("/api/favorites?targetType=Video"))!.TotalCount==0,"removed video no longer appears in favorites");
    }
}
