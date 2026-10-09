import type {
  ArticleDetailDto,
  ArticleFilterParams,
  ArticleFormData,
  ArticleSection,
  ArticleSummary,
  PaginatedResult,
  UserArticleItem,
  UserCommentItem,
  UserCommentSourceType,
} from '../types/article.types'

// Mock Database of Public Articles mirroring the Figma Mockup
const MOCK_ARTICLES: ArticleSummary[] = [
  {
    id: 'art-1',
    title: '7 lợi ích của chế độ ăn chay đối với sức khỏe thể chất và tinh thần',
    slug: '7-loi-ich-cua-che-do-an-chay-doi-voi-suc-khoe-the-chat-va-tinh-than',
    excerpt:
      'Ăn chay đúng phương pháp không chỉ thanh lọc hệ tiêu hóa, hỗ trợ ổn định chỉ số tim mạch và huyết áp, mà còn tái tạo năng lượng an yên, tăng cường khả năng tập trung tinh thần.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    category: 'lifestyle',
    categoryLabel: 'Lối sống chay',
    publishedAt: '15/05/2024',
    readTimeMinutes: 6,
    isFeatured: true,
    viewsCount: 2450,
    likesCount: 184,
    tags: ['#dinhduongthucvat', '#chaykhoemanh', '#healthyvegan', '#bshoangnam', '#songxanh'],
    author: {
      id: 'auth-1',
      name: 'BS. Hoàng Nam',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Chuyên gia dinh dưỡng lâm sàng',
      bio: 'Bác sĩ chuyên khoa Dinh dưỡng lâm sàng với hơn 10 năm kinh nghiệm nghiên cứu và tư vấn dinh dưỡng thuần chay, hỗ trợ bệnh nhân tim mạch và đái tháo đường.',
      isExpert: true,
    },
  },
  {
    id: 'art-2',
    title: 'Cách bổ sung protein toàn diện khi ăn chay',
    slug: 'cach-bo-sung-protein-toan-dien-khi-an-chay',
    excerpt:
      'Khám phá các nguồn đạm thực vật dồi dào từ đậu nành, đậu gà, hạt chia và yến mạch giúp cơ thể duy trì cơ bắp săn chắc và năng lượng bền bỉ.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: '14/05/2024',
    readTimeMinutes: 5,
    viewsCount: 1890,
    likesCount: 142,
    tags: ['#Protein thực vật', '#dinhduongthucvat', '#tangcochay'],
    author: {
      id: 'auth-2',
      name: 'Lan Anh',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Blogger Dinh dưỡng Thực vật',
      isExpert: false,
    },
  },
  {
    id: 'art-3',
    title: 'Những nguyên liệu nên có trong căn bếp chay ấm cúng',
    slug: 'nhung-nguyen-lieu-nen-co-trong-can-bep-chay',
    excerpt:
      'Tổng hợp các loại gia vị, hạt ngũ cốc nguyên cám và dầu thực vật ép lạnh cần thiết để bạn dễ dàng chuẩn bị bữa ăn ngon lành chỉ trong 15 phút.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=600&q=80',
    category: 'ingredients',
    categoryLabel: 'Nguyên liệu',
    publishedAt: '12/05/2024',
    readTimeMinutes: 4,
    viewsCount: 1420,
    likesCount: 98,
    tags: ['#Meal Prep', '#nguyenlieuchay', '#bepchay'],
    author: {
      id: 'auth-3',
      name: 'Chef Minh Tuấn',
      avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Đầu bếp chay đương đại',
      isExpert: true,
    },
  },
  {
    id: 'art-4',
    title: 'Làm thế nào để bắt đầu ăn chay đúng cách cho người mới',
    slug: 'lam-the-nao-de-bat-dau-an-chay-dung-cach',
    excerpt:
      'Hướng dẫn lộ trình chuyển đổi từng bước từ ăn mặn sang ăn chay mà không lo thiếu chất, đuối sức hay áp lực tâm lý trong những tuần đầu tiên.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    category: 'lifestyle',
    categoryLabel: 'Lối sống chay',
    publishedAt: '10/05/2024',
    readTimeMinutes: 7,
    viewsCount: 3100,
    likesCount: 230,
    tags: ['#Ăn chay tuần', '#nguoimoianchay', '#songxanh'],
    author: {
      id: 'auth-4',
      name: 'ThS. Thu Hằng',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Chuyên gia Tâm lý & Lối sống',
      isExpert: true,
    },
  },
  {
    id: 'art-5',
    title: '5 nguồn canxi thực vật để tìm thay thế sữa động vật',
    slug: '5-nguon-canxi-thuc-vat-thay-the-sua-dong-vat',
    excerpt:
      'Tìm hiểu hàm lượng canxi vượt trội trong mè đen, cải xoăn kale, đậu hũ non và hạt hạnh nhân giúp bảo vệ khung xương chắc khỏe tự nhiên.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    category: 'health',
    categoryLabel: 'Sức khỏe',
    publishedAt: '08/05/2024',
    readTimeMinutes: 6,
    viewsCount: 2150,
    likesCount: 165,
    tags: ['#dinhduongthucvat', '#canxithucvat', '#xuongkhop'],
    author: {
      id: 'auth-1',
      name: 'BS. Hoàng Nam',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Chuyên gia dinh dưỡng lâm sàng',
      isExpert: true,
    },
  },
  {
    id: 'art-6',
    title: 'Cách xây dựng bữa ăn chay cân bằng theo đĩa dinh dưỡng',
    slug: 'cach-xay-dung-bua-an-chay-can-bang-theo-dia-dinh-duong',
    excerpt:
      'Áp dụng quy tắc tiêu chuẩn: một nửa đĩa rau xanh trái cây, một phần tư đạm thực vật và một phần tư tinh bột phức hợp cho bữa ăn hoàn hảo.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    publishedAt: '05/05/2024',
    readTimeMinutes: 8,
    viewsCount: 1980,
    likesCount: 177,
    tags: ['#Thực đơn khoa học', '#diadinhduong', '#dinhduongthucvat'],
    author: {
      id: 'auth-5',
      name: 'DS. Kim Oanh',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Dược sĩ & Chuyên viên Dinh dưỡng',
      isExpert: true,
    },
  },
  {
    id: 'art-7',
    title: 'Những lỗi thường gặp khi mới ăn chay và cách khắc phục',
    slug: 'nhung-loi-thuong-gap-khi-moi-an-chay-va-cach-khac-phuc',
    excerpt:
      'Tránh bẫy ăn quá nhiều tinh bột chế biến sẵn, thiếu vi chất sắt hoặc vitamin B12 bằng những thói quen kết hợp thực phẩm thông minh.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    category: 'experience',
    categoryLabel: 'Kinh nghiệm',
    publishedAt: '02/05/2024',
    readTimeMinutes: 5,
    viewsCount: 1620,
    likesCount: 120,
    tags: ['#Vitamin B12', '#kinhnghiemanchay', '#chaykhoemanh'],
    author: {
      id: 'auth-6',
      name: 'Minh Đức',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Người thực hành lối sống xanh 5 năm',
      isExpert: false,
    },
  },
]

