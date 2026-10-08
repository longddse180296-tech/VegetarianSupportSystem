import React, { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { useAuth } from '../../auth'
import {
  CATEGORIES,
  createUserArticle,
  updateUserArticle,
} from '../api/articles.api'
import type { ArticleCategory } from '../types/article.types'

const articleSchema = z.object({
  title: z
    .string()
    .min(10, 'Tiêu đề phải có ít nhất 10 ký tự')
    .max(120, 'Tiêu đề không được vượt quá 120 ký tự'),
  category: z.string().min(1, 'Vui lòng chọn danh mục bài viết'),
  content: z
    .string()
    .min(50, 'Nội dung bài viết phải có ít nhất 50 ký tự để đảm bảo chất lượng chia sẻ'),
  excerpt: z.string().optional(),
  status: z.enum(['published', 'draft']),
})

type ArticleFormValues = z.infer<typeof articleSchema>

interface ArticleEditorPageProps {
  articleId?: string
  onNavigate: (path: string) => void
}

export const ArticleEditorPage: React.FC<ArticleEditorPageProps> = ({
  articleId,
  onNavigate,
}) => {
  const { user, logout } = useAuth()
  const isEditing = Boolean(articleId)

  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
  )
  const [editorMode, setEditorMode] = useState<'richtext' | 'markdown'>('richtext')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const defaultContent = `Khi mới bước vào chế độ ăn thực dưỡng hoặc thuần chay, nỗi băn khoăn lớn nhất của phần đông người Việt chính là: “Làm thế nào để nạp đủ lượng protein (chất đạm) mà cơ thể cần mỗi ngày?”. Trái với quan niệm phổ biến rằng chỉ thịt động vật mới cung cấp đạm chất lượng cao, thế giới thực vật chứa đựng nguồn axit amin vô cùng phong phú, lành sạch và dễ hấp thu.

1. Các nguồn thực phẩm giàu đạm thực vật vàng
Để tối ưu hóa sự hấp thụ và đa dạng hóa thực đơn hàng ngày, bạn hãy phối hợp linh hoạt các nhóm nguyên liệu dưới đây:

• Đậu nành & Đậu phụ (Tofu): Đậu phụ tươi cung cấp từ 10 - 15g protein cho mỗi khẩu phần 100g, chứa trọn vẹn 9 loại axit amin thiết yếu.
• Hạt diêm mạch (Quinoa): Được ví như “siêu ngũ cốc”, giàu khoáng chất sắt, magie và 8g protein chất lượng cao trong mỗi chén nấu chín.
• Đậu lăng (Lentils) & Đậu gà (Chickpeas): Rất giàu chất xơ hòa tan và khoảng 18g đạm cho mỗi chén đã chế biến, hoàn hảo cho các món súp hoặc cà ri.
• Nấm rơm, nấm đông cô & nấm hương: Không chỉ tạo vị ngọt umami tự nhiên mà còn mang lại nguồn protein và beta-glucan tăng cường miễn dịch.`

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: isEditing
        ? 'Kinh nghiệm bổ sung Protein thực vật cho người mới bắt đầu'
        : '',
      category: 'nutrition',
      content: defaultContent,
      excerpt: '',
      status: 'published',
    },
  })

  const currentTitle = useWatch({ control, name: 'title' }) || ''
  const currentContent = useWatch({ control, name: 'content' }) || ''
  const currentCategory = (useWatch({ control, name: 'category' }) as ArticleCategory) || 'nutrition'
  const currentStatus = useWatch({ control, name: 'status' })

  // Calculate words and estimated reading time
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 120))

  const handleToolbarInsert = (prefix: string, suffix = '') => {
    setValue('content', `${currentContent}\n${prefix} ${suffix}`)
  }

  const onSubmit = async (values: ArticleFormValues) => {
    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      if (isEditing && articleId) {
        await updateUserArticle(articleId, {
          title: values.title,
          category: values.category as ArticleCategory,
          content: values.content,
          excerpt: values.excerpt,
          thumbnailUrl,
          status: values.status,
        })
      } else {
        await createUserArticle({
          title: values.title,
          category: values.category as ArticleCategory,
          content: values.content,
          excerpt: values.excerpt,
          thumbnailUrl,
          status: values.status,
        })
      }

      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
        onNavigate('/profile/my-articles')
      }, 1500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu bài viết')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.id === currentCategory)?.label || 'Dinh dưỡng'

  return (
    <PublicLayout
      activeNav="home"
      onNavigate={onNavigate}
      isLoggedIn={Boolean(user)}
      userName={user?.fullName || 'Nguyễn Minh Anh'}
      onLogout={() => { void logout() }}
    >
      <div className="min-h-screen bg-slate-50/60 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="hover:text-emerald-700 transition-colors"
            >
              Trang chủ
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigate('/profile')}
              className="hover:text-emerald-700 transition-colors"
            >
              Tài khoản
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigate('/profile/my-articles')}
              className="hover:text-emerald-700 transition-colors"
            >
              Bài viết của tôi
            </button>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">
              {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </span>
          </nav>

          {/* Header Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {isEditing ? '✓ Chế độ chỉnh sửa' : '★ Chế độ tạo mới'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Cập nhật nội dung bài viết của bạn hoặc chia sẻ kiến thức, kinh nghiệm ăn chay mới với cộng đồng thực dưỡng.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onNavigate(isEditing ? '/articles/editor' : '/profile/my-articles')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>{isEditing ? '✦ Chuyển sang Tạo bài viết mới' : '← Quay lại danh sách'}</span>
              </button>
            </div>
          </div>

          {/* Form Message Feedback */}
          {saveSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center justify-between">
              <span>✓ Lưu bài viết thành công! Đang chuyển về danh sách...</span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-semibold">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* Form Content 2 Columns */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form Fields (70%) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title Input Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <span
                      className={`text-xs ${
                        currentTitle.length > 120
                          ? 'text-red-500 font-bold'
                          : 'text-gray-400'
                      }`}
                    >
                      {currentTitle.length} / 120 ký tự
                    </span>
                  </div>

                  <input
                    type="text"
                    {...register('title')}
                    placeholder="Ví dụ: Top 7 nguồn Protein thực vật hoàn hảo cho người mới ăn chay..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Content Editor Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Nội dung <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <span>🕒</span> Đã tự động lưu nháp: 2 phút trước
                    </span>
                  </div>

                  {/* Editor Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 border border-gray-200/80 rounded-2xl text-xs">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('# ')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 text-xs"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('## ')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 text-xs"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('### ')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 text-xs"
                      >
                        H3
                      </button>
                      <div className="w-[1px] h-4 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('**', '**')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 font-black rounded-lg border border-gray-200"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('*', '*')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 italic rounded-lg border border-gray-200"
                      >
                        I
                      </button>
                      <div className="w-[1px] h-4 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('• ')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                      >
                        ☰
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('1. ')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                      >
                        1.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('> ')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                      >
                        ”
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('[Tiêu đề link](https://...)')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                      >
                        🔗
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('![Ảnh minh họa](https://...)')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                      >
                        🖼️
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                      <button
                        type="button"
                        onClick={() => setEditorMode('markdown')}
                        className={`px-2 py-1 rounded-md ${
                          editorMode === 'markdown'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'hover:text-gray-900'
                        }`}
                      >
                        Markdown
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => setEditorMode('richtext')}
                        className={`px-2 py-1 rounded-md ${
                          editorMode === 'richtext'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'hover:text-gray-900'
                        }`}
                      >
                        RichText
                      </button>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    rows={14}
                    {...register('content')}
                    placeholder="Viết nội dung bài viết cẩm nang tại đây..."
                    className="w-full p-4 rounded-2xl border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-y"
                  />
                  {errors.content && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.content.message}
                    </p>
                  )}

                  {/* Word Count & Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 pt-2 border-t border-gray-50">
                    <span>
                      Độ dài: <strong className="text-gray-800">{wordCount} từ</strong> (khoảng{' '}
                      {readTimeMin} phút đọc)
                    </span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <span>✓</span> Nội dung đạt chuẩn hiển thị
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                    >
                      <span>💾</span>
                      <span>
                        {isSubmitting
                          ? 'Đang lưu...'
                          : isEditing
                          ? 'Lưu thay đổi'
                          : 'Xuất bản bài viết'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('/profile/my-articles')}
                      className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                    >
                      Hủy bỏ
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('/articles/art-1')}
                      className="px-4 py-3 rounded-2xl text-gray-600 hover:text-emerald-700 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <span>👁️</span>
                      <span>Xem bài viết trên web</span>
                    </button>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
                          onNavigate('/profile/my-articles')
                        }
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 p-2"
                    >
                      <span>🗑️ Xóa bài viết</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Configuration & Upload Sidebar (30%) */}
              <div className="space-y-6">
                {/* Configuration Box */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider">
                    <span>⚙️</span>
                    <span>Cấu hình xuất bản</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Danh mục <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400">Quản lý bởi Admin</span>
                    </div>
                    <select
                      {...register('category')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-gray-400">
                      Chọn nhóm chủ đề phù hợp nhất để bài viết đến với người đọc quan tâm.
                    </p>
                  </div>

                  {/* Author Card */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                        alt="Tác giả"
                        className="w-9 h-9 rounded-full object-cover border border-emerald-200"
                      />
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-gray-900">
                          {user?.fullName || 'Nguyễn Minh Anh'}
                        </span>
                        <span className="text-[11px] text-gray-500">Tác giả bài viết</span>
                      </div>
                    </div>
                    <span className="text-emerald-700 text-sm font-bold">✓</span>
                  </div>

                  {/* Status Toggle */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Trạng thái xuất bản</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setValue('status', 'published')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          currentStatus === 'published'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Đã xuất bản
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('status', 'draft')}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          currentStatus === 'draft'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Bản nháp
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>Cập nhật lần cuối:</span>
                      <span className="font-medium text-gray-700">Hôm nay, 14:25</span>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Upload Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                    <span>Ảnh đại diện</span>
                    <span className="text-[10px] text-gray-400 font-normal">Tối đa 5MB</span>
                  </div>

                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-3xl mb-1">🖼️</span>
                        <span className="text-xs">Chưa có ảnh đại diện</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newUrl = window.prompt(
                          'Nhập URL ảnh thumbnail:',
                          thumbnailUrl
                        )
                        if (newUrl) setThumbnailUrl(newUrl)
                      }}
                      className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <span>🔄</span>
                      <span>Thay đổi ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="p-2 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                      title="Xóa ảnh"
                    >
                      🗑️
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Hỗ trợ JPG, PNG, WEBP tỷ lệ 16:9 sắc nét. Kéo thả trực tiếp vào ô để cập nhật.
                  </p>
                </div>

                {/* Helpful Advice Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-3xl p-6 border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <span>💡</span>
                    <span>Mẹo chia sẻ bổ ích</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    Các bài viết có liệt kê khối lượng nguyên liệu thực tế (gram, chén) và hình ảnh món ăn trực quan sẽ nhận được sự quan tâm và lượt đọc cao hơn 75%.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick View Live Preview Section */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">📱</span>
                  <h3 className="text-sm font-bold text-gray-900">
                    Xem trước giao diện bài viết (Quick View)
                  </h3>
                </div>
                <span className="text-xs text-gray-400">Mô phỏng 100% người xem</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                Hình ảnh bài viết hiển thị trong danh sách cẩm nang dinh dưỡng của Vegetarian Support.
              </p>

              <div className="max-w-md bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="relative aspect-[16/10] bg-gray-100">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      Ảnh xem trước
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {selectedCategoryLabel}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-2">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>⏱️ {readTimeMin} phút đọc</span>
                    <span>•</span>
                    <span>Cập nhật hôm nay</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-2">
                    {currentTitle || 'Tiêu đề bài viết của bạn sẽ hiển thị ở đây...'}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {currentContent.slice(0, 140)}...
                  </p>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">
                      {user?.fullName || 'Nguyễn Minh Anh'}
                    </span>
                    <span className="text-emerald-700 font-semibold">Đọc tiếp →</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}
