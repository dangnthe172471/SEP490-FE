import { RoomDto, CreateRoomRequest, UpdateRoomRequest, PagedResponse } from '@/lib/types/room'
import { BaseApiService } from './base-api.service'
import { ApiError } from '@/lib/types/api'

class RoomService extends BaseApiService {
    async getAll(): Promise<RoomDto[]> {
        // Thử endpoint của AdministratorController trước (dành cho admin)
        try {
            return await this.request<RoomDto[]>('/api/administrator/list-rooms')
        } catch (adminError: any) {
            // Nếu lỗi, thử endpoint chính
            try {
                return await this.request<RoomDto[]>('/api/Rooms')
            } catch (mainError: any) {
                // Nếu cả hai đều lỗi, throw error đầu tiên
                throw adminError
            }
        }
    }

    async getPaged(pageNumber = 1, pageSize = 10, searchTerm?: string): Promise<PagedResponse<RoomDto>> {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
        })
        if (searchTerm) params.append('searchTerm', searchTerm)
        const raw = await this.request<any>(`/api/Rooms/paged?${params.toString()}`)

        const items = raw?.items ?? raw?.Items ?? []
        const totalCount = raw?.totalCount ?? raw?.TotalCount ?? 0
        const respPageNumber = raw?.pageNumber ?? raw?.PageNumber ?? pageNumber
        const respPageSize = raw?.pageSize ?? raw?.PageSize ?? pageSize
        const totalPages = raw?.totalPages ?? raw?.TotalPages ?? Math.ceil(totalCount / Math.max(1, respPageSize))

        return {
            data: items as RoomDto[],
            totalCount,
            pageNumber: respPageNumber,
            pageSize: respPageSize,
            totalPages,
            hasPreviousPage: respPageNumber > 1,
            hasNextPage: respPageNumber < totalPages,
        }
    }

    async getById(id: number): Promise<RoomDto> {
        return this.request<RoomDto>(`/api/Rooms/${id}`)
    }

    async create(data: CreateRoomRequest): Promise<number> {
        return this.request<number>('/api/Rooms', { method: 'POST', body: JSON.stringify(data) })
    }

    async update(id: number, data: UpdateRoomRequest): Promise<RoomDto> {
        return this.request<RoomDto>(`/api/Rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }

    async delete(id: number): Promise<void> {
        return this.request<void>(`/api/Rooms/${id}`, { method: 'DELETE' })
    }
}

export const roomService = new RoomService()