export const TRENDING_TAGS = [
  '#Protein thực vật',
  '#Vitamin B12',
  '#Thực đơn khoa học',
  '#Ăn chay tuần',
  '#Sống xanh',
  '#Meal Prep',
  '#Trẻ em ăn chay',
]

export const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'nutrition', label: 'Dinh dưỡng' },
  { id: 'lifestyle', label: 'Lối sống chay' },
  { id: 'cooking-tips', label: 'Mẹo nấu ăn' },
  { id: 'health', label: 'Sức khỏe' },
  { id: 'ingredients', label: 'Nguyên liệu' },
  { id: 'experience', label: 'Kinh nghiệm' },
]

/**
 * Fetch paginated list of public articles with search & category filters
 */
export async function getArticles(
  params: ArticleFilterParams = {}
): Promise<PaginatedResult<ArticleSummary>> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  let filtered = [...MOCK_ARTICLES]

  if (params.category && params.category !== 'all') {
    filtered = filtered.filter((a) => a.category === params.category)
  }

  if (params.keyword?.trim()) {
    const q = params.keyword.toLowerCase().trim()
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (params.tag) {
    const t = params.tag.toLowerCase().trim()
    filtered = filtered.filter((a) => a.tags.some((item) => item.toLowerCase() === t))
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 6
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const items = filtered.slice(startIndex, startIndex + pageSize)

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Fetch featured article
 */
export async function getFeaturedArticle(): Promise<ArticleSummary> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const featured = MOCK_ARTICLES.find((a) => a.isFeatured) || MOCK_ARTICLES[0]
  return featured
}

const MOCK_ARTICLE_DETAILS: Record<string, ArticleDetailDto> = {}

function parseContentToSections(content: string) {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  if (blocks.length === 0) {
    return [{ content }]
  }

  let autoNum = 1
  const sections: ArticleSection[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const firstLine = lines[0] || ''

    const isHeading =
      firstLine.startsWith('#') ||
      /^(?:\d+[.)]|Phần\s+\d+)[\s:]/i.test(firstLine)

    if (isHeading) {
      const match = firstLine.match(
        /^(?:#{1,3}\s*)?(?:(?:(\d+)[.)]|Phần\s+(\d+)[:.]?)\s*)?([^\n]+)$/i
      )
      const explicitNum = match ? match[1] || match[2] : null
      const num = explicitNum ? parseInt(explicitNum, 10) : autoNum++
      const rawTitle = match ? match[3] : firstLine
      const cleanTitle = rawTitle
        .replace(/^#{1,3}\s*/, '')
        .replace(/^(?:\d+[.)]|Phần\s+\d+[:.]?)\s*/i, '')
        .trim()

      let body = lines.slice(1).join('\n').trim()

      // If body is empty, check if next block is a non-heading paragraph to join
      if (!body && i + 1 < blocks.length) {
        const nextBlock = blocks[i + 1]
        const nextFirstLine = nextBlock.split('\n')[0].trim()
        const nextIsHeading =
          nextFirstLine.startsWith('#') ||
          /^(?:\d+[.)]|Phần\s+\d+)[\s:]/i.test(nextFirstLine)

        if (!nextIsHeading) {
          body = nextBlock
          i++ // advance index
        }
      }

      sections.push({
        number: num,
        title: cleanTitle,
        content: body || cleanTitle,
      })
    } else {
      sections.push({
        content: block,
      })
    }
  }

  return sections.length > 0 ? sections : [{ content }]
}

