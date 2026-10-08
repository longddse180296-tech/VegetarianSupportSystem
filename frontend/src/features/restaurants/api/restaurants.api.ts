export interface HomeRestaurantSummary {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  imageUrl: string;
  rating: number;
  cuisineTags: string[];
}

const MOCK_RESTAURANTS: HomeRestaurantSummary[] = [
  {
    id: 's1',
    name: 'Nhà hàng Chay An Lạc',
    address: '12 Nguyễn Văn Cừ, Q. Long Biên, Hà Nội',
    distanceKm: 1.8,
    imageUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cozy%20Vietnamese%20vegetarian%20restaurant%20interior%20wooden%20tables&image_size=square_hd',
    rating: 4.6,
    cuisineTags: ['Thuần chay', 'Món Âu'],
  },
  {
    id: 's2',
    name: 'Tiệm Chay Mộc Viên',
    address: '48 Hồng Bàng, P. 12, Q. 10, TP. HCM',
    distanceKm: 2.8,
    imageUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Elegant%20Vietnamese%20vegan%20restaurant%20exterior%20green%20signage&image_size=square_hd',
    rating: 4.7,
    cuisineTags: ['Thuần chay', 'Truyền thống'],
  },
  {
    id: 's3',
    name: 'Quán Chay Lê Lợi',
    address: '42 Nguyễn Bỉnh Khiêm, Q. 1, TP.HCM',
    distanceKm: 3.2,
    imageUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Traditional%20Vietnamese%20vegetarian%20restaurant%20street%20view&image_size=square_hd',
    rating: 4.5,
    cuisineTags: ['Chay có sữa', 'Món Việt'],
  },
  {
    id: 's4',
    name: 'Garden Vegetarian',
    address: '88 Pasteur, Q. 1, TP. HCM',
    distanceKm: 4.1,
    imageUrl: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Garden%20style%20vegetarian%20restaurant%20with%20plants%20interior&image_size=square_hd',
    rating: 4.8,
    cuisineTags: ['Thuần chay', 'Organic'],
  },
];

export async function fetchRestaurants(): Promise<HomeRestaurantSummary[]> {
  try {
    const res = await fetch('/api/restaurants', {
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
  return MOCK_RESTAURANTS;
}