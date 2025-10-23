"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, AlertTriangle, FileText, Loader2, AlertCircle } from "lucide-react"
import { AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"

interface DoctorStatsProps {
    className?: string
}

interface StatsData {
    todayAppointments: number
    currentPatients: number
    needReexamination: number
    weeklyRecords: number
}

export function DoctorStats({ className }: DoctorStatsProps) {
    const [stats, setStats] = useState<StatsData>({
        todayAppointments: 0,
        currentPatients: 0,
        needReexamination: 0,
        weeklyRecords: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Lấy tất cả lịch hẹn của doctor
                const appointments = await appointmentService.getMyDoctorAppointments()

                // Tính toán thống kê
                const today = new Date().toDateString()
                const todayAppointments = appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.appointmentDate).toDateString()
                    return appointmentDate === today
                })

                // Tính số bệnh nhân đang điều trị (có lịch hẹn trong 7 ngày tới)
                const nextWeek = new Date()
                nextWeek.setDate(nextWeek.getDate() + 7)
                const currentPatients = appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.appointmentDate)
                    return appointmentDate >= new Date() && appointmentDate <= nextWeek
                }).length

                // Tính số cần tái khám (có status là "pending" hoặc "confirmed")
                const needReexamination = appointments.filter(appointment =>
                    appointment.status === 'pending' || appointment.status === 'confirmed'
                ).length

                // Tính số hồ sơ tuần này (lịch hẹn đã hoàn thành trong 7 ngày qua)
                const lastWeek = new Date()
                lastWeek.setDate(lastWeek.getDate() - 7)
                const weeklyRecords = appointments.filter(appointment => {
                    const appointmentDate = new Date(appointment.appointmentDate)
                    return appointmentDate >= lastWeek && appointmentDate <= new Date() &&
                        appointment.status === 'completed'
                }).length

                setStats({
                    todayAppointments: todayAppointments.length,
                    currentPatients,
                    needReexamination,
                    weeklyRecords
                })
            } catch (err: any) {
                console.error('❌ [ERROR] Failed to fetch doctor stats:', err)
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
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Bệnh nhân đang điều trị",
            value: stats.currentPatients,
            icon: Users,
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Cần tái khám",
            value: stats.needReexamination,
            icon: AlertTriangle,
            color: "text-orange-600",
            bgColor: "bg-orange-50"
        },
        {
            title: "Hồ sơ tuần này",
            value: stats.weeklyRecords,
            icon: FileText,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        }
    ]

    return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
            {statCards.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        {stat.title}
                                    </p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
