"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Activity, Users, Settings, Shield, Save } from "lucide-react"
import { useState } from "react"
import { getAdminNavigation } from "@/lib/navigation/admin-navigation"

export default function AdminSettingsPage() {
  // Get admin navigation from centralized config
  const navigation = getAdminNavigation()

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSaving(false)
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">Cấu hình thông tin và tùy chọn hệ thống</p>
        </div>

        {/* Hospital Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin phòng khám</CardTitle>
            <CardDescription>Thông tin cơ bản về phòng khám</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Tên phòng khám</Label>
                <Input id="hospitalName" defaultValue="Phòng khám Diamond Health" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalPhone">Số điện thoại</Label>
                <Input id="hospitalPhone" type="tel" defaultValue="024 1234 5678" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalEmail">Email</Label>
                <Input id="hospitalEmail" type="email" defaultValue="info@diamondhealth.vn" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalWebsite">Website</Label>
                <Input id="hospitalWebsite" type="url" defaultValue="https://diamondhealth.vn" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hospitalAddress">Địa chỉ</Label>
                <Textarea id="hospitalAddress" defaultValue="123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt hệ thống</CardTitle>
            <CardDescription>Tùy chọn hoạt động của hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cho phép đăng ký trực tuyến</Label>
                <p className="text-sm text-muted-foreground">Bệnh nhân có thể đăng ký khám qua website</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gửi email xác nhận lịch hẹn</Label>
                <p className="text-sm text-muted-foreground">Tự động gửi email khi có lịch hẹn mới</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gửi SMS nhắc lịch hẹn</Label>
                <p className="text-sm text-muted-foreground">Nhắc nhở bệnh nhân trước 24 giờ</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cho phép hủy lịch hẹn trực tuyến</Label>
                <p className="text-sm text-muted-foreground">Bệnh nhân có thể tự hủy lịch hẹn</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Yêu cầu xác thực 2 bước</Label>
                <p className="text-sm text-muted-foreground">Bắt buộc xác thực 2 bước cho tất cả người dùng</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt lịch hẹn</CardTitle>
            <CardDescription>Cấu hình thời gian và quy trình đặt lịch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointmentDuration">Thời gian khám mặc định (phút)</Label>
                <Input id="appointmentDuration" type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanceBooking">Đặt lịch trước tối đa (ngày)</Label>
                <Input id="advanceBooking" type="number" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHoursStart">Giờ làm việc bắt đầu</Label>
                <Input id="workingHoursStart" type="time" defaultValue="08:00" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workingHoursEnd">Giờ làm việc kết thúc</Label>
                <Input id="workingHoursEnd" type="time" defaultValue="17:00" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
