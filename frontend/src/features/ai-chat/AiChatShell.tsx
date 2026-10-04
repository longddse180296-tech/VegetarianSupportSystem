import { useEffect, useRef, useState } from 'react';
import { mockSendToAI } from './ai-chat.api';
import type { ChatMessage } from './ai-chat.types';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import './AiChatShell.css';

export default function AiChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleSend = async (message: string) => {
    const content = message.trim();
    if (!content || pendingRef.current) return;

    // Lock synchronously so rapid submissions cannot create overlapping replies.
    pendingRef.current = true;
    setError(null);
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), role: 'user', content },
    ]);
    setIsLoading(true);

    try {
      const reply = await mockSendToAI(content);
      if (!mountedRef.current) return;
      setMessages((previous) => [
        ...previous,
        { id: crypto.randomUUID(), role: 'assistant', content: reply },
      ]);
    } catch {
      if (mountedRef.current) {
        setError('Không thể nhận phản hồi từ AI. Vui lòng gửi lại tin nhắn.');
      }
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  };

  return (
    <section className="ai-chat-shell" aria-label="Trợ lý AI">
      <header className="ai-chat-header">
        <h1>Trợ lý AI</h1>
        <p>Hỗ trợ món chay và thực đơn. Hiện đang sử dụng phản hồi mô phỏng.</p>
      </header>
      <MessageList messages={messages} isLoading={isLoading} />
      {error && <p className="ai-chat-error" role="alert">{error}</p>}
      <MessageInput isLoading={isLoading} onSend={handleSend} />
    </section>
  );
}
