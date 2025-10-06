"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, Sparkles, UserPlus, Mail, Lock, Phone, User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-background via-background to-muted/20 px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br">
              <img
                src="/images/logo.png"
                alt="Logo"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none text-foreground">Diamond Health</span>
              <span className="text-sm text-muted-foreground">Phòng khám đa khoa</span>
            </div>
          </div>

          <Card className="border-none bg-white shadow-2xl ring-1 ring-black/5">
            <CardHeader className="space-y-3 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Đăng ký tài khoản</CardTitle>
              </div>
              <CardDescription className="text-base leading-relaxed">
                Tạo tài khoản mới để trải nghiệm dịch vụ chăm sóc sức khỏe tốt nhất
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-5">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="fullname">
                    <User className="h-4 w-4 text-primary" />
                    Họ và tên
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="email">
                    <Mail className="h-4 w-4 text-primary" />
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="example@email.com"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="phone">
                    <Phone className="h-4 w-4 text-primary" />
                    Số điện thoại
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="0123 456 789"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="password">
                    <Lock className="h-4 w-4 text-primary" />
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 pr-12 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="confirm-password">
                    <Lock className="h-4 w-4 text-primary" />
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 pr-12 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed">
                    Tôi đồng ý với{" "}
                    <Link href="#" className="font-semibold text-primary hover:underline">
                      Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link href="#" className="font-semibold text-primary hover:underline">
                      Chính sách bảo mật
                    </Link>{" "}
                    của Diamond Health
                  </label>
                </div>

                <Button
                  className="h-14 w-full bg-gradient-to-r from-primary to-primary/90 text-base font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
                  size="lg"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Tạo tài khoản
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs font-semibold uppercase">
                    <span className="bg-card px-3 text-muted-foreground">Hoặc đăng ký với</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-12 w-full justify-center border-2 font-semibold transition-all hover:bg-muted/50 hover:scale-[1.02] bg-transparent"
                  type="button"
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Đăng ký với Google
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Đã có tài khoản? </span>
                  <Link href="/login" className="font-bold text-primary hover:underline">
                    Đăng nhập ngay
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500">
          <Image
            src="/modern-healthcare-facility-with-friendly-medical-s.jpg"
            alt="Diamond Health Registration"
            fill
            className="object-cover opacity-15"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-white/20 to-transparent blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>

        <div className="relative flex h-full flex-col justify-center px-20 text-primary-foreground">
          <div className="max-w-lg space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Tham gia cộng đồng sức khỏe
            </div>

            <h2 className="text-5xl font-bold leading-tight text-balance">
              Bắt đầu hành trình chăm sóc sức khỏe của bạn
            </h2>

            <p className="text-xl leading-relaxed opacity-95">
              Đăng ký ngay để trải nghiệm dịch vụ y tế hiện đại với đội ngũ bác sĩ chuyên nghiệp và tận tâm.
            </p>

            <div className="grid gap-6 pt-6">
              <div className="flex items-start gap-5 rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm transition-all hover:bg-primary-foreground/15">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">Hồ sơ sức khỏe cá nhân</h3>
                  <p className="leading-relaxed opacity-90">Quản lý thông tin sức khỏe và lịch sử khám bệnh của bạn</p>
                </div>
              </div>

              <div className="flex items-start gap-5 rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm transition-all hover:bg-primary-foreground/15">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">Đặt lịch linh hoạt</h3>
                  <p className="leading-relaxed opacity-90">Chọn thời gian khám phù hợp với lịch trình của bạn</p>
                </div>
              </div>

              <div className="flex items-start gap-5 rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur-sm transition-all hover:bg-primary-foreground/15">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">Nhắc nhở thông minh</h3>
                  <p className="leading-relaxed opacity-90">Nhận thông báo về lịch khám và chăm sóc sức khỏe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
