"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Users, Activity, Search, Phone, Mail } from "lucide-react"
import { mockPatients } from "@/lib/mock-data"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Get doctor navigation from centralized config
  const navigation = getDoctorNavigation()

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery),
  )

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Danh sách bệnh nhân</h1>
          <p className="text-muted-foreground">Quản lý thông tin bệnh nhân</p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm bệnh nhân</CardTitle>
            <CardDescription>Tìm theo tên, mã bệnh nhân hoặc số điện thoại</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên, mã BN hoặc SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{patient.name}</h3>
                          <Badge variant="outline">{patient.id}</Badge>
                          <Badge variant="secondary">
                            {patient.gender === "male" ? "Nam" : patient.gender === "female" ? "Nữ" : "Khác"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {calculateAge(patient.dateOfBirth)} tuổi ({patient.dateOfBirth})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{patient.phone}</span>
                          </div>
                          {patient.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{patient.email}</span>
                            </div>
                          )}
                          {patient.bloodType && (
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              <span>Nhóm máu: {patient.bloodType}</span>
                            </div>
                          )}
                        </div>
                        {(patient.allergies && patient.allergies.length > 0) ||
                          (patient.chronicConditions && patient.chronicConditions.length > 0) ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {patient.allergies?.map((allergy) => (
                              <Badge key={allergy} variant="destructive" className="text-xs">
                                Dị ứng: {allergy}
                              </Badge>
                            ))}
                            {patient.chronicConditions?.map((condition) => (
                              <Badge key={condition} variant="outline" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" onClick={() => router.push(`/doctor/patients/${patient.id}`)}>
                      Xem hồ sơ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/doctor/records/new?patientId=${patient.id}`)}
                    >
                      Khám bệnh
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Không tìm thấy bệnh nhân nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