/**
 * Fetch article detail by ID or Slug
 */
export async function getArticleById(id: string): Promise<ArticleDetailDto> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (MOCK_ARTICLE_DETAILS[id]) {
    return MOCK_ARTICLE_DETAILS[id]
  }

  const base = MOCK_ARTICLES.find((a) => a.id === id || a.slug === id) || MOCK_ARTICLES[0]

  return {
    ...base,
    captionHeroImage: 'Bữa ăn chay chuẩn dinh dưỡng với các loại rau củ tươi, đậu hạt và ngũ cốc nguyên cám.',
    sections: [
      {
        content:
          'Trong những năm gần đây, xu hướng chuyển đổi sang lối sống ăn chay đang nhận được sự quan tâm mạnh mẽ từ cộng đồng y khoa cũng như người tiêu dùng trên toàn cầu. Không chỉ đơn thuần là sự lựa chọn về mặt ẩm thực, ăn chay khoa học mang lại những tác động tích cực sâu sắc đến cả sức khỏe thể chất lẫn trạng thái tinh thần của bạn.',
      },
      {
        number: 1,
        title: 'Thanh lọc hệ tiêu hóa và tăng cường miễn dịch',
        content:
          'Chế độ ăn giàu chất xơ từ rau củ quả và ngũ cốc nguyên cám kích thích nhu động ruột, phòng ngừa táo bón hiệu quả. Hệ vi sinh vật đường ruột khỏe mạnh là lá chắn tự nhiên giúp bảo vệ cơ thể khỏi sự tấn công của mầm bệnh, hỗ trợ điều hòa phản ứng viêm và tối ưu hóa khả năng hấp thu dinh dưỡng.',
      },
      {
        number: 2,
        title: 'Kiểm soát cân nặng và duy trì vóc dáng thon gọn',
        content:
          'Thực phẩm có nguồn gốc thực vật thường có mật độ calo thấp nhưng hàm lượng chất xơ dồi dào, tạo cảm giác no lâu mà không nạp quá nhiều năng lượng rỗng. Nhờ đó, người ăn chay dễ dàng duy trì cân nặng lý tưởng, giảm thiểu nguy cơ béo phì và các hội chứng chuyển hóa nguy hiểm.',
      },
      {
        number: 3,
        title: 'Tối ưu hóa sức khỏe tim mạch và huyết áp',
        content:
          'Nghiên cứu cho thấy người ăn chay đều đặn giảm tới 32% nguy cơ tử vong do bệnh tim mạch. Hàm lượng chất béo bão hòa và cholesterol gần như bằng không trong thực vật giúp ngăn ngừa sự hình thành mảng xơ vữa động mạch, ổn định áp lực lòng mạch và tăng cường độ đàn hồi của mao mạch.',
      },
      {
        number: 4,
        title: 'Cải thiện giấc ngủ và giảm căng thẳng, lo âu',
        content:
          'Thực phẩm thực vật giàu magie, tryptophan và vitamin nhóm B giúp kích thích sản xuất serotonin và melatonin tự nhiên trong não bộ. Điều này giúp hệ thần kinh thư giãn, giảm chứng mất ngủ mãn tính và mang lại trạng thái tâm trí thanh thản, an yên.',
      },
      {
        number: 5,
        title: 'Cung cấp dồi dào chất chống oxy hóa chống lão hóa',
        content:
          'Vitamin C, E, flavonoid và carotenoid trong rau quả là những chất chống gốc tự do mạnh mẽ. Chúng ngăn chặn quá trình tổn thương tế bào, nuôi dưỡng làn da sáng khỏe từ sâu bên trong và làm chậm tốc độ thoái hóa của các cơ quan nội tạng.',
      },
      {
        number: 6,
        title: 'Hạ cholesterol xấu và hỗ trợ ổn định đường huyết',
        content:
          'Chất xơ hòa tan trong yến mạch, đậu và táo gắn kết với axit mật trong ruột, hỗ trợ đào thải cholesterol LDL dư thừa ra khỏi cơ thể. Đồng thời, chỉ số GI thấp của thực vật làm chậm quá trình hấp thu đường vào máu, ngăn ngừa đỉnh đường huyết sau ăn.',
      },
      {
        number: 7,
        title: 'Nuôi dưỡng tinh thần an định và lòng trắc ẩn',
        content:
          'Ăn chay không chỉ nuôi dưỡng tế bào mà còn nuôi dưỡng tâm hồn. Cảm giác sống hài hòa với thiên nhiên và bảo vệ muôn loài mang đến sự an lạc nội tại, giúp bạn dễ dàng đón nhận cuộc sống với thái độ tích cực và tràn đầy năng lượng yêu thương.',
      },
    ],
    quoteBox: {
      quote:
        '“Ăn chay đúng phương pháp là nghệ thuật lắng nghe cơ thể, nơi mỗi bữa ăn trở thành liều thuốc tự nhiên nuôi dưỡng cả thể xác lẫn tâm hồn bạn một cách trọn vẹn nhất.”',
      author: 'BS. Hoàng Nam – Chuyên gia Dinh dưỡng Lâm sàng',
    },
    expertAdvice: {
      title: 'LỜI KHUYÊN CHUYÊN GIA',
      content:
        'Khi mới bắt đầu, bạn nên chuyển đổi từ từ, tăng dần tỷ lệ thực vật trong mỗi bữa ăn. Hãy chú ý bổ sung đa dạng sắc màu rau củ và không quên xét nghiệm định kỳ chỉ số Vitamin B12 và Ferritin (dự trữ sắt) mỗi 6 tháng một lần.',
    },
    comments: [
      {
        id: 'c-1',
        articleId: id,
        authorName: 'Mai Phương',
        authorAvatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        badge: 'Người đọc tích cực',
        createdAt: '16/05/2024 14:30',
        content:
          'Bài viết cực kỳ chi tiết và dễ hiểu! Mình đã bắt đầu ăn chay được 3 tháng và thấy da dẻ sáng hơn hẳn, ngủ sâu giấc hơn rất nhiều.',
        likesCount: 12,
        isLiked: false,
      },
      {
        id: 'c-2',
        articleId: id,
        authorName: 'Lê Thế Hùng',
        authorAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        createdAt: '16/05/2024 16:15',
        content:
          'Bác sĩ cho em hỏi thêm là người hay tập gym thì lượng đạm thực vật mỗi ngày nên nạp khoảng bao nhiêu gram để không bị hao cơ ạ?',
        likesCount: 5,
        isLiked: false,
      },
      {
        id: 'c-3',
        articleId: id,
        authorName: 'Đỗ Ngọc Ánh',
        authorAvatar:
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        createdAt: '17/05/2024 09:20',
        content:
          'Phần trích dẫn và lời khuyên rất truyền cảm hứng. Cảm ơn ban biên tập đã cung cấp thông tin khoa học bổ ích!',
        likesCount: 8,
        isLiked: true,
      },
    ],
    relatedArticles: MOCK_ARTICLES.filter((a) => a.id !== id).slice(0, 3),
  }
}

