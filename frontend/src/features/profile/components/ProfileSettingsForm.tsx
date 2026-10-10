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
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header Card */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-5 sm:p-6 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-[#1f2937] tracking-tight">
            Cài đặt Tài khoản &amp; Hồ sơ Dinh dưỡng
          </h2>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Chỉnh sửa thông tin cá nhân, ảnh đại diện, trường phái ăn chay và chỉ số thể trạng
          </p>
        </div>

        {onBackToOverview && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToOverview}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5 text-[#2e7d32]" />}
          >
            Quay lại Tổng quan
          </Button>
        )}
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-[12px] bg-[#e8f5e9] border border-emerald-300 text-[#1b5e20] text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2e7d32] shrink-0" />
          <span>✓ Hồ sơ ăn chay và thông tin tài khoản đã được lưu thành công!</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Clean Horizontal Tabs (DESIGN.md Navigation) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
            activeTab === 'info'
              ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
              : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Thông tin &amp; Ảnh đại diện</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
            activeTab === 'diet'
              ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
              : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
          }`}
        >
          <Leaf className="w-3.5 h-3.5" />
          <span>Chế độ ăn chay ({dietaryType})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('allergies')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
            activeTab === 'allergies'
              ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
              : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Bộ lọc Dị ứng ({allergies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
            activeTab === 'metrics'
              ? 'border-emerald-400 bg-[#EAF5EE] text-[#1E6531] shadow-2xs'
              : 'border-transparent text-[#1f2937] hover:bg-[#f8faf8]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Chỉ số cơ thể &amp; BMI ({metrics.bmi})</span>
        </button>
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-6 sm:p-7 shadow-[0_2px_8px_-2px_rgba(31,41,55,0.04),0_1px_4px_-1px_rgba(31,41,55,0.02)]">
        {/* Tab 1: Personal Info & Avatar */}
        {activeTab === 'info' && (
          <div className="flex flex-col gap-6">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1f2937]">Thông tin Tài khoản &amp; Liên hệ</h3>
              <span className="text-xs text-[#6b7280] font-mono">ID: {initialProfile.id}</span>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-[16px] bg-[#f8faf8] border border-[#e5e7eb]">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-[#e8f5e9] border border-emerald-600/30 shadow-sm"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = PRESET_AVATARS[0]
                  }}
                />
                <label
                  htmlFor="avatar-file-input"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#2e7d32] text-white cursor-pointer hover:bg-[#1b5e20] shadow transition-transform active:scale-95"
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
                  <h4 className="text-sm font-bold text-[#1f2937]">Ảnh đại diện tài khoản</h4>
                  <p className="text-xs text-[#6b7280]">
                    Tải ảnh từ máy tính (PNG, JPG, WebP tối đa 5MB) hoặc nhấp chọn nhanh mẫu avatar có sẵn bên dưới.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start pt-1">
                  <span className="text-[11px] font-semibold text-[#6b7280]">Chọn mẫu có sẵn:</span>
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === url
                          ? 'border-[#2e7d32] ring-2 ring-emerald-300 scale-105'
                          : 'border-[#e5e7eb] hover:border-[#2e7d32] opacity-75 hover:opacity-100'
                      }`}
                      title={`Mẫu ${idx + 1}`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  <label
                    htmlFor="avatar-file-input"
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-[10px] bg-white border border-[#e5e7eb] text-[#1f2937] hover:bg-[#e8f5e9] hover:text-[#2e7d32] cursor-pointer shadow-2xs ml-1 transition-colors"
                  >
                    <Upload className="w-3 h-3 text-[#2e7d32]" />
                    <span>Tải ảnh từ máy</span>
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
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  placeholder="Văn Quang Duy"
                />
              </div>

              <div>
                <Input
                  label="Email liên kết"
                  required
                  value={initialProfile.email}
                  disabled
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  rightIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  helperText="Email dùng đăng nhập và đặt lại mật khẩu, không thể chỉnh sửa."
                />
              </div>

              <div>
                <Input
                  label="Số điện thoại liên hệ"
                  value={phoneNumber}
                  disabled={isLoading}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                  placeholder="0912 345 678"
                  helperText="Phục vụ liên hệ hỗ trợ hoặc nhận phản hồi từ cộng đồng."
                />
              </div>

              <div>
                <Select
                  label="Khu vực ưu tiên tìm quán chay"
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

        {/* Tab 3: Allergies & Hidden Guard */}
        {activeTab === 'allergies' && (
          <AllergyManager
            allergies={allergies}
            onAllergiesChange={(list) => setAllergies(list)}
            hiddenRules={hiddenRules}
            onHiddenRulesChange={(rules) => setHiddenRules(rules)}
            disabled={isLoading}
          />
        )}

        {/* Tab 4: Body Metrics Calculator */}
        {activeTab === 'metrics' && (
          <BodyMetricsCalculator
            metrics={metrics}
            onChange={(newMetrics) => setMetrics(newMetrics)}
            preferredProteins={initialProfile.preferredProteinSources}
            disabled={isLoading}
          />
        )}

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#e5e7eb]">
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
