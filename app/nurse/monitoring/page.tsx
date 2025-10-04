"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Users,
  ClipboardList,
  Stethoscope,
  Heart,
  Thermometer,
  Pause as Pulse,
  AlertCircle,
} from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/nurse", icon: Activity },
  { name: "Bệnh nhân", href: "/nurse/patients", icon: Users },
  { name: "Nhiệm vụ", href: "/nurse/tasks", icon: ClipboardList },
  { name: "Theo dõi", href: "/nurse/monitoring", icon: Stethoscope },
]

export default function NurseMonitoringPage() {
  const router = useRouter()

  const activePatients = mockAppointments.filter((a) => a.status === "in-progress")

  // Mock vital signs with some abnormal values
  const getVitalSigns = (index: number) => {
    const isAbnormal = index % 3 === 0
    return {
      bloodPressure: isAbnormal
        ? `${Math.floor(Math.random() * 20 + 150)}/${Math.floor(Math.random() * 10 + 95)}`
        : `${Math.floor(Math.random() * 20 + 110)}/${Math.floor(Math.random() * 10 + 70)}`,
      heartRate: isAbnormal ? Math.floor(Math.random() * 20 + 100) : Math.floor(Math.random() * 20 + 70),
      temperature: isAbnormal ? (Math.random() * 1 + 38).toFixed(1) : (Math.random() * 0.5 + 36.5).toFixed(1),
      oxygenSaturation: isAbnormal ? Math.floor(Math.random() * 5 + 90) : Math.floor(Math.random() * 3 + 97),
      status: isAbnormal ? "warning" : "normal",
      lastUpdated: "5 phút trước",
    }
  }

  const patientsWithVitals = activePatients.map((patient, index) => ({
    ...patient,
    vitals: getVitalSigns(index),
  }))

  const criticalPatients = patientsWithVitals.filter((p) => p.vitals.status === "warning")
  const normalPatients = patientsWithVitals.filter((p) => p.vitals.status === "normal")

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Theo dõi sinh hiệu</h1>
          <p className="text-muted-foreground">Giám sát tình trạng sức khỏe bệnh nhân</p>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientsWithVitals.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cần chú ý</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalPatients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ổn định</CardTitle>
              <Activity className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{normalPatients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cập nhật gần đây</CardTitle>
              <Stethoscope className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientsWithVitals.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Patients */}
        {criticalPatients.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Bệnh nhân cần chú ý
              </CardTitle>
              <CardDescription>Sinh hiệu bất thường, cần theo dõi sát</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalPatients.map((patient) => (
                  <Card key={patient.id} className="bg-destructive/5">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{patient.patientName}</h3>
                              <Badge variant="outline">{patient.id}</Badge>
                              <Badge variant="destructive">Cần chú ý</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{patient.doctorName}</p>
                            <Badge variant="secondary" className="mt-1">
                              {patient.department}
                            </Badge>
                          </div>
                          <Button size="sm" onClick={() => router.push(`/nurse/patients/${patient.id}`)}>
                            Xử lý
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Huyết áp</p>
                              <p className="text-sm font-medium text-destructive">{patient.vitals.bloodPressure}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pulse className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nhịp tim</p>
                              <p className="text-sm font-medium text-destructive">{patient.vitals.heartRate} bpm</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nhiệt độ</p>
                              <p className="text-sm font-medium text-destructive">{patient.vitals.temperature}°C</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-xs text-muted-foreground">SpO2</p>
                              <p className="text-sm font-medium text-destructive">{patient.vitals.oxygenSaturation}%</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">Cập nhật: {patient.vitals.lastUpdated}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Normal Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Bệnh nhân ổn định</CardTitle>
            <CardDescription>Sinh hiệu trong giới hạn bình thường</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {normalPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Không có bệnh nhân nào</p>
              ) : (
                normalPatients.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{patient.patientName}</h3>
                              <Badge variant="outline">{patient.id}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{patient.doctorName}</p>
                            <Badge variant="secondary" className="mt-1">
                              {patient.department}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/nurse/patients/${patient.id}`)}
                          >
                            Xem
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-chart-2" />
                            <div>
                              <p className="text-xs text-muted-foreground">Huyết áp</p>
                              <p className="text-sm font-medium">{patient.vitals.bloodPressure}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Pulse className="h-4 w-4 text-chart-3" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nhịp tim</p>
                              <p className="text-sm font-medium">{patient.vitals.heartRate} bpm</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-chart-4" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nhiệt độ</p>
                              <p className="text-sm font-medium">{patient.vitals.temperature}°C</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">SpO2</p>
                              <p className="text-sm font-medium">{patient.vitals.oxygenSaturation}%</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">Cập nhật: {patient.vitals.lastUpdated}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
