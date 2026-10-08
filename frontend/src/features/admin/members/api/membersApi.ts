import type {
  MemberSummary,
  MemberDetail,
  MemberFilter,
  MemberStats,
  MemberArticle,
} from '../types'

const MEMBERS_STORAGE_KEY = 'vegetarian_admin_members_db'

const INITIAL_ARTICLES: MemberArticle[] = [
  {
    id: 'art_01',
    title: 'Top 7 nguồn Protein thực vật hoàn hảo cho người mới ăn chay',
    wordCount: 1420,
    readTimeMinutes: 6,
    category: 'Dinh dưỡng',
    publishedDate: '10/10/2026',
    voteCount: 48,
    commentCount: 14,
  },
  {
    id: 'art_02',
    title: 'Cách làm sữa hạt điều mè đen thơm béo tại nhà',
    wordCount: 890,
    readTimeMinutes: 4,
    category: 'Công thức & Mẹo',
    publishedDate: '02/10/2026',
    voteCount: 35,
    commentCount: 8,
  },
  {
    id: 'art_03',
    title: 'Thực đơn thuần chay 7 ngày thanh lọc cơ thể hiệu quả',
    wordCount: 2100,
    readTimeMinutes: 10,
    category: 'Lối sống lành mạnh',
    publishedDate: '24/09/2026',
    voteCount: 62,
    commentCount: 12,
  },
  {
    id: 'art_04',
    title: 'Kinh nghiệm chọn nấm tươi ngon và bảo quản đúng cách',
    wordCount: 1050,
    readTimeMinutes: 5,
    category: 'Cẩm nang',
    publishedDate: '15/09/2026',
    voteCount: 19,
    commentCount: 5,
  },
  {
    id: 'art_05',
    title: 'Bí quyết cân bằng Vitamin B12 cho người ăn chay trường',
    wordCount: 1650,
    readTimeMinutes: 7,
    category: 'Dinh dưỡng',
    publishedDate: '05/09/2026',
    voteCount: 42,
    commentCount: 9,
  },
  {
    id: 'art_06',
    title: '5 công thức sốt chấm thuần thực vật siêu bắt vị',
    wordCount: 920,
    readTimeMinutes: 4,
    category: 'Công thức & Mẹo',
    publishedDate: '28/08/2026',
    voteCount: 28,
    commentCount: 6,
  },
  {
    id: 'art_07',
    title: 'Cách nấu nước dùng chay ngọt thanh tự nhiên từ củ quả',
    wordCount: 1300,
    readTimeMinutes: 6,
    category: 'Công thức & Mẹo',
    publishedDate: '18/08/2026',
    voteCount: 55,
    commentCount: 11,
  },
  {
    id: 'art_08',
    title: 'Hành trình 3 năm ăn thuần chay và sự thay đổi kỳ diệu',
    wordCount: 2400,
    readTimeMinutes: 11,
    category: 'Lối sống lành mạnh',
    publishedDate: '02/08/2026',
    voteCount: 74,
    commentCount: 18,
  },
  {
    id: 'art_09',
    title: 'Phân biệt các loại đậu và giá trị dinh dưỡng của từng loại',
    wordCount: 1180,
    readTimeMinutes: 5,
    category: 'Dinh dưỡng',
    publishedDate: '20/07/2026',
    voteCount: 31,
    commentCount: 7,
  },
  {
    id: 'art_10',
    title: 'Mẹo chuẩn bị bữa trưa chay mang đi làm nhanh chóng',
    wordCount: 850,
    readTimeMinutes: 4,
    category: 'Công thức & Mẹo',
    publishedDate: '10/07/2026',
    voteCount: 39,
    commentCount: 4,
  },
  {
    id: 'art_11',
    title: 'Giải đáp thắc mắc: Ăn chay có bị thiếu máu hay không?',
    wordCount: 1750,
    readTimeMinutes: 8,
    category: 'Dinh dưỡng',
    publishedDate: '25/06/2026',
    voteCount: 46,
    commentCount: 13,
  },
  {
    id: 'art_12',
    title: 'Những gia vị chay cần có trong gian bếp hiện đại',
    wordCount: 980,
    readTimeMinutes: 5,
    category: 'Cẩm nang',
    publishedDate: '12/06/2026',
    voteCount: 22,
    commentCount: 5,
  },
]

