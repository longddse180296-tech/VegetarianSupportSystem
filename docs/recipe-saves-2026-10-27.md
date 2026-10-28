# Lưu công thức vào Profile — 27/10/2026

Cập nhật theo yêu cầu mới nhất: đã bỏ nhãn nguồn lưu khỏi giao diện Mục đã lưu. Chức năng lưu/bỏ lưu và dữ liệu hiện có được giữ nguyên; thông tin nguồn trong API chỉ còn để tương thích.

- Trang danh sách và chi tiết Công thức có nút Lưu/Đã lưu; Tủ bếp AI có nút lưu cho mỗi món được gợi ý.
- Các nút dùng chung Favorites theo tài khoản và chỉ báo thành công khi API xác nhận. Bấm lần nữa để bỏ lưu; tải lại trang sẽ đọc trạng thái từ máy chủ.
- Profile → Mục đã lưu → Công thức hiển thị công thức và ngày lưu, không hiển thị nguồn lưu.
- Profile có mục Tủ bếp AI tại `/profile/pantry`; vẫn dùng cùng tủ bếp của tài khoản, không tạo bản sao dữ liệu.
- `/favorites?type=Recipe` mở thẳng tab Công thức. Nguồn lưu là metadata, không phải quyền truy cập và không thay cho thêm món vào thực đơn tuần.

## Code và dữ liệu

Hợp đồng: `contracts/favorites.md`. Domain: `FavoriteSaveSource`, `Favorite.SavedFrom`. Validation và mapping nằm trong `Application/Features/Favorites`. Cấu hình EF có ràng buộc nguồn chỉ được gắn với công thức.

Migration `20261027075305_AddFavoriteSaveSource` thêm cột nullable và check constraint; đã áp dụng local sau khi sao lưu COPY_ONLY. Không tự gán nguồn cho bốn bản lưu cũ.

Frontend dùng `features/favorites/hooks/useRecipeSaves.ts` cho ba nơi phát sinh thao tác. Hook tải đủ các trang, tách trạng thái theo tài khoản, hủy yêu cầu đọc cũ và chặn gửi lặp cho cùng món. Bỏ helper cũ ở `recipes/api/recipeApi.ts` từng trả thành công ngay cả khi request thất bại.

## Kiểm tra

- Backend Debug/Release build đạt; 130 unit test đạt.
- 236 kiểm tra API/SQL Core Data đạt, trong đó 11 kiểm tra nguồn lưu, lưu trùng, bỏ lưu, dữ liệu cũ và cách ly tài khoản.
- Frontend lint/build đạt; 36 test frontend đạt, gồm 8 kiểm tra API Favorites mới.
- Browser: kiểm tra các component thật qua fixture tạm, chặn mọi thao tác ghi database thật; lưu từ danh sách và tủ bếp, xem nhãn nguồn trong Profile, mở chi tiết và bỏ lưu đều đạt. Database persistence được kiểm tra độc lập trong integration test SQL.