/**
 * Add a comment to an article
 */
export async function addArticleComment(
  _articleId: string,
  content: string,
  _authorName = 'Bạn'
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  if (!content.trim()) throw new Error('Nội dung bình luận không được để trống')
}

/**
 * Toggle like for an article
 */
export async function toggleArticleLike(_articleId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}

/**
 * Toggle like for a comment
 */
export async function toggleArticleCommentLike(_commentId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return true
}

/**
 * Toggle save / bookmark for an article
 */
export async function toggleArticleSave(_articleId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}

// ==========================================
// Phase 2: User Content Management Mock Data & APIs
// ==========================================

let MOCK_USER_ARTICLES: UserArticleItem[] = [
  {
    id: 'user-art-1',
    title: 'Top 7 nguồn Protein thực vật hoàn hảo cho người mới ăn chay',
    excerpt:
      'Khám phá cách phối hợp Tempeh, hạt gai dầu, Edamame và đậu lăng để đảm bảo đủ axit amin thiết yếu mà không cần phụ thuộc vào đạm động vật.',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '10/10/2026',
    updatedAt: '10/10/2026',
    viewsCount: 1840,
    likesCount: 48,
    commentsCount: 15,
  },
  {
    id: 'user-art-2',
    title: 'Cách chuẩn bị Meal Prep chay tiện lợi cho cả tuần bận rộn',
    excerpt:
      'Giải pháp phân chia khẩu phần theo tỉ lệ vàng: 1/2 rau củ, 1/4 ngũ cốc nguyên cám và 1/4 protein thực vật, tiết kiệm tối đa 5 tiếng nấu nướng mỗi tuần.',
    category: 'lifestyle',
    categoryLabel: 'Lối sống',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '28/09/2026',
    updatedAt: '28/09/2026',
    viewsCount: 942,
    likesCount: 35,
    commentsCount: 12,
  },
  {
    id: 'user-art-3',
    title: '7 lợi ích của chế độ ăn chay đối với sức khỏe thể chất và tinh thần',
    excerpt:
      'Từ cải thiện hệ vi sinh đường ruột, ổn định chỉ số đường huyết đến việc nuôi dưỡng tâm an lạc qua góc nhìn y học lối sống hiện đại.',
    category: 'health',
    categoryLabel: 'Sức khỏe',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '15/09/2026',
    updatedAt: '15/09/2026',
    viewsCount: 3250,
    likesCount: 62,
    commentsCount: 24,
  },
  {
    id: 'user-art-4',
    title: 'Kinh nghiệm chọn nấm tươi ngon và bảo quản đúng cách',
    excerpt:
      'Mẹo nhận biết nấm hương, nấm bào ngư tự nhiên không qua xử lý hóa chất và kỹ thuật giữ nấm giòn ngọt suốt 7 ngày trong tủ mát...',
    category: 'ingredients',
    categoryLabel: 'Nguyên liệu',
    status: 'draft',
    statusLabel: 'Chưa xuất bản',
    updatedAt: 'Cập nhật 2 ngày trước',
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    completionRate: 65,
  },
  {
    id: 'user-art-5',
    title: 'Bí quyết nấu nước dùng phở chay trong veo từ rau củ quả ngọt lành',
    excerpt:
      'Hầm mía, củ cải trắng, lê và hành tây nướng cháy cạnh tạo nên vị ngọt thanh đậm đà không thua kém nước dùng truyền thống.',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '05/09/2026',
    updatedAt: '05/09/2026',
    viewsCount: 1520,
    likesCount: 56,
    commentsCount: 18,
  },
  {
    id: 'user-art-6',
    title: 'Lộ trình bổ sung vitamin B12 khoa học cho người ăn thuần chay',
    excerpt:
      'Hiểu rõ về liều lượng men dinh dưỡng (nutritional yeast) và viên uống bổ sung định kỳ theo khuyến cáo của hiệp hội dinh dưỡng Hoa Kỳ.',
    category: 'nutrition',
    categoryLabel: 'Dinh dưỡng',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '20/08/2026',
    updatedAt: '20/08/2026',
    viewsCount: 2110,
    likesCount: 88,
    commentsCount: 22,
  },
  {
    id: 'user-art-7',
    title: 'Cẩm nang đi chợ chay tiết kiệm: Mua gì, ở đâu và trữ thế nào?',
    excerpt:
      'Kinh nghiệm săn rau củ hữu cơ tươi ngon, các loại đậu hạt giá tốt tại chợ đầu mối và cách bảo quản hút chân không thông minh.',
    category: 'experience',
    categoryLabel: 'Kinh nghiệm',
    status: 'draft',
    statusLabel: 'Chưa xuất bản',
    updatedAt: 'Cập nhật 5 ngày trước',
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    completionRate: 40,
  },
  {
    id: 'user-art-8',
    title: 'Cách làm sữa chua đậu nành lên men tự nhiên mịn mượt không tách nước',
    excerpt:
      'Công thức đơn giản dùng men vi sinh thuần chay (probiotic) và sữa đậu nành nguyên chất thơm béo.',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '12/08/2026',
    updatedAt: '12/08/2026',
    viewsCount: 1780,
    likesCount: 71,
    commentsCount: 19,
  },
  {
    id: 'user-art-9',
    title: 'Sức mạnh của hạt chia và hạt lanh đối với trái tim người ăn chay',
    excerpt:
      'Nguồn Axit béo Omega-3 ALA từ thực vật giúp ổn định cholesterol và giảm mảng bám thành mạch máu.',
    category: 'health',
    categoryLabel: 'Sức khỏe',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '01/08/2026',
    updatedAt: '01/08/2026',
    viewsCount: 1340,
    likesCount: 42,
    commentsCount: 9,
  },
  {
    id: 'user-art-10',
    title: 'Thay thế trứng trong làm bánh ngọt thuần chay: 5 nguyên liệu kỳ diệu',
    excerpt:
      'Tận dụng nước đậu gà (aquafaba), chuối nghiền, sốt táo và hạt lanh xay để tạo độ bông xốp hoàn hảo cho bánh gato và muffin.',
    category: 'cooking-tips',
    categoryLabel: 'Mẹo nấu ăn',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '25/07/2026',
    updatedAt: '25/07/2026',
    viewsCount: 2460,
    likesCount: 94,
    commentsCount: 27,
  },
  {
    id: 'user-art-11',
    title: 'Ăn chay khi đi du lịch: Bí kíp sinh tồn và thưởng thức ẩm thực bản địa',
    excerpt:
      'Cách tra cứu quán chay địa phương, lưu câu thoại giao tiếp cơ bản và chuẩn bị đồ ăn nhẹ giàu năng lượng khi di chuyển.',
    category: 'lifestyle',
    categoryLabel: 'Lối sống',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '10/07/2026',
    updatedAt: '10/07/2026',
    viewsCount: 1650,
    likesCount: 53,
    commentsCount: 14,
  },
  {
    id: 'user-art-12',
    title: 'Giải mã cơn thèm thịt khi mới ăn chay và mẹo vượt qua dễ dàng',
    excerpt:
      'Tại sao cơ thể lại phát tín hiệu thèm thịt trong 2 tuần đầu và cách đánh lừa vị giác bằng nấm đùi gà xào sốt tiêu đen umami.',
    category: 'experience',
    categoryLabel: 'Kinh nghiệm',
    status: 'published',
    statusLabel: 'Đã xuất bản',
    publishedAt: '01/07/2026',
    updatedAt: '01/07/2026',
    viewsCount: 2890,
    likesCount: 110,
    commentsCount: 31,
  },
]

