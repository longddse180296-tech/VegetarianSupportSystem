# Hướng dẫn nhóm nhận bản release — 28/10/2026

## Lấy và chạy source

Giữ hoặc commit thay đổi cá nhân trước khi chuyển nhánh/pull. Bản này đã bỏ cache pnpm, dùng npm và package-lock.json; không cần pnpm.

```powershell
git switch release
git pull --ff-only origin release
dotnet restore backend/Backend.sln
dotnet build backend/Backend.sln -c Release
cd frontend
npm ci
npm run lint
npm test
npm run build
```

Máy cần .NET SDK 10 stable theo global.json, Node.js 24 LTS/npm, SQL Server hoặc LocalDB. Trong Development, tạo backend/.env từ backend/.env.example và điền cấu hình riêng. File .env không nằm trong Git; không chép key thật vào frontend.

Trước khi migration database có dữ liệu, tạo backup và kiểm tra đúng instance/database. Từ gốc repository:

```powershell
dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/Api --configuration Release
```

Cần công cụ dotnet-ef tương thích EF Core 10. Migration tạo/cập nhật schema, không tải dữ liệu của máy thành viên khác và không seed dữ liệu vận hành. Không xóa migration hoặc sửa lại lịch sử đã áp dụng.

Chạy backend bằng `cd backend; dotnet run`; terminal khác `cd frontend; npm run dev`. Website http://localhost:5173, Swagger http://localhost:5080/swagger. Đăng nhập tài khoản thật; sau nâng cấp phiên nên đăng nhập lại một lần.

## Cấu hình mỗi thành viên cần bổ sung

| Cấu hình/công cụ | Cần làm |
|---|---|
| SQL Server | ConnectionStrings__DefaultConnection trỏ tới instance/database của máy. LocalDB dùng Windows Authentication; không sao chép tài khoản SQL của người khác. |
| JWT | Cấu hình Issuer, Audience và SigningKey riêng ít nhất 32 byte để giữ JWT qua lần khởi động. Development có fallback khóa ngẫu nhiên nếu bỏ trống; restart sẽ làm JWT cũ không hợp lệ. |
| Gemini | Gemini__ApiKey cho chat/scan/OCR; Gemini__ModerationApiKey và Gemini__ModerationModel có thể dùng riêng cho kiểm duyệt bài viết. Chọn model tài khoản được cấp quyền, kiểm tra quota. Không tự kết luận AI đang hoạt động chỉ từ việc build đạt. |
| Email | Điền SMTP host/port/from/username/password và ResetPageUrl nếu demo quên mật khẩu. Thiếu cấu hình sẽ trả lỗi dịch vụ; không có email gửi giả. |
| FFprobe | Cài FFprobe vào PATH hoặc đặt VideoMetadata__FfprobePath thành đường dẫn executable. Không có công cụ này sẽ không đọc được metadata video phía server. |
| Media | Khi nhận database có sẵn, nhận cả kho ảnh/video tương ứng và cấu hình Storage__PrivateRoot/Storage__PublicImageRoot nếu dùng đường dẫn khác. Không có tệp thì URL/metadata trong DB không tự tái tạo ảnh/video. |

## Những thứ không được đưa lên Git

- backend/.env, frontend/.env.local và secret thực: Gemini, SMTP, JWT, thông tin đăng nhập SQL. Trao đổi bằng kênh riêng được nhóm đồng ý.
- Database đang chạy, file MDF/LDF, bản backup SQL trong .local/db-backups hoặc .local/db-recovery. Muốn dữ liệu giống máy demo phải bàn giao backup riêng, restore vào database đã xác định; không restore ghi đè dữ liệu của bạn khác khi chưa lưu lại.
- Kho upload mặc định backend/src/Api/.local/public-images và backend/src/Api/.local/media; có thể còn media cũ dưới bin/Debug hoặc bin/Release. Chia sẻ các tệp cần thiết riêng theo đúng cấu hình lưu trữ; không đưa dữ liệu người dùng vào Git.
- ffprobe.exe và gói FFmpeg cục bộ, node_modules, bin, obj, dist, cache, log, ảnh chụp kiểm tra, .local/cleanup-archive-20261028 và source zip trước dọn. Các thành viên tự cài/build; archive chỉ phục vụ khôi phục trên máy đang làm.

Đây là các mục chủ động loại khỏi source, không phải lỗi Git push. File .env.example và migration vẫn nằm trong release để nhóm dựng môi trường.

## Trạng thái dữ liệu và kiểm tra

- Database trên máy chuẩn bị demo đã dọn toàn bộ bài viết/bình luận theo yêu cầu; việc dọn SQL không phải migration, không chạy lại trên máy nhóm khi pull. Không tự động xóa bài viết/bình luận của thành viên khác.
- Ảnh/video và database hiện có không được seed vào môi trường mới. Muốn demo dữ liệu giống nhau phải dùng bộ bàn giao SQL/media riêng hoặc nhập qua Admin.
- Kiểm thử frontend/backend và API dùng database kiểm thử riêng; không đồng nghĩa đã kiểm tra Gemini/SMTP thật hoặc toàn bộ UI trên mọi màn hình.
- Build hiện còn cảnh báo thư viện System.Security.Cryptography.Pkcs 9.0.4 và kích thước bundle; xem xét cập nhật/thử tương thích ở nhiệm vụ riêng. Không bỏ qua cảnh báo khi triển khai thật.

Các thay đổi chính của bản này: dinh dưỡng theo đơn vị nguyên liệu, realtime SignalR, kiểm duyệt bài viết/văn bản/ảnh và tiền kiểm tiêu đề, thông báo tiếng Việt, video/metadata, mục đã lưu, hồ sơ tủ bếp, nhà hàng theo khoảng cách và nhiều loại chay, phiên tài khoản tự gia hạn/một trình duyệt, dọn source và tài liệu.
