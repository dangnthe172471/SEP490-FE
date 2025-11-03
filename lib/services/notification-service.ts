import type { ApiResponse, CreateNotificationDto, NotificationDto, UnreadCountDto } from "@/lib/types/notification-type"

export class NotificationService {
    private readonly baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168"

    async sendNotification(request: CreateNotificationDto): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/Notification/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(text || `Request failed with status ${response.status}`)
            }

            const data: ApiResponse<any> = await response.json()

            if (!data.success) {
                const errorMessage = data.message || "Gửi thông báo thất bại"
                throw new Error(errorMessage)
            }

            return true
        } catch (error: any) {
            throw new Error(error.message || "Không thể gửi thông báo")
        }
    }
    async getUserNotifications(userId: number, pageNumber = 1, pageSize = 10): Promise<NotificationDto[]> {
        const response = await fetch(
            `${this.baseUrl}/api/Notification/user/${userId}?pageNumber=${pageNumber}&pageSize=${pageSize}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        )

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()

        //  Sửa tại đây — vì BE trả về { items: [...] }
        const notifications = data.items || []

        // console.log(" Nhận thông báo từ API:", notifications)
        return notifications
    }



        /**
         Đánh dấu một thông báo là đã đọc
        */
        async markAsRead(userId: string, notificationId: number): Promise<boolean> {
            const response = await fetch(`${this.baseUrl}/api/Notification/read/${userId}/${notificationId}`, {
                method: "PUT",
            })
            if (!response.ok) throw new Error(`Không thể đánh dấu đã đọc (status: ${response.status})`)
            return true
        }

    /**
    Lấy số lượng thông báo chưa đọc
     */
    async getUnreadCount(userId: string): Promise<number> {
        const response = await fetch(`${this.baseUrl}/api/Notification/unread-count/${userId}`)
        if (!response.ok) throw new Error(`Không thể lấy số lượng chưa đọc (status: ${response.status})`)

        const data = await response.json()
        if (typeof data === "number") return data
        return data.data?.unreadCount || 0
    }

    //  đánh dấu tất cả là đã đọc
    async markAllAsRead(userId: number): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/Notification/read-all/${userId}`, {
            method: "PUT",
        })
        if (!response.ok) throw new Error("Không thể đánh dấu tất cả là đã đọc")
    }


}

export const notificationService = new NotificationService()
