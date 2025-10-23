"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Vui lòng nhập email.")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ. Vui lòng kiểm tra lại.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`https://localhost:7168/api/Auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Đã gửi mã OTP. Vui lòng kiểm tra email của bạn.")
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
      } else {
        toast.error(data.message || "Có lỗi xảy ra khi yêu cầu mã OTP.")
      }
    } catch (error) {
      console.error("Forgot Password Error:", error)
      toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDE: Form */}
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-background via-background to-muted/20 px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-10">
          {/* Back to Login Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>

          {/* Logo/Brand Info */}
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

          {/* Main Card */}
          <Card className="border-none bg-white shadow-2xl ring-1 ring-black/5">
            <CardHeader className="space-y-3 pb-8">
              <CardTitle className="text-3xl font-bold">Quên mật khẩu</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Nhập địa chỉ email để nhận mã <strong>OTP</strong> đặt lại mật khẩu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-10"
                      placeholder="Nhập địa chỉ email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="h-14 w-full bg-primary text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi mã OTP...
                    </>
                  ) : (
                    "Gửi mã OTP"
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Nhớ mật khẩu? </span>
                  <Link href="/login" className="font-bold text-primary hover:underline">
                    Đăng nhập ngay
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Mã OTP sẽ được gửi đến email của bạn và có hiệu lực trong 5 phút.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Decorative Panel */}
      <div className="relative hidden lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-primary/80 to-indigo-500">
          <img
            src="/modern-medical-clinic-reception-area-with-natural-.jpg"
            alt="Diamond Health Clinic"
            className="h-full w-full object-cover opacity-15"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-white/15 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-white/15 to-transparent blur-3xl"></div>

        <div className="relative flex h-full flex-col justify-center px-20 text-primary-foreground">
          <div className="max-w-lg space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm">
              <Mail className="h-4 w-4" />
              Xác thực qua Email
            </div>
            <h2 className="text-5xl font-bold leading-tight text-balance">Đặt lại mật khẩu an toàn</h2>
            <p className="text-xl leading-relaxed opacity-95">
              Chúng tôi sẽ gửi mã xác thực qua email để đảm bảo tính bảo mật cho tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
