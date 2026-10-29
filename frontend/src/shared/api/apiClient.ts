// Chức năng: giao diện và thành phần dùng chung. Giao tiếp máy chủ và chuyển dữ liệu về kiểu dùng trong tính năng.
/**
 * Gửi yêu cầu HTTP dùng chung; quản lý phiên đăng nhập và chuẩn hóa lỗi để giao diện hướng dẫn người dùng.
 */

export const AUTH_TOKEN_KEY = 'vegetarian_auth_token'
export const AUTH_USER_KEY = 'vegetarian_auth_user'
export const SESSION_NOTICE_KEY = 'vegetarian_session_notice'
export const SIGNED_OUT_KEY = 'vegetarian_signed_out'
let authRevision = 0
let refreshRequest: Promise<string> | null = null

export class ApiError extends Error {
  status: number
  title?: string
  errors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    title?: string,
    errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.errors = errors
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getStoredToken); thuộc giao diện và thành phần dùng chung.
export const getStoredToken = (): string | null => {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (setStoredToken); thuộc giao diện và thành phần dùng chung.
export const setStoredToken = (token: string, rememberMe = true): void => {
  try {
    clearStoredAuth()
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(AUTH_TOKEN_KEY, token)
    sessionStorage.removeItem(SESSION_NOTICE_KEY)
    localStorage.removeItem(SIGNED_OUT_KEY)
  } catch {
    // Trình duyệt chặn lưu trữ hoặc hết dung lượng; không làm gián đoạn thao tác hiện tại.
  }
}

// Xóa mục được chọn theo phạm vi và điều kiện của tính năng (removeStoredToken); thuộc giao diện và thành phần dùng chung.
export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Ignore
  }
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (getStoredUser); thuộc giao diện và thành phần dùng chung.
export const getStoredUser = <T = unknown>(): T | null => {
  try {
    const storage = sessionStorage.getItem(AUTH_TOKEN_KEY) ? sessionStorage : localStorage
    const raw = storage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (setStoredUser); thuộc giao diện và thành phần dùng chung.
export const setStoredUser = (user: unknown): void => {
  try {
    const serialized = JSON.stringify(user)
    const storage = sessionStorage.getItem(AUTH_TOKEN_KEY) ? sessionStorage : localStorage
    storage.setItem(AUTH_USER_KEY, serialized)
    storage.setItem('auth_user', serialized)
  } catch {
    // Ignore
  }
}

// Khôi phục hoặc kết thúc trạng thái thao tác hiện tại (clearStoredAuth); thuộc giao diện và thành phần dùng chung.
export const clearStoredAuth = (): void => {
  authRevision++
  try {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(AUTH_TOKEN_KEY)
      storage.removeItem(AUTH_USER_KEY)
      storage.removeItem('auth_user')
    }
  } catch {
    // Ignore
  }
}

// Cấu trúc RequestOptions quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
  retryAuth?: boolean
}

// Các request cùng hết hạn chỉ gia hạn một lần; cookie HttpOnly được trình duyệt tự gửi.
export const refreshAccessToken = (): Promise<string> => {
  if (refreshRequest) return refreshRequest
  const revision = authRevision
  refreshRequest = (async () => {
    let response: Response
    try {
      response = await fetch(resolveApiUrl('/api/auth/refresh'), {
        method: 'POST', credentials: 'include', headers: { 'X-Session-Refresh': '1', Accept: 'application/json' },
      })
    } catch {
      throw new ApiError('Chưa kết nối được dịch vụ để gia hạn phiên. Vui lòng thử lại.', 0)
    }
    if (revision !== authRevision) {
      const current = getStoredToken()
      if (current) return current
      throw new ApiError('Phiên đăng nhập đã kết thúc.', 401)
    }
    if (!response.ok) throw new ApiError(response.status === 401
      ? 'Phiên đăng nhập đã kết thúc hoặc tài khoản đã đăng nhập trên trình duyệt khác. Vui lòng đăng nhập lại.'
      : 'Chưa thể gia hạn phiên lúc này. Vui lòng thử lại sau.', response.status)
    const data = await response.json()
    // Không cho phản hồi đến muộn khôi phục phiên đã đăng xuất hoặc ghi đè lần đăng nhập mới.
    if (revision !== authRevision) {
      const current = getStoredToken()
      if (current) return current
      throw new ApiError('Phiên đăng nhập đã kết thúc.', 401)
    }
    if (!data.accessToken || !data.user) throw new ApiError('Phản hồi gia hạn phiên chưa hợp lệ.', 502)
    const storage = localStorage.getItem(AUTH_TOKEN_KEY) ? localStorage : sessionStorage
    storage.setItem(AUTH_TOKEN_KEY, data.accessToken)
    setStoredUser(data.user)
    return data.accessToken as string
  })().finally(() => { refreshRequest = null })
  return refreshRequest
}

