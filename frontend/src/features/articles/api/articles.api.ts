import type {
  ArticleDetailDto,
  ArticleFilterParams,
  ArticleSummary,
  PaginatedResult,
} from '../types/article.types'

// Mock Database of Articles mirroring the Figma Mockup
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
 * (Pre-architected for real backend API: GET /api/articles)
 */
export async function getArticles(
  params: ArticleFilterParams = {}
): Promise<PaginatedResult<ArticleSummary>> {
  // Simulate network latency (800ms)
  await new Promise((resolve) => setTimeout(resolve, 800))

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
  await new Promise((resolve) => setTimeout(resolve, 600))
  const featured = MOCK_ARTICLES.find((a) => a.isFeatured) || MOCK_ARTICLES[0]
  return featured
}

/**
 * Fetch article detail by ID or Slug
 * (Pre-architected for real backend API: GET /api/articles/{id})
 */
export async function getArticleById(id: string): Promise<ArticleDetailDto> {
  await new Promise((resolve) => setTimeout(resolve, 900))

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
  await new Promise((resolve) => setTimeout(resolve, 600))
  if (!content.trim()) throw new Error('Nội dung bình luận không được để trống')
}

/**
 * Toggle like for an article
 */
export async function toggleArticleLike(_articleId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return true
}

/**
 * Toggle save / bookmark for an article
 */
export async function toggleArticleSave(_articleId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return true
}
