import type {
  AiReplyPayload,
  AppRole,
  ChatConversation,
  ChatMessage,
  ChatRole,
  FaqItem,
  GuestChatState,
  ProfileSummary,
  RecipeSuggestion,
} from '../types/aiChat.types'

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

const WELCOME_RECIPES: RecipeSuggestion[] = [
  {
    id: 'buddha-bowl-quinoa',
    title: 'Buddha Bowl Đậu Nướng & Quinoa',
    subtitle: 'Chỉ 20 phút · Dễ · Đủ 4 nhóm chất',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20buddha%20bowl%20quinoa%20roasted%20sweet%20potato%20chickpeas%20greens%20top%20view&image_size=square',
    kcal: 520,
    timeMin: 20,
    tag: 'Giảm cân · Vegan',
    matchReason: 'Đầy đủ protein thực vật, phù hợp BMI 20-24.',
  },
  {
    id: 'yen-mach-hat-dieu',
    title: 'Cháo Yến Mạch Hạt Điều & Quế',
    subtitle: 'Bữa sáng 10 phút · Bão hòa năng lượng',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Creamy%20oatmeal%20vegan%20topped%20with%20cashew%20cinnamon%20and%20blueberries%20morning%20light&image_size=square',
    kcal: 410,
    timeMin: 10,
    tag: 'Breakfast · Budget',
    matchReason: 'Tốt cho người mới bắt đầu ăn thuần thực vật, không cần nguyên liệu lạ.',
  },
  {
    id: 'salad-dau-hu-xoai',
    title: 'Salad Đậu Hũ Sốt Xoài Cay',
    subtitle: 'Mát lạnh · Summer · Ít calo',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20mango%20tofu%20salad%20with%20chili%20lime%20dressing%20bright%20summer%20colors%20top%20view&image_size=square',
    kcal: 280,
    timeMin: 15,
    tag: 'Summer · Nhanh',
    matchReason: 'Calo thấp, phù hợp ngày nóng hoặc người muốn chế độ giảm cân nhẹ.',
  },
]

export async function getWelcomeSuggestions(
  appRole: AppRole,
): Promise<{
  greeting: string
  recipes: RecipeSuggestion[]
  faqs: FaqItem[]
  conversations: ChatConversation[]
  profile: ProfileSummary
  guestState: GuestChatState
}> {
  await delay(500)
  const profile: ProfileSummary =
    appRole === 'Guest'
      ? {
          displayName: 'Bạn (Khách)',
          role: 'Guest',
          profileType: 'Chưa tạo hồ sơ',
          target: 'Khám phá ăn chay khoa học',
          bmiRange: 'Chưa đo',
          joinAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        }
      : {
          displayName: appRole === 'Admin' ? 'Admin Toàn' : 'Nguyễn An Nhiên',
          role: appRole,
          profileType: 'Thuần chay nghiêm ngặt (Strict Vegan)',
          target: 'Giảm 4 kg / tháng · Ăn 1400 kcal/ngày',
          bmiRange: '21.3 - 22.9 · Bình thường',
          joinAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        }

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      question: 'Làm sao biết một phụ gia E-number có nguồn gốc động vật?',
      answer:
        'Theo các cơ sở dữ liệu phổ biến, các mã như E120, E441, E485, E542, E631, E904 thường có nguy cơ nguồn gốc động vật cao hơn. Tuy nhiên nhà sản xuất có thể thay đổi quy trình, bạn nên kiểm tra nhãn sản phẩm hoặc liên hệ trực tiếp để xác nhận trường hợp cụ thể.',
    },
    {
      id: 'faq-2',
      question: 'BMI bao nhiêu thì bắt đầu chế độ ăn thuần thực vật?',
      answer:
        'BMI không phải chỉ số duy nhất quyết định, bạn có thể bắt đầu ở bất kỳ mức BMI nào. Nếu BMI dưới 18.5 hoặc trên 30, nên kết hợp với chuyên gia dinh dưỡng để đảm bảo đủ calo, sắt, kẽm, vitamin B12 và omega-3.',
    },
    {
      id: 'faq-3',
      question: 'Thay thế trứng trong bánh ngọt bằng gì?',
      answer:
        'Các lựa chọn phổ biến bao gồm: 1 quả trứng ≈ 1 muỗng canh hạt chia + 3 muỗng canh nước (ngâm 10 phút), hoặc 1/2 quả chuối chín nghiền, hoặc 1/4 cốc táo xay nhuyễn, hoặc 1 muỗng canh bột đậu gà + 3 muỗng canh nước.',
    },
    {
      id: 'faq-4',
      question: 'Thiếu B12 có triệu chứng như thế nào?',
      answer:
        'Triệu chứng thường gặp: mệt, chóng mặt, da xanh xao, cảm giác kim châm ở tay chân, hay quên. Đối với chế độ thuần thực vật, hãy ưu tiên thực phẩm tăng cường B12 hoặc viên uống bổ sung, sau 2-3 tháng nếu vẫn còn triệu chứng nên đi khám lâm sàng.',
    },
  ]

  const conversations: ChatConversation[] = [
    {
      id: 'conv-1',
      title: 'Thực đơn 7 ngày cho BMI 21-23',
      summary: '1400 kcal · Vegan · 3 bữa + 2 phụ',
      lastMessageAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      preview: 'Tôi muốn thực đơn giảm nhẹ 2 kg tháng này...',
    },
    {
      id: 'conv-2',
      title: 'Thay thế nước mắm chay + 6 cách ướp',
      summary: 'Nước tương tamari + xì dầu nấm shiitake',
      lastMessageAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      preview: 'Có cách nào làm nước mắm chay ngọt thanh...',
    },
    {
      id: 'conv-3',
      title: 'Tránh dị ứng đậu phụ + 8 nguồn protein khác',
      summary: 'Tempeh, đậu lăng, đậu gà, hạt diêm mạch...',
      lastMessageAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      preview: 'Tôi không ăn được đậu phụ, thay bằng gì?',
    },
  ]

  return {
    greeting:
      appRole === 'Guest'
        ? 'Chào bạn 👋 Tôi là trợ lý dinh dưỡng thuần thực vật. Với vai trò khách, bạn có 3 lượt hỏi để trải nghiệm — sau đó hãy đăng nhập để tiếp tục cuộc trò chuyện không giới hạn nhé!'
        : 'Chào mừng quay lại 🌿 Hồ sơ của bạn đã được nạp, tôi có thể gợi ý thực đơn 1400 kcal/ngày hoặc phân tích thành phần sản phẩm dựa trên hồ sơ "Thuần chay nghiêm ngặt" của bạn.',
    recipes: WELCOME_RECIPES,
    faqs,
    conversations,
    profile,
    guestState:
      appRole === 'Guest'
        ? { questionsRemaining: 3, limit: 3, locked: false }
        : { questionsRemaining: -1, limit: -1, locked: false },
  }
}

