// Similar to nurse notifications
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RoleGuard } from "@/components/role-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Trash2, Bell, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { BarChart3, CalendarIcon, Package, Pill, FileText } from "lucide-react"

interface Notification {
    id: string
    title: string
    message: string
    type: "schedule" | "meeting" | "policy" | "other"
    read: boolean
    timestamp: Date
    details?: string
}

export default function PharmacyNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                id: "1",
                title: "Đơn thuốc mới",
                message: "Có 5 đơn thuốc mới cần được chuẩn bị",
                type: "other",
                read: false,
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
            },
            {
                id: "2",
                title: "Lịch kho",
                message: "Cần kiểm kê kho thuốc hôm nay",
                type: "schedule",
                read: false,
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
            },
            {
                id: "3",
                title: "Cập nhật",
                message: "Danh sách thuốc hết hạn đã được cập nhật",
                type: "policy",
                read: true,
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
            },
        ]
        setNotifications(mockNotifications)
        setFilteredNotifications(mockNotifications)
    }, [])

    useEffect(() => {
        let filtered = notifications

        if (searchQuery) {
            filtered = filtered.filter(
                (n) =>
                    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    n.message.toLowerCase().includes(searchQuery.toLowerCase()),
            )
        }

        if (filterType !== "all") {
            filtered = filtered.filter((n) => n.type === filterType)
        }

        setFilteredNotifications(filtered)
    }, [searchQuery, filterType, notifications])

    const markAsRead = (id: string) => {
        setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
        if (selectedNotification?.id === id) {
            setSelectedNotification({ ...selectedNotification, read: true })
        }
    }

    const deleteNotification = (id: string) => {
        setNotifications(notifications.filter((n) => n.id !== id))
        if (selectedNotification?.id === id) {
            setSelectedNotification(null)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "schedule":
                return "bg-green-100 text-green-700 border-green-300"
            case "meeting":
                return "bg-purple-100 text-purple-700 border-purple-300"
            case "policy":
                return "bg-amber-100 text-amber-700 border-amber-300"
            default:
                return "bg-gray-100 text-gray-700 border-gray-300"
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "schedule":
                return "Lịch"
            case "meeting":
                return "Họp"
            case "policy":
                return "Chính sách"
            default:
                return "Thông báo"
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "schedule":
                return CalendarIcon
            case "meeting":
                return Pill
            case "policy":
                return Package
            default:
                return FileText
        }
    }

    const navigation = [
        { name: "Tổng quan", href: "/doctor", icon: BarChart3 },
        { name: "Lịch hẹn", href: "/doctor/appointments", icon: CalendarIcon },
        { name: "Hồ sơ bệnh án", href: "/doctor/patient-records", icon: FileText },
        { name: "Thông báo", href: "/doctor/notifications", icon: Bell },
    ]

    return (
        <RoleGuard allowedRoles="doctor">
            <DashboardLayout navigation={navigation}>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Thông báo</h1>
                        <p className="text-muted-foreground mt-1">Quản lý và xem tất cả thông báo của bạn</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Notification List */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="p-4">
                                <h2 className="font-semibold mb-4 flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Thông báo ({filteredNotifications.length})
                                </h2>

                                <div className="mb-4 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm kiếm..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 mb-4">
                                    <Button
                                        variant={filterType === "all" ? "default" : "outline"}
                                        className="w-full justify-start"
                                        onClick={() => setFilterType("all")}
                                    >
                                        Tất cả
                                    </Button>
                                    <Button
                                        variant={filterType === "schedule" ? "default" : "outline"}
                                        className="w-full justify-start"
                                        onClick={() => setFilterType("schedule")}
                                    >
                                        Lịch
                                    </Button>
                                    <Button
                                        variant={filterType === "other" ? "default" : "outline"}
                                        className="w-full justify-start"
                                        onClick={() => setFilterType("other")}
                                    >
                                        Đơn thuốc
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredNotifications.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-muted-foreground">Không có thông báo</div>
                                    ) : (
                                        filteredNotifications.map((notification) => (
                                            <button
                                                key={notification.id}
                                                onClick={() => setSelectedNotification(notification)}
                                                className={cn(
                                                    "w-full text-left p-3 rounded-lg border-2 transition-all",
                                                    selectedNotification?.id === notification.id
                                                        ? "border-primary bg-primary/5"
                                                        : "border-transparent hover:border-border",
                                                    !notification.read && "bg-blue-50",
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm line-clamp-2">{notification.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.timestamp)}</p>
                                                    </div>
                                                    {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Notification Detail */}
                        <div className="lg:col-span-2">
                            {selectedNotification ? (
                                <Card className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                {(() => {
                                                    const IconComponent = getTypeIcon(selectedNotification.type)
                                                    return <IconComponent className="h-5 w-5 text-muted-foreground" />
                                                })()}
                                                <span
                                                    className={cn(
                                                        "text-sm px-3 py-1 rounded-full font-medium border",
                                                        getTypeColor(selectedNotification.type),
                                                    )}
                                                >
                                                    {getTypeLabel(selectedNotification.type)}
                                                </span>
                                                {!selectedNotification.read && (
                                                    <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                                        Chưa đọc
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-bold">{selectedNotification.title}</h2>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {formatFullTime(selectedNotification.timestamp)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <p className="text-foreground leading-relaxed">{selectedNotification.message}</p>
                                    </div>

                                    {selectedNotification.details && (
                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                            <h3 className="font-semibold text-blue-900 mb-2">Chi tiết</h3>
                                            <p className="text-sm text-blue-800 leading-relaxed">{selectedNotification.details}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t">
                                        {!selectedNotification.read && (
                                            <Button onClick={() => markAsRead(selectedNotification.id)} className="gap-2">
                                                <Check className="h-4 w-4" />
                                                Đánh dấu đã đọc
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            onClick={() => deleteNotification(selectedNotification.id)}
                                            className="gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-12 text-center">
                                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <p className="text-muted-foreground">Chọn một thông báo để xem chi tiết</p>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </RoleGuard>
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

function formatFullTime(date: Date): string {
    return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}
