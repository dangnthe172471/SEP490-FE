"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Users,
  ClipboardList,
  Stethoscope,
  AlertCircle,
  Clock,
} from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { getNurseNavigation } from "@/lib/navigation/nurse-navigation"
import { RoleGuard } from "@/components/role-guard"

export default function NurseDashboard() {
  const navigation = getNurseNavigation()
  const router = useRouter()

  const activePatients = mockAppointments.filter(
    (apt) => apt.status === "in-progress"
  )

  const stats = [
    {
      title: "Bệnh nhân đang điều trị",
      value: activePatients.length.toString(),
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Nhiệm vụ chờ xử lý",
      value: "8",
      icon: ClipboardList,
      color: "text-chart-4",
    },
    {
      title: "Cần theo dõi",
      value: "5",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "Hoàn thành hôm nay",
      value: "12",
      icon: Activity,
      color: "text-chart-2",
    },
  ]

  const urgentTasks = [
    {
      id: "T001",
      patientName: "Nguyễn Văn A",
      patientId: "BN001",
      task: "Đo huyết áp và nhiệt độ",
      time: "09:30",
      priority: "high",
    },
    {
      id: "T002",
      patientName: "Trần Thị B",
      patientId: "BN002",
      task: "Tiêm thuốc kháng sinh",
      time: "10:00",
      priority: "high",
    },
    {
      id: "T003",
      patientName: "Lê Văn C",
      patientId: "BN003",
      task: "Thay băng vết thương",
      time: "10:30",
      priority: "medium",
    },
  ]

  return (
    <RoleGuard allowedRoles="nurse">
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Điều phối Y tá</h1>
            <p className="text-muted-foreground">
              Quản lý chăm sóc và theo dõi bệnh nhân
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
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
            {/* Urgent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Nhiệm vụ cần xử lý</CardTitle>
                <CardDescription>Các công việc ưu tiên cao</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {urgentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{task.time}</span>
                          <Badge
                            variant={
                              task.priority === "high" ? "destructive" : "secondary"
                            }
                          >
                            {task.priority === "high" ? "Khẩn" : "Trung bình"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{task.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.task}
                        </p>
                        <Badge variant="outline">{task.patientId}</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/nurse/tasks/${task.id}`)}
                      >
                        Xử lý
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Patients */}
            <Card>
              <CardHeader>
                <CardTitle>Bệnh nhân đang điều trị</CardTitle>
                <CardDescription>
                  Danh sách bệnh nhân cần chăm sóc
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activePatients.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Không có bệnh nhân nào
                    </p>
                  ) : (
                    activePatients.slice(0, 4).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-start justify-between border-b pb-4 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {appointment.patientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.doctorName}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="outline">{appointment.id}</Badge>
                            <Badge variant="secondary">
                              {appointment.department}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/nurse/patients/${appointment.id}`)
                          }
                        >
                          Xem
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhanh</CardTitle>
              <CardDescription>Các chức năng thường dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => router.push("/nurse/tasks")}
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-sm">Xem nhiệm vụ</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 bg-transparent"
                  onClick={() => router.push("/nurse/monitoring")}
                >
                  <Stethoscope className="h-5 w-5" />
                  <span className="text-sm">Theo dõi sinh hiệu</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 bg-transparent"
                  onClick={() => router.push("/nurse/patients")}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Danh sách BN</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 bg-transparent"
                  onClick={() => router.push("/nurse/tasks/new")}
                >
                  <Activity className="h-5 w-5" />
                  <span className="text-sm">Ghi nhận chăm sóc</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </RoleGuard>
  )
}
