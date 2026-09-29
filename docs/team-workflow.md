# Quy trình nhóm đề xuất

## Repository

Một repository cho 5 thành viên. Thư mục FE/BE độc lập, dùng chung đặc tả và hợp đồng API. Stack đã chốt: React + TypeScript, ASP.NET Core .NET 10, SQL Server và Gemini API. Hiện chỉ tạo cấu trúc; chưa cài công cụ build hoặc orchestration.

## Nhánh và pull request

- `main` là nhánh tích hợp ổn định.
- Nhánh theo tính năng: `feat/fe-login`, `feat/be-auth`, `fix/scan-unknown-state`.
- Không dùng nhánh `frontend` và `backend` tồn tại dài hạn làm nơi tích hợp riêng.
- Mỗi PR nhỏ, nêu hành vi thay đổi và cách kiểm tra. Thay đổi FE cần người FE còn lại review; thay đổi BE cần ít nhất một người BE review.
- Thay đổi hợp đồng API cần cả FE và BE review.
- Không tự coi quy trình review trong tài liệu là rule đã bật trên GitHub. Branch protection/rulesets và CODEOWNERS sẽ cấu hình sau khi biết owner, danh sách thành viên và khả năng của gói GitHub.


## Đồng bộ nghiệp vụ

- `docs/mvp.md` là tài liệu nghiệp vụ hiện tại, phân biệt quyết định người dùng đã chốt với mặc định đề xuất.
- Với mỗi tính năng: thống nhất API → FE mock và BE triển khai song song → tích hợp → kiểm tra luồng hoàn chỉnh.
- Không commit secrets, ảnh upload của người dùng hoặc dữ liệu sức khỏe thật.
