"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Users, Settings, Shield, Check } from "lucide-react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/admin", icon: Activity },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Phân quyền", href: "/admin/roles", icon: Shield },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

// Mock roles and permissions
const roles = [
  {
    id: "admin",
    name: "Quản trị viên",
    description: "Toàn quyền quản lý hệ thống",
    userCount: 1,
    color: "text-destructive",
  },
  {
    id: "doctor",
    name: "Bác sĩ",
    description: "Khám bệnh và quản lý hồ sơ bệnh án",
    userCount: 2,
    color: "text-primary",
  },
  {
    id: "nurse",
    name: "Y tá",
    description: "Chăm sóc và theo dõi bệnh nhân",
    userCount: 1,
    color: "text-chart-2",
  },
  {
    id: "pharmacist",
    name: "Dược sĩ",
    description: "Quản lý thuốc và đơn thuốc",
    userCount: 1,
    color: "text-chart-3",
  },
  {
    id: "receptionist",
    name: "Lễ tân",
    description: "Tiếp nhận và đăng ký bệnh nhân",
    userCount: 1,
    color: "text-chart-4",
  },
]

const permissions = [
  {
    category: "Quản lý bệnh nhân",
    items: [
      { id: "patient.view", name: "Xem thông tin bệnh nhân" },
      { id: "patient.create", name: "Đăng ký bệnh nhân mới" },
      { id: "patient.edit", name: "Chỉnh sửa thông tin bệnh nhân" },
      { id: "patient.delete", name: "Xóa bệnh nhân" },
    ],
  },
  {
    category: "Quản lý hồ sơ bệnh án",
    items: [
      { id: "record.view", name: "Xem hồ sơ bệnh án" },
      { id: "record.create", name: "Tạo hồ sơ bệnh án" },
      { id: "record.edit", name: "Chỉnh sửa hồ sơ bệnh án" },
      { id: "record.delete", name: "Xóa hồ sơ bệnh án" },
    ],
  },
  {
    category: "Quản lý lịch hẹn",
    items: [
      { id: "appointment.view", name: "Xem lịch hẹn" },
      { id: "appointment.create", name: "Tạo lịch hẹn" },
      { id: "appointment.edit", name: "Chỉnh sửa lịch hẹn" },
      { id: "appointment.cancel", name: "Hủy lịch hẹn" },
    ],
  },
  {
    category: "Quản lý thuốc",
    items: [
      { id: "medicine.view", name: "Xem danh sách thuốc" },
      { id: "medicine.create", name: "Thêm thuốc mới" },
      { id: "medicine.edit", name: "Chỉnh sửa thông tin thuốc" },
      { id: "medicine.delete", name: "Xóa thuốc" },
    ],
  },
  {
    category: "Quản lý người dùng",
    items: [
      { id: "user.view", name: "Xem danh sách người dùng" },
      { id: "user.create", name: "Tạo người dùng mới" },
      { id: "user.edit", name: "Chỉnh sửa người dùng" },
      { id: "user.delete", name: "Xóa người dùng" },
    ],
  },
]

// Mock role permissions
const rolePermissions: Record<string, string[]> = {
  admin: permissions.flatMap((p) => p.items.map((i) => i.id)),
  doctor: ["patient.view", "patient.edit", "record.view", "record.create", "record.edit", "appointment.view"],
  nurse: ["patient.view", "record.view", "appointment.view"],
  pharmacist: ["patient.view", "medicine.view", "medicine.edit"],
  receptionist: ["patient.view", "patient.create", "patient.edit", "appointment.view", "appointment.create"],
}

export default function AdminRolesPage() {
  const router = useRouter()

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý phân quyền</h1>
          <p className="text-muted-foreground">Cấu hình quyền truy cập cho từng vai trò</p>
        </div>

        {/* Roles Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className={`flex items-center gap-2 ${role.color}`}>
                      <Shield className="h-5 w-5" />
                      {role.name}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{role.userCount} người</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => router.push(`/admin/roles/${role.id}`)}
                >
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Ma trận phân quyền</CardTitle>
            <CardDescription>Tổng quan quyền truy cập của từng vai trò</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {permissions.map((permissionGroup) => (
                <div key={permissionGroup.category} className="space-y-3">
                  <h3 className="font-semibold text-sm">{permissionGroup.category}</h3>
                  <div className="space-y-2">
                    {permissionGroup.items.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between border-b pb-2 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">{permission.name}</span>
                        <div className="flex gap-4">
                          {roles.map((role) => (
                            <div key={role.id} className="flex items-center gap-2 w-24">
                              <span className="text-xs text-muted-foreground truncate">{role.name}</span>
                              {rolePermissions[role.id]?.includes(permission.id) ? (
                                <Check className="h-4 w-4 text-chart-2" />
                              ) : (
                                <div className="h-4 w-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
