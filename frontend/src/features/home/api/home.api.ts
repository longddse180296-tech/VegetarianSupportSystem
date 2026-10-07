import type {
  HomeArticleSummary,
  HomeChatMessage,
  HomeFeed,
  HomeRecipeSummary,
  HomeRestaurantSummary,
  HomeVideoSummary,
  MealShortcut,
} from '../types/home.types';

// Mock data feeding the public home page. The image URLs come from a hosted
// text-to-image generator so we do not need to commit binary assets. Replace
// this entire module with real fetch calls when the backend endpoints ship.

const HERO_IMAGE =
  'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Colorful%20vegetarian%20platter%20with%20rice%20noodles%20tofu%20mushrooms%20greens%20warm%20wooden%20table%20natural%20light&image_size=landscape_16_9';

const imageUrl = (prompt: string, size: 'square_hd' | 'landscape_16_9' = 'square_hd') =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

const MEAL_SHORTCUTS: MealShortcut[] = [
  { id: 'breakfast', label: 'Bữa sáng', description: 'Nhanh gọn < 15 phút', icon: 'breakfast' },
  { id: 'lunch', label: 'Bữa trưa', description: 'Đủ chất, dễ mang theo', icon: 'lunch' },
  { id: 'dinner', label: 'Bữa tối', description: 'Nhẹ nhàng, ít dầu mỡ', icon: 'dinner' },
  { id: 'snack', label: 'Ăn vặt', description: 'Snack lành mạnh', icon: 'snack' },
];

const RECIPES: HomeRecipeSummary[] = [
  {
    id: 'h-r1',
    name: 'Cháo yến mạch rau củ',
    category: 'Món chính',
    imageUrl: imageUrl('Hearty oat porridge with vegetables breakfast bowl warm cozy'),
    cookTimeMinutes: 15,
    caloriesPerServing: 280,
    suitabilityScore: 89,
  },
  {
    id: 'h-r2',
    name: 'Cơm gạo lứt rau củ',
    category: 'Món chính',
    imageUrl: imageUrl('Brown rice with roasted vegetables vegetarian bowl healthy fresh'),
    cookTimeMinutes: 35,
    caloriesPerServing: 380,
    suitabilityScore: 95,
  },
  {
    id: 'h-r3',
    name: 'Salad bơ và đậu gà',
    category: 'Salad',
    imageUrl: imageUrl('Avocado chickpea salad fresh green bowl healthy vegetarian'),
    cookTimeMinutes: 15,
    caloriesPerServing: 290,
    suitabilityScore: 92,
  },
  {
    id: 'h-r4',
    name: 'Bún chay thanh đạm',
    category: 'Món nước',
    imageUrl: imageUrl('Vegetarian rice noodle soup Vietnamese bun chay herbs mushrooms'),
    cookTimeMinutes: 35,
    caloriesPerServing: 340,
    suitabilityScore: 90,
  },
];

const ARTICLES: HomeArticleSummary[] = [
  {
    id: 'h-a1',
    title: 'Lợi ích của việc ăn chay với Vitamin B12',
    excerpt:
      'Cách chọn cầu và ăn chay hàng ngày có thể ảnh hưởng thế nào đến sức khỏe của bạn, kèm hướng dẫn cụ thể.',
    imageUrl: imageUrl('Family cooking vegetarian meal together warm kitchen morning light'),
    readMinutes: 8,
    topicTag: 'Dinh dưỡng',
  },
  {
    id: 'h-a2',
    title: 'Phối hợp đạm thực vật (Protein) trong bữa cơm gia đình',
    excerpt:
      'Gợi ý thực đơn 7 ngày giúp cân bằng dinh dưỡng đạm thực vật cho cả gia đình với ngân sách hợp lý.',
    imageUrl: imageUrl('Variety of plant based protein bowls chickpeas tofu lentils on table'),
    readMinutes: 7,
    topicTag: 'Thực đơn',
  },
  {
    id: 'h-a3',
    title: 'Các bữa sáng chay thử nghiệm 5 phút chuẩn BMI',
    excerpt:
      'Gợi ý nhanh cho người tập Gym 7 3 thực đơn dễ làm, chuẩn cân bằng BMI mỗi ngày.',
    imageUrl: imageUrl('Healthy vegan breakfast bowl oats berries nuts morning light'),
    readMinutes: 6,
    topicTag: 'Bữa sáng',
  },
];

