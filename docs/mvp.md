# Vegetarian Support — Đặc tả chức năng MVP

Ngày cập nhật: 28/09/2026.

Nguồn: 34 màn hình chính đã đọc trong Figma và các quyết định trực tiếp của người dùng trong cuộc trao đổi. Ảnh bảng yêu cầu là tài liệu tham khảo; các tính năng mở rộng trong ảnh không tự động trở thành phạm vi MVP.

Figma: https://www.figma.com/design/1ty7t6IjfIsGbxi46hayJv/Vegetarian-Support-Portal-Design?node-id=0-1

Trạng thái: Đặc tả đã cập nhật. Chưa sửa canvas Figma vì công cụ trả lỗi hết hạn mức Figma MCP của gói Starter. Danh sách thay đổi ở cuối tài liệu là công việc cần thực hiện, không phải thay đổi đã áp dụng.

## 1. Quyết định về phạm vi

### Đã được người dùng xác nhận

- Chỉ có ba role: Guest, User, Admin. Chuyên gia, đầu bếp và tác giả không phải role riêng.
- Chỉ sử dụng thương hiệu Vegetarian Support.
- Không có chức năng thông báo, nhắc bữa ăn hoặc lịch ăn chay theo ngày lễ.
- Lịch bữa ăn thuộc kế hoạch thực đơn cá nhân hóa.
- Guest được chat AI dùng thử.
- Bài viết và video phải qua AI Flag Check, sau đó Admin duyệt trước khi xuất bản.
- Admin quản lý công thức, nguyên liệu và nhà hàng, ngoài thành viên/nội dung/danh mục.
- Thực đơn 7 ngày, 3 bữa chính mỗi ngày; chọn món từ kho công thức hệ thống, chưa sinh công thức mới ngoài kho.
- Giữ xuất PDF và danh sách đi chợ.
- Loại khỏi MVP: gửi Zalo/SMS, bản tin email, theo dõi kênh, đánh giá nhà hàng, đặt lịch chuyên gia, barcode và ứng dụng di động.

### Quyết định thiết kế được đề xuất để triển khai

- Scan yêu cầu đăng nhập. Người dùng đã giao đánh giá phương án Guest; đề xuất này giúp kết quả gắn với hồ sơ và lịch sử, không có nghĩa scan về kỹ thuật bắt buộc phải có tài khoản.
- Guest chat thông tin chung, dùng dữ liệu tự cung cấp trong phiên; không có lịch sử tài khoản hoặc hồ sơ đã lưu.
- Giữ mức thử mặc định 3 lượt hỏi thành công/phiên khách cho bản thiết kế; đây là mặc định đề xuất, chưa phải hạn mức kinh doanh đã được người dùng chốt. Không hiển thị “không giới hạn” cho User.
- Không triển khai trang quản lý/huấn luyện mô hình AI trong MVP. Nhật ký và kết quả AI phục vụ kiểm duyệt nội dung vẫn cần có.

## 2. Ma trận quyền

| Chức năng | Guest | User | Admin |
|---|---|---|---|
| Xem/tìm công thức, bài viết, video đã xuất bản | Có | Có | Có |
| Tìm nhà hàng, xem bản đồ/chỉ đường | Có, vị trí khi được cho phép | Có | Có |
| Chat AI | Dùng thử, thông tin chung | Có, sử dụng hồ sơ | Có |
| Scan món ăn/nhãn thành phần | Xem giới thiệu, đăng nhập để dùng | Có | Có nếu có hồ sơ cá nhân |
| Hồ sơ ăn chay, dị ứng, chỉ số cơ thể | Không lưu | Quản lý hồ sơ của mình | Quản lý hồ sơ của mình |
| Lập/lưu thực đơn, lịch bữa ăn, PDF, danh sách đi chợ | Đăng nhập để dùng | Có | Có |
| Tủ bếp và gợi ý cá nhân hóa | Đăng nhập để dùng | Có | Có |
| Lưu công thức/video/nhà hàng | Không | Có | Có |
| Bình luận, phản hồi, đánh giá hữu ích | Không | Có | Có |
| Tạo và quản lý bài viết/video | Không | Nội dung của mình | Quản trị nội dung; nội dung Admin tự tạo cũng được kiểm tra AI |
| Duyệt/gỡ nội dung | Không | Không | Có |
| Quản lý thành viên, công thức, nguyên liệu, nhà hàng, danh mục | Không | Không | Có |

