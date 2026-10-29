# Core Data — tuần 1

Cập nhật 29/10/2026: `POST /api/admin/ingredients/{id}/activate` chỉ Admin, trả 204; đặt IsActive=true và UpdatedAt khi cần, giữ nguyên dinh dưỡng và liên kết công thức. Gọi lại vẫn 204; thiếu nguyên liệu trả 404; Guest/User trả 401/403. Sau mở khóa, API công khai và ô chọn nguyên liệu lấy lại được mục này. FE chờ request thành công mới đổi trạng thái/báo thành công, lỗi giữ trạng thái cũ.

Cập nhật 28/10/2026: mốc dinh dưỡng theo đơn vị Admin chọn được dùng trực tiếp: g → 100 g; kg → 1 kg; ml → 100 ml; Số lượng (`đơn vị` trong API) → 1 đơn vị. Công thức cộng các chỉ số theo `lượng dùng / NutritionBasisQuantity`, rồi chia khẩu phần; ml và Số lượng không đổi sang gam. Ví dụ nhập 200 kcal/100 ml thì 50 ml đóng góp 100 kcal; nhập 200 kcal/1 đơn vị thì 2 đơn vị đóng góp 400 kcal trước khi chia khẩu phần. Form công thức tự lấy đơn vị, hiển thị hướng dẫn đúng loại. Dữ liệu cũ thực sự theo 100 g nhưng DefaultUnit=ml không được tự đổi nhãn hoặc số liệu; cần nhập lại chỉ số theo mốc ml trong quản lý nguyên liệu. Không thay dữ liệu gốc bằng số liệu suy đoán. Kiểm tra API/DB/SignalR: `--nutrition-units-only` trên chương trình IntegrationTests.

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
| `declaredDietaryType` | Lọc đúng loại Admin khai báo (cùng enum với `dietaryType`); không mở rộng sang các loại tương thích. Nếu dùng cùng `dietaryType`, hai điều kiện kết hợp AND. |
| `maxCookTimeMinutes` | Thời gian nấu tối đa (0–10080), không bao gồm thời gian chuẩn bị |
| `maxCaloriesPerServing` | Calo mỗi khẩu phần tối đa (0–999999999); loại món có calo null |
| `calorieSort` | `asc`: Kcal/khẩu phần tăng dần; `desc`: giảm dần; không truyền: thứ tự bình thường theo tên rồi ID. Giá trị khác trả 400. Sắp xếp trước phân trang, sau lọc; calo chưa biết (`null`) luôn ở cuối, giá trị bằng nhau xếp theo tên rồi ID. |

Sắp xếp tên rồi ID để phân trang ổn định. Response: `{ items: [...], pageNumber, pageSize, totalCount }`. Mỗi item danh sách công thức có dữ liệu dinh dưỡng theo khẩu phần (`caloriesPerServing`, `proteinGramPerServing`, `carbohydrateGramPerServing`, `fatGramPerServing`) và `ingredientNames` để màn hình thực đơn so sánh món thay thế; các trường dinh dưỡng có thể null nếu Admin chưa khai báo. Ví dụ: `GET /api/recipes?dietaryType=1&maxCookTimeMinutes=30&maxCaloriesPerServing=500&pageSize=20`.

## Dữ liệu nhập

### Tự tính dinh dưỡng công thức (26/10/2026)

- Quyết định mới: bốn chỉ số mỗi khẩu phần được tính ở backend từ nguyên liệu, định lượng cho toàn bộ công thức và số khẩu phần. FE chỉ hiển thị, không cho sửa tay. POST/PUT không tin bốn số gửi lên: tính lại từ dữ liệu nguyên liệu hiện tại trước khi lưu.
- Công thức tính: tổng từng chỉ số `giá trị nguyên liệu × lượng dùng / mốc dinh dưỡng`, sau đó chia số khẩu phần; g/kg quy đổi theo 1 kg = 1000 g. Không quy đổi ml hoặc đơn vị đếm sang khối lượng. Đơn vị nhập khóa theo `defaultUnit` hợp lệ trong dữ liệu; bản ghi có đơn vị cũ không hỗ trợ thì dùng `nutritionBasisUnit`. Backend kiểm tra lại đơn vị và tính tương thích của mốc.
- Thiếu bất kỳ chỉ số nguyên liệu, sai đơn vị, không quy đổi được hoặc vượt giới hạn số: trả cảnh báo cụ thể; không hiển thị tổng một phần như tổng đầy đủ và không lưu số tự suy đoán. Số 0 đã khai báo vẫn hợp lệ. Giữ dữ liệu công thức đã lưu trước đây cho tới khi Admin sửa/lưu lại.
- SignalR: `/api/hubs/recipe-nutrition`, chỉ Admin, xác thực JWT hiện có. Gọi `Calculate` với `{ servings, ingredients: [{ ingredientId, quantity, unit }] }`, tối đa 200 dòng, không trùng ID. Trả `{ isComplete, caloriesPerServing, proteinGramPerServing, carbohydrateGramPerServing, fatGramPerServing, issues: [{ ingredientId, message }] }`. Không broadcast dữ liệu nháp sang người dùng khác. Input không hợp lệ trả lỗi Hub; dữ liệu nghiệp vụ thiếu trả `isComplete: false` và các giá trị null.
- FE gửi lại khi đổi nguyên liệu/định lượng/khẩu phần, trì hoãn ngắn khi đang gõ, bỏ qua phản hồi cũ; tự kết nối lại và tính lại khi mạng khôi phục. Lưu công thức vẫn do backend tính lại nên không phụ thuộc độ trễ SignalR.

### Cập nhật nguyên liệu — đơn vị và mốc dinh dưỡng

POST/PUT công thức bắt buộc danh mục, ảnh đại diện `imageUrl`, khẩu phần, `prepTimeMinutes` và `cookTimeMinutes`. FE thêm mới để trống các ô số; thời gian 0 hợp lệ khi được nhập rõ ràng, thiếu/null trả 400. Đang upload ảnh không được lưu. Các công thức cũ thiếu ảnh vẫn xem được; cần bổ sung ảnh khi sửa/lưu.

POST/PUT nguyên liệu bắt buộc `defaultUnit` thuộc `g`, `kg`, `ml`, `đơn vị` và bốn số không âm `calories`, `proteinGram`, `carbohydrateGram`, `fatGram` (tối đa 3 số lẻ). `0` là giá trị hợp lệ đã khai báo; `null`/thiếu trường trả 400. Mốc dinh dưỡng do backend xác định: `g` → 100 g, `kg` → 1 kg, `ml` → 100 ml, `đơn vị` → 1 đơn vị đếm. Response bổ sung `nutritionBasisQuantity`, `nutritionBasisUnit` và bốn trường giá trị trên. Không suy ra khối lượng từ thể tích hoặc số lượng.

Các bản ghi cũ giữ mốc 100 g kể cả khi đơn vị thường dùng khác; không tự thay đổi số liệu. FE hiển thị đúng mốc đã lưu và yêu cầu nhập lại dinh dưỡng khi chuyển sang mốc khác. Các trường response `*Per100Gram` được giữ để tương thích: chỉ có giá trị khi mốc là g/kg, trả null cho ml/số lượng. POST/PUT chuyển sang dùng bốn trường mới, không nhập các trường `*Per100Gram`. Ô Nguồn dữ liệu được bỏ khỏi FE; dữ liệu nguồn cũ vẫn được giữ. Tên nguyên liệu duy nhất sau trim, không phân biệt hoa thường; HTTP 409 có thông báo tiếng Việt, kể cả tên đã ngừng sử dụng.