let MOCK_USER_COMMENTS: UserCommentItem[] = [
  {
    id: 'u-comm-1',
    sourceType: 'recipe',
    sourceLabel: 'Món Công thức',
    targetTitle: 'Đậu hũ sốt nấm đậm đà thanh ngọt',
    targetTypePrefix: 'Đã bình luận trên món ăn:',
    createdAt: '2 giờ trước',
    status: 'active',
    likesCount: 8,
    content:
      '“Mình đã làm thử theo công thức này, nấm đông cô hòa quyện sốt rất thơm và đậm vị, cả nhà đều khen. Cảm ơn tác giả nhiều!”',
  },
  {
    id: 'u-comm-2',
    sourceType: 'article',
    sourceLabel: 'Bài viết',
    targetTitle: '7 lợi ích của chế độ ăn chay đối với sức khỏe & kiểm soát chỉ số BMI',
    targetTypePrefix: 'Đã bình luận trên bài viết cẩm nang:',
    createdAt: '2 ngày trước',
    status: 'active',
    likesCount: 15,
    content:
      '“Bài viết phân tích rất khoa học về việc chuyển đổi chế độ ăn mà không bị thiếu hụt vi chất B12 và đạm. Rất hữu ích cho người mới!”',
  },
  {
    id: 'u-comm-3',
    sourceType: 'video',
    sourceLabel: 'Video',
    targetTitle: 'Hướng dẫn làm sữa hạt điều mè đen thơm lừng sánh mịn tại nhà',
    targetTypePrefix: 'Đã bình luận trên video ẩm thực:',
    targetThumbnail:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80',
    createdAt: '5 ngày trước',
    status: 'active',
    likesCount: 5,
    content:
      '“Thời gian ngâm hạt điều bao lâu là chuẩn nhất vậy bạn? Mình ngâm 4 tiếng thấy xay rất mịn.”',
    authorReply: {
      authorName: 'Bếp Chay An Nhiên (Tác giả)',
      roleBadge: 'Tác giả',
      createdAt: '4 ngày trước',
      content:
        '“Chào bạn Minh Anh, hạt điều tươi ngâm từ 2 - 4 tiếng là chuẩn vị nhất! Nếu dùng nước ấm thì chỉ cần 1 tiếng là có thể xay mịn màng rồi.”',
    },
  },
  {
    id: 'u-comm-4',
    sourceType: 'recipe',
    sourceLabel: 'Món Công thức',
    targetTitle: 'Bún Huế chay nước dùng củ quả thanh ngọt chuẩn vị Cố Đô',
    targetTypePrefix: 'Đã bình luận trên món ăn:',
    targetThumbnail:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
    createdAt: '1 tuần trước',
    status: 'active',
    likesCount: 11,
    content:
      '“Nước dùng ngọt thanh tự nhiên từ củ cải và bắp ngọt, đúng chuẩn vị Huế!”',
  },
]