Quyền phải kiểm tra ở phía hệ thống, không chỉ ẩn nút trên giao diện. Guest là trạng thái chưa đăng nhập, không cần tài khoản Guest trong cơ sở dữ liệu.

## 3. Tài khoản và hồ sơ

- Đăng ký bằng họ tên, email, mật khẩu và xác nhận mật khẩu; xác thực dữ liệu nhập.
- Đăng nhập, ghi nhớ phiên, đăng xuất; quên và đặt lại mật khẩu qua email.
- Chỉnh sửa thông tin cá nhân và khu vực tìm nhà hàng.
- Chế độ ăn: Vegan, Lacto-vegetarian, Ovo-vegetarian, Lacto-ovo vegetarian.
- Khai báo dị ứng và thực phẩm cần tránh; sửa hoặc xóa từng mục.
- Khai báo tuổi, giới tính dùng trong công thức ước tính năng lượng, chiều cao, cân nặng, mức vận động và mục tiêu.
- Tính BMI/TDEE bằng phương pháp được định nghĩa nhất quán trong hệ thống; không để chatbot tự quyết định công thức hoặc ngưỡng phân loại.
- Kết quả dinh dưỡng là ước tính tham khảo. Không trình bày thành chẩn đoán y khoa.
- Hồ sơ dùng chung cho thực đơn, tủ bếp, AI và scan. Scan hoặc thực đơn lưu trước đó giữ dấu vết hồ sơ tại thời điểm đánh giá, không tự đổi kết quả cũ khi cập nhật hồ sơ.

## 4. Nội dung công khai và tương tác

### Công thức

- Tìm theo tên/nguyên liệu; lọc theo danh mục, chế độ ăn, thời gian và calo; sắp xếp, phân trang.
- Xem khẩu phần, nguyên liệu và định lượng, cách nấu, thời gian, dinh dưỡng tham khảo.
- Lưu yêu thích; liên kết đến bài viết, video và nhà hàng liên quan.
- Nguyên liệu và thông tin chế độ ăn lấy từ dữ liệu Admin quản lý.

### Bài viết

- Tìm kiếm, lọc chủ đề, xem danh sách/chi tiết/bài liên quan.
- User tạo nội dung, chọn danh mục, ảnh đại diện, lưu nháp, xem trước và gửi duyệt.
- User xem/sửa/xóa nội dung của mình; theo dõi trạng thái, lý do yêu cầu sửa hoặc từ chối ngay trong trang quản lý nội dung.
- Đánh giá hữu ích và bình luận/phản hồi; thích, sửa/xóa bình luận của mình.

### Video

- Tìm kiếm, lọc danh mục/thời lượng, xem chi tiết và video liên quan; thích, lưu, chia sẻ bằng liên kết.
- User tải video, nhập tiêu đề/mô tả/danh mục/ảnh đại diện, lưu nháp, xem trước và gửi duyệt.
- Thể hiện xử lý tệp, lỗi tải lên, đang AI kiểm tra, chờ Admin, yêu cầu sửa, bị từ chối, đã xuất bản và đã gỡ.
- Xem số lượt xem và tương tác thực tế; không cần trang phân tích nâng cao riêng cho MVP.
- Không có theo dõi kênh hoặc tóm tắt video thành công thức trong MVP. Trích lời nói phục vụ kiểm duyệt là xử lý nội bộ, không phải tính năng tóm tắt video cho User.

### Nhà hàng

