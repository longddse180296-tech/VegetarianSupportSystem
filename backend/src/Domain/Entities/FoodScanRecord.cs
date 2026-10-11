namespace Domain.Entities;

public sealed class FoodScanRecord
{
    private FoodScanRecord() { }
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string OwnerUserId { get; private set; } = string.Empty;
    public string SourceType { get; private set; } = string.Empty;
    public string InputJson { get; private set; } = string.Empty;
    public string ResultJson { get; private set; } = string.Empty;
    public string ProfileSnapshotJson { get; private set; } = string.Empty;
    public int ResultVersion { get; private set; } = 1;
    public Guid? PreviousScanId { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; } = DateTimeOffset.UtcNow;

    public static FoodScanRecord Create(string owner, string sourceType, string input,
        string result, string profile, Guid? previousScanId = null, int resultVersion = 1)
    {
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Owner required.");
        return new FoodScanRecord { OwnerUserId = owner, SourceType = sourceType,
            InputJson = input, ResultJson = result, ProfileSnapshotJson = profile,
            PreviousScanId = previousScanId, ResultVersion = resultVersion };
    }
}
