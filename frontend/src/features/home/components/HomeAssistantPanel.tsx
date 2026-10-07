import { useEffect, useRef, useState } from 'react';
import type { HomeChatMessage } from '../types/home.types';
import { askHomeAssistant } from '../api/home.api';
import './HomeAssistantPanel.css';

interface HomeAssistantPanelProps {
  initialMessages: HomeChatMessage[];
}

const SUGGESTIONS: string[] = [
  'Gợi ý bữa tối ít dầu mỡ',
  'Bữa sáng < 15 phút',
  'Món chay từ đậu hũ',
  'Đếm calo theo BMI',
];

export default function HomeAssistantPanel({ initialMessages }: HomeAssistantPanelProps) {
  const [messages, setMessages] = useState<HomeChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const send = async (raw: string) => {
    const content = raw.trim();
    if (!content || isLoading) return;

    setError(null);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content }]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await askHomeAssistant(content);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply },
      ]);
    } catch {
      setError('Không thể kết nối với trợ lý AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <aside className="home-assistant-panel" aria-label="Hỗ trợ trợ lý dinh dưỡng AI">
      <header className="home-assistant-header">
        <div className="home-assistant-header-title">
          <span className="home-assistant-avatar" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"
                fill="#2f7a45"
              />
            </svg>
          </span>
          <div>
            <h2 className="home-assistant-title">Hỗ trợ lý dinh dưỡng AI</h2>
            <p className="home-assistant-subtitle">Trợ lý dinh dưỡng AI cá nhân hoá</p>
          </div>
        </div>
        <span className="home-assistant-status" aria-live="polite">
          <span className="dot dot--green" />
          {isLoading ? 'Đang soạn…' : 'Đang hoạt động'}
        </span>
      </header>

      <div className="home-assistant-messages" ref={scrollerRef} aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'home-assistant-bubble home-assistant-bubble--user'
                : 'home-assistant-bubble home-assistant-bubble--assistant'
            }
          >
            <span className="home-assistant-bubble-role">
              {m.role === 'user' ? 'Bạn' : 'Trợ lý AI'}
            </span>
            <p className="home-assistant-bubble-text">{m.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="home-assistant-bubble home-assistant-bubble--assistant home-assistant-typing" aria-label="Trợ lý đang soạn tin nhắn">
            <span className="home-assistant-bubble-role">Trợ lý AI</span>
            <p className="home-assistant-bubble-text">
              <span className="home-assistant-typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Đang soạn phản hồi…
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="home-assistant-error" role="alert">
          {error}
        </p>
      )}

      <form className="home-assistant-form" onSubmit={handleSubmit}>
        <label htmlFor="home-assistant-input" className="sr-only">
          Nhập câu hỏi cho trợ lý AI
        </label>
        <input
          id="home-assistant-input"
          type="text"
          className="home-assistant-input"
          placeholder="Hỏi bất kỳ điều gì về dinh dưỡng thực vật…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary home-assistant-send"
          disabled={isLoading || input.trim().length === 0}
        >
          Gửi
        </button>
      </form>

      <ul className="home-assistant-suggestions" aria-label="Gợi ý câu hỏi nhanh">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              className="home-assistant-suggestion"
              onClick={() => void send(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}