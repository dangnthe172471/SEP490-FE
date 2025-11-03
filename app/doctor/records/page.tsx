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
import { getDoctorNavigation } from "@/lib/navigation"

interface MedicalRecord {
  recordId: number
  doctorNotes: string
  diagnosis: string
  createdAt: string
  appointmentId: number
  appointment: {
    appointmentId: number
    appointmentDate: string
    doctorId: number
    patientId: number
    status: string
    reasonForVisit?: string
  }
  internalMedRecord?: {
    bloodPressure?: number
    heartRate?: number
    bloodSugar?: number
    notes?: string
  }
  prescriptions?: any[]
  testResults?: any[]
  payments?: any[]
}

interface AppointmentDetail {
  patientName: string
  patientPhone: string
  doctorName: string
  doctorSpecialty: string
  status: string
  reasonForVisit: string
  appointmentDate?: string
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
  const navigation = getDoctorNavigation()

  const router = useRouter()
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
  const [appointmentCache, setAppointmentCache] = useState<Record<number, AppointmentDetail>>({})

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch("https://localhost:7168/api/MedicalRecord")
        if (!res.ok) throw new Error("Failed to fetch records")
        const data = await res.json()
        // song song fetch thêm dữ liệu từ appointment và user
        const enriched = await Promise.all(
          data.map(async (r: MedicalRecord) => {
            // 1) Appointment info (cache by appointmentId)
            let appointmentInfo = appointmentCache[r.appointmentId]
            if (!appointmentInfo) {
              const aRes = await fetch(`https://localhost:7168/api/Appointments/${r.appointmentId}`)
              appointmentInfo = await aRes.json()
              setAppointmentCache((prev) => ({ ...prev, [r.appointmentId]: appointmentInfo }))
            }

            // 2) Patient info (via PatientId from record.appointment)
            const patientId = r?.appointment?.patientId
            let patientData = patientId ? patientCache[patientId] : undefined
            if (!patientData && patientId) {
              // Step 1: get Patient to retrieve userId
              const pRes = await fetch(`https://localhost:7168/api/Patient/${patientId}`)
              if (!pRes.ok) throw new Error("Không thể lấy dữ liệu Patient")
              const patientRaw = await pRes.json()
              const userId = patientRaw?.userId ?? patientRaw?.UserId
              if (!userId) throw new Error("Không tìm thấy userId trong Patient")

              // Step 2: get User details
              const uRes = await fetch(`https://localhost:7168/api/Users/${userId}`)
              if (!uRes.ok) throw new Error("Không thể lấy dữ liệu User")
              const userRaw = await uRes.json()

              // Merge normalized fields for FE display
              patientData = {
                fullName: userRaw.fullName ?? userRaw.FullName ?? "",
                gender: userRaw.gender ?? userRaw.Gender ?? "",
                dob: userRaw.dob ?? userRaw.Dob ?? "",
                phone: userRaw.phone ?? userRaw.Phone ?? "",
                email: userRaw.email ?? userRaw.Email ?? "",
                allergies: patientRaw.allergies ?? patientRaw.Allergies ?? "",
                medicalHistory: patientRaw.medicalHistory ?? patientRaw.MedicalHistory ?? "",
              }
              setPatientCache((prev) => ({ ...prev, [patientId]: patientData! }))
            }

            return {
              ...r,
              appointmentInfo,
              patientData,
            }
          })
        )

        setRecords(enriched)
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

            <Button
              size="sm"
              className="ml-4"
              onClick={() => router.push(`/doctor/records/view/${record.recordId}`)}
            >
              Xem chi tiết
            </Button>
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