// Cấu trúc ProblemDetailsResponse quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
interface ProblemDetailsResponse {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

// Cấu trúc ApiClient quy định dữ liệu trao đổi trong giao diện và thành phần dùng chung.
export interface ApiClient {
  request<T>(endpoint: string, options?: RequestOptions): Promise<T>
  get<T>(endpoint: string, options?: RequestOptions): Promise<T>
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T>
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T>
}

// Đọc dữ liệu cần thiết và trả kết quả cho bước xử lý tiếp theo (resolveApiUrl); thuộc giao diện và thành phần dùng chung.
export const resolveApiUrl = (endpoint: string): string => {
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || ''
  if (!apiBase || endpoint.startsWith('http')) return endpoint
  return `${apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
}

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (request); thuộc giao diện và thành phần dùng chung.
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, retryAuth = true, headers: customHeaders, ...restOptions } = options

  const headers = new Headers(customHeaders)
  if (!headers.has('Content-Type') && !(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (requiresAuth && !headers.has('Authorization')) {
    const token = getStoredToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const url = resolveApiUrl(endpoint)
  let response: Response
  try {
    response = await fetch(url, {
      ...restOptions,
      credentials: restOptions.credentials ?? 'include',
      headers,
    })
  } catch (error) {
    // Rời trang hoặc đổi bộ lọc sẽ hủy yêu cầu cũ; giữ nguyên tín hiệu hủy để tránh báo mất mạng giả.
    if (restOptions.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error
    throw new ApiError(
      'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.',
      0
    )
  }

  if (response.status === 401 && requiresAuth && retryAuth && headers.has('Authorization') && !endpoint.endsWith('/auth/logout')) {
    const stored = getStoredToken()
    if (stored && headers.get('Authorization') !== `Bearer ${stored}`) {
      headers.set('Authorization', `Bearer ${stored}`)
      return request<T>(endpoint, { ...restOptions, headers, requiresAuth, retryAuth: false })
    }
    const failure = await response.clone().json().catch(() => ({}))
    if (failure.code !== 'SESSION_REPLACED') {
      try {
        // Nếu tab khác vừa gia hạn thì dùng token mới có sẵn, không gửi lại token cũ.
        const current = getStoredToken()
        const token = current && headers.get('Authorization') !== `Bearer ${current}` ? current : await refreshAccessToken()
        headers.set('Authorization', `Bearer ${token}`)
        return request<T>(endpoint, { ...restOptions, headers, requiresAuth, retryAuth: false })
      } catch (error) {
        // Mất mạng/503 không phải phiên hết hạn; giữ phiên để người dùng có thể thử lại.
        if (!(error instanceof ApiError) || error.status !== 401) throw error
      }
    }
  }

  if (!response.ok) {
    let problem: ProblemDetailsResponse | null = null
    try {
      const text = await response.text()
      if (text) {
        problem = JSON.parse(text) as ProblemDetailsResponse
      }
    } catch {
      // Phản hồi lỗi không phải JSON; dùng thông báo theo mã HTTP bên dưới.
    }

    const status = response.status
    let message = problem?.detail || problem?.title || ''
    const genericTitles = ['One or more validation errors occurred.', 'Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Conflict', 'Internal Server Error', 'Too Many Requests', 'An error occurred while processing your request.']
    if (genericTitles.includes(message)) message = ''

    if (status === 401 && requiresAuth && headers.has('Authorization')) {
      const notice = problem?.title && !genericTitles.includes(problem.title) ? problem.title
        : 'Phiên đăng nhập đã kết thúc hoặc tài khoản đã đăng nhập trên trình duyệt khác. Vui lòng đăng nhập lại.'
      clearStoredAuth()
      try { sessionStorage.setItem(SESSION_NOTICE_KEY, notice) } catch { /* Không chặn luồng khi bộ nhớ bị khóa. */ }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('vegetarian_session_expired'))
      // Router của ứng dụng dùng hash: giữ đường dẫn đang xem để trở lại sau khi đăng nhập.
      if (typeof window !== 'undefined') {
        const currentPath = window.location.hash.replace(/^#/, '') || window.location.pathname + window.location.search
        if (!/^\/(?:auth\/)?login(?:\?|$)/.test(currentPath)) {
          window.location.hash = `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`
        }
      }
    }

    if (!message) {
      if (status === 400) {
        message = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
      } else if (status === 401) {
        message = 'Email hoặc mật khẩu không đúng, hoặc phiên đăng nhập đã hết hạn.'
      } else if (status === 403) {
        message = 'Bạn không có quyền thực hiện hành động này.'
      } else if (status === 404) {
        message = 'Không tìm thấy tài nguyên yêu cầu.'
      } else if (status === 409) {
        message = 'Dữ liệu đã thay đổi hoặc thao tác này chưa phù hợp với trạng thái hiện tại. Vui lòng tải lại và kiểm tra.'
      } else if (status === 413) {
        message = 'Tệp vượt quá dung lượng cho phép. Vui lòng chọn tệp nhỏ hơn.'
      } else if (status === 415) {
        message = 'Định dạng tệp chưa được hỗ trợ. Vui lòng chọn đúng loại tệp được hướng dẫn.'
      } else if (status === 429) {
        message = 'Bạn thao tác hơi nhanh. Vui lòng chờ một chút rồi thử lại.'
      } else if (status === 504 || status === 408) {
        message = 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.'
      } else if (status >= 500) {
        message = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
      } else {
        message = `Đã xảy ra lỗi (${status}).`
      }
    } else if (status === 504 || status === 408) {
      message = 'Mất kết nối hoặc máy chủ phản hồi quá lâu, vui lòng thử lại.'
    }

    // If backend returned field errors dictionary, include first error in message if generic
    if (problem?.errors && Object.keys(problem.errors).length > 0) {
      const firstKey = Object.keys(problem.errors)[0]
      const firstErrorMsg = problem.errors[firstKey]?.[0]
      if (firstErrorMsg && (!problem.title || problem.title === 'One or more validation errors occurred.')) {
        message = firstErrorMsg
      }
    }

    // Chuyển thông báo mặc định của bộ kiểm tra dữ liệu sang hướng dẫn tiếng Việt.
    const fieldNames: Record<string, string> = { Name: 'tên', Title: 'tiêu đề', Content: 'nội dung', Description: 'mô tả', Address: 'địa chỉ', Email: 'email', Password: 'mật khẩu', FullName: 'họ tên', Quantity: 'số lượng', Unit: 'đơn vị', DefaultUnit: 'đơn vị nguyên liệu', Servings: 'khẩu phần', CategoryId: 'danh mục', ImageUrl: 'ảnh đại diện', WeekStartDate: 'ngày bắt đầu', PrepTimeMinutes: 'thời gian chuẩn bị', CookTimeMinutes: 'thời gian nấu', Calories: 'năng lượng', ProteinGram: 'chất đạm', CarbohydrateGram: 'tinh bột', FatGram: 'chất béo', Latitude: 'vĩ độ', Longitude: 'kinh độ', Search: 'từ khóa', Reason: 'lý do', Note: 'ghi chú', TextContent: 'nội dung', Body: 'nội dung bình luận' }
    const required = message.match(/^The (\w+) field is required\.$/)
    if (required) message = `Vui lòng nhập ${fieldNames[required[1]] || 'thông tin bắt buộc'}.`
    const range = message.match(/^The field (\w+) must be between ([\d.-]+) and ([\d.-]+)\.$/)
    if (range) message = `Vui lòng nhập ${fieldNames[range[1]] || 'giá trị'} trong khoảng ${range[2]} đến ${range[3]}.`
    const maxLength = message.match(/^The field (\w+) must be a string (?:or array type )?with a maximum length of (\d+)\.$/)
    if (maxLength) message = `Vui lòng nhập ${fieldNames[maxLength[1]] || 'nội dung'} tối đa ${maxLength[2]} ký tự.`
    const stringLength = message.match(/^The field (\w+) must be a string with a minimum length of (\d+) and a maximum length of (\d+)\.$/)
    if (stringLength) message = `Vui lòng nhập ${fieldNames[stringLength[1]] || 'nội dung'} từ ${stringLength[2]} đến ${stringLength[3]} ký tự.`
    const invalidEnum = message.match(/^The field (\w+) is invalid\.$/)
    if (invalidEnum) message = `Lựa chọn ${fieldNames[invalidEnum[1]] || 'trên biểu mẫu'} chưa hợp lệ. Vui lòng chọn lại.`
    if (/^The (?:\w+) field is not a valid (?:e-mail address|email address)\.$/.test(message)) message = 'Địa chỉ email chưa hợp lệ. Vui lòng kiểm tra lại.'
    if (/^The field (?:\w+) must (?:be a string or array type with a minimum length|be a string or array type with a maximum length|be between)/.test(message)) message = 'Số lượng mục hoặc giá trị đã nhập vượt giới hạn cho phép. Vui lòng kiểm tra lại biểu mẫu.'
    if (/^(The JSON value could not be converted|The value .* is (?:not valid|invalid)|A non-empty request body is required)/.test(message))
      message = 'Một số thông tin chưa đúng định dạng. Vui lòng kiểm tra lại các trường đã nhập.'
    message = message.replace(/\s*\(Parameter '[^']+'\)\s*$/, '')

    // Lỗi hệ thống không đưa chi tiết kỹ thuật/ngoại lệ của máy chủ lên màn hình người dùng.
    if (status >= 500 && status !== 504) message = 'Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau ít phút.'
    throw new ApiError(message, status, problem?.title, problem?.errors)
  }

  // Yêu cầu thành công không có nội dung trả về, thường là thao tác xóa.
  if (response.status === 204) {
    return undefined as T
  }

  // Đọc dữ liệu JSON trước khi trả kết quả cho màn hình.
  try {
    const text = await response.text()
    return text ? (JSON.parse(text) as T) : (undefined as T)
  } catch {
    throw new ApiError('Dữ liệu trả về chưa hợp lệ. Vui lòng tải lại hoặc thử lại sau.', response.status)
  }
}

export const apiClient: ApiClient = {
  request,

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { credentials: 'omit', ...options, method: 'GET' })
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  },
}
