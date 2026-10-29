// Chức năng: trang chủ và thông tin giới thiệu. Ghép dữ liệu, thao tác và các trạng thái tải/lỗi cho màn hình.
import { ArrowLeft, ArrowUpRight, Leaf } from 'lucide-react'
import './InformationPage.css'
import ContactFeedbackForm from './ContactFeedbackForm'

const informationPages = {
  about: {
    title: 'Giới thiệu',
    description: 'Ăn chay có thêm thông tin, mỗi ngày có thêm lựa chọn.',
    sections: [
      { title: 'Đồng hành cùng hành trình ăn chay', text: 'Vegetarian Support là dự án hỗ trợ tìm hiểu và thực hành ăn chay. Chúng tôi kết nối công thức, bài viết, video và thông tin nhà hàng trong một không gian để bạn chủ động lựa chọn theo nhu cầu của mình.' },
      { title: 'Những công cụ dành cho bạn', text: 'Bạn có thể khám phá công thức, lưu nội dung yêu thích, quản lý nguyên liệu trong tủ bếp và lập thực đơn 7 ngày. Hồ sơ về chế độ ăn, dị ứng và sở thích giúp hệ thống đưa ra gợi ý phù hợp hơn theo thông tin bạn cung cấp.' },
      { title: 'Sử dụng AI có trách nhiệm', text: 'Trợ lý AI hỗ trợ giải thích và gợi ý. Công cụ kiểm tra món ăn và nhãn thành phần cần bạn kiểm tra, chỉnh sửa và xác nhận thông tin. Ảnh không chứng minh được thành phần ẩn; kết quả có thể là “Chưa đủ thông tin”. Cảnh báo dị ứng được trình bày riêng với phân loại ăn chay.' },
      { title: 'Cộng đồng và sự minh bạch', text: 'Bài viết và video do thành viên gửi cần Admin duyệt trước khi công khai. AI chỉ hỗ trợ gắn cờ bài viết; quyết định xuất bản thuộc Admin. Nội dung dinh dưỡng và gợi ý trên nền tảng mang tính tham khảo, không thay thế tư vấn từ chuyên gia y tế.' },
    ],
  },
  contact: {
    title: 'Liên hệ',
    description: 'Chia sẻ góp ý để Vegetarian Support ngày một hữu ích hơn.',
    sections: [
      { title: 'Góp ý và báo lỗi', text: 'Gửi góp ý bằng biểu mẫu trên trang để Admin của Vegetarian Support tiếp nhận. Nội dung được lưu trong hệ thống và chỉ hiển thị cho quản trị viên, không đăng công khai.' },
      { title: 'Thông tin giúp nhóm xử lý', text: 'Vui lòng mô tả trang gặp vấn đề, các bước thực hiện, kết quả mong muốn và kết quả thực tế. Biểu mẫu hiện nhận nội dung văn bản, chưa hỗ trợ tệp đính kèm.' },
      { title: 'Bảo vệ thông tin của bạn', text: 'Họ tên và email giúp Admin xác định người gửi và liên hệ khi cần. Không gửi mật khẩu, mã đăng nhập hoặc thông tin sức khỏe nhạy cảm. Với yêu cầu liên quan đến dữ liệu cá nhân, chỉ mô tả loại yêu cầu để Admin hướng dẫn bước tiếp theo.' },
      { title: 'Phản hồi về nội dung', text: 'Nếu nhận thấy bài viết, video hoặc thông tin công thức chưa chính xác, hãy gửi đường dẫn nội dung cùng phần cần kiểm tra. Nhóm sẽ có cơ sở xem xét; thời gian phản hồi tùy thuộc vào khả năng xử lý của nhóm dự án.' },
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật',
    description: 'Hiểu thông tin bạn cung cấp và cách sử dụng các chức năng của nền tảng.',
    sections: [
      { title: 'Thông tin được sử dụng', text: 'Tùy chức năng bạn sử dụng, hệ thống xử lý thông tin tài khoản, hồ sơ chế độ ăn, dị ứng, chỉ số cơ thể, sở thích, nội dung bạn tạo, mục yêu thích và kế hoạch đã lưu. Chức năng AI và kiểm tra thực phẩm xử lý câu hỏi, ảnh, văn bản nhãn và thông tin bạn xác nhận. Khi gửi góp ý, họ tên, email, tiêu đề và nội dung được lưu để Admin tiếp nhận và xử lý.' },
      { title: 'Mục đích xử lý', text: 'Thông tin được dùng để đăng nhập, hiển thị hồ sơ, lưu lựa chọn của bạn, cá nhân hóa gợi ý, đánh giá thành phần theo thông tin cung cấp và quản lý nội dung. Chỉ cung cấp dữ liệu cần thiết cho chức năng bạn muốn sử dụng; không đưa thông tin nhạy cảm vào nội dung công khai.' },
      { title: 'Xử lý bởi dịch vụ AI', text: 'Khi sử dụng chức năng AI, nội dung cần phân tích được backend gửi đến dịch vụ Gemini khi dịch vụ được cấu hình. Hãy loại bỏ thông tin nhận dạng không cần thiết khỏi câu hỏi và ảnh. Kết quả AI có thể sai và cần được bạn kiểm tra trước khi sử dụng.' },
      { title: 'Nội dung công khai và thông tin riêng', text: 'Bài viết, video được duyệt và bình luận có thể được người khác xem. Các dữ liệu gắn với tài khoản như hồ sơ, tủ bếp và thực đơn được truy cập theo quyền của chức năng. Góp ý từ trang Liên hệ chỉ dành cho Admin, không hiển thị công khai và không gửi sang dịch vụ AI. Tránh chia sẻ tài khoản và đăng xuất khi sử dụng thiết bị dùng chung.' },
      { title: 'Lưu trữ trên trình duyệt', text: 'Ứng dụng sử dụng bộ nhớ trình duyệt cho phiên đăng nhập và một số trạng thái sử dụng. Bạn có thể đăng xuất và xóa dữ liệu trang trong trình duyệt; thao tác này không đồng nghĩa với xóa dữ liệu đã lưu trên máy chủ.' },
      { title: 'Cập nhật và yêu cầu về dữ liệu', text: 'Bạn có thể xem và chỉnh sửa thông tin qua các chức năng hồ sơ hiện có. Với yêu cầu khác về dữ liệu, hãy xem trang Liên hệ để đề nghị nhóm hướng dẫn. Thời hạn lưu dữ liệu và quy trình xóa cần được nhóm công bố cụ thể trước khi vận hành chính thức.' },
    ],
  },
  terms: {
    title: 'Điều khoản sử dụng',
    description: 'Cùng sử dụng nền tảng một cách tôn trọng và có trách nhiệm.',
    sections: [
      { title: 'Phạm vi dịch vụ', text: 'Vegetarian Support cung cấp thông tin và công cụ hỗ trợ ăn chay, bao gồm khám phá nội dung, gợi ý công thức, quản lý tủ bếp, lập thực đơn và hỗ trợ AI. Một số chức năng yêu cầu đăng nhập. Khả năng sử dụng phụ thuộc vào dữ liệu và dịch vụ hiện có.' },
      { title: 'Trách nhiệm với tài khoản', text: 'Bạn cần cung cấp thông tin phù hợp, giữ kín thông tin đăng nhập và chịu trách nhiệm với nội dung gửi từ tài khoản của mình. Không sử dụng tài khoản để truy cập trái phép, làm gián đoạn hệ thống hoặc thu thập dữ liệu của người khác.' },
      { title: 'Nội dung và ứng xử cộng đồng', text: 'Chỉ đăng nội dung bạn có quyền sử dụng. Không đăng spam, nội dung xúc phạm, thông tin cá nhân của người khác hoặc tuyên bố sức khỏe thiếu căn cứ. Bài viết và video cần được Admin duyệt; nội dung có thể bị yêu cầu sửa, từ chối hoặc gỡ theo quyết định kiểm duyệt có lý do.' },
      { title: 'Giới hạn của thông tin và AI', text: 'Thông tin dinh dưỡng, chỉ số cơ thể và thực đơn chỉ mang tính tham khảo. AI có thể nhận diện sai hoặc thiếu thành phần. Bạn cần kiểm tra nguyên liệu, văn bản OCR và các câu trả lời trước khi đánh giá; kết quả không phải chứng nhận món chay hay bảo đảm không có dị nguyên.' },
      { title: 'Lựa chọn phù hợp với sức khỏe', text: 'Bạn chịu trách nhiệm kiểm tra nhãn, nguồn nguyên liệu và điều kiện chế biến thực tế. Khi có dị ứng, bệnh lý hoặc nhu cầu dinh dưỡng đặc biệt, hãy tham khảo chuyên gia y tế phù hợp trước khi thay đổi chế độ ăn dựa trên gợi ý của nền tảng.' },
      { title: 'Góp ý và cập nhật', text: 'Nếu gặp lỗi hoặc có thắc mắc về việc sử dụng, hãy xem trang Liên hệ. Nội dung điều khoản có thể được cập nhật theo chức năng và quy trình vận hành; hãy đọc lại phiên bản hiển thị khi tiếp tục sử dụng dịch vụ.' },
    ],
  },
}

// Cấu trúc InformationPageKind quy định dữ liệu trao đổi trong trang chủ và thông tin giới thiệu.
export type InformationPageKind = keyof typeof informationPages

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (InformationPage); thuộc trang chủ và thông tin giới thiệu.
export default function InformationPage({ kind }: { kind: InformationPageKind }) {
  const page = informationPages[kind]
  // Hiển thị giao diện trang chủ và thông tin giới thiệu từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="information-page">
      <div className="information-shell">
        <a className="information-back" href="#/"><ArrowLeft size={16} /> Trang chủ</a>
        <header className="information-hero">
          <span className="information-eyebrow"><Leaf size={17} /> VEGETARIAN SUPPORT</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>
        <div className="information-layout">
          <nav className="information-nav" aria-label="Liên kết hữu ích">
            <span>TÌM HIỂU THÊM</span>
            {Object.entries(informationPages).map(([key, item]) => (
              <a key={key} href={`#/${key}`} aria-current={kind === key ? 'page' : undefined}>
                {item.title}<ArrowUpRight size={16} />
              </a>
            ))}
          </nav>
          <article className="information-content" aria-label={page.title}>
            {kind === 'contact' && <ContactFeedbackForm />}
            {page.sections.map((section, index) => (
              <section key={section.title}>
                <span className="information-number">{String(index + 1).padStart(2, '0')}</span>
                <div><h2>{section.title}</h2><p>{section.text}</p></div>
              </section>
            ))}
            {kind !== 'contact' && (
              <div className="information-action">
                <a href="#/contact">Liên hệ với nhóm dự án <ArrowUpRight size={17} /></a>
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}
