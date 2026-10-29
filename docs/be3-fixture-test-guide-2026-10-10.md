# Dữ liệu mẫu và cách chạy 56 test case BE 3

Ngày 10/10/2026. Dùng với [bộ test case BE 3](archive/be3-test-cases-2026-10-09.md) trên LocalDB `(localdb)\MSSQLLocalDB`, database `VegetarianSupport`. Tài liệu này là **đầu vào cụ thể** cho từng case; kết quả mong đợi đầy đủ nằm trong bộ test case. Không sửa FE.

## Đã nạp vào SQL và file local

| Nhóm | Dữ liệu hiện có |
|---|---|
| Auth/profile | 3 tài khoản fixture: A và B là User, M là Admin; A ăn Vegan và dị ứng `đậu phộng`; B chưa chọn diet. Tài khoản vốn có trong DB được giữ nguyên. |
| BE 2 tham chiếu | 3 category, 7 ingredient, 6 recipe active có tiền tố `[Mẫu]`; category `10000000-0000-0000-0000-000000000001`, recipe `10000000-0000-0000-0000-000000000201`, ingredient nước mắm cá `10000000-0000-0000-0000-000000000107`. |
| Video/moderation | 9 video: Draft, Ready private, Upload failed, Published, Pending, Rejected, RevisionRequested, Removed, Admin only; 6 submission và quyết định Admin mẫu. |
| Chat | Conversation A/B và 2 message mỗi hội thoại, đánh dấu `[BE3 FIXTURE]`. |
| Scan | 11 kết quả lưu: nước dùng chưa rõ, nước mắm cá, thực vật, trứng, sữa, OCR sửa, nhãn thiếu, AI chưa xác nhận, dị ứng, catalog animal, bản sửa version 2. |

**Quan trọng:** Video fixture không dùng AI (`NotSubmitted`); message Assistant có chữ `[BE3 FIXTURE]` là dữ liệu mô phỏng. Các ca C-01..03, C-06..07, S-01, S-07..08 và S-15 cần thử luồng AI thật/AI lỗi riêng. File video/ảnh nằm trong `.local`, không ở SQL và không được đẩy lên GitHub.

### File để mở trên máy này

- ID hiện tại: [manifest.json](<D:/hoc2026/exe/New folder/VegetarianSupportSystem/.local/be3-fixtures/manifest.json>).
- Email/mật khẩu test **chỉ lưu local, Git bỏ qua**: [credentials.json](<D:/hoc2026/exe/New folder/VegetarianSupportSystem/.local/be3-fixtures/credentials.json>). Không gửi file này cho người khác hoặc commit.
- Import [Postman environment](<D:/hoc2026/exe/New folder/VegetarianSupportSystem/.local/be3-fixtures/postman-environment.json>) nếu dùng Postman. Biến `tokenA`, `tokenB`, `tokenM` ban đầu rỗng; đăng nhập từng tài khoản và điền `accessToken`. Swagger chỉ giữ một token tại một thời điểm, nên dùng **Authorize** lại khi đổi A/B/M.
- Thư mục tệp: [assets](<D:/hoc2026/exe/New folder/VegetarianSupportSystem/.local/be3-fixtures/assets>). `video.mp4` và `video.webm` phát được; `thumbnail.png`, `dish-photo.png` (ảnh tạo bằng imagegen), `dish-illustration.png`, `label-clear.png`, `label-blurry-cropped.png`, `invalid.mp4`, `invalid.jpg`, `oversize-image.png`, `oversize-video.mp4` dùng cho upload/boundary.

Đăng nhập tại `POST /api/auth/login` với email/mật khẩu trong `credentials.json`. Sau khi Authorize, gọi `GET /api/auth/me`; phải trả `200` và role đúng. Trong Postman dùng `{{baseUrl}}`, `{{video_public}}`, `{{submission_pending}}`, `{{scan_unknown_broth}}`... theo tên key trong environment. Guest G không gửi `Authorization`; G2 dùng cookie jar khác. Với Swagger, thay `{{...}}` bằng ID trong manifest.

### Payload dùng lại

**P-V** — tạo video mới; lưu `id` trả về thành `NEW_VIDEO`:

```json
{"title":"[BE3 TEST RUN] Video mới","description":"Nội dung thử kiểm duyệt","categoryId":"10000000-0000-0000-0000-000000000001"}
```

**P-D** — Admin decision; đổi `decision` thành `Approve`, `RequestRevision`, `Reject` hoặc `Remove`:

