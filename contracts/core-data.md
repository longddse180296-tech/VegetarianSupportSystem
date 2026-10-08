# Core Data — tuần 1

OpenAPI runtime `/openapi/v1.json` mô tả schema chi tiết. JSON dùng camelCase; ID là UUID. Category chỉ dùng cho Recipe.

## Endpoints

Thay `{resource}` bằng `categories`, `ingredients`, `recipes`.

| Method | Path | Quyền | Kết quả |
|---|---|---|---|
| GET | `/api/{resource}` | Công khai | 200, danh sách đang hoạt động |
| GET | `/api/{resource}/{id}` | Công khai | 200, chi tiết đang hoạt động; 404 nếu ẩn/không tồn tại |
| GET | `/api/admin/{resource}` | Admin | 200, danh sách gồm cả ngừng sử dụng |
| GET | `/api/admin/{resource}/{id}` | Admin | 200, chi tiết gồm cả ngừng sử dụng |
| POST | `/api/admin/{resource}` | Admin | 201 + Location + DTO chi tiết |
| PUT | `/api/admin/{resource}/{id}` | Admin | 200 + DTO chi tiết, thay toàn bộ dữ liệu nhập |
| PATCH | `/api/admin/categories/{id}/deactivate` | Admin | 204, lặp lại vẫn 204 |
| POST | `/api/admin/ingredients/{id}/deactivate` | Admin | 204, lặp lại vẫn 204 |
| POST | `/api/admin/recipes/{id}/deactivate` | Admin | 204, lặp lại vẫn 204 |

Không xóa vật lý. Ngừng danh mục/nguyên liệu không tự ngừng công thức đã có; quan hệ và dữ liệu chi tiết vẫn được giữ. Công thức mới hoặc thay danh sách thành phần chỉ được chọn danh mục/nguyên liệu đang hoạt động. Có thể giữ tham chiếu đã ngừng sử dụng khi sửa công thức cũ.

Danh sách nhận `pageNumber=1`, `pageSize=20` (1–100), `search` (tối đa 120 ký tự). Categories tìm theo tên; Ingredients tìm tên/aliases; Recipes tìm tên công thức hoặc tên/aliases của nguyên liệu.

Recipes có các filter tùy chọn, kết hợp bằng AND và áp dụng trước phân trang:

| Query | Ý nghĩa |
|---|---|
| `categoryId` | Công thức thuộc danh mục |
| `dietaryType` | 1 Vegan, 2 LactoVegetarian, 3 OvoVegetarian, 4 LactoOvoVegetarian; chỉ lấy kết quả Compatible |
| `maxCookTimeMinutes` | Thời gian nấu tối đa (0–10080), không bao gồm thời gian chuẩn bị |
| `maxCaloriesPerServing` | Calo mỗi khẩu phần tối đa (0–999999999); loại món có calo null |

Sắp xếp tên rồi ID để phân trang ổn định. Response: `{ items: [...], pageNumber, pageSize, totalCount }`. Ví dụ: `GET /api/recipes?dietaryType=1&maxCookTimeMinutes=30&maxCaloriesPerServing=500&pageSize=20`.

## Dữ liệu nhập

