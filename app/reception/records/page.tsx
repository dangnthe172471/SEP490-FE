"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Users, Activity, Plus, MessageCircle, UserPlus, HeartPulse, Loader2 } from "lucide-react"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"

import { MedicalRecordService } from "@/lib/services/medical-record-service"
import { appointmentService } from "@/lib/services/appointment-service"
import { patientService } from "@/lib/services/patient-service"
import { userService } from "@/lib/services/user.service"
import { RoleGuard } from "@/components/role-guard"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { createPayment2, getPaymentStatus, getPaymentDetails } from "@/lib/services/payment-service";
import { PaymentDetailsResponse, PaymentDetailsItem } from "@/lib/types/payment";
import type { DoctorInfoDto } from "@/lib/types/appointment";


interface MedicalRecord {
  recordId: number
  doctorNotes: string
  diagnosis: string
  createdAt?: string | null
  appointmentId: number
  appointment?: {
    appointmentId: number
    appointmentDate?: string | null
    doctorId: number
    patientId: number
    status?: string | null
    reasonForVisit?: string | null
  } | null
  internalMedRecord?: {
    bloodPressure?: number | null
    heartRate?: number | null
    bloodSugar?: number | null
    notes?: string | null
  } | null
  prescriptions?: any[]
  testResults?: any[]
  payments?: any[]
  appointmentInfo?: AppointmentDetail
  patientData?: PatientDetail
}

interface AppointmentDetail {
  appointmentDate?: string
  patientName: string
  patientPhone: string
  doctorName: string
  doctorSpecialty: string
  status: string
  reasonForVisit: string
}

interface PatientDetail {
  fullName: string
  gender: string
  dob: string
  phone: string
  email: string
  allergies: string
  medicalHistory: string
}

