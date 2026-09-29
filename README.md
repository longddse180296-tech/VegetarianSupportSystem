# Vegetarian Support

Monorepo cho nhóm 2 frontend và 3 backend.

Trạng thái: chỉ có cấu trúc thư mục, tài liệu và các file `.gitkeep` giữ thư mục rỗng trong Git. Chưa có mã nguồn ứng dụng, solution/project .NET, package React hoặc CI/deploy hoạt động.

## Công nghệ đã chốt

- Frontend: React + TypeScript.
- Backend: ASP.NET Core Web API, C#, .NET 10.
- Database: SQL Server.
- AI: Gemini API, gọi từ backend.
- Công cụ: Visual Studio, SQL Server Management Studio và GitHub.

Repository: https://github.com/longddse180296-tech/VegetarianSupportSystem

## Cấu trúc

- `frontend/`: ứng dụng web, gồm giao diện Guest, User và Admin.
- `backend/`: API, nghiệp vụ, cơ sở dữ liệu và các xử lý AI.
- `docs/`: đặc tả chức năng và quy trình làm việc.
- `contracts/`: hợp đồng API dùng chung giữa FE/BE.
- `.github/`: mẫu pull request.

Frontend và backend có dependency, cấu hình môi trường, kiểm thử và quy trình deploy riêng. Một repository không bắt buộc chung ngôn ngữ hay deploy cùng lúc.

## Bắt đầu

1. Xem [cấu trúc thư mục](STRUCTURE.md) và đặc tả MVP.
2. Chỉ tạo ứng dụng sau khi được yêu cầu triển khai; không khởi tạo Git repository lồng bên trong.
3. Thống nhất hợp đồng API cho tính năng đầu tiên.
4. Làm từng tính năng trên nhánh ngắn hạn, gửi pull request về `main`.

Xem [quy trình nhóm](docs/team-workflow.md) và [đặc tả MVP](docs/mvp.md).
