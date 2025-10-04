"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, UserPlus, Activity, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function RegisterPatientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    router.push("/reception/patients")
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Đăng ký bệnh nhân mới</h1>
            <p className="text-muted-foreground">Nhập thông tin bệnh nhân để tạo hồ sơ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Thông tin cơ bản của bệnh nhân</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input id="fullName" placeholder="Nguyễn Văn A" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">
                    Ngày sinh <span className="text-destructive">*</span>
                  </Label>
                  <Input id="dateOfBirth" type="date" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Giới tính <span className="text-destructive">*</span>
                  </Label>
                  <Select required>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodType">Nhóm máu</Label>
                  <Select>
                    <SelectTrigger id="bloodType">
                      <SelectValue placeholder="Chọn nhóm máu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
                <CardDescription>Số điện thoại và địa chỉ</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <Input id="phone" type="tel" placeholder="0901234567" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="example@email.com" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">
                    Địa chỉ <span className="text-destructive">*</span>
                  </Label>
                  <Textarea id="address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" required />
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin y tế</CardTitle>
                <CardDescription>Tiền sử bệnh và dị ứng</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Dị ứng</Label>
                  <Input id="allergies" placeholder="Ví dụ: Penicillin, Sữa, Hải sản..." />
                  <p className="text-xs text-muted-foreground">Nhập các loại dị ứng, cách nhau bằng dấu phẩy</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chronicConditions">Bệnh mạn tính</Label>
                  <Input id="chronicConditions" placeholder="Ví dụ: Cao huyết áp, Đái tháo đường..." />
                  <p className="text-xs text-muted-foreground">Nhập các bệnh mạn tính, cách nhau bằng dấu phẩy</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú thêm</Label>
                  <Textarea id="notes" placeholder="Thông tin bổ sung về bệnh nhân..." rows={3} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Đăng ký bệnh nhân"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
