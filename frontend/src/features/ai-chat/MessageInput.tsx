import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ValidationMessage from '../../shared/components/ValidationMessage';

const messageSchema = z.object({
  message: z.string().trim().min(1, 'Vui lòng nhập tin nhắn.'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface MessageInputProps {
  isLoading: boolean;
  onSend: (message: string) => Promise<void>;
}

export default function MessageInput({ isLoading, onSend }: MessageInputProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
  });
  const isBusy = isLoading || isSubmitting;

  const submit = async ({ message }: MessageFormData) => {
    if (isLoading) return;
    reset();
    await onSend(message);
  };

  return (
    <form className="ai-chat-input" onSubmit={handleSubmit(submit)} noValidate>
      <label className="ai-chat-input-label">
        Tin nhắn của bạn
        <input
          type="text"
          autoComplete="off"
          placeholder="Hỏi trợ lý về món chay..."
          readOnly={isBusy}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'ai-chat-input-error' : undefined}
          {...register('message')}
        />
      </label>
      <button type="submit" disabled={isBusy}>
        {isBusy ? 'Đang chờ AI...' : 'Gửi'}
      </button>
      <div id="ai-chat-input-error" className="ai-chat-input-error">
        <ValidationMessage message={errors.message?.message} />
      </div>
    </form>
  );
}
