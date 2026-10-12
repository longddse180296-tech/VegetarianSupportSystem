import { ModerationWorkspace } from '../../moderation/components/ModerationWorkspace'
export const AdminArticlesPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => <ModerationWorkspace contentType="Article" onNavigate={onNavigate} />
export default AdminArticlesPage