- Tìm theo tên/khu vực, vị trí hiện tại, khoảng cách và chế độ ăn được khai báo.
- Xem bản đồ, địa chỉ, liên hệ, giờ hoạt động, giá tham khảo, tiện ích và món liên quan; chỉ đường qua bản đồ.
- Lưu yêu thích. Không có đặt bàn, đặt món/thanh toán hoặc đánh giá nhà hàng trong MVP.
- Thể hiện nguồn thông tin và thời điểm cập nhật khi cần; nhãn chế độ ăn không phải bảo đảm từng món thực tế dùng đúng nguyên liệu.

## 5. Quy trình AI Flag Check và Admin duyệt

### Luồng chính

Bản nháp → Gửi duyệt → AI đang kiểm tra → AI hoàn tất → Chờ Admin → Đã xuất bản / Yêu cầu chỉnh sửa / Bị từ chối.

- Mọi bài viết/video gửi xuất bản đều qua hai bước. AI không gắn cờ vẫn phải chờ Admin.
- AI chỉ cung cấp tín hiệu và bằng chứng, không tự xuất bản, xóa nội dung hoặc khóa tài khoản.
- Kết quả AI được lưu riêng với quyết định Admin; không dùng một trạng thái chung gây nhầm lẫn.
- Kết quả AI gồm: không phát hiện vấn đề trong phạm vi đã kiểm tra, có cờ cần xem xét, kiểm tra chưa đầy đủ, lỗi xử lý.
- Lỗi AI không được coi là đạt; nội dung vẫn chưa công khai. Cho thử lại. Nếu chỉ kiểm tra được một phần, Admin thấy rõ phần chưa kiểm tra và phải xem trực tiếp trước quyết định.
- Admin có thể không đồng ý với cờ AI; quyết định cần lý do và được ghi nhật ký.
- Sau yêu cầu sửa/từ chối, User sửa và gửi lại sẽ tạo phiên bản kiểm tra mới.
- Khi sửa nội dung đang công khai: giữ phiên bản đã được duyệt; bản sửa là phiên bản riêng, chỉ thay thế sau AI kiểm tra và Admin duyệt.
- Nội dung đã xuất bản bị AI gắn cờ sau đó vẫn cần Admin xem xét trước khi gỡ theo quy tắc trong tài liệu tham khảo.

### Phạm vi AI kiểm tra

- Bài viết: tiêu đề, nội dung, ảnh đại diện/ảnh đính kèm được hỗ trợ.
- Video: tiêu đề, mô tả, ảnh đại diện, lời nói được trích xuất và hình ảnh video theo khả năng xử lý đã triển khai.
- Gắn cờ spam, nội dung xúc phạm/không phù hợp, quảng cáo trái quy định cộng đồng, tuyên bố sức khỏe cần kiểm chứng hoặc nội dung không liên quan.
- Mỗi cờ có loại, mức ưu tiên, lý do và đoạn văn/ảnh/mốc thời gian liên quan nếu có.
- Không nói “video đã an toàn hoàn toàn” nếu chỉ đọc tiêu đề hoặc kiểm tra một số khung hình. Luôn cho Admin biết phạm vi đã phân tích.

### Giao diện Admin cần có

- Hàng đợi bài viết/video, lọc theo loại, trạng thái AI, có cờ và thời điểm gửi.
- Màn hình chi tiết: nội dung, kết quả AI, bằng chứng, phiên bản, lịch sử xử lý.
- Hành động: duyệt xuất bản, yêu cầu chỉnh sửa, từ chối, gỡ nội dung đã xuất bản; nhập lý do.
- Nhật ký ghi người quyết định, thời gian, phiên bản và lý do. Không cần chức năng thông báo: User xem kết quả tại “Bài viết/Video của tôi”.
- Kiểm duyệt bình luận tiếp tục do Admin quản lý; chưa mở rộng AI bắt buộc cho bình luận vì yêu cầu hiện tại chỉ nêu bài viết và video.

## 6. Lập thực đơn cá nhân hóa

