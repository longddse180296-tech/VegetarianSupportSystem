# Thời lượng và âm thanh video

API giữ nguyên âm thanh có sẵn trong MP4/WEBM. Không thu âm, tạo giọng đọc hoặc chuyển mã; trình duyệt vẫn phải hỗ trợ codec của tệp.

## Cấu hình máy phát triển và deploy

Cài FFprobe qua gói FFmpeg theo hệ điều hành, hoặc tải build Windows từ https://www.gyan.dev/ffmpeg/builds/ (trang tải binary được FFmpeg giới thiệu). Kiểm tra SHA-256 của gói trước khi giải nén. Không commit executable, gói tải về hoặc tệp video thật vào Git.

- Có `ffprobe` trong PATH: không cần cấu hình thêm.
- Đường dẫn riêng: đặt `VideoMetadata__FfprobePath` đến executable. Development có thể đặt trong `backend/.env` được Git bỏ qua. Cấu hình chỉ rõ executable, không kèm tham số shell.
- Máy local của đợt sửa này dùng `.local/tools/ffprobe.exe`; không đổi PATH hệ thống. Khi chuyển máy/deploy cần cài công cụ và cấu hình tương ứng.
- Áp dụng migration `AddVideoMediaMetadata` trước khi khởi động bản API mới; migration chỉ tạo bảng metadata, không sửa tệp/video hiện có.

## Luồng và giới hạn

FE dùng `loadedmetadata` để preview thời lượng tệp được chọn. Backend tự đọc bằng FFprobe, lưu thời lượng chính xác dạng giây và cờ có audio stream. Nhận biết có audio stream không đồng nghĩa có lời nói hoặc có tiếng trong mọi đoạn.

Metadata gắn với khóa tệp thay vì ID video để không nhầm bản công khai với tệp nháp mới. Worker tự bổ sung video cũ theo lô 10 mỗi phút; tệp thiếu/hỏng giữ null và thử lại sau một giờ. Không có tệp thì không thể khôi phục thời lượng từ tiêu đề/ID. Không tự tạo số phút.

Trình phát public, owner và Admin có nút âm lượng; âm thanh được giữ nguyên. Không thêm autoplay có tiếng. Trong form upload, nếu trình duyệt chưa đọc được metadata vẫn cho backend kiểm tra; tệp không đọc được ở server bị từ chối với thông báo dễ hiểu.

## Bản đồ code

- Domain: `VideoMediaMetadata` kiểm tra thời lượng hợp lệ.
- Application/Videos: `VideoMetadataService` điều phối probe/lưu; `VideoService` chọn đúng metadata theo quyền và phiên bản.
- Infrastructure/Storage: `FfprobeVideoMediaProbe` chạy executable không qua shell, timeout và giới hạn đồng thời.
- Infrastructure/Persistence: repository/configuration/migration metadata; Infrastructure/BackgroundJobs: worker bổ sung.
- FE Videos: `utils/videoMetadata.ts`, `VideoFileMetadata`, adapter, danh sách/chi tiết/Profile; Admin dùng media đúng submission để hiển thị thời lượng thật.

Kiểm tra FFprobe trực tiếp: `ffprobe -v error -show_entries format=duration:stream=codec_type -of json <tep-local>`. Tài liệu: https://ffmpeg.org/ffprobe.html.

## Kiểm thử

`dotnet test backend/Backend.sln -c Release` chạy kiểm tra parser/Domain, metadata upload lỗi và snapshot. `npm test` kiểm tra định dạng, hủy preview và giải phóng object URL.

Kiểm thử API bằng tệp thật cần bộ tệp tổng hợp (không chứa dữ liệu người dùng): `audio.mp4` dài 2 giây có audio và `silent.webm` dài 3 giây không audio. Đặt `VIDEO_METADATA_TEST_FIXTURES` bằng đường dẫn thư mục này, cấu hình FFprobe như trên rồi chạy `dotnet run --project backend/tests/IntegrationTests -c Release`. Nếu không cung cấp fixture, bộ kiểm tra báo rõ bỏ qua phần video thật. Database và kho media kiểm thử được tạo riêng, xóa sau khi chạy; không dùng database ứng dụng.

Đợt xác minh 27/10/2026: backend build Release, 140 unit tests, 327 API checks (gồm 17 kiểm tra video thật), FE 41 tests/lint/build. Browser xác minh danh sách/chi tiết và preview đổi tệp 2 giây → 3 giây → bỏ chọn. Hai video cũ đã đọc được 24 và 26,52 giây; cả hai không có audio stream, vì vậy cần tải lên tệp có âm thanh nếu muốn nghe tiếng. Không thay hoặc tạo âm thanh cho video cũ.
