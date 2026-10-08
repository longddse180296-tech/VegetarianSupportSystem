import { useState } from 'react'
import {
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  ThumbsUp,
  Share2,
  Bookmark,
  Plus,
  UserPlus,
  BadgeCheck,
  ChevronRight,
  MessageSquare,
  ArrowUpDown,
  Sparkles,
  Send,
  Clock,
  Eye,
} from 'lucide-react'
import './VideoDetail.css'

interface Props {
  videoId: string;
  onNavigate?: (path: string) => void;
}

const TAGS = ['Món chính chay', 'Nấu nhanh 20 phút', 'Giàu đạm thực vật']

const COMMENTS = [
  {
    id: 'c1',
    author: 'Trần Thu Thủy',
    avatar: 'TT',
    avatarBg: '#e5f3ec',
    badge: 'Thành viên tích cực',
    badgeTone: 'user',
    time: '• 2 giờ trước',
    text: 'Mình vừa thử làm theo công thức của đầu bếp, sốt nấm đậm đà và đậu hũ giòn vừa rồi ngon tuyệt vời quá! Cảm ơn kênh nhiều.',
    likes: 24,
    replies: 0,
  },
  {
    id: 'c2',
    author: 'Bác sĩ Dinh dưỡng Hoàng Nam',
    avatar: 'HN',
    avatarBg: '#1f7a3f',
    badge: 'Chuyên gia thực vật',
    badgeTone: 'pro',
    time: '• 5 giờ trước',
    text: 'Món này cung cấp lượng đạm thực vật rất tốt từ nấm và đậu nành. Các bạn có thể thêm chút nấm hương tươi để tăng hương vị.',
    likes: 38,
    replies: 1,
    replyAuthor: 'Tác giả',
    replyAuthorTone: 'author',
    replyText: 'Cảm ơn bác sĩ đã gợi ý, mình sẽ cập nhật chi tiết hơn trong video tiếp theo nhé ạ!',
  },
  {
    id: 'c3',
    author: 'Lê Minh Tuấn',
    avatar: 'MT',
    avatarBg: '#eaf1ff',
    badge: '',
    badgeTone: 'none',
    time: '• 1 ngày trước',
    text: 'Cho mình hỏi nếu không có đậu hào chay thì thay thế bằng vị gì hợp với nhất vậy ạ?',
    likes: 7,
    replies: 1,
    replyAuthor: 'KĐĐH An Nhiên',
    replyAuthorTone: 'author',
    replyText: 'Chào bạn Tuấn, bạn có thể thể thay bằng tamari cốt nấm hoặc 1 thìa nước tương nguyên chất pha cùng xíu mật mía để tạo độ sánh và thơm tự nhiên nhé!',
  },
]

const SUGGESTED = [
  { id: 'v1', title: 'Cơm gạo lứt rau củ thập cẩm thanh vị', channel: 'DS. Kim Oanh', views: '18.2K', duration: '12:15', tag: 'Món chính' },
  { id: 'v2', title: 'Canh nấm hạt sen táo đỏ bồi bổ cơ thể', channel: 'BS. Hoàng Nam', views: '31.0K', duration: '15:30', tag: 'Món nước' },
  { id: 'v3', title: 'Salad bơ và đậu gà sốt mè rang', channel: 'Lan Anh', views: '24.1K', duration: '08:40', tag: 'Salad' },
]

