"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, Activity, Loader2, AlertCircle } from "lucide-react"
import { AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"

interface ReceptionStatsProps {
    className?: string
}

interface StatsData {
    todayAppointments: number
    waitingAppointments: number
    totalPatients: number
    completedAppointments: number
}

export function ReceptionStats({ className }: ReceptionStatsProps) {
    const [stats, setStats] = useState<StatsData>({
        todayAppointments: 0,
        waitingAppointments: 0,
        totalPatients: 0,
        completedAppointments: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Lấy tất cả lịch hẹn
                let appointments: AppointmentDto[] = []
                try {
                    appointments = await appointmentService.getAllAppointments()
                } catch (err) {
                    console.warn('Không thể lấy tất cả lịch hẹn, thử lấy lịch hẹn của receptionist:', err)
                    appointments = await appointmentService.getMyReceptionistAppointments()
                }

                // Tính toán thống kê
                const today = new Date().toDateString()
                const todayAppointments = appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.appointmentDate).toDateString()
                    return appointmentDate === today
                })

                // Đang chờ khám (scheduled hoặc pending)
                const waitingAppointments = appointments.filter(appointment =>
                    appointment.status === 'scheduled' || appointment.status === 'pending' || appointment.status === 'confirmed'
                )

                // Đã hoàn thành
                const completedAppointments = appointments.filter(appointment =>
                    appointment.status === 'completed'
                )

                // Tổng bệnh nhân (unique patientId)
                const uniquePatients = new Set(appointments.map(app => app.patientId)).size

                setStats({
                    todayAppointments: todayAppointments.length,
                    waitingAppointments: waitingAppointments.length,
                    totalPatients: uniquePatients,
                    completedAppointments: completedAppointments.length
                })
            } catch (err: any) {
                console.error('❌ [ERROR] Failed to fetch reception stats:', err)
                setError(err.message || 'Không thể tải thống kê')
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (isLoading) {
        return (
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const statCards = [
        {
            title: "Lịch hẹn hôm nay",
            value: stats.todayAppointments,
            icon: Calendar,
            color: "text-primary",
            bgColor: "bg-primary/10"
        },
        {
            title: "Đang chờ khám",
            value: stats.waitingAppointments,
            icon: Clock,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
        },
        {
            title: "Tổng bệnh nhân",
            value: stats.totalPatients,
            icon: Users,
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Đã hoàn thành",
            value: stats.completedAppointments,
            icon: Activity,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        }
    ]

    return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
            {statCards.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <IconComponent className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