- Category: `name` bắt buộc, tối đa 120; `description` tối đa 500.
- Ingredient: `name` bắt buộc, tối đa 120; `aliases`, `allergens`, `source` tối đa 1000; `defaultUnit` bắt buộc, thuộc bốn đơn vị nêu trên; `origin`: 0 Unknown, 1 Plant, 2 Animal; `containsEgg`, `containsMilk`, `containsHoney` boolean. POST/PUT bắt buộc `calories`, `proteinGram`, `carbohydrateGram`, `fatGram`; response của bản ghi cũ có thể null nếu trước đây chưa được khai báo.
- Ingredient bổ sung `containsOtherAnimalProducts`: true = có thịt/cá/gelatin hoặc thành phần động vật khác ngoài trứng/sữa/mật ong; false = đã xác minh không có; null = chưa xác minh. Animal chỉ có các cờ false không đủ để kết luận phù hợp. Origin Plant không được đồng thời khai báo có thành phần động vật (400).
- Recipe: `categoryId`, `name` (120), `servings` (1–10000), `instructions` (20000), `imageUrl` (URL http/https, tối đa 2048), `prepTimeMinutes`, `cookTimeMinutes` (0–10080) và `declaredDietaryType` bắt buộc; `declaredDietaryType` chọn đúng một trong các giá trị enum JSON: `"Vegan"`, `"LactoVegetarian"`, `"OvoVegetarian"`, `"LactoOvoVegetarian"`. `description` (2000) tùy chọn. Dinh dưỡng nullable: `caloriesPerServing`, `proteinGramPerServing`, `carbohydrateGramPerServing`, `fatGramPerServing`. `ingredients` bắt buộc có ít nhất một dòng: `{ ingredientId, quantity, unit, note }`; ID không trùng, quantity > 0, unit bắt buộc tối đa 40, note tối đa 500. PUT cập nhật toàn bộ danh sách này.
- Số thập phân tối đa 3 chữ số lẻ, tối đa 999999999; dinh dưỡng không âm. `null` nghĩa là chưa biết, không mặc định thành 0. Dinh dưỡng công thức mỗi khẩu phần được backend tính từ các mốc dinh dưỡng nguyên liệu đã khai báo. Bốn trường dinh dưỡng gửi trong request cũ chỉ được giữ tương thích và không quyết định kết quả lưu.
- Tên được trim và duy nhất không phân biệt hoa thường trong từng loại, kể cả bản ghi đã ngừng sử dụng. Response bổ sung `id`, `isActive`, `createdAt`, `updatedAt`; Recipe chi tiết bổ sung tên danh mục, tên và trạng thái của từng nguyên liệu. Danh sách Recipe trả tóm tắt, không gồm hướng dẫn và các dòng nguyên liệu.

## Phân loại chế độ ăn

Trang Admin chỉ lọc theo **Loại đã khai báo** (`declaredDietaryType`), không có lựa chọn chuyển sang lọc tương thích. API công khai vẫn hỗ trợ `dietaryType`: bộ lọc tương thích Lacto-ovo chấp nhận cả món Vegan/Lacto/Ovo; bộ lọc Ovo loại mọi món có sữa. Danh sách Admin hiển thị loại đã khai báo riêng; chi tiết vẫn hiển thị cả bốn kết quả tính từ nguyên liệu hiện tại, có thể thay đổi khi sửa nguyên liệu.

Nguyên liệu dùng bốn đơn vị: `g`, `kg`, `ml` và **Số lượng** (lưu `unit: "đơn vị"`). Trong form công thức, đơn vị lấy từ dữ liệu và chỉ đọc. Với Số lượng, `quantity` là số nguyên liệu cần dùng; có thể ghi rõ quả/cái trong `note`. Không tự quy đổi số lượng sang gram. Khi sửa công thức cũ, g/kg được đổi lượng tương ứng nếu biểu diễn được với 3 số lẻ; đơn vị khác không quy đổi được thì xóa định lượng để Admin nhập lại. Backend kiểm tra đơn vị khớp dữ liệu; danh sách đi chợ cộng theo cùng nguyên liệu và đơn vị.

FE nhập hướng dẫn theo từng bước, lưu vào `instructions` theo dạng `1. Nội dung\n2. Nội dung`; tổng tối đa 20000 ký tự. Công thức cũ vẫn đọc được, không cần migration.

Recipe summary và detail trả `dietaryAssessments` gồm bốn phần tử `{ dietaryType, status }` cùng `declaredDietaryType` Admin đã chọn.
Danh sách công thức (public và Admin) trả thêm `description` nullable, lấy cùng mô tả đã lưu như API chi tiết. FE hiển thị mô tả này trên thẻ; chỉ hiện “Chưa có mô tả.” khi dữ liệu thực sự để trống.
`status`: 0 Unknown, 1 Compatible, 2 Incompatible. Backend tính khi đọc từ ingredient hiện tại, không lưu cache có thể lỗi thời. Backend chỉ nhận `declaredDietaryType` khi kết quả tương ứng là `Compatible`; không thể dùng lựa chọn trên form để gắn nhãn sai cho công thức.

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
