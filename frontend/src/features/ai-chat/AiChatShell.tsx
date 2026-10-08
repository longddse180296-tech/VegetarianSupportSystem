import { useState } from 'react'
import {
  Bot,
  RefreshCw,
  User,
  Image as ImageIcon,
  Send,
  Info,
  AlertTriangle,
  Sparkles,
  Edit3,
  History,
  MessageCircleQuestionMark,
  HeartHandshake,
  Leaf,
  Zap,
  Clock,
  ChevronRight,
} from 'lucide-react'
import './AiChatShell.css'

const PROFILE_FIELDS = [
  { key: 'bmi', label: 'Chỉ số BMI:', value: '22.5 (Bình thường)', tone: 'ok' as const },
  { key: 'goal', label: 'Mục tiêu thể chất:', value: 'Duy trì cân nặng', tone: 'soft' as const },
  { key: 'diet', label: 'Chế độ ăn:', value: 'Thuần chay (Vegan)', tone: 'ok' as const },
  { key: 'pref', label: 'Sở thích dinh dưỡng:', value: 'Giàu đạm, ít dầu mỡ', tone: 'soft' as const },
  { key: 'allergy', label: 'Dị ứng cần tránh:', value: '⚠ Đậu phộng', tone: 'warn' as const },
] as const

const FAQS = [
  { icon: MessageCircleQuestionMark, text: 'Món này có chay không?' },
  { icon: HeartHandshake, text: 'Thành phần này có phù hợp với tôi không?' },
  { icon: Leaf, text: 'Hôm nay tôi nên ăn gì?' },
]

const RECENT = [
  { title: 'Nhu cầu protein cho người tập gym', messages: 12, date: 'Hôm qua', dateTone: 'recent' as const },
  { title: 'Thay thế đậu nành khi bị dị ứng', messages: 8, date: '3 ngày trước', dateTone: 'mid' as const },
  { title: 'Cách làm sữa hạt dinh dưỡng tại nhà', messages: 15, date: 'Tuần trước', dateTone: 'old' as const },
]

const MEAL_CARDS = [
  {
    id: 'd1',
    tags: [{ label: 'Tối • Thanh lọc', tone: 'green' as const }],
    kcal: 380,
    kcalUnit: 'kcal',
    name: 'Salad bơ đậu gà sốt mè',
    desc: 'Bơ sáp, đậu gà luộc mềm, xà lách romaine và hạt hướng dương thơm bùi.',
    nutriLabel: 'Protein',
    nutriValue: '14g',
  },
  {
    id: 'd2',
    tags: [{ label: 'Tối • Dễ tiêu', tone: 'teal' as const }],
    kcal: 310,
    kcalUnit: 'kcal',
    name: 'Canh nấm rau củ đậu hũ',
    desc: 'Nấm rơm, bắp ngọt, cà rốt và đậu hũ non thanh ngọt sáng khoái.',
    nutriLabel: 'Protein',
    nutriValue: '15g',
  },
]

