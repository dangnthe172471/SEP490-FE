"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { TestTypeLite } from "@/lib/types/test-results";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn";

function buildAttachmentUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
import {
  getTestTypes,
  getTestResultsByRecord,
} from "@/lib/services/test-results-service";
import type { ReadTestResultDto } from "@/lib/types/test-results";
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
  UserPlus,
  Printer
} from "lucide-react"
import { getDoctorNavigation } from "@/lib/navigation"
import { TestResultDto, MedicalRecordService, type MedicalRecordDto } from "@/lib/services/medical-record-service"
import { ReadInternalMedRecordDto, ReadPediatricRecordDto, ReadDermatologyRecordDto } from "@/lib/types/specialties"
import { appointmentService } from "@/lib/services/appointment-service"
import { patientService } from "@/lib/services/patient-service"
import { userService } from "@/lib/services/user.service"

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

// interface TestResult {
//   testName: string
//   resultValue: string
//   notes?: string
// }


// Sử dụng MedicalRecordDto từ service thay vì định nghĩa lại
type MedicalRecord = MedicalRecordDto

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
  const navigation = getDoctorNavigation()

  const router = useRouter()
  const params = useParams()
  // Ép kiểu id từ params
  const idView = params?.idView ? String(params.idView) : null

  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [patientInfo, setPatientInfo] = useState<PatientDetail | null>(null)
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
  const [appointmentCache, setAppointmentCache] = useState<Record<number, AppointmentDetail>>({})
  const [testTypes, setTestTypes] = useState<TestTypeLite[]>([]);
  const [loadingTestTypes, setLoadingTestTypes] = useState(false);
  const [testResults, setTestResults] = useState<ReadTestResultDto[]>([]);
  useEffect(() => {
    if (!idView) return
    const fetchRecord = async () => {
      try {
        // Lấy hồ sơ bệnh án
        const data = await MedicalRecordService.getById(Number(idView))
        setRecord(data)

        // LẤY THÊM TẤT CẢ TESTRESULT CHO RECORD NÀY (có đầy đủ attachment và testName)
        try {
          const tests = await getTestResultsByRecord(data.recordId);
          setTestResults(tests ?? []);
        } catch (err) {
          console.error("Không thể tải kết quả xét nghiệm theo record", err);
          setTestResults([]);
        }

        let appointmentInfo = appointmentCache[data?.appointment?.appointmentId || 0]
        if (!appointmentInfo && data?.appointment?.appointmentId) {
          const appointmentDto = await appointmentService.getById(data.appointment.appointmentId)
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
          setAppointmentCache((prev) => ({ ...prev, [data.appointment!.appointmentId]: appointmentInfo }))
        }
        // --- Lấy thông tin bệnh nhân từ bảng Users ---
        const patientId = data?.appointment?.patientId
        if (patientId) {
          let patientData = patientCache[patientId]
          try {
            // 🔹 1. Lấy thông tin từ bảng Patient
            const patient = await patientService.getById(patientId);

            // 🔹 2. Lấy thông tin User từ userId của Patient
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
            setPatientCache((prev) => ({ ...prev, [patientId]: patientData }));
            setPatientInfo(patientData)
          } catch (error) {
            console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
          }
        }
        if (appointmentInfo) {
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
  }, [idView])

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoadingTestTypes(true);
        const types = await getTestTypes();
        if (!aborted) setTestTypes(types);
      } catch (err) {
        console.error("Không thể tải danh sách xét nghiệm", err);
      } finally {
        if (!aborted) setLoadingTestTypes(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

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
  // Sử dụng testResults từ state (đã lấy từ getTestResultsByRecord) thay vì từ record

  const printPage = () => window.print()

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6 print:p-0">
        {/* Header */}
        <div className="flex items-center gap-4 print:hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Chi tiết hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Mã hồ sơ: #{record.recordId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={appointment?.status === "Confirmed" ? "default" : "secondary"}>
              {appointment?.status || "Chưa rõ"}
            </Badge>
            <Button onClick={printPage}>
              <Printer className="w-4 h-4 mr-2" /> In hồ sơ
            </Button>
          </div>
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
            {record.internalMedRecord && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-1">Khám nội khoa</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    Huyết áp:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.bloodPressure ?? "-"}
                    </span>
                  </div>
                  <div>
                    Nhịp tim:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.heartRate ?? "-"}
                    </span>
                  </div>
                  <div>
                    Đường huyết:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.bloodSugar ?? "-"}
                    </span>
                  </div>
                  <div>
                    Ghi chú:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.notes ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {record.pediatricRecord && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-1">Khám nhi khoa</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    Cân nặng:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.weightKg ?? "-"}
                    </span>
                  </div>
                  <div>
                    Chiều cao:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.heightCm ?? "-"}
                    </span>
                  </div>
                  <div>
                    Nhịp tim:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.heartRate ?? "-"}
                    </span>
                  </div>
                  <div>
                    Nhiệt độ:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.temperatureC ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Kết quả khám da liễu */}
            {record.dermatologyRecords && record.dermatologyRecords.length > 0 && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-2">
                  Kết quả khám da liễu ({record.dermatologyRecords.length})
                </div>
                <div className="space-y-3">
                  {record.dermatologyRecords.map((derm) => (
                    <div key={derm.dermRecordId} className="space-y-2">
                      <div>
                        <span className="font-medium">Thủ thuật:</span>{" "}
                        {derm.requestedProcedure ?? "-"}
                      </div>
                      {derm.bodyArea && (
                        <div>
                          <span className="font-medium">Vùng da:</span> {derm.bodyArea}
                        </div>
                      )}
                      {derm.procedureNotes && (
                        <div>
                          <span className="font-medium">Ghi chú thủ thuật:</span>{" "}
                          {derm.procedureNotes}
                        </div>
                      )}
                      {derm.resultSummary && (
                        <div>
                          <span className="font-medium">Kết quả khám da liễu:</span>{" "}
                          {derm.resultSummary}
                        </div>
                      )}
                      {derm.attachment && (
                        <div>
                          <span className="font-medium">Ảnh đính kèm:</span>
                          <div className="mt-2">
                            <a
                              href={buildAttachmentUrl(derm.attachment)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={buildAttachmentUrl(derm.attachment)}
                                alt="Ảnh khám da liễu"
                                className="max-w-xs max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-xs text-muted-foreground">Không thể tải ảnh: ${derm.attachment}</span>`;
                                  }
                                }}
                              />
                            </a>
                          </div>
                        </div>
                      )}
                      {derm.performedAt && (
                        <div className="text-xs text-muted-foreground">
                          Thực hiện lúc:{" "}
                          {new Date(derm.performedAt).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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

            <div>
              <div className="font-semibold mb-2">
                Kết quả xét nghiệm ({testResults.length})
              </div>
              {testResults.length > 0 ? (
                <div className="border rounded divide-y">
                  {testResults.map((t) => {
                    const typeName =
                      t.testName ??
                      testTypes.find(
                        (tt) => tt.testTypeId === t.testTypeId
                      )?.testName ??
                      `Loại #${t.testTypeId}`;
                    const pending = t.resultValue
                      ? t.resultValue.toLowerCase().includes("pending") ||
                      t.resultValue.toLowerCase().includes("chờ")
                      : true;
                    return (
                      <div
                        key={t.testResultId}
                        className="p-3 text-sm space-y-2 border-b last:border-b-0"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Xét nghiệm:</span>{" "}
                            {typeName}
                          </div>
                          <div>
                            <span className="font-medium">Trạng thái:</span>{" "}
                            {pending ? (
                              <span className="text-orange-600">Chờ kết quả</span>
                            ) : (
                              <span>
                                {t.resultValue ?? "-"}
                                {t.unit && ` ${t.unit}`}
                              </span>
                            )}
                          </div>
                        </div>
                        {t.resultDate && (
                          <div>
                            <span className="font-medium">Ngày kết quả:</span>{" "}
                            {new Date(t.resultDate).toLocaleDateString("vi-VN")}
                          </div>
                        )}
                        {t.notes && (
                          <div>
                            <span className="font-medium">Ghi chú:</span> {t.notes}
                          </div>
                        )}
                        {t.attachment && (
                          <div>
                            <span className="font-medium">Ảnh đính kèm:</span>
                            <div className="mt-2">
                              <a
                                href={buildAttachmentUrl(t.attachment)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={buildAttachmentUrl(t.attachment)}
                                  alt={`Ảnh xét nghiệm ${typeName}`}
                                  className="max-w-xs max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs text-muted-foreground">Không thể tải ảnh: ${t.attachment}</span>`;
                                    }
                                  }}
                                />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có kết quả xét nghiệm
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
          }
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </DashboardLayout>
  )
}