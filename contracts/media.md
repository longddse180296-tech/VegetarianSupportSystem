# Hợp đồng API — Ảnh công khai

Ảnh đại diện của bài viết, công thức hoặc nhà hàng được tải từ thiết bị qua kho ảnh công khai dùng chung. API chỉ nhận tệp ảnh, không nhận URL do người dùng tự nhập.

| Method | Path | Quyền | Kết quả |
|---|---|---|---|
| POST | `/api/me/images` | User, Admin | Tải một ảnh và trả `{ key, url }` |
| GET | `/api/public-images/{key}` | Công khai | Nội dung ảnh đã tải |

`POST /api/me/images` nhận `multipart/form-data` với trường `image`. Chỉ nhận JPG, PNG hoặc WEBP được kiểm tra bằng chữ ký tệp, dung lượng từ 1 byte đến 10 MB. Thành công trả URL tuyệt đối để lưu vào trường ảnh của feature gọi API. Tệp không hợp lệ trả `400`; kho lưu trữ không sẵn sàng trả `503`.

Ảnh được trả qua URL công khai vì nó là ảnh đại diện của nội dung công khai. Key do server sinh, không nhận đường dẫn tệp từ client.

## Hiển thị ảnh nội dung (04/11/2026)

- Frontend chỉ hiển thị URL ảnh bìa/thumbnail có trong dữ liệu của nội dung. URL thiếu hoặc chỉ có khoảng trắng hiển thị “Chưa có ảnh”; URL tải lỗi hiển thị “Không tải được ảnh”. Không tự gán ảnh món ăn/nhà hàng từ nguồn hard-code để thay ảnh của bản ghi.
- Quy tắc áp dụng cho công thức, bài viết, video, nhà hàng, các thẻ liên quan và gợi ý công thức trong tủ bếp. Component `shared/components/ContentImage.tsx` xử lý cả ảnh thiếu và ảnh lỗi, theo từng URL để ảnh mới vẫn tải được sau khi thay dữ liệu.
- Bài viết trả trường `coverImageUrl`; adapter thẻ bài viết liên quan phải đọc đúng trường này. Video không có thumbnail thì không tự tạo URL thumbnail hoặc ảnh poster minh họa; trình phát tiếp tục dùng video thật.
- Không thay đổi request/response API hoặc tự sửa URL đã lưu trong database. Ảnh trang trí cố định của giao diện không được dùng làm ảnh bìa thay thế cho nội dung.
