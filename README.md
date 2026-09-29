# Vegetarian Support

Monorepo cho nhóm 2 frontend và 3 backend.

Trạng thái: khung React và bốn project .NET 10 đã có thể build/run. Frontend đang là app trắng để nhóm tự xây giao diện. Backend có OpenAPI Development và package EF Core SQL Server, chưa có controller nghiệp vụ. Chưa triển khai nghiệp vụ, database schema, Gemini hoặc CI/deploy.

## Chạy trên máy

Yêu cầu: .NET SDK 10 stable và Node.js 24 LTS (kèm npm). Không cần SQL Server hoặc Gemini API key cho khung hiện tại vì chưa có query/migration chạy khi khởi động.

Mở hai terminal tại thư mục repository.

Terminal backend:

```powershell
dotnet run --project backend/src/Api --launch-profile http
```

Terminal frontend:

```powershell
cd frontend
npm ci
npm run dev
```

- Frontend: http://localhost:5173
- API base: http://localhost:5080
- OpenAPI JSON trong môi trường Development: http://localhost:5080/openapi/v1.json
- Dừng mỗi tiến trình bằng Ctrl+C trong terminal tương ứng.

Vite chuyển tiếp `/api` sang backend nên không cần cấu hình CORS để chạy local theo cách này. Có thể sao chép `frontend/.env.example` thành `frontend/.env.local` để đổi đích proxy; không đặt secrets vào frontend. Nếu cổng 5173 đã có ứng dụng khác, Vite báo lỗi thay vì âm thầm đổi cổng.

## Build và kiểm tra

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

1. Xem [cấu trúc thư mục](STRUCTURE.md) và đặc tả MVP.
2. Chạy khung FE/BE theo hướng dẫn trên; không khởi tạo Git repository lồng bên trong.
3. Thống nhất hợp đồng API cho tính năng đầu tiên.
4. Làm từng tính năng trên nhánh ngắn hạn, gửi pull request về `main`.

Xem [quy trình nhóm](docs/team-workflow.md) và [đặc tả MVP](docs/mvp.md).
