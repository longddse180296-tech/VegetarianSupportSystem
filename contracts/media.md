# Hợp đồng API — Ảnh công khai

Ảnh đại diện của bài viết, công thức hoặc nhà hàng được tải từ thiết bị qua kho ảnh công khai dùng chung. API chỉ nhận tệp ảnh, không nhận URL do người dùng tự nhập.

| Method | Path | Quyền | Kết quả |
|---|---|---|---|
| POST | `/api/me/images` | User, Admin | Tải một ảnh và trả `{ key, url }` |
| GET | `/api/public-images/{key}` | Công khai | Nội dung ảnh đã tải |

`POST /api/me/images` nhận `multipart/form-data` với trường `image`. Chỉ nhận JPG, PNG hoặc WEBP được kiểm tra bằng chữ ký tệp, dung lượng từ 1 byte đến 10 MB. Thành công trả URL tuyệt đối để lưu vào trường ảnh của feature gọi API. Tệp không hợp lệ trả `400`; kho lưu trữ không sẵn sàng trả `503`.

Ảnh được trả qua URL công khai vì nó là ảnh đại diện của nội dung công khai. Key do server sinh, không nhận đường dẫn tệp từ client.
