// Chức năng: giao diện và thành phần dùng chung. Bố trí phần điều hướng và vùng nội dung chung giữa các màn hình.
import React from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import './PublicLayout.css';

// Cấu trúc PublicLayoutProps quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface PublicLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavigate?: (path: string) => void;
  isLoggedIn?: boolean;
  userName?: string;
  avatarUrl?: string;
  onLogout?: () => void;
}

// Thành phần PublicLayout nhận dữ liệu đầu vào và hiển thị phần giao diện thuộc giao diện và thành phần dùng chung.
export function PublicLayout({
  children,
  activeNav,
  onNavigate,
  isLoggedIn,
  userName,
  avatarUrl,
  onLogout,
}: PublicLayoutProps) {
  // Hiển thị thành phần giao diện dùng chung từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
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