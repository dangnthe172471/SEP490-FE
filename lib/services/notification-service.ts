"use client"

import { toast } from "sonner"
import type {
    ApiResponse,
    CreateNotificationDto,
    NotificationDto,
    UnreadCountDto,
    NotificationUserDto
} from "@/lib/types/notification-type"

export class NotificationService {
    private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn"

    async sendNotification(request: CreateNotificationDto): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/Notification/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                const text = await response.text()
                console.warn(`SendNotification lỗi ${response.status}: ${text}`)
                toast.warning("Không thể gửi thông báo. Vui lòng thử lại.")
                return false
            }

            const data: ApiResponse<any> = await response.json()
            if (!data.success) {
                toast.warning(data.message || "Gửi thông báo thất bại.")
                return false
            }

            toast.success("Gửi thông báo thành công.")
            return true
        } catch (error: any) {
            console.error("SendNotification lỗi:", error)
            toast.error("Không thể kết nối đến máy chủ.")
            return false
        }
    }

    async getUserNotifications(userId: number, pageNumber = 1, pageSize = 10): Promise<NotificationDto[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/Notification/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            )

            if (!response.ok) {
                console.warn(`GetUserNotifications lỗi ${response.status}`)
                toast.warning("Không thể tải danh sách thông báo.")
                return []
            }

            const data = await response.json()
            return data.items || []
        } catch (error) {
            console.error("GetUserNotifications lỗi:", error)
            toast.error("Không thể kết nối đến máy chủ.")
            return []
        }
    }

    async markAsRead(userId: string, notificationId: number): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/Notification/read/${userId}/${notificationId}`, {
                method: "PUT",
            })

            if (!response.ok) {
                console.warn(`MarkAsRead lỗi ${response.status}`)
                toast.warning("Không thể đánh dấu đã đọc.")
                return false
            }

            return true
        } catch (error) {
            console.error("MarkAsRead lỗi:", error)
            toast.error("Không thể kết nối đến máy chủ.")
            return false
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        try {
            const response = await fetch(`${this.baseUrl}/api/Notification/unread-count/${userId}`)

            if (!response.ok) {
                console.warn(`GetUnreadCount lỗi ${response.status}`)
                return 0
            }

            const data = await response.json()
            if (typeof data === "number") return data
            return data.data?.unreadCount || 0
        } catch (error) {
            console.error("GetUnreadCount lỗi:", error)
            return 0
        }
    }

    async markAllAsRead(userId: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/Notification/read-all/${userId}`, {
                method: "PUT",
            })

            if (!response.ok) {
                console.warn(`MarkAllAsRead lỗi ${response.status}`)
                toast.warning("Không thể đánh dấu tất cả là đã đọc.")
            } else {
                toast.success("Tất cả thông báo đã được đánh dấu là đã đọc.")
            }
        } catch (error) {
            console.error("MarkAllAsRead lỗi:", error)
            toast.error("Không thể kết nối đến máy chủ.")
        }
    }

    async getAllNotifications(
        pageNumber = 1,
        pageSize = 10
    ): Promise<{
        items: NotificationDto[]
        totalCount: number
        totalPages: number
        pageNumber: number
        pageSize: number
    }> {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/Notification/list-notification?pageNumber=${pageNumber}&pageSize=${pageSize}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            )

            if (!response.ok) {
                console.warn(`GetAllNotifications lỗi ${response.status}`)
                toast.warning("Không thể tải danh sách thông báo.")
                return { items: [], totalCount: 0, totalPages: 0, pageNumber, pageSize }
            }

            const data = await response.json()
            return data
        } catch (error) {
            console.error("GetAllNotifications lỗi:", error)
            toast.error("Không thể kết nối đến máy chủ.")
            return { items: [], totalCount: 0, totalPages: 0, pageNumber, pageSize }
        }
    }
    async getAllUsers(): Promise<NotificationUserDto[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/Notification/all-user`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            })

            if (!response.ok) {
                console.warn(`GetAllUsers lỗi ${response.status}`)
                toast.warning("Không thể tải danh sách người dùng.")
                return []
            }

            const data = await response.json()

            // chỉ lấy 3 trường cần thiết
            const users: NotificationUserDto[] = data.map((u: any) => ({
                userId: u.userId,
                fullName: u.fullName,
                role: u.role,
            }))

            return users
        } catch (error) {
            console.error("GetAllUsers lỗi:", error)
            toast.error("Không thể kết nối đến máy chủ.")
            return []
        }
    }

}

export const notificationService = new NotificationService()
