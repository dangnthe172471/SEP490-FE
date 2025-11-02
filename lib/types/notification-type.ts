
export interface ApiResponse<T> {
    success: boolean
    message?: string
    data?: T
}


export interface CreateNotificationDto {
    title: string
    content: string
    type: string
    createdBy?: number | null
    isGlobal?: boolean
    roleNames?: string[]
    receiverIds?: number[]
}