export default function AiChatShell() {
  const [input, setInput] = useState('')

  return (
    <div className="ai-page">
      <nav className="ai-breadcrumbs">
        <span className="ai-link" onClick={() => window.location.hash = '/'}>🏠 Trang chủ</span>
        <span className="ai-sep">›</span>
        <span className="ai-current">Trợ lý AI</span>
      </nav>

      {/* Page header */}
      <header className="ai-head">
        <div className="ai-head-left">
          <h1 className="ai-title">
            Trợ lý dinh dưỡng AI
            <span className="ai-title-badge"><Sparkles size={13} /> Trợ lý ăn dinh dưỡng dưỡng thực vật</span>
          </h1>
          <p className="ai-sub">
            Hỏi đáp về dinh dưỡng chay, nguyên liệu thay thế, BMI, calo và nhận gợi ý bữa ăn khoa học được cá nhân hóa cho bạn.
          </p>
        </div>
        <div className="ai-head-right">
          <div className="ai-quota">
            <div className="ai-quota-icon"><Clock size={16} /></div>
            <div>
              <div className="ai-quota-title">
                Chế độ trải nghiệm <span className="ai-quota-num">3/3</span>
              </div>
              <div className="ai-quota-sub">Bạn còn 3 lượt hỏi thử miễn phí hôm nay</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2 col */}
      <div className="ai-layout">
        {/* Chat column */}
        <section className="ai-chat">
          <div className="ai-chat-head">
            <div className="ai-bot-info">
              <div className="ai-bot-avatar"><Bot size={18} /></div>
              <div>
                <div className="ai-bot-name">
                  Vegetarian AI Assistant
                  <span className="ai-live-dot"><span /> Đang hoạt động</span>
                </div>
                <div className="ai-bot-sub">Phân tích dinh dưỡng thực vật chuẩn khoa học</div>
              </div>
            </div>
            <button className="ai-btn-soft" type="button">
              <RefreshCw size={14} /> Làm mới hội thoại
            </button>
          </div>

          {/* Suggestion chip */}
          <div className="ai-suggest">
            <button className="ai-suggest-chip" type="button">
              Chỉ số BMI 22.5 của tôi có ý nghĩa gì đối với chế độ ăn chay?
              <span className="ai-user-mini"><User size={12} /></span>
            </button>
          </div>

          {/* User bubble */}
          <div className="ai-row ai-row-user">
            <div className="ai-avatar ai-avatar-user"><User size={14} /></div>
            <div className="ai-bubble ai-bubble-user">
              Chỉ số BMI 22.5 của tôi có ý nghĩa gì đối với chế độ ăn chay?
            </div>
          </div>

          {/* AI reply 1: BMI analysis */}
          <div className="ai-row ai-row-ai">
            <div className="ai-avatar ai-avatar-ai"><Bot size={14} /></div>
            <div className="ai-bubble ai-bubble-ai">
              <p className="ai-p">
                Chỉ số BMI 22.5 của bạn nằm trong ngưỡng <strong>Bình thường (18.5 - 22.9)</strong> theo chuẩn
                Tổ chức Y tế Thế giới (WHO) dành cho người trưởng thành châu Á.
              </p>

              <div className="ai-bmi-block">
                <div className="ai-bmi-head">
                  <span className="ai-bmi-label">Thuộc do chuẩn Châu Á</span>
                  <span className="ai-bmi-value">Điểm số hiện tại: <strong>22.5</strong></span>
                </div>
                <div className="ai-bmi-track">
                  <div className="ai-bmi-seg ai-seg-underweight" />
                  <div className="ai-bmi-seg ai-seg-normal" />
                  <div className="ai-bmi-seg ai-seg-overweight" />
                  <div className="ai-bmi-seg ai-seg-obese" />
                  <div className="ai-bmi-marker" style={{ left: '62%' }} />
                </div>
                <div className="ai-bmi-scale">
                  <span>{'< 18.5 Thiếu cân'}</span>
                  <span><strong>18.5 - 22.9 Chuẩn</strong></span>
                  <span>23 - 24.9 Thừa cân</span>
                  <span>≥ 25 Béo phì</span>
                </div>
              </div>

              <p className="ai-p">
                Để duy trì cân nặng lý tưởng và lượng protein bền bỉ, bạn nên nạp khoảng <strong>1.800 - 1.900 kcal/ngày</strong>
                với 60 - 70g protein từ <strong>đậu, hạt và ngũ cốc nguyên cám</strong>.
              </p>

              <div className="ai-disclaimer">
                <span className="ai-disc-icon"><AlertTriangle size={14} /></span>
                <span>
                  Lưu ý: AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.
                </span>
              </div>
            </div>
          </div>

          {/* AI reply 2: 2 meal cards */}
          <div className="ai-row ai-row-ai">
            <div className="ai-avatar ai-avatar-ai"><Bot size={14} /></div>
            <div className="ai-bubble ai-bubble-ai">
              <p className="ai-p">
                Dưới đây là 2 thực đơn bữa tối thanh nhẹ dưới 500 kcal rất hợp với chỉ số BMI của bạn hôm nay:
              </p>

              <div className="ai-meal-grid">
                {MEAL_CARDS.map((m) => (
                  <article key={m.id} className="ai-meal-card">
                    <div className="ai-meal-head">
                      <span className={`ai-meal-tag ai-meal-tag-${m.tags[0].tone}`}>{m.tags[0].label}</span>
                      <span className="ai-meal-kcal"><strong>{m.kcal}</strong>{m.kcalUnit}</span>
                    </div>
                    <h4 className="ai-meal-name">{m.name}</h4>
                    <p className="ai-meal-desc">{m.desc}</p>
                    <div className="ai-meal-foot">
                      <div className="ai-meal-nutri">
                        <span className="ai-nutri-lbl">{m.nutriLabel}:</span>
                        <span className="ai-nutri-val"><strong>{m.nutriValue}</strong></span>
                      </div>
                      <button className="ai-meal-detail" type="button">
                        Chi tiết <ChevronRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="ai-input-block">
            <div className="ai-input-wrap">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn về dinh dưỡng, món ăn, calo, nguyên liệu..."
              />
              <div className="ai-input-actions">
                <button className="ai-input-btn ai-input-btn-soft" type="button" aria-label="tải ảnh">
                  <ImageIcon size={16} />
                </button>
                <button className="ai-input-btn ai-input-btn-send" type="button" aria-label="gửi">
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="ai-input-foot">
              <span className="ai-foot-note">
                <Info size={12} />
                AI chỉ cung cấp kiến thức dinh dưỡng thực vật thường thức, không thay thế chẩn đoán hay điều trị y khoa.
              </span>
              <span className="ai-foot-hint">
                Nhấn Enter để gửi
              </span>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="ai-sidebar">
          {/* Profile */}
          <div className="ai-sb-card">
            <div className="ai-sb-title-row">
              <h3 className="ai-sb-title">
                <Sparkles size={16} /> Hồ sơ cá nhân hóa
              </h3>
              <button className="ai-sb-edit" type="button">
                <Edit3 size={13} /> Chỉnh sửa
              </button>
            </div>
            <ul className="ai-profile-list">
              {PROFILE_FIELDS.map((f) => (
                <li key={f.key} className="ai-profile-row">
                  <span className="ai-profile-lbl">{f.label}</span>
                  <span className={`ai-profile-val ai-val-${f.tone}`}>{f.value}</span>
                </li>
              ))}
            </ul>
            <div className="ai-profile-note">
              <Zap size={13} /> AI tự động đối chiếu thông tin này để đưa ra gợi ý chuẩn xác nhất cho bạn.
            </div>
          </div>

          {/* FAQ */}
          <div className="ai-sb-card">
            <h3 className="ai-sb-title">
              <MessageCircleQuestionMark size={16} /> Câu hỏi thường gặp
            </h3>
            <ul className="ai-faq-list">
              {FAQS.map((f, idx) => (
                <li key={idx} className="ai-faq-item">
                  <span className="ai-faq-icon"><f.icon size={14} /></span>
                  <span className="ai-faq-text">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent */}
          <div className="ai-sb-card">
            <div className="ai-sb-title-row">
              <h3 className="ai-sb-title">
                <History size={16} /> Lịch sử gần đây
              </h3>
              <span className="ai-recent-count">3 hội thoại</span>
            </div>
            <ul className="ai-recent-list">
              {RECENT.map((r) => (
                <li key={r.title} className="ai-recent-item">
                  <div className="ai-recent-head">{r.title}</div>
                  <div className="ai-recent-meta">
                    <span className="ai-recent-msgs">{r.messages} tin nhắn</span>
                    <span className={`ai-recent-date ai-date-${r.dateTone}`}>{r.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
