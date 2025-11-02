"use client"

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
import { Bell, FileText, TrendingUp, Send, Search, Plus, CheckCircle, Clock } from "lucide-react"
import { useState } from "react"
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

// Mock notifications
const mockNotifications = [
    {
        id: 1,
        staffId: 1,
        title: "Cập nhật lịch làm việc",
        message: "Lịch làm việc của bạn đã được cập nhật",
        status: "sent",
        sentAt: "2025-01-10 14:30",
        type: "schedule",
    },
    {
        id: 2,
        staffId: 2,
        title: "Hội họp khoa phòng",
        message: "Có hội họp vào chiều nay lúc 15:00",
        status: "sent",
        sentAt: "2025-01-10 13:15",
        type: "meeting",
    },
    {
        id: 3,
        staffId: 3,
        title: "Cập nhật quy định mới",
        message: "Vui lòng đọc quy định mới về vệ sinh",
        status: "pending",
        sentAt: null,
        type: "policy",
    },
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
    const [showCustomInput, setShowCustomInput] = useState(false)

    const navigation = getManagerNavigation()
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<NotificationFormData>({
        recipientType: "individual",
        recipients: [],
        title: "",
        message: "",
        type: "other",
    })

    const filteredStaff = mockStaff.filter(
        (staff) =>
            staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            staff.department.toLowerCase().includes(searchQuery.toLowerCase()),
    )


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

            // Gọi API backend
            await notificationService.sendNotification({
                title: formData.title,
                content: formData.message,
                type: formData.type,
                createdBy: 1, // id người gửi (Manager)
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
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi gửi thông báo")
        } finally {
            toast.dismiss()
        }
    }
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
            value: mockNotifications.filter((n) => n.status === "sent").length,
            icon: CheckCircle,
            color: "text-green-600",
        },
        {
            label: "Thông báo chờ xử lý",
            value: mockNotifications.filter((n) => n.status === "pending").length,
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
                                {/* Recipients Type */}
                                <div className="space-y-3">
                                    <Label>Loại gửi</Label>
                                    <Select
                                        value={formData.recipientType}
                                        onValueChange={(value: any) => setFormData({ ...formData, recipientType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">Gửi cho nhân viên cụ thể</SelectItem>
                                            <SelectItem value="department">Gửi cho toàn bộ vai trò</SelectItem>
                                            <SelectItem value="all">Gửi cho tất cả nhân viên</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Recipients Selection */}
                                {formData.recipientType === "individual" && (
                                    <div className="space-y-3">
                                        <Label>Chọn nhân viên nhận thông báo</Label>
                                        <div className="relative mb-3">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Tìm kiếm nhân viên..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                            {filteredStaff.map((staff) => (
                                                <div key={staff.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
                                                    <input
                                                        type="checkbox"
                                                        id={`staff-${staff.id}`}
                                                        checked={formData.recipients.includes(staff.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    recipients: [...formData.recipients, staff.id],
                                                                })
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    recipients: formData.recipients.filter((id) => id !== staff.id),
                                                                })
                                                            }
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <label htmlFor={`staff-${staff.id}`} className="flex-1 cursor-pointer">
                                                        <div className="font-medium">{staff.name}</div>
                                                        <div className="text-sm text-muted-foreground">{staff.department}</div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        {formData.recipients.length > 0 && (
                                            <div className="text-sm text-muted-foreground">
                                                Đã chọn {formData.recipients.length} nhân viên
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.recipientType === "department" && (
                                    <div className="space-y-3">
                                        <Label>Chọn vai trò</Label>
                                        <Select
                                            value={formData.department}
                                            onValueChange={(value) => setFormData({ ...formData, department: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Nội khoa">Bác sĩ</SelectItem>
                                                <SelectItem value="Nhi khoa">Y tá</SelectItem>
                                                <SelectItem value="Nhà thuốc">Nhà thuốc</SelectItem>
                                                <SelectItem value="Lễ tân">Lễ tân</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Message Details */}
                                <div className="space-y-3">
                                    <Label htmlFor="type">Loại thông báo *</Label>

                                    {showCustomInput ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="customType"
                                                autoFocus
                                                placeholder="Nhập loại thông báo mới..."
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            />
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setFormData({ ...formData, type: "" })
                                                    setShowCustomInput(false)
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.type || ""}
                                            onValueChange={(value: any) => {
                                                if (value === "custom") {
                                                    setFormData({ ...formData, type: "" })
                                                    setShowCustomInput(true)
                                                } else {
                                                    setFormData({ ...formData, type: value })
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn loại thông báo hoặc nhập mới" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="schedule">Lịch làm việc</SelectItem>
                                                <SelectItem value="meeting">Hội họp</SelectItem>
                                                <SelectItem value="policy">Quy định</SelectItem>
                                                <SelectItem value="custom">Khác (tự nhập)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>



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

                {/* Statistics */}
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
                        <TabsTrigger value="staff-grid">Lưới nhân viên</TabsTrigger>
                    </TabsList>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch sử gửi thông báo</CardTitle>
                                <CardDescription>Danh sách tất cả các thông báo đã gửi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {mockNotifications.map((notification) => {
                                        const staff = mockStaff.find((s) => s.id === notification.staffId)
                                        return (
                                            <div
                                                key={notification.id}
                                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold">{notification.title}</h3>
                                                        <Badge className={getNotificationTypeColor(notification.type)}>
                                                            {getNotificationTypeLabel(notification.type)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>Gửi cho: {staff?.name}</span>
                                                        <span>Thời gian: {notification.sentAt || "Chờ xử lý"}</span>
                                                    </div>
                                                </div>
                                                <Badge variant={notification.status === "sent" ? "default" : "secondary"}>
                                                    {notification.status === "sent" ? "Đã gửi" : "Chờ xử lý"}
                                                </Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Staff Grid Tab */}
                    <TabsContent value="staff-grid" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lưới trạng thái thông báo nhân viên</CardTitle>
                                <CardDescription>Xem trạng thái thông báo cho từng nhân viên</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b bg-muted/50">
                                            <tr>
                                                <th className="text-left p-3 font-semibold">Nhân viên</th>
                                                <th className="text-left p-3 font-semibold">Chức vụ</th>
                                                <th className="text-left p-3 font-semibold">Phòng ban</th>
                                                <th className="text-left p-3 font-semibold">Thông báo gần nhất</th>
                                                <th className="text-left p-3 font-semibold">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockStaff.map((staff, index) => {
                                                const lastNotification = mockNotifications.find((n) => n.staffId === staff.id)
                                                return (
                                                    <tr key={staff.id} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                                                        <td className="p-3 font-medium">{staff.name}</td>
                                                        <td className="p-3 text-sm">
                                                            {staff.role === "doctor" ? "Bác sĩ" : staff.role === "nurse" ? "Y tá" : "Khác"}
                                                        </td>
                                                        <td className="p-3 text-sm">{staff.department}</td>
                                                        <td className="p-3 text-sm">{lastNotification ? lastNotification.title : "-"}</td>
                                                        <td className="p-3">
                                                            <Badge variant={lastNotification?.status === "sent" ? "default" : "secondary"}>
                                                                {lastNotification?.status === "sent" ? "✓ Đã nhận" : "○ Chưa gửi"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