export default function VideoDetailPage({ videoId: _videoId, onNavigate }: Props) {
  const [playing, setPlaying] = useState(true)
  const [sortBy, setSortBy] = useState('Mới nhất')
  const [comment, setComment] = useState('')

  return (
    <div className="vd-page">
      {/* Breadcrumbs */}
      <nav className="vd-breadcrumbs">
        <span className="vd-link" onClick={() => onNavigate?.('/')}>Trang chủ</span>
        <span className="vd-sep">›</span>
        <span className="vd-link" onClick={() => onNavigate?.('/videos')}>Video</span>
        <span className="vd-sep">›</span>
        <span className="vd-current">Đậu hũ sốt nấm đơn giản trong 20 phút</span>
      </nav>

      <div className="vd-layout">
        {/* Main */}
        <div className="vd-main">
          {/* Player */}
          <div className="vd-player">
            <div className="vd-player-screen">
              <button
                type="button"
                className="vd-play-circle"
                onClick={() => setPlaying((v) => !v)}
                aria-label="play"
              >
                <Play size={28} className="vd-play-ico" />
              </button>
            </div>
            <div className="vd-player-controls">
              <div className="vd-progress">
                <div className="vd-progress-fill" style={{ width: '44%' }} />
                <div className="vd-progress-dot" style={{ left: '44%' }} />
              </div>
              <div className="vd-controls-row">
                <div className="vd-ctrl-left">
                  <button type="button" className="vd-ctrl-btn" onClick={() => setPlaying((v) => !v)}>
                    {playing ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button type="button" className="vd-ctrl-btn" aria-label="volume">
                    <Volume2 size={18} />
                    <div className="vd-volume"><div className="vd-volume-fill" style={{ width: '55%' }} /></div>
                  </button>
                  <span className="vd-time">03:45 / 08:42</span>
                </div>
                <div className="vd-ctrl-right">
                  <button type="button" className="vd-ctrl-btn" aria-label="settings">
                    <Settings size={18} />
                  </button>
                  <button type="button" className="vd-ctrl-btn" aria-label="fullscreen">
                    <Maximize size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="vd-tags">
            {TAGS.map((t) => (
              <span key={t} className="vd-tag">{t}</span>
            ))}
          </div>

          {/* Title + channel */}
          <h1 className="vd-title">Đậu hũ sốt nấm đơn giản trong 20 phút</h1>

          <div className="vd-channel-row">
            <div className="vd-channel-avatar" style={{ background: '#e4f3e9', color: '#1f7a3f' }}>AN</div>
            <div className="vd-channel-info">
              <div className="vd-channel-name-row">
                <span className="vd-channel-name">Bếp Chay An Nhiên</span>
                <BadgeCheck size={15} className="vd-verified" />
              </div>
              <div className="vd-channel-meta">
                <UserPlus size={12} /> 45.2K người theo dõi
                <span className="vd-dot">•</span>
                <Clock size={12} /> Đăng 2 ngày trước
              </div>
            </div>
            <button type="button" className="vd-btn-subscribe">
              <Plus size={14} /> Theo dõi
            </button>
          </div>

          {/* Actions */}
          <div className="vd-actions-row">
            <button className="vd-action-chip"><ThumbsUp size={15} /> 1.2k Thích</button>
            <button className="vd-action-chip"><Share2 size={15} /> Chia sẻ</button>
            <button className="vd-action-chip"><Bookmark size={15} /> Lưu video</button>
          </div>

          {/* Description */}
          <div className="vd-desc">
            Công thức đậu hũ non áp chảo sốt củ nấm đông cô tươi, nấm đùi gà và nấm rơm đã, hao cơm mà cực kỳ lành mạnh.
            Món ăn thanh nhẹ cung cấp trọn vẹn axit amin thiết yếu cho bữa com thuần thực vật đủ chất.
          </div>

          {/* Comments */}
          <section className="vd-comments">
            <div className="vd-comments-head">
              <div className="vd-comments-title">
                <MessageSquare size={17} /> Bình luận
                <span className="vd-count">(48)</span>
              </div>
              <div className="vd-comments-sort">
                <ArrowUpDown size={14} />
                <span>Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option>Mới nhất</option>
                  <option>Hàng đầu</option>
                </select>
              </div>
            </div>

            {/* Comment input */}
            <div className="vd-comment-input-row">
              <div className="vd-avatar vd-avatar-author" style={{ background: '#e4f3e9', color: '#1f7a3f' }}>BAN</div>
              <div className="vd-comment-field-wrap">
                <textarea
                  className="vd-comment-input"
                  rows={2}
                  placeholder="Chia sẻ cảm nghĩ hoặc đặt câu hỏi về món ăn này..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="vd-comment-foot">
                  <div className="vd-comment-hint">
                    <BadgeCheck size={12} /> Giữ thảo luận văn minh & tích cực
                  </div>
                  <div className="vd-comment-actions">
                    <button className="vd-btn-ghost" onClick={() => setComment('')}>Hủy</button>
                    <button className="vd-btn-primary" type="button">
                      <Send size={14} /> Gửi bình luận
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment list */}
            <div className="vd-comment-list">
              {COMMENTS.map((c) => (
                <div key={c.id} className="vd-comment-item">
                  <div className="vd-avatar" style={{ background: c.avatarBg, color: c.badgeTone === 'pro' ? '#fff' : c.badgeTone === 'user' ? '#1f7a3f' : '#23509a' }}>
                    {c.avatar}
                  </div>
                  <div className="vd-comment-body">
                    <div className="vd-comment-head">
                      <span className="vd-comment-author">{c.author}</span>
                      {c.badge && (
                        <span className={`vd-comment-badge vd-badge-${c.badgeTone}`}>{c.badge}</span>
                      )}
                      <span className="vd-comment-time">{c.time}</span>
                    </div>
                    <p className="vd-comment-text">{c.text}</p>
                    <div className="vd-comment-meta">
                      <span className="vd-comment-like">👍 {c.likes}</span>
                      <button className="vd-comment-reply-btn">↩ Trả lời</button>
                    </div>

                    {c.replies > 0 && c.replyText && (
                      <div className="vd-comment-reply">
                        <div className="vd-avatar vd-avatar-sm" style={{ background: '#1f7a3f', color: '#fff' }}>AN</div>
                        <div className="vd-comment-body">
                          <div className="vd-comment-head">
                            <span className="vd-comment-author">{c.replyAuthor}</span>
                            <span className={`vd-comment-badge vd-badge-${c.replyAuthorTone}`}>Tác giả</span>
                          </div>
                          <p className="vd-comment-text">{c.replyText}</p>
                          <div className="vd-comment-meta">
                            <span className="vd-comment-like">👍 12</span>
                            <button className="vd-comment-reply-btn">↩ Trả lời</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="vd-sidebar">
          <div className="vd-sb-head">
            <h3>Video bạn có thể thích</h3>
            <span className="vd-link" onClick={() => onNavigate?.('/videos')}>
              Xem tất cả <ChevronRight size={14} />
            </span>
          </div>

          <div className="vd-sb-list">
            {SUGGESTED.map((s) => (
              <article key={s.id} className="vd-sb-item" onClick={() => onNavigate?.(`/videos/${encodeURIComponent(s.id)}`)}>
                <div className="vd-sb-thumb">
                  <div className="vd-sb-thumb-placeholder" />
                  <span className="vd-sb-duration">{s.duration}</span>
                </div>
                <div className="vd-sb-info">
                  <div className="vd-sb-tag">{s.tag}</div>
                  <h4 className="vd-sb-title">{s.title}</h4>
                  <div className="vd-sb-meta">
                    <span>⛑ {s.channel}</span>
                    <span className="vd-dot">•</span>
                    <Eye size={12} /> {s.views} xem
                  </div>
                  <button className="vd-sb-btn">
                    <Play size={12} /> Xem video
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="vd-sb-ai">
            <div className="vd-ai-head">
              <span className="vd-ai-dot" />
              TRỢ LÝ DINH DƯỠNG AI
            </div>
            <h4 className="vd-ai-title">Cần giải đáp về video này?</h4>
            <p className="vd-ai-desc">
              Bạn muốn thay thế nguyên liệu hay điều chỉnh gia vị cho người tiểu đường? Hãy hỏi Trợ lý AI ngay.
            </p>
            <button
              type="button"
              className="vd-ai-btn"
              onClick={() => onNavigate?.('/ai-chat')}
            >
              <Sparkles size={15} /> Chat với AI dinh dưỡng
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
