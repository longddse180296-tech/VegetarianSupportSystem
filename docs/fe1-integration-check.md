# Rà soát tích hợp FE1 — Vân Quang Duy

Ngày rà soát: 11/10/2026. Tên thành viên theo yêu cầu trong phiên làm việc; tài liệu phân công hiện dùng FE1/FE2, chưa ánh xạ tên người. Tài liệu này ghi phạm vi sửa và cách demo, không thay đổi phân công chung.

## Phạm vi được xác nhận

- `AGENTS.md`, mục 5: FE1 phụ trách Auth, Profile, Articles, Admin và Meal Plans.
- `docs/work-assignment.md`, mục FE2, công việc 9 và `docs/backend-work-assignment.md`, mục 6: FE1 phụ trách Admin categories/ingredients/recipes/restaurants. Restaurants public thuộc FE2.
- Đợt sửa này chỉ thay đổi Meal Plans, Admin Categories/Ingredients, Auth và các phần Profile/Dashboard còn số liệu giả. Shared API client và router được sửa để phục vụ các luồng này.
- Không sửa frontend Recipes/Restaurants (public hoặc Admin), Videos, Pantry, AI chat/Scan; không sửa source backend, migrations hoặc hợp đồng API.

## Luồng demo Meal Plans

1. Chạy SQL Server và áp dụng migrations theo `backend/CORE_DATA.md`; chạy backend tại cổng 5080 và frontend tại 5173.
2. Đăng nhập User; vào Hồ sơ, lưu chế độ ăn, dị ứng và thực phẩm cần tránh. Cần có công thức đang hoạt động, đủ bằng chứng thành phần để phù hợp hồ sơ. Nên chuẩn bị ít nhất hai công thức phù hợp để demo thay tên món.
3. Mở Thực đơn → Tạo thực đơn mới. Kiểm tra hồ sơ, nhập tên/ngày bắt đầu → Tạo và lưu 21 bữa. Backend sử dụng hồ sơ đã lưu; không dùng các lựa chọn giả chỉ lưu ở FE.
4. Chọn từng ngày: luôn có ba vị trí Breakfast/Lunch/Dinner; dinh dưỡng bữa = giá trị mỗi khẩu phần nhân số khẩu phần. Dữ liệu dinh dưỡng chưa biết được ghi rõ, không thay bằng số giả.
5. Đổi món: chọn công thức thật và 1–20 khẩu phần. Backend kiểm tra điều kiện của snapshot kế hoạch; nếu trả 409, FE giữ kế hoạch cũ và hiển thị lỗi. Danh sách ứng viên lọc theo chế độ ăn, chưa bảo đảm phù hợp dị ứng trước khi backend kiểm tra.
6. Mở danh sách đi chợ → đánh dấu đã mua → tải lại trang → mở lại để kiểm tra trạng thái lưu thật.
7. Tạo lại toàn bộ: dùng snapshot hồ sơ cũ. Muốn áp dụng hồ sơ mới, tạo kế hoạch mới.
8. Áp dụng sang tuần mới: chọn ngày bắt đầu, tạo bản sao; shopping list được tính lại theo tủ bếp hiện tại.
9. Tải PDF: gọi endpoint bằng ID kế hoạch, kiểm tra Content-Type PDF; không có fallback tệp text mang đuôi PDF.

## Các sửa khác trong FE1

- Categories: CRUD thực, phân trang/tìm kiếm, ngừng sử dụng bằng PATCH; bỏ các phân loại/slug/trạng thái bật lại/xóa vật lý chưa có trong contract.
- Ingredients: CRUD thực theo DTO nguồn gốc, trứng/sữa/mật ong, bằng chứng động vật khác (true/false/null), dị nguyên, đơn vị, dinh dưỡng và nguồn dữ liệu. Ngừng sử dụng bằng POST; không tự suy diễn nhãn safe/danger.
- Auth: lựa chọn ghi nhớ quyết định localStorage/sessionStorage; không lấy user cache làm phiên hợp lệ khi `/me` lỗi. Router đợi xác thực khi tải lại với token.
- Reset mật khẩu: đọc token trong hash router và query thông thường.
- Profile: đếm bài viết/bình luận/video bằng endpoint thật; danh sách bài đã xuất bản từ API; không bịa số tương tác chưa được cung cấp. Avatar và một số tùy chọn UI vẫn chỉ lưu local theo thiết kế hiện có.
- Dashboard: số đếm từ API; bỏ fallback mock khi API lỗi/rỗng, thể hiện phần danh sách chưa được endpoint tổng quan cung cấp.

## Kiểm tra và điểm cần bàn giao

- `npm run lint` (đã loại node_modules/dist khỏi lint) và `npm run build`.
- `dotnet build backend/Backend.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false`.
- `dotnet test backend/tests/Domain.Tests/Domain.Tests.csproj -c Release --no-build`: 75 tests đạt trong lần rà soát này.
- IntegrationTests với SQL Server LocalDB thật: các kiểm tra Categories/Ingredients và Meal Plans (21 bữa, thay món, shopping purchase, regenerate, copy tuần, PDF thật) đạt; bộ kiểm thử toàn bộ dừng ở assertion Dashboard cũ `Comments is null` tại `DashboardApiChecks.cs:97`. Cần BE1 cập nhật assertion theo DTO hiện tại; không tự sửa test backend trong nhánh FE1.
- Kiểm thử Chrome headless qua API thật và SQL Server trên database riêng: 17 nhóm kiểm tra đạt, gồm tạo 21 bữa, chuyển ngày, đổi món/khẩu phần, shopping purchase sau reload, PDF có header `%PDF-`, regenerate, apply tuần, bố cục mobile, CRUD Categories/Ingredients, ghi nhớ đăng nhập bật/tắt, dữ liệu profile rỗng thật, lỗi mutation không báo thành công, checkbox rollback khi lưu lỗi, `/me` lỗi không dùng cache và token reset trong hash router. Không ghi nhận lỗi runtime FE. Database và tiến trình thử nghiệm đã được dọn; không ghi/xóa database đang có của thành viên.
- FE build đạt; Vite vẫn cảnh báo bundle lớn hơn 500 kB. Lint đạt không có cảnh báo. Backend build đạt, không có warning/error với lệnh nêu trên.
- Bài viết/bình luận/Admin moderation/video vẫn cần đợt tích hợp riêng để bỏ hết mock. Video phải do Admin xem và duyệt thủ công, không dùng AI. Đợt sửa này không tuyên bố hoàn tất các module đó.