function makeId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function buildUserMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  }
}

const RECIPE_LIBRARY: RecipeSuggestion[] = [
  {
    id: 'banh-mi-chay-tofu',
    title: 'Bánh Mì Chay Ớt Xanh Tofu Sốt Teriyaki',
    subtitle: '15 phút · Street food · Budget',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20vietnamese%20banh%20mi%20tofu%20teriyaki%20pickled%20vegetables%20fresh%20coriander%20crispy%20crust%20top%20view&image_size=square',
    kcal: 490,
    timeMin: 15,
    tag: 'Vietnamese · Nhanh',
    matchReason: 'Đủ carb + protein đậu phụ, phù hợp bữa trưa công sở.',
  },
  {
    id: 'sup-bap-cai',
    title: 'Canh Bắp Cải Nấm Nước Dừa',
    subtitle: '25 phút · Ẩm thực · Low carb',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20coconut%20milk%20cabbage%20mushroom%20soup%20vietnamese%20canh%20style%20bright%20bowl&image_size=square',
    kcal: 230,
    timeMin: 25,
    tag: 'Canh · Ấm no bụng',
    matchReason: 'Thay thế các món canh thường dùng nước dùng xương, an toàn cho chế độ thuần thực vật.',
  },
  {
    id: 'com-chien-thien-vi',
    title: 'Cơm Chiên Thiên Vị Rau Củ Quả',
    subtitle: '12 phút · Dùng cơm nguội',
    cover:
      'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Vegan%20fried%20rice%20turmeric%20mixed%20vegetables%20peas%20carrot%20corn%20scallion%20top%20view%20wok%20style&image_size=square',
    kcal: 580,
    timeMin: 12,
    tag: 'Dễ · Save time',
    matchReason: 'Tận dụng cơm nguội, thêm rau củ để tăng chất xơ không làm tăng calo nhiều.',
  },
  WELCOME_RECIPES[0],
  WELCOME_RECIPES[1],
  WELCOME_RECIPES[2],
]

