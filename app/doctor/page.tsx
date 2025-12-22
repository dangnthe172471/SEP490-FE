"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { RoleGuard } from "@/components/role-guard"
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

  return (
    <RoleGuard allowedRoles="doctor">
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
    </RoleGuard>
  )
}
