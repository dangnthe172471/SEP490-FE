"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
import { MedicalRecordService, type MedicalRecordDto } from "@/lib/services/medical-record-service"

interface PatientDetail {
  fullName: string
  gender: string
  dob: string
  phone: string
  email: string
  allergies: string
  medicalHistory: string
}

export default function MedicalRecordDetailPage() {
  const navigation = getDoctorNavigation()
  const router = useRouter()
  const params = useParams()
  const id = params?.id ? Number(params.id) : null

  const [record, setRecord] = useState<MedicalRecordDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
 const [patientInfo, setPatientInfo] = useState<PatientDetail | null>(null)

  useEffect(() => {
    if (!id) return
    (async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7168'}/api/MedicalRecord/${id}`)
        if (!res.ok) throw new Error("Không thể tải dữ liệu hồ sơ")
        const data: MedicalRecordDto = await res.json()
        setRecord(data)

        const patientId = data?.appointment?.patientId
        if (patientId) {
          let patientData = patientCache[patientId]
          if (!patientData) {
            const uRes = await fetch(`https://localhost:7168/api/Users/${patientId}`)
            if (uRes.ok) {
              patientData = await uRes.json()
              setPatientCache((prev) => ({ ...prev, [patientId]: patientData }))
            }
          }
          setPatientInfo(patientData)
        }

      } catch (e: any) {
        setError(e?.message ?? 'Lỗi tải dữ liệu')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const save = async () => {
    if (!record) return
    try {
      setSaving(true)
      const updated = await MedicalRecordService.update(record.recordId, {
        diagnosis: record.diagnosis ?? undefined,
        doctorNotes: record.doctorNotes ?? undefined,
      })
      setRecord(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      alert('Không thể lưu hồ sơ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="p-6">Đang tải dữ liệu…</div>
      </DashboardLayout>
    )
  }

  if (!record) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="p-6 text-red-600">Không tìm thấy hồ sơ</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Hồ sơ bệnh án #{record.recordId}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu…' : saved ? 'Đã lưu' : 'Lưu'}</Button>
          </div>
        </div>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p><strong>Họ tên:</strong> {patientInfo?.fullName || "—"}</p>
              <p><strong>Giới tính:</strong> {patientInfo?.gender || "—"}</p>
              <p><strong>Ngày sinh:</strong> {patientInfo?.dob ? new Date(patientInfo.dob).toLocaleDateString("vi-VN") : "—"}</p>
              <p><strong>SĐT:</strong> {patientInfo?.phone || "—"}</p>
            </div>
            <div>
              <p><strong>Email:</strong> {patientInfo?.email || "—"}</p>
              <p><strong>Dị ứng:</strong> {patientInfo?.allergies || "Không có"}</p>
              <p><strong>Tiền sử bệnh:</strong> {patientInfo?.medicalHistory || "Không có"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <div className="grid gap-4">
            <div className="bg-slate-50 p-3 rounded">
              <div className="font-semibold mb-1">Thông tin cuộc hẹn</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Mã hẹn: <span className="font-medium">{record.appointment?.appointmentId ?? record.appointmentId}</span></div>
                <div>Trạng thái: <span className="font-medium">{record.appointment?.status ?? '-'}</span></div>
                <div>Ngày giờ: <span className="font-medium">{record.appointment?.appointmentDate ? new Date(record.appointment.appointmentDate).toLocaleString('vi-VN') : '-'}</span></div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm text-slate-600">Chẩn đoán</label>
                <textarea className="mt-1 w-full border rounded p-2" rows={2} value={record.diagnosis ?? ''} onChange={(e) => setRecord({ ...record, diagnosis: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-slate-600">Ghi chú bác sĩ</label>
                <textarea className="mt-1 w-full border rounded p-2" rows={3} value={record.doctorNotes ?? ''} onChange={(e) => setRecord({ ...record, doctorNotes: e.target.value })} />
              </div>
            </div>

            {record.internalMedRecord && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-1">Khám nội khoa</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>Huyết áp: <span className="font-medium">{record.internalMedRecord.bloodPressure ?? '-'}</span></div>
                  <div>Nhịp tim: <span className="font-medium">{record.internalMedRecord.heartRate ?? '-'}</span></div>
                  <div>Đường huyết: <span className="font-medium">{record.internalMedRecord.bloodSugar ?? '-'}</span></div>
                  <div>Ghi chú: <span className="font-medium">{record.internalMedRecord.notes ?? '-'}</span></div>
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold mb-2">Đơn thuốc ({record.prescriptions?.length ?? 0})</div>
              {(record.prescriptions && record.prescriptions.length > 0) ? (
                <div className="border rounded divide-y">
                  {record.prescriptions.map((p) => (
                    <div key={p.prescriptionId} className="p-2 text-sm">
                      <div className="flex items-center justify-between pb-2">
                        <div className="font-medium">Đơn #{p.prescriptionId}</div>
                        <div className="text-xs text-muted-foreground">{p.issuedDate ? new Date(p.issuedDate).toLocaleString('vi-VN') : '-'}</div>
                      </div>
                      {(p.prescriptionDetails && p.prescriptionDetails.length > 0) ? (
                        <div className="border rounded">
                          {p.prescriptionDetails.map((d) => (
                            <div key={d.prescriptionDetailId} className="grid grid-cols-3 gap-2 p-2 border-b last:border-b-0">
                              <div className="font-medium truncate">{d.medicineName}</div>
                              <div className="text-muted-foreground">Liều dùng: {d.dosage}</div>
                              <div className="text-right">Thời gian: {d.duration}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Không có chi tiết đơn thuốc</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có đơn thuốc</p>
              )}
            </div>

            <div>
              <div className="font-semibold mb-2">Kết quả xét nghiệm ({record.testResults?.length ?? 0})</div>
              {(record.testResults && record.testResults.length > 0) ? (
                <div className="border rounded divide-y">
                  {record.testResults.map((t) => (
                    <div key={t.testResultId} className="grid grid-cols-4 gap-2 p-2 text-sm">
                      <div className="col-span-2">KQ: <span className="font-medium">{t.resultValue ?? '-'}</span></div>
                      <div>{t.resultDate ? new Date(t.resultDate).toLocaleDateString('vi-VN') : '-'}</div>
                      <div className="text-right">{t.notes ?? ''}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có kết quả xét nghiệm</p>
              )}
            </div>

            <div>
              <div className="font-semibold mb-2">Thanh toán ({record.payments?.length ?? 0})</div>
              {(record.payments && record.payments.length > 0) ? (
                <div className="border rounded divide-y">
                  {record.payments.map((p) => (
                    <div key={p.paymentId} className="grid grid-cols-4 gap-2 p-2 text-sm">
                      <div className="col-span-2">{new Date(p.paymentDate).toLocaleString('vi-VN')}</div>
                      <div className="text-right">{p.amount.toLocaleString('vi-VN')} đ</div>
                      <div className="text-right">{p.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có thanh toán</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
