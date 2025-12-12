"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DoctorAppointments } from "@/components/doctor-appointments"
import { DoctorRecentRecords } from "@/components/doctor-recent-records"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
import { useEffect, useState } from "react"

export default function DoctorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get doctor navigation from centralized config
  const navigation = getDoctorNavigation()

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
                Vui lòng đăng nhập với tài khoản Bác sĩ để truy cập trang này.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (user.role !== 'doctor') {
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
                Chỉ tài khoản Bác sĩ mới có thể truy cập trang này.
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
          <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
          <p className="text-muted-foreground">
            Chào mừng trở lại, BS. {user?.name || 'Bác sĩ'}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Appointments - Sử dụng component thực tế với API */}
          <DoctorAppointments />

          {/* Recent Medical Records - Sử dụng component thực tế với API */}
          <DoctorRecentRecords />
        </div>

      </div>
    </DashboardLayout>
  )
}
