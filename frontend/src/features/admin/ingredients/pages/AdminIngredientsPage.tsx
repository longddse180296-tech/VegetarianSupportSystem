import React, { useState } from 'react'
import {
  Apple,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Pencil,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import IngredientForm from '../../components/IngredientForm'

interface IngredientItem {
  id: string
  name: string
  category: string
  eNumber: string
  vegan: boolean
  lactoVegan: boolean
  dangerLevel: 'safe' | 'warning' | 'danger'
}

const MOCK: IngredientItem[] = [
  { id: 'i1', name: 'Nước dùng xương heo (Pork Bone Broth)', category: 'Nước dùng & gia vị', eNumber: '—', vegan: false, lactoVegan: false, dangerLevel: 'danger' },
  { id: 'i2', name: 'Gelatin E441', category: 'Phụ gia tạo gel', eNumber: 'E441', vegan: false, lactoVegan: false, dangerLevel: 'danger' },
  { id: 'i3', name: 'Đậu phụ non (Silken Tofu)', category: 'Đạm thực vật', eNumber: '—', vegan: true, lactoVegan: true, dangerLevel: 'safe' },
  { id: 'i4', name: 'Sữa tươi không đường', category: 'Sữa & chế phẩm', eNumber: '—', vegan: false, lactoVegan: true, dangerLevel: 'warning' },
  { id: 'i5', name: 'Bột Agar-Agar (E406)', category: 'Phụ gia tạo gel', eNumber: 'E406', vegan: true, lactoVegan: true, dangerLevel: 'safe' },
]

interface AdminIngredientsPageProps {
  onNavigate?: (path: string) => void
}

export const AdminIngredientsPage: React.FC<AdminIngredientsPageProps> = () => {
  const [rows, setRows] = useState<IngredientItem[]>(MOCK)
  const [keyword, setKeyword] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [, setEditId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  const stats = {
    total: rows.length,
    safe: rows.filter(r => r.dangerLevel === 'safe').length,
    warning: rows.filter(r => r.dangerLevel === 'warning').length,
    danger: rows.filter(r => r.dangerLevel === 'danger').length,
  }

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(keyword.toLowerCase()) ||
    r.eNumber.toLowerCase().includes(keyword.toLowerCase())
  )

  const columns: ColumnDef<IngredientItem>[] = [
    {
      key: 'name',
      header: 'TÊN NGUYÊN LIỆU',
      render: (item) => <span className="font-bold">{item.name}</span>,
    },
    { key: 'category', header: 'DANH MỤC', render: (item) => <span className="text-gray-700 text-xs">{item.category}</span> },
    { key: 'eNumber', header: 'E-NUMBER', render: (item) => <span className="font-mono text-xs text-gray-600">{item.eNumber}</span> },
    {
      key: 'dangerLevel',
      header: 'PHÂN LOẠI',
      render: (item) => {
        const map = {
          safe:    { bg: '#e7f7eb', color: '#1f7a3f', label: 'An toàn' },
          warning: { bg: '#fff4de', color: '#9a6217', label: 'Cảnh báo' },
          danger:  { bg: '#fde3e3', color: '#b42323', label: 'Không thuần chay' },
        } as const
        const s = map[item.dangerLevel]
        return (
          <span
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 800,
              background: s.bg,
              color: s.color,
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </span>
        )
      },
    },
    {
      key: 'id',
      header: 'THAO TÁC',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            onClick={() => { setEditId(item.id); setShowForm(true) }}
            title="Chỉnh sửa"
          >
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
            <Apple size={22} /> Quản lý nguyên liệu &amp; E-number
          </h1>
          <p style={{ margin: 0, color: '#4e6558', fontSize: 13.5 }}>
            Cơ sở dữ liệu thành phần phân loại, cảnh báo phù hợp chế độ ăn chay.
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #dde5ec', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#324253', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button type="button" style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#1f7a3f', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setEditId(null); setShowForm(true) }}>
            <Plus size={14} /> Thêm nguyên liệu
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng số', value: stats.total, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'An toàn Thuần Chay', value: stats.safe, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'Cần cân nhắc', value: stats.warning, color: '#9a6217', bg: '#fff4de' },
          { label: 'Không thuần chay', value: stats.danger, color: '#b42323', bg: '#fde3e3' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#55695d', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, background: s.bg, padding: '6px 10px', borderRadius: 10, display: 'inline-block' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f5f9f6', border: '1px solid #ddeae0', borderRadius: 12, padding: '4px 4px 4px 12px', width: '100%' }}>
          <Search size={16} style={{ color: '#708677' }} />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tên nguyên liệu hoặc mã E-number (E441, E406…)"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '10px 6px', fontSize: 13.5, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 8 }}>
        <SharedDataTable<IngredientItem>
          title="Danh sách nguyên liệu"
          totalCountBadge={filtered.length}
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          emptyMessage="Không có nguyên liệu nào. Thử thay đổi bộ lọc hoặc thêm mới."
        />
      </div>

      {showForm && (
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Thêm / Chỉnh sửa nguyên liệu</h3>
          <IngredientForm onCancel={() => { setShowForm(false); setEditId(null) }} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminIngredientsPage
