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
import { Search, Plus, Send } from "lucide-react"
import { toast } from "sonner"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"
import { notificationService } from "@/lib/services/notification-service"
import type { NotificationUserDto } from "@/lib/types/notification-type"


interface NotificationFormData {
    recipientType: "individual" | "department" | "all"
    recipients: number[]
    department?: string
    title: string
    message: string
    type: string
}

export default function NotificationsPage() {
    const [staffList, setStaffList] = useState<NotificationUserDto[]>([])
    const navigation = getManagerNavigation()
    const [searchQuery, setSearchQuery] = useState("")
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState<NotificationFormData>({
        recipientType: "individual",
        recipients: [],
        title: "",
        message: "",
        type: "schedule",
    })

    const [notifications, setNotifications] = useState<any[]>([])
    const [pageNumber, setPageNumber] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await notificationService.getAllUsers()
            setStaffList(data)
        }
        fetchUsers()
    }, [])
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
    const getRoleLabel = (role: string) => {
        switch (role) {
            case "Doctor":
                return "Bác sĩ"
            case "Nurse":
                return "Y tá"
            case "Pharmacy Provider":
                return "Dược sĩ"
            case "Receptionist":
                return "Lễ tân"
            case "Clinic Manager":
                return "Quản lý"
            case "Administrator":
                return "Quản trị viên"
            case "Patient":
                return "Bệnh nhân"
            default:
                return "Khách"
        }
    }


    useEffect(() => {
        fetchNotifications(pageNumber)
    }, [pageNumber])

    const removeAccents = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const filteredStaff = staffList.filter((s) =>
        removeAccents(s.fullName.toLowerCase()).includes(
            removeAccents(searchQuery.toLowerCase())
        )
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
                type: "schedule",
            })
            fetchNotifications()
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

const formatNotificationContent = (content: string): { summary: string; details?: string } => {
    if (!content) return { summary: "" }
    try {
        const parsed = JSON.parse(content)
        // Lịch hẹn / tái khám
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
        // JSON khác: gom key-value ngắn gọn
        const summary =
            Object.entries(parsed)
                .map(([k, v]) => `${k}: ${v ?? ""}`)
                .join(" • ") || content
        return { summary, details: JSON.stringify(parsed, null, 2) }
    } catch {
        return { summary: content }
    }
}

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
                                {/* Chọn loại gửi */}
                                <div className="space-y-3">
                                    <Label>Loại gửi</Label>
                                    <Select
                                        value={formData.recipientType}
                                        onValueChange={(v: any) => setFormData({ ...formData, recipientType: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại gửi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">Gửi cho nhân viên hoặc người dùng cụ thể</SelectItem>
                                            <SelectItem value="department">Gửi cho toàn bộ vai trò</SelectItem>
                                            <SelectItem value="all">Gửi cho tất cả nhân viên</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Gửi cho nhân viên cụ thể */}
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
                                            {filteredStaff.map((s) => (
                                                <div key={s.userId} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
                                                    <input
                                                        type="checkbox"
                                                        id={`staff-${s.userId}`}
                                                        checked={formData.recipients.includes(s.userId)}
                                                        onChange={(e) => {
                                                            if (e.target.checked)
                                                                setFormData({ ...formData, recipients: [...formData.recipients, s.userId] })
                                                            else
                                                                setFormData({
                                                                    ...formData,
                                                                    recipients: formData.recipients.filter((id) => id !== s.userId),
                                                                })
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <label htmlFor={`staff-${s.userId}`} className="cursor-pointer flex-1">
                                                        <div className="font-medium">{s.fullName}</div>
                                                        <div className="text-sm text-muted-foreground">{getRoleLabel(s.role)}</div>
                                                    </label>
                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                )}

                                {/* Gửi theo vai trò */}
                                {formData.recipientType === "department" && (
                                    <div className="space-y-3">
                                        <Label>Chọn vai trò</Label>
                                        <Select
                                            value={formData.department}
                                            onValueChange={(v) => setFormData({ ...formData, department: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Doctor">Bác sĩ</SelectItem>
                                                <SelectItem value="Nurse">Y tá</SelectItem>
                                                <SelectItem value="Pharmacy Provider">Dược sĩ</SelectItem>
                                                <SelectItem value="Receptionist">Lễ tân</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Loại thông báo */}
                                <div className="space-y-3">
                                    <Label>Loại thông báo *</Label>
                                    {showCustomInput ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                autoFocus
                                                placeholder="Nhập loại thông báo mới..."
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            />
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setFormData({ ...formData, type: "schedule" })
                                                    setShowCustomInput(false)
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v: any) => {
                                                if (v === "custom") {
                                                    setShowCustomInput(true)
                                                    setFormData({ ...formData, type: "" })
                                                } else setFormData({ ...formData, type: v })
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

                                {/* Tiêu đề và nội dung */}
                                <div className="space-y-3">
                                    <Label>Tiêu đề *</Label>
                                    <Input
                                        placeholder="Nhập tiêu đề thông báo"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Nội dung *</Label>
                                    <Textarea
                                        placeholder="Nhập nội dung thông báo..."
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleSendNotification}>Gửi thông báo</Button>
                                </div>
                            </div>
                        </DialogContent>

                    </Dialog>
                </div>

                <Tabs defaultValue="history" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="history">Lịch sử thông báo</TabsTrigger>
                    </TabsList>

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
                                    <div className="text-center py-6 text-muted-foreground">Chưa có thông báo nào.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((n) => {
                                            const { summary, details } = formatNotificationContent(n.content)
                                            return (
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
                                                        <p className="text-sm text-muted-foreground mb-1">
                                                            {summary || "Không có nội dung"}
                                                        </p>
                                                        {details && details !== summary && (
                                                            <pre className="text-xs text-muted-foreground/80 whitespace-pre-wrap mb-2">
                                                                {details}
                                                            </pre>
                                                        )}
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span>Ngày tạo: {new Date(n.createdDate).toLocaleString()}</span>
                                                            <span>{n.isRead ? "Đã đọc" : "Chưa đọc"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

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
