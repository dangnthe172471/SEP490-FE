import { BaseApiService } from './base-api.service'
import {
    CreateUserRequest,
    UpdateUserRequest,
    UserDto
} from '@/lib/types/api'

export class UserService extends BaseApiService {
    async getAllUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/users')
    }

    async getSecureUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/users/test-secure')
    }

    async getAdminUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/users/admin-only')
    }

    async getUserById(userId: number): Promise<UserDto> {
        return this.request<UserDto>(`/api/users/${userId}`)
    }

    async createUser(userData: CreateUserRequest): Promise<UserDto> {
        return this.request<UserDto>('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        })
    }

    async updateUser(userId: number, userData: UpdateUserRequest): Promise<UserDto> {
        return this.request<UserDto>(`/api/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        })
    }

    async deleteUser(userId: number): Promise<void> {
        return this.request<void>(`/api/users/${userId}`, {
            method: 'DELETE'
        })
    }

    async toggleUserStatus(userId: number): Promise<UserDto> {
        return this.request<UserDto>(`/api/users/${userId}/toggle-status`, {
            method: 'PATCH',
        })
    }
}

export const userService = new UserService()
