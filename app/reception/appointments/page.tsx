"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, UserPlus, Activity, Plus, Clock, Loader2, AlertCircle, X, MessageCircle, FileText } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"
import { CancelAppointmentModal } from "@/components/cancel-appointment-modal"

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/reception/records", icon: FileText },
  { name: "Chat hỗ trợ", href: "/reception/chat", icon: MessageCircle },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function ReceptionAppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    appointment: AppointmentDto | null
  }>({ isOpen: false, appointment: null })

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Thử lấy tất cả lịch hẹn trước, nếu không được thì lấy của receptionist
        let data: AppointmentDto[] = []
        try {
          data = await appointmentService.getAllAppointments()
        } catch (err) {
          console.warn('Không thể lấy tất cả lịch hẹn, thử lấy lịch hẹn của receptionist:', err)
          data = await appointmentService.getMyReceptionistAppointments()
        }

        setAppointments(data)
      } catch (err: any) {
        console.error('❌ [ERROR] Failed to fetch appointments:', err)
        setError(err.message || 'Không thể tải danh sách lịch hẹn')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  // Debug: Log appointments để kiểm tra
  console.log('📋 [DEBUG] All appointments:', appointments)
  console.log('📋 [DEBUG] Appointments count:', appointments.length)
  appointments.forEach((apt, index) => {
    console.log(`📋 [DEBUG] Appointment ${index}:`, {
      id: apt.appointmentId,
      patientName: apt.patientName,
      doctorName: apt.doctorName,
      date: apt.appointmentDate,
      status: apt.status
    })
  })

  const handleCancel = (appointment: AppointmentDto) => {
    setCancelModal({ isOpen: true, appointment })
  }

  const handleCancelSuccess = () => {
    // Reload appointments
    const fetchAppointments = async () => {
      try {
        setIsLoading(true)
        setError(null)

        let data: AppointmentDto[] = []
        try {
          data = await appointmentService.getAllAppointments()
        } catch (err) {
          console.warn('Không thể lấy tất cả lịch hẹn, thử lấy lịch hẹn của receptionist:', err)
          data = await appointmentService.getMyReceptionistAppointments()
        }

        setAppointments(data)
      } catch (err: any) {
        console.error('❌ [ERROR] Failed to fetch appointments:', err)
        setError(err.message || 'Không thể tải danh sách lịch hẹn')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }

  const canCancel = (appointment: AppointmentDto) => {
    const status = appointment.status
    // Backend valid statuses: "Pending", "Confirmed", "Completed", "Cancelled", "No-Show"
    // Note: Actual 4-hour rule check is done in CancelAppointmentModal
    const canCancelResult = status === 'Pending' || status === 'Confirmed'

    // Debug logging
    console.log('🔍 [DEBUG] canCancel check:', {
      appointmentId: appointment.appointmentId,
      status: appointment.status,
      canCancel: canCancelResult,
      note: 'Backend valid statuses: Pending, Confirmed, Completed, Cancelled, No-Show. 4-hour rule checked in modal.'
    })

    return canCancelResult
  }

  // Lọc lịch hẹn theo status - Sử dụng backend valid statuses
  const scheduledAppointments = appointments.filter((a) =>
    a.status === "Pending" ||
    a.status === "Confirmed"
  )
  const inProgressAppointments = appointments.filter((a) =>
    a.status === "In-Progress" // Nếu có status này
  )
  const completedAppointments = appointments.filter((a) =>
    a.status === "Completed"
  )
  const cancelledAppointments = appointments.filter((a) =>
    a.status === "Cancelled"
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="secondary">Chưa xác nhận</Badge>

    switch (status) {
      case 'Pending':
        return <Badge variant="secondary">Chờ xử lý</Badge>
      case 'Confirmed':
        return <Badge variant="default" className="bg-green-500">Đã xác nhận</Badge>
      case 'Completed':
        return <Badge variant="default" className="bg-blue-500">Hoàn thành</Badge>
      case 'Cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      case 'No-Show':
        return <Badge variant="outline" className="bg-orange-500">Không đến</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const AppointmentCard = ({ appointment }: { appointment: AppointmentDto }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{appointment.patientName || 'Không có tên'}</h3>
                  <Badge variant="outline">APT{appointment.appointmentId.toString().padStart(3, '0')}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(appointment.appointmentDate)}</span>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{formatTime(appointment.appointmentDate)}</span>
                </div>
              </div>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Bác sĩ: </span>
                <span className="text-sm text-muted-foreground">{appointment.doctorName || 'Không có tên'}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Khoa: </span>
                <span className="text-sm text-muted-foreground">{appointment.doctorSpecialty || 'Không có thông tin'}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Lý do: </span>
                <span className="text-sm text-muted-foreground">{appointment.reasonForVisit || 'Không có thông tin'}</span>
              </div>
              {appointment.patientPhone && (
                <div>
                  <span className="text-sm font-medium">SĐT: </span>
                  <span className="text-sm text-muted-foreground">{appointment.patientPhone}</span>
                </div>
              )}
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-2">
                <div>Status: {appointment.status || 'null'}</div>
                <div>Patient ID: {appointment.patientId}</div>
                <div>Doctor ID: {appointment.doctorId}</div>
                {appointment.receptionistId && <div>Receptionist ID: {appointment.receptionistId}</div>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button size="sm" onClick={() => router.push(`/reception/appointments/${appointment.appointmentId}`)}>
              Chi tiết
            </Button>
            {(() => {
              const canCancelResult = canCancel(appointment)
              console.log('🔍 [DEBUG] AppointmentCard render:', {
                appointmentId: appointment.appointmentId,
                status: appointment.status,
                canCancel: canCancelResult,
                willRenderButton: canCancelResult
              })
              return canCancelResult
            })() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(appointment)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Hủy lịch
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Kiểm tra authentication
  if (!user) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Cần đăng nhập</h2>
              <p className="text-muted-foreground">
                Vui lòng đăng nhập với tài khoản Lễ tân để truy cập trang này.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (user.role !== 'reception') {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-orange-500 mb-4">
                <Users className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
              <p className="text-muted-foreground">
                Chỉ tài khoản Lễ tân mới có thể truy cập trang này.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý lịch hẹn</h1>
            <p className="text-muted-foreground">Xem và quản lý lịch hẹn của bệnh nhân</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Làm mới
            </Button>
            <Button onClick={() => router.push("/reception/appointments/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Đặt lịch mới
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Đang tải danh sách lịch hẹn...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Tất cả ({appointments.length})</TabsTrigger>
              <TabsTrigger value="scheduled">Đã đặt ({scheduledAppointments.length})</TabsTrigger>
              <TabsTrigger value="in-progress">Đang khám ({inProgressAppointments.length})</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành ({completedAppointments.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Đã hủy ({cancelledAppointments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Không có lịch hẹn nào</p>
                  </CardContent>
                </Card>
              ) : (
                appointments.map((appointment) => (
                  <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {scheduledAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Không có lịch hẹn nào</p>
                  </CardContent>
                </Card>
              ) : (
                scheduledAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4">
              {inProgressAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Không có lịch hẹn đang khám</p>
                  </CardContent>
                </Card>
              ) : (
                inProgressAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Không có lịch hẹn hoàn thành</p>
                  </CardContent>
                </Card>
              ) : (
                completedAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Không có lịch hẹn đã hủy</p>
                  </CardContent>
                </Card>
              ) : (
                cancelledAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Cancel Modal */}
        {cancelModal.appointment && (
          <CancelAppointmentModal
            isOpen={cancelModal.isOpen}
            onClose={() => setCancelModal({ isOpen: false, appointment: null })}
            appointment={cancelModal.appointment}
            onSuccess={handleCancelSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