- Category: `name` bắt buộc, tối đa 120; `description` tối đa 500.
- Ingredient: `name` bắt buộc, tối đa 120; `aliases`, `allergens`, `source` tối đa 1000; `defaultUnit` tối đa 40; `origin`: 0 Unknown, 1 Plant, 2 Animal; `containsEgg`, `containsMilk`, `containsHoney` boolean. Dinh dưỡng nullable: `caloriesPer100Gram`, `proteinGramPer100Gram`, `carbohydrateGramPer100Gram`, `fatGramPer100Gram`.
- Ingredient bổ sung `containsOtherAnimalProducts`: true = có thịt/cá/gelatin hoặc thành phần động vật khác ngoài trứng/sữa/mật ong; false = đã xác minh không có; null = chưa xác minh. Animal chỉ có các cờ false không đủ để kết luận phù hợp. Origin Plant không được đồng thời khai báo có thành phần động vật (400).
- Recipe: `categoryId`, `name` (120), `servings` (1–10000), `instructions` (20000) bắt buộc; `description` (2000), `imageUrl` (URL http/https, tối đa 2048) tùy chọn; `prepTimeMinutes`, `cookTimeMinutes` (0–10080). Dinh dưỡng nullable: `caloriesPerServing`, `proteinGramPerServing`, `carbohydrateGramPerServing`, `fatGramPerServing`. `ingredients` bắt buộc có ít nhất một dòng: `{ ingredientId, quantity, unit, note }`; ID không trùng, quantity > 0, unit bắt buộc tối đa 40, note tối đa 500. PUT cập nhật toàn bộ danh sách này.
- Số thập phân tối đa 3 chữ số lẻ, tối đa 999999999; dinh dưỡng không âm. `null` nghĩa là chưa biết, không mặc định thành 0. Dinh dưỡng công thức do Admin nhập **theo mỗi khẩu phần**, không tự tính từ gram hoặc từ đơn vị tự do như muỗng/cốc.
- Tên được trim và duy nhất không phân biệt hoa thường trong từng loại, kể cả bản ghi đã ngừng sử dụng. Response bổ sung `id`, `isActive`, `createdAt`, `updatedAt`; Recipe chi tiết bổ sung tên danh mục, tên và trạng thái của từng nguyên liệu. Danh sách Recipe trả tóm tắt, không gồm hướng dẫn và các dòng nguyên liệu.

## Phân loại chế độ ăn

Recipe summary và detail trả `dietaryAssessments` gồm bốn phần tử `{ dietaryType, status }`.
`status`: 0 Unknown, 1 Compatible, 2 Incompatible. Tính khi đọc từ ingredient hiện tại; không có trường để Admin nhập nhãn recipe và không lưu cache có thể lỗi thời.

| Thành phần đã xác nhận | Vegan | Lacto | Ovo | Lacto-ovo |
|---|---|---|---|---|
| Chỉ thực vật | Phù hợp | Phù hợp | Phù hợp | Phù hợp |
| Trứng | Không | Không | Phù hợp | Phù hợp |
| Sữa | Không | Phù hợp | Không | Phù hợp |
| Trứng và sữa | Không | Không | Không | Phù hợp |
| Mật ong | Không | Phù hợp | Phù hợp | Phù hợp |
| Thành phần động vật khác | Không | Không | Không | Không |

Các ô phù hợp giả định toàn bộ thành phần đã rõ và không có thành phần vi phạm khác. Ingredient nguồn gốc Unknown, hoặc Animal chưa xác minh thành phần động vật khác, tạo kết quả Unknown cho chế độ chưa có vi phạm. Vi phạm đã xác nhận có ưu tiên hơn Unknown: trứng + nguyên liệu chưa rõ → Vegan/Lacto Incompatible, Ovo/Lacto-ovo Unknown. Animal không có bất kỳ loại thành phần cụ thể nào vẫn là Unknown.

Sửa ingredient cập nhật kết quả phân loại/detail/filter của các recipe liên quan ngay lần đọc sau. Ingredient đã ngừng sử dụng trong recipe cũ vẫn được xét. Dị nguyên là thông tin riêng, không phải kết luận an toàn dị ứng.

## Lỗi và tích hợp

- 400: request/phân trang không hợp lệ, tham chiếu không hợp lệ; trả ValidationProblemDetails (`errors` theo trường).
- 401: chưa xác thực; 403: đã xác thực nhưng không có role Admin; 404: ID không tồn tại; 409: tên trùng, kể cả ghi đồng thời; lỗi dùng ProblemDetails.
- Core Data kiểm tra principal/role phía backend. Scaffold hiện chưa có authentication của BE 1, nên các endpoint Admin trả 401 cho đến khi BE 1 tích hợp xác thực; không thêm đường bypass.
- Không tự migration khi startup. Tạo database bằng migration với connection string local do developer cấu hình; không lưu connection string thật trong repository.

Ví dụ Category POST: `{ "name": "Món chính", "description": "Công thức món chính" }`.
Ví dụ Recipe POST: `{ "categoryId": "<UUID danh mục>", "name": "Đậu hũ hấp", "servings": 2, "instructions": "Hấp đậu hũ đến chín.", "prepTimeMinutes": 5, "cookTimeMinutes": 10, "ingredients": [{ "ingredientId": "<UUID nguyên liệu>", "quantity": 200, "unit": "g" }] }`.
