import React, { useState } from 'react'
import {
  ShieldAlert,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'

interface ModerationItem {
  id: string
  contentType: 'article' | 'recipe' | 'video' | 'restaurant' | 'comment'
  title: string
  reporter: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  reportedAt: string
  status: 'open' | 'resolved' | 'rejected'
}

const MOCK: ModerationItem[] = [
  { id: 'm1', contentType: 'recipe',     title: 'Công thức phở chay dùng nước dùng xương heo', reporter: 'Chef Minh Tuấn', reason: 'Sai danh mục Thuần Chay (Vegan)', severity: 'high',   reportedAt: '14/05 10:12', status: 'open' },
  { id: 'm2', contentType: 'comment',    title: 'Bình luận bài viết "Tác hại Gelatin E441"',  reporter: 'Thanh Hà',     reason: 'Từ ngữ không phù hợp, chửi rủa',             severity: 'medium', reportedAt: '13/05 21:40', status: 'open' },
  { id: 'm3', contentType: 'restaurant', title: 'Nhà hàng "Cà phê chay Lá Dừa" - lừa đảo',   reporter: 'Khách Hùng',  reason: 'Giá không minh bạch, phục vụ thịt chay giả', severity: 'high',   reportedAt: '13/05 14:22', status: 'resolved' },
  { id: 'm4', contentType: 'video',      title: 'Video "3 món ăn chay giảm cân nhanh"',      reporter: 'DS. Kim Oanh',reason: 'Nội dung gây hiểu lầm về dinh dưỡng',        severity: 'medium', reportedAt: '12/05 08:06', status: 'open' },
  { id: 'm5', contentType: 'article',    title: 'Bài viết: "Ăn chay chữa khỏi ung thư"',     reporter: 'BS. Hoàng Nam', reason: 'Thông tin y khoa sai lệch, khuyến mãi dối trá', severity: 'high', reportedAt: '11/05 23:50', status: 'rejected' },
]

interface AdminModerationPageProps {
  onNavigate?: (path: string) => void
}

const CT_LABEL: Record<ModerationItem['contentType'], { label: string; color: string; bg: string }> = {
  article:    { label: 'Bài viết',    color: '#1f4b8a', bg: '#e7eefb' },
  recipe:     { label: 'Công thức',   color: '#1f7a3f', bg: '#e7f7eb' },
  video:      { label: 'Video',       color: '#b42323', bg: '#fde3e3' },
  restaurant: { label: 'Nhà hàng',    color: '#9a6217', bg: '#fff4de' },
  comment:    { label: 'Bình luận',   color: '#5b3d8b', bg: '#efecf7' },
}

export const AdminModerationPage: React.FC<AdminModerationPageProps> = () => {
  const [rows, setRows] = useState<ModerationItem[]>(MOCK)
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState<'all' | 'open' | 'resolved' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  const stats = {
    total: rows.length,
    open: rows.filter(r => r.status === 'open').length,
    resolved: rows.filter(r => r.status === 'resolved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
    high: rows.filter(r => r.severity === 'high').length,
  }

  const filtered = rows.filter(r =>
    (tab === 'all' || r.status === tab) &&
    (r.title.toLowerCase().includes(keyword.toLowerCase()) ||
     r.reason.toLowerCase().includes(keyword.toLowerCase()) ||
     r.reporter.toLowerCase().includes(keyword.toLowerCase()))
  )

  const columns: ColumnDef<ModerationItem>[] = [
    {
      key: 'contentType', header: 'NGUỒN', render: (item) => {
        const s = CT_LABEL[item.contentType]
        return (
          <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
        )
      },
    },
    {
      key: 'title', header: 'NỘI DUNG VI PHẠM', render: (item) => (
        <div className="min-w-0">
          <div className="font-bold line-clamp-2 leading-snug mb-1">{item.title}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
            <AlertTriangle size={12} style={{ color: item.severity === 'high' ? '#b42323' : '#9a6217', flexShrink: 0 }} />
            <span>Lý do: {item.reason}</span>
          </div>
        </div>
      ),
    },
    { key: 'reporter', header: 'NGƯỜI BÁO CÁO', render: (item) => <span className="text-xs font-semibold text-gray-800">{item.reporter}</span> },
    {
      key: 'severity', header: 'MỨC ĐỘ', render: (item) => {
        const map = {
          low:    { bg: '#e7f7eb', color: '#1f7a3f', label: 'Thấp' },
          medium: { bg: '#fff4de', color: '#9a6217', label: 'Trung bình' },
          high:   { bg: '#fde3e3', color: '#b42323', label: 'Cao' },
        } as const
        const s = map[item.severity]
        return (
          <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
        )
      },
    },
    { key: 'reportedAt', header: 'THỜI GIAN', render: (item) => <span className="text-xs text-gray-600">{item.reportedAt}</span> },
    {
      key: 'status', header: 'TRẠNG THÁI', render: (item) => {
        const map = {
          open:     { bg: '#fff4de', color: '#9a6217', label: 'Chờ xử lý' },
          resolved: { bg: '#e7f7eb', color: '#1f7a3f', label: 'Đã giải quyết' },
          rejected: { bg: '#f0f4f8', color: '#324253', label: 'Từ chối' },
        } as const
        const s = map[item.status]
        return (
          <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
        )
      },
    },
    {
      key: 'id', header: 'THAO TÁC', align: 'right', render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button type="button" className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors" title="Xem chi tiết">
            <Eye size={13} />
          </button>
          <button
            type="button"
            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            onClick={() => setRows(prev => prev.map(r => r.id === item.id ? { ...r, status: 'resolved' } : r))}
            title="Đánh dấu đã giải quyết"
          >
            <CheckCircle2 size={13} />
          </button>
          <button
            type="button"
            className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            onClick={() => setRows(prev => prev.map(r => r.id === item.id ? { ...r, status: 'rejected' } : r))}
            title="Từ chối báo cáo"
          >
            <XCircle size={13} />
          </button>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            onClick={() => setRows(prev => prev.filter(r => r.id !== item.id))}
            title="Xóa báo cáo"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10, margin: '0 0 6px', fontSize: 24, fontWeight: 800 }}>
            <ShieldAlert size={22} /> Bảng kiểm duyệt nội dung
          </h1>
          <p style={{ margin: 0, color: '#4e6558', fontSize: 13.5 }}>
            Xem xét các báo cáo vi phạm từ cộng đồng và xử lý kịp thời theo quy tắc cộng đồng Vegetarian Support.
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #dde5ec', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#324253', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #dde5ec', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#324253', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} /> Bộ lọc nâng cao
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng báo cáo', value: stats.total, color: '#324253', bg: '#f0f4f8' },
          { label: 'Chờ xử lý', value: stats.open, color: '#9a6217', bg: '#fff4de' },
          { label: 'Đã giải quyết', value: stats.resolved, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'Mức độ cao cần xử lý', value: stats.high, color: '#b42323', bg: '#fde3e3' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#55695d', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, background: s.bg, padding: '6px 10px', borderRadius: 10, display: 'inline-block' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['all','open','resolved','rejected'] as const).map(t => {
            const label = { all: 'Tất cả', open: 'Chờ xử lý', resolved: 'Đã giải quyết', rejected: 'Từ chối' }[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                style={{
                  padding: '6px 13px', borderRadius: 999,
                  border: tab === t ? '1px solid #1f7a3f' : '1px solid #dde5ec',
                  background: tab === t ? '#1f7a3f' : '#fff',
                  color: tab === t ? '#fff' : '#324253',
                  fontWeight: 800, fontSize: 12, cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f5f9f6', border: '1px solid #ddeae0', borderRadius: 12, padding: '4px 4px 4px 12px', width: '100%' }}>
          <Search size={16} style={{ color: '#708677' }} />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm theo nội dung, lý do, người báo cáo…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '10px 6px', fontSize: 13.5, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 8 }}>
        <SharedDataTable<ModerationItem>
          title="Báo cáo vi phạm nội dung"
          totalCountBadge={filtered.length}
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          emptyMessage="Tuyệt vời! Hiện không có báo cáo nào cần xử lý."
        />
      </div>
    </AdminLayout>
  )
}

export default AdminModerationPage
