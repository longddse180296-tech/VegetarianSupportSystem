// Định nghĩa dữ liệu về số liệu danh mục, nguyên liệu, công thức và nhà hàng trên dashboard để các bước xử lý dùng chung.
namespace Application.Features.Administration;

// DashboardCoreData: định nghĩa dữ liệu trao đổi của tính năng.
public sealed record DashboardCoreData(
    DashboardCatalogCount Categories,
    DashboardCatalogCount Ingredients,
    DashboardCatalogCount Recipes,
    DashboardCatalogCount Restaurants);
