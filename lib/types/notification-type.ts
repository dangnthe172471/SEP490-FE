
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

export interface NotificationDto {
    notificationId: number
    title: string
    content: string
    type: string
    createdDate: string
    isRead: boolean
}



export interface UnreadCountDto {
    userId: string
    unreadCount: number
}
export interface NotificationUserDto {
    userId: number
    fullName: string
    role: string
}
