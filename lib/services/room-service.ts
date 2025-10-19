import { RoomDto, CreateRoomRequest, UpdateRoomRequest, PagedResponse } from '@/lib/types/room'

const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7168'
const API_BASE_URL = `${API_ORIGIN}/api/Rooms`

class RoomService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        const defaultHeaders = {
            'Content-Type': 'application/json',
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        }

        const response = await fetch(url, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        if (response.status === 204) {
            return {} as T
        }

        return response.json()
    }

    async getAll(): Promise<RoomDto[]> {
        return this.request<RoomDto[]>('')
    }

    async getPaged(pageNumber = 1, pageSize = 10, searchTerm?: string): Promise<PagedResponse<RoomDto>> {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
        })
        if (searchTerm) params.append('searchTerm', searchTerm)
        const raw = await this.request<any>(`/paged?${params.toString()}`)

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
        return this.request<RoomDto>(`/${id}`)
    }

    async create(data: CreateRoomRequest): Promise<number> {
        return this.request<number>('', { method: 'POST', body: JSON.stringify(data) })
    }

    async update(id: number, data: UpdateRoomRequest): Promise<RoomDto> {
        return this.request<RoomDto>(`/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }

    async delete(id: number): Promise<void> {
        return this.request<void>(`/${id}`, { method: 'DELETE' })
    }
}

export const roomService = new RoomService()


