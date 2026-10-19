# Nền tảng UI dùng chung FE1 và FE2

- Khung nội dung dưới header dùng `ui-page-container`: tối đa 1240px tính cả padding, lề trong 24px từ 640px và 16px trên mobile. Áp dụng cho trang chủ, danh sách, chi tiết, editor, profile, pantry, thực đơn và vỏ trang auth; giữ độ rộng riêng của form đăng nhập/reset và modal bên trong. Không thay thanh header theo yêu cầu mới nhất. Admin dùng layout chung có sidebar riêng.

- Font giao diện: `Segoe UI`, Arial, sans-serif qua `--font-sans`; hỗ trợ tiếng Việt, dùng font cài sẵn, không phụ thuộc font tải từ mạng.
- Theo điều chỉnh cuối của người dùng: giữ font sans-serif FE1 cho cả tiêu đề qua `--font-heading: var(--font-sans)`; không dùng serif. Tiêu đề trang đậm 800, tiêu đề card đậm 700.
- `PageHeading`, `Breadcrumb`, `Badge` dùng chung cho header các trang public. Tiêu đề trang 28–36px / 1.25; breadcrumb 13px, weight 500 (mục hiện tại 600); badge 12px, weight 600, cùng padding/viền/bo góc. Tiêu đề card 18px / 1.35.
- Màu: `primary` #2e7d32, hover #1b5e20, nền phụ #e8f5e9; nội dung #1f2937, nội dung phụ #6b7280, viền #e5e7eb.
- Typography cơ sở: 14px / 1.6; heading line-height 1.3. Cấp heading của từng loại trang sẽ được áp dụng trong phase đồng bộ trang.
- Control: radius 10px (`ui-control`); shared Button có cỡ sm/md/lg tương ứng 32/40/48px; Input/Select/Textarea dùng cùng font, viền và focus.
- Panel/card: radius 16px, nền trắng, viền chung và shadow nhẹ (`ui-card`). Modal: radius 20px, shadow dùng `--shadow-dialog`.
- Loading/empty/error: dùng `SkeletonLoader`, `EmptyState`, `AlertError`; không thay API rỗng/lỗi bằng dữ liệu giả.
- Khi không có ảnh: hiển thị nền và nhãn “Chưa có ảnh”; không lấy ảnh stock làm ảnh của dữ liệu. Ảnh minh họa marketing tĩnh không được gắn nhầm vào bản ghi thật.
- Responsive: header chung xuống hai hàng ở mobile; navigation được cuộn trong vùng riêng. Không giải quyết lỗi tràn bằng cách ẩn overflow toàn trang.
- Hỗ trợ `prefers-reduced-motion` và focus hiển thị khi dùng bàn phím.

Phase 1 đặt token và cập nhật shared components. Phase 4 sẽ tiếp tục thay CSS riêng từng trang bằng cùng hệ thống, đồng thời nâng cấp Dashboard Admin. Không coi Phase 1 là đã hoàn tất toàn bộ thiết kế lại Admin.
