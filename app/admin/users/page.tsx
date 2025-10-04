"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, Settings, Shield, Search, UserPlus, Mail, Phone } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/admin", icon: Activity },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Phân quyền", href: "/admin/roles", icon: Shield },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

// Mock users data
const mockUsers = [
  {
    id: "U001",
    name: "BS. Trần Văn B",
    email: "tranvanb@hospital.com",
    phone: "0901234567",
    role: "doctor",
    status: "active",
    department: "Nội khoa",
    joinDate: "2023-01-15",
  },
  {
    id: "U002",
    name: "BS. Lê Thị D",
    email: "lethid@hospital.com",
    phone: "0901234568",
    role: "doctor",
    status: "active",
    department: "Nhi khoa",
    joinDate: "2023-02-20",
  },
  {
    id: "U003",
    name: "Y tá Nguyễn Thị E",
    email: "nguyenthie@hospital.com",
    phone: "0901234569",
    role: "nurse",
    status: "active",
    department: "Nội khoa",
    joinDate: "2023-03-10",
  },
  {
    id: "U004",
    name: "Dược sĩ Phạm Văn F",
    email: "phamvanf@hospital.com",
    phone: "0901234570",
    role: "pharmacist",
    status: "active",
    department: "Nhà thuốc",
    joinDate: "2023-04-05",
  },
  {
    id: "U005",
    name: "Lễ tân Hoàng Thị G",
    email: "hoangthig@hospital.com",
    phone: "0901234571",
    role: "receptionist",
    status: "active",
    department: "Lễ tân",
    joinDate: "2023-05-12",
  },
  {
    id: "U006",
    name: "Admin Nguyễn Văn H",
    email: "nguyenvanh@hospital.com",
    phone: "0901234572",
    role: "admin",
    status: "active",
    department: "Quản trị",
    joinDate: "2023-01-01",
  },
]

export default function AdminUsersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeUsers = filteredUsers.filter((u) => u.status === "active")
  const inactiveUsers = filteredUsers.filter((u) => u.status === "inactive")
  const doctorUsers = filteredUsers.filter((u) => u.role === "doctor")
  const staffUsers = filteredUsers.filter((u) => u.role !== "doctor")

  const UserCard = ({ user }: { user: (typeof mockUsers)[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <Badge variant="outline">{user.id}</Badge>
                </div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                  <Badge variant="outline">{user.department}</Badge>
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                    {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user.phone}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ngày tham gia: {user.joinDate}</p>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button size="sm" onClick={() => router.push(`/admin/users/${user.id}`)}>
              Chi tiết
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
            <p className="text-muted-foreground">Quản lý tài khoản nhân viên trong hệ thống</p>
          </div>
          <Button onClick={() => router.push("/admin/users/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm người dùng</CardTitle>
            <CardDescription>Tìm theo tên, email hoặc mã nhân viên</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nhập tên, email hoặc mã nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Tất cả ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="active">Hoạt động ({activeUsers.length})</TabsTrigger>
            <TabsTrigger value="doctors">Bác sĩ ({doctorUsers.length})</TabsTrigger>
            <TabsTrigger value="staff">Nhân viên ({staffUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có người dùng hoạt động</p>
                </CardContent>
              </Card>
            ) : (
              activeUsers.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            {doctorUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có bác sĩ nào</p>
                </CardContent>
              </Card>
            ) : (
              doctorUsers.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            {staffUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có nhân viên nào</p>
                </CardContent>
              </Card>
            ) : (
              staffUsers.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
