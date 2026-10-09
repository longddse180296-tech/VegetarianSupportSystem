# Bộ test case nghiệm thu BE 3 — Video, kiểm duyệt, AI chat, food scan

Ngày: 09/10/2026. Áp dụng cho API backend hiện tại trong `contracts/videos.md`, `contracts/moderation-aichat.md`, `contracts/food-scanning.md`. JSON dùng `camelCase`; enum gửi bằng tên string. Mã `A` là tài khoản User thứ nhất, `B` là User thứ hai, `M` là Admin, `G` là trình duyệt chưa đăng nhập. Mỗi người dùng một cookie jar riêng để kiểm tra session. Tích hợp giao diện thuộc nhóm FE, ngoài phạm vi nghiệm thu BE 3 của tài liệu này.

## Chuẩn bị

1. Dùng DB test đã áp dụng toàn bộ migration. Chạy API ở Development để mở `/swagger` hoặc lấy OpenAPI tại `/openapi/v1.json`. Không đưa khóa Gemini hoặc dữ liệu sức khỏe thật vào repo/báo cáo.
2. Đăng ký/đăng nhập hai User A, B qua `/api/auth/register` và `/api/auth/login`; tạo Admin M bằng cơ chế seed của Auth. Lưu JWT riêng. Chuẩn bị trình duyệt Guest G không có JWT và cookie mới. Một số ca cần thêm Guest G2 có cookie riêng.
3. Đặt diet của A thành `Vegan` bằng `PUT /api/profile/me/diet` với `{"diet":"Vegan"}`. Để B chưa chọn diet cho ca SC-02. Có thể tạo dị ứng test `đậu phộng` bằng `POST /api/profile/me/allergies` với `{"name":"đậu phộng"}` trước SC-12.
4. Chuẩn bị video MP4/WEBM ngắn có chữ ký tệp hợp lệ và phát được, ảnh thumbnail JPG/PNG/WEBP nhỏ, ảnh món ăn có đậu hũ/rau, nhãn rõ, nhãn mờ/cắt. Chuẩn bị tệp giả `.mp4` chứa text, ảnh giả `.jpg` chứa text, file 10 MB + 1 byte và 200 MB + 1 byte. Không dùng media thực của người dùng.
5. Với ca AI thành công, cấu hình `Gemini:ApiKey` **trên backend**, `AiChat:UseMockResponses=false`; kiểm tra tài khoản provider còn quota. Ca lỗi AI chạy trên instance không có key hoặc mô phỏng provider trả lỗi. Worker moderation quét định kỳ nên chờ trạng thái rời `Checking` trước khi kết luận, tối đa theo timeout test đã chọn (gợi ý 60 giây). AI không xác định nội dung bằng một câu trả lời cố định; kiểm tra schema, phạm vi và chuyển trạng thái.
6. Nếu cần kiểm tra gợi ý recipe/catalog evidence, DB test phải có recipe/ingredient active thật từ BE 2. Lấy ID bằng API tương ứng thay vì gắn ID giả. Dùng `GET /api/categories?page=1&pageSize=100` để lấy `categoryId` thật; nếu chưa có category, để `categoryId:null`.

**Quy ước:** `200/201/204` là HTTP kỳ vọng; `items`/`totalCount` dùng để kiểm tra phân trang. Đối với tệp quá giới hạn request ở tầng ASP.NET, chấp nhận `400` hoặc `413`, nhưng tuyệt đối không tạo media Published. Khi dùng Swagger/Postman, `multipart/form-data` phải đặt đúng tên field (`file` cho video, `image` cho scan).

## Luồng P0 nên chạy trước

`V-01 → V-02 → V-03 → V-04 → M-01 → M-02 → M-04 → V-07 → C-01 → C-05 → S-01 → S-03 → S-05 → S-07 → S-10`. Giữ lại `videoId`, `submissionId`, `conversationId`, `scanId` từ response, không tự tạo GUID.

## Dữ liệu mẫu

Tạo video (`POST /api/me/videos`):

```json
{"title":"Cách làm đậu hũ rau củ","description":"Video thử nghiệm BE 3","categoryId":null}
```

Quyết định Admin (`POST /api/admin/moderation/submissions/{submissionId}/decisions`):

```json
{"decision":"Approve","reason":"Đã xem video và phạm vi AI kiểm tra"}
```

Chat (`POST /api/ai-chat/guest/messages` hoặc `/api/ai-chat/conversations/{id}/messages`):

```json
{"content":"Gợi ý công thức chay có đậu hũ"}
```

Scan nước dùng chưa rõ (`POST /api/food-scans/evaluate`):

```json
{
  "sourceType":"Dish",
  "ingredients":[
    {"name":"đậu hũ","kind":"Plant","source":"UserConfirmed"},
    {"name":"nước dùng","kind":"Unknown","source":"UserConfirmed"}
  ],
  "ingredientsComplete":false,
  "unknownAnswers":["Không biết nguồn gốc nước dùng"]
}
```

Scan nước mắm đã xác nhận (đổi tên/nguyên liệu từ body trên):

```json
{
  "sourceType":"Dish",
  "ingredients":[{"name":"nước mắm cá","kind":"Animal","source":"UserConfirmed"}],
  "ingredientsComplete":true,
  "unknownAnswers":[]
}
```

Scan OCR cần sửa (`POST /api/food-scans/evaluate`):

```json
{
  "sourceType":"Label",
  "correctedLabelText":"Thành phần: đậu hũ, trứng",
  "labelIncomplete":false,
  "ingredients":[
    {"name":"đậu hũ","kind":"Plant","source":"UserEdited"},
    {"name":"trứng","kind":"Egg","source":"UserEdited"}
  ],
  "ingredientsComplete":true,
  "unknownAnswers":[]
}
```

## BE3-01 — Video và storage

| ID | Thao tác / dữ liệu | Kết quả mong đợi |
|---|---|---|
| V-01 | A tạo video bằng body mẫu; `GET /api/me/videos/{id}` và danh sách `/api/me/videos`. | `201`, nháp có ID/version; owner đọc được trong danh sách/chi tiết. |
| V-02 | G và B gọi `GET /api/videos/{id}`, `/media`, `/thumbnail` của nháp V-01; B gọi `/api/me/videos/{id}`. | `404` cho từng tài nguyên riêng tư; video không có trong danh sách public. |
| V-03 | A tải MP4/WEBM hợp lệ vào `/api/me/videos/{id}/media`, ảnh hợp lệ vào `/thumbnail`; đọc lại media bằng JWT A. | Upload `200`, `uploadStatus=Ready`; owner đọc được bytes đúng tệp, `Content-Type` phù hợp. |
| V-04 | A gửi duyệt video Ready bằng `/api/me/videos/{id}/submit`; thử gửi lặp ngay. | Lần đầu `200` trả submission của đúng `contentId`, owner, version; lần hai `409`, không tạo submission trùng. |
| V-05 | Tạo nháp khác rồi gửi duyệt trước khi upload, hoặc upload tệp `.mp4` chỉ chứa text rồi gửi duyệt. | Submit `409`; tệp sai `400` và `uploadStatus=Failed`; không có phiên bản Published. |
| V-06 | A thử upload video >200 MB, thumbnail >10 MB, tệp rỗng, tệp tên `.mp4` với chữ ký PNG, thumbnail `.jpg` với chữ ký text. | Bị từ chối (`400/413` như quy ước); đường dẫn/tên client không quyết định file lưu; không public hóa media. |
| V-07 | Sau M-04 Approve, G gọi danh sách/chi tiết, `/media`, `/thumbnail`; gửi Range `bytes=0-99` tới media. | Chỉ bản Published xuất hiện; media `200`, Range hợp lệ trả `206`/`Content-Range` và đúng đoạn bytes. |
| V-08 | G `POST /api/videos/{id}/views` hai lần trong cùng cookie jar; lấy chi tiết. G2 gửi một lần. | Mỗi session chỉ cộng 1 view; response `204`; viewCount tăng thêm khi dùng session khác. Nháp/gỡ: `404`. |
| V-09 | B thử `PUT /api/me/videos/{id}`, upload media/thumbnail, submit và xem owner detail của A. | Không sửa/đọc được video của A (`404`); dữ liệu và media không đổi. |
| V-10 | A sửa title/description/category hợp lệ khi nháp hoặc sau Published; kiểm tra bản public trước duyệt bản sửa. | Metadata của bản mới hiển thị với owner; bản Published cũ vẫn là bản public, gồm title/media cũ. |
| V-11 | Sau V-10, A upload bản mới và submit; G truy cập media public, A và M truy cập `?submissionId={id_mới}`. | G vẫn nhận bản Published cũ; A/M xem được bản gửi mới; G/B không xem được `submissionId` chưa duyệt. |
| V-12 | Nhập title rỗng/quá giới hạn, `categoryId` không có thật, page=0 hoặc pageSize=101 cho list. | `400` có thông điệp validation; không tạo/sửa dữ liệu sai. |
| V-13 | Cố dùng tên file chứa `../`, đường dẫn tuyệt đối hoặc URL bên ngoài trong tên upload; xem media bằng cách truy cập thẳng thư mục private trên web. | Server tự sinh storage key; không đọc file ngoài storage root; thư mục private không được serve tĩnh. |
| V-14 | Dừng/làm lỗi storage khi upload rồi khôi phục và tải lại. | Lỗi trả `503`, status `Failed`; retry upload hợp lệ về `Ready`; không có bản Published từ lần lỗi. |

