"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, FileText, Users, Activity, ArrowLeft, Pill, TestTube, Brain } from "lucide-react"
import { mockMedicalRecords, mockPatients } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/doctor", icon: Activity },
  { name: "Bệnh nhân", href: "/doctor/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/doctor/records", icon: FileText },
  { name: "Lịch hẹn", href: "/doctor/appointments", icon: Calendar },
]

export default function MedicalRecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const record = mockMedicalRecords.find((r) => r.id === id)
  const patient = record ? mockPatients.find((p) => p.id === record.patientId) : null

  if (!record || !patient) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy hồ sơ bệnh án</p>
          <Button className="mt-4" onClick={() => router.push("/doctor/records")}>
            Quay lại
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Chi tiết hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Mã hồ sơ: {record.id}</p>
          </div>
          <Badge
            variant={record.status === "active" ? "default" : record.status === "follow-up" ? "secondary" : "outline"}
          >
            {record.status === "active" ? "Đang điều trị" : record.status === "follow-up" ? "Tái khám" : "Hoàn thành"}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Patient Info */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Thông tin bệnh nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {patient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">{patient.id}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày sinh:</span>
                  <span className="font-medium">{patient.dateOfBirth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giới tính:</span>
                  <span className="font-medium">
                    {patient.gender === "male" ? "Nam" : patient.gender === "female" ? "Nữ" : "Khác"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Điện thoại:</span>
                  <span className="font-medium">{patient.phone}</span>
                </div>
                {patient.bloodType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nhóm máu:</span>
                    <span className="font-medium">{patient.bloodType}</span>
                  </div>
                )}
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Dị ứng:</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((allergy) => (
                        <Badge key={allergy} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {patient.chronicConditions && patient.chronicConditions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Bệnh mạn tính:</p>
                    <div className="flex flex-wrap gap-1">
                      {patient.chronicConditions.map((condition) => (
                        <Badge key={condition} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Medical Record Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Diagnosis & Symptoms */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin khám bệnh</CardTitle>
                <CardDescription>
                  {record.date} - {record.department}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Chẩn đoán:</p>
                  <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Triệu chứng:</p>
                  <p className="text-sm text-muted-foreground">{record.symptoms}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Ghi chú:</p>
                  <p className="text-sm text-muted-foreground">{record.notes}</p>
                </div>
              </CardContent>
            </Card>

            {/* Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle>Chỉ số sinh tồn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {record.vitalSigns.bloodPressure && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Huyết áp</p>
                      <p className="text-lg font-semibold">{record.vitalSigns.bloodPressure} mmHg</p>
                    </div>
                  )}
                  {record.vitalSigns.heartRate && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Nhịp tim</p>
                      <p className="text-lg font-semibold">{record.vitalSigns.heartRate} bpm</p>
                    </div>
                  )}
                  {record.vitalSigns.temperature && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Nhiệt độ</p>
                      <p className="text-lg font-semibold">{record.vitalSigns.temperature}°C</p>
                    </div>
                  )}
                  {record.vitalSigns.weight && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Cân nặng</p>
                      <p className="text-lg font-semibold">{record.vitalSigns.weight} kg</p>
                    </div>
                  )}
                  {record.vitalSigns.height && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Chiều cao</p>
                      <p className="text-lg font-semibold">{record.vitalSigns.height} cm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescriptions */}
            {record.prescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-primary" />
                    <CardTitle>Đơn thuốc</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {record.prescriptions.map((prescription) => (
                      <div key={prescription.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{prescription.medication}</p>
                            <p className="text-sm text-muted-foreground">
                              {prescription.dosage} - {prescription.frequency}
                            </p>
                          </div>
                          <Badge
                            variant={
                              prescription.status === "dispensed"
                                ? "default"
                                : prescription.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {prescription.status === "dispensed"
                              ? "Đã cấp"
                              : prescription.status === "pending"
                                ? "Chờ cấp"
                                : "Hoàn thành"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Thời gian: {prescription.duration}</p>
                        <p className="text-sm text-muted-foreground">Hướng dẫn: {prescription.instructions}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lab Tests */}
            {record.labTests.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-primary" />
                    <CardTitle>Xét nghiệm & Chẩn đoán hình ảnh</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {record.labTests.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{test.testName}</p>
                            <p className="text-sm text-muted-foreground">
                              {test.testType === "lab" ? "Xét nghiệm" : "Chẩn đoán hình ảnh"}
                            </p>
                          </div>
                          <Badge
                            variant={
                              test.status === "completed"
                                ? "default"
                                : test.status === "in-progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {test.status === "completed"
                              ? "Hoàn thành"
                              : test.status === "in-progress"
                                ? "Đang thực hiện"
                                : "Chờ thực hiện"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Ngày yêu cầu: {test.requestedDate}</p>
                        {test.completedDate && (
                          <p className="text-sm text-muted-foreground">Ngày hoàn thành: {test.completedDate}</p>
                        )}
                        {test.results && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Kết quả:</p>
                            <p className="text-sm">{test.results}</p>
                          </div>
                        )}
                        {test.notes && <p className="text-sm text-muted-foreground">Ghi chú: {test.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Diagnostic Support */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle>Hỗ trợ chẩn đoán AI</CardTitle>
                </div>
                <CardDescription>Gợi ý chẩn đoán dựa trên triệu chứng và dữ liệu lâm sàng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-md border">
                    <p className="text-sm font-medium mb-1">Chẩn đoán khả năng cao:</p>
                    <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                    <div className="mt-2">
                      <Badge variant="outline">Độ tin cậy: 92%</Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-md border">
                    <p className="text-sm font-medium mb-1">Khuyến nghị:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Theo dõi chỉ số sinh tồn định kỳ</li>
                      <li>Tuân thủ đơn thuốc đã kê</li>
                      <li>Tái khám theo lịch hẹn</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