- Đầu vào: hồ sơ cơ thể, mục tiêu, chế độ ăn, dị ứng, nguyên liệu sẵn có, thời gian nấu và sở thích.
- Đầu ra: 7 ngày × 3 bữa chính, tổng 21 vị trí bữa ăn; không cam kết 21 món khác nhau khi kho dữ liệu không đủ.
- Món phải có trong kho công thức đang hoạt động và có dữ liệu thành phần phù hợp.
- Kiểm tra điều kiện bắt buộc về chế độ ăn/dị ứng trước khi xếp hạng theo sở thích và mục tiêu dinh dưỡng.
- Không đủ món: báo rõ thiếu dữ liệu hoặc điều kiện quá hẹp; cho thay đổi sở thích mềm. Không tự bỏ dị ứng hoặc đổi chế độ ăn để đủ số bữa.
- Xem theo ngày/tuần, công thức chi tiết, đổi món, tạo lại, lưu, xem lại và áp dụng tuần mới.
- Tổng calo/protein/carbs/chất béo tính từ cùng dữ liệu khẩu phần; đổi món cập nhật tổng và danh sách đi chợ.
- Danh sách đi chợ tổng hợp nguyên liệu, cho đánh dấu đã có/đã mua. Có xuất PDF.
- Không có nhật ký calo đã ăn, thiết bị sức khỏe, nhắc ăn hay lịch ngày lễ.
- AI hỗ trợ gợi ý và giải thích; việc tuân thủ điều kiện bắt buộc không dựa hoàn toàn vào lời khẳng định của AI.

## 7. Chat AI và tủ bếp

### Guest

- Hỏi kiến thức chung về ăn chay, thay thế nguyên liệu và giải thích BMI/calo theo thông tin trong phiên.
- Có câu hỏi mẫu và số lượt dùng thử còn lại; khi hết lượt hiển thị đăng nhập/đăng ký.
- Không có hồ sơ đã đồng bộ, lịch sử tài khoản hay lưu thực đơn.
- Không lấy hạn mức theo phiên làm cam kết chống lạm dụng tuyệt đối; cách giới hạn phía hệ thống phải triển khai riêng.

### User

- Chat có tham chiếu hồ sơ đã khai báo; xem lịch sử và bắt đầu hội thoại mới.
- Kết quả gợi ý món liên kết đến kho công thức; chuyển sang màn hình lập thực đơn khi muốn tạo kế hoạch.
- Không biến câu trả lời trò chuyện thành thực đơn đã lưu nếu chưa qua kiểm tra điều kiện và thao tác lưu.

### Tủ bếp

- Thêm/sửa/xóa nguyên liệu và lượng có sẵn nếu biết.
- Kiểm tra nguyên liệu theo chế độ ăn, hiển thị nguyên liệu không phù hợp hoặc chưa rõ nguồn gốc.
- Gợi ý thay thế; chỉ áp dụng khi User chọn, không âm thầm đổi thành phần.
- Gợi ý công thức trong kho, chỉ rõ nguyên liệu có sẵn/cần mua và độ khớp được tính từ dữ liệu.
- Không đánh giá độ tươi hoặc an toàn thực phẩm từ ảnh.

## 8. Scan thực phẩm

Tên hiển thị: “Kiểm tra món ăn & thành phần”. Mục tiêu là hỗ trợ nhận diện và đánh giá theo bằng chứng, không chứng nhận món ăn thực tế là chay.

### 8.1. Quyền và đầu vào

- Guest được xem giới thiệu và ví dụ được ghi rõ là mẫu, có nút đăng nhập; chưa nhận hoặc xử lý ảnh của Guest.
- User chọn chế độ ăn và xác nhận dị ứng hiện tại; chưa có hồ sơ thì thiết lập trước khi đánh giá cá nhân hóa.
- Hai loại đầu vào: ảnh món ăn hoặc ảnh nhãn/bảng thành phần.
- JPG/PNG/WEBP, tối đa 10 MB theo thiết kế hiện có; có trạng thái tệp không hợp lệ, ảnh mờ, xử lý lỗi và thử lại.

