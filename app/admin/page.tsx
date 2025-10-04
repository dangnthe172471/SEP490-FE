"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Users, Settings, Shield, UserPlus, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/admin", icon: Activity },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Phân quyền", href: "/admin/roles", icon: Shield },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

// Mock users data
const mockUsers = [
  { id: "U001", name: "BS. Trần Văn B", role: "doctor", status: "active", department: "Nội khoa" },
  { id: "U002", name: "BS. Lê Thị D", role: "doctor", status: "active", department: "Nhi khoa" },
  { id: "U003", name: "Y tá Nguyễn Thị E", role: "nurse", status: "active", department: "Nội khoa" },
  { id: "U004", name: "Dược sĩ Phạm Văn F", role: "pharmacist", status: "active", department: "Nhà thuốc" },
  { id: "U005", name: "Lễ tân Hoàng Thị G", role: "receptionist", status: "active", department: "Lễ tân" },
]

// Mock recent activities
const recentActivities = [
  {
    id: "A001",
    user: "BS. Trần Văn B",
    action: "Tạo hồ sơ bệnh án mới",
    target: "BN001",
    time: "5 phút trước",
  },
  {
    id: "A002",
    user: "Lễ tân Hoàng Thị G",
    action: "Đăng ký bệnh nhân mới",
    target: "BN015",
    time: "10 phút trước",
  },
  {
    id: "A003",
    user: "Dược sĩ Phạm Văn F",
    action: "Xử lý đơn thuốc",
    target: "DT003",
    time: "15 phút trước",
  },
  {
    id: "A004",
    user: "Y tá Nguyễn Thị E",
    action: "Cập nhật sinh hiệu",
    target: "BN002",
    time: "20 phút trước",
  },
]

export default function AdminDashboard() {
  const router = useRouter()

  const stats = [
    {
      title: "Tổng người dùng",
      value: mockUsers.length.toString(),
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Đang hoạt động",
      value: mockUsers.filter((u) => u.status === "active").length.toString(),
      icon: Activity,
      color: "text-chart-2",
    },
    {
      title: "Bác sĩ",
      value: mockUsers.filter((u) => u.role === "doctor").length.toString(),
      icon: Shield,
      color: "text-chart-3",
    },
    {
      title: "Nhân viên khác",
      value: mockUsers.filter((u) => u.role !== "doctor").length.toString(),
      icon: Users,
      color: "text-chart-4",
    },
  ]

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "doctor":
        return "Bác sĩ"
      case "nurse":
        return "Y tá"
      case "pharmacist":
        return "Dược sĩ"
      case "receptionist":
        return "Lễ tân"
      case "admin":
        return "Quản trị viên"
      default:
        return role
    }
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản trị hệ thống</h1>
          <p className="text-muted-foreground">Quản lý người dùng và phân quyền</p>
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
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Người dùng gần đây</CardTitle>
              <CardDescription>Danh sách nhân viên trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{user.name}</p>
                        <Badge variant="outline">{user.id}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                        <Badge variant="outline">{user.department}</Badge>
                      </div>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/admin/users/${user.id}`)}>
                      Xem
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>Lịch sử thao tác của người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-0">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{activity.target}</Badge>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
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
            <CardDescription>Các chức năng quản trị thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto py-4 flex-col gap-2" onClick={() => router.push("/admin/users/new")}>
                <UserPlus className="h-5 w-5" />
                <span className="text-sm">Thêm người dùng</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 bg-transparent"
                onClick={() => router.push("/admin/users")}
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Quản lý người dùng</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 bg-transparent"
                onClick={() => router.push("/admin/roles")}
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm">Phân quyền</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 bg-transparent"
                onClick={() => router.push("/admin/settings")}
              >
                <Settings className="h-5 w-5" />
                <span className="text-sm">Cài đặt hệ thống</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
