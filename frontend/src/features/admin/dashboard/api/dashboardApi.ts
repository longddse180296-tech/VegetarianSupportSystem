import type { DashboardOverviewData } from '../types/dashboard.types'

const MOCK_DASHBOARD_DATA: DashboardOverviewData = {
  stats: {
    members: {
      title: 'Thành viên đã đăng ký',
      value: 128,
      badge: '+12%',
      badgeType: 'success',
      icon: 'users',
      linkPath: '/admin/members',
    },
    articles: {
      title: 'Bài viết đã đăng',
      value: 64,
      badge: '+4 MỚI',
      badgeType: 'info',
      icon: 'file-text',
      linkPath: '/admin/articles',
    },
    videos: {
      title: 'Video hướng dẫn',
      value: 35,
      badge: '+2 MỚI',
      badgeType: 'warning',
      icon: 'video',
      linkPath: '/admin/videos',
    },
    comments: {
      title: 'Bình luận cộng đồng',
      value: 412,
      badge: '+28 TUẦN',
      badgeType: 'purple',
      icon: 'message-square',
      linkPath: '/admin/comments',
    },
    categories: {
      title: 'Danh mục nội dung',
      value: 12,
      badge: 'ỔN ĐỊNH',
      badgeType: 'neutral',
      icon: 'layers',
      linkPath: '/admin/categories',
    },
  },
  recentArticles: [
    {
      id: 'ra-1',
      title: 'Kinh nghiệm bổ sung Protein thực vật cho người mới...',
      authorName: 'Nguyễn Minh Anh',
      publishedAt: '14/10/2024',
    },
    {
      id: 'ra-2',
      title: 'Cách chuẩn bị Meal Prep chay tiện lợi cho cả tuần...',
      authorName: 'Lê Thu Hà',
      publishedAt: '28/09/2024',
    },
    {
      id: 'ra-3',
      title: 'Top 10 nguồn canxi dồi dào từ thực vật tự nhiên...',
      authorName: 'Trần Gia Huy',
      publishedAt: '20/09/2024',
    },
    {
      id: 'ra-4',
      title: 'Lộ trình chuyển đổi ăn chay an toàn và bền vững...',
      authorName: 'Phạm Quốc Bảo',
      publishedAt: '15/09/2024',
    },
  ],
  recentVideos: [
    {
      id: 'rv-1',
      title: 'Đậu hũ sốt nấm hương đậm đà thơm ngọt',
      authorName: 'Trần Gia Huy',
      duration: '08:45',
      publishedAt: '12/10/2024',
    },
    {
      id: 'rv-2',
      title: 'Gỏi cuốn nấm ngũ sắc sốt tương béo ngậy',
      authorName: 'Nguyễn Minh Anh',
      duration: '05:20',
      publishedAt: '05/10/2024',
    },
    {
      id: 'rv-3',
      title: 'Nấu canh rong biển hạt sen thanh mát giải nhiệt',
      authorName: 'Phạm Quốc Bảo',
      duration: '10:15',
      publishedAt: '01/10/2024',
    },
    {
      id: 'rv-4',
      title: 'Cách làm sốt tương mè rang đa năng tại nhà',
      authorName: 'Lê Thu Hà',
      duration: '04:35',
      publishedAt: '26/09/2024',
    },
  ],
  recentActivities: [
    {
      id: 'act-1',
      actorName: 'Nguyễn Minh Anh',
      timeAgo: '10 phút trước',
      actionText: 'Đã đăng bài viết mới:',
      targetTitle: '“Kinh nghiệm bổ sung Protein thực vật”',
      type: 'article',
    },
    {
      id: 'act-2',
      actorName: 'Trần Gia Huy',
      timeAgo: '1 giờ trước',
      actionText: 'Đã tải video mới:',
      targetTitle: '“Đậu hũ sốt nấm hương”',
      type: 'video',
    },
    {
      id: 'act-3',
      actorName: 'Lê Thu Hà',
      timeAgo: '2 giờ trước',
      actionText: 'Đã bình luận bài viết:',
      targetTitle: '“Top 10 nguồn canxi dồi dào”',
      type: 'comment',
    },
    {
      id: 'act-4',
      actorName: 'Admin',
      timeAgo: 'Hôm qua',
      actionText: 'Đã cập nhật danh mục:',
      targetTitle: '“Dinh dưỡng thuần chay”',
      type: 'category',
    },
    {
      id: 'act-5',
      actorName: 'Vũ Hoàng Long',
      timeAgo: 'Hôm qua',
      actionText: 'Đã đăng ký tài khoản thành viên mới trong hệ thống',
      targetTitle: '',
      type: 'user',
    },
  ],
}

/**
 * Fetch Admin Dashboard Overview Data
 * Pre-architected for real backend API: GET /api/admin/dashboard
 */
export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  // Simulate network latency (1.5s per directive)
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return MOCK_DASHBOARD_DATA
}
