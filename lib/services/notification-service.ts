import type { ApiResponse, CreateNotificationDto } from "@/lib/types/notification-type"

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
}

export const notificationService = new NotificationService()
