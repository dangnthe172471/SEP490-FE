"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Users, Activity, Clock, AlertCircle } from "lucide-react"
import { mockAppointments, mockMedicalRecords } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/doctor", icon: Activity },
  { name: "Bệnh nhân", href: "/doctor/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/doctor/records", icon: FileText },
  { name: "Lịch hẹn", href: "/doctor/appointments", icon: Calendar },
]

export default function DoctorDashboard() {
  const router = useRouter()

  // Get today's appointments
  const today = new Date().toISOString().split("T")[0]
  const todayAppointments = mockAppointments.filter((apt) => apt.status === "scheduled")

  // Get recent records
  const recentRecords = mockMedicalRecords.slice(0, 3)

  // Statistics
  const stats = [
    {
      title: "Lịch hẹn hôm nay",
      value: todayAppointments.length.toString(),
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Bệnh nhân đang điều trị",
      value: mockMedicalRecords.filter((r) => r.status === "active").length.toString(),
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Cần tái khám",
      value: mockMedicalRecords.filter((r) => r.status === "follow-up").length.toString(),
      icon: AlertCircle,
      color: "text-chart-4",
    },
    {
      title: "Hồ sơ tuần này",
      value: mockMedicalRecords.length.toString(),
      icon: FileText,
      color: "text-chart-2",
    },
  ]

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground">Chào mừng trở lại, BS. Nguyễn Văn A</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch hẹn hôm nay</CardTitle>
              <CardDescription>Danh sách bệnh nhân cần khám</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Không có lịch hẹn nào</p>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.time}</span>
                        </div>
                        <p className="text-sm font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                        <Badge variant="outline">{appointment.department}</Badge>
                      </div>
                      <Button size="sm" onClick={() => router.push(`/doctor/appointments/${appointment.id}`)}>
                        Xem
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Medical Records */}
          <Card>
            <CardHeader>
              <CardTitle>Hồ sơ bệnh án gần đây</CardTitle>
              <CardDescription>Các ca khám mới nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRecords.map((record) => (
                  <div key={record.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{record.patientName}</p>
                      <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{record.department}</Badge>
                        <Badge
                          variant={
                            record.status === "active"
                              ? "default"
                              : record.status === "follow-up"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {record.status === "active"
                            ? "Đang điều trị"
                            : record.status === "follow-up"
                              ? "Tái khám"
                              : "Hoàn thành"}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/doctor/records/${record.id}`)}>
                      Chi tiết
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button className="h-auto flex-col gap-2 py-4" onClick={() => router.push("/doctor/records/new")}>
                <FileText className="h-6 w-6" />
                <span>Tạo hồ sơ mới</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4 bg-transparent"
                onClick={() => router.push("/doctor/patients")}
              >
                <Users className="h-6 w-6" />
                <span>Tìm bệnh nhân</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4 bg-transparent"
                onClick={() => router.push("/doctor/appointments")}
              >
                <Calendar className="h-6 w-6" />
                <span>Xem lịch hẹn</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