### 8.2. Luồng ảnh món ăn

1. Tải ảnh và chọn phân tích món ăn.
2. AI gợi ý tên món, nguyên liệu có thể nhìn thấy và các yếu tố chưa xác định.
3. User sửa tên món/nguyên liệu bị nhận sai.
4. Hỏi bổ sung theo ngữ cảnh: nước dùng, nước mắm, dầu hào, mỡ, trứng, sữa, gelatin... Mỗi câu có lựa chọn “Không biết”.
5. Hiển thị đánh giá theo từng chế độ ăn và đối chiếu hồ sơ hiện tại.
6. Gợi ý nguyên liệu/công thức thay thế và lưu kết quả; cho bổ sung thông tin để đánh giá lại.

Không tự đưa thành phần ẩn vào danh sách “đã phát hiện”. Tên món “phở chay” do AI dự đoán hoặc nhà hàng đặt không đủ để chứng minh nguồn nước dùng và gia vị.

### 8.3. Luồng ảnh nhãn

1. Tải ảnh bảng thành phần.
2. OCR trích xuất chữ; đánh dấu phần mờ/thiếu/khó đọc.
3. User kiểm tra và sửa văn bản, chụp bổ sung nếu thiếu phần nhãn.
4. Đối chiếu tên thành phần và quy tắc ăn chay; phụ gia/hương liệu chưa rõ nguồn gốc giữ trạng thái cần xác minh.
5. Trả kết quả gắn với danh sách thành phần đã đọc/xác nhận, không tuyên bố đã xác minh quy trình sản xuất hoặc nhiễm chéo.

### 8.4. Mô hình kết quả

| Trạng thái theo từng chế độ | Điều kiện |
|---|---|
| Phù hợp theo thông tin đã cung cấp | Có thông tin thành phần cần thiết, không còn yếu tố chưa rõ ảnh hưởng phân loại, không có thành phần vi phạm |
| Không phù hợp | Có ít nhất một thành phần vi phạm được xác nhận từ dữ liệu cung cấp |
| Chưa đủ thông tin | Chưa có vi phạm đã xác nhận nhưng còn thành phần/nguồn gốc có thể thay đổi kết luận |

- Phân loại riêng cho Vegan, Lacto, Ovo và Lacto-ovo; một món có thể phù hợp nhiều chế độ.
- Có thành phần vi phạm đã xác nhận thì kết luận không phù hợp cho chế độ liên quan dù vẫn còn thành phần khác chưa biết.
- Lỗi phân tích/không đọc được ảnh là trạng thái xử lý, không phải kết quả “không phù hợp”.
- Nguồn từng dữ kiện: AI dự đoán từ ảnh / trích xuất từ nhãn / User xác nhận hoặc chỉnh sửa. Dữ kiện AI dự đoán vẫn không trở thành xác nhận chỉ vì độ tin cậy cao.
- Lưu giả định, câu trả lời chưa biết, hồ sơ tham chiếu, thời điểm và phiên bản kết quả.
- Không dùng phần trăm chính xác tự sinh hoặc các nhãn “100% an toàn”, “đã chứng nhận thuần chay”.
- Cảnh báo dị ứng tách khỏi phân loại chế độ ăn. “Không thấy trong thông tin cung cấp” không đồng nghĩa “không có dị nguyên”.

### 8.5. Ví dụ kết quả hiển thị

Món dự đoán: Phở với đậu hũ và nấm.

Có thể nhìn thấy: bánh phở, đậu hũ, nấm, rau thơm.

Chưa xác định: nước dùng, nước mắm/hạt nêm và dầu/mỡ chế biến.

Kết quả: Chưa đủ thông tin để đánh giá Vegan, Lacto, Ovo, Lacto-ovo.

Nếu User xác nhận có nước mắm cá: Không phù hợp cả bốn chế độ, lý do là thành phần nước mắm cá do User xác nhận.

