"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, Stethoscope, Eye, Loader2, AlertCircle } from "lucide-react"
import { AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"

interface DoctorAppointmentsProps {
    className?: string
}

export function DoctorAppointments({ className }: DoctorAppointmentsProps) {
    const [appointments, setAppointments] = useState<AppointmentDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
  
    const navigation = () => {
        window.location.href = "/doctor/appointments";
    };
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const data = await appointmentService.getMyDoctorAppointments()
                setAppointments(data)
            } catch (err: any) {
                console.error('❌ [ERROR] Failed to fetch doctor appointments:', err)
                setError(err.message || 'Không thể tải danh sách lịch hẹn')
            } finally {
                setIsLoading(false)
            }
        }

        fetchAppointments()
    }, [])

    // Lọc lịch hẹn hôm nay
    const today = new Date().toDateString()
    const todayAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate).toDateString()
        return appointmentDate === today
    })

    // Sắp xếp theo giờ
    const sortedAppointments = todayAppointments.sort((a, b) => {
        const timeA = new Date(a.appointmentDate).getTime()
        const timeB = new Date(b.appointmentDate).getTime()
        return timeA - timeB
    })

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return <Badge variant="secondary">Chưa xác nhận</Badge>

        switch (status.toLowerCase()) {
            case 'confirmed':
                return <Badge variant="default" className="bg-green-500">Đã xác nhận</Badge>
            case 'completed':
                return <Badge variant="default" className="bg-blue-500">Hoàn thành</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Đã hủy</Badge>
            case 'pending':
                return <Badge variant="secondary">Chờ xác nhận</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Lịch hẹn hôm nay
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Đang tải lịch hẹn...</span>
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
                        <Calendar className="h-5 w-5" />
                        Lịch hẹn hôm nay
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
                    <Calendar className="h-5 w-5" />
                    Lịch hẹn hôm nay
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Danh sách bệnh nhân cần khám ({sortedAppointments.length} lịch hẹn)
                </p>
            </CardHeader>
            <CardContent>
                {sortedAppointments.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Không có lịch hẹn nào hôm nay</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedAppointments.map((appointment) => (
                            <div
                                key={appointment.appointmentId}
                                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Thời gian */}
                                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                        <Clock className="h-4 w-4" />
                                        {formatTime(appointment.appointmentDate)}
                                    </div>

                                    {/* Thông tin bệnh nhân */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold text-foreground">
                                                {appointment.patientName}
                                            </span>
                                        </div>

                                        {appointment.reasonForVisit && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {appointment.reasonForVisit}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Stethoscope className="h-3 w-3" />
                                                <span>{appointment.doctorSpecialty}</span>
                                            </div>
                                            {appointment.patientPhone && (
                                                <span>📞 {appointment.patientPhone}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(appointment.status)}
                                    <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={navigation}>
                                        <Eye className="h-3 w-3" />
                                        Xem
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