/**
 * Fetch list of articles owned by current user
 */
export async function getUserArticles(params: {
  statusTab?: 'all' | 'published' | 'draft'
  keyword?: string
  sortBy?: 'newest' | 'views'
  page?: number
  pageSize?: number
}): Promise<PaginatedResult<UserArticleItem>> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  let list = [...MOCK_USER_ARTICLES]

  if (params.statusTab && params.statusTab !== 'all') {
    list = list.filter((a) => a.status === params.statusTab)
  }

  if (params.keyword?.trim()) {
    const q = params.keyword.toLowerCase().trim()
    list = list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q)
    )
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 4
  const totalCount = list.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const items = list.slice(startIndex, startIndex + pageSize)

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Fetch comments created by current user
 */
export async function getUserComments(params: {
  sourceType?: UserCommentSourceType
  keyword?: string
  sortBy?: 'newest' | 'likes'
  page?: number
  pageSize?: number
}): Promise<PaginatedResult<UserCommentItem>> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  let list = [...MOCK_USER_COMMENTS]

  if (params.sourceType && params.sourceType !== 'all') {
    list = list.filter((c) => c.sourceType === params.sourceType)
  }

  if (params.keyword?.trim()) {
    const q = params.keyword.toLowerCase().trim()
    list = list.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.targetTitle.toLowerCase().includes(q)
    )
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 4
  const totalCount = list.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const items = list.slice(startIndex, startIndex + pageSize)

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * Create a new user article
 */
