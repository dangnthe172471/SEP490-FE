"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, Settings, Shield, Search, UserPlus, Mail, Phone, Loader2, CheckCircle, AlertCircle, Trash2, Edit3 } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { userService } from "@/lib/services/user.service"
import { UserDto } from "@/lib/types/api"
import { toast } from "sonner"
import { ClientOnly } from "@/components/client-only"
import { DateFormatter } from "@/components/date-formatter"

// Sử dụng UserDto từ API service
type User = UserDto & {
  id: string // Thêm id để tương thích với UI
  name: string // Alias cho fullName
  status: string // Thêm status cho UI
  department: string // Thêm department cho UI
  joinDate: string // Thêm joinDate cho UI
}

const navigation = [
  { name: "Tổng quan", href: "/admin", icon: Activity },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Phân quyền", href: "/admin/roles", icon: Shield },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Hàm gọi API lấy dữ liệu người dùng
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const usersData = await userService.getAllUsers()

      // Xử lý dữ liệu: chuyển đổi UserDto thành User interface
      const processedUsers: User[] = usersData
        .filter(user => user != null)
        .map((user, index) => ({
          ...user,
          // Mapping các trường cần thiết cho UI
          id: user.userId.toString(),
          name: user.fullName || `User ${user.userId}`,
          status: user.isActive ? 'active' : 'inactive', // Sử dụng isActive từ backend
          department: getDepartmentByRole(user.role),
          joinDate: "2025-01-01T00:00:00.000Z", // Mặc định là ngày cố định
        }))

      setUsers(processedUsers)
    } catch (err: any) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", err)
      setError(err.message || "Không thể tải dữ liệu người dùng từ server.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Helper function để lấy department dựa trên role
  const getDepartmentByRole = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'doctor':
        return 'Khoa Nội'
      case 'nurse':
        return 'Điều dưỡng'
      case 'pharmacist':
        return 'Nhà thuốc'
      case 'receptionist':
        return 'Lễ tân'
      case 'admin':
        return 'Quản trị'
      case 'management':
        return 'Quản lý'
      case 'patient':
        return 'Bệnh nhân'
      default:
        return 'Chưa xác định'
    }
  }

  // Thực hiện gọi API khi component được mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handle delete user
  // const handleDeleteUser = async (userId: string, userName: string) => {
  //   const confirmMessage = `Bạn có chắc chắn muốn xóa người dùng "${userName}"?\n\nHành động này không thể hoàn tác!`
  //   if (!confirm(confirmMessage)) return

  //   try {
  //     setDeletingUserId(userId)
  //     await apiService.deleteUser(parseInt(userId))
  //     toast.success("Xóa người dùng thành công")
  //     // Refresh the users list
  //     await fetchUsers()
  //   } catch (err: any) {
  //     console.warn("Delete user failed:", err)
  //     const errorMessage = err?.message || "Không thể xóa người dùng"
  //     toast.error(errorMessage)
  //   } finally {
  //     setDeletingUserId(null)
  //   }
  // }

  // Lấy nhãn vai trò
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
        return role.charAt(0).toUpperCase() + role.slice(1) // Viết hoa chữ cái đầu cho các role khác
    }
  }

  // Lọc người dùng (đã thêm kiểm tra an toàn)
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users

    const lowerCaseQuery = searchQuery.toLowerCase()

    return users.filter(
      (user) =>
        // **Đã sửa lỗi: Sử dụng ?. và ?? để xử lý các giá trị null/undefined**
        (user.name?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (user.email?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (user.id?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (user.phone?.toLowerCase().includes(lowerCaseQuery) ?? false)
    )
  }, [users, searchQuery])


  // Tính toán các nhóm người dùng đã lọc
  const activeUsers = filteredUsers.filter((u) => u.status === "active")
  const doctorUsers = filteredUsers.filter((u) => u.role === "doctor")
  const staffUsers = filteredUsers.filter((u) => u.role !== "doctor")

  // Component hiển thị thẻ người dùng
  const UserCard = ({ user }: { user: User }) => {

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{user.name || "N/A"}</h3>
                    <Badge variant="outline">{user.id || "N/A"}</Badge>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">{getRoleLabel(user.role || "")}</Badge>
                    <Badge variant="outline">{user.department || "N/A"}</Badge>
                    <Badge variant={user.status === "active" ? "default" : "destructive"}>
                      {user.status === "active" ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Bị khóa
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone || "N/A"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ngày tham gia: <DateFormatter dateString={user.joinDate} fallback="N/A" />
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" onClick={() => router.push(`/admin/users/${user.id}`)}>
                <Edit3 className="mr-1 h-3 w-3" />
                Chi tiết
              </Button>
              {/* <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDeleteUser(user.id, user.name)}
                disabled={deletingUserId === user.id}
              >
                {deletingUserId === user.id ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-3 w-3" />
                )}
                Xóa
              </Button> */}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <DashboardLayout navigation={navigation}>
      <ClientOnly fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      }>
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

          {/* Loading and Error States */}
          {loading && (
            <Card>
              <CardContent className="py-12 text-center flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-muted-foreground">Đang tải dữ liệu từ API...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="py-12 text-center text-red-500">
                <p className="font-medium">Lỗi: {error}</p>
                <Button onClick={fetchUsers} variant="outline" className="mt-4" disabled={loading}>
                  <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Users List Tabs (Chỉ hiển thị khi đã tải xong và không có lỗi) */}
          {!loading && !error && (
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
          )}
        </div>
      </ClientOnly>
    </DashboardLayout>
  )
}