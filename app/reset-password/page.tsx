"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Eye, EyeOff, Key, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  // Kiểm tra nếu thiếu email/token thì quay lại
  useEffect(() => {
    if (!email || !token) {
      router.replace("/forgot-password")
    }
  }, [email, token, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự"
    if (!/[A-Z]/.test(password)) return "Mật khẩu phải chứa ít nhất một chữ hoa"
    if (!/[a-z]/.test(password)) return "Mật khẩu phải chứa ít nhất một chữ thường"
    if (!/[0-9]/.test(password)) return "Mật khẩu phải chứa ít nhất một số"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    const passwordError = validatePassword(formData.newPassword)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("https://localhost:7168/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Đặt lại mật khẩu thành công!")
        router.push("/login?message=password-reset-success")
      } else {
        toast.error(data.message || "Token không hợp lệ hoặc đã hết hạn")
      }
    } catch (error) {
      console.error(error)
      toast.error("Lỗi kết nối đến máy chủ")
    } finally {
      setIsLoading(false)
    }
  }

  if (!email || !token) return null

  return (
    <div className="flex min-h-screen">
      {/* Form Section */}
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-background via-background to-muted/20 px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-10">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br">
              <img src="/images/logo.png" alt="Logo" className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none text-foreground">Diamond Health</span>
              <span className="text-sm text-muted-foreground">Phòng khám đa khoa</span>
            </div>
          </div>

          {/* Reset Password Form */}
          <Card className="border-none bg-white shadow-2xl ring-1 ring-black/5">
            <CardHeader className="space-y-3 pb-8">
              <CardTitle className="text-3xl font-bold">Đặt lại mật khẩu</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Nhập mật khẩu mới cho tài khoản{" "}
                <span className="font-semibold text-primary">{email}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div className="space-y-3">
                  <Label htmlFor="newPassword" className="text-sm font-semibold">
                    Mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="h-12 pl-10 pr-12"
                      placeholder="Nhập mật khẩu mới"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                    Xác nhận mật khẩu
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="h-12 pl-10 pr-12"
                      placeholder="Nhập lại mật khẩu mới"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Rules */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold">Yêu cầu mật khẩu:</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Ít nhất 6 ký tự</li>
                    <li>• Có chữ hoa, chữ thường và số</li>
                    <li>• Không chứa thông tin cá nhân</li>
                  </ul>
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
                      Đang cập nhật...
                    </>
                  ) : (
                    "Đặt lại mật khẩu"
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
            Mật khẩu mới sẽ có hiệu lực ngay sau khi cập nhật thành công
          </p>
        </div>
      </div>

      {/* Image Section */}
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
              <Key className="h-4 w-4" />
              Bảo mật tài khoản
            </div>
            <h2 className="text-5xl font-bold leading-tight text-balance">Đặt lại mật khẩu</h2>
            <p className="text-xl leading-relaxed opacity-95">
              Tạo mật khẩu mới mạnh mẽ và an toàn để bảo vệ tài khoản của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
