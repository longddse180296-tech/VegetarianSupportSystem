# Phase 2 — báo cáo tự kiểm tra

Ngày 16/10/2026. Hoàn tất phạm vi được người dùng chốt lại: Profile và phần AI đọc Profile. Dừng chờ xác nhận, chưa sang Phase 3. Toàn bộ Food Scan và câu trả lời thực tế của Gemini vẫn hoãn.

## Kết quả

- Profile dùng cùng nhãn bốn chế độ ăn với AI; hỗ trợ chưa chọn, lưu và đọc lại qua API thật. Giữ mapping API `Vegan/Lacto/Ovo/LactoOvo`, không đổi enum backend hoặc giá trị UI mà các module cũ đang dùng.
- Ngày sinh là ngày người dùng nhập; không tự tạo ngày sinh từ tuổi. Chiều cao/cân nặng nhận hai chữ số thập phân theo contract. Có thể bỏ chọn giới tính/mức vận động/mục tiêu và xóa số đo; gửi null đúng nghĩa. Chỉ số BMI/TDEE lấy response backend, không tính hoặc điền số mẫu ở FE.
- Preview debounce/abort loại phản hồi cũ; parent cập nhật bằng functional state để phản hồi trễ không ghi đè tên/điện thoại/khu vực vừa sửa. Lỗi preview xóa chỉ số cũ và hiển thị lỗi; không tự lưu.
- Dị ứng và thực phẩm cần tránh là hai danh sách riêng; bỏ dòng trống/tên trùng không phân biệt hoa thường, kiểm tra độ dài trước khi ghi. Thêm mục mới trước xóa mục cũ. Lỗi sau PUT chính không hiển thị thành công toàn bộ; giữ draft và nói rõ phần đã lưu để người dùng thử lại.
- Giữ `restaurantArea` trong model/API/database theo quyết định cuối. Không xóa dữ liệu/cột. Màn hình nhà hàng dùng Auth thật để lấy khu vực dự phòng vào ô tìm kiếm khi không có tọa độ. Khi có GPS thì bỏ khu vực tự điền và dùng tọa độ thật. Thiếu GPS thì không bật lọc km hoặc khẳng định khoảng cách gần nhất chính xác.
- Sidebar AI đọc cùng `profileApi`, có loading/error/retry, cập nhật theo sự kiện Profile và khi quay lại cửa sổ; Guest không lấy Profile tài khoản. Thiếu dữ liệu/danh sách rỗng được mô tả là chưa khai báo/chưa đủ dữ liệu, không phải không dị ứng.
- Backend đọc lại Profile theo user đã xác thực cho mỗi câu hỏi, dùng cùng `IProfileContextReader` và BMI/TDEE với GET Profile. Formatter chỉ cung cấp dữ liệu cần thiết, không gửi ID/email/điện thoại/ngày sinh đầy đủ. Không thêm endpoint, không đổi request/response, không thêm migration.
- Review UI AI còn phát hiện lịch sử mẫu và số tin nhắn cứng trong code cũ: đã bỏ fallback này, nhãn “Đang hoạt động”/VIP tĩnh. Không thay gửi tin nhắn, quota, lưu/mở hội thoại, adapter Gemini hoặc Scan. Lỗi tải lịch sử chi tiết/cơ chế quota thực tế chưa được nghiệm thu trong phase này.
- Shared controls/font/container của Phase 1 được giữ. Sửa tràn trên mobile khi tên thực phẩm dài; không sửa AppHeader hoặc source Auth. Xóa các phần UI chỉ số cũ không có dữ liệu backend khỏi calculator đang dùng.

## Tự kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` | Đạt, không warning |
| `npm run build` | Đạt; còn cảnh báo bundle JS lớn hơn 500 kB |
| Backend solution build | Đạt, 0 warning / 0 error |
| Domain/Application tests | 87 passed, 0 failed; gồm 8 trường hợp mới cho Profile → AI |
| API + SQL Server tạm | 19/19 đạt qua `--profile-only`; database test đã tự xóa |
| Browser | 18/18 đạt qua `.local/phase2-profile-browser-check.mjs`; fixture riêng, không ghi DB thật hoặc gọi Gemini/Scan |
| Review | Đối chiếu diff, kiểm tra không thay source Auth/Scan/header; xem ảnh Profile/settings và sidebar AI ở mobile |

Lệnh backend dùng cấu hình phù hợp môi trường hiện tại:

```powershell
dotnet build backend/Backend.sln -c Release --no-restore -m:1 -p:MSBuildEnableWorkloadResolver=false
dotnet test backend/tests/Domain.Tests/Domain.Tests.csproj -c Release --no-build --no-restore -m:1 -p:MSBuildEnableWorkloadResolver=false
# CORE_DATA_TEST_CONNECTION trỏ SQL Server local dùng cho test; test tự thay InitialCatalog bằng tên CoreDataChecks_*.
dotnet run --project backend/tests/IntegrationTests/CoreDataChecks.csproj -c Release --no-build --no-restore -- --profile-only
```

Integration test dùng controller/DI/SQL thật: đủ bốn diet, ngày sinh chính xác, số đo thập phân, khu vực, thêm/xóa/trùng dị ứng, preview không ghi DB và context provider đúng với GET Profile. Provider capture chỉ đăng ký trong test host và trả Unavailable; không tạo câu trả lời mẫu.

Browser test kiểm tra lưu/đọc lại, email chỉ đọc, không mặc định diet/ngày sinh, phản hồi preview trễ và đảo thứ tự, lỗi validation/lưu một phần/thử lại, xóa dữ liệu tùy chọn, tên dài, AI sidebar cập nhật/lỗi/Guest, không còn lịch sử mẫu, và GPS từ chối → khu vực Profile → có tọa độ thật. Có kiểm tra mobile 390px và desktop 1366px.

## Giới hạn và bàn giao

- Chưa có Gemini key nên chưa xác nhận chất lượng/câu trả lời từ provider thực tế. Nối dữ liệu Profile đã được kiểm thử độc lập; chưa tuyên bố toàn bộ chat/Scan hoàn tất.
- Không thay schema hoặc dữ liệu database `VegetarianSupport`; chỉ đọc metadata để kiểm tra cột trước khi người dùng quyết định giữ lại. Không áp dụng migration Articles đang chờ của Phase 3.
- Backend runtime chỉ bổ sung phần context thiếu của AI. Danh sách người cần báo và file liên quan ở `docs/cross-team-change-notes.md`.
- Chưa commit. Chưa làm Phase 3–5. Cần xác nhận trước khi tiếp tục phase tiếp theo.
