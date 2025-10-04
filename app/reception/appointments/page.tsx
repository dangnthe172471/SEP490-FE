"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, UserPlus, Activity, Plus, Clock } from "lucide-react"
import { mockAppointments } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function ReceptionAppointmentsPage() {
  const router = useRouter()

  const scheduledAppointments = mockAppointments.filter((a) => a.status === "scheduled")
  const inProgressAppointments = mockAppointments.filter((a) => a.status === "in-progress")
  const completedAppointments = mockAppointments.filter((a) => a.status === "completed")
  const cancelledAppointments = mockAppointments.filter((a) => a.status === "cancelled")

  const AppointmentCard = ({ appointment }: { appointment: (typeof mockAppointments)[0] }) => (
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{appointment.date}</span>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{appointment.time}</span>
                </div>
              </div>
              <Badge
                variant={
                  appointment.status === "scheduled"
                    ? "default"
                    : appointment.status === "in-progress"
                      ? "secondary"
                      : appointment.status === "completed"
                        ? "outline"
                        : "destructive"
                }
              >
                {appointment.status === "scheduled"
                  ? "Đã đặt"
                  : appointment.status === "in-progress"
                    ? "Đang khám"
                    : appointment.status === "completed"
                      ? "Hoàn thành"
                      : "Đã hủy"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Bác sĩ: </span>
                <span className="text-sm text-muted-foreground">{appointment.doctorName}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Khoa: </span>
                <span className="text-sm text-muted-foreground">{appointment.department}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Lý do: </span>
                <span className="text-sm text-muted-foreground">{appointment.reason}</span>
              </div>
              {appointment.notes && (
                <div>
                  <span className="text-sm font-medium">Ghi chú: </span>
                  <span className="text-sm text-muted-foreground">{appointment.notes}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button size="sm" onClick={() => router.push(`/reception/appointments/${appointment.id}`)}>
              Chi tiết
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý lịch hẹn</h1>
            <p className="text-muted-foreground">Xem và quản lý lịch hẹn của bệnh nhân</p>
          </div>
          <Button onClick={() => router.push("/reception/appointments/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Đặt lịch mới
          </Button>
        </div>

        <Tabs defaultValue="scheduled" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduled">Đã đặt ({scheduledAppointments.length})</TabsTrigger>
            <TabsTrigger value="in-progress">Đang khám ({inProgressAppointments.length})</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành ({completedAppointments.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Đã hủy ({cancelledAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có lịch hẹn nào</p>
                </CardContent>
              </Card>
            ) : (
              scheduledAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {inProgressAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có lịch hẹn đang khám</p>
                </CardContent>
              </Card>
            ) : (
              inProgressAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có lịch hẹn hoàn thành</p>
                </CardContent>
              </Card>
            ) : (
              completedAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có lịch hẹn đã hủy</p>
                </CardContent>
              </Card>
            ) : (
              cancelledAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
