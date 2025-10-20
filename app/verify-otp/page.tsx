"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Shield, Timer } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyEmailOtpPage() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 phút
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      router.push("/forgot-password")
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setOtp(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ 6 chữ số OTP")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`https://localhost:7168/api/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, otpCode: otp }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        router.push(`/reset-password?email=${encodeURIComponent(email!)}&token=${encodeURIComponent(data.resetToken)}`)
      } else {
        toast.error(data.message || "Mã OTP không đúng hoặc đã hết hạn")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi xác thực mã OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) return

    setIsLoading(true)
    try {
      const response = await fetch(`https://localhost:7168/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Mã OTP mới đã được gửi qua email")
        setTimeLeft(300)
        setCanResend(false)
        setOtp("")
      } else {
        toast.error(data.message || "Không thể gửi lại mã OTP")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi gửi lại mã OTP")
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) return null

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-background via-background to-muted/20 px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-10">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br">
              <img src="/images/logo.png" alt="Logo" className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none text-foreground">Diamond Health</span>
              <span className="text-sm text-muted-foreground">Phòng khám đa khoa</span>
            </div>
          </div>

          <Card className="border-none bg-white shadow-2xl ring-1 ring-black/5">
            <CardHeader className="space-y-3 pb-8">
              <CardTitle className="text-3xl font-bold">Xác thực Email OTP</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Nhập mã OTP 6 chữ số đã được gửi đến email{" "}
                <span className="font-semibold text-primary">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="otp" className="text-sm font-semibold">Mã OTP</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={handleOtpChange}
                      className="h-12 pl-10 text-center text-lg tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>
                  {timeLeft > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>Mã OTP còn hiệu lực trong {formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-14 w-full bg-primary text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                  size="lg"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    "Xác thực OTP"
                  )}
                </Button>

                {canResend && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Gửi lại mã OTP
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra email của bạn.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative hidden lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-primary/80 to-indigo-500">
          <img
            src="/modern-medical-clinic-reception-area-with-natural-.jpg"
            alt="Diamond Health Clinic"
            className="h-full w-full object-cover opacity-15"
          />
        </div>
        <div className="relative flex h-full flex-col justify-center px-20 text-primary-foreground">
          <div className="max-w-lg space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm">
              <Shield className="h-4 w-4" />
              Xác thực bảo mật
            </div>
            <h2 className="text-5xl font-bold leading-tight">Xác thực mã OTP</h2>
            <p className="text-xl leading-relaxed opacity-95">
              Nhập mã xác thực 6 chữ số đã được gửi đến email của bạn để tiếp tục.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
