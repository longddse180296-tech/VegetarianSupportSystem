import React from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import './PublicLayout.css';

interface PublicLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavigate?: (path: string) => void;
  isLoggedIn?: boolean;
  userName?: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

export function PublicLayout({
  children,
  activeNav,
  onNavigate,
  isLoggedIn,
  userName,
  avatarUrl,
  onLogout,
}: PublicLayoutProps) {
  return (
    <div className="public-layout">
      <AppHeader
        activeNav={activeNav}
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        userName={userName}
        avatarUrl={avatarUrl}
        onLogout={onLogout}
      />
      <main className="public-layout-main">{children}</main>
      <AppFooter />
    </div>
  );
}

export default PublicLayout;