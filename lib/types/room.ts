// Room API Types
export interface RoomDto {
    roomId: number
    roomName: string
}

export interface CreateRoomRequest {
    roomName: string
}

export interface UpdateRoomRequest {
    roomName: string
}

export interface PagedResponse<T> {
    data: T[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
}