```json
{"decision":"Approve","reason":"Đã xem trực tiếp video trong ca thử"}
```

**P-C** — câu hỏi Chat:

```json
{"content":"Gợi ý công thức chay có đậu hũ"}
```

**P-U** — scan nước dùng chưa rõ:

```json
{"sourceType":"Dish","ingredients":[{"name":"đậu hũ","kind":"Plant","source":"UserConfirmed"},{"name":"nước dùng","kind":"Unknown","source":"UserConfirmed"}],"ingredientsComplete":false,"unknownAnswers":["Không biết nguồn gốc nước dùng"]}
```

**P-F** — nước mắm cá đã xác nhận:

```json
{"sourceType":"Dish","ingredients":[{"name":"nước mắm cá","kind":"Animal","source":"UserConfirmed"}],"ingredientsComplete":true,"unknownAnswers":[]}
```

**P-P** — đủ dữ kiện thực vật:

```json
{"sourceType":"Dish","ingredients":[{"name":"đậu hũ","kind":"Plant","source":"UserConfirmed"}],"ingredientsComplete":true,"unknownAnswers":[]}
```

**P-L** — OCR đã sửa/xác nhận:

```json
{"sourceType":"Label","correctedLabelText":"Tofu, egg, salt","labelIncomplete":false,"ingredients":[{"name":"đậu hũ","kind":"Plant","source":"UserEdited"},{"name":"trứng","kind":"Egg","source":"UserEdited"}],"ingredientsComplete":true,"unknownAnswers":[]}
```

`POST /api/food-scans/evaluate` dùng body P-U/P-F/P-P/P-L. Endpoint ảnh là `multipart/form-data`, field **`image`**; endpoint upload video là field **`file`**.

## BE3-01 — Video/storage (V-01..V-14)

| Case | Dữ liệu và thao tác cụ thể |
|---|---|
| V-01 | A `POST /api/me/videos` với P-V (`201`); lưu `NEW_VIDEO`; A `GET /api/me/videos/{NEW_VIDEO}` và `GET /api/me/videos?page=1&pageSize=20`. |
| V-02 | G/B `GET /api/videos/{{video_draft}}`, `/api/videos/{{video_draft}}/media`, `/thumbnail`; B `GET /api/me/videos/{{video_draft}}`. Tất cả nội dung nháp riêng tư phải `404`. |
| V-03 | A `POST /api/me/videos/{NEW_VIDEO}/media`, field `file=video.mp4`; `POST .../thumbnail`, `file=thumbnail.png`; A `GET /api/videos/{NEW_VIDEO}/media`. Có thể dùng `{{video_private_ready}}` để thử đọc owner mà không tạo mới. |
| V-04 | Sau V-03, A `POST /api/me/videos/{NEW_VIDEO}/submit` hai lần; lưu `NEW_SUBMISSION` từ lần đầu, lần hai `409`. |
| V-05 | A tạo video mới P-V nhưng **không upload**, rồi gọi `/submit` (`409`). Video `{{video_upload_failed}}` đã có trạng thái Failed; thử một draft mới với `file=invalid.mp4` để nhận `400`. |
| V-06 | Dùng draft mới cho mỗi file: `oversize-video.mp4` (>200 MB), `thumbnail` với `oversize-image.png` (>10 MB), `invalid.mp4`, `invalid.jpg`, file rỗng. Kiểm tra `400/413`, không xuất bản. |
| V-07 | G `GET /api/videos`, `/api/videos/{{video_public}}`, `/media`, `/thumbnail`. Gửi `Range: bytes=0-99` tới `/media`; phải nhận `206`. `{{video_public}}` là bản Published mẫu. |
| V-08 | G `POST /api/videos/{{video_public}}/views` hai lần cùng cookie; G2 một lần; so `viewCount` trước/sau bằng `GET /api/videos/{{video_public}}`. Dùng `{{video_removed}}` để thử `404`. |
| V-09 | B `GET/PUT /api/me/videos/{{video_private_ready}}`, `POST .../media`, `POST .../submit` bằng JWT B; thử P-V làm body PUT và `video.mp4` làm file. Phải không sửa được video A. |
| V-10 | Sau các ca đọc public, A `PUT /api/me/videos/{{video_public}}` với `{ "title":"[BE3 TEST RUN] Bản sửa", "description":"Chưa duyệt", "categoryId":null }`; G vẫn thấy tiêu đề Published cũ. |
| V-11 | Tiếp V-10: A upload `video.webm` vào `{{video_public}}`, gửi `/submit` để lấy ID bản mới. G xem `/media` vẫn nhận bản cũ; A/M xem `/media?submissionId={ID mới}`; G/B với query đó phải `404`. |
| V-12 | A tạo/sửa với `title:""`, title 201 ký tự, category GUID không tồn tại; GET list với `page=0`/`pageSize=101`. Mong đợi `400`. |
| V-13 | Với draft mới, dùng Postman/curl đặt tên multipart `filename=../outside.mp4` nhưng bytes là `video.mp4`; sau upload kiểm tra DB `Videos.MediaKey` chỉ là GUID `.mp4`. Truy cập `http://localhost:5080/.local/media/...` phải không trả file. |
| V-14 | Chạy **instance test riêng** với `Storage:PrivateRoot` trỏ đến **một file đang tồn tại** thay vì thư mục (ví dụ `.local/be3-fixtures/storage-blocker`), upload `video.mp4` vào draft riêng; mong `503/Failed`. Đổi lại storage root hợp lệ rồi retry. Không đổi root của instance chính. |

## BE3-02 — Moderation (M-01..M-13)

| Case | Dữ liệu và thao tác cụ thể |
|---|---|
| M-01 | A/B/G `GET /api/moderation/submissions/{{submission_pending}}`; A xem list `?contentType=Video&page=1&pageSize=20`. A `200`, B `404`, G `401`. |
| M-02 | Dùng `NEW_SUBMISSION` từ V-04, GET chi tiết ngay sau submit; kiểm `aiFlagStatus=NotSubmitted`, `adminReviewStatus=PendingAdminReview`, các trường kết quả AI `null`. |
| M-03 | Instance không có Gemini key: A tạo/upload/submit video mới, xác nhận ID vẫn có trong queue Admin. A thử `POST /api/moderation/submissions/{ID}/retry-ai`; mong `409`. |
| M-04 | M `GET /api/admin/moderation/submissions/queue?contentType=Video`; dùng `{{submission_pending}}` hoặc bản mới đã gửi, xem video trực tiếp rồi `POST .../{id}/decisions` với P-D. Sau quyết định fixture pending sẽ thành Published. |
| M-05 | G/A/B `GET /api/admin/moderation/submissions/queue`; A/B thử `POST .../{{submission_pending}}/decisions` P-D. G `401`, A/B `403`. Chạy trước M-04 để pending còn trong queue. |
| M-06 | Đọc `{{submission_revision_requested}}`, `{{submission_rejected}}` để xem log mẫu. Để kiểm quyết định ghi thật, tạo hai video mới, upload/submit, M gửi P-D đổi thành `RequestRevision`/`Reject`; A sửa/gửi phiên bản sau RevisionRequested. |
| M-07 | G đọc `{{video_removed}}` và M đọc `{{submission_removed}}` để xem trạng thái Removed mẫu. Để kiểm thao tác Remove thật, M gửi `Remove` với lý do trên một video mới đã Published. |
| M-08 | M thử Approve lại `{{submission_public}}`, Remove `{{submission_rejected}}` khi không Published, và body `{ "decision":"Approve", "reason":"" }`. Kỳ vọng `409`/`400` tương ứng. |
| M-09 | Sau V-11, M thử Approve `{{submission_public}}` cũ và A thử retry AI bản video cũ. Bản Published cũ giữ nguyên đến khi bản mới được duyệt. |
| M-10 | M `GET /api/admin/moderation/submissions/queue?contentType=Video&aiStatus=NotSubmitted&page=1&pageSize=1`; thử `page=0`, `pageSize=101`. A list `?contentType=Video&page=1&pageSize=1`. |
| M-11 | A `POST /api/moderation/submissions` body `{ "contentId":null, "contentType":"Video", "title":"[BE3 TEST]", "textContent":"Mô tả", "mediaReference":null }`; phải `400`, dùng `/api/me/videos/{id}/submit` thay thế. |
| M-12 | A gửi body M-11 nhưng `contentType:"Article"`; hiện trả `503` vì backend Article/version của BE 1 chưa tích hợp. Không tạo Article giả trong SQL. |
| M-13 | Dùng `NEW_SUBMISSION` của V-04 có mô tả bất kỳ; chờ qua vài chu kỳ worker rồi đọc lại. Trạng thái phải vẫn là `NotSubmitted`, các trường AI `null`; Admin tự xem video và quyết định. |

