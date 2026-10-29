// Xác minh sắp xếp gần nhất ở server trước phân trang; thiếu tọa độ không bị hiểu là cách 0 km.
using Application.Features.Restaurants;
using Domain.Entities;

namespace Domain.Tests;

public sealed class RestaurantDistanceTests
{
    private readonly Restaurant[] restaurants = [
        new() { Name = "A thiếu tọa độ", Address = "Unknown" },
        new() { Name = "B phía đông", Address = "East", Latitude = 10, Longitude = 106.1m },
        new() { Name = "Z gần nhất", Address = "Here", Latitude = 10, Longitude = 106 }
    ];

    [Fact]
    public async Task SortsNearestBeforePaginationAndUnknownLast()
    {
        var service = new RestaurantService(new Repository(restaurants));
        var first = await service.ListAsync(new() { Latitude = 10, Longitude = 106, PageSize = 1 }, false, default);
        Assert.Equal("Z gần nhất", Assert.Single(first.Items).Name);
        Assert.Equal(0m, first.Items[0].DistanceKm);
        Assert.Equal(10m, first.Items[0].Latitude);
        Assert.Equal(106m, first.Items[0].Longitude);
        var last = await service.ListAsync(new() { Latitude = 10, Longitude = 106, PageSize = 1, PageNumber = 3 }, false, default);
        Assert.Equal("A thiếu tọa độ", Assert.Single(last.Items).Name);
        Assert.Null(last.Items[0].DistanceKm);
    }

    [Fact]
    public async Task ChangingLocationChangesNearestRestaurant()
    {
        var service = new RestaurantService(new Repository(restaurants));
        var result = await service.ListAsync(new() { Latitude = 10, Longitude = 106.1m }, false, default);
        Assert.Equal("B phía đông", result.Items[0].Name);
        Assert.Equal(0m, result.Items[0].DistanceKm);
    }

    [Fact]
    public async Task NoPositionDoesNotInventDistancesAndRadiusExcludesUnknown()
    {
        var service = new RestaurantService(new Repository(restaurants));
        var withoutPosition = await service.ListAsync(new(), false, default);
        Assert.All(withoutPosition.Items, item => Assert.Null(item.DistanceKm));
        var nearby = await service.ListAsync(new() { Latitude = 10, Longitude = 106, MaxDistanceKm = 1 }, false, default);
        Assert.Equal("Z gần nhất", Assert.Single(nearby.Items).Name);
    }

    private sealed class Repository(Restaurant[] items) : IRestaurantRepository
    {
        public Task<IReadOnlyList<Restaurant>> ListAsync(RestaurantListQuery query, bool includeInactive, CancellationToken ct) => Task.FromResult<IReadOnlyList<Restaurant>>(items);
        public Task<Restaurant?> GetAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<bool> NameExistsAsync(string name, Guid? exceptId, CancellationToken ct) => throw new NotImplementedException();
        public void Add(Restaurant entity) => throw new NotImplementedException();
        public Task SaveAsync(CancellationToken ct) => throw new NotImplementedException();
    }
}
