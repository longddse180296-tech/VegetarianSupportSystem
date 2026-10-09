import React, { useState, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PublicLayout } from '../../../app/layouts/PublicLayout'
import { useAuth } from '../../auth'
import {
  Button,
  Input,
  Textarea,
  Select,
  Modal,
} from '../../../shared/components'
import AlertError from '../../../shared/components/AlertError'
import {
  CATEGORIES,
  createUserArticle,
  updateUserArticle,
  getArticleById,
  deleteUserArticle,
  submitArticleForReview,
} from '../api/articles.api'
import type { ArticleCategory } from '../types/article.types'

import { RichContentRenderer } from '../components/RichContentRenderer'

const articleSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(120, 'Tiêu đề không được vượt quá 120 ký tự'),
  category: z.string().min(1, 'Vui lòng chọn danh mục bài viết'),
  content: z
    .string()
    .min(20, 'Nội dung bài viết phải có ít nhất 20 ký tự'),
  excerpt: z.string().optional(),
  captionHeroImage: z.string().optional(),
})

type ArticleFormValues = z.infer<typeof articleSchema>

interface ArticleEditorPageProps {
  articleId?: string
  onNavigate: (path: string) => void
}

const DEFAULT_CONTENT = `Khi mới bước vào chế độ ăn thực dưỡng hoặc thuần chay, nỗi băn khoăn lớn nhất của phần đông người Việt chính là: “Làm thế nào để nạp đủ lượng protein (chất đạm) mà cơ thể cần mỗi ngày?”. Trái với quan niệm phổ biến rằng chỉ thịt động vật mới cung cấp đạm chất lượng cao, thế giới thực vật chứa đựng nguồn axit amin vô cùng phong phú, lành sạch và dễ hấp thu.

## 1. Các nguồn thực phẩm giàu đạm thực vật vàng
Để tối ưu hóa sự hấp thụ và đa dạng hóa thực đơn hàng ngày, bạn hãy phối hợp linh hoạt các nhóm nguyên liệu dưới đây:

• **Đậu nành & Đậu phụ (Tofu)**: Đậu phụ tươi cung cấp từ 10 - 15g protein cho mỗi khẩu phần 100g, chứa trọn vẹn 9 loại axit amin thiết yếu.
• **Hạt diêm mạch (Quinoa)**: Được ví như “siêu ngũ cốc”, giàu khoáng chất sắt, magie và 8g protein chất lượng cao trong mỗi chén nấu chín.
• **Đậu lăng (Lentils) & Đậu gà (Chickpeas)**: Rất giàu chất xơ hòa tan và khoảng 18g đạm cho mỗi chén đã chế biến, hoàn hảo cho các món súp hoặc cà ri.
• **Nấm rơm, nấm đông cô & nấm hương**: Không chỉ tạo vị ngọt umami tự nhiên mà còn mang lại nguồn protein và beta-glucan tăng cường miễn dịch.

> Ăn chay khoa học không có nghĩa là thiếu chất, mà là cách chúng ta chọn lọc dinh dưỡng thông thái hơn.`

