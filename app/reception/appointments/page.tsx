"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, UserPlus, Activity, Plus, Clock, Loader2, AlertCircle, X, MessageCircle, FileText } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"
import { CancelAppointmentModal } from "@/components/cancel-appointment-modal"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"
import { RoleGuard } from "@/components/role-guard"

export default function ReceptionAppointmentsPage() {
  // Get reception navigation from centralized config
  const navigation = getReceptionNavigation()

  const router = useRouter()
  const [appointments, setAppointments] = useState<AppointmentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    appointment: AppointmentDto | null
  }>({ isOpen: false, appointment: null })
  // Search / Sort / Pagination state
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc">("date_desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

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

        // Hiển thị TẤT CẢ lịch (bao gồm đã xác nhận và đã hủy)
        setAppointments(data || [])
      } catch (err: any) {
        console.error('❌ [ERROR] Failed to fetch appointments:', err)
        setError(err.message || 'Không thể tải danh sách lịch hẹn')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [])

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

        // Hiển thị TẤT CẢ lịch (bao gồm đã xác nhận và đã hủy)
        setAppointments(data || [])
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
    return status === 'Pending' || status === 'Confirmed'
  }

  // Nhóm theo trạng thái
  const confirmedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "confirmed")
  const completedAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "completed")
  const cancelledAppointments = appointments.filter((a) => (a.status || "").toLowerCase() === "cancelled")

  // Helpers: filter + sort + paginate
  const applyFilterSortPaginate = (list: AppointmentDto[]) => {
    // Search by patient name, phone, doctor, code
    const q = search.trim().toLowerCase()
    let filtered = !q
      ? list
      : list.filter(a => {
        return (
          a.patientName?.toLowerCase().includes(q) ||
          a.patientPhone?.toLowerCase().includes(q) ||
          a.doctorName?.toLowerCase().includes(q) ||
          String(a.appointmentId).toLowerCase().includes(q)
        )
      })

    // Sort by date
    filtered = filtered.sort((a, b) => {
      const ta = new Date(a.appointmentDate).getTime()
      const tb = new Date(b.appointmentDate).getTime()
      return sortBy === "date_desc" ? tb - ta : ta - tb
    })

    // Pagination
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const currentPage = Math.min(page, totalPages)
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    const items = filtered.slice(start, end)

    return { items, total, totalPages, currentPage }
  }

  const renderList = (list: AppointmentDto[]) => {
    const { items, total, totalPages, currentPage } = applyFilterSortPaginate(list)

    return (
      <>
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Không có lịch hẹn nào</p>
            </CardContent>
          </Card>
        ) : (
          items.map((appointment) => (
            <AppointmentCard key={appointment.appointmentId} appointment={appointment} />
          ))
        )}

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * pageSize + (items.length ? 1 : 0)}-
            {(currentPage - 1) * pageSize + items.length} / {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(1)}>
              «
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Trước
            </Button>
            <span className="text-sm">
              Trang {currentPage}/{totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Sau
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
              »
            </Button>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(parseInt(v)); setPage(1) }}>
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue placeholder="Kích thước" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / trang</SelectItem>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    )
  }

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
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {canCancel(appointment) && (
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
    <RoleGuard allowedRoles="reception">
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
              <TabsTrigger value="confirmed">Đã xác nhận ({confirmedAppointments.length})</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành ({completedAppointments.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Đã hủy ({cancelledAppointments.length})</TabsTrigger>
            </TabsList>

            {/* Search & Sort */}
            <div className="flex items-center justify-between gap-2">
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Tìm theo tên bệnh nhân / SĐT / bác sĩ / mã lịch..."
                className="max-w-md"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sắp xếp:</span>
                <Select value={sortBy} onValueChange={(v: any) => { setSortBy(v); setPage(1) }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Mới nhất</SelectItem>
                    <SelectItem value="date_asc">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              {renderList(appointments)}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              {renderList(confirmedAppointments)}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {renderList(completedAppointments)}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {renderList(cancelledAppointments)}
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
            skipFourHourCheck={true}
          />
        )}
      </div>
    </DashboardLayout>
    </RoleGuard>
  )
}
