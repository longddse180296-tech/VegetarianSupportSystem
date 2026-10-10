using Application.Features.Comments;
using Domain.Entities;
using Domain.Enums;

namespace Domain.Tests;

public sealed class CommentServiceTests
{
    [Fact]
    public async Task ReplyRetainsParentWhenParentIsRemoved()
    {
        var repo = new MemoryComments();
        var service = new CommentService(repo, TimeProvider.System);
        var target = Guid.NewGuid();
        var root = await service.CreateAsync("owner", new(CommentTargetType.Article, target, null, "root"), default);
        var reply = await service.CreateAsync("other", new(CommentTargetType.Article, target, root.Id, "reply"), default);

        await service.DeleteAsync(root.Id, "owner", default);
        var page = await service.ListPublicAsync(new(CommentTargetType.Article, target), default);

        Assert.Equal(2, page.TotalCount);
        Assert.Null(page.Items.Single(x => x.Id == root.Id).Body);
        Assert.Equal(CommentStatus.Removed, page.Items.Single(x => x.Id == root.Id).Status);
        Assert.Equal(root.Id, page.Items.Single(x => x.Id == reply.Id).ParentId);
    }

    [Fact]
    public async Task OwnerAndAdminPermissionsAreSeparate()
    {
        var repo = new MemoryComments();
        var service = new CommentService(repo, TimeProvider.System);
        var comment = await service.CreateAsync("owner", new(CommentTargetType.Video, Guid.NewGuid(), null, "body"), default);

        Assert.Equal(CommentError.Forbidden, (await Assert.ThrowsAsync<CommentException>(
            () => service.EditAsync(comment.Id, "other", new("changed"), default))).Error);
        Assert.Equal(CommentError.Forbidden, (await Assert.ThrowsAsync<CommentException>(
            () => service.DeleteAsync(comment.Id, "other", default))).Error);
        var hidden = await service.ModerateAsync(comment.Id, "admin", CommentStatus.Hidden, "Spam", default);
        Assert.Equal(CommentStatus.Hidden, hidden.Status);
        Assert.Equal(CommentError.Conflict, (await Assert.ThrowsAsync<CommentException>(
            () => service.EditAsync(comment.Id, "owner", new("changed"), default))).Error);
    }

    [Fact]
    public async Task ReactionIsUniqueAndRemovalChangesStoredCount()
    {
        var repo = new MemoryComments();
        var service = new CommentService(repo, TimeProvider.System);
        var target = Guid.NewGuid();

        Assert.Equal(1, (await service.ReactionAsync("user", ReactionTargetType.ArticleHelpful, target, true, default)).Count);
        Assert.Equal(1, (await service.ReactionAsync("user", ReactionTargetType.ArticleHelpful, target, true, default)).Count);
        Assert.Equal(0, (await service.ReactionAsync("user", ReactionTargetType.ArticleHelpful, target, false, default)).Count);
        Assert.Equal(0, (await service.ReactionAsync("user", ReactionTargetType.ArticleHelpful, target, false, default)).Count);
    }

    [Fact]
    public async Task UnpublishedContentAndNestedRepliesAreRejected()
    {
        var repo = new MemoryComments();
        var service = new CommentService(repo, TimeProvider.System);
        var target = Guid.NewGuid();
        repo.Public = false;
        Assert.Equal(CommentError.NotFound, (await Assert.ThrowsAsync<CommentException>(
            () => service.CreateAsync("user", new(CommentTargetType.Article, target, null, "text"), default))).Error);
        Assert.Equal(CommentError.NotFound, (await Assert.ThrowsAsync<CommentException>(
            () => service.ReactionAsync("user", ReactionTargetType.ArticleHelpful, target, true, default))).Error);

        repo.Public = true;
        var root = await service.CreateAsync("user", new(CommentTargetType.Article, target, null, "root"), default);
        var reply = await service.CreateAsync("other", new(CommentTargetType.Article, target, root.Id, "reply"), default);
        Assert.Equal(CommentError.Validation, (await Assert.ThrowsAsync<CommentException>(
            () => service.CreateAsync("third", new(CommentTargetType.Article, target, reply.Id, "nested"), default))).Error);
    }

    private sealed class MemoryComments : ICommentRepository
    {
        private readonly List<Comment> comments = [];
        private readonly List<ContentReaction> reactions = [];
        public bool Public { get; set; } = true;

        public Task<bool> IsPublicTargetAsync(CommentTargetType type, Guid id, CancellationToken ct) => Task.FromResult(Public);
        public Task<Comment?> GetAsync(Guid id, CancellationToken ct) => Task.FromResult(comments.SingleOrDefault(x => x.Id == id));
        public Task<(IReadOnlyList<Comment> Items, int Total)> ListAsync(CommentQuery query, string? ownerId, bool admin, CancellationToken ct)
        {
            var result = comments.Where(x => (ownerId is null || x.AuthorId == ownerId) &&
                (query.TargetType is null || x.TargetType == query.TargetType) &&
                (query.TargetId is null || x.TargetId == query.TargetId) &&
                (admin || ownerId is not null || x.Status == CommentStatus.Visible ||
                 comments.Any(r => r.ParentId == x.Id && r.Status == CommentStatus.Visible))).ToArray();
            return Task.FromResult(((IReadOnlyList<Comment>)result, result.Length));
        }
        public Task<IReadOnlyDictionary<Guid, int>> LikeCountsAsync(IEnumerable<Guid> ids, CancellationToken ct) =>
            Task.FromResult((IReadOnlyDictionary<Guid, int>)ids.ToDictionary(x => x,
                x => reactions.Count(r => r.TargetType == ReactionTargetType.CommentLike && r.TargetId == x)));
        public Task<ContentReaction?> GetReactionAsync(string userId, ReactionTargetType type, Guid id, CancellationToken ct) =>
            Task.FromResult(reactions.SingleOrDefault(x => x.UserId == userId && x.TargetType == type && x.TargetId == id));
        public Task<ReactionResponse> ReactionStatusAsync(string? userId, ReactionTargetType type, Guid id, CancellationToken ct) =>
            Task.FromResult(new ReactionResponse(reactions.Count(x => x.TargetType == type && x.TargetId == id),
                reactions.Any(x => x.UserId == userId && x.TargetType == type && x.TargetId == id)));
        public void Add(Comment comment) => comments.Add(comment);
        public void Add(ContentReaction reaction) => reactions.Add(reaction);
        public void Remove(ContentReaction reaction) => reactions.Remove(reaction);
        public Task SaveAsync(CancellationToken ct) => Task.CompletedTask;
    }
}
