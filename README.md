# Vegetarian Support

Monorepo cho nhóm 2 frontend và 3 backend.

Cập nhật 28/10/2026: hệ thống có giao diện Guest/User/Admin cho tài khoản, hồ sơ, công thức/nguyên liệu, bài viết, video, bình luận, nhà hàng, mục đã lưu, thực đơn, tủ bếp, chat và scan. Backend xử lý phân quyền, kiểm duyệt, dinh dưỡng, phiên đăng nhập và lưu dữ liệu SQL Server. Gemini chỉ được gọi từ backend khi có cấu hình hợp lệ; lỗi/quota dịch vụ được hiển thị theo trạng thái thực tế.

## Chạy trên máy

Yêu cầu: .NET SDK 10 theo global.json, Node.js 24 LTS và npm, SQL Server/LocalDB cùng database đã áp dụng migration. Dự án thống nhất dùng npm và package-lock.json. Cấu hình backend trong backend/.env từ mẫu backend/.env.example; không chia sẻ secret. Gemini cần key cho chức năng AI, SMTP cần cấu hình để gửi email, FFprobe cần cho metadata video; xem backend/README.md.

Áp dụng migration bằng `dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/Api --configuration Release`. Sao lưu trước khi cập nhật database đã có dữ liệu. Không chạy seed vào database demo đang sử dụng.

Mở hai terminal tại thư mục repository.

Terminal backend:

```powershell
cd backend
dotnet run
```

Terminal frontend:

```powershell
cd frontend
npm ci
npm run dev
```

- Frontend: http://localhost:5173
- API base: http://localhost:5080
- Swagger UI trong môi trường Development: http://localhost:5080/swagger
- OpenAPI JSON trong môi trường Development: http://localhost:5080/openapi/v1.json
- Thử scan ảnh món ăn: lấy token role `User` ở `POST /api/dev-auth/token`, bấm Authorize trong Swagger, rồi gửi ảnh ở `POST /api/food-scans/dish-image`. Xác nhận nguyên liệu và gọi `POST /api/food-scans/evaluate`. Xem [hợp đồng scan](contracts/food-scanning.md).
- Dừng mỗi tiến trình bằng Ctrl+C trong terminal tương ứng.

Dữ liệu mẫu/demo chỉ dùng trong `backend/tests/IntegrationTests/Fixtures/` cho database kiểm thử riêng. API không còn hỗ trợ `--seed-core-data` hoặc `--seed-demo-data`. Nhập dữ liệu thật qua các trang Admin; thiếu dữ liệu sẽ hiển thị trạng thái trống.

Vite chuyển tiếp `/api` sang backend nên không cần cấu hình CORS để chạy local theo cách này. Có thể sao chép `frontend/.env.example` thành `frontend/.env.local` để đổi đích proxy; không đặt secrets vào frontend. Nếu cổng 5173 đã có ứng dụng khác, Vite báo lỗi thay vì âm thầm đổi cổng.

Form Admin công thức dùng SignalR tại `/api/hubs/recipe-nutrition` để tự tính dinh dưỡng khi nhập định lượng/khẩu phần. Proxy `/api` đã bật WebSocket; khi deploy cần chuyển tiếp cả HTTP và WebSocket. Chỉ Admin truy cập được hub; thông số tính lại tại backend trước khi lưu.

## Build và kiểm tra

Đợt rà soát lỗi, thông báo và chú giải source tiếng Việt: [Bằng chứng và kịch bản review 26/10/2026](docs/review-readiness-2026-10-26.md). Frontend có `npm test` để chạy kiểm tra các nhánh lỗi HTTP dùng chung.

```powershell
dotnet build backend/Backend.sln -c Release
cd frontend
npm ci
npm run lint
npm run build
```

Xem thử bản build FE bằng `npm run preview` tại http://localhost:4173, vẫn cần chạy backend. `vite preview` chỉ dùng xem thử local, không phải máy chủ production. Khi deploy thật, cần cấu hình host FE/reverse proxy cho `/api` và HTTPS.

Trong Visual Studio có hỗ trợ .NET 10, mở `backend/Backend.sln`, đặt `Api` làm startup project và chọn profile `http`. Frontend chạy trong terminal riêng. Nếu Visual Studio không nhận .NET 10, dùng CLI ở trên hoặc cập nhật Visual Studio hỗ trợ SDK này.

## Công nghệ đã chốt

- Frontend: React + TypeScript.
- Backend: ASP.NET Core Web API, C#, .NET 10.
- Database: SQL Server.
- AI: Gemini API, gọi từ backend.
- Công cụ: Visual Studio, SQL Server Management Studio và GitHub.

Repository: https://github.com/longddse180296-tech/VegetarianSupportSystem

## Cấu trúc

- `frontend/`: ứng dụng web, gồm giao diện Guest, User và Admin.
- `backend/`: Clean Architecture gồm `Api`, `Application`, `Domain`, `Infrastructure`.
- `docs/`: đặc tả chức năng và quy trình làm việc.
- `contracts/`: hợp đồng API dùng chung giữa FE/BE.
- `.github/`: mẫu pull request.

Frontend và backend có dependency, cấu hình môi trường, kiểm thử và quy trình deploy riêng. Một repository không bắt buộc chung ngôn ngữ hay deploy cùng lúc.

## Bắt đầu

1. Xem [hướng dẫn cho AI/coder](AGENTS.md), [phân chia công việc](docs/work-assignment.md), [cấu trúc thư mục](STRUCTURE.md) và đặc tả MVP.
2. Cấu hình SQL Server, áp dụng migration và chạy FE/BE theo hướng dẫn trên; không khởi tạo Git repository lồng bên trong.
3. Đọc hợp đồng API của tính năng trước khi sửa giao diện/backend.
4. Làm từng tính năng trên nhánh ngắn hạn, gửi pull request về `main`.

Xem [quy trình nhóm](docs/team-workflow.md) và [đặc tả MVP](docs/mvp.md).
