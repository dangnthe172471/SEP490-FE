"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Clock, Mail, Phone, Stethoscope, User } from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"
import { reappointmentRequestService } from "@/lib/services/reappointment-request-service"
import type { ReappointmentRequestDto } from "@/lib/types/reappointment-request"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

function formatDate(value?: string | null) {
    if (!value) return "Chưa xác định"
    const date = new Date(value)
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function formatDateTime(value?: string | null) {
    if (!value) return "Chưa xác định"
    const date = new Date(value)
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

export default function ReappointmentRequestsPage() {
    const navigation = getReceptionNavigation()
    const { toast } = useToast()

    const [requests, setRequests] = useState<ReappointmentRequestDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [appointmentDate, setAppointmentDate] = useState<string>("")
    const [reason, setReason] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)

    const selectedRequest = useMemo(
        () => requests.find((r) => r.notificationId === selectedId) ?? null,
        [selectedId, requests]
    )

    const resetForm = () => {
        setSelectedId(null)
        setAppointmentDate("")
        setReason("")
    }

    const fetchRequests = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await reappointmentRequestService.getPendingReappointmentRequests()
            setRequests(data)
        } catch (err: any) {
            setError(err?.message ?? "Không thể tải danh sách yêu cầu tái khám.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleSelect = (req: ReappointmentRequestDto) => {
        setSelectedId(req.notificationId)
        setAppointmentDate("")
        setReason("")
    }

    const handleCreateAppointment = async () => {
        if (!selectedRequest || !appointmentDate || !reason.trim()) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng nhập đầy đủ ngày giờ tái khám và lý do.",
                variant: "destructive",
            })
            return
        }

        try {
            setSubmitting(true)
            await reappointmentRequestService.completeReappointmentRequest({
                notificationId: selectedRequest.notificationId,
                appointmentDate,
                reasonForVisit: reason.trim(),
            })

            toast({
                title: "Đã tạo lịch tái khám",
                description: `Đã đặt lịch tái khám cho ${selectedRequest.patientName}.`,
            })

            resetForm()
            fetchRequests()
        } catch (err: any) {
            toast({
                title: "Không thể tạo lịch tái khám",
                description: err?.message ?? "Vui lòng thử lại sau.",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Yêu cầu tái khám</h1>
                        <p className="text-muted-foreground">
                            Danh sách yêu cầu bác sĩ gửi cho lễ tân để đặt lịch tái khám cho bệnh nhân.
                        </p>
                    </div>
                    <Button variant="outline" onClick={fetchRequests} disabled={loading}>
                        Làm mới
                    </Button>
                </div>

                {loading ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            Đang tải danh sách yêu cầu...
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card>
                        <CardContent className="py-10 text-center text-red-600 text-sm">{error}</CardContent>
                    </Card>
                ) : requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            Chưa có yêu cầu tái khám nào đang chờ xử lý.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <Card key={req.notificationId} className="border border-blue-100 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div>
                                        <Badge className="bg-emerald-100 text-emerald-700">Yêu cầu tái khám</Badge>
                                        <CardTitle className="text-xl mt-2 leading-tight">
                                            {req.patientName} &mdash; {req.doctorName}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Gửi lúc {formatDateTime(req.createdDate)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Bác sĩ phụ trách</p>
                                        <p className="font-medium flex items-center gap-1 justify-end">
                                            <Stethoscope className="h-4 w-4 text-blue-500" /> {req.doctorName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{req.doctorSpecialty}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-1 text-sm">
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <User className="h-4 w-4 text-blue-600" /> Bệnh nhân
                                            </p>
                                            <p className="font-medium">{req.patientName}</p>
                                            <p className="flex items-center gap-1 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                {req.patientPhone || "—"}
                                            </p>
                                            {req.patientEmail && (
                                                <p className="flex items-center gap-1 text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                    {req.patientEmail}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4 text-blue-600" /> Ngày tái khám mong muốn
                                            </p>
                                            <p className="font-medium">{formatDateTime(req.preferredDate)}</p>
                                            {req.notes && (
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    <span className="font-medium">Ghi chú:</span> {req.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    {selectedId === req.notificationId ? (
                                        <div className="space-y-3">
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="text-sm text-slate-600">Ngày giờ tái khám</label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={appointmentDate}
                                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-slate-600">Lý do tái khám</label>
                                                    <Input
                                                        placeholder="Ví dụ: Tái khám sau điều trị, kiểm tra kết quả xét nghiệm..."
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm text-slate-600">Ghi chú từ bác sĩ</label>
                                                <div className="border rounded-md bg-muted/40 px-3 py-2 text-sm text-slate-700 min-h-[52px]">
                                                    {req.notes && req.notes.trim().length > 0 ? req.notes : "Không có ghi chú."}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                <Button variant="outline" onClick={resetForm}>
                                                    Hủy
                                                </Button>
                                                <Button onClick={handleCreateAppointment} disabled={submitting}>
                                                    {submitting ? "Đang tạo..." : "Đặt lịch tái khám"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end">
                                            <Button onClick={() => handleSelect(req)}>Đặt lịch tái khám</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

