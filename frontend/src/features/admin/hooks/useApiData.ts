// Chức năng: giao diện và thành phần dùng chung. Quản lý trạng thái, vòng đời yêu cầu và dữ liệu được tái sử dụng.
import { useEffect, useState } from 'react'
import { apiClient } from '../../../shared/api/apiClient'
import { errorMessage } from '../utils/apiUi'
// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (useApiData); thuộc giao diện và thành phần dùng chung.
export function useApiData<T>(path: string | null) {
  // Lưu dữ liệu và trạng thái thao tác của giao diện và thành phần dùng chung trong vòng đời màn hình.
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  // Đồng bộ dữ liệu theo thay đổi đầu vào; hủy hoặc bỏ qua kết quả cũ khi màn hình thay đổi.
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      if (!path) {
        setData(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      setData(null)
      apiClient
        .get<T>(path, { signal: controller.signal })
        .then((result) => {
          if (!controller.signal.aborted) setData(result)
        })
        .catch((reason) => {
          if (!controller.signal.aborted) setError(errorMessage(reason))
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 150)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [path, revision])
  return {
    data,
    loading,
    error,
    setData,
    reload: () => {
      setLoading(true)
      setError(null)
      setRevision((value) => value + 1)
    },
  }
}
