import React, { useState } from 'react'
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import CategoryForm from '../../components/CategoryForm'

interface RestaurantAdminItem {
  id: string
  name: string
  address: string
  district: string
  cuisineType: string
  rating: number
  priceRange: string
  status: 'active' | 'pending' | 'suspended'
  verified: boolean
}

const MOCK: RestaurantAdminItem[] = [
  { id: 'res1', name: 'An Nhiên Vegetarian Restaurant', address: '18 Ngõ 71 Lĩnh Lang, Công Vị, Ba Đình, Hà Nội', district: 'Ba Đình', cuisineType: 'Lacto-Ovo Chay', rating: 4.8, priceRange: '45k - 150k', status: 'active', verified: true },
  { id: 'res2', name: 'The Fernery Garden & Cafe Chay', address: '24 Quảng Khánh, Quảng An, Tây Hồ, Hà Nội', district: 'Tây Hồ', cuisineType: 'Vegan', rating: 4.7, priceRange: '60k - 180k', status: 'active', verified: true },
  { id: 'res3', name: 'Bếp Chay An Lạc', address: '109 Mai Hắc Đế, Bùi Thị Xuân, Hai Bà Trưng, Hà Nội', district: 'Hai Bà Trưng', cuisineType: 'Vegan', rating: 4.6, priceRange: '50k - 120k', status: 'pending', verified: false },
  { id: 'res4', name: 'Nhà hàng Chay Sen Vàng', address: '52 Nguyễn Du, Hàng Bài, Hoàn Kiếm, Hà Nội', district: 'Hoàn Kiếm', cuisineType: 'Lacto Chay', rating: 4.4, priceRange: '80k - 250k', status: 'active', verified: true },
  { id: 'res5', name: 'Cà phê chay Lá Dừa', address: '32 Phan Đình Phùng, Hoàn Kiếm, Hà Nội', district: 'Hoàn Kiếm', cuisineType: 'Chay dưỡng sinh', rating: 4.5, priceRange: '35k - 90k', status: 'suspended', verified: false },
]

interface AdminRestaurantsPageProps {
  onNavigate?: (path: string) => void
}

export const AdminRestaurantsPage: React.FC<AdminRestaurantsPageProps> = () => {
  const [rows, setRows] = useState<RestaurantAdminItem[]>(MOCK)
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')
  const [showCat, setShowCat] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 6

  const stats = {
    total: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    pending: rows.filter(r => r.status === 'pending').length,
    suspended: rows.filter(r => r.status === 'suspended').length,
  }

  const filtered = rows.filter(r =>
    (tab === 'all' || r.status === tab) &&
    (r.name.toLowerCase().includes(keyword.toLowerCase()) ||
     r.district.toLowerCase().includes(keyword.toLowerCase()))
  )

  const columns: ColumnDef<RestaurantAdminItem>[] = [
    {
      key: 'name',
      header: 'NHÀ HÀNG',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-bold line-clamp-1 leading-snug mb-1 inline-flex items-center gap-1.5">
            {item.name}
            {item.verified
              ? <CheckCircle2 size={14} style={{ color: '#1f7a3f', flexShrink: 0 }} />
              : <XCircle size={14} style={{ color: '#9aa3a0', flexShrink: 0 }} />
            }
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} /> <span className="line-clamp-1">{item.address}</span>
          </div>
        </div>
      ),
    },
    { key: 'district', header: 'QUẬN / HUYỆN', render: (item) => <span className="text-xs text-gray-600">{item.district}</span> },
    { key: 'cuisineType', header: 'LOẠI HÌNH', render: (item) => <span className="text-xs text-gray-700">{item.cuisineType}</span> },
    {
      key: 'rating', header: 'ĐÁNH GIÁ', render: (item) => (
        <span style={{ fontWeight: 800, color: '#9a6217', whiteSpace: 'nowrap' }}>⭐ {item.rating}</span>
      ),
    },
    { key: 'priceRange', header: 'GIÁ', render: (item) => <span className="text-xs text-gray-700 font-semibold">{item.priceRange}</span> },
    {
      key: 'status', header: 'TRẠNG THÁI', render: (item) => {
        const map = {
          active:    { bg: '#e7f7eb', color: '#1f7a3f', label: 'Hoạt động' },
          pending:   { bg: '#fff4de', color: '#9a6217', label: 'Chờ duyệt' },
          suspended: { bg: '#fde3e3', color: '#b42323', label: 'Ngừng hoạt động' },
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
          <button type="button" className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors" title="Chỉnh sửa">
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            onClick={() => setRows(prev => prev.filter(r => r.id !== item.id))}
            title="Xóa"
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
            <MapPin size={22} /> Quản lý nhà hàng &amp; quán ăn chay
          </h1>
          <p style={{ margin: 0, color: '#4e6558', fontSize: 13.5 }}>
            Quản lý thông tin nhà hàng, duyệt đăng ký và xác minh đầu bếp / chủ nhà hàng.
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #dde5ec', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#324253', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button type="button" style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#1f7a3f', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Thêm nhà hàng
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng số nhà hàng', value: stats.total, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'Đang hoạt động', value: stats.active, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'Chờ duyệt', value: stats.pending, color: '#9a6217', bg: '#fff4de' },
          { label: 'Ngừng hoạt động', value: stats.suspended, color: '#b42323', bg: '#fde3e3' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#55695d', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, background: s.bg, padding: '6px 10px', borderRadius: 10, display: 'inline-block' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all','active','pending','suspended'] as const).map(t => {
              const label = { all: 'Tất cả', active: 'Hoạt động', pending: 'Chờ duyệt', suspended: 'Ngừng hoạt động' }[t]
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
          <button type="button" onClick={() => setShowCat(true)} style={{ fontSize: 12, fontWeight: 800, color: '#1f7a3f', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            Quản lý loại hình nhà hàng →
          </button>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f5f9f6', border: '1px solid #ddeae0', borderRadius: 12, padding: '4px 4px 4px 12px', width: '100%' }}>
          <Search size={16} style={{ color: '#708677' }} />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm theo tên nhà hàng, quận / huyện…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '10px 6px', fontSize: 13.5, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 8 }}>
        <SharedDataTable<RestaurantAdminItem>
          title="Danh sách nhà hàng"
          totalCountBadge={filtered.length}
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          emptyMessage="Không có nhà hàng nào. Thay đổi bộ lọc hoặc thêm mới."
        />
      </div>

      {showCat && (
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Loại hình / Danh mục nhà hàng</h3>
          <CategoryForm onCancel={() => setShowCat(false)} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminRestaurantsPage
