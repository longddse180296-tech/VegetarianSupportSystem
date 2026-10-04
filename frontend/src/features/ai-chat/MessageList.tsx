import { useEffect, useRef } from 'react';
import type { ChatMessage } from './ai-chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isLoading]);

  return (
    <div
      ref={listRef}
      className="ai-chat-messages"
      role="log"
      aria-label="Hội thoại với trợ lý AI"
      aria-live="polite"
      aria-relevant="additions"
      tabIndex={0}
    >
      {messages.length === 0 && (
        <p className="ai-chat-empty">
          Chào bạn! Hãy gửi câu hỏi đầu tiên về món chay hoặc thực đơn của bạn.
        </p>
      )}
      {messages.map((message) => (
        <div key={message.id} className={`ai-chat-message ai-chat-message-${message.role}`}>
          <span className="ai-chat-message-author">
            {message.role === 'user' ? 'Bạn' : 'Trợ lý AI'}
          </span>
          <p>{message.content}</p>
        </div>
      ))}
      {isLoading && (
        <div className="ai-chat-typing" role="status">
          AI đang gõ...
        </div>
      )}
    </div>
  );
}
