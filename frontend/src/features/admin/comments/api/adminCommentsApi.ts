import type {
  AdminCommentFilter,
  AdminCommentItem,
  AdminCommentStats,
} from '../types/adminComments.types'

let MOCK_ADMIN_COMMENTS: AdminCommentItem[] = [
  {
    id: 'cmt-1',
    content:
      'Bài viết rất hữu ích và phân tích rất khoa học về lượng protein thực vật cần nạp mỗi ngày. Mình đã áp dụng được 2 tuần và thấy cơ thể nhẹ nhàng hẳn.',
    authorName: 'Nguyễn Minh Anh',
    authorEmail: 'minhanh@gmail.com',
    authorInitials: 'NA',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    targetType: 'article',
    targetTitle: 'Top 7 nguồn Protein thực vật hoàn hảo cho người tập',
    targetId: 'art-1',
    createdAt: '12/10/2026 14:20',
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'cmt-2',
    content:
      'Sữa hạt điều mè đen làm theo công thức uống rất thơm và béo, không bị tách nước hay lắng cặn. Cảm ơn bạn đã chia sẻ!',
    authorName: 'Lê Thu Hà',
    authorEmail: 'thuha.le@outlook.com',
    authorInitials: 'LH',
    authorAvatarBg: 'bg-teal-100 text-teal-800',
    targetType: 'video',
    targetTitle: 'Cách làm sữa hạt điều mè đen thơm béo sánh mịn tại nhà',
    targetId: 'vid-1',
    createdAt: '10/10/2026 09:15',
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'cmt-3',
    content:
      'Cho mình hỏi nếu thay nấm đùi gà bằng nấm hương tươi thì thời gian sốt trên chảo có cần giảm bớt không ạ? Mình sợ nấm bị ra nhiều nước.',
    authorName: 'Trần Gia Huy',
    authorEmail: 'giahuy.tran@gmail.com',
    authorInitials: 'TH',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    targetType: 'article',
    targetTitle: 'Cách làm Đậu hũ sốt nấm đậm đà hao cơm',
    targetId: 'art-2',
    createdAt: '08/10/2026 16:45',
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'cmt-4',
    content:
      'Bí quyết chiên chả giò giòn rụm này quá đỉnh, nhà mình ai ăn cũng khen nức nở. Lưu lại để làm tiệc chay rằm tháng 7 tới!',
    authorName: 'Phạm Quốc Bảo',
    authorEmail: 'baopham@yahoo.com',
    authorInitials: 'PB',
    authorAvatarBg: 'bg-sky-100 text-sky-800',
    targetType: 'video',
    targetTitle: 'Bí quyết chiên chả giò chay giòn rụm 4 tiếng không iu',
    targetId: 'vid-2',
    createdAt: '05/10/2026 18:45',
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
  {
    id: 'cmt-5',
    content:
      'Quảng cáo thuốc trị bệnh trá hình và có ngôn từ thô tục xúc phạm cộng đồng người ăn chay...',
    isViolation: true,
    violationReason: 'Vi phạm quy tắc cộng đồng',
    authorName: 'Bùi Anh Tuấn',
    authorEmail: 'tuananh88@gmail.com',
    authorInitials: 'BT',
    authorAvatarBg: 'bg-rose-100 text-rose-800',
    targetType: 'article',
    targetTitle: 'Những sai lầm phổ biến khi mới bắt đầu ăn thuần chay',
    targetId: 'art-3',
    createdAt: '28/09/2026 11:30',
    status: 'hidden',
    statusLabel: 'Đã ẩn / gỡ',
  },
  {
    id: 'cmt-6',
    content:
      'Thực đơn 7 ngày rất chi tiết và tiện chuẩn bị đồ chợ, mong ad chia sẻ thêm thực đơn chay giàu sắt cho người thiếu máu nhé!',
    authorName: 'Đặng Phương Thảo',
    authorEmail: 'phuongthao@gmail.com',
    authorInitials: 'PT',
    authorAvatarBg: 'bg-emerald-100 text-emerald-800',
    targetType: 'article',
    targetTitle: 'Thực đơn thuần chay 7 ngày thanh lọc và phục hồi năng lượng',
    targetId: 'art-4',
    createdAt: '25/09/2026 08:00',
    status: 'published',
    statusLabel: 'Đang hiển thị',
  },
]

export async function getAdminCommentStats(): Promise<AdminCommentStats> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    totalCount: 412,
    publishedCount: 398,
    hiddenCount: 14,
  }
}

export async function getAdminComments(filter: AdminCommentFilter = {}): Promise<{
  items: AdminCommentItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  let list = [...MOCK_ADMIN_COMMENTS]

  if (filter.status && filter.status !== 'all') {
    list = list.filter((c) => c.status === filter.status)
  }

  if (filter.targetType && filter.targetType !== 'all') {
    list = list.filter((c) => c.targetType === filter.targetType)
  }

  if (filter.keyword?.trim()) {
    const q = filter.keyword.toLowerCase().trim()
    list = list.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.authorEmail.toLowerCase().includes(q) ||
        c.targetTitle.toLowerCase().includes(q)
    )
  }

  const page = filter.page || 1
  const pageSize = filter.pageSize || 6
  const total = 412 // match Figma total count
  const totalPages = Math.max(69, Math.ceil(total / pageSize))
  const startIndex = (page - 1) * pageSize
  const items = list.slice(startIndex, startIndex + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function toggleHideComment(id: string): Promise<AdminCommentItem> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const target = MOCK_ADMIN_COMMENTS.find((c) => c.id === id)
  if (!target) throw new Error('Không tìm thấy bình luận.')

  target.status = target.status === 'published' ? 'hidden' : 'published'
  target.statusLabel = target.status === 'published' ? 'Đang hiển thị' : 'Đã ẩn / gỡ'
  return { ...target }
}

export async function deleteAdminComment(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  MOCK_ADMIN_COMMENTS = MOCK_ADMIN_COMMENTS.filter((c) => c.id !== id)
  return true
}