## BE3-03 — Chat Guest/User (C-01..C-12)

| Case | Dữ liệu và thao tác cụ thể |
|---|---|
| C-01 | G `GET /api/ai-chat/guest/session`, giữ cookie, `POST /api/ai-chat/guest/messages` với P-C; cần Gemini key hoạt động để nhận `Answered` và remaining 2. |
| C-02 | Cùng cookie G gửi P-C thêm hai lần rồi lần thứ tư; lần thứ tư `429`. G2 mở cookie jar khác và GET session còn 3. |
| C-03 | Instance test không có key/provider lỗi: G gửi P-C; `503 Unavailable`, remaining không giảm. |
| C-04 | A gọi `/api/ai-chat/guest/session` và `/guest/messages` (P-C) với JWT; G `GET /api/ai-chat/conversations`. A `403`, G `401`. |
| C-05 | A `POST /api/ai-chat/conversations` để kiểm `201`; đọc list/detail. `{{conversationA}}` là hội thoại có history mẫu sẵn. |
| C-06 | **Gemini thật:** A tạo conversation mới ở C-05, `POST /api/ai-chat/conversations/{ID mới}/messages` P-C, rồi GET `/messages`; assistant mới phải là phản hồi provider. Không dùng conversation chứa dòng `[BE3 FIXTURE]` để kết luận chất lượng AI. |
| C-07 | Instance không key: A gửi P-C vào conversation mới; `answerStatus=Unavailable`, userMessage vẫn có trong history, assistant mới `null`. |
| C-08 | B GET `/api/ai-chat/conversations/{{conversationA}}`; B GET/POST `/api/ai-chat/conversations/{{conversationA}}/messages` (POST body P-C); tất cả phải `404`. A vẫn xem được hội thoại của mình. |
| C-09 | A gửi `{ "content":"" }`, `{ "content":"   " }`, chuỗi dài 4001 ký tự; list/history với `page=0`, `pageSize=101`; kỳ vọng `400`. |
| C-10 | A gửi P-C khi recipe seed active tồn tại; `recipeSuggestions[].id` phải là recipe thật, ví dụ `10000000-0000-0000-0000-000000000201`, tra lại qua `GET /api/recipes/{id}`. |
| C-11 | A có profile Vegan và dị ứng đậu phộng; B chưa có diet. Cả hai hỏi “Gợi ý món với đậu phộng”; không được lộ hồ sơ A cho B/Guest. Muốn thử B có diet khác thì PUT profile B sau ca S-02. |
| C-12 | A hỏi `{ "content":"Lập thực đơn 7 ngày cho tôi" }`; so danh sách meal plan đã lưu trước/sau. Chat không tự tạo meal plan chỉ từ câu trả lời. |

## BE3-04 — Scan/OCR/history (S-01..S-17)

