"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { notificationService } from "@/lib/services/notification-service"

export interface UINotification {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    timestamp: Date
}

interface NotificationBellProps {
    notificationHref: string
}

export function NotificationBell({ notificationHref }: NotificationBellProps) {
    const router = useRouter()
    const [notifications, setNotifications] = useState<UINotification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState<number>(0)

    const markAllAsRead = async () => {
        const user = getCurrentUser()
        if (!user) return
        try {
            await notificationService.markAllAsRead(Number(user.id))
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error("Không thể đánh dấu tất cả là đã đọc:", err)
        }
    }

    useEffect(() => {
        const user = getCurrentUser()
        if (!user) return

        notificationService
            .getUserNotifications(Number(user.id), 1, 10)
            .then((data) => {
                const mapped = data.map((d): UINotification => ({
                    id: d.notificationId.toString(),
                    title: d.title,
                    message: d.content,
                    type: d.type?.toLowerCase() || "other",
                    read: d.isRead,
                    timestamp: new Date(d.createdDate),
                }))
                setNotifications(mapped)
            })
            .finally(() => setLoading(false))

        notificationService
            .getUnreadCount(user.id)
            .then((count) => setUnreadCount(count))
    }, [])

    const markAsRead = async (id: string) => {
        const user = getCurrentUser()
        if (!user) return

        try {
            await notificationService.markAsRead(user.id, Number(id))

            //  Cập nhật UI 
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (err) {
            console.error("Không thể đánh dấu đã đọc:", err)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "schedule":
                return "bg-blue-100 text-blue-700"
            case "meeting":
                return "bg-purple-100 text-purple-700"
            case "policy":
                return "bg-amber-100 text-amber-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type.toLowerCase()) {
            case "schedule":
                return "Lịch làm việc"
            case "meeting":
                return "Cuộc họp"
            case "policy":
                return "Chính sách"
            default:
                return "Thông báo"
        }
    }

    const recentNotifications = notifications.slice(0, 5)

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-semibold">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="text-base font-semibold">
                    Thông báo
                </DropdownMenuLabel>

                <div className="flex justify-between items-center px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">
                        Tổng số: {notifications.length}
                    </span>

                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Đánh dấu tất cả là đã đọc
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Đang tải thông báo...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Không có thông báo nào
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer",
                                    !n.read && "bg-blue-50 font-semibold"
                                )}
                                onClick={() => markAsRead(n.id)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                                    getTypeColor(n.type)
                                                )}
                                            >
                                                {getTypeLabel(n.type)}
                                            </span>
                                            {!n.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        <p className="font-medium text-sm leading-tight">
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {n.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatTime(n.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />
                <div className="p-2">
                    <Button
                        variant="outline"
                        className="w-full text-xs bg-transparent"
                        onClick={() => {
                            router.push(notificationHref)
                            setIsOpen(false)
                        }}
                    >
                        Xem tất cả thông báo
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function formatTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins}m trước`
    if (diffHours < 24) return `${diffHours}h trước`
    if (diffDays < 7) return `${diffDays}d trước`
    return date.toLocaleDateString("vi-VN")
}
