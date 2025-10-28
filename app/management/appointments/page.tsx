"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, Activity, BarChart3, FileText, CalendarIcon, TestTube, Building2 } from "lucide-react"
import { appointmentService } from "@/lib/services/appointment-service"
import { useEffect, useState } from "react"

const navigation = [
    { name: "Tổng quan", href: "/management", icon: BarChart3 },
    { name: "Lịch hẹn", href: "/management/appointments", icon: Calendar },
    { name: "Báo cáo", href: "/management/reports", icon: FileText },
    { name: "Lịch làm việc", href: "/management/staff-schedule", icon: CalendarIcon },
    { name: "Lịch phòng khám", href: "/management/clinic-schedule", icon: Clock },
    { name: "Yêu cầu đổi ca", href: "/management/shift-swap-requests", icon: Calendar },
    { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
    { name: "Loại xét nghiệm", href: "/management/test-types", icon: TestTube },
    { name: "Phòng khám", href: "/management/rooms", icon: Building2 },
]

interface AppointmentStatistics {
    totalAppointments: number
    pendingAppointments: number
    confirmedAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    noShowAppointments: number
}

export default function ManagementAppointmentsPage() {
    const [statistics, setStatistics] = useState<AppointmentStatistics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStatistics()
    }, [])

    const fetchStatistics = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await appointmentService.getAppointmentStatistics()
            setStatistics(data)
        } catch (err: any) {
            console.error("Error fetching statistics:", err)
            setError(err.message || "Không thể tải thống kê lịch hẹn")
        } finally {
            setIsLoading(false)
        }
    }

    const statsCards = statistics ? [
        {
            title: "Tổng số lịch hẹn",
            value: statistics.totalAppointments,
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Đang chờ",
            value: statistics.pendingAppointments,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
        },
        {
            title: "Đã xác nhận",
            value: statistics.confirmedAppointments,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Đã hoàn thành",
            value: statistics.completedAppointments,
            icon: TrendingUp,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            title: "Đã hủy",
            value: statistics.cancelledAppointments,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
        },
        {
            title: "Không đến",
            value: statistics.noShowAppointments,
            icon: AlertCircle,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
    ] : []

    const appointmentStatusData = statistics ? [
        { name: "Đang chờ", value: statistics.pendingAppointments, color: "#fbbf24" },
        { name: "Đã xác nhận", value: statistics.confirmedAppointments, color: "#10b981" },
        { name: "Đã hoàn thành", value: statistics.completedAppointments, color: "#8b5cf6" },
        { name: "Đã hủy", value: statistics.cancelledAppointments, color: "#ef4444" },
        { name: "Không đến", value: statistics.noShowAppointments, color: "#f97316" },
    ] : []

    const completionRate = statistics && statistics.totalAppointments > 0
        ? Math.round((statistics.completedAppointments / statistics.totalAppointments) * 100)
        : 0

    const cancellationRate = statistics && statistics.totalAppointments > 0
        ? Math.round((statistics.cancelledAppointments / statistics.totalAppointments) * 100)
        : 0

    if (isLoading) {
        return (
            <DashboardLayout navigation={navigation}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout navigation={navigation}>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Thống kê Lịch hẹn</h1>
                        <p className="text-muted-foreground">Phân tích và theo dõi lịch hẹn</p>
                    </div>
                    <Card className="border-destructive">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-destructive">
                                <AlertCircle className="h-5 w-5" />
                                <p>{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Thống kê Lịch hẹn</h1>
                    <p className="text-muted-foreground">Phân tích và theo dõi lịch hẹn</p>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {statsCards.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.title} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                            <p className="text-3xl font-bold mt-2">{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Tỷ lệ hoàn thành */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Tỷ lệ hoàn thành
                            </CardTitle>
                            <CardDescription>Tỷ lệ lịch hẹn đã hoàn thành trong tổng số</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Đã hoàn thành</span>
                                        <span className="font-semibold">{completionRate}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-4">
                                        <div
                                            className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                                            style={{ width: `${completionRate}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Đã hủy</span>
                                        <span className="font-semibold">{cancellationRate}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-4">
                                        <div
                                            className="bg-red-600 h-4 rounded-full transition-all duration-500"
                                            style={{ width: `${cancellationRate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Phân bổ trạng thái */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Phân bổ trạng thái
                            </CardTitle>
                            <CardDescription>Số lượng lịch hẹn theo từng trạng thái</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {appointmentStatusData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-lg px-3 py-1">
                                            {item.value}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tổng quan</CardTitle>
                        <CardDescription>Thống kê tổng hợp về lịch hẹn</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Tổng số lịch hẹn</p>
                                <p className="text-2xl font-bold">{statistics?.totalAppointments || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Đã hoàn thành</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {statistics?.completedAppointments || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Đã hủy</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {statistics?.cancelledAppointments || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

