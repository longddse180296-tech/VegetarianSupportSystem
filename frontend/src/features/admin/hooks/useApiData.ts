import { useEffect, useState } from 'react'
import { apiClient } from '../../../shared/api/apiClient'
import { errorMessage } from '../utils/apiUi'
export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
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
