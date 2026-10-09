import { useEffect, useState, useMemo } from 'react';
import {
  getUserVideos,
  deleteUserVideo,
  updateUserVideo,
  createUserVideo,
  submitUserVideo,
  VIDEO_CATEGORIES,
} from '../api/videos.api';
import type {
  PaginatedResult,
  UserVideoItem,
  VideoFormData,
} from '../types';
import { UserProfileShell } from '../../profile/components/UserProfileShell';
import {
  Button,
  Input,
  Select,
  Textarea,
  EmptyState,
  Modal,
} from '../../../shared/components';
import AlertError from '../../../shared/components/AlertError';

interface MyVideosPageProps {
  onNavigate?: (path: string) => void;
}

export default function MyVideosPage({ onNavigate }: MyVideosPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'pending' | 'draft'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'duration'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [videosData, setVideosData] = useState<PaginatedResult<UserVideoItem>>({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 4,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Modal delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Modal edit state
  const [editingVideo, setEditingVideo] = useState<UserVideoItem | null>(null);
  const [editForm, setEditForm] = useState<VideoFormData>({
    title: '',
    category: 'main',
    duration: '',
    description: '',
    thumbnailUrl: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Modal upload/create state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<VideoFormData>({
    title: '',
    category: 'main',
    duration: '15:00',
    description: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    status: 'pending',
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getUserVideos({
          statusTab: activeTab,
          category: selectedCategory,
          keyword: searchKeyword,
          sortBy,
          page: currentPage,
          pageSize: 4,
        });
        if (isMounted) {
          setVideosData(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách video');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void fetchData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedCategory, searchKeyword, sortBy, currentPage, refreshTrigger]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteUserVideo(deleteTarget.id);
      setActionSuccessMsg(`Đã xóa video "${deleteTarget.title}" thành công.`);
      setDeleteTarget(null);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setError('Không thể xóa video. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (video: UserVideoItem) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      category: video.category,
      duration: video.duration,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    if (!editForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề video');
      return;
    }
    try {
      setIsSavingEdit(true);
      await updateUserVideo(editingVideo.id, editForm);
      setActionSuccessMsg(`Đã cập nhật video "${editForm.title}" thành công.`);
      setEditingVideo(null);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setError('Không thể lưu cập nhật video.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!createForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề video');
      return;
    }
    try {
      setIsSubmittingCreate(true);
      await createUserVideo(createForm);
      setActionSuccessMsg(`Đã đăng video "${createForm.title}" thành công.`);
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        category: 'main',
        duration: '15:00',
        description: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        status: 'pending',
      });
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setError('Không thể tạo video mới.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleSubmitDraft = async (id: string, title: string) => {
    try {
      await submitUserVideo(id);
      setActionSuccessMsg(`Đã gửi video "${title}" vào hàng đợi kiểm duyệt AI & Admin.`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setError('Không thể gửi duyệt video.');
    }
  };

  const paginationPages = useMemo(() => {
    const total = videosData.totalPages;
    const current = videosData.page;
    const pages: (number | string)[] = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  }, [videosData]);

  return (
    <UserProfileShell
      activeTab="my-videos"
      breadcrumbs={[
        { label: 'Trang chủ', path: '/' },
        { label: 'Tài khoản', path: '/profile' },
        { label: 'Video của tôi' },
      ]}
      statBadge={{ count: videosData.totalCount, label: 'Video' }}
      onNavigate={onNavigate}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        {/* Header Title & CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Video của tôi</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Quản lý các video hướng dẫn nấu ăn, mẹo chế biến và kiến thức ẩm thực thuần chay của bạn.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl shadow-sm px-5"
            leftIcon={<span className="text-base font-bold leading-none">+</span>}
          >
            Tải video mới
          </Button>
        </div>

        {/* Action Success Notification */}
        {actionSuccessMsg && (
          <div className="my-4 p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold border border-emerald-200 flex items-center justify-between">
            <span>✓ {actionSuccessMsg}</span>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('published');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'published'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              Đã xuất bản
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              Chờ duyệt
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('draft');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'draft'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              Bản nháp
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Hiển thị {videosData.items.length > 0 ? (currentPage - 1) * 4 + 1 : 0}-
            {Math.min(currentPage * 4, videosData.totalCount)} trên tổng số{' '}
            {videosData.totalCount} video
          </div>
        </div>

        {/* Search, Category & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className="sm:col-span-2">
            <Input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm video theo tiêu đề, danh mục..."
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              fullWidth
            />
          </div>

          <div>
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              options={VIDEO_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
              fullWidth
            />
          </div>

          <div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'views' | 'duration')}
              options={[
                { value: 'newest', label: 'Sắp xếp: Mới nhất' },
                { value: 'views', label: 'Sắp xếp: Lượt xem' },
                { value: 'duration', label: 'Sắp xếp: Thời lượng dài' },
              ]}
              fullWidth
            />
          </div>
        </div>

        {/* Content Section: Loading, Error, Empty or List */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-gray-100 bg-white animate-pulse flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="w-24 h-5 bg-gray-200 rounded-full" />
                  <div className="w-3/4 h-6 bg-gray-200 rounded" />
                  <div className="w-full h-4 bg-gray-200 rounded" />
                  <div className="w-48 h-4 bg-gray-200 rounded pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mb-6">
            <AlertError
              title="Không thể tải danh sách video"
              message={error}
              onRetry={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </div>
        )}

        {!loading && !error && videosData.items.length === 0 && (
          <div className="py-8">
            <EmptyState
              title="Chưa có video nào"
              description="Bạn chưa có video nào ở trạng thái hoặc bộ lọc này. Hãy tải video công thức chay lên ngay hôm nay!"
              actionLabel="Tải video mới ngay"
              onAction={() => setIsCreateOpen(true)}
            />
          </div>
        )}

        {/* Video Cards List */}
        {!loading && !error && videosData.items.length > 0 && (
          <div className="space-y-4">
            {videosData.items.map((vid) => {
              const isDraft = vid.status === 'draft';
              const isPending = vid.status === 'pending';
              const isPublished = vid.status === 'published';

              return (
                <div
                  key={vid.id}
                  className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all bg-white flex flex-col md:flex-row gap-5 items-start"
                >
                  {/* Video Thumbnail with duration overlay and play badge */}
                  <div
                    className="relative w-full md:w-56 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0 cursor-pointer group"
                    onClick={() => {
                      if (isPublished) {
                        onNavigate?.(`/videos/${vid.id}`);
                      } else {
                        handleOpenEdit(vid);
                      }
                    }}
                  >
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all shadow-md">
                        <svg className="w-4 h-4 ml-0.5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* Duration badge */}
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-black/80">
                      {vid.duration}
                    </span>
                    {/* Status pill on thumbnail top-left */}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isPublished
                          ? 'bg-emerald-600 text-white'
                          : isPending
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      {vid.statusLabel}
                    </span>
                  </div>

                  {/* Video Content & Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                    <div>
                      {/* Top meta tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {vid.categoryLabel}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            {isDraft
                              ? `Cập nhật: ${vid.updatedAt || 'Hôm nay'}`
                              : isPending
                              ? `Đã gửi duyệt: ${vid.submittedAt || 'Hôm nay'}`
                              : `Xuất bản: ${vid.publishedAt}`}
                          </span>
                          {vid.aiFlagStatus === 'Passed' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">
                                <span>✓</span> AI đã duyệt nội dung
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: vid.id, title: vid.title })}
                          className="text-gray-400 hover:text-red-600 text-sm p-1 rounded-lg hover:bg-red-50 transition-colors"
                          title="Xóa video"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => {
                          if (isPublished) {
                            onNavigate?.(`/videos/${vid.id}`);
                          } else {
                            handleOpenEdit(vid);
                          }
                        }}
                        className="text-base font-bold text-gray-900 hover:text-emerald-700 transition-colors cursor-pointer mb-1.5 line-clamp-1"
                      >
                        {vid.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                        {vid.description}
                      </p>

                      {/* Pending Notice Box */}
                      {isPending && (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2 mb-3">
                          <span>⏳</span>
                          <span>
                            {vid.adminNote || 'Video đã qua kiểm duyệt AI an toàn, hiện đang chờ Admin phê duyệt trước khi công khai.'}
                          </span>
                        </div>
                      )}

                      {/* Draft Progress Bar */}
                      {isDraft && vid.completionRate && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                            <span className="font-medium text-amber-700">
                              ⚙️ Đang hoàn thiện – {vid.completionRate}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${vid.completionRate}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer stats and actions */}
                    <div className="pt-3 border-t border-gray-50 flex flex-wrap items-center justify-between gap-3 text-xs mt-auto">
                      {isPublished ? (
                        <div className="flex items-center gap-4 text-gray-500">
                          <span title="Lượt xem">👁️ {vid.viewsCount.toLocaleString()}</span>
                          <span title="Lượt thích">👍 {vid.likesCount}</span>
                          <span title="Bình luận">💬 {vid.commentsCount}</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-[11px]">
                          {isDraft ? 'Bản nháp lưu cục bộ' : 'Chờ kiểm duyệt Admin'}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isDraft ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSubmitDraft(vid.id, vid.title)}
                              className="rounded-xl"
                              leftIcon={<span>🚀</span>}
                            >
                              Gửi duyệt
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenEdit(vid)}
                              className="rounded-xl"
                              leftIcon={<span>✏️</span>}
                            >
                              Tiếp tục sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget({ id: vid.id, title: vid.title })}
                              className="rounded-xl"
                            >
                              Xóa
                            </Button>
                          </>
                        ) : isPending ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(vid)}
                              className="rounded-xl"
                              leftIcon={<span>✏️</span>}
                            >
                              Chỉnh sửa
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteTarget({ id: vid.id, title: vid.title })}
                              className="rounded-xl"
                            >
                              Hủy gửi
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigate?.(`/videos/${vid.id}`)}
                              className="rounded-xl"
                              leftIcon={<span>👁️</span>}
                            >
                              Xem video
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(vid)}
                              className="rounded-xl"
                              leftIcon={<span>✏️</span>}
                            >
                              Sửa
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {videosData.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs">
                <span className="text-gray-500">
                  Đang xem {videosData.items.length > 0 ? (currentPage - 1) * 4 + 1 : 0} đến{' '}
                  {Math.min(currentPage * 4, videosData.totalCount)} trên {videosData.totalCount} video
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>

                  {paginationPages.map((page, idx) => {
                    if (typeof page === 'string') {
                      return (
                        <span key={idx} className="w-8 h-8 flex items-center justify-center text-gray-400">
                          ...
                        </span>
                      );
                    }
                    const isActive = page === currentPage;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage === videosData.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(videosData.totalPages, p + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa video"
        description={`Bạn có chắc chắn muốn xóa video "${deleteTarget?.title}"? Hành động này sẽ gỡ video khỏi danh sách của bạn.`}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Xác nhận xóa
            </Button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          Lưu ý: Thao tác này không thể hoàn tác. Các tương tác và bình luận liên quan đến video này cũng sẽ bị gỡ bỏ theo quy chế kiểm duyệt.
        </p>
      </Modal>

      {/* Edit Video Modal */}
      <Modal
        isOpen={Boolean(editingVideo)}
        onClose={() => setEditingVideo(null)}
        title="Chỉnh sửa thông tin video"
        description="Cập nhật tiêu đề, danh mục và mô tả nội dung video của bạn."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEditingVideo(null)}
              disabled={isSavingEdit}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveEdit}
              isLoading={isSavingEdit}
            >
              Lưu thay đổi
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <Input
            label="Tiêu đề video"
            value={editForm.title}
            onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Nhập tiêu đề video..."
            required
            fullWidth
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Danh mục món chay"
              value={editForm.category}
              onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
              options={VIDEO_CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({
                value: c.id,
                label: c.label,
              }))}
              fullWidth
            />

            <Input
              label="Thời lượng (mm:ss)"
              value={editForm.duration}
              onChange={(e) => setEditForm((prev) => ({ ...prev, duration: e.target.value }))}
              placeholder="Ví dụ: 15:30"
              fullWidth
            />
          </div>

          <Input
            label="URL ảnh đại diện thumbnail"
            value={editForm.thumbnailUrl}
            onChange={(e) => setEditForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
            placeholder="https://..."
            fullWidth
          />

          <Textarea
            label="Mô tả nội dung & các bước chính"
            value={editForm.description}
            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Tóm tắt nội dung hướng dẫn..."
            rows={3}
            fullWidth
          />
        </div>
      </Modal>

      {/* Upload/Create New Video Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tải lên video món chay mới"
        description="Chia sẻ công thức, phương pháp chế biến thuần thực vật đến cộng đồng."
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmittingCreate}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateVideo}
              isLoading={isSubmittingCreate}
            >
              {createForm.status === 'draft' ? 'Lưu bản nháp' : 'Gửi kiểm duyệt ngay'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <Input
            label="Tiêu đề video"
            value={createForm.title}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Ví dụ: Cách nấu canh chua nấm chay chuẩn vị miền Tây..."
            required
            fullWidth
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Danh mục món chay"
              value={createForm.category}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
              options={VIDEO_CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({
                value: c.id,
                label: c.label,
              }))}
              fullWidth
            />

            <Input
              label="Thời lượng (mm:ss)"
              value={createForm.duration}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, duration: e.target.value }))}
              placeholder="Ví dụ: 12:45"
              fullWidth
            />
          </div>

          <Input
            label="Đường dẫn ảnh bìa (Thumbnail)"
            value={createForm.thumbnailUrl}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
            placeholder="https://..."
            fullWidth
          />

          <Textarea
            label="Mô tả & Công thức tóm tắt"
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Ghi chú nguyên liệu, mẹo nấu và khẩu phần..."
            rows={3}
            fullWidth
          />

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="radio"
                name="videoCreateStatus"
                checked={createForm.status === 'pending'}
                onChange={() => setCreateForm((prev) => ({ ...prev, status: 'pending' }))}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              Gửi kiểm duyệt ngay (AI & Admin)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="radio"
                name="videoCreateStatus"
                checked={createForm.status === 'draft'}
                onChange={() => setCreateForm((prev) => ({ ...prev, status: 'draft' }))}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              Lưu bản nháp để hoàn thiện sau
            </label>
          </div>
        </div>
      </Modal>
    </UserProfileShell>
  );
}