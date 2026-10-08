export interface HomeVideoSummary {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  channelName: string;
}

const MOCK_VIDEOS: HomeVideoSummary[] = [
  {
    id: 'v1',
    title: 'Cách làm đậu hũ sốt nấm trong 20 phút',
    duration: '20:14',
    thumbnailUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Vietnamese%20tofu%20mushroom%20sauce%20cooking%20video%20thumbnail%20dark%20background&image_size=landscape_16_9',
    channelName: 'Bếp Chay 1975',
  },
  {
    id: 'v2',
    title: 'Mẫu ương rong nho và ngũ thanh bổ dưỡng',
    duration: '08:42',
    thumbnailUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Sea%20grapes%20vegan%20salad%20bowl%20close%20up%20food%20video&image_size=landscape_16_9',
    channelName: 'Chay Mỗi Ngày',
  },
  {
    id: 'v3',
    title: '3 món sinh tố xanh dưỡng hỗ trợ giảm tập đề kháng',
    duration: '06:18',
    thumbnailUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Three%20green%20smoothies%20in%20glasses%20bright%20minimal%20background&image_size=landscape_16_9',
    channelName: 'Green Boost',
  },
  {
    id: 'v4',
    title: 'Salad bơ đậu gà cho bữa trưa văn phòng',
    duration: '12:30',
    thumbnailUrl: 'https://coresg-normal.troe.ai/api/ide/v1/text_to_image?prompt=Avocado%20chickpea%20salad%20video%20cooking%20thumbnail&image_size=landscape_16_9',
    channelName: 'Bếp Sạch',
  },
];

export async function fetchVideos(): Promise<HomeVideoSummary[]> {
  try {
    const res = await fetch('/api/videos', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallthrough to mock
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_VIDEOS;
}