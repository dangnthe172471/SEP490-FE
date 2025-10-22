"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FileText, Users, Activity, Plus, ArrowRightLeft } from "lucide-react"
import { mockMedicalRecords } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/doctor", icon: Activity },
  { name: "Bệnh nhân", href: "/doctor/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/doctor/records", icon: FileText },
  { name: "Lịch hẹn", href: "/doctor/appointments", icon: Calendar },
  { name: "Yêu cầu đổi ca", href: "/doctor/shift-swap", icon: ArrowRightLeft },
]

export default function DoctorRecordsPage() {
  const router = useRouter()

  const activeRecords = mockMedicalRecords.filter((r) => r.status === "active")
  const followUpRecords = mockMedicalRecords.filter((r) => r.status === "follow-up")
  const completedRecords = mockMedicalRecords.filter((r) => r.status === "completed")

  const RecordCard = ({ record }: { record: (typeof mockMedicalRecords)[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{record.patientName}</h3>
                  <Badge variant="outline">{record.id}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{record.date}</p>
              </div>
              <Badge
                variant={
                  record.status === "active" ? "default" : record.status === "follow-up" ? "secondary" : "outline"
                }
              >
                {record.status === "active"
                  ? "Đang điều trị"
                  : record.status === "follow-up"
                    ? "Tái khám"
                    : "Hoàn thành"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Chẩn đoán: </span>
                <span className="text-sm text-muted-foreground">{record.diagnosis}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Triệu chứng: </span>
                <span className="text-sm text-muted-foreground">{record.symptoms}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{record.department}</Badge>
                {record.prescriptions.length > 0 && (
                  <Badge variant="outline">{record.prescriptions.length} đơn thuốc</Badge>
                )}
                {record.labTests.length > 0 && <Badge variant="outline">{record.labTests.length} xét nghiệm</Badge>}
              </div>
            </div>
          </div>
          <Button size="sm" className="ml-4" onClick={() => router.push(`/doctor/records/${record.id}`)}>
            Chi tiết
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Quản lý hồ sơ khám bệnh</p>
          </div>
          <Button onClick={() => router.push("/doctor/records/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo hồ sơ mới
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Tất cả ({mockMedicalRecords.length})</TabsTrigger>
            <TabsTrigger value="active">Đang điều trị ({activeRecords.length})</TabsTrigger>
            <TabsTrigger value="follow-up">Cần tái khám ({followUpRecords.length})</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành ({completedRecords.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {mockMedicalRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có hồ sơ đang điều trị</p>
                </CardContent>
              </Card>
            ) : (
              activeRecords.map((record) => <RecordCard key={record.id} record={record} />)
            )}
          </TabsContent>

          <TabsContent value="follow-up" className="space-y-4">
            {followUpRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có hồ sơ cần tái khám</p>
                </CardContent>
              </Card>
            ) : (
              followUpRecords.map((record) => <RecordCard key={record.id} record={record} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có hồ sơ hoàn thành</p>
                </CardContent>
              </Card>
            ) : (
              completedRecords.map((record) => <RecordCard key={record.id} record={record} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
