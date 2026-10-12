# Frontend

Ứng dụng React + TypeScript chạy bằng Vite. Dùng Node.js 24 LTS; `npm ci`, sau đó `npm run dev` để chạy tại http://localhost:5173. `npm run build` tạo bản build trong `dist/`; `npm run lint` kiểm tra mã nguồn.

App hiện đang để trắng để nhóm tự xây màn hình theo module. Vite đã cấu hình proxy `/api` tới localhost:5080; backend cần chạy riêng khi bắt đầu tích hợp API. SQL Server/Gemini và các tính năng bên dưới chưa được triển khai.

Phạm vi: giao diện Guest/User/Admin; gọi backend theo hợp đồng API; xử lý loading, empty, error và trạng thái quyền truy cập.

Hai thành viên FE có thể chia theo tính năng, ví dụ một người phụ trách tài khoản/nội dung/Admin, một người phụ trách thực đơn/chat/scan. Đây là phân công đề xuất, không phải hạn chế quyền truy cập thư mục.

Không đưa khóa dịch vụ AI hoặc bí mật backend vào frontend.