export default function DoctorRecordsPage() {
  // Get reception navigation from centralized config
  const navigation = getReceptionNavigation()

  const router = useRouter()
  const [allRecords, setAllRecords] = useState<MedicalRecord[]>([]) // Tất cả records từ API
  const [loading, setLoading] = useState(true)
  const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
  const [appointmentCache, setAppointmentCache] = useState<Record<number, AppointmentDetail>>({})

  // Filter states
  const [search, setSearch] = useState("") // Tên bệnh nhân
  const [diagnosis, setDiagnosis] = useState("") // Chẩn đoán
  const [doctorId, setDoctorId] = useState<string>("") // Bác sĩ
  const [paymentStatus, setPaymentStatus] = useState<string>("all") // Trạng thái thanh toán
  const [from, setFrom] = useState("") // yyyy-MM-dd
  const [to, setTo] = useState("")     // yyyy-MM-dd
  
  // Doctors list
  const [doctors, setDoctors] = useState<DoctorInfoDto[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  
  // Pagination states
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(12) // Giống doctor page
//Payment
const [paymentLoadingId, setPaymentLoadingId] = useState<number | null>(null);

const handlePayNow = async (recordId: number) => {
  setPaymentLoadingId(recordId);
  try {
    // Lấy chi tiết dịch vụ để build payload
    const details = await getPaymentDetails(recordId);
    if (!details || !details.items || details.items.length === 0) {
      alert("Hồ sơ này chưa có thông tin dịch vụ để thanh toán.");
      return;
    }

    const services: PaymentDetailsItem[] = details.items;
    const total =
      details.totalAmount ??
      services.reduce((sum, item) => sum + item.total, 0);

    const payload = {
      medicalRecordId: recordId,
      amount: total,
      description: "Thanh toán lịch khám tại quầy",
      items: services.map((s) => ({
        name: s.name,
        quantity: s.quantity,
        price: s.unitPrice,
      })),
    };

    const res = await createPayment2(payload);

    window.location.href = res.checkoutUrl;
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "Không thể tạo thanh toán");
  } finally {
    setPaymentLoadingId(null);
  }
};





  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await MedicalRecordService.getAll()

        // song song fetch thêm dữ liệu từ appointment và user
        const enriched = await Promise.all(
          data.map(async (r) => {
            // Fetch appointment info
            let appointmentInfo = appointmentCache[r.appointmentId]
            if (!appointmentInfo) {
              const appointmentDto = await appointmentService.getById(r.appointmentId)
              // Map AppointmentDto to AppointmentDetail
              appointmentInfo = {
                appointmentDate: appointmentDto.appointmentDate || "",
                patientName: appointmentDto.patientName || "",
                patientPhone: appointmentDto.patientPhone || "",
                doctorName: appointmentDto.doctorName || "",
                doctorSpecialty: appointmentDto.doctorSpecialty || "",
                status: appointmentDto.status || "",
                reasonForVisit: appointmentDto.reasonForVisit || "",
              }
              setAppointmentCache((prev) => ({ ...prev, [r.appointmentId]: appointmentInfo }))
            }
            
            // Fetch patient info
            const patientId = r?.appointment?.patientId
            let patientData = patientId ? patientCache[patientId] : undefined
            if (!patientData && patientId) {
              const patient = await patientService.getById(patientId);
              const userId = patient?.userId;
              if (!userId) throw new Error("Không tìm thấy userId trong Patient");

              const userData = await userService.fetchUserById(userId);

              // 🔹 3. Gộp dữ liệu Patient và User (tuỳ ý)
              patientData = {
                fullName: userData.fullName ?? "",
                gender: userData.gender ?? "",
                dob: userData.dob ?? "",
                phone: userData.phone ?? "",
                email: userData.email ?? "",
                allergies: patient.allergies ?? "",
                medicalHistory: patient.medicalHistory ?? "",
              };

              // 🔹 4. Lưu vào cache
              setPatientCache((prev) => ({ ...prev, [patientId]: patientData! }))
            }
            return {
              ...r,
              doctorNotes: r.doctorNotes ?? "",
              diagnosis: r.diagnosis ?? "",
              appointmentInfo,
              patientData,
              internalMedRecord: r.internalMedRecord ? {
                bloodPressure: r.internalMedRecord.bloodPressure ?? undefined,
                heartRate: r.internalMedRecord.heartRate ?? undefined,
                bloodSugar: r.internalMedRecord.bloodSugar ?? undefined,
                notes: r.internalMedRecord.notes ?? undefined,
              } : null,
            }
          })
        )

        setAllRecords(enriched as MedicalRecord[])
      } catch (error) {
        console.error("Error fetching records:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  // Load doctors list
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true)
        const result = await appointmentService.getPagedDoctors(1, 1000) // Lấy tất cả
        setDoctors(result.data || [])
      } catch (error) {
        console.error("Error loading doctors:", error)
      } finally {
        setLoadingDoctors(false)
      }
    }
    loadDoctors()
  }, [])

  // Filter logic
  const filteredRecords = useMemo(() => {
    let filtered = [...allRecords]

    // Filter by search (tên bệnh nhân)
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((record) => {
        const patientName = record.patientData?.fullName?.toLowerCase() || ""
        return patientName.includes(searchLower)
      })
    }

    // Filter by diagnosis
    if (diagnosis.trim()) {
      const diagnosisLower = diagnosis.toLowerCase()
      filtered = filtered.filter((record) => {
        const recordDiagnosis = record.diagnosis?.toLowerCase() || ""
        return recordDiagnosis.includes(diagnosisLower)
      })
    }

    // Filter by doctor
    if (doctorId && doctorId !== "all") {
      const selectedDoctorId = parseInt(doctorId)
      filtered = filtered.filter((record) => {
        const appointmentDoctorId = record.appointment?.doctorId
        return appointmentDoctorId === selectedDoctorId
      })
    }

    // Filter by payment status (reception only)
    // Note: Payment status is fetched per record, so this filter is applied after records are loaded
    // For now, we'll skip this filter in the main logic as it requires async payment status checks

    // Filter by date range
    if (from) {
      const fromDate = new Date(from)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((record) => {
        const appointmentDate = record.appointmentInfo?.appointmentDate
        if (!appointmentDate) return false
        const recordDate = new Date(appointmentDate)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate >= fromDate
      })
    }

    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((record) => {
        const appointmentDate = record.appointmentInfo?.appointmentDate
        if (!appointmentDate) return false
        const recordDate = new Date(appointmentDate)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate <= toDate
      })
    }

    return filtered
  }, [allRecords, search, diagnosis, doctorId, paymentStatus, from, to])

  // Pagination logic
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredRecords.length / pageSize)),
    [filteredRecords.length, pageSize]
  )

  const paginatedRecords = useMemo(() => {
    const startIndex = (pageNumber - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredRecords.slice(startIndex, endIndex)
  }, [filteredRecords, pageNumber, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPageNumber(1)
  }, [search, diagnosis, doctorId, paymentStatus, from, to])

  // Nếu chọn "từ ngày" mà chưa có "đến ngày", đặt mặc định = from
  useEffect(() => {
    if (from && !to) setTo(from)
  }, [from, to])

  const onSearch = () => {
    setPageNumber(1)
  }

  const onClearFilters = () => {
    setSearch("")
    setDiagnosis("")
    setDoctorId("")
    setPaymentStatus("all")
    setFrom("")
    setTo("")
    setPageNumber(1)
  }

  const RecordCard = ({ record }: { record: any }) => {
    const p = record.patientData as PatientDetail | undefined
    const a = record.appointmentInfo as AppointmentDetail | undefined
    const med = record.internalMedRecord
      const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getPaymentStatus(record.recordId);
        setPaymentStatus(res.status);  
      } catch (e) {
        setPaymentStatus(null);
      }
    };

    fetchStatus();
  }, [record.recordId]);
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-3">
            {/* Header: bệnh nhân và ID */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{p?.fullName || "Bệnh nhân chưa xác định"}</h3>
              <Badge variant="outline">#{record.recordId}</Badge>
              <Badge variant={a?.status === "Confirmed" ? "default" : "secondary"}>
                {a?.status || "Chưa rõ"}
              </Badge>
            </div>

            {/* Thông tin bệnh nhân */}
            {p && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Giới tính: {p.gender}</p>
                <p>Ngày sinh: {new Date(p.dob).toLocaleDateString("vi-VN")}</p>
                <p>SĐT: {p.phone}</p>
                <p>Email: {p.email}</p>
                <p>Dị ứng: {p.allergies || "Không có"}</p>
                <p>Tiền sử bệnh: {p.medicalHistory || "Không có"}</p>
              </div>
            )}

            {/* Thông tin khám */}
            <div className="mt-3">
              <p className="text-sm font-medium">Ngày khám:{" "}
                <span className="text-muted-foreground">
                  {a?.appointmentDate
                    ? new Date(a.appointmentDate).toLocaleDateString("vi-VN")
                    : "—"}
                </span>
              </p>
              <p className="text-sm font-medium">Bác sĩ phụ trách:{" "}
                <span className="text-muted-foreground">{a?.doctorName || "—"}</span>
              </p>
              <p className="text-sm font-medium">Chuyên khoa:{" "}
                <span className="text-muted-foreground">{a?.doctorSpecialty || "—"}</span>
              </p>
            </div>

            {/* Kết quả & ghi chú */}
            <div className="space-y-1 mt-2">
              <p><strong>Chẩn đoán:</strong> {record.diagnosis || "—"}</p>
              <p><strong>Ghi chú bác sĩ:</strong> {record.doctorNotes || "—"}</p>
            </div>

            {/* Các chỉ số nội khoa */}
            {med && (
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {med.bloodPressure && (
                  <Badge variant="outline">
                    <HeartPulse className="w-4 h-4 mr-1" /> Huyết áp: {med.bloodPressure} mmHg
                  </Badge>
                )}
                {med.heartRate && (
                  <Badge variant="outline">Nhịp tim: {med.heartRate} bpm</Badge>
                )}
                {med.bloodSugar && (
                  <Badge variant="outline">Đường huyết: {med.bloodSugar} mg/dL</Badge>
                )}
              </div>
            )}

            {/* Thông tin khác */}
            <div className="flex flex-wrap gap-2 mt-2">
              {record.prescriptions?.length > 0 && (
                <Badge variant="outline">{record.prescriptions.length} đơn thuốc</Badge>
              )}
              {record.testResults?.length > 0 && (
                <Badge variant="outline">{record.testResults.length} kết quả xét nghiệm</Badge>
              )}
              {record.payments?.length > 0 && (
                <Badge variant="outline">{record.payments.length} giao dịch</Badge>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/reception/records/${record.recordId}`)}
              >
                Xem chi tiết
              </Button>

              {paymentStatus === "Paid" ? (
                <Button
                  size="sm"
                  disabled
                  className="opacity-50 cursor-not-allowed bg-green-500 text-white"
                >
                  Đã thanh toán
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={paymentLoadingId === record.recordId}
                  onClick={() => handlePayNow(record.recordId)}
                >
                  {paymentLoadingId === record.recordId
                    ? "Đang tạo thanh toán..."
                    : "Thanh toán ngay"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <RoleGuard allowedRoles="reception">
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Lọc theo ngày khám, tìm theo tên bệnh nhân</p>
          </div>
          <Badge variant="outline" className="tabular-nums">Tổng: {filteredRecords.length}</Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-sm font-medium block mb-1">Tên bệnh nhân</label>
                <Input
                  placeholder="Nhập tên bệnh nhân…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Chẩn đoán</label>
                <Input
                  placeholder="Nhập chẩn đoán…"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Bác sĩ</label>
                <Select value={doctorId} onValueChange={setDoctorId} disabled={loadingDoctors}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bác sĩ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả bác sĩ</SelectItem>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.doctorId} value={doctor.doctorId.toString()}>
                        {doctor.fullName} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Trạng thái thanh toán</label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">Từ ngày</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Đến ngày</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={onSearch} disabled={loading} className="w-full md:w-auto">
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tìm…</>) : "Tìm kiếm"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  disabled={loading}
                >
                  Xoá lọc
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : paginatedRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {filteredRecords.length === 0 && allRecords.length === 0
                    ? "Không có hồ sơ bệnh án nào"
                    : "Không tìm thấy hồ sơ phù hợp với bộ lọc"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedRecords.map((record) => (
                  <RecordCard key={record.recordId} record={record} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredRecords.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Trang {pageNumber}/{totalPages} • Mỗi trang{" "}
                  <select
                    className="ml-1 border rounded px-2 py-1 text-sm"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1) }}
                  >
                    {[6, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNumber >= totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    </RoleGuard>
  )
}
