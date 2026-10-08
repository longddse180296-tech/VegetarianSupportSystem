import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import './PublicLayout.css';

interface PublicLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavigate?: (path: string) => void;
  isLoggedIn?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-layout">
      <AppHeader />
      <main className="public-layout-main">{children}</main>
      <AppFooter />
    </div>
  );
}