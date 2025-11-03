"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Send, Search, Plus, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"
import { notificationService } from "@/lib/services/notification-service"

// Mock staff data
const mockStaff = [
    { id: 1, name: "BS. Trần Văn B", role: "doctor", department: "Nội khoa" },
    { id: 2, name: "BS. Lê Thị D", role: "doctor", department: "Nhi khoa" },
    { id: 3, name: "Y tá Nguyễn Thị E", role: "nurse", department: "Nội khoa" },
    { id: 4, name: "Y tá Phạm Văn F", role: "nurse", department: "Nhi khoa" },
    { id: 5, name: "Dược sĩ Hoàng Thị G", role: "pharmacist", department: "Nhà thuốc" },
    { id: 6, name: "Lễ tân Trần Văn H", role: "receptionist", department: "Lễ tân" },
]

interface NotificationFormData {
    recipientType: "individual" | "department" | "all"
    recipients: number[]
    department?: string
    title: string
    message: string
    type: string
    customType?: string
}

export default function NotificationsPage() {
    const navigation = getManagerNavigation()

    // 🧠 State cho form gửi thông báo
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<NotificationFormData>({
        recipientType: "individual",
        recipients: [],
        title: "",
        message: "",
        type: "other",
    })

    // 🧠 State cho danh sách thông báo từ BE
    const [notifications, setNotifications] = useState<any[]>([])
    const [pageNumber, setPageNumber] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // 📥 Lấy danh sách thông báo từ API thật
    const fetchNotifications = async (page = 1) => {
        try {
            setIsLoading(true)
            const data = await notificationService.getAllNotifications(page, 5)
            setNotifications(data.items || [])
            setTotalPages(data.totalPages)
            setPageNumber(data.pageNumber)
        } catch (err: any) {
            toast.error(err.message || "Không thể tải danh sách thông báo")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications(pageNumber)
    }, [pageNumber])

    const filteredStaff = mockStaff.filter(
        (staff) =>
            staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.department.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 📤 Gửi thông báo
    const handleSendNotification = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            toast.error("Vui lòng điền đầy đủ tiêu đề và nội dung")
            return
        }

        if (formData.recipientType === "individual" && formData.recipients.length === 0) {
            toast.error("Vui lòng chọn ít nhất một nhân viên")
            return
        }

        try {
            toast.loading("Đang gửi thông báo...")

            await notificationService.sendNotification({
                title: formData.title,
                content: formData.message,
                type: formData.type,
                createdBy: 1,
                isGlobal: formData.recipientType === "all",
                receiverIds: formData.recipientType === "individual" ? formData.recipients : undefined,
                roleNames: formData.recipientType === "department" ? [formData.department ?? ""] : undefined,
            })

            toast.success("Gửi thông báo thành công")
            setIsDialogOpen(false)
            setFormData({
                recipientType: "individual",
                recipients: [],
                title: "",
                message: "",
                type: "other",
            })
            fetchNotifications() // refresh danh sách
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi gửi thông báo")
        } finally {
            toast.dismiss()
        }
    }

    // 🎨 Loại thông báo
    const getNotificationTypeLabel = (type: string) => {
        switch (type) {
            case "schedule":
                return "Lịch làm việc"
            case "meeting":
                return "Hội họp"
            case "policy":
                return "Quy định"
            default:
                return "Khác"
        }
    }

    const getNotificationTypeColor = (type: string) => {
        switch (type) {
            case "schedule":
                return "bg-blue-100 text-blue-800"
            case "meeting":
                return "bg-purple-100 text-purple-800"
            case "policy":
                return "bg-amber-100 text-amber-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const stats = [
        {
            label: "Thông báo đã gửi",
            value: notifications.length,
            icon: CheckCircle,
            color: "text-green-600",
        },
        {
            label: "Thông báo chờ xử lý",
            value: 0,
            icon: Clock,
            color: "text-amber-600",
        },
        {
            label: "Tổng nhân viên",
            value: mockStaff.length,
            icon: Bell,
            color: "text-blue-600",
        },
    ]

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                {/* Header + Dialog gửi thông báo */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gửi thông báo</h1>
                        <p className="text-muted-foreground">Quản lý và gửi thông báo cho nhân viên</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Gửi thông báo mới
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5" />
                                    Gửi thông báo cho nhân viên
                                </DialogTitle>
                                <DialogDescription>Tạo và gửi thông báo đến nhân viên</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Form gửi thông báo giữ nguyên như cũ */}
                                <div className="space-y-3">
                                    <Label htmlFor="title">Tiêu đề thông báo *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Nhập tiêu đề thông báo"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="message">Nội dung thông báo *</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Nhập nội dung thông báo..."
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleSendNotification}>Gửi thông báo</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Thống kê */}
                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="history" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="history">Lịch sử thông báo</TabsTrigger>
                    </TabsList>

                    {/* 🕓 Lịch sử thông báo thật từ BE */}
                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch sử gửi thông báo</CardTitle>
                                <CardDescription>Danh sách thông báo được lấy từ hệ thống</CardDescription>
                            </CardHeader>

                            <CardContent>
                                {isLoading ? (
                                    <div className="text-center py-6 text-muted-foreground">Đang tải...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground">
                                        Chưa có thông báo nào được gửi.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((n) => (
                                            <div
                                                key={n.notificationId}
                                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold">{n.title}</h3>
                                                        <Badge className={getNotificationTypeColor(n.type)}>
                                                            {getNotificationTypeLabel(n.type)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{n.content}</p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>Ngày tạo: {new Date(n.createdDate).toLocaleString()}</span>
                                                        <span>{n.isRead ? "Đã đọc" : "Chưa đọc"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 🧭 Phân trang */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center mt-6 gap-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pageNumber <= 1}
                                            onClick={() => setPageNumber((p) => p - 1)}
                                        >
                                            Trang trước
                                        </Button>

                                        <span className="text-sm text-muted-foreground">
                                            Trang {pageNumber} / {totalPages}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pageNumber >= totalPages}
                                            onClick={() => setPageNumber((p) => p + 1)}
                                        >
                                            Trang sau
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
