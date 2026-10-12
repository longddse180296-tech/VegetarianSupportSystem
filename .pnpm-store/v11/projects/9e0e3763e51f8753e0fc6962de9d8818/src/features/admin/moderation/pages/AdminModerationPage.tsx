import { useEffect } from 'react'

// Preserve old bookmarks without mounting a combined moderation queue.
export const AdminModerationPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => {
  useEffect(() => {
    if (onNavigate) onNavigate('/admin/articles')
    else window.location.hash = '/admin/articles'
  }, [onNavigate])
  return null
}
export default AdminModerationPage
