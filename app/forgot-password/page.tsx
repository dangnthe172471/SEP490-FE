"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Phone } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại")
      return
    }

    // Basic phone validation
    const phoneRegex = /^[0-9]{10,11}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`http://localhost:5001/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: phone.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        // Redirect to OTP verification page with phone number
        router.push(`/verify-otp?phone=${encodeURIComponent(phone.trim())}`)
      } else {
        toast.error(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi yêu cầu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-background via-background to-muted/20 px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
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
            <CardHeader className="space-y-3 pb-8">
              <CardTitle className="text-3xl font-bold">Quên mật khẩu</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Nhập số điện thoại để nhận mã OTP đặt lại mật khẩu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-semibold">
                    Số điện thoại
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 pl-10"
                      placeholder="Nhập số điện thoại"
                      disabled={isLoading}
                    />
                  </div>
                </div>

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
            Mã OTP sẽ được gửi qua tin nhắn SMS đến số điện thoại của bạn
          </p>
        </div>
      </div>

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
              <Phone className="h-4 w-4" />
              Xác thực bảo mật
            </div>
            <h2 className="text-5xl font-bold leading-tight text-balance">Đặt lại mật khẩu an toàn</h2>
            <p className="text-xl leading-relaxed opacity-95">
              Chúng tôi sẽ gửi mã xác thực qua SMS để đảm bảo tính bảo mật cho tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
