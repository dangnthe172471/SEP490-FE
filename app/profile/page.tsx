"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPaymentStatus } from "@/lib/services/payment-service"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit3,
  Shield,
  Heart,
  Clock,
  Stethoscope,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
  Home,
  MessageCircle,
  Camera,
} from "lucide-react"
import { getCurrentUser, logout, User as UserType } from "@/lib/auth"
import { showConfirmAlert } from "@/lib/sweetalert-config"
import { authService } from "@/lib/services/auth.service"
import { avatarService } from "@/lib/services/avatar.service"
import { medicalHistoryService, MedicalRecord } from "@/lib/services/medical-history.service"
import { toast } from "sonner"
import { BasicInfoEditModal } from "@/components/basic-info-edit-modal"
import { MedicalInfoEditModal } from "@/components/medical-info-edit-modal"
import { ChangeAvatarModal } from "@/components/change-avatar-modal"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { Breadcrumb } from "@/components/breadcrumb"

interface PatientProfile {
  userId: number
  phone?: string
  fullName?: string
  email?: string
  role?: string
  gender?: string
  dob?: string
  allergies?: string
  medicalHistory?: string
  avatar?: string
}

interface Appointment {
  id: number
  date: string
  time: string
  doctor: string
  department: string
  status: string
  notes?: string
}

