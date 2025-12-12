import { ApiError, ApiResponse } from '@/lib/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7168'

export class BaseApiService {
    protected baseURL: string
    protected token: string | null = null

    constructor() {
        this.baseURL = API_BASE_URL
        // Get token from localStorage on client side
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token')
        }
    }

    protected async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        // Luôn lấy token mới nhất từ localStorage trước mỗi request
        let currentToken: string | null = null
        if (typeof window !== 'undefined') {
            currentToken = localStorage.getItem('auth_token')
            this.token = currentToken // Cập nhật token trong instance
        }

        const url = `${this.baseURL}${endpoint}`

        const config: RequestInit = {
            headers: {
                // Only set Content-Type for non-FormData requests
                ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
                // Luôn dùng token mới nhất từ localStorage
                ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
                ...options.headers,
            },
            ...options,
        }

        try {
            const response = await fetch(url, config)

            // Đọc response body một lần duy nhất
            const text = await response.text()

            if (!response.ok) {
                // Handle 401 Unauthorized - token might be expired
                if (response.status === 401) {
                    this.clearToken()
                }

                let errorMessage = `HTTP ${response.status}`
                if (text) {
                    try {
                        const errorJson = JSON.parse(text)
                        errorMessage = errorJson.message || errorJson.error || errorJson.title || text
                    } catch {
                        errorMessage = text
                    }
                } else {
                    errorMessage = `HTTP ${response.status} - ${response.statusText}`
                }

                throw new ApiError(
                    errorMessage,
                    response.status,
                    response.statusText
                )
            }

            // Handle empty responses
            if (!text) {
                return {} as T
            }

            try {
                return JSON.parse(text)
            } catch (parseError) {
                throw new ApiError(
                    'Invalid JSON response from server',
                    response.status,
                    response.statusText
                )
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error
            }
            throw new ApiError(
                error instanceof Error ? error.message : 'Network error',
                0,
                'Network Error'
            )
        }
    }

    // Token management
    setToken(token: string | null) {
        this.token = token
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('auth_token', token)
            } else {
                localStorage.removeItem('auth_token')
            }
        }
    }

    getToken(): string | null {
        return this.token
    }

    clearToken() {
        this.token = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
        }
    }

    isAuthenticated(): boolean {
        return !!this.token
    }
}
