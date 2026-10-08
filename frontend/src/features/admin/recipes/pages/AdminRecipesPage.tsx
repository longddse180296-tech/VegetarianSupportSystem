import React, { useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Pencil,
  Eye,
} from 'lucide-react'
import { AdminLayout } from '../../../../app/layouts/AdminLayout'
import { SharedDataTable, type ColumnDef } from '../../../../shared/components/SharedDataTable'
import RecipeForm from '../../components/RecipeForm'

interface RecipeItem {
  id: string
  title: string
  category: string
  cookTime: string
  calories: number
  author: string
  status: 'published' | 'pending' | 'hidden'
  tags: string[]
}

const MOCK: RecipeItem[] = [
  { id: 'rc1', title: 'Đậu hũ sốt nấm đông cô đậm đà', category: 'Món chính', cookTime: '20 phút', calories: 210, author: 'Chef Minh Tuấn', status: 'published', tags: ['Vegan', 'Nhiều đạm'] },
  { id: 'rc2', title: 'Salad bơ đậu gà sốt mè rang', category: 'Salad', cookTime: '10 phút', calories: 340, author: 'Lan Anh', status: 'published', tags: ['Vegan', 'Gluten-free'] },
  { id: 'rc3', title: 'Canh nấm hạt sen tảo đỏ', category: 'Món nước', cookTime: '25 phút', calories: 140, author: 'BS. Hoàng Nam', status: 'pending', tags: ['Lacto', 'Bồi bổ'] },
  { id: 'rc4', title: 'Bánh mì chay nướng giòn kẹp pate nấm', category: 'Món chính', cookTime: '15 phút', calories: 380, author: 'Nhật Hạ', status: 'hidden', tags: ['Ovo-Lacto'] },
]

interface AdminRecipesPageProps {
  onNavigate?: (path: string) => void
}

export const AdminRecipesPage: React.FC<AdminRecipesPageProps> = () => {
  const [rows, setRows] = useState<RecipeItem[]>(MOCK)
  const [keyword, setKeyword] = useState('')
  const [tab, setTab] = useState<'all' | 'published' | 'pending' | 'hidden'>('all')
  const [showForm, setShowForm] = useState(false)
  const [, setEditId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 8

  const stats = {
    total: rows.length,
    published: rows.filter(r => r.status === 'published').length,
    pending: rows.filter(r => r.status === 'pending').length,
    hidden: rows.filter(r => r.status === 'hidden').length,
  }

  const filtered = rows.filter(r =>
    (tab === 'all' || r.status === tab) &&
    (r.title.toLowerCase().includes(keyword.toLowerCase()) ||
     r.author.toLowerCase().includes(keyword.toLowerCase()))
  )

  const columns: ColumnDef<RecipeItem>[] = [
    {
      key: 'title',
      header: 'CÔNG THỨC',
      render: (item) => (
        <div className="min-w-0">
          <div className="font-bold line-clamp-2 leading-snug mb-1">{item.title}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {item.tags.map(t => (
              <span key={t} style={{ background: '#e7f7eb', color: '#1f7a3f', padding: '2px 7px', borderRadius: 999, fontWeight: 700, fontSize: 11 }}>#{t}</span>
            ))}
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'DANH MỤC', render: (item) => <span className="text-xs text-gray-600">{item.category}</span> },
    { key: 'cookTime', header: 'THỜI GIAN', render: (item) => <span className="text-xs text-gray-700">{item.cookTime}</span> },
    { key: 'calories', header: 'KCAL', align: 'right', render: (item) => <span className="font-mono text-xs font-bold text-gray-800">{item.calories}</span> },
    { key: 'author', header: 'TÁC GIẢ', render: (item) => <span className="text-xs font-semibold text-gray-800">{item.author}</span> },
    {
      key: 'status', header: 'TRẠNG THÁI', render: (item) => {
        const map = {
          published: { bg: '#e7f7eb', color: '#1f7a3f', label: 'Đã xuất bản' },
          pending:   { bg: '#fff4de', color: '#9a6217', label: 'Chờ duyệt' },
          hidden:    { bg: '#f0f4f8', color: '#324253', label: 'Ẩn' },
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
          <button type="button" className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors" title="Xem">
            <Eye size={13} />
          </button>
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
            <BookOpen size={22} /> Quản lý công thức món chay
          </h1>
          <p style={{ margin: 0, color: '#4e6558', fontSize: 13.5 }}>
            Duyệt, chỉnh sửa và xuất bản các công thức món chay cho cộng đồng.
          </p>
        </div>
        <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #dde5ec', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#324253', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button type="button" style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#1f7a3f', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => { setEditId(null); setShowForm(true) }}>
            <Plus size={14} /> Thêm công thức
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng số', value: stats.total, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'Đã xuất bản', value: stats.published, color: '#1f7a3f', bg: '#e7f7eb' },
          { label: 'Chờ duyệt', value: stats.pending, color: '#9a6217', bg: '#fff4de' },
          { label: 'Đã ẩn', value: stats.hidden, color: '#324253', bg: '#f0f4f8' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#55695d', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, background: s.bg, padding: '6px 10px', borderRadius: 10, display: 'inline-block' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          {(['all','published','pending','hidden'] as const).map(t => {
            const label = { all: 'Tất cả', published: 'Xuất bản', pending: 'Chờ duyệt', hidden: 'Ẩn' }[t]
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
            placeholder="Tìm kiếm tên công thức / tác giả…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '10px 6px', fontSize: 13.5, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 8 }}>
        <SharedDataTable<RecipeItem>
          title="Danh sách công thức"
          totalCountBadge={filtered.length}
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          currentPage={currentPage}
          totalPages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          emptyMessage="Không có công thức nào. Thử thay đổi bộ lọc hoặc thêm mới."
        />
      </div>

      {showForm && (
        <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e3efe5', borderRadius: 16, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Thêm / Chỉnh sửa công thức</h3>
          <RecipeForm onCancel={() => { setShowForm(false); setEditId(null) }} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminRecipesPage
