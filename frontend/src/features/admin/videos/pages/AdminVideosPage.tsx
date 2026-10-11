import { ModerationWorkspace } from '../../moderation/components/ModerationWorkspace'
export const AdminVideosPage = ({
  onNavigate,
}: {
  onNavigate?: (path: string) => void
}) => <ModerationWorkspace contentType="Video" onNavigate={onNavigate} />
export default AdminVideosPage
