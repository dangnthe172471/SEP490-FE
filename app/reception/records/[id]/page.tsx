"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  FileText,
  Users,
  Activity,
  ArrowLeft,
  Pill,
  TestTube,
  HeartPulse,
  MessageCircle,
  UserPlus
} from "lucide-react"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"

// --- Interfaces định nghĩa cấu trúc dữ liệu ---

interface Appointment {
  appointmentId: number
  appointmentDate: string
  doctorId: number
  patientId: number
  status: string
  reasonForVisit?: string
  // Thêm các trường hiển thị như trong code chi tiết ban đầu (có thể từ API khác hoặc được gộp vào)
  doctorName?: string
  doctorSpecialty?: string
}

interface InternalMedRecord {
  bloodPressure?: number
  heartRate?: number
  bloodSugar?: number
  notes?: string
}

interface Prescription {
  medicationName: string
  dosage: string
  instructions: string
}

interface TestResult {
  testName: string
  resultValue: string
  notes?: string
}

interface Payment {
  amount: number
  paymentDate: string
  method: string
  status: string
}

interface MedicalRecord {
  recordId: number
  doctorNotes: string
  diagnosis: string
  createdAt: string
  appointmentId: number
  appointment: Appointment // Đảm bảo trường này luôn có
  internalMedRecord?: InternalMedRecord
  prescriptions?: Prescription[] // Đảm bảo là mảng các Prescription
  testResults?: TestResult[] // Đảm bảo là mảng các TestResult
  payments?: Payment[] // Đảm bảo là mảng các Payment
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
interface AppointmentDetail {
  appointmentDate: string
  patientName: string
  patientPhone: string
  doctorName: string
  doctorSpecialty: string
  status: string
  reasonForVisit: string
}

export default function MedicalRecordDetailPage() {
  // Get reception navigation from centralized config
  const navigation = getReceptionNavigation()

  const router = useRouter()
  const params = useParams()
  // Ép kiểu id từ params
  const id = params?.id ? String(params.id) : null

  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [patientInfo, setPatientInfo] = useState<PatientDetail | null>(null)
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
  const [appointmentCache, setAppointmentCache] = useState<Record<number, AppointmentDetail>>({})
  useEffect(() => {
    if (!id) return
    const fetchRecord = async () => {
      try {
        // Lấy hồ sơ bệnh án
        const res = await fetch(`https://localhost:7168/api/MedicalRecord/${id}`)
        if (!res.ok) throw new Error("Không thể tải dữ liệu hồ sơ.")
        const data: MedicalRecord = await res.json()
        setRecord(data)

        let appointmentInfo = appointmentCache[data?.appointment?.appointmentId]
        if (!appointmentInfo) {
          const aRes = await fetch(`https://localhost:7168/api/Appointments/${data?.appointment?.appointmentId}`)
          appointmentInfo = await aRes.json()
          setAppointmentCache((prev) => ({ ...prev, [data?.appointment?.appointmentId]: appointmentInfo }))
        }
        // --- Lấy thông tin bệnh nhân từ bảng Users ---
        const patientId = data?.appointment?.patientId
        if (patientId) {
          let patientData = patientCache[patientId]
          try {
            // 🔹 1. Lấy thông tin từ bảng Patient
            const pRes = await fetch(`https://localhost:7168/api/Patient/${patientId}`);
            if (!pRes.ok) throw new Error("Không thể lấy dữ liệu Patient");

            const patient = await pRes.json();

            // 🔹 2. Lấy thông tin User từ userId của Patient
            const userId = patient?.userId;
            if (!userId) throw new Error("Không tìm thấy userId trong Patient");

            const uRes = await fetch(`https://localhost:7168/api/Users/${userId}`);
            if (!uRes.ok) throw new Error("Không thể lấy dữ liệu User");

            const userData = await uRes.json();

            // 🔹 3. Gộp dữ liệu Patient và User (tuỳ ý)
            patientData = { ...patient, ...userData };

            // 🔹 4. Lưu vào cache
            setPatientCache((prev) => ({ ...prev, [patientId]: patientData }));
          } catch (error) {
            console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
          }
          setPatientInfo(patientData)
          setAppointmentInfo(appointmentInfo)
        }
      } catch (error) {
        console.error(error)
        setRecord(null) // Đảm bảo record là null nếu có lỗi tải
      } finally {
        setLoading(false)
      }
    }
    fetchRecord()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="text-center py-12 text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      </DashboardLayout>
    )
  }

  if (!record) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy hồ sơ bệnh án</p>
          <Button className="mt-4" onClick={() => router.push("/reception/records")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại danh sách
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // Khai báo các biến an toàn hơn với Optional Chaining và giá trị mặc định
  const appointment = record.appointment
  const med = record.internalMedRecord
  const prescriptions = record.prescriptions || []
  const testResults = record.testResults || []
  const payments = record.payments || []

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Chi tiết hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Mã hồ sơ: #{record.recordId}</p>
          </div>
          <Badge variant={appointment?.status === "Confirmed" ? "default" : "secondary"}>
            {appointment?.status || "Chưa rõ"}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Patient Info */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Thông tin bệnh nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Họ tên:</strong> {patientInfo?.fullName || "—"}</p>
              <p><strong>Giới tính:</strong> {patientInfo?.gender || "—"}</p>
              <p><strong>Ngày sinh:</strong> {patientInfo?.dob ? new Date(patientInfo.dob).toLocaleDateString("vi-VN") : "—"}</p>
              <p><strong>SĐT:</strong> {patientInfo?.phone || "—"}</p>
              <p><strong>Email:</strong> {patientInfo?.email || "—"}</p>
              <p><strong>Dị ứng:</strong> {patientInfo?.allergies || "Không có"}</p>
              <p><strong>Tiền sử bệnh:</strong> {patientInfo?.medicalHistory || "Không có"}</p>
            </CardContent>
          </Card>

          {/* Record Info & Sub-sections */}
          <div className="md:col-span-2 space-y-6">
            {/* Thông tin khám bệnh (Appointment/Diagnosis) */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin khám bệnh</CardTitle>
                <CardDescription>
                  {appointmentInfo?.appointmentDate
                    ? `Ngày: ${new Date(appointmentInfo.appointmentDate).toLocaleDateString("vi-VN")}`
                    : "Không rõ ngày khám"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>Bác sĩ phụ trách:</strong> {appointmentInfo?.doctorName || "—"}</p>
                <p><strong>Chuyên khoa:</strong> {appointmentInfo?.doctorSpecialty || "—"}</p>
                <Separator className="my-3" />
                <p><strong>Lý do khám:</strong> {appointmentInfo?.reasonForVisit || "—"}</p>
                <p><strong>Chẩn đoán:</strong> {record.diagnosis || "—"}</p>
                <p><strong>Ghi chú bác sĩ:</strong> {record.doctorNotes || "—"}</p>
              </CardContent>
            </Card>

            {/* Internal Medicine Record */}
            {med && (
              <Card>
                <CardHeader>
                  <CardTitle>Chỉ số nội khoa</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {med.bloodPressure && (
                    <Badge variant="outline" className="justify-center">
                      <HeartPulse className="w-4 h-4 mr-1" /> Huyết áp: {med.bloodPressure} mmHg
                    </Badge>
                  )}
                  {med.heartRate && <Badge variant="outline" className="justify-center">Nhịp tim: {med.heartRate} bpm</Badge>}
                  {med.bloodSugar && <Badge variant="outline" className="justify-center">Đường huyết: {med.bloodSugar} mg/dL</Badge>}
                  {med.notes && <p className="col-span-full text-muted-foreground pt-2">Ghi chú: {med.notes}</p>}
                </CardContent>
              </Card>
            )}

            {/* Prescriptions
            {prescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    <CardTitle>Đơn thuốc ({prescriptions.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prescriptions.map((p: Prescription, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="font-medium">{p.medicationName || "Thuốc không xác định"}</p>
                      <p className="text-sm text-muted-foreground">Liều dùng: {p.dosage || "—"}</p>
                      <p className="text-sm text-muted-foreground">Ghi chú: {p.instructions || "—"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )} */}

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-primary" />
                    <CardTitle>Kết quả xét nghiệm ({testResults.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {testResults.map((t: TestResult, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="font-medium">{t.testName || "Không rõ xét nghiệm"}</p>
                      <p className="text-sm text-muted-foreground">Kết quả: {t.resultValue || "—"}</p>
                      {t.notes && <p className="text-sm text-muted-foreground">Ghi chú: {t.notes}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Payments */}
            {payments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Thanh toán ({payments.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payments.map((pay: Payment, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      {/* Sử dụng optional chaining và kiểm tra tồn tại của amount */}
                      <p className="font-medium">Số tiền: {pay.amount?.toLocaleString("vi-VN") || "0"}₫</p>
                      <p className="text-sm text-muted-foreground">Ngày: {new Date(pay.paymentDate).toLocaleDateString("vi-VN")}</p>
                      <p className="text-sm text-muted-foreground">Phương thức: {pay.method}</p>
                      <p className="text-sm text-muted-foreground">Trạng thái: {pay.status}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}