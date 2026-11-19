using System.Net;
using System.Net.Http.Json;
using Application.Features.Administration;
using Application.Features.Comments;
using Application.Features.Recipes;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence;

namespace CoreDataChecks;

internal static class HomePopularityChecks
{
    public static async Task RunAsync(HttpClient client, AppDbContext db, Action<bool, string> check)
    {
        var now = DateTimeOffset.UtcNow;
        const string owner = "popularity-comment-owner";
        void Favorites(FavoriteTargetType type, Guid id, int count)
        {
            for (var i = 0; i < count; i++) db.Favorites.Add(new Favorite { UserId = "popularity-voter-" + i, TargetType = type, TargetId = id });
        }
        var category = new Category { Name = "Popularity fixtures" };
        var recipes = new[] { "Z popularity top", "Y popularity top", "A popularity lower", "Hidden popularity" }.Select(name =>
            new Recipe { Name = name, Category = category, Servings = 1, IsActive = !name.StartsWith("Hidden") }).ToArray();
        var restaurants = new[] { "Z popularity top", "Y popularity top", "A popularity lower", "Hidden popularity" }.Select(name =>
            new Restaurant { Name = name, IsActive = !name.StartsWith("Hidden") }).ToArray();
        for (var i = 0; i < 4; i++)
        {
            Favorites(FavoriteTargetType.Recipe, recipes[i].Id, i == 3 ? 20 : i < 2 ? 10 : 9);
            Favorites(FavoriteTargetType.Restaurant, restaurants[i].Id, i == 3 ? 20 : i < 2 ? 10 : 9);
        }
        db.Recipes.AddRange(recipes); db.Restaurants.AddRange(restaurants);
        var videos = Enumerable.Range(0, 6).Select(i => Video.Create(owner, "Popularity video " + i, "Test content", null)).ToArray();
        var comments = new List<Comment>();
        for (var i = 0; i < videos.Length; i++)
        {
            var video = videos[i];
            if (i != 5)
            {
                var submission = ModerationSubmission.Submit(video.Id, 1, ModeratedContentType.Video, owner, video.Title, video.Description, "test.mp4", now);
                submission.Decide(ModerationDecisionType.Approve, "test-admin", "Published test", now);
                video.Publish(submission.Id); db.ModerationSubmissions.Add(submission);
            }
            var favoriteCount = i == 5 ? 20 : i <= 3 ? 10 : 9;
            Favorites(FavoriteTargetType.Video, video.Id, favoriteCount);
            var commentCount = i <= 2 ? 2 : i == 3 ? 1 : 5;
            for (var c = 0; c < commentCount; c++) comments.Add(new Comment(CommentTargetType.Video, video.Id, null, owner, "Visible test", now));
            for (var view = 0; view < (i < 2 ? 5 : i == 2 ? 3 : 100); view++) video.CountView();
        }
        // Ẩn/gỡ không được nâng điểm; like bình luận cũng không phải lượt yêu thích nội dung.
        for (var i = 0; i < 15; i++)
        {
            var hidden = new Comment(CommentTargetType.Video, videos[3].Id, null, owner, "Hidden test", now);
            hidden.Moderate(CommentStatus.Hidden, "test-admin", "Test hide", now); comments.Add(hidden);
        }
        db.Comments.AddRange(comments); db.Videos.AddRange(videos);
        var articles = Enumerable.Range(0, 3).Select(i => new Article(owner, "Popularity article " + i, "Approved test content", "Health", null, now.AddMinutes(i))).ToArray();
        for (var i = 0; i < articles.Length; i++)
        {
            var article = articles[i];
            var submission = ModerationSubmission.Submit(article.Id, 1, ModeratedContentType.Article, owner, article.DraftTitle, article.DraftContent, null, now.AddMinutes(i));
            submission.RecordAiResult(AiFlagStatus.Passed, "Test", "Test", null, now);
            submission.Decide(ModerationDecisionType.Approve, "test-admin", "Published test", now);
            article.LinkSubmission(submission, now.AddMinutes(i));
            Favorites(FavoriteTargetType.Article, article.Id, i < 2 ? 10 : 9);
            db.Comments.Add(new Comment(CommentTargetType.Article, article.Id, null, owner, "Visible article test", now));
        }
        db.Articles.AddRange(articles); await db.SaveChangesAsync();
        var recipePage = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?rankByPopularity=true&pageSize=2"))!;
        check(recipePage.Items.Select(item => item.Id).SequenceEqual(new[] { recipes[1].Id, recipes[0].Id }),
            "home recipes rank favorites before taking the page; ties retain name ordering and exclude inactive recipes");
        var recipeNext = (await client.GetFromJsonAsync<RecipePage>("/api/recipes?rankByPopularity=true&pageSize=2&pageNumber=2"))!;
        check(recipeNext.Items[0].Id == recipes[2].Id, "lower-scoring recipe follows both tied leaders on the next page");
        async Task<FeaturedContentPage> Popular(string type, int page = 1, int size = 3) =>
            (await client.GetFromJsonAsync<FeaturedContentPage>($"/api/featured-content?contentType={type}&rankByPopularity=true&page={page}&pageSize={size}"))!;
        var restaurantPage = await Popular("Restaurant");
        check(restaurantPage.Items.Select(item => item.Id).SequenceEqual(new[] { restaurants[1].Id, restaurants[0].Id, restaurants[2].Id }),
            "home restaurants rank unpinned public data by favorites then the default name order");
        var articlePage = await Popular("Article");
        check(articlePage.Items.Select(item => item.Id).SequenceEqual(new[] { articles[1].Id, articles[0].Id, articles[2].Id }),
            "home articles break full metric ties using newest public version order");
        var videoPage = await Popular("Video", size: 5);
        var tiedVideos = videos.Take(2).OrderByDescending(video => video.CreatedAtUtc).ThenBy(video => video.Id).Select(video => video.Id);
        check(videoPage.Items.Select(item => item.Id).SequenceEqual(tiedVideos.Concat(new[] { videos[2].Id, videos[3].Id, videos[4].Id })),
            "home video order is favorites then visible comments then views then default order; private and hidden data cannot outrank public content");
        var smallVideoPage = await Popular("Video", page: 2, size: 2);
        check(smallVideoPage.Items.Select(item => item.Id).SequenceEqual(new[] { videos[2].Id, videos[3].Id }),
            "popularity sorting applies across pages rather than only the displayed slice");

        var originalRoles = client.DefaultRequestHeaders.TryGetValues("Test-Role", out var roles) ? roles.ToArray() : [];
        var originalUsers = client.DefaultRequestHeaders.TryGetValues("Test-UserId", out var users) ? users.ToArray() : [];
        void Caller(string role, string id) { client.DefaultRequestHeaders.Remove("Test-Role"); client.DefaultRequestHeaders.Remove("Test-UserId"); client.DefaultRequestHeaders.Add("Test-Role", role); client.DefaultRequestHeaders.Add("Test-UserId", id); }
        try
        {
            var target = comments.First(item => item.Status == CommentStatus.Visible);
            Caller("User", "another-owner");
            check((await client.DeleteAsync($"/api/comments/{target.Id}")).StatusCode == HttpStatusCode.Forbidden,
                "other users cannot remove a video comment");
            Caller("Admin", "test-admin");
            check((await client.PostAsJsonAsync($"/api/admin/comments/{target.Id}/hide", new { reason = "Hide test" })).IsSuccessStatusCode,
                "admin can hide video comment");
            Caller("User", owner);
            check((await client.DeleteAsync($"/api/comments/{target.Id}")).StatusCode == HttpStatusCode.NoContent &&
                (await client.DeleteAsync($"/api/comments/{target.Id}")).StatusCode == HttpStatusCode.NoContent,
                "owner can remove a hidden video comment and repeated removal is safe");
            var visible = comments.First(item => item.Status == CommentStatus.Visible && item.Id != target.Id);
            check((await client.DeleteAsync($"/api/comments/{visible.Id}")).StatusCode == HttpStatusCode.NoContent &&
                (await client.GetAsync($"/api/comments/{visible.Id}")).StatusCode == HttpStatusCode.NotFound,
                "owner removal persists and video comment disappears publicly");
        }
        finally
        {
            client.DefaultRequestHeaders.Remove("Test-Role"); foreach (var role in originalRoles) client.DefaultRequestHeaders.Add("Test-Role", role);
            client.DefaultRequestHeaders.Remove("Test-UserId"); foreach (var id in originalUsers) client.DefaultRequestHeaders.Add("Test-UserId", id);
        }
    }
}
