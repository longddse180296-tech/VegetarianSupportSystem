// Hiển thị thời lượng khi chọn tệp; hủy kết quả cũ và giải phóng object URL khi đổi tệp/đóng form.
import { useEffect, useState } from 'react'
import { formatVideoDuration, readLocalVideoDuration } from '../utils/videoMetadata'

export function VideoFileMetadata({ file }: { file: File | null }) {
  const [result, setResult] = useState<{ file: File; seconds: number | null } | null>(null)
  useEffect(() => {
    if (!file) return
    const controller = new AbortController()
    void readLocalVideoDuration(file, controller.signal).then(seconds => {
      if (!controller.signal.aborted) setResult({ file, seconds })
    })
    return () => controller.abort()
  }, [file])
  if (!file) return null
  const ready = result?.file === file
  return <p role="status" className="mt-2 text-xs text-slate-600">
    {!ready ? 'Đang đọc thời lượng…' : result.seconds == null
      ? 'Chưa đọc được thời lượng trên trình duyệt. Hệ thống sẽ kiểm tra lại khi tải lên.'
      : `Thời lượng: ${formatVideoDuration(result.seconds)}`}
  </p>
}
