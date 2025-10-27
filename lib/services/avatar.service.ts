import { BaseApiService } from './base-api.service'

export interface ChangeAvatarResponse {
    message: string
    avatarUrl: string
}

export class AvatarService extends BaseApiService {
    /**
     * Upload new avatar
     */
    async changeAvatar(avatarFile: File): Promise<ChangeAvatarResponse> {
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        // Use this.request - BaseApiService will handle FormData correctly
        return this.request<ChangeAvatarResponse>('/api/auth/change-avatar', {
            method: 'POST',
            body: formData,
        })
    }

    /**
     * Get avatar URL with proper formatting
     */
    getAvatarUrl(avatarPath: string | null | undefined): string {
        if (!avatarPath) {
            return '/placeholder-user.jpg'
        }

        // If already a full URL, return as is
        if (avatarPath.startsWith('http')) {
            return avatarPath
        }

        // Convert relative URL to full URL
        return `${this.baseURL}${avatarPath}`
    }

    /**
     * Check if avatar URL is valid
     */
    isValidAvatarUrl(avatarPath: string | null | undefined): boolean {
        return !!(avatarPath && avatarPath !== '/placeholder-user.jpg')
    }
}

export const avatarService = new AvatarService()
