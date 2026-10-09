import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Activity,
  AlertTriangle,
  Camera,
  Upload,
  ArrowLeft,
} from 'lucide-react'
import type { UserProfile, DietaryType, HiddenIngredientRules, BodyMetrics } from '../types'
import { DietarySelector } from './DietarySelector'
import { AllergyManager } from './AllergyManager'
import { BodyMetricsCalculator } from './BodyMetricsCalculator'
import { Input, Select, Button } from '../../../shared/components'

interface ProfileSettingsFormProps {
  initialProfile: UserProfile
  onSave: (updates: Partial<UserProfile>) => Promise<void>
  onBackToOverview?: () => void
  onNavigate?: (path: string) => void
  isLoading?: boolean
}

const REGION_OPTIONS = [
  { value: 'Hà Nội (Khu vực trung tâm / Ba Đình)', label: 'Hà Nội (Khu vực trung tâm / Ba Đình)' },
  { value: 'Hà Nội (Cầu Giấy / Tây Hồ)', label: 'Hà Nội (Cầu Giấy / Tây Hồ)' },
  { value: 'Hà Nội (Đống Đa / Hai Bà Trưng)', label: 'Hà Nội (Đống Đa / Hai Bà Trưng)' },
  { value: 'TP. Hồ Chí Minh (Quận 1 / Quận 3)', label: 'TP. Hồ Chí Minh (Quận 1 / Quận 3)' },
  { value: 'TP. Hồ Chí Minh (Bình Thạnh / Phú Nhuận)', label: 'TP. Hồ Chí Minh (Bình Thạnh / Phú Nhuận)' },
  { value: 'TP. Hồ Chí Minh (Quận 2 / Thủ Đức)', label: 'TP. Hồ Chí Minh (Quận 2 / Thủ Đức)' },
  { value: 'Đà Nẵng (Hải Châu / Sơn Trà)', label: 'Đà Nẵng (Hải Châu / Sơn Trà)' },
]

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
]

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  initialProfile,
  onSave,
  onBackToOverview,
  onNavigate: _onNavigate,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'diet' | 'allergies' | 'metrics'>('info')
  const [fullName, setFullName] = useState(initialProfile.fullName)
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || PRESET_AVATARS[0])
  const [phoneNumber, setPhoneNumber] = useState(initialProfile.phoneNumber || '0912 345 678')
  const [preferredRegion, setPreferredRegion] = useState(
    initialProfile.preferredRegion || 'Hà Nội (Khu vực trung tâm / Ba Đình)',
  )
  const [dietaryType, setDietaryType] = useState<DietaryType>(initialProfile.dietaryType)
  const [allergies, setAllergies] = useState<string[]>(initialProfile.allergies)
  const [hiddenRules, setHiddenRules] = useState<HiddenIngredientRules>(
    initialProfile.hiddenIngredientRules,
  )
  const [metrics, setMetrics] = useState<BodyMetrics>(initialProfile.metrics)

  const [nameError, setNameError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh không được vượt quá 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (result) {
        setAvatarUrl(result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    const trimmedName = fullName.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Họ và tên tối thiểu 2 ký tự.')
      setActiveTab('info')
      return
    }
    setNameError(null)

    try {
      await onSave({
        fullName: trimmedName,
        avatarUrl,
        phoneNumber: phoneNumber.trim(),
        preferredRegion,
        dietaryType,
        allergies,
        hiddenIngredientRules: hiddenRules,
        metrics,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Cập nhật thất bại. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header Card with Back Action */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cài đặt Tài khoản &amp; Hồ sơ Ăn chay</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chỉnh sửa thông tin cá nhân, ảnh đại diện, chế độ dinh dưỡng và các tiêu chuẩn an toàn
          </p>
        </div>

        {onBackToOverview && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToOverview}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Quay lại Tổng quan
          </Button>
        )}
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>✓ Hồ sơ ăn chay và thông tin tài khoản đã được lưu thành công!</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Clean Horizontal Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'info'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Thông tin &amp; Ảnh đại diện</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'diet'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" />
          <span>Chế độ ăn chay ({dietaryType})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('allergies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'allergies'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Bộ lọc Dị ứng ({allergies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Chỉ số cơ thể &amp; BMI ({metrics.bmi})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm">
        {/* Tab 1: Personal Info & Avatar */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-6">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Thông tin Tài khoản &amp; Liên hệ</h3>
              <span className="text-xs text-slate-400 font-mono">ID: {initialProfile.id}</span>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = PRESET_AVATARS[0]
                  }}
                />
                <label
                  htmlFor="avatar-file-input"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-700 text-white cursor-pointer hover:bg-emerald-800 shadow transition-transform active:scale-95"
                  title="Tải ảnh mới từ máy tính"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 flex-1 w-full text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Ảnh đại diện tài khoản</h4>
                  <p className="text-xs text-slate-500">
                    Tải ảnh từ máy tính (PNG, JPG, WebP) hoặc chọn nhanh mẫu avatar có sẵn bên dưới.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <span className="text-[11px] font-semibold text-slate-600">Chọn mẫu:</span>
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url
                          ? 'border-emerald-600 ring-2 ring-emerald-300 scale-105'
                          : 'border-slate-200 hover:border-emerald-400 opacity-70 hover:opacity-100'
                      }`}
                      title={`Mẫu ${idx + 1}`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  <label
                    htmlFor="avatar-file-input"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-emerald-800 cursor-pointer shadow-2xs ml-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh lên</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Input
                  label="Họ và tên"
                  required
                  value={fullName}
                  error={nameError || undefined}
                  disabled={isLoading}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (nameError) setNameError(null)
                  }}
                  leftIcon={<User className="w-4 h-4" />}
                  placeholder="Văn Quang Duy"
                />
              </div>

              <div>
                <Input
                  label="Email liên kết"
                  required
                  value={initialProfile.email}
                  disabled
                  leftIcon={<Mail className="w-4 h-4" />}
                  rightIcon={<Lock className="w-4 h-4" />}
                  helperText="Email dùng đăng nhập và đặt lại mật khẩu, không thể chỉnh sửa."
                />
              </div>

              <div>
                <Input
                  label="Số điện thoại liên hệ"
                  value={phoneNumber}
                  disabled={isLoading}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  placeholder="0912 345 678"
                  helperText="Phục vụ liên hệ hỗ trợ hoặc nhận phản hồi từ cộng đồng."
                />
              </div>

              <div>
                <Select
                  label="Khu vực ưu tiên tìm nhà hàng chay"
                  value={preferredRegion}
                  disabled={isLoading}
                  onChange={(e) => setPreferredRegion(e.target.value)}
                  options={REGION_OPTIONS}
                  helperText="Dùng để ưu tiên hiển thị nhà hàng gần bạn trong bản đồ ăn chay."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dietary Type */}
        {activeTab === 'diet' && (
          <DietarySelector
            selectedDiet={dietaryType}
            onChange={(diet) => setDietaryType(diet)}
            disabled={isLoading}
          />
        )}

        {/* Tab 3: Allergies */}
        {activeTab === 'allergies' && (
          <AllergyManager
            allergies={allergies}
            onAllergiesChange={(list) => setAllergies(list)}
            hiddenRules={hiddenRules}
            onHiddenRulesChange={(rules) => setHiddenRules(rules)}
            disabled={isLoading}
          />
        )}

        {/* Tab 4: Body Metrics */}
        {activeTab === 'metrics' && (
          <BodyMetricsCalculator
            metrics={metrics}
            onChange={(newMetrics) => setMetrics(newMetrics)}
            preferredProteins={initialProfile.preferredProteinSources}
            disabled={isLoading}
          />
        )}

        {/* Non-floating Form Action Buttons (Clean at bottom of form) */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
          {onBackToOverview && (
            <Button
              variant="outline"
              size="md"
              onClick={onBackToOverview}
              disabled={isLoading}
            >
              Quay lại Tổng quan
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => handleSubmit()}
            disabled={isLoading}
            isLoading={isLoading}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Lưu thay đổi hồ sơ
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettingsForm
