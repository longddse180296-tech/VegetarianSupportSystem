import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Shield,
  Leaf,
  Activity,
  AlertTriangle,
} from 'lucide-react'
import type { UserProfile, DietaryType, HiddenIngredientRules, BodyMetrics } from '../types'
import { DietarySelector } from './DietarySelector'
import { AllergyManager } from './AllergyManager'
import { BodyMetricsCalculator } from './BodyMetricsCalculator'

interface ProfileSettingsFormProps {
  initialProfile: UserProfile
  onSave: (updates: Partial<UserProfile>) => Promise<void>
  onBackToOverview?: () => void
  onNavigate?: (path: string) => void
  isLoading?: boolean
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  initialProfile,
  onSave,
  onBackToOverview,
  onNavigate,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'diet' | 'allergies' | 'metrics'>('info')
  const [fullName, setFullName] = useState(initialProfile.fullName)
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

  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFieldChange = () => {
    setHasChanges(true)
    setSaveSuccess(false)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    try {
      await onSave({
        fullName,
        phoneNumber,
        preferredRegion,
        dietaryType,
        allergies,
        hiddenIngredientRules: hiddenRules,
        metrics,
      })
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Cập nhật thất bại. Vui lòng thử lại.')
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          className="hover:text-emerald-700 transition-colors"
        >
          Trang chủ
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <button
          type="button"
          onClick={onBackToOverview}
          className="hover:text-emerald-700 transition-colors"
        >
          Tài khoản của tôi
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Cài đặt tài khoản &amp; Hồ sơ ăn chay</span>
      </nav>

      {/* Main Title Banner */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Leaf className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tài khoản của tôi &amp; Hồ sơ ăn chay
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Trung tâm quản lý chế độ ăn chay, quy cách an toàn dinh dưỡng và thiết lập thể trạng đồng
          bộ cho toàn bộ hệ thống Vegetarian Support.
        </p>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>✓ Hồ sơ ăn chay và chỉ số cơ thể đã được cập nhật thành công!</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two-column Layout: Left Tabs Sidebar & Right Form Sections */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sub-Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
          {/* Mini User Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-lg flex items-center justify-center border-2 border-emerald-300">
                {fullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-slate-900 truncate">{fullName}</h3>
                <p className="text-xs text-slate-500 truncate">{initialProfile.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Hồ sơ: {dietaryType}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Tham gia từ 11/2024</span>
              <span className="text-emerald-700 font-semibold">Đã xác minh</span>
            </div>
          </div>

          {/* Quick Section Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'info'
                  ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Thông tin tài khoản</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diet')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'diet'
                  ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>Chế độ ăn chay</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {dietaryType}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('allergies')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'allergies'
                  ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Bộ lọc Dị ứng</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                {allergies.length} món
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metrics')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeTab === 'metrics'
                  ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Chỉ số cơ thể &amp; BMI</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                BMI {metrics.bmi}
              </span>
            </button>
          </div>
        </div>

        {/* Right Form Body */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {/* Section 1: Thông tin tài khoản & Liên hệ */}
          {(activeTab === 'info' || activeTab === 'diet') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Thông tin Tài khoản &amp; Liên hệ
                  </h3>
                </div>
                <span className="text-xs text-slate-400">ID: {initialProfile.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pf-name" className="text-xs font-semibold text-slate-700">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      id="pf-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        handleFieldChange()
                      }}
                      disabled={isLoading}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Email (Readonly with Lock) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="pf-email" className="text-xs font-semibold text-slate-700">
                      Email liên kết <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Đã xác thực
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      id="pf-email"
                      type="email"
                      value={initialProfile.email}
                      disabled
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>

                {/* Phone number */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pf-phone" className="text-xs font-semibold text-slate-700">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      id="pf-phone"
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value)
                        handleFieldChange()
                      }}
                      disabled={isLoading}
                      placeholder="0912 345 678"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Preferred Region */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pf-region" className="text-xs font-semibold text-slate-700">
                    Khu vực ưu tiên tìm nhà hàng
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <select
                      id="pf-region"
                      value={preferredRegion}
                      onChange={(e) => {
                        setPreferredRegion(e.target.value)
                        handleFieldChange()
                      }}
                      disabled={isLoading}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Hà Nội (Khu vực trung tâm / Ba Đình)">
                        Hà Nội (Khu vực trung tâm / Ba Đình)
                      </option>
                      <option value="Hà Nội (Cầu Giấy / Tây Hồ)">Hà Nội (Cầu Giấy / Tây Hồ)</option>
                      <option value="TP. Hồ Chí Minh (Quận 1 / Quận 3)">
                        TP. Hồ Chí Minh (Quận 1 / Quận 3)
                      </option>
                      <option value="TP. Hồ Chí Minh (Bình Thạnh / Phú Nhuận)">
                        TP. Hồ Chí Minh (Bình Thạnh / Phú Nhuận)
                      </option>
                      <option value="Đà Nẵng (Hải Châu / Sơn Trà)">
                        Đà Nẵng (Hải Châu / Sơn Trà)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Chế độ Ăn chay Trung tâm */}
          {(activeTab === 'diet' || activeTab === 'info') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
              <DietarySelector
                selectedDiet={dietaryType}
                onChange={(diet) => {
                  setDietaryType(diet)
                  handleFieldChange()
                }}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Section 3: Bộ lọc An toàn & Cảnh báo Dị ứng */}
          {(activeTab === 'allergies' || activeTab === 'diet') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
              <AllergyManager
                allergies={allergies}
                onAllergiesChange={(list) => {
                  setAllergies(list)
                  handleFieldChange()
                }}
                hiddenRules={hiddenRules}
                onHiddenRulesChange={(rules) => {
                  setHiddenRules(rules)
                  handleFieldChange()
                }}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Section 4: Đồng bộ Chỉ số Thể trạng & Dinh dưỡng Cá nhân */}
          {(activeTab === 'metrics' || activeTab === 'diet') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
              <BodyMetricsCalculator
                metrics={metrics}
                onChange={(newMetrics) => {
                  setMetrics(newMetrics)
                  handleFieldChange()
                }}
                preferredProteins={initialProfile.preferredProteinSources}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Save Changes Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
            />
            <span>
              {hasChanges
                ? 'Bạn có thay đổi chưa lưu trên hồ sơ.'
                : 'Hồ sơ đã được lưu trữ và đồng bộ với hệ thống.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Về trang tổng quan
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading || !hasChanges}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs font-bold shadow transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi &amp; Cập nhật Hồ sơ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProfileSettingsForm
