"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ReceptionAppointments } from "@/components/reception-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, CalendarPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"
import { RoleGuard } from "@/components/role-guard"

export default function ReceptionDashboard() {
  // Get reception navigation from centralized config
  const navigation = getReceptionNavigation()

  const router = useRouter()

  return (
    <RoleGuard allowedRoles="reception">
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lễ tân</h1>
            <p className="text-muted-foreground">Quản lý tiếp nhận và lịch hẹn bệnh nhân</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Today's Appointments - Sử dụng component thực tế với API */}
            <ReceptionAppointments limit={5} />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Thao tác nhanh</CardTitle>
                <CardDescription>Các chức năng thường dùng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 bg-transparent"
                    onClick={() => router.push("/reception/appointments/new")}
                  >
                    <CalendarPlus className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-semibold">Đặt lịch hẹn</p>
                      <p className="text-xs text-muted-foreground">Tạo lịch hẹn cho bệnh nhân</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 bg-transparent"
                    onClick={() => router.push("/reception/patients")}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-semibold">Tra cứu bệnh nhân</p>
                      <p className="text-xs text-muted-foreground">Tìm kiếm thông tin bệnh nhân</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-4 bg-transparent"
                    onClick={() => router.push("/reception/appointments")}
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-semibold">Quản lý lịch hẹn</p>
                      <p className="text-xs text-muted-foreground">Xem và chỉnh sửa lịch hẹn</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </DashboardLayout>
    </RoleGuard>
  )
}
