// Kiểm thử metadata không đoán thời lượng, phân biệt không âm thanh và không đọc được tệp.
using Application.Features.Videos;
using Domain.Entities;
using Infrastructure.Storage;

namespace Domain.Tests;

public sealed class VideoMetadataTests
{
    [Theory]
    [InlineData("{\"format\":{\"duration\":\"3.25\"},\"streams\":[{\"codec_type\":\"video\"},{\"codec_type\":\"audio\"}]}", 3.25, true)]
    [InlineData("{\"streams\":[{\"codec_type\":\"video\",\"duration\":\"10.5\"}]}", 10.5, false)]
    public void ParsesRealDurationAndAudio(string json, double seconds, bool audio)
    {
        var result = FfprobeVideoMediaProbe.Parse(json);
        Assert.NotNull(result);
        Assert.Equal(seconds, result.DurationSeconds);
        Assert.Equal(audio, result.HasAudio);
    }

    [Theory]
    [InlineData("garbage")]
    [InlineData("{}")]
    [InlineData("{\"format\":{\"duration\":\"20\"},\"streams\":[{\"codec_type\":\"audio\"}]}")]
    [InlineData("{\"format\":{\"duration\":\"NaN\"},\"streams\":[{\"codec_type\":\"video\"}]}")]
    [InlineData("{\"format\":{\"duration\":\"0\"},\"streams\":[{\"codec_type\":\"video\"}]}")]
    public void MissingInvalidOrAudioOnlyHasNoDuration(string json) => Assert.Null(FfprobeVideoMediaProbe.Parse(json));

    [Fact]
    public async Task InvalidUploadDoesNotSaveInventedMetadata()
    {
        var repository = new TestVideoMetadataRepository();
        var service = new VideoMetadataService(repository, new TestVideoMediaProbe());
        await Assert.ThrowsAsync<ArgumentException>(() => service.InspectUploadAsync("bad.mp4", default));
        Assert.Empty(repository.Items);
    }

    [Fact]
    public async Task ValidUploadSavesDurationAndSilentFlag()
    {
        var repository = new TestVideoMetadataRepository();
        var service = new VideoMetadataService(repository, new TestVideoMediaProbe(new(2.5, false)));
        await service.InspectUploadAsync("silent.mp4", default);
        var item = await service.GetAsync("silent.mp4", default);
        Assert.Equal(2.5, item!.DurationSeconds);
        Assert.False(item.HasAudio);
    }

    [Fact]
    public async Task BackfillMissingFileStoresUnknownRatherThanZero()
    {
        var repository = new TestVideoMetadataRepository();
        var service = new VideoMetadataService(repository, new TestVideoMediaProbe());
        await service.BackfillAsync(default);
        var item = Assert.Single(repository.Items.Values);
        Assert.Null(item.DurationSeconds);
        Assert.Null(item.HasAudio);
    }
}

internal sealed class TestVideoMetadataRepository : IVideoMetadataRepository
{
    public Dictionary<string, VideoMediaMetadata> Items { get; } = [];
    public Task<VideoMediaMetadata?> GetAsync(string key, CancellationToken ct) => Task.FromResult(Items.GetValueOrDefault(key));
    public Task SaveAsync(VideoMediaMetadata metadata, CancellationToken ct) { Items[metadata.MediaKey] = metadata; return Task.CompletedTask; }
    public Task<IReadOnlyList<string>> PendingKeysAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<string>>(["old.mp4"]);
}

internal sealed class TestVideoMediaProbe(VideoMediaInfo? result = null) : IVideoMediaProbe
{
    public Task<VideoMediaInfo?> ReadAsync(string key, CancellationToken ct) => Task.FromResult(result);
}
