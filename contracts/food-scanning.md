# Food scanning: ảnh món ăn (backend)

Nguồn OpenAPI: `/openapi/v1.json`; thử trên `/swagger` ở môi trường Development. Hai API yêu cầu Bearer token role `User` hoặc `Admin`. Guest không tải ảnh lên. `Admin` chỉ nên dùng đánh giá cá nhân khi đã có hồ sơ; tích hợp hồ sơ chưa có trong bản nền này.

## `POST /api/food-scans/dish-image`

- Content-Type: `multipart/form-data`, field `image` là ảnh JPG/PNG/WEBP, tối đa 10 MB. Backend nhận diện định dạng qua chữ ký tệp, không tin tên hay Content-Type do client gửi.
- Backend dùng `Gemini:ImageModel` (mặc định `gemini-2.5-flash`) cho ảnh; cấu hình này độc lập với `Gemini:Model` dùng cho chat/moderation. Cả hai dùng cùng `Gemini:ApiKey` ở backend.
- Gọi Gemini từ backend để nhận `suggestedDishName`, `visibleIngredients`, `unknownFactors`, `followUpQuestions`. Đây là **gợi ý từ ảnh**, chưa phải nguyên liệu đã xác nhận. Không đưa thành phần ẩn vào `visibleIngredients`.
- 200: `{ "processingStatus": "NeedsConfirmation", "suggestedDishName": "Phở với đậu hũ", "visibleIngredients": ["đậu hũ"], "unknownFactors": ["nguồn gốc nước dùng"], "followUpQuestions": ["Nước dùng làm từ rau củ, xương hay bạn không biết?"], "assessments": [{ "diet": "Vegan", "status": "InsufficientInformation" }], "errorCode": null, "note": "..." }`. `assessments` thực tế gồm đủ bốn chế độ; ảnh đơn lẻ luôn cho trạng thái chưa đủ thông tin đến khi User xác nhận.
- 400: thiếu/sai định dạng/quá 10 MB. 401/403: chưa đăng nhập/không đủ quyền. 422: ảnh không nhận diện được (`errorCode=UnrecognizableImage`). 503: Gemini chưa cấu hình, lỗi mạng hoặc phản hồi không hợp lệ; `processingStatus=AnalysisFailed`, `errorCode` mô tả lỗi máy đọc được. Backend thử lại tối đa hai lần với khoảng chờ tăng dần khi Gemini trả 502/503/504. Nếu vẫn nhận `ProviderHttp503`, dịch vụ Gemini đang tạm không sẵn sàng; User có thể thử gửi lại sau. Không coi lỗi này là món không phù hợp.

## `POST /api/food-scans/evaluate`

JSON body:

```json
{
  "ingredients": [
    { "name": "đậu hũ", "kind": "Plant" },
    { "name": "trứng", "kind": "Egg" },
    { "name": "nước dùng", "kind": "Unknown" }
  ],
  "ingredientsComplete": false
}
```

`kind`: `Plant`, `Egg`, `Dairy`, `Honey`, `Animal`, `Unknown`. User sửa/xác nhận gợi ý AI và bổ sung nước dùng, gia vị, thành phần ẩn; chọn `Unknown` khi không biết. `ingredientsComplete=true` chỉ khi User đã xác nhận toàn bộ thành phần liên quan, kể cả nước dùng/gia vị. Endpoint đánh giá chính dữ liệu trong body; bản nền chưa lưu phiên scan, lịch sử, ảnh hay hồ sơ.

200 trả `assessments` cho `Vegan`, `Lacto`, `Ovo`, `LactoOvo`, mỗi mục có `diet` và `status`: `SuitableBasedOnProvidedInformation`, `Incompatible`, hoặc `InsufficientInformation`. Thành phần động vật đã xác nhận làm cả bốn chế độ không phù hợp; trứng không hợp Vegan/Lacto; sữa không hợp Vegan/Ovo; mật ong không hợp Vegan. Dù còn thành phần chưa rõ, một thành phần vi phạm đã xác nhận vẫn trả `Incompatible` cho chế độ liên quan. 400: danh sách quá 100 mục hoặc tên/loại không hợp lệ. 401/403: tương tự API ảnh.

Đánh giá này không xác minh an toàn dị ứng, nguồn gốc thực tế hoặc quy trình sản xuất. Không tính tỷ lệ phần trăm chay từ ảnh.
