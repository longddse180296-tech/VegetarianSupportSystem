/**
 * Global HTTP client with token handling, standard headers, and unified error mapping.
 */

export const AUTH_TOKEN_KEY = 'vegetarian_auth_token'
export const AUTH_USER_KEY = 'vegetarian_auth_user'

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

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // Ignore storage quota or access errors
  }
}

export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // Ignore
  }
}

export const getStoredUser = <T = unknown>(): T | null => {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const setStoredUser = (user: unknown): void => {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } catch {
    // Ignore
  }
}

export const clearStoredAuth = (): void => {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  } catch {
    // Ignore
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

interface ProblemDetailsResponse {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = true, headers: customHeaders, ...restOptions } = options

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

    let response: Response
    try {
      response = await fetch(endpoint, {
        ...restOptions,
        headers,
      })
    } catch {
      throw new ApiError(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        0
      )
    }

    if (!response.ok) {
      let problem: ProblemDetailsResponse | null = null
      try {
        const text = await response.text()
        if (text) {
          problem = JSON.parse(text) as ProblemDetailsResponse
        }
      } catch {
        // Response wasn't valid JSON
      }

      const status = response.status
      let message = problem?.title || problem?.detail || ''

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
          message = 'Dữ liệu đã tồn tại trên hệ thống.'
        } else if (status >= 500) {
          message = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
        } else {
          message = `Đã xảy ra lỗi (${status}).`
        }
      }

      // If backend returned field errors dictionary, include first error in message if generic
      if (problem?.errors && Object.keys(problem.errors).length > 0) {
        const firstKey = Object.keys(problem.errors)[0]
        const firstErrorMsg = problem.errors[firstKey]?.[0]
        if (firstErrorMsg && (!problem.title || problem.title === 'One or more validation errors occurred.')) {
          message = firstErrorMsg
        }
      }

      throw new ApiError(message, status, problem?.title, problem?.errors)
    }

    // 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    // Parse JSON
    try {
      const text = await response.text()
      return text ? (JSON.parse(text) as T) : (undefined as T)
    } catch {
      return undefined as T
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { credentials: 'omit', ...options, method: 'GET' })
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  },
}