const INITIAL_MEMBERS: MemberDetail[] = [
  {
    id: 'mb_01',
    code: '#VS-88902',
    fullName: 'Nguyễn Minh Anh',
    tagTitle: 'Thành viên tích cực',
    email: 'minhanh.nguyen@example.com',
    registeredDate: '08/09/2024',
    postCount: 12,
    videoCount: 5,
    commentCount: 34,
    status: 'active',
    dietaryType: 'Vegan (Thuần chay)',
    bio: 'Đam mê nấu ăn thuần thực vật và nghiên cứu dinh dưỡng cho người ăn chay trường.',
    articles: INITIAL_ARTICLES,
  },
  {
    id: 'mb_02',
    code: '#VS-88903',
    fullName: 'Lê Thu Hà',
    tagTitle: 'Thành viên',
    email: 'thuha.le@example.com',
    registeredDate: '15/09/2024',
    postCount: 8,
    videoCount: 2,
    commentCount: 19,
    status: 'active',
    dietaryType: 'Lacto-vegetarian',
    articles: INITIAL_ARTICLES.slice(0, 2),
  },
  {
    id: 'mb_03',
    code: '#VS-88904',
    fullName: 'Trần Gia Huy',
    tagTitle: 'Đầu bếp chay',
    email: 'giahuy.tran@example.com',
    registeredDate: '20/09/2024',
    postCount: 15,
    videoCount: 14,
    commentCount: 52,
    status: 'active',
    dietaryType: 'Vegan',
    articles: INITIAL_ARTICLES,
  },
  {
    id: 'mb_04',
    code: '#VS-88905',
    fullName: 'Vũ Hoàng Long',
    tagTitle: 'Thành viên mới',
    email: 'hoanglong.vu@example.com',
    registeredDate: '01/10/2024',
    postCount: 0,
    videoCount: 0,
    commentCount: 2,
    status: 'locked',
    lockReason: 'Spam nội dung quảng cáo trái quy định cộng đồng',
    dietaryType: 'Lacto-ovo vegetarian',
    articles: [],
  },
  {
    id: 'mb_05',
    code: '#VS-88906',
    fullName: 'Phạm Quốc Bảo',
    tagTitle: 'Tác giả bài viết',
    email: 'quocbao.pham@example.com',
    registeredDate: '05/10/2024',
    postCount: 6,
    videoCount: 3,
    commentCount: 15,
    status: 'active',
    dietaryType: 'Ovo-vegetarian',
    articles: INITIAL_ARTICLES.slice(1, 3),
  },
  {
    id: 'mb_06',
    code: '#VS-88907',
    fullName: 'Đặng Phương Thảo',
    tagTitle: 'Thành viên',
    email: 'phuongthao.dang@example.com',
    registeredDate: '12/10/2024',
    postCount: 4,
    videoCount: 1,
    commentCount: 8,
    status: 'active',
    dietaryType: 'Vegan',
    articles: INITIAL_ARTICLES.slice(0, 1),
  },
  {
    id: 'mb_07',
    code: '#VS-88908',
    fullName: 'Bùi Anh Tuấn',
    tagTitle: 'Thành viên',
    email: 'anhtuan.bui@example.com',
    registeredDate: '14/10/2024',
    postCount: 1,
    videoCount: 0,
    commentCount: 3,
    status: 'locked',
    lockReason: 'Ngôn từ không chuẩn mực trong bình luận',
    dietaryType: 'Lacto-vegetarian',
    articles: [],
  },
]

const getStoredMembers = (): MemberDetail[] => {
  const existing = localStorage.getItem(MEMBERS_STORAGE_KEY)
  if (existing) {
    try {
      return JSON.parse(existing) as MemberDetail[]
    } catch {
      // fallback
    }
  }
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(INITIAL_MEMBERS))
  return INITIAL_MEMBERS
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const membersApi = {
  /**
   * Fetch members list with search, status filters and pagination
   */
  async getMembers(filter: MemberFilter = {}): Promise<{
    items: MemberSummary[]
    total: number
    page: number
    pageSize: number
  }> {
    await delay(1200)
    let list = getStoredMembers()

    // Filter by search keyword
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q),
      )
    }

    // Filter by status
    if (filter.status && filter.status !== 'all') {
      list = list.filter((m) => m.status === filter.status)
    }

    // Sort
    if (filter.sortBy === 'most_posts') {
      list.sort((a, b) => b.postCount - a.postCount)
    } else {
      // default newest
      list.sort(
        (a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime(),
      )
    }

    const page = filter.page || 1
    const pageSize = filter.pageSize || 7
    let total = list.length
    if (!filter.search || !filter.search.trim()) {
      if (!filter.status || filter.status === 'all') {
        total = Math.max(list.length, 128)
      } else if (filter.status === 'active') {
        total = Math.max(list.length, 116)
      } else if (filter.status === 'locked') {
        total = Math.max(list.length, 12)
      }
    }
    const startIndex = (page - 1) * pageSize
    const items = list.slice(startIndex, startIndex + pageSize)

    return {
      items,
      total,
      page,
      pageSize,
    }
  },

  /**
   * Fetch single member detail by ID
   */
  async getMemberDetail(id: string): Promise<MemberDetail> {
    await delay(1000)
    const list = getStoredMembers()
    const found = list.find((m) => m.id === id)
    if (!found) {
      throw new Error('Không tìm thấy thông tin thành viên.')
    }
    return found
  },

  /**
   * Toggle lock / unlock status of member with reason
   */
  async toggleLockMember(
    id: string,
    reason?: string,
  ): Promise<{ member: MemberDetail; message: string }> {
    await delay(1400)
    const list = getStoredMembers()
    const index = list.findIndex((m) => m.id === id)

    if (index === -1) {
      throw new Error('Thành viên không tồn tại.')
    }

    const current = list[index]
    const newStatus = current.status === 'active' ? 'locked' : 'active'
    const updated: MemberDetail = {
      ...current,
      status: newStatus,
      lockReason: newStatus === 'locked' ? reason || 'Khóa bởi quản trị viên' : undefined,
    }

    list[index] = updated
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(list))

    return {
      member: updated,
      message:
        newStatus === 'locked'
          ? `Đã tạm khóa tài khoản của ${updated.fullName}.`
          : `Đã mở khóa tài khoản của ${updated.fullName} thành công.`,
    }
  },

  /**
   * Fetch system member statistics
   */
  async getMemberStats(): Promise<MemberStats> {
    await delay(800)
    const list = getStoredMembers()
    const active = list.filter((m) => m.status === 'active').length
    const locked = list.filter((m) => m.status === 'locked').length

    return {
      totalMembers: Math.max(list.length, 128),
      activeMembers: Math.max(active, 116),
      lockedMembers: Math.max(locked, 12),
      growthRatePercent: 12,
      activeRatePercent: 90.6,
    }
  },
}
