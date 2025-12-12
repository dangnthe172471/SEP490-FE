import { BaseApiService } from './base-api.service'
import type { RoleDto } from '@/lib/types/role'

class RoleService extends BaseApiService {
    async getAll(): Promise<RoleDto[]> {
        return this.request<RoleDto[]>('/api/roles')
    }
}

export const roleService = new RoleService()