export async function createUserArticle(data: ArticleFormData): Promise<UserArticleItem> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const newArticle: UserArticleItem = {
    id: `user-art-${Date.now()}`,
    title: data.title,
    excerpt: data.excerpt || data.content.slice(0, 150) + '...',
    category: data.category,
    categoryLabel: CATEGORIES.find((c) => c.id === data.category)?.label || 'Dinh dưỡng',
    status: data.status,
    statusLabel: data.status === 'published' ? 'Đã xuất bản' : 'Chưa xuất bản',
    publishedAt: data.status === 'published' ? 'Hôm nay' : undefined,
    updatedAt: 'Vừa xong',
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    completionRate: data.status === 'draft' ? 70 : undefined,
    thumbnailUrl: data.thumbnailUrl,
  }
  MOCK_USER_ARTICLES = [newArticle, ...MOCK_USER_ARTICLES]

  const rawUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null
  const parsedUser = rawUser ? JSON.parse(rawUser) : null
  const authorName = parsedUser?.fullName || 'Van Quang Duy'

  const detailDto: ArticleDetailDto = {
    id: newArticle.id,
    title: newArticle.title,
    slug: newArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    excerpt: newArticle.excerpt,
    thumbnailUrl: newArticle.thumbnailUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    category: newArticle.category,
    categoryLabel: newArticle.categoryLabel,
    publishedAt: 'Hôm nay',
    readTimeMinutes: Math.max(1, Math.ceil(data.content.split(/\s+/).length / 120)),
    tags: ['#chaykhoemanh', '#dinhduongthucvat'],
    author: {
      id: parsedUser?.id || 'user-curr',
      name: authorName,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      roleTitle: 'Tác giả cộng đồng',
    },
    viewsCount: 0,
    likesCount: 0,
    captionHeroImage:
      data.captionHeroImage ||
      'Bữa ăn chay chuẩn dinh dưỡng với các loại rau củ tươi, đậu hạt và ngũ cốc nguyên cám.',
    sections: parseContentToSections(data.content),
    comments: [],
    relatedArticles: MOCK_ARTICLES.slice(0, 3),
  }
  MOCK_ARTICLE_DETAILS[newArticle.id] = detailDto

  if (data.status === 'published') {
    MOCK_ARTICLES.unshift(detailDto)
  }

  return newArticle
}

/**
 * Update an existing article
 */