Nếu User xác nhận đầy đủ thành phần là thực vật: Phù hợp theo thông tin đã cung cấp; không đổi thành lời bảo đảm về món ăn thực tế.

## 9. Admin quản lý dữ liệu cốt lõi

- Nguyên liệu: tên/biến thể tên, nguồn gốc thực vật/động vật/chưa rõ, thông tin trứng/sữa/mật ong, dị nguyên, đơn vị, dinh dưỡng và nguồn dữ liệu.
- Công thức: danh mục, nguyên liệu/định lượng, khẩu phần, cách nấu, thời gian, ảnh, dinh dưỡng, chế độ ăn tính từ thành phần, trạng thái hoạt động.
- Nhà hàng: tên, vị trí, địa chỉ, giờ mở cửa, liên hệ, giá tham khảo, tiện ích, chế độ ăn được khai báo, món liên quan và trạng thái.
- Danh mục: tạo/sửa/ngừng sử dụng; xem nội dung liên kết. Dữ liệu đang được tham chiếu không xóa làm hỏng thực đơn hoặc lịch sử.
- Thành viên: tìm/lọc/xem nội dung liên quan, khóa/mở khóa có lý do; không thêm role ngoài ba role đã chốt.
- Dashboard: thống kê thực tế, hàng đợi duyệt và hoạt động gần đây. Không trình bày số liệu demo như số liệu vận hành.

## 10. Danh sách thay đổi Figma — chưa áp dụng

| Màn hình/node hiện tại | Thay đổi cần làm |
|---|---|
| Tất cả header/footer | Thống nhất Vegetarian Support; bỏ chuông thông báo, tên An Lạc Dưỡng, liên kết tính năng ngoài MVP và cam kết chưa có căn cứ |
| 103:389 — Trang chủ | Chat thử dành cho Guest; scan dẫn tới đăng nhập; số liệu demo có nhãn hoặc thay bằng nội dung không định lượng |
| 103:1387 — Bài viết | Bỏ đăng ký bản tin email |
| 103:2823 — Chi tiết video | Bỏ theo dõi kênh; giữ thích/lưu/chia sẻ/bình luận |
| 103:6813 — Trợ lý AI | Tách trạng thái Guest/User; Guest không hiện hồ sơ và lịch sử đã đồng bộ |
| 103:7298 — Scan | Thay kết luận phát hiện thành phần ẩn bằng luồng nhận diện → xác nhận → hỏi bổ sung → kết quả có điều kiện |
| 103:7853 — Tủ bếp | Phân biệt thông tin đã xác nhận/chưa rõ; bỏ bảo đảm an toàn tuyệt đối |
| 103:4330, 103:4842, 103:5610 — Thực đơn | Thống nhất 7 ngày/3 bữa; bỏ nhắc ăn, số liệu không thống nhất và cam kết 21 món không trùng |
| 103:6197, 104:14881 — Thực đơn dinh dưỡng | Bỏ bữa phụ khỏi kế hoạch MVP; cập nhật tổng calo, danh sách đi chợ; bỏ gửi Zalo/tin nhắn |
| 104:8447 — Soạn bài | Nút gửi duyệt thay xuất bản trực tiếp; thêm trạng thái AI và phản hồi Admin |
| 104:13109 — Bài viết của tôi | Thêm AI đang kiểm tra, chờ Admin, yêu cầu sửa, từ chối; xử lý phiên bản sửa |
| 104:15631 — Video của tôi | Bỏ lịch ngày lễ; thêm các trạng thái xử lý/AI/Admin, phản hồi và gửi lại |
| 104:9040 — Đăng ký | Bỏ lời giới thiệu đánh giá nhà hàng, chat không giới hạn và tính năng ngoài MVP |
| 104:13628, 104:14218 — Hồ sơ | Bỏ barcode/mobile, nhật ký hấp thu thực tế, chứng nhận y khoa và cam kết phát hiện mọi thành phần ẩn |
| 104:10071 — Admin Dashboard | Thêm hàng đợi kiểm duyệt và liên kết công thức/nguyên liệu/nhà hàng |
| 104:10884, 104:11422 — Admin bài viết/video | Tách trạng thái AI và xuất bản; thêm bằng chứng, phản hồi, quyết định Admin |