## BE3-02 — Kiểm duyệt bài viết/video

| ID | Thao tác / dữ liệu | Kết quả mong đợi |
|---|---|---|
| M-01 | Lấy submission V-04 qua `GET /api/moderation/submissions/{id}` và list của A; B lấy cùng ID; G lấy cùng ID. | A `200`; B `404`; G `401`; version/owner/contentId khớp video. |
| M-02 | Có Gemini: chờ worker xử lý V-04, xem chi tiết submission. | `aiFlagStatus=Partial`; có `aiCheckedScope` tiêu đề/mô tả và `aiUncheckedScope` nói rõ âm thanh/khung hình; không có bằng chứng bịa từ media. `adminReviewStatus=PendingAdminReview`, chưa Published. |
| M-03 | Không có Gemini/provider lỗi: gửi video Ready mới, chờ worker; xem queue, thử `retry-ai` sau khi cấu hình lại. | AI `Failed`, không `Passed`, không vào queue; owner retry `200` về `Checking`, worker xử lý lại phiên bản hiện tại. Retry khi chưa Failed trả `409`. |
| M-04 | M gọi `GET /api/admin/moderation/submissions/queue`, xem chi tiết và Approve submission đang chờ bằng body mẫu. | Queue chỉ gồm `PendingAdminReview`; quyết định `200`, `adminReviewStatus=Published`; `decisions[]` lưu actor M, thời gian, lý do, version. |
| M-05 | B hoặc G gọi queue/decision; A (không Admin) gửi Approve. | G `401`, A/B `403`; không đổi trạng thái. |
| M-06 | M quyết định `RequestRevision` cho bản chờ; A chỉnh video, upload/gửi phiên bản kế; M quyết định `Reject` cho bản chờ khác. | Version mới tăng; mỗi quyết định lưu lý do/actor/time/version; bản bị RevisionRequested/Rejected không xuất hiện public. |
| M-07 | Với video đã Published, M gửi `Remove` có reason; G lấy detail/media sau đó. | `200`, trạng thái Removed; public detail/media `404`; nhật ký quyết định giữ nguyên. |
| M-08 | M thử Approve hai lần, Approve bản `Failed`/`Checking`, Remove bản chưa Published, hoặc gửi reason rỗng. | Chuyển trạng thái sai `409`, reason sai `400`; không phát sinh quyết định hợp lệ thứ hai. |
| M-09 | Khi đã submit phiên bản mới, gọi retry/Approve phiên bản cũ; để worker nhận kết quả AI muộn của phiên bản cũ. | Không ghi đè phiên bản hiện hành hoặc bản Published; thao tác trên bản cũ bị chặn theo trạng thái/version. |
| M-10 | Lọc queue/list theo `contentType`, `aiStatus`, page/pageSize; thử page=0/pageSize=101. | Dữ liệu lọc đúng và có phân trang; dữ liệu phân trang sai `400`. |
| M-11 | Gửi `POST /api/moderation/submissions` với `contentType=Video` và nội dung tùy ý. | `400`, hướng về `/api/me/videos/{id}/submit`; không tạo video/submission giả. |
| M-12 | Gửi `POST /api/moderation/submissions` với `contentType=Article` khi backend Article draft/version chưa tích hợp. | **Giới hạn tích hợp hiện tại:** `503`, không tạo submission. Khi BE 1 tích hợp, thay ca này bằng kiểm tra đúng article ID/owner/version và bản sửa chưa duyệt không thay bản Published. |
| M-13 | Đọc kết quả AI có cờ và xem `aiFlagType`, `aiPriority`, `aiFlagReason`, `aiEvidence`, `aiCheckedScope`, `aiUncheckedScope`; kiểm tra log không dùng kết quả mock trong luồng thật. | Cờ/lý do/bằng chứng gắn với văn bản đã phân tích; kết quả Partial chỉ rõ phần chưa phân tích. Chỉ Admin quyết định xuất bản. Endpoint `mock-ai-result` không được gọi trong quy trình nghiệm thu. |

