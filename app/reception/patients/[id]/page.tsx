"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  Users,
  Settings,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Lock,
  Unlock,
  MessageCircle,
  KeyRound
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { userService } from "@/lib/services/user.service"
import { UserDto, UpdateUserRequest } from "@/lib/types/api"
import { toast } from "sonner"
import { ClientOnly } from "@/components/client-only"
import { DateFormatter } from "@/components/date-formatter"
import { getCurrentUser } from "@/lib/auth"

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Chat hỗ trợ", href: "/reception/chat", icon: MessageCircle },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string

  const [user, setUser] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<UpdateUserRequest>({})
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check authentication
  useEffect(() => {
    const currentUser = getCurrentUser()
    const token = localStorage.getItem('auth_token')

    if (!currentUser || !token) {
      router.push('/login')
      return
    }
  }, [router])

  // Helper function to format date for input
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    } catch {
      return ""
    }
  }

  // Fetch user details
  const fetchUserDetails = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      setError("ID bệnh nhân không hợp lệ")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userData = await userService.fetchUserById(parseInt(userId))
      setUser(userData)
      setEditData({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        dob: formatDateForInput(userData.dob),
        allergies: userData.allergies,
        medicalHistory: userData.medicalHistory
      })
    } catch (err: any) {
      console.error("Error fetching user details:", err)
      const errorMessage = err.message || "Không thể tải thông tin bệnh nhân"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  // Handle save changes
  const handleSave = async () => {
    if (!user || !userId) return

    try {
      setLoading(true)

      // Validate email if provided
      if (editData.email && editData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email.trim())) {
        toast.error("Email không hợp lệ")
        setLoading(false)
        return
      }

      // Validate phone if provided
      if (editData.phone && editData.phone.trim() && !/^[0-9]{10,11}$/.test(editData.phone.replace(/\s/g, ""))) {
        toast.error("Số điện thoại phải có 10-11 chữ số")
        setLoading(false)
        return
      }

      // Clean and prepare data for update
      const updateData: any = {}

      // Only include fields that are different from original
      if (editData.fullName !== undefined && editData.fullName !== user.fullName) {
        updateData.fullName = (editData.fullName || "").trim()
      }
      if (editData.email !== undefined && editData.email !== user.email) {
        updateData.email = (editData.email || "").trim()
      }
      if (editData.phone !== undefined && editData.phone !== user.phone) {
        updateData.phone = (editData.phone || "").trim()
      }
      if (editData.gender !== undefined && editData.gender !== user.gender) {
        updateData.gender = (editData.gender || "").trim()
      }
      if (editData.dob !== undefined && editData.dob !== formatDateForInput(user.dob)) {
        updateData.dob = editData.dob || ""
      }
      if (editData.allergies !== undefined && editData.allergies !== user.allergies) {
        updateData.allergies = (editData.allergies || "").trim()
      }
      if (editData.medicalHistory !== undefined && editData.medicalHistory !== user.medicalHistory) {
        updateData.medicalHistory = (editData.medicalHistory || "").trim()
      }

      // Check if there are any changes
      if (Object.keys(updateData).length === 0) {
        toast.info("Không có thay đổi nào để cập nhật")
        setIsEditing(false)
        return
      }

      const updatedUser = await userService.updateUser(parseInt(userId), updateData)
      setUser(updatedUser)
      setIsEditing(false)
      toast.success("Cập nhật thông tin thành công")
    } catch (err: any) {
      console.error("Error updating user:", err)
      const errorMessage = err.message || "Không thể cập nhật thông tin bệnh nhân"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete user
  // const handleDelete = async () => {
  //   if (!user || !userId) return

  //   const confirmMessage = `Bạn có chắc chắn muốn xóa bệnh nhân "${user.fullName || user.email || `ID: ${user.userId}`}"?\n\nHành động này không thể hoàn tác!`
  //   if (!confirm(confirmMessage)) return

  //   try {
  //     setIsDeleting(true)
  //     await userService.deleteUser(parseInt(userId))
  //     toast.success("Xóa bệnh nhân thành công")
  //     router.push("/admin/users")
  //   } catch (err: any) {
  //     console.warn("Delete user failed:", err)
  //     const errorMessage = err?.message || "Không thể xóa bệnh nhân"
  //     toast.error(errorMessage)
  //   } finally {
  //     setIsDeleting(false)
  //   }
  // }

  // Handle toggle user status (Lock/Unlock)
  const handleToggleStatus = async () => {
    if (!user || !userId) return

    const action = user.isActive ? "khóa" : "mở khóa"
    if (!confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) return

    try {
      setIsTogglingStatus(true)
      const updatedUser = await userService.toggleUserStatus(parseInt(userId))
      setUser(updatedUser)
      toast.success(`Đã ${action} tài khoản thành công`)
    } catch (err: any) {
      console.error("Error toggling user status:", err)
      toast.error(`Không thể ${action} tài khoản`)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  // Handle reset password to default "123456"
  const handleResetPassword = async () => {
    if (!user || !userId) return

    if (!confirm("Đặt lại mật khẩu của bệnh nhân này về 123456?")) return

    try {
      setIsResettingPassword(true)
      await userService.updateUser(parseInt(userId), { password: "123456" })
      toast.success("Đã đặt lại mật khẩu về 123456")
    } catch (err: any) {
      console.warn("Reset password failed:", err)
      const errorMessage = err?.message || "Không thể đặt lại mật khẩu"
      toast.error(errorMessage)
    } finally {
      setIsResettingPassword(false)
    }
  }

  // Get role label
  const getRoleLabel = (role?: string) => {
    switch (role?.toLowerCase()) {
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
      case "management":
        return "Quản lý"
      case "patient":
        return "Bệnh nhân"
      default:
        return role || "Chưa xác định"
    }
  }

  // Get role color
  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "doctor":
        return "bg-blue-100 text-blue-800"
      case "nurse":
        return "bg-green-100 text-green-800"
      case "pharmacist":
        return "bg-purple-100 text-purple-800"
      case "receptionist":
        return "bg-yellow-100 text-yellow-800"
      case "management":
        return "bg-indigo-100 text-indigo-800"
      case "patient":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date - sử dụng DateFormatter component
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa cập nhật"
    return <DateFormatter dateString={dateString} fallback="Chưa cập nhật" />
  }

  if (loading && !user) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !user) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-medium mb-4">
                {error || "Không tìm thấy bệnh nhân"}
              </p>
              <Button onClick={() => router.push("/admin/users")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại danh sách
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/reception/patients")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? "Chỉnh sửa bệnh nhân" : "Chi tiết bệnh nhân"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing ? "Cập nhật thông tin bệnh nhân" : "Xem thông tin chi tiết bệnh nhân"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Lưu thay đổi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditData({
                        fullName: user?.fullName,
                        email: user?.email,
                        phone: user?.phone,
                        gender: user?.gender,
                        dob: formatDateForInput(user?.dob),
                        allergies: user?.allergies,
                        medicalHistory: user?.medicalHistory
                      })
                    }}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                  {/* <Button 
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Reset mật khẩu
                </Button> */}
                  {/* <Button 
                    variant={user.isActive ? "destructive" : "default"}
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                  >
                    {isTogglingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : user.isActive ? (
                      <Lock className="mr-2 h-4 w-4" />
                    ) : (
                      <Unlock className="mr-2 h-4 w-4" />
                    )}
                    {user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                  </Button> */}
                  {/* <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={loading || isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </Button> */}
                </>
              )}
            </div>
          </div>

          {/* User Info Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.fullName || ""}
                      onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="text-sm">{user.fullName || "Chưa cập nhật"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                  {isEditing ? (
                    <select
                      value={editData.gender || ""}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  ) : (
                    <p className="text-sm">{user.gender || "Chưa cập nhật"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ""}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="text-sm">{user.email || "Chưa cập nhật"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ""}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="text-sm">{user.phone || "Chưa cập nhật"}</p>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.dob || ""}
                      onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="text-sm">{formatDate(user.dob)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Dị ứng</label>
                  {isEditing ? (
                    <textarea
                      value={editData.allergies || ""}
                      onChange={(e) => setEditData({ ...editData, allergies: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm">{user.allergies || "Không có"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tiền sử bệnh lý</label>
                  {isEditing ? (
                    <textarea
                      value={editData.medicalHistory || ""}
                      onChange={(e) => setEditData({ ...editData, medicalHistory: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm">{user.medicalHistory || "Không có"}</p>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Role & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Vai trò & Trạng thái
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Vai trò</label>
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? (
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
                {/* <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">ID bệnh nhân</label>
                  <p className="text-sm font-mono">{user.userId}</p>
                </div> */}

              </CardContent>
            </Card>


          </div>

          {/* Medical History */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Lịch sử y tế
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Tiền sử bệnh lý</label>
                {isEditing ? (
                  <textarea
                    value={editData.medicalHistory || ""}
                    onChange={(e) => setEditData({...editData, medicalHistory: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                    placeholder="Nhập tiền sử bệnh lý..."
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {user.medicalHistory || "Không có thông tin"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card> */}
        </div>
      </ClientOnly>
    </DashboardLayout>
  )
}