function composeReply(userContent: string): AiReplyPayload {
  const text = userContent.trim().toLowerCase()

  // 1 — Bữa sáng
  if (/(bữa\s*sáng|sáng|breakfast|áo\s*lạnh)/.test(text)) {
    return {
      reply:
        'Theo hồ sơ của bạn, một khung bữa sáng phù hợp gồm: 30-35g yến mạch cuộn nấu với sữa hạt điều, 1 muỗng canh hạt chia, 1 nửa quả chuối, rắc hạt bí ngô. Nếu bạn ăn nhiều hơn, có thể thêm 1 ổ bánh mì đen bơ đậu phộng không đường. Đảm bảo có 10-15g protein để duy trì năng lượng đến trưa.',
      recipeSuggestions: [WELCOME_RECIPES[1], WELCOME_RECIPES[0]],
    }
  }

  // 2 — Thay thế protein không dùng đậu phụ
  if (/(đậu\s*phụ|không\s*ăn|thay\s*thế|protein)/.test(text)) {
    return {
      reply:
        'Nếu bạn không ăn đậu phụ, có 8 nguồn protein thực vật khác bạn có thể xoay vòng: 1) Tempeh (tương đậu nành lên men, dễ tiêu hóa), 2) Đậu lăng (mỗi 100g nấu chín ≈ 9g protein), 3) Đậu gà (hummus + salad), 4) Hạt quinoa, 5) Đậu Hà Lan, 6) Hạt bí ngô, 7) Sữa đậu nành tăng cường, 8) Seitan (nếu không bị dị ứng gluten). Kết hợp 2 nguồn khác nhau mỗi bữa để có đủ 9 axit amin thiết yếu.',
      recipeSuggestions: [
        RECIPE_LIBRARY[0],
        RECIPE_LIBRARY[1],
        RECIPE_LIBRARY[2],
      ],
    }
  }

  // 3 — Phụ gia / E-number
  if (/(e-number|phụ gia|e\d{3,4}|mã\s*e)/.test(text)) {
    return {
      reply:
        'Theo cơ sở dữ liệu tham chiếu, các mã thường có nguy cơ nguồn gốc động vật: E120 (côn trùng), E441 (gelatin), E542 (xương động vật), E631/E627/E635 (dưới dạng hỗn hợp có thể từ thịt/cá), E904 (tựa côn trùng). Tuy nhiên một số nhà sản xuất đã thay đổi quy trình, để chắc chắn nhất bạn cần so sánh mã E trên nhãn với thông tin nhà sản xuất công bố. Nếu có ảnh nhãn, hãy quét qua trang Quét & Phân tích Thực phẩm để được đánh giá nhanh hơn.',
      recipeSuggestions: WELCOME_RECIPES.slice(0, 2),
    }
  }

  // 4 — Thực đơn 7 ngày
  if (/(thực\s*đơn|7\s*ngày|tiết\s*kiệm\s*cân|meal\s*plan)/.test(text)) {
    return {
      reply:
        'Mẫu khung 7 ngày cho 1400 kcal/ngày: Thứ 2 (yến mạch + canh bắp cải + cơm chiên), Thứ 3 (sinh tố xanh + Buddha bowl + salad xoài), Thứ 4 (cháo hạt điều + bánh mì chay + súp bí ngô), Thứ 5-7 xoay vòng 3 nguồn đậu khác nhau (đậu lăng, đậu gà, tempeh) để không ngán, 2 bữa phụ xen kẽ táo, hạnh nhân, sữa chua đậu nành. Bạn có thể nhắn "Chi tiết Thứ 3" để tôi chia sẻ hẳn menu chi tiết.',
      recipeSuggestions: RECIPE_LIBRARY.slice(0, 3),
    }
  }

  // Default: chào hỏi chung
  return {
    reply:
      'Tôi đã ghi nhận yêu cầu của bạn. Theo thông tin bạn cung cấp, các bước hữu ích tiếp theo thường là: 1) Xác định BMI và mục tiêu calo mỗi ngày, 2) Liệt kê 5 món bạn thích trong tuần, 3) Gửi ảnh nhãn thành phần sản phẩm bạn dùng thường xuyên để tôi phân tích các nguy cơ thường gặp. Bạn có muốn bắt đầu từ bước nào trước?',
    recipeSuggestions: [WELCOME_RECIPES[0], WELCOME_RECIPES[2]],
  }
}

export async function sendMessageToAi(
  _role: ChatRole,
  content: string,
  _conversationId: string | null,
): Promise<ChatMessage> {
  await delay(500)
  const payload = composeReply(content)
  return {
    id: makeId(),
    role: 'assistant',
    content: payload.reply,
    timestamp: new Date().toISOString(),
    recipeSuggestions: payload.recipeSuggestions,
  }
}