## BE3-03 — Chat AI Guest/User

| ID | Thao tác / dữ liệu | Kết quả mong đợi |
|---|---|---|
| C-01 | G gọi `GET /api/ai-chat/guest/session`, giữ cookie rồi gửi 1 câu hỏi hợp lệ với Gemini hoạt động. | Session đầu `questionLimit=3`, `remainingQuestions=3`; câu trả lời `200`, `status=Answered`, remaining còn 2. Không có hồ sơ/ID conversation của User trong response. |
| C-02 | G gửi thêm 2 câu thành công với cùng cookie rồi gửi câu thứ 4; G2 kiểm tra session riêng. | G còn 0 lượt; lần thứ 4 `429 LimitReached`; G2 vẫn có 3 lượt. Đóng/mở request mà giữ cookie không reset quota. |
| C-03 | Tắt key/mô phỏng timeout hoặc lỗi Gemini, G gửi câu hỏi. | `503 Unavailable`, `answer=null`; remainingQuestions không giảm. Không hiện câu trả lời tĩnh. |
| C-04 | A có JWT gọi `/guest/session` và `/guest/messages`; G gọi `/conversations`. | A nhận `403` ở guest API; G nhận `401` ở user API. |
| C-05 | A `POST /api/ai-chat/conversations`; GET list và GET detail. | `201`, `id` thật; conversation có trong list của A, lấy detail `200`. |
| C-06 | A gửi câu hỏi vào conversation với Gemini hoạt động; đọc `/messages`. | `200 Answered`, lưu userMessage và assistantMessage thật; history tăng và đúng thứ tự cũ đến mới. |
| C-07 | A gửi câu khi Gemini không có key/timeout. | `200 answerStatus=Unavailable`, userMessage được lưu; `assistantMessage=null`, không có câu trả lời giả. |
| C-08 | B GET detail/history hoặc POST message vào conversation của A. | `404`, không lộ nội dung và không thêm message vào conversation A. |
| C-09 | Gửi content rỗng/chỉ khoảng trắng, 4001 ký tự; page=0/pageSize=0/101 ở list/history. | `400` với thông điệp validation; không lưu message sai. |
| C-10 | A hỏi “Gợi ý công thức chay...” khi DB có recipe active từ BE 2; tra từng `recipeSuggestions[].id` qua API recipe. | Mỗi ID tham chiếu recipe active thật; không có ID tưởng tượng. Nếu DB không có recipe active, mảng gợi ý có thể rỗng. |
| C-11 | Đặt diet và dị ứng test trong profile A, đặt profile B khác; hỏi cùng câu. Kiểm tra G trong session mới. | Backend chỉ tham chiếu dữ liệu hồ sơ đã khai báo của đúng User; G không có hồ sơ giả; không lộ hồ sơ B trong history A. |
| C-12 | Hỏi AI lập thực đơn 7 ngày rồi kiểm tra API meal plan đã lưu. | Chat có thể hướng người dùng sang luồng meal plan; không tự tạo kế hoạch đã lưu chỉ từ câu trả lời chat. |

## BE3-04 — Scan món ăn, OCR nhãn và lịch sử

