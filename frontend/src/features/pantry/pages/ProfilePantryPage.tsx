// Chức năng: mở tủ bếp trong bố cục Profile, dùng chung dữ liệu tủ bếp của tài khoản hiện tại.
import { UserProfileShell } from '../../profile/components/UserProfileShell'
import PantryPage from './PantryPage'

export default function ProfilePantryPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <UserProfileShell activeTab="pantry" onNavigate={onNavigate} breadcrumbs={[
    { label: 'Trang chủ', path: '/' }, { label: 'Profile', path: '/profile' }, { label: 'Tủ bếp AI' },
  ]}><PantryPage onNavigate={onNavigate} isLoggedIn /></UserProfileShell>
}