export const ArticleEditorPage: React.FC<ArticleEditorPageProps> = ({
  articleId,
  onNavigate,
}) => {
  const { user, logout } = useAuth()
  const isEditing = Boolean(articleId)

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      onNavigate('/auth/login')
    }
  }, [user, onNavigate])

  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
  )
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false)
  const [urlInput, setUrlInput] = useState<string>('')

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

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
      content: isEditing ? DEFAULT_CONTENT : '',
      excerpt: '',
      captionHeroImage: isEditing
        ? 'Bữa ăn chay chuẩn dinh dưỡng với các loại rau củ tươi, đậu hạt và ngũ cốc nguyên cám.'
        : '',
    },
  })

  // Load article when editing
  useEffect(() => {
    if (!articleId) return
    let isMounted = true
    const loadData = async () => {
      try {
        const item = await getArticleById(articleId)
        if (isMounted && item) {
          setValue('title', item.title)
          setValue('category', item.category)
          setValue(
            'content',
            item.sections?.map((s) => (s.title ? `## ${s.title}\n${s.content}` : s.content)).join('\n\n') || DEFAULT_CONTENT
          )
          setValue('excerpt', item.excerpt || '')
          if (item.captionHeroImage) {
            setValue('captionHeroImage', item.captionHeroImage)
          }
          if (item.thumbnailUrl) {
            setThumbnailUrl(item.thumbnailUrl)
          }
        }
      } catch {
        // Keep initial fallback
      }
    }
    void loadData()
    return () => {
      isMounted = false
    }
  }, [articleId, setValue])

  const currentTitle = useWatch({ control, name: 'title' }) || ''
  const currentContent = useWatch({ control, name: 'content' }) || ''
  const currentExcerpt = useWatch({ control, name: 'excerpt' }) || ''
  const currentCaption = useWatch({ control, name: 'captionHeroImage' }) || ''

  // Word count & reading time
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 120))

  const handleToolbarInsert = (prefix: string, suffix = '') => {
    const textarea = contentTextareaRef.current
    if (!textarea) {
      setValue('content', `${currentContent}\n${prefix}${suffix}`, {
        shouldValidate: true,
        shouldDirty: true,
      })
      return
    }

    const start = textarea.selectionStart ?? currentContent.length
    const end = textarea.selectionEnd ?? currentContent.length
    const selectedText = currentContent.substring(start, end)

    const isBlockPrefix =
      prefix.endsWith(' ') &&
      (prefix.startsWith('#') ||
        prefix.startsWith('>') ||
        prefix.startsWith('•') ||
        prefix.startsWith('1.'))

    if (isBlockPrefix) {
      if (selectedText) {
        const modified = selectedText
          .split('\n')
          .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
          .join('\n')
        const newContent =
          currentContent.substring(0, start) + modified + currentContent.substring(end)
        setValue('content', newContent, { shouldValidate: true, shouldDirty: true })
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start, start + modified.length)
        }, 0)
        return
      }

      // If nothing selected, find line start
      const lineStart = currentContent.lastIndexOf('\n', start - 1) + 1
      const before = currentContent.substring(0, lineStart)
      const after = currentContent.substring(lineStart)
      const newContent = `${before}${prefix}${after}`
      setValue('content', newContent, { shouldValidate: true, shouldDirty: true })
      setTimeout(() => {
        textarea.focus()
        const newPos = start + prefix.length
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
      return
    }

    // Inline markup like **bold**, *italic*
    let replacement = ''
    let newStart = start
    let newEnd = end

    if (selectedText) {
      replacement = `${prefix}${selectedText}${suffix}`
      newStart = start
      newEnd = start + replacement.length
    } else {
      const placeholder =
        prefix === '**'
          ? 'chữ in đậm'
          : prefix === '*'
          ? 'chữ in nghiêng'
          : 'văn bản'
      replacement = `${prefix}${placeholder}${suffix}`
      newStart = start + prefix.length
      newEnd = newStart + placeholder.length
    }

    const newContent =
      currentContent.substring(0, start) + replacement + currentContent.substring(end)
    setValue('content', newContent, { shouldValidate: true, shouldDirty: true })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }

  const handleInsertNumberedSection = () => {
    const textarea = contentTextareaRef.current
    const current = currentContent

    // Find the highest section number in current content
    const matches = [...current.matchAll(/(?:^|\n)\s*(?:#{1,3}\s*)?(\d+)[.)]\s+/g)]
    let nextNum = 1
    if (matches.length > 0) {
      const nums = matches.map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n))
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1
      }
    }

    const snippet = `\n\n## ${nextNum}. Tiêu đề phần ${nextNum}\nNội dung chi tiết giải thích cho phần ${nextNum}...`

    if (!textarea) {
      setValue('content', `${current}${snippet}`, { shouldValidate: true, shouldDirty: true })
      return
    }

    const start = textarea.selectionStart ?? current.length
    const newContent = current.substring(0, start) + snippet + current.substring(start)
    setValue('content', newContent, { shouldValidate: true, shouldDirty: true })

    setTimeout(() => {
      textarea.focus()
      const titleStart = start + `\n\n## ${nextNum}. `.length
      const titleEnd = titleStart + `Tiêu đề phần ${nextNum}`.length
      textarea.setSelectionRange(titleStart, titleEnd)
    }, 0)
  }

  // Handle local file upload
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa là 5MB.')
      return
    }
    setErrorMsg(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnailUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSaveWithStatus = async (status: 'published' | 'draft') => {
    await handleSubmit(async (values) => {
      try {
        setIsSubmitting(true)
        setErrorMsg(null)

        if (isEditing && articleId) {
          await updateUserArticle(articleId, {
            title: values.title,
            category: values.category as ArticleCategory,
            content: values.content,
            excerpt: values.excerpt,
            captionHeroImage: values.captionHeroImage,
            thumbnailUrl,
            status,
          })
          setSaveSuccess(`Đã lưu bài viết ở trạng thái "${status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}" thành công!`)
          setTimeout(() => {
            onNavigate(`/articles/${articleId}`)
          }, 1200)
        } else {
          const res = await createUserArticle({
            title: values.title,
            category: values.category as ArticleCategory,
            content: values.content,
            excerpt: values.excerpt,
            captionHeroImage: values.captionHeroImage,
            thumbnailUrl,
            status,
          })
          setSaveSuccess(`Đã ${status === 'published' ? 'xuất bản' : 'lưu bản nháp'} bài viết thành công! Đang chuyển đến bài viết...`)
          setTimeout(() => {
            onNavigate(`/articles/${res.id}`)
          }, 1200)
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu bài viết')
      } finally {
        setIsSubmitting(false)
      }
    })()
  }

  const handleConfirmDelete = async () => {
    if (!articleId) return
    try {
      setIsDeleting(true)
      await deleteUserArticle(articleId)
      setIsDeleteModalOpen(false)
      onNavigate('/profile/my-articles')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi xóa bài viết')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendForReview = async () => {
    if (!articleId) return
    try {
      setIsSubmitting(true)
      await submitArticleForReview(articleId)
      setSaveSuccess('Đã gửi bài viết cho Admin phê duyệt!')
      setTimeout(() => {
        onNavigate('/profile/my-articles')
      }, 1500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi gửi duyệt bài viết')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({
    value: c.id,
    label: c.label,
  }))

  return (
    <PublicLayout
      activeNav="articles"
      onNavigate={onNavigate}
      isLoggedIn={Boolean(user)}
      userName={user?.fullName || 'Van Quang Duy'}
      onLogout={() => { void logout() }}
    >
      <div className="min-h-screen bg-slate-50/60 pb-20">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-8 animate-in fade-in duration-200">
          {/* Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="hover:text-emerald-700 transition-colors"
              >
                Trang chủ
              </button>
              <span>&gt;</span>
              <button
                type="button"
                onClick={() => onNavigate('/articles')}
                className="hover:text-emerald-700 transition-colors"
              >
                Bài viết
              </button>
              <span>&gt;</span>
              <span className="font-semibold text-slate-800">
                {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/articles')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto"
            >
              ← Quay lại danh sách bài viết
            </button>
          </div>

          {/* Header Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {isEditing ? '✏️ Chế độ chỉnh sửa' : '★ Soạn bài mới'}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {isEditing
                  ? 'Cập nhật lại tiêu đề, nội dung và ảnh bìa bài viết của bạn.'
                  : 'Chia sẻ kiến thức dinh dưỡng, công thức và kinh nghiệm ăn chay khoa học với cộng đồng.'}
              </p>
            </div>
          </div>

          {/* Form Message Feedback */}
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <span>✓ {saveSuccess}</span>
            </div>
          )}
          {errorMsg && (
            <AlertError
              title="Đã xảy ra lỗi"
              message={errorMsg}
              onRetry={() => setErrorMsg(null)}
            />
          )}

          {/* Form Grid 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Content Editor (65%) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Tiêu đề bài viết */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs ${
                      currentTitle.length > 120
                        ? 'text-red-500 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {currentTitle.length} / 120 ký tự
                  </span>
                </div>

                <Input
                  {...register('title')}
                  placeholder="Ví dụ: Top 7 nguồn Protein thực vật hoàn hảo cho người mới ăn chay..."
                  error={errors.title?.message}
                  fullWidth
                />
              </div>

              {/* Card 2: Tóm tắt ngắn (Sa-pô) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Tóm tắt bài viết (Sa-pô ngắn)
                  </label>
                  <span className="text-xs text-slate-400">
                    {currentExcerpt.length} ký tự
                  </span>
                </div>
                <Textarea
                  rows={2}
                  {...register('excerpt')}
                  placeholder="Mô tả ngắn 1-2 câu tóm tắt nội dung chính để hiển thị nổi bật ở danh sách bài viết..."
                  error={errors.excerpt?.message}
                  fullWidth
                />
              </div>

              {/* Card 3: Nội dung bài viết */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Nội dung chi tiết <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditorMode('edit')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        editorMode === 'edit'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Soạn thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('preview')}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        editorMode === 'preview'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Xem trước
                    </button>
                  </div>
                </div>

                {editorMode === 'edit' ? (
                  <>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
                      <button
                        type="button"
                        onClick={handleInsertNumberedSection}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
                        title="Thêm phần mục có số thứ tự chấm xanh và tiêu đề in đậm size to"
                      >
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                          1
                        </span>
                        <span>Phần mục (chấm xanh)</span>
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('# ')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-extrabold rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="Tiêu đề chính (H1)"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('## ')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="Tiêu đề mục (H2)"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('### ')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="Tiêu đề nhỏ (H3)"
                      >
                        H3
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('**', '**')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="In đậm (**văn bản**)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('*', '*')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 italic rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="In nghiêng (*văn bản*)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('> ')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="Trích dẫn (> nội dung)"
                      >
                        ” Trích dẫn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('• ')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="Danh sách gạch đầu dòng (• mục)"
                      >
                        • Gạch đầu dòng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToolbarInsert('1. ')}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-200 active:scale-95 transition-all"
                        title="Danh sách số (1. bước)"
                      >
                        1. Thứ tự
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 italic px-1">
                      💡 Mẹo: Bôi đen văn bản rồi bấm nút định dạng, hoặc bấm nút để chèn mẫu ngay tại vị trí con trỏ chuột.
                    </div>

                    {(() => {
                      const { ref: contentHookRef, ...contentFieldProps } = register('content')
                      return (
                        <Textarea
                          rows={14}
                          ref={(el) => {
                            contentHookRef(el)
                            contentTextareaRef.current = el
                          }}
                          {...contentFieldProps}
                          placeholder="Viết nội dung bài viết cẩm nang tại đây. Sử dụng thanh công cụ phía trên để định dạng tiêu đề, in đậm, gạch đầu dòng..."
                          error={errors.content?.message}
                          fullWidth
                        />
                      )
                    })()}
                  </>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 min-h-[300px]">
                    {thumbnailUrl && (
                      <div className="mb-6">
                        <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                          <img
                            src={thumbnailUrl}
                            alt={currentTitle || 'Ảnh bài viết'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {currentCaption && (
                          <p className="mt-2 text-center text-xs text-slate-500 italic">
                            {currentCaption}
                          </p>
                        )}
                      </div>
                    )}
                    <RichContentRenderer content={currentContent} />
                  </div>
                )}

                {/* Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>
                    Độ dài: <strong className="text-slate-800">{wordCount} từ</strong> (khoảng{' '}
                    {readTimeMin} phút đọc)
                  </span>
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <span>✓</span> Sẵn sàng lưu trữ
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Clean & Intuitive Sidebar (35%) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Thẻ 1: Ảnh đại diện bài viết (Thumbnail) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <span>🖼️</span>
                    <span>Ảnh đại diện (Thumbnail)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Tối đa 5MB</span>
                </div>

                {/* Invisible input file */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0])
                    }
                  }}
                />

                {thumbnailUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs group">
                      <img
                        src={thumbnailUrl}
                        alt="Ảnh bìa bài viết"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>📁</span>
                        <span>Đổi ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl('')}
                        className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-semibold text-rose-700 hover:bg-rose-100/60 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>🗑️</span>
                        <span>Xóa ảnh</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-[16/9] w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-3xl mb-1.5">📤</span>
                    <span className="text-xs font-bold text-slate-800 mb-1">
                      Bấm để tải ảnh từ máy tính
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      hoặc kéo thả file ảnh vào đây (JPG, PNG, WEBP)
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput(thumbnailUrl)
                      setIsUrlModalOpen(true)
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] underline"
                  >
                    Hoặc nhập link URL ảnh trực tiếp
                  </button>
                </div>

                {/* Chú thích ảnh (captionHeroImage) */}
                <div className="pt-3 border-t border-slate-100">
                  <Input
                    label="Mô tả / Chú thích ảnh (tùy chọn)"
                    {...register('captionHeroImage')}
                    placeholder="Ví dụ: Bữa ăn chay chuẩn dinh dưỡng với các loại rau củ tươi..."
                    helperText="Hiển thị in nghiêng ở giữa ngay dưới ảnh bìa bài viết"
                    fullWidth
                  />
                </div>
              </div>

              {/* Thẻ 2: Cài đặt bài viết */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <span>⚙️</span>
                  <span>Cài đặt bài viết</span>
                </div>

                <div>
                  <Select
                    label="Danh mục bài viết *"
                    options={categoryOptions}
                    {...register('category')}
                    error={errors.category?.message}
                    fullWidth
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Chọn nhóm chủ đề phù hợp nhất để bài viết đến với độc giả.
                  </p>
                </div>

                {/* Tác giả */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Tác giả bài viết
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-emerald-200"
                    />
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-slate-900">
                        {user?.fullName || 'Van Quang Duy'}
                      </span>
                      <span className="text-[11px] text-slate-500">Đăng với tư cách tác giả</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thẻ 3: Hành động xuất bản */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  <span>🚀</span>
                  <span>Hành động xuất bản</span>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={() => handleSaveWithStatus('published')}
                  className="rounded-2xl shadow-sm"
                >
                  {isEditing ? 'Lưu & Xuất bản bài viết' : 'Xuất bản bài viết ngay'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={() => handleSaveWithStatus('draft')}
                  className="rounded-2xl"
                >
                  Lưu bản nháp
                </Button>

                {isEditing && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    fullWidth
                    disabled={isSubmitting}
                    onClick={handleSendForReview}
                    className="rounded-2xl"
                  >
                    Gửi duyệt cho Admin
                  </Button>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => onNavigate('/articles')}
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Hủy bỏ
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Xóa bài viết
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa bài viết"
        description="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này sẽ loại bỏ bài viết hoàn toàn."
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Xác nhận xóa
            </Button>
          </div>
        }
      >
        <p className="text-xs text-gray-600">
          Bài viết sẽ không còn xuất hiện trên trang cá nhân hoặc cẩm nang kiến thức công khai.
        </p>
      </Modal>

      {/* URL Input Modal */}
      <Modal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        title="Nhập liên kết hình ảnh"
        description="Dán đường dẫn ảnh trực tuyến (JPG, PNG, WEBP) để làm ảnh đại diện."
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUrlModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (urlInput.trim()) {
                  setThumbnailUrl(urlInput.trim())
                }
                setIsUrlModalOpen(false)
              }}
            >
              Áp dụng
            </Button>
          </div>
        }
      >
        <Input
          label="Đường dẫn URL ảnh"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://images.unsplash.com/photo-..."
          fullWidth
        />
      </Modal>
    </PublicLayout>
  )
}

export default ArticleEditorPage
