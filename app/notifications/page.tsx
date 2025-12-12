"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, Calendar, CheckCircle2, Clock, Trash2, Archive, AlertCircle } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { notificationService } from "@/lib/services/notification-service"
import { NotificationDto } from "@/lib/types/notification-type"

type NotificationType = "all" | "schedule" | "meeting" | "policy" | "other"

interface Notification {
    id: string
    type: NotificationType
    title: string
    description: string
    timestamp: string
    isRead: boolean
    icon: React.ReactNode
    color: string
    bgColor: string
    fullDetails?: string
    actionLabel?: string
    notificationId: number
}

function formatNotificationContent(content: string): { summary: string; details?: string } {
    if (!content) return { summary: "" }

    try {
        const parsed = JSON.parse(content)
        // Trường hợp nội dung là yêu cầu tái khám / lịch hẹn
        if (parsed.AppointmentId || parsed.PatientId || parsed.DoctorId) {
            const preferred = parsed.PreferredDate ? new Date(parsed.PreferredDate).toLocaleString("vi-VN") : "Đang cập nhật"
            const note = parsed.Notes ?? "Không có ghi chú"
            const status = parsed.IsCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"
            const summary = `Yêu cầu tái khám #${parsed.AppointmentId ?? "N/A"} - BN ${parsed.PatientId ?? "?"}, BS ${parsed.DoctorId ?? "?"}, lịch: ${preferred}`
            const details = [
                `Mã lịch hẹn: ${parsed.AppointmentId ?? "N/A"}`,
                `Bệnh nhân: ${parsed.PatientId ?? "?"}`,
                `Bác sĩ: ${parsed.DoctorId ?? "?"}`,
                `Thời gian mong muốn: ${preferred}`,
                `Ghi chú: ${note}`,
                `Trạng thái: ${status}`,
            ].join("\n")
            return { summary, details }
        }

        // Nếu là JSON khác, stringify gọn hơn
        return { summary: Object.entries(parsed).map(([k, v]) => `${k}: ${v ?? ""}`).join(" • ") || content, details: JSON.stringify(parsed, null, 2) }
    } catch {
        // Không phải JSON
        return { summary: content }
    }
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [activeFilter, setActiveFilter] = useState<NotificationType>("all")
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<number | null>(null)
    const [page, setPage] = useState(1)
    const pageSize = 20
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        const user = getCurrentUser()
        if (user?.id) setUserId(Number(user.id))
    }, [])

    useEffect(() => {
        if (!userId) return
        loadNotifications(1)
    }, [userId])

    const loadNotifications = async (nextPage: number) => {
        if (!userId) return
        setLoading(true)
        try {
            const data: NotificationDto[] = await notificationService.getUserNotifications(userId, nextPage, pageSize)

            const mapped: Notification[] = data.map((n) => {
                // Chuẩn hóa type
                let normalizedType: NotificationType
                switch (n.type.toLowerCase()) {
                    case "schedule":
                        normalizedType = "schedule"
                        break
                    case "meeting":
                        normalizedType = "meeting"
                        break
                    case "policy":
                        normalizedType = "policy"
                        break
                    default:
                        normalizedType = "other"
                }

                const { summary, details } = formatNotificationContent(n.content)

                return {
                    id: n.notificationId.toString(),
                    type: normalizedType,
                    title: n.title,
                    description: summary,
                    fullDetails: details || summary,
                    timestamp: new Date(n.createdDate).toLocaleString("vi-VN"),
                    isRead: n.isRead,
                    icon: getIcon(normalizedType),
                    color: getColor(normalizedType),
                    bgColor: getBgColor(normalizedType),
                    actionLabel: undefined,
                    notificationId: n.notificationId,
                }
            })

            if (nextPage === 1) setNotifications(mapped)
            else setNotifications(prev => [...prev, ...mapped])
            setPage(nextPage)
            setHasMore(data.length === pageSize)
        } catch (err) {
            console.error("Lỗi tải thông báo:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredNotifications = activeFilter === "all"
        ? notifications
        : notifications.filter(n => n.type === activeFilter)

    const unreadCount = notifications.filter(n => !n.isRead).length

    const handleMarkAllAsRead = async () => {
        if (!userId) return
        try {
            await notificationService.markAllAsRead(userId)
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (err) {
            console.error(err)
        }
    }

    const handleSelectNotification = async (notification: Notification) => {
        setSelectedNotification(notification)
        if (!notification.isRead && userId) {
            const ok = await notificationService.markAsRead(userId.toString(), notification.notificationId)
            if (ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
                    )
                )
            }
        }
    }

    // Icon / Color / BgColor theo type chuẩn
    function getIcon(type: NotificationType) {
        switch (type) {
            case "schedule": return <Calendar className="h-5 w-5" />
            case "meeting": return <Bell className="h-5 w-5" />
            case "policy": return <CheckCircle2 className="h-5 w-5" />
            default: return <Bell className="h-5 w-5" />
        }
    }
    function getColor(type: NotificationType) {
        switch (type) {
            case "schedule": return "text-primary"
            case "meeting": return "text-blue-500"
            case "policy": return "text-green-500"
            default: return "text-gray-500"
        }
    }
    function getBgColor(type: NotificationType) {
        switch (type) {
            case "schedule": return "bg-primary/10"
            case "meeting": return "bg-blue-100/20"
            case "policy": return "bg-green-100/20"
            default: return "bg-gray-100/20"
        }
    }

    const notificationTypes = [
        { id: "all", label: "Tất cả", icon: Bell },
        { id: "schedule", label: "Lịch làm việc", icon: Calendar },
        { id: "meeting", label: "Hội họp", icon: Bell },
        { id: "policy", label: "Quy định", icon: CheckCircle2 },
        { id: "other", label: "Khác", icon: Bell },
    ]

    const getNotificationTypeLabel = (type: NotificationType) => {
        switch (type) {
            case "schedule": return "Lịch làm việc"
            case "meeting": return "Hội họp"
            case "policy": return "Quy định"
            default: return "Khác"
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
                {/* Header */}
                <section className="border-b bg-gradient-to-br from-primary/5 to-white">
                    <div className="container mx-auto px-4 py-16 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold flex items-center gap-3">
                                <Bell className="h-6 w-6" /> Thông báo
                            </h1>
                            <p className="text-lg text-muted-foreground mt-2">
                                Quản lý tất cả thông báo về lịch làm việc, hội họp, quy định và các thông báo khác
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                                {unreadCount} chưa đọc
                            </div>
                            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                                Đánh dấu tất cả đã đọc
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Filter */}
                <section className="border-b bg-white py-8">
                    <div className="container mx-auto px-4 flex flex-wrap gap-3">
                        {notificationTypes.map(type => {
                            const Icon = type.icon
                            const isActive = activeFilter === type.id
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setActiveFilter(type.id as NotificationType)}
                                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                        : "border border-border bg-white text-foreground hover:border-primary/50 hover:bg-primary/5"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" /> {type.label}
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Notifications List */}
                <section className="bg-white py-12">
                    <div className="container mx-auto px-4 space-y-4">
                        {loading && page === 1 ? (
                            <p className="text-center text-muted-foreground py-6">Đang tải...</p>
                        ) : filteredNotifications.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-16 text-center">
                                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-lg font-medium text-foreground">Không có thông báo</p>
                                    <p className="text-muted-foreground">Không có thông báo nào cho danh mục này</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {filteredNotifications.map(notification => (
                                    <Card
                                        key={notification.id}
                                        className={`border transition-all hover:shadow-md cursor-pointer ${!notification.isRead ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" : "bg-white"
                                            }`}
                                        onClick={() => handleSelectNotification(notification)}
                                    >
                                        <CardContent className="p-6 flex items-start gap-5">
                                            <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${notification.bgColor} ${notification.color}`}>
                                                {notification.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-foreground">{notification.title}</h3>
                                                    {!notification.isRead && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <p className="mt-2 text-muted-foreground">{notification.description}</p>
                                                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" /> {notification.timestamp}
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                                    <Archive className="h-5 w-5" />
                                                </button>
                                                <button className="rounded-lg p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {hasMore && (
                                    <div className="text-center mt-4">
                                        <Button onClick={() => loadNotifications(page + 1)} disabled={loading}>
                                            {loading ? "Đang tải..." : "Tải thêm"}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            {/* Modal chi tiết */}
            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                {selectedNotification && (
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-full ${selectedNotification.bgColor} ${selectedNotification.color}`}>
                                        {selectedNotification.icon}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl">{selectedNotification.title}</DialogTitle>
                                        <p className="text-sm text-muted-foreground mt-1">{selectedNotification.timestamp}</p>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-2">Nội dung</p>
                                <p className="text-foreground leading-relaxed">
                                    {selectedNotification.fullDetails || selectedNotification.description}
                                </p>
                            </div>
                            {selectedNotification.actionLabel && (
                                <Button className="w-full" size="lg">{selectedNotification.actionLabel}</Button>
                            )}
                            <Button variant="outline" className="w-full" size="lg" onClick={() => setSelectedNotification(null)}>Đóng</Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            <Footer />
        </div>
    )
}
