import { BaseApiService } from './base-api.service'
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    UserDto
} from '@/lib/types/api'

export class AuthService extends BaseApiService {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        })

        // Store token
        this.setToken(response.token)

        return response
    }

    async register(userData: RegisterRequest): Promise<RegisterResponse> {
        return this.request<RegisterResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
    }

    async getProfile(): Promise<UserDto> {
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

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await this.request('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        })
    }

    async changeAvatar(avatarFile: File): Promise<{ avatarUrl: string }> {
        // Delegate to avatar service
        const { avatarService } = await import('./avatar.service')
        return avatarService.changeAvatar(avatarFile)
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        return this.request<{ message: string }>('/api/Auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        })
    }

    async verifyEmailOtp(email: string, otpCode: string): Promise<{ message: string; resetToken?: string }> {
        return this.request<{ message: string; resetToken?: string }>('/api/auth/verify-email-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otpCode }),
        })
    }

    async verifyEmail(email: string, otpCode: string): Promise<{ message: string }> {
        return this.request<{ message: string }>('/api/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ email, otpCode }),
        })
    }

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        return this.request<{ message: string }>('/api/auth/resend-verification-email', {
            method: 'POST',
            body: JSON.stringify({ email }),
        })
    }

    async resetPassword(email: string, token: string, newPassword: string): Promise<{ message: string }> {
        return this.request<{ message: string }>('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, token, newPassword }),
        })
    }
}

export const authService = new AuthService()
