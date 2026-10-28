# Frontend

Ứng dụng React + TypeScript chạy bằng Vite. Dùng Node.js 24 LTS; `npm ci`, sau đó `npm run dev` để chạy tại http://localhost:5173. `npm run build` tạo bản build trong `dist/`; `npm run lint` kiểm tra mã nguồn.

Giao diện đã kết nối backend cho các module Guest/User/Admin. Vite chuyển tiếp `/api` và WebSocket tới localhost:5080; backend và SQL Server cần chạy để đọc/ghi dữ liệu. Chức năng AI phụ thuộc cấu hình và quota backend.

Dùng npm và package-lock.json; không duy trì pnpm-lock.yaml hoặc cache pnpm trong source. Kiểm tra bằng `npm run lint`, `npm test`, `npm run build`. Không xóa node_modules trước demo nếu chưa có thời gian cài lại. Các màn hình được ghép tại src/app/router/Router.tsx, bootstrap tại src/main.tsx.

Phạm vi: giao diện Guest/User/Admin; gọi backend theo hợp đồng API; xử lý loading, empty, error và trạng thái quyền truy cập.

Hai thành viên FE có thể chia theo tính năng, ví dụ một người phụ trách tài khoản/nội dung/Admin, một người phụ trách thực đơn/chat/scan. Đây là phân công đề xuất, không phải hạn chế quyền truy cập thư mục.

Không đưa khóa dịch vụ AI hoặc bí mật backend vào frontend.