export async function updateUserArticle(
  id: string,
  data: ArticleFormData
): Promise<UserArticleItem> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const idx = MOCK_USER_ARTICLES.findIndex((a) => a.id === id)
  let updated: UserArticleItem

  if (idx !== -1) {
    updated = {
      ...MOCK_USER_ARTICLES[idx],
      title: data.title,
      excerpt: data.excerpt || data.content.slice(0, 150) + '...',
      category: data.category,
      categoryLabel: CATEGORIES.find((c) => c.id === data.category)?.label || 'Dinh dưỡng',
      status: data.status,
      statusLabel: data.status === 'published' ? 'Đã xuất bản' : 'Chưa xuất bản',
      updatedAt: 'Hôm nay, vừa xong',
      thumbnailUrl: data.thumbnailUrl || MOCK_USER_ARTICLES[idx].thumbnailUrl,
    }
    MOCK_USER_ARTICLES[idx] = updated
  } else {
    const existing = MOCK_ARTICLES.find((a) => a.id === id) || MOCK_ARTICLE_DETAILS[id]
    updated = {
      id,
      title: data.title,
      excerpt: data.excerpt || data.content.slice(0, 150) + '...',
      category: data.category,
      categoryLabel: CATEGORIES.find((c) => c.id === data.category)?.label || 'Dinh dưỡng',
      status: data.status,
      statusLabel: data.status === 'published' ? 'Đã xuất bản' : 'Chưa xuất bản',
      updatedAt: 'Hôm nay, vừa xong',
      publishedAt: existing?.publishedAt || 'Hôm nay',
      viewsCount: existing?.viewsCount || 0,
      likesCount: existing?.likesCount || 0,
      commentsCount: 0,
      thumbnailUrl: data.thumbnailUrl || existing?.thumbnailUrl || '',
    }
    MOCK_USER_ARTICLES = [updated, ...MOCK_USER_ARTICLES]
  }

  const pubIdx = MOCK_ARTICLES.findIndex((a) => a.id === id)
  if (pubIdx >= 0) {
    MOCK_ARTICLES[pubIdx].title = data.title
    MOCK_ARTICLES[pubIdx].category = data.category
    MOCK_ARTICLES[pubIdx].excerpt = updated.excerpt
    if (data.thumbnailUrl) {
      MOCK_ARTICLES[pubIdx].thumbnailUrl = data.thumbnailUrl
    }
  }

  if (MOCK_ARTICLE_DETAILS[id]) {
    MOCK_ARTICLE_DETAILS[id].title = data.title
    MOCK_ARTICLE_DETAILS[id].category = data.category
    MOCK_ARTICLE_DETAILS[id].categoryLabel = updated.categoryLabel
    MOCK_ARTICLE_DETAILS[id].excerpt = updated.excerpt
    MOCK_ARTICLE_DETAILS[id].sections = parseContentToSections(data.content)
    if (data.thumbnailUrl) {
      MOCK_ARTICLE_DETAILS[id].thumbnailUrl = data.thumbnailUrl
    }
    if (data.captionHeroImage !== undefined) {
      MOCK_ARTICLE_DETAILS[id].captionHeroImage = data.captionHeroImage
    }
  } else {
    MOCK_ARTICLE_DETAILS[id] = {
      id,
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt: updated.excerpt,
      thumbnailUrl:
        data.thumbnailUrl ||
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      captionHeroImage:
        data.captionHeroImage ||
        'Bữa ăn chay chuẩn dinh dưỡng với các loại rau củ tươi, đậu hạt và ngũ cốc nguyên cám.',
      category: data.category,
      categoryLabel: updated.categoryLabel,
      publishedAt: 'Hôm nay',
      readTimeMinutes: Math.max(1, Math.ceil(data.content.split(/\s+/).length / 120)),
      tags: ['#chaykhoemanh', '#dinhduongthucvat'],
      author: {
        id: 'user-curr',
        name: 'Van Quang Duy',
        avatar:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        roleTitle: 'Tác giả cộng đồng',
      },
      viewsCount: 0,
      likesCount: 0,
      sections: parseContentToSections(data.content),
      comments: [],
      relatedArticles: MOCK_ARTICLES.slice(0, 3),
    }
  }

  return updated
}

/**
 * Submit article for admin review
 */
export async function submitArticleForReview(id: string): Promise<UserArticleItem> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const idx = MOCK_USER_ARTICLES.findIndex((a) => a.id === id)
  if (idx === -1) {
    throw new Error('Không tìm thấy bài viết để gửi duyệt')
  }
  const updated: UserArticleItem = {
    ...MOCK_USER_ARTICLES[idx],
    status: 'pending_review',
    statusLabel: 'Chờ duyệt',
    updatedAt: 'Vừa xong',
  }
  MOCK_USER_ARTICLES[idx] = updated
  return updated
}

/**
 * Delete a user article
 */
export async function deleteUserArticle(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  MOCK_USER_ARTICLES = MOCK_USER_ARTICLES.filter((a) => a.id !== id)
  const pubIdx = MOCK_ARTICLES.findIndex((a) => a.id === id)
  if (pubIdx >= 0) {
    MOCK_ARTICLES.splice(pubIdx, 1)
  }
  return true
}

/**
 * Delete a user comment
 */
export async function deleteUserComment(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  MOCK_USER_COMMENTS = MOCK_USER_COMMENTS.filter((c) => c.id !== id)
  return true
}

/**
 * Update a user comment
 */
export async function updateUserComment(id: string, content: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const target = MOCK_USER_COMMENTS.find((c) => c.id === id)
  if (target) {
    target.content = content
  }
  return true
}

export const createArticle = createUserArticle
export const updateArticle = updateUserArticle
export const deleteArticle = deleteUserArticle
