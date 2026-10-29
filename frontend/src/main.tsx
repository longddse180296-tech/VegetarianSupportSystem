// Chức năng: giao diện và thành phần dùng chung. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>,
)
