"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, ClipboardList, Stethoscope, Heart, Thermometer, Pause as Pulse } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { useRouter } from "next/navigation"
import { getNurseNavigation } from "@/lib/navigation/nurse-navigation"

export default function NursePatientsPage() {
  // Get nurse navigation from centralized config
  const navigation = getNurseNavigation()

  const router = useRouter()

  const inProgressPatients = mockAppointments.filter((a) => a.status === "in-progress")
  const scheduledPatients = mockAppointments.filter((a) => a.status === "scheduled")
  const completedPatients = mockAppointments.filter((a) => a.status === "completed")

  // Mock vital signs
  const getVitalSigns = () => ({
    bloodPressure: `${Math.floor(Math.random() * 40 + 110)}/${Math.floor(Math.random() * 20 + 70)}`,
    heartRate: Math.floor(Math.random() * 30 + 60),
    temperature: (Math.random() * 1.5 + 36.5).toFixed(1),
    status: Math.random() > 0.7 ? "warning" : "normal",
  })

  const PatientCard = ({ appointment }: { appointment: (typeof mockAppointments)[0] }) => {
    const vitals = getVitalSigns()

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{appointment.patientName}</h3>
                    <Badge variant="outline">{appointment.id}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{appointment.doctorName}</p>
                  <Badge variant="secondary" className="mt-1">
                    {appointment.department}
                  </Badge>
                </div>
                {vitals.status === "warning" && (
                  <Badge variant="destructive" className="ml-2">
                    Cần chú ý
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Heart className={`h-4 w-4 ${vitals.status === "warning" ? "text-destructive" : "text-chart-2"}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Huyết áp</p>
                    <p className="text-sm font-medium">{vitals.bloodPressure}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pulse className="h-4 w-4 text-chart-3" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nhịp tim</p>
                    <p className="text-sm font-medium">{vitals.heartRate} bpm</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-chart-4" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nhiệt độ</p>
                    <p className="text-sm font-medium">{vitals.temperature}°C</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" onClick={() => router.push(`/nurse/patients/${appointment.id}`)}>
                Chi tiết
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý bệnh nhân</h1>
          <p className="text-muted-foreground">Theo dõi và chăm sóc bệnh nhân</p>
        </div>

        <Tabs defaultValue="in-progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="in-progress">Đang điều trị ({inProgressPatients.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Chờ khám ({scheduledPatients.length})</TabsTrigger>
            <TabsTrigger value="completed">Đã hoàn thành ({completedPatients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4">
            {inProgressPatients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có bệnh nhân đang điều trị</p>
                </CardContent>
              </Card>
            ) : (
              inProgressPatients.map((appointment) => <PatientCard key={appointment.id} appointment={appointment} />)
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledPatients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có bệnh nhân chờ khám</p>
                </CardContent>
              </Card>
            ) : (
              scheduledPatients.map((appointment) => <PatientCard key={appointment.id} appointment={appointment} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedPatients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có bệnh nhân đã hoàn thành</p>
                </CardContent>
              </Card>
            ) : (
              completedPatients.map((appointment) => <PatientCard key={appointment.id} appointment={appointment} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
