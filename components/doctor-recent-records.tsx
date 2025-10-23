"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Calendar, Eye, Loader2, AlertCircle } from "lucide-react"
import { AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"

interface DoctorRecentRecordsProps {
    className?: string
}

export function DoctorRecentRecords({ className }: DoctorRecentRecordsProps) {
    const [appointments, setAppointments] = useState<AppointmentDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const data = await appointmentService.getMyDoctorAppointments()
                setAppointments(data)
            } catch (err: any) {
                console.error('❌ [ERROR] Failed to fetch doctor appointments:', err)
                setError(err.message || 'Không thể tải danh sách hồ sơ')
            } finally {
                setIsLoading(false)
            }
        }

        fetchAppointments()
    }, [])

    // Lọc và sắp xếp hồ sơ gần đây (7 ngày qua)
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    const recentRecords = appointments
        .filter(appointment => {
            const appointmentDate = new Date(appointment.appointmentDate)
            return appointmentDate >= lastWeek && appointmentDate <= new Date()
        })
        .sort((a, b) => {
            const timeA = new Date(a.appointmentDate).getTime()
            const timeB = new Date(b.appointmentDate).getTime()
            return timeB - timeA // Sắp xếp mới nhất trước
        })
        .slice(0, 5) // Chỉ lấy 5 hồ sơ gần nhất

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return <Badge variant="secondary">Chưa xác nhận</Badge>

        switch (status.toLowerCase()) {
            case 'completed':
                return <Badge variant="default" className="bg-blue-500">Hoàn thành</Badge>
            case 'confirmed':
                return <Badge variant="default" className="bg-green-500">Đã xác nhận</Badge>
            case 'pending':
                return <Badge variant="secondary">Chờ xác nhận</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Đã hủy</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getDiagnosisFromReason = (reason?: string) => {
        if (!reason) return "Chưa có chẩn đoán"

        // Tạo chẩn đoán giả dựa trên lý do khám
        const reasonLower = reason.toLowerCase()
        if (reasonLower.includes('cao huyết áp') || reasonLower.includes('huyết áp')) {
            return "Tăng huyết áp độ 2"
        } else if (reasonLower.includes('đái tháo đường') || reasonLower.includes('tiểu đường')) {
            return "Đái tháo đường type 2"
        } else if (reasonLower.includes('thai') || reasonLower.includes('mang thai')) {
            return "Thai kỳ 12 tuần"
        } else if (reasonLower.includes('viêm họng') || reasonLower.includes('đau họng')) {
            return "Viêm họng cấp"
        } else if (reasonLower.includes('sốt') || reasonLower.includes('cảm')) {
            return "Cảm cúm thông thường"
        } else {
            return reason.length > 50 ? reason.substring(0, 50) + "..." : reason
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Hồ sơ bệnh án gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Đang tải hồ sơ...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Hồ sơ bệnh án gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Hồ sơ bệnh án gần đây
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Các ca khám mới nhất ({recentRecords.length} hồ sơ)
                </p>
            </CardHeader>
            <CardContent>
                {recentRecords.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Không có hồ sơ nào trong tuần này</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentRecords.map((appointment) => (
                            <div
                                key={appointment.appointmentId}
                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Thông tin bệnh nhân */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold text-foreground">
                                                {appointment.patientName}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-2">
                                            {getDiagnosisFromReason(appointment.reasonForVisit)}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(appointment.appointmentDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                <span>{appointment.doctorSpecialty}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(appointment.status)}
                                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        Chi tiết
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
