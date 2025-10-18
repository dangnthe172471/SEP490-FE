const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL


export interface LoginRequest {
    phone: string
    password: string
}

export interface LoginResponse {
    token: string
    user: {
        userId: number
        phone?: string
        fullName?: string
        email?: string
        role?: string
        gender?: string
        dob?: string
    }
}

export interface RegisterRequest {
    phone: string
    password: string
    fullName: string
    email?: string
    dob?: string
    gender?: string
    roleId: number
}

export interface RegisterResponse {
    userId: number
}

export interface UserDto {
    userId: number
    phone?: string
    fullName?: string
    email?: string
    role?: string
    gender?: string
    dob?: string
    allergies?: string
    medicalHistory?: string
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public statusText: string
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

class ApiService {
    private baseURL: string
    private token: string | null = null

    constructor() {
        this.baseURL = API_BASE_URL!
        // Get token from localStorage on client side
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token')
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
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
                const errorText = await response.text()
                throw new ApiError(
                    errorText || `HTTP ${response.status}`,
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

    // Authentication methods
    async authenticateUser(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        })

        // Store token
        this.setToken(response.token)

        return response
    }

    async createUser(userData: RegisterRequest): Promise<RegisterResponse> {
        return this.request<RegisterResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
    }

    // User management methods
    async fetchAllUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/users')
    }

    async fetchSecureUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/users/test-secure')
    }

    async fetchAdminUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/users/admin-only')
    }

    async fetchUserProfile(): Promise<UserDto> {
        return this.request<UserDto>('/api/auth/profile')
    }



    async updateBasicInfo(data: {
        fullName: string
        email: string
        phone: string
        dob: string
        gender: string
    }): Promise<{ message: string, user: UserDto }> {
        return this.request<{ message: string, user: UserDto }>('/api/profile/basic-info', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    async updateMedicalInfo(data: {
        allergies: string
        medicalHistory: string
    }): Promise<{ message: string, user: UserDto }> {
        return this.request<{ message: string, user: UserDto }>('/api/profile/medical-info', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
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

// Export singleton instance
export const apiService = new ApiService()