| ID | Thao tác / dữ liệu | Kết quả mong đợi |
|---|---|---|
| S-01 | G POST ảnh hợp lệ vào `/api/food-scans/dish-image` và `/label-image`; A thử cùng ảnh với Gemini hoạt động. | G `401`; A `200 NeedsConfirmation`. Ảnh món trả nguyên liệu nhìn thấy/câu hỏi bổ sung; chỉ từ ảnh thì 4 đánh giá đều `InsufficientInformation`. |
| S-02 | B chưa chọn diet POST `/api/food-scans/evaluate` với nguyên liệu hợp lệ. | `409` yêu cầu chọn diet; không tạo history. |
| S-03 | A đánh giá body mẫu “nước dùng chưa rõ”; đọc `GET /api/food-scans/{id}` và `/history`. | `200`, tạo `scanId`; 4 chế độ `InsufficientInformation`, lưu unknownAnswers, time, resultVersion, profileSnapshot; có trong history. |
| S-04 | A đánh giá nước mắm cá đã xác nhận bằng body mẫu, dù có thêm nguyên liệu Unknown. | 4 chế độ `Incompatible`; không cần suy đoán từ ảnh. |
| S-05 | A đánh giá toàn thành phần Plant `UserConfirmed`, `ingredientsComplete=true`, không câu trả lời chưa rõ. | 4 chế độ `SuitableBasedOnProvidedInformation`; ngôn ngữ không khẳng định “100% an toàn” hay “đảm bảo không dị ứng”. |
| S-06 | A đánh giá trứng `Egg/UserConfirmed`, đủ thông tin; đánh giá sữa `Dairy/UserConfirmed` ở lần khác. | Trứng: Vegan/Lacto Incompatible, Ovo/LactoOvo Suitable. Sữa: Vegan/Ovo Incompatible, Lacto/LactoOvo Suitable. |
| S-07 | A POST ảnh nhãn rõ vào `/label-image`, sửa extractedText nếu cần, POST `/evaluate` với `sourceType=Label`, body OCR mẫu. | OCR `200 NeedsConfirmation`; kết quả đã sửa lưu `correctedLabelText`, ingredient source `UserEdited` và đánh giá theo dữ kiện xác nhận. |
| S-08 | POST ảnh nhãn mờ/cắt, hoặc đánh giá với `labelIncomplete=true` và chỉ nguyên liệu Plant. | OCR gắn `isIncomplete=true` khi không đọc đủ; đánh giá là `InsufficientInformation`, không tự điền phần thiếu hay tự coi là nguyên liệu thực vật. |
| S-09 | Đánh giá ingredient `Plant` nhưng source `AiSuggested` hoặc `LabelOcr`, `ingredientsComplete=true`. | Chưa xác nhận nên kết quả vẫn `InsufficientInformation`; đổi source thành `UserConfirmed/UserEdited` mới được xét là dữ kiện xác nhận. |
| S-10 | B đọc `scanId` của A và history của mình; G đọc history/chi tiết. | B lấy chi tiết `404`, history không chứa scan A; G `401`. |
| S-11 | A đánh giá lại S-03 với `previousScanId` và dữ liệu đã làm rõ; B dùng `previousScanId` của A. | A nhận ID mới, `resultVersion` tăng 1, bản cũ còn nguyên; B nhận `400` và không ghi kết quả. |
| S-12 | A tạo dị ứng test `đậu phộng`, đánh giá ingredient đậu phộng đã xác nhận rồi đổi/xóa dị ứng trong profile. | `allergyWarnings`/`allergyNote` tách khỏi `assessments`; bản scan cũ vẫn giữ profileSnapshot và cảnh báo tại thời điểm scan. |
| S-13 | Có ingredient catalog BE 2 trùng tên chính xác: đánh giá ingredient đã xác nhận; xem `catalogEvidence`. | Evidence lưu ID/nguồn/loại/dị nguyên từ catalog. Nếu catalog biết là nguồn động vật dù client chọn Plant/Unknown, phân loại theo evidence đã xác nhận. |
| S-14 | Gửi JPG/PNG/WEBP hợp lệ dưới 10 MB, tệp 10 MB + 1 byte, tệp rỗng, `.jpg` chứa text, `.png` với chữ ký JPEG. | Đúng chữ ký và dung lượng thì được phân tích; quá mức/rỗng/chữ ký sai bị `400/413`; loại không dựa vào extension hay Content-Type. |
| S-15 | Tắt key/lỗi Gemini khi gửi ảnh món/nhãn. | `503 AnalysisFailed`; không biến lỗi thành `Incompatible` và không lưu kết quả đánh giá giả. |
| S-16 | `/evaluate` với `sourceType` sai, >100 ingredients, tên rỗng hoặc >200 ký tự, correctedLabelText >10.000, >30 unknownAnswers. | `400` có validation; history không tăng. |
| S-17 | List history với page=1/pageSize=1, page=0/pageSize=101; kiểm tra chi tiết sau khi sửa profile. | Phân trang đúng `items,totalCount,page,pageSize`; input sai `400`; snapshot scan cũ bất biến khi profile đổi. |

## Ghi kết quả chạy test

| Test ID | Người chạy / ngày | Môi trường, build, dữ liệu | Actual HTTP / response tóm tắt | Pass / Fail / Blocked | Bằng chứng / bug ID |
|---|---|---|---|---|---|
| V-01 |  |  |  |  |  |

**Điều kiện Blocked hợp lệ:** test AI thành công thiếu Gemini key/quota; test recipe/catalog thiếu fixture BE 2; test Article M-12 đang chờ backend Article/version BE 1. Ghi rõ điều kiện vào cột môi trường. Không dùng `mock-ai-result` để đánh dấu các ca AI thật là Pass. Khi báo lỗi, kèm request body đã bỏ token/key, response, ID dữ liệu test và trạng thái trước/sau.
