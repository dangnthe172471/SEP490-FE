"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, UserPlus, CalendarPlus, Activity } from "lucide-react"
import { mockAppointments, mockPatients } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function ReceptionDashboard() {
  const router = useRouter()

  // Get today's appointments
  const today = new Date().toISOString().split("T")[0]
  const todayAppointments = mockAppointments.filter((apt) => apt.status === "scheduled")
  const upcomingAppointments = todayAppointments.slice(0, 5)

  // Statistics
  const stats = [
    {
      title: "Lịch hẹn hôm nay",
      value: todayAppointments.length.toString(),
      icon: Calendar,
      color: "text-primary",
    },
    {
      title: "Đang chờ khám",
      value: mockAppointments.filter((a) => a.status === "scheduled").length.toString(),
      icon: Clock,
      color: "text-chart-4",
    },
    {
      title: "Tổng bệnh nhân",
      value: mockPatients.length.toString(),
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Đã hoàn thành",
      value: mockAppointments.filter((a) => a.status === "completed").length.toString(),
      icon: Activity,
      color: "text-chart-2",
    },
  ]

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lễ tân</h1>
          <p className="text-muted-foreground">Quản lý tiếp nhận và lịch hẹn bệnh nhân</p>
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
              <CardDescription>Danh sách bệnh nhân đã đặt lịch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Không có lịch hẹn nào</p>
                ) : (
                  upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.time}</span>
                        </div>
                        <p className="text-sm font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.doctorName}</p>
                        <Badge variant="outline">{appointment.department}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => router.push(`/reception/appointments/${appointment.id}`)}>
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
              <CardDescription>Các chức năng thường dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button className="w-full justify-start h-auto py-4" onClick={() => router.push("/reception/register")}>
                  <UserPlus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <p className="font-semibold">Đăng ký bệnh nhân mới</p>
                    <p className="text-xs text-primary-foreground/80">Tạo hồ sơ bệnh nhân mới</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 bg-transparent"
                  onClick={() => router.push("/reception/appointments/new")}
                >
                  <CalendarPlus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <p className="font-semibold">Đặt lịch hẹn</p>
                    <p className="text-xs text-muted-foreground">Tạo lịch hẹn cho bệnh nhân</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 bg-transparent"
                  onClick={() => router.push("/reception/patients")}
                >
                  <Users className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <p className="font-semibold">Tra cứu bệnh nhân</p>
                    <p className="text-xs text-muted-foreground">Tìm kiếm thông tin bệnh nhân</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-4 bg-transparent"
                  onClick={() => router.push("/reception/appointments")}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <p className="font-semibold">Quản lý lịch hẹn</p>
                    <p className="text-xs text-muted-foreground">Xem và chỉnh sửa lịch hẹn</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Bệnh nhân gần đây</CardTitle>
            <CardDescription>Danh sách bệnh nhân đã đăng ký</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPatients.slice(0, 4).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{patient.id}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/reception/patients/${patient.id}`)}>
                      Xem
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