function PaymentStatusButton({ recordId }: { recordId: number }) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "paid" | "unpaid">("loading")

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await getPaymentStatus(recordId)
        setStatus(res.status === "Paid" ? "paid" : "unpaid")
      } catch {
        setStatus("unpaid")
      }
    }
    fetchStatus()
  }, [recordId])

  if (status === "loading") {
    return <Badge className="bg-yellow-100 text-yellow-700">Đang kiểm tra thanh toán...</Badge>
  }

  if (status === "paid") {
    return <Badge className="bg-green-100 text-green-700">✓ Đã thanh toán</Badge>
  }

  return (
    <Button
      className="w-full bg-primary text-white"
      onClick={() => router.push(`/payment?medicalRecordId=${recordId}`)}
    >
      Thanh toán
    </Button>
  )
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false)
  const [isMedicalInfoModalOpen, setIsMedicalInfoModalOpen] = useState(false)
  const [isChangeAvatarModalOpen, setIsChangeAvatarModalOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [currentAvatar, setCurrentAvatar] = useState("/placeholder-user.jpg")
  const [payableRecordId, setPayableRecordId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkRecords() {
      for (const record of medicalRecords) {
        const res = await getPaymentStatus(record.recordId)

        if (res.status !== "Paid") {
          setPayableRecordId(record.recordId)
          return
        }
      }

      setPayableRecordId(null) // tất cả đã thanh toán
    }

    if (medicalRecords.length > 0) {
      checkRecords()
    }
  }, [medicalRecords])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/")
      return
    }
    setCurrentUser(user)
    fetchPatientData()
  }, [router])

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const user = getCurrentUser()
      if (!user) {
        // Clear all data and redirect
        setPatientProfile(null)
        setAppointments([])
        setMedicalRecords([])
        setCurrentUser(null)
        router.push("/")
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [router])

  const fetchPatientData = async () => {
    try {
      setIsLoading(true)

      // Check if user still exists
      const user = getCurrentUser()
      if (!user) {
        setPatientProfile(null)
        setAppointments([])
        setMedicalRecords([])
        setCurrentUser(null)
        router.push("/")
        return
      }

      // Fetch patient profile from API only
      try {
        const profile = await authService.getProfile()
        setPatientProfile(profile)

        // Set avatar from profile data
        const avatarUrl = avatarService.getAvatarUrl(profile.avatar)
        setCurrentAvatar(avatarUrl)

        // Store avatar in localStorage for navbar
        if (profile.avatar) {
          localStorage.setItem("user_avatar", profile.avatar)
        } else {
          localStorage.removeItem("user_avatar")
        }
      } catch (apiError) {
        console.error("API Error:", apiError)
        toast.error("Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.")
      }

      // Set empty arrays for appointments
      setAppointments([])

      // Fetch medical records from API
      try {
        const records = await medicalHistoryService.getMedicalHistory(parseInt(user.id))
        setMedicalRecords(records)
      } catch (error) {
        console.error("Error fetching medical records:", error)
        setMedicalRecords([])
      }
    } catch (error) {
      console.error("Error fetching patient data:", error)
      toast.error("Không thể tải thông tin bệnh nhân")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const result = await showConfirmAlert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")

    if (result.isConfirmed) {
      setPatientProfile(null)
      setAppointments([])
      setMedicalRecords([])
      setCurrentUser(null)

      logout()
      router.push("/")
    }
  }

  const handleSaveBasicInfo = (updatedInfo: any) => {
    if (patientProfile) {
      setPatientProfile({
        ...patientProfile,
        fullName: updatedInfo.fullName,
        email: updatedInfo.email,
        phone: updatedInfo.phone,
        dob: updatedInfo.dob,
        gender: updatedInfo.gender,
      })
    }
    fetchPatientData()
  }

  const handleSaveMedicalInfo = (updatedInfo: any) => {
    if (patientProfile) {
      setPatientProfile({
        ...patientProfile,
        allergies: updatedInfo.allergies,
        medicalHistory: updatedInfo.medicalHistory,
      })
    }
    fetchPatientData()
  }

  const handleAvatarChange = (newAvatarUrl: string) => {
    const avatarUrl = avatarService.getAvatarUrl(newAvatarUrl)
    setCurrentAvatar(avatarUrl)

    localStorage.setItem("user_avatar", newAvatarUrl)
    window.dispatchEvent(new Event("storage"))

    toast.success("Ảnh đại diện đã được cập nhật!")
  }

  const handlePasswordChange = () => {
    toast.success("Mật khẩu đã được thay đổi thành công!")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã hoàn thành":
        return "bg-green-100 text-green-800"
      case "Đã đặt lịch":
        return "bg-blue-100 text-blue-800"
      case "Đã hủy":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || !patientProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Không tìm thấy thông tin bệnh nhân</p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb
              items={[
                {
                  label: "Hồ sơ bệnh nhân",
                  isActive: true,
                },
              ]}
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Quay lại</span>
              </Button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Hồ sơ bệnh nhân</h1>
                <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                  Quản lý thông tin cá nhân và lịch sử khám bệnh
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBasicInfoModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                <span className="hidden sm:inline">Thông tin cơ bản</span>
                <span className="sm:hidden">Cơ bản</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMedicalInfoModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Thông tin y tế</span>
                <span className="sm:hidden">Y tế</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={currentAvatar} alt={patientProfile.fullName} />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {patientProfile.fullName?.charAt(0).toUpperCase() || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 border-2 border-background"
                      onClick={() => setIsChangeAvatarModalOpen(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    {patientProfile.fullName || "Chưa cập nhật"}
                  </h2>
                  <Badge variant="secondary" className="mb-4">
                    <Shield className="h-3 w-3 mr-1" />
                    Bệnh nhân
                  </Badge>
                  <p className="text-sm text-muted-foreground">ID: {patientProfile.userId}</p>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="w-full flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Đổi mật khẩu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/chat")}
                      className="w-full flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat hỗ trợ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/")}
                      className="w-full flex items-center gap-2"
                    >
                      <Home className="h-4 w-4" />
                      Về trang chủ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Thống kê nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lần khám gần nhất</span>
                  <span className="font-medium">
                    {appointments[0]?.date ? formatDate(appointments[0].date) : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tổng số lần khám</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lịch hẹn sắp tới</span>
                  <span className="font-medium">
                    {appointments.filter((apt) => apt.status === "Đã đặt lịch").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
                {/* <TabsTrigger value="appointments">Lịch hẹn</TabsTrigger> */}
                <TabsTrigger value="medical">Lịch sử khám</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{patientProfile.fullName || "Chưa cập nhật"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{patientProfile.gender || "Chưa cập nhật"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{patientProfile.phone || "Chưa cập nhật"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{patientProfile.email || "Chưa cập nhật"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {patientProfile.dob ? formatDate(patientProfile.dob) : "Chưa cập nhật"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Thông tin y tế
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Dị ứng</label>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <span>{patientProfile.allergies || "Không có thông tin"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Bệnh lý nền</label>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <span>{patientProfile.medicalHistory || "Không có thông tin"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Lịch hẹn khám
                    </CardTitle>
                    <CardDescription>Danh sách các lịch hẹn khám bệnh của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appointments.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Chưa có lịch hẹn nào</p>
                        </div>
                      ) : (
                        appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{appointment.doctor}</h3>
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(appointment.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" />
                                <span>{appointment.department}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{appointment.notes}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Medical Records Tab */}
              <TabsContent value="medical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Lịch sử khám bệnh
                        </CardTitle>
                        <CardDescription>Hồ sơ khám bệnh và điều trị của bạn</CardDescription>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => router.push("/medical-history")}
                          variant="outline"
                          className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
                        >
                          <FileText className="h-4 w-4" />
                          Xem chi tiết
                        </Button>

                        {payableRecordId ? (
                          <Button
                            onClick={() =>
                              router.push(`/thanh-toan?medicalRecordId=${payableRecordId}`)
                            }
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            Thanh toán
                          </Button>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 py-2 px-3">
                            ✓ Tất cả đã thanh toán
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {medicalRecords.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Chưa có hồ sơ khám bệnh</p>
                        </div>
                      ) : (
                        medicalRecords.map((record) => (
                          <div
                            key={record.recordId}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">{record.doctorName}</h3>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(record.appointmentDate)}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {/* Chẩn đoán */}
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                  Chẩn đoán
                                </label>
                                <p className="mt-1">{record.diagnosis || "Chưa có thông tin"}</p>
                              </div>

                              {/* Ghi chú bác sĩ */}
                              {record.doctorNotes && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Ghi chú bác sĩ
                                  </label>
                                  <p className="mt-1">{record.doctorNotes}</p>
                                </div>
                              )}

                              {/* Đơn thuốc */}
                              {record.prescriptions && record.prescriptions.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">
                                    Đơn thuốc
                                  </label>
                                  <div className="mt-1 space-y-2">
                                    {record.prescriptions.map((prescription) => (
                                      <div
                                        key={prescription.prescriptionId}
                                        className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400"
                                      >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                          <div>
                                            <p className="font-medium">
                                              {prescription.doctorName}
                                            </p>
                                            {prescription.prescriptionDetails.map((detail) => (
                                              <p
                                                key={detail.prescriptionDetailId}
                                                className="text-xs"
                                              >
                                                {detail.medicineName} - {detail.dosage} (
                                                {detail.duration})
                                              </p>
                                            ))}
                                          </div>

                                          {/* NÚT XEM CHI TIẾT ĐƠN THUỐC – CÓ MÀU & ĐÚNG ROUTE */}
                                          <Button
                                            size="sm"
                                            className="mt-1 md:mt-0 shrink-0 bg-primary text-white hover:bg-primary/90"
                                            onClick={() =>
                                              router.push(
                                                `/doctor/prescriptions/${prescription.prescriptionId}`
                                              )
                                            }
                                          >
                                            Xem chi tiết đơn thuốc
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Nếu sau này cần hiện trạng thái thanh toán theo record */}
                              {/* <PaymentStatusButton recordId={record.recordId} /> */}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Basic Info Edit Modal */}
      {patientProfile && (
        <BasicInfoEditModal
          isOpen={isBasicInfoModalOpen}
          onClose={() => setIsBasicInfoModalOpen(false)}
          basicInfo={{
            fullName: patientProfile.fullName || "",
            email: patientProfile.email || "",
            phone: patientProfile.phone || "",
            dob: patientProfile.dob || "",
            gender: patientProfile.gender || "",
          }}
          onSave={handleSaveBasicInfo}
        />
      )}

      {/* Medical Info Edit Modal */}
      {patientProfile && (
        <MedicalInfoEditModal
          isOpen={isMedicalInfoModalOpen}
          onClose={() => setIsMedicalInfoModalOpen(false)}
          medicalInfo={{
            allergies: patientProfile.allergies || "",
            medicalHistory: patientProfile.medicalHistory || "",
          }}
          onSave={handleSaveMedicalInfo}
        />
      )}

      {/* Change Avatar Modal */}
      <ChangeAvatarModal
        isOpen={isChangeAvatarModalOpen}
        onClose={() => setIsChangeAvatarModalOpen(false)}
        currentAvatar={currentAvatar}
        userName={patientProfile?.fullName || "User"}
        onAvatarChange={handleAvatarChange}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onPasswordChange={handlePasswordChange}
      />

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => router.push("/")}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        >
          <Home className="h-5 w-5 mr-2" />
          Về trang chủ
        </Button>
      </div>
    </div>
  )
}
