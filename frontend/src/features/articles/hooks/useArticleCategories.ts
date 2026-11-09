import { useEffect, useState } from 'react'
import { apiClient } from '../../../shared/api/apiClient'
import { errorMessage } from '../../admin/utils/apiUi'

type CategoryPage = { items: { name: string }[]; totalCount: number }

export function useArticleCategories() {
  const [names, setNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      const categories: string[] = []
      const pageSize = 100
      for (let pageNumber = 1; ; pageNumber++) {
        const result = await apiClient.get<CategoryPage>(
          `/api/categories?kind=Article&pageNumber=${pageNumber}&pageSize=${pageSize}`,
          { signal: controller.signal },
        )
        categories.push(...result.items.map(item => item.name))
        if (pageNumber * pageSize >= result.totalCount) break
      }
      return categories
    }
    void load()
      .then(categories => { if (!controller.signal.aborted) setNames(categories) })
      .catch(reason => { if (!controller.signal.aborted) setError(errorMessage(reason)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [])

  return { names, loading, error }
}
