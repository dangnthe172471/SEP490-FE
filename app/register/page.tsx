"use client"

import type React from "react"
import { useState } from "react"
import { ChevronRight, CheckCircle2, UserPlus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const [registrationStep, setRegistrationStep] = useState<"form" | "success">("form")

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault()
    setRegistrationStep("success")
    setTimeout(() => setRegistrationStep("form"), 3000)
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
              <UserPlus className="h-4 w-4" />
              Đăng ký tài khoản bệnh nhân
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Tạo tài khoản <span className="text-primary">bệnh nhân</span> mới
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              Đăng ký tài khoản để quản lý lịch khám, xem kết quả xét nghiệm và theo dõi sức khỏe của bạn
            </p>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {registrationStep === "form" ? (
              <Card className="border-2">
                <CardContent className="p-8">
                  <form onSubmit={handleRegistration} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Thông tin cá nhân</h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Họ và tên *</Label>
                          <Input id="fullName" placeholder="Nguyễn Văn A" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dob">Ngày sinh *</Label>
                          <Input id="dob" type="date" required />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="gender">Giới tính *</Label>
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
                          <Label htmlFor="idNumber">CMND/CCCD *</Label>
                          <Input id="idNumber" placeholder="001234567890" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ *</Label>
                        <Input id="address" placeholder="123 Đường ABC, Quận 1, TP.HCM" required />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Thông tin liên hệ</h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Số điện thoại *</Label>
                          <Input id="phone" type="tel" placeholder="0901234567" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" placeholder="email@example.com" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">Số điện thoại người thân</Label>
                        <Input id="emergencyContact" type="tel" placeholder="0901234567" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Thông tin tài khoản</h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="username">Tên đăng nhập *</Label>
                          <Input id="username" placeholder="nguyenvana" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Mật khẩu *</Label>
                          <Input id="password" type="password" placeholder="••••••••" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                        <Input id="confirmPassword" type="password" placeholder="••••••••" required />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Thông tin y tế (tùy chọn)</h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="bloodType">Nhóm máu</Label>
                          <Select>
                            <SelectTrigger id="bloodType">
                              <SelectValue placeholder="Chọn nhóm máu" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="AB">AB</SelectItem>
                              <SelectItem value="O">O</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="allergies">Dị ứng</Label>
                          <Input id="allergies" placeholder="Thuốc, thực phẩm..." />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medicalHistory">Tiền sử bệnh</Label>
                        <Input id="medicalHistory" placeholder="Các bệnh mãn tính, phẫu thuật..." />
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <input type="checkbox" id="terms" required className="mt-1" />
                      <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                        Tôi đồng ý với các điều khoản sử dụng dịch vụ và chính sách bảo mật thông tin của Diamond Health
                      </Label>
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2">
                      Đăng ký tài khoản
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      Đã có tài khoản?{" "}
                      <Link href="/login" className="text-primary font-medium hover:underline">
                        Đăng nhập ngay
                      </Link>
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
                  <h3 className="text-2xl font-bold text-primary">Đăng ký thành công!</h3>
                  <p className="text-muted-foreground">
                    Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác nhận tài khoản.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/login">Đăng nhập ngay</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
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