const VIDEOS: HomeVideoSummary[] = [
  {
    id: 'h-v1',
    title: '10 ngày bám sát chế độ nhà hàng chay thành tàu bản lứa',
    duration: '12:05',
    thumbnailUrl: imageUrl('Vegan cooking show kitchen top view colorful vegetables', 'landscape_16_9'),
    channelName: 'Bếp Chay Home',
  },
  {
    id: 'h-v2',
    title: 'Mẫu ương rong nho và ngũ thanh bổ dưỡng cho cả nhà',
    duration: '08:42',
    thumbnailUrl: imageUrl('Sea grapes vegan salad bowl close up food video thumbnail', 'landscape_16_9'),
    channelName: 'Chay Mỗi Ngày',
  },
  {
    id: 'h-v3',
    title: '3 món sinh tố xanh dưỡng hỗ trợ giảm tập đề kháng',
    duration: '06:18',
    thumbnailUrl: imageUrl('Three green smoothies in glasses bright minimal background', 'landscape_16_9'),
    channelName: 'Green Boost',
  },
];

const RESTAURANTS: HomeRestaurantSummary[] = [
  {
    id: 'h-s1',
    name: 'Nhà hàng Chay An Lạc',
    address: '12 Nguyễn Văn Cừ, Q. Long Biên, Hà Nội',
    distanceKm: 1.8,
    imageUrl: imageUrl('Cozy Vietnamese vegetarian restaurant interior wooden tables'),
    rating: 4.6,
    cuisineTags: ['Thuần chay', 'Món Âu'],
  },
  {
    id: 'h-s2',
    name: 'Tiệm Chay Mộc Viên',
    address: '48 Hồng Bàng, P. 12, Q. 10, TP. HCM',
    distanceKm: 2.8,
    imageUrl: imageUrl('Elegant Vietnamese vegan restaurant exterior green signage'),
    rating: 4.7,
    cuisineTags: ['Thuần chay', 'Truyền thống'],
  },
];

const INITIAL_CHAT_MESSAGES: HomeChatMessage[] = [
  {
    id: 'h-msg-1',
    role: 'user',
    content: 'Em muốn tìm bữa tối chay ít dầu mỡ, phù hợp với BMI 21.5',
  },
  {
    id: 'h-msg-2',
    role: 'assistant',
    content:
      'Bạn có thể tham khảo: Salad bơ đậu gà, Đậu hũ sốt nấm hoặc Cà ri rau củ nước cốt dừa. Mỗi món chỉ khoảng 280-420 kcal/khẩu phần, phù hợp chỉ số BMI hiện tại của bạn nhé.',
  },
];

const MOCK_FEED: HomeFeed = {
  hero: {
    id: 'hero-1',
    title: 'Ăn chay lành mạnh, đơn giản hơn mỗi ngày',
    description:
      'Khám phá công thức, thực đơn, nhà hàng và bài viết được AI cá nhân hoá theo chỉ số BMI, dị ứng và mục tiêu sức khỏe của bạn.',
    imageUrl: HERO_IMAGE,
    matchScore: 96,
    badges: ['Thuần chay (Vegan)', 'BMI tham chiếu', 'Dinh dưỡng cá nhân hoá'],
  },
  shortcuts: MEAL_SHORTCUTS,
  recipes: RECIPES,
  articles: ARTICLES,
  videos: VIDEOS,
  restaurants: RESTAURANTS,
  initialChatMessages: INITIAL_CHAT_MESSAGES,
};

// Public API client for the home feed. Falls back to local mock data so the UI
// stays demoable even when the backend is not running.
export async function fetchHomeFeed(): Promise<HomeFeed> {
  try {
    const res = await fetch('/api/home/feed', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as HomeFeed;
      return data;
    }
  } catch {
    // fallthrough to mock
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_FEED;
}

// Lightweight chat used by the home page's inline AI panel. Mirrors the public
// AI chat API contract so the homepage widget can later be swapped to use the
// shared ai-chat module without further changes.
export async function askHomeAssistant(message: string): Promise<string> {
  const trimmed = message.trim();
  if (!trimmed) return 'Bạn có thể mô tả nhu cầu ăn chay của mình để mình gợi ý nhé.';

  await new Promise((resolve) => setTimeout(resolve, 700));

  const lower = trimmed.toLowerCase();
  if (lower.includes('sáng') || lower.includes('breakfast')) {
    return 'Gợi ý bữa sáng: Cháo yến mạch rau củ, Sinh tố bơ hạnh nhân hoặc Bánh mì đen đậu gà đều nhanh và đủ chất.';
  }
  if (lower.includes('tối') || lower.includes('dinner')) {
    return 'Bữa tối nhẹ nhàng: Salad bơ đậu gà, Canh nấm hạt sen hoặc Đậu hũ sốt nấm (khoảng 280-340 kcal/khẩu).';
  }
  if (lower.includes('calo') || lower.includes('kcal')) {
    return 'Bạn có thể lọc mòn theo theo mức calo ở trang Công thức: Dưới 200, 200-400 hoặc trên 400 kcal đều có sẵn.';
  }
  return 'Mình gợi ý bạn thử Đậu hũ sốt nấm, Cà ri rau cốt dừa hoặc Bún chay thanh đạm. Bạn muốn mình lọc theo tiêu chí nào thêm?';
}