### Màn hình/trạng thái bổ sung

- Scan cho Guest: giới thiệu + đăng nhập; không upload trước đăng nhập.
- Scan: chọn loại ảnh, xác nhận OCR/nguyên liệu, câu hỏi bổ sung, chưa đủ thông tin, phù hợp có điều kiện, không phù hợp, lỗi ảnh/phân tích và lịch sử chi tiết.
- Video: tạo/chỉnh sửa, tải tệp, tiến trình xử lý, gửi duyệt.
- Admin: chi tiết kiểm duyệt bài viết/video, kết quả AI, bằng chứng và nhật ký quyết định.
- Admin: danh sách và biểu mẫu chi tiết công thức, nguyên liệu, nhà hàng.
- Thực đơn: không đủ món phù hợp, thay món, danh sách đi chợ và xuất PDF.

## 11. Tiêu chí nghiệm thu nghiệp vụ

1. Guest mở chatbot và hỏi được trong hạn mức thử; không có hồ sơ đã lưu được giả lập.
2. Guest vào scan thấy đăng nhập; đăng nhập xong quay lại scan.
3. Ảnh phở không có dữ liệu nước dùng/gia vị trả “Chưa đủ thông tin”, không tự kết luận Vegan.
4. User chọn “Không biết” không bị ép trả lời và kết quả vẫn giữ phần chưa rõ.
5. Có nước mắm cá được xác nhận → không phù hợp cả bốn chế độ.
6. Trứng được xác nhận, các thành phần khác đầy đủ và phù hợp → Ovo/Lacto-ovo phù hợp theo dữ liệu; Vegan/Lacto không phù hợp.
7. Nhãn bị cắt/mờ cho sửa hoặc chụp lại; không mặc định phần thiếu là thành phần thực vật.
8. Không có kết luận “an toàn dị ứng” chỉ từ ảnh hoặc nhãn không đầy đủ.
9. Bài viết/video không có cờ AI vẫn không được công khai trước Admin duyệt.
10. AI lỗi → không xuất bản; kiểm tra một phần phải hiển thị rõ phạm vi còn thiếu cho Admin.
11. Sửa nội dung đã đăng tạo phiên bản mới để duyệt; không thay bản công khai ngay.
12. Món trong thực đơn có ID công thức thật; không tự bỏ điều kiện dị ứng khi thiếu món.
13. Đổi món cập nhật tổng dinh dưỡng và danh sách đi chợ; 7 ngày có đúng 3 bữa chính/ngày.
14. Không còn UI thông báo, lịch ngày lễ, thương hiệu khác hoặc tính năng ngoài phạm vi MVP.

## 12. Điểm cần kiểm chứng khi triển khai kỹ thuật

Không cản trở việc sửa UX hiện tại, nhưng phải quyết định và kiểm thử trước vận hành:

- Model/dịch vụ thực tế, chi phí, tốc độ và phạm vi kiểm tra video (âm thanh, hình ảnh, thời lượng hỗ trợ).
- Hạn mức Guest/User và chính sách lưu/xóa ảnh, video, lịch sử trò chuyện.
- Nguồn dữ liệu nguyên liệu/dinh dưỡng; công thức BMI/TDEE, nhóm người dùng áp dụng và ngưỡng phân loại nhất quán.
- Bộ dữ liệu kiểm thử scan có thành phần thật để đối chiếu; theo dõi kết luận sai, tỷ lệ trả “chưa đủ thông tin” và lỗi OCR. Không tự công bố độ chính xác nếu chưa đo.
- Quy định cộng đồng và danh sách lý do AI gắn cờ/Admin từ chối.
