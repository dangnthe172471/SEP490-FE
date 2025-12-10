"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Users, Activity, Plus, MessageCircle, UserPlus, HeartPulse } from "lucide-react"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"

import { MedicalRecordService } from "@/lib/services/medical-record-service"
import { appointmentService } from "@/lib/services/appointment-service"
import { patientService } from "@/lib/services/patient-service"
import { userService } from "@/lib/services/user.service"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { createPayment2, getPaymentStatus, getPaymentDetails } from "@/lib/services/payment-service";
import { PaymentDetailsResponse, PaymentDetailsItem } from "@/lib/types/payment";


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
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
  const [appointmentCache, setAppointmentCache] = useState<Record<number, AppointmentDetail>>({})

  
  // Filter states
  const [globalSearch, setGlobalSearch] = useState("") // Search tổng quát
  const [searchName, setSearchName] = useState("")
  const [searchDiagnosis, setSearchDiagnosis] = useState("")
  const [searchDoctor, setSearchDoctor] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined)
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined)
  const [filterWeek, setFilterWeek] = useState<string>("")
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterYear, setFilterYear] = useState<string>("")
  const [filterBloodPressureMin, setFilterBloodPressureMin] = useState<string>("")
  const [filterBloodPressureMax, setFilterBloodPressureMax] = useState<string>("")
  const [filterHeartRateMin, setFilterHeartRateMin] = useState<string>("")
  const [filterHeartRateMax, setFilterHeartRateMax] = useState<string>("")
  const [filterBloodSugarMin, setFilterBloodSugarMin] = useState<string>("")
  const [filterBloodSugarMax, setFilterBloodSugarMax] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
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

        setRecords(enriched as MedicalRecord[])
      } catch (error) {
        console.error("Error fetching records:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

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
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
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
            </div>
            
<div className="flex items-start justify-between">
  <div className="space-y-3 flex-1">
    {/* ... toàn bộ info ... */}
  </div>


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
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Quản lý toàn bộ hồ sơ khám bệnh</p>
          </div>
          {/* <Button onClick={() => router.push("/reception/records/new")}>
            <Plus className="mr-2 h-4 w-4" /> Tạo hồ sơ mới
          </Button> */}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Không có hồ sơ bệnh án nào</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Tất cả ({records.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {records.map((record) => (
                <RecordCard key={record.recordId} record={record} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
