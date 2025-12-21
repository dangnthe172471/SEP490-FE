"use client"

import type React from "react"
import { useState } from "react"
import { ChevronRight, Calendar, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AppointmentsPage() {
  const [bookingStep, setBookingStep] = useState<"form" | "success">("form")

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    setBookingStep("success")
    setTimeout(() => setBookingStep("form"), 3000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Diamond Health Logo" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-foreground">Diamond Health</h1>
                <p className="text-xs text-muted-foreground">Phòng khám đa khoa</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <Link href="/#services" className="text-sm font-medium hover:text-primary transition-colors">
                Dịch vụ
              </Link>
              <Link href="/#departments" className="text-sm font-medium hover:text-primary transition-colors">
                Đội ngũ bác sĩ
              </Link>
              <Link href="/#about" className="text-sm font-medium hover:text-primary transition-colors">
                Về chúng tôi
              </Link>
              <Link href="/#contact" className="text-sm font-medium hover:text-primary transition-colors">
                Liên hệ
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Button size="sm" className="gap-2" asChild>
                <Link href="/appointments">Đặt lịch ngay</Link>
              </Button>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Đặt lịch khám bệnh
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Đặt lịch khám <span className="text-primary">nhanh chóng</span> và tiện lợi
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              Điền thông tin bên dưới để đặt lịch khám. Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Form Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {bookingStep === "form" ? (
              <Card className="border-2">
                <CardContent className="p-8">
                  <form onSubmit={handleBooking} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên *</Label>
                        <Input id="fullName" placeholder="Nguyễn Văn A" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại *</Label>
                        <Input id="phone" type="tel" placeholder="0901234567" required />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Ngày sinh *</Label>
                        <Input id="dob" type="date" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Chuyên khoa *</Label>
                      <Select required>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Chọn chuyên khoa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Nội tổng quát</SelectItem>
                          <SelectItem value="obstetrics">Da liễu</SelectItem>
                          <SelectItem value="pediatrics">Nhi khoa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="date">Ngày khám mong muốn *</Label>
                        <Input id="date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Giờ khám mong muốn *</Label>
                        <Select required>
                          <SelectTrigger id="time">
                            <SelectValue placeholder="Chọn giờ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="08:00">08:00 - 09:00</SelectItem>
                            <SelectItem value="09:00">09:00 - 10:00</SelectItem>
                            <SelectItem value="10:00">10:00 - 11:00</SelectItem>
                            <SelectItem value="14:00">14:00 - 15:00</SelectItem>
                            <SelectItem value="15:00">15:00 - 16:00</SelectItem>
                            <SelectItem value="16:00">16:00 - 17:00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Lý do khám</Label>
                      <Textarea id="reason" placeholder="Mô tả triệu chứng hoặc lý do khám bệnh..." rows={4} />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2">
                      Xác nhận đặt lịch
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      Bằng việc đặt lịch, bạn đồng ý với các điều khoản sử dụng dịch vụ của chúng tôi
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-primary">
                <CardContent className="p-12 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary">Đặt lịch thành công!</h3>
                  <p className="text-muted-foreground">
                    Cảm ơn bạn đã đặt lịch. Chúng tôi sẽ liên hệ xác nhận trong vòng 30 phút.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">Thông tin liên hệ</h2>
              <p className="text-muted-foreground">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">Địa chỉ</h4>
                  <p className="text-sm text-muted-foreground">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">Điện thoại</h4>
                  <p className="text-sm text-muted-foreground">(028) 1234 5678</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-sm text-muted-foreground">info@diamondhealth.vn</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Diamond Health Logo" className="h-8 w-8 object-contain" />
                <span className="font-bold">Diamond Health</span>
              </div>
              <p className="text-sm text-muted-foreground">Phòng khám đa khoa uy tín, chất lượng</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Dịch vụ</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/#departments" className="hover:text-primary transition-colors">
                    Chuyên khoa
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="hover:text-primary transition-colors">
                    Đội ngũ bác sĩ
                  </Link>
                </li>
                <li>
                  <Link href="/appointments" className="hover:text-primary transition-colors">
                    Đặt lịch khám
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Hệ thống</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-primary transition-colors">
                    Đăng ký
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Liên hệ</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>123 Đường ABC, Q.1, TP.HCM</li>
                <li>(028) 1234 5678</li>
                <li>info@diamondhealth.vn</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Diamond Health Clinic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
