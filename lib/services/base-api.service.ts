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
        // Refresh token from localStorage before each request
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('auth_token')
            if (storedToken !== this.token) {
                this.token = storedToken
            }
        }

        const url = `${this.baseURL}${endpoint}`

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        }

        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                // Handle 401 Unauthorized - token might be expired
                if (response.status === 401) {
                    this.clearToken()
                    // Không redirect tự động, để component xử lý
                }

                let errorMessage = `HTTP ${response.status}`
                try {
                    const errorText = await response.text()
                    if (errorText) {
                        // Try to parse as JSON first (for structured error responses)
                        try {
                            const errorJson = JSON.parse(errorText)
                            errorMessage = errorJson.message || errorJson.error || errorText
                        } catch {
                            // If not JSON, use as string
                            errorMessage = errorText
                        }
                    }
                } catch {
                    errorMessage = `HTTP ${response.status} - ${response.statusText}`
                }

                throw new ApiError(
                    errorMessage,
                    response.status,
                    response.statusText
                )
            }

            // Handle empty responses
            const text = await response.text()
            if (!text) {
                return {} as T
            }

            return JSON.parse(text)
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
