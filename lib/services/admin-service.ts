import { BaseApiService } from './base-api.service'
import {
    CreateUserRequest,
    UpdateUserRequest,
    UserDto,
    ApiResponse
} from '@/lib/types/api'

export class AdminService extends BaseApiService {
    // Admin create user with full control
    async createUserAdmin(userData: CreateUserRequest): Promise<UserDto> {
        return this.request<UserDto>('/api/administrator', {
            method: 'POST',
            body: JSON.stringify(userData)
        })
    }

    // User management methods
    async fetchAllUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/administrator')
    }

    async fetchAllPatients(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/administrator/patients')
    }

    async fetchSecureUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/administrator/test-secure')
    }

    async fetchAdminUsers(): Promise<UserDto[]> {
        return this.request<UserDto[]>('/api/administrator/admin-only')
    }

    // Get user by ID
    async fetchUserById(userId: number): Promise<UserDto> {
        return this.request<UserDto>(`/api/administrator/${userId}`)
    }

    // Update user
    async updateUser(userId: number, userData: UpdateUserRequest): Promise<UserDto> {
        return this.request<UserDto>(`/api/administrator/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        })
    }

    // Delete user
    async deleteUser(userId: number): Promise<void> {
        return this.request<void>(`/api/administrator/${userId}`, {
            method: 'DELETE'
        })
    }

    // Toggle user status (Lock/Unlock)
    async toggleUserStatus(userId: number): Promise<UserDto> {
        return this.request<UserDto>(`/api/administrator/${userId}/toggle-status`, {
            method: 'PATCH',
        })
    }
}

export const adminService = new AdminService()