| Case | Dữ liệu và thao tác cụ thể |
|---|---|
| S-01 | G rồi A `POST /api/food-scans/dish-image`, field `image=dish-photo.png`; A thử `/label-image` với `label-clear.png`. G `401`. Ca AI thật cần Gemini key; ảnh chỉ gợi ý, không khẳng định nước dùng. |
| S-02 | B (chưa chọn diet) `POST /api/food-scans/evaluate` với P-P; `409`, history B không tăng. Làm trước khi thay profile B ở C-11. |
| S-03 | A POST `/evaluate` với P-U; so với `{{scan_unknown_broth}}` đã seed; GET `/api/food-scans/{id}` và `/history`. Bốn trạng thái `InsufficientInformation`. |
| S-04 | A POST `/evaluate` P-F; so với `{{scan_fish_sauce}}`. Thêm `{"name":"nước dùng","kind":"Unknown","source":"UserConfirmed"}` nếu muốn kiểm “vi phạm đã rõ thắng phần chưa rõ”. |
| S-05 | A POST `/evaluate` P-P; so `{{scan_plant}}`, bốn chế độ `SuitableBasedOnProvidedInformation`. |
| S-06 | A POST `/evaluate` với P-P nhưng ingredient lần lượt `{"name":"trứng","kind":"Egg","source":"UserConfirmed"}` và `{"name":"sữa","kind":"Dairy","source":"UserConfirmed"}`; so `{{scan_egg}}`/`{{scan_dairy}}`. |
| S-07 | A `POST /api/food-scans/label-image`, field `image=label-clear.png`; sửa text nếu OCR khác, POST `/evaluate` P-L; so `{{scan_label_corrected}}`. |
| S-08 | A OCR `label-blurry-cropped.png`; kết quả AI có thể khác nhau. Kiểm chắc phần rule bằng P-P đổi `sourceType:"Label"`, `labelIncomplete:true`, `correctedLabelText:"Tofu, ..."`; so `{{scan_label_incomplete}}`. |
| S-09 | A POST P-P nhưng `source:"AiSuggested"`, lặp lại `source:"LabelOcr"`; so `{{scan_unconfirmed_ai}}`, đều Insufficient. |
| S-10 | B `GET /api/food-scans/{{scan_unknown_broth}}` (`404`), B `/history` không chứa ID A; G GET detail/history (`401`). |
| S-11 | A POST P-P thêm `"previousScanId":"{{scan_unknown_broth}}"`; so với `{{scan_revision}}` có `resultVersion=2`. B dùng ID của A trong same body phải `400`. |
| S-12 | A `GET /api/profile/me` thấy dị ứng `đậu phộng`; POST P-P đổi ingredient thành `{"name":"đậu phộng","kind":"Plant","source":"UserConfirmed"}`; so `{{scan_allergy}}`, cảnh báo tách riêng. Nếu sửa/xóa dị ứng để thử snapshot, làm sau các ca khác rồi kiểm bản cũ không đổi. |
| S-13 | A POST P-P đổi ingredient thành `{"name":"[Mẫu] Nước mắm cá","kind":"Plant","source":"UserConfirmed"}`; so `{{scan_catalog_animal}}`. Catalog ID `10000000-0000-0000-0000-000000000107` phải xuất hiện trong `catalogEvidence` và kết quả Incompatible. |
| S-14 | Upload `dish-photo.png`, `label-clear.png`, `oversize-image.png`, `invalid.jpg`, file rỗng; thử đổi tên file nhưng giữ bytes PNG. Chữ ký/dung lượng quyết định `200/400/413`, không dựa vào extension. |
| S-15 | Instance không có Gemini key: upload `dish-photo.png` vào `/dish-image` và `label-clear.png` vào `/label-image`; mong `503 AnalysisFailed`, không ghi scan giả. |
| S-16 | A POST `/evaluate` với P-P nhưng đổi `sourceType:"Other"`; lặp với 101 ingredients, name rỗng, name 201 ký tự, `correctedLabelText` 10001 ký tự, `unknownAnswers` 31 phần tử. Tất cả `400`, history không tăng. |
| S-17 | A `GET /api/food-scans/history?page=1&pageSize=1`, `page=0`, `pageSize=101`; GET `{{scan_unknown_broth}}` sau khi đổi profile A, profileSnapshot cũ không đổi. |

## Kiểm tra SQL và chạy lại seed

```sql
SELECT Title, UploadStatus FROM Videos WHERE Title LIKE N'[[]BE3 TEST]%';
SELECT AiFlagStatus, AdminReviewStatus, COUNT(*) AS SoBan FROM ModerationSubmissions GROUP BY AiFlagStatus, AdminReviewStatus;
SELECT SourceType, ResultVersion, COUNT(*) AS SoBan FROM FoodScanRecords GROUP BY SourceType, ResultVersion;
```

Lệnh tạo lại fixture trên database **đã có migration**, từ thư mục gốc repo:

```powershell
dotnet run --project backend/src/Api/Api.csproj --configuration Release -- --seed-core-data
python -m pip install --target .local/be3-fixtures/python imageio-ffmpeg
python -m pip install pillow
python backend/tests/Be3Fixtures/generate_media.py
python backend/tests/Be3Fixtures/seed_be3.py
python backend/tests/Be3Fixtures/verify_be3.py
```

Máy cần Python, Pillow, `sqlcmd`, LocalDB và API đang chạy ở `http://localhost:5080`. Seed có thể chạy lại mà không nhân đôi fixture hiện có; **không tự hoàn nguyên trạng thái đã bị test thay đổi**. Cần database test mới để chạy lại toàn bộ luồng từ đầu. Mật khẩu/JWT/Gemini key không nằm trong repo. Ảnh `dish-photo.png` được tạo bằng công cụ imagegen và lưu local; nếu thiếu, dùng ảnh món chay thật do người test tự chuẩn bị hoặc `dish-illustration.png` (AI có thể không nhận diện ảnh minh họa).
