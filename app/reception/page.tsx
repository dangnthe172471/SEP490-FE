"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ReceptionStats } from "@/components/reception-stats"
import { ReceptionAppointments } from "@/components/reception-appointments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock, UserPlus, CalendarPlus, Activity, MessageCircle, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/reception/records", icon: FileText },
  { name: "Chat hỗ trợ", href: "/reception/chat", icon: MessageCircle },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function ReceptionDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Kiểm tra authentication và role
  if (!user) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Cần đăng nhập</h2>
              <p className="text-muted-foreground">
                Vui lòng đăng nhập với tài khoản Lễ tân để truy cập trang này.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (user.role !== 'reception') {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-orange-500 mb-4">
                <Users className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
              <p className="text-muted-foreground">
                Chỉ tài khoản Lễ tân mới có thể truy cập trang này.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lễ tân</h1>
          <p className="text-muted-foreground">Quản lý tiếp nhận và lịch hẹn bệnh nhân</p>
        </div>

        {/* Statistics - Sử dụng component thực tế với API */}
        <ReceptionStats />

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
                <Button className="w-full justify-start h-auto py-4" onClick={() => router.push("/reception/register")}>
                  <UserPlus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <p className="font-semibold">Đăng ký bệnh nhân mới</p>
                    <p className="text-xs text-primary-foreground/80">Tạo hồ sơ bệnh nhân mới</p>
                  </div>
                </Button>

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
  )
}
