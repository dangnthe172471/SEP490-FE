"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { login, getDashboardPath } from "@/lib/auth"
import { toast } from "sonner"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.phone || !formData.password) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }

    setIsLoading(true)

    try {
      const user = await login(formData.phone, formData.password)
      toast.success(`Chào mừng ${user.name}!`)

      // Trigger storage event to update header
      window.dispatchEvent(new Event('storage'))

      router.push(getDashboardPath(user.role))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đăng nhập thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center bg-gradient-to-br from-background via-background to-muted/20 px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chủ
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ">
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
              <CardTitle className="text-3xl font-bold">Đăng nhập</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Nhập thông tin tài khoản để truy cập hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold" htmlFor="phone">
                    Số điện thoại
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập số điện thoại"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold" htmlFor="password">
                      Mật khẩu
                    </label>
                    <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="h-12 w-full rounded-xl border-2 border-input bg-background px-4 pr-12 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="Nhập mật khẩu"
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


                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <label htmlFor="remember" className="text-sm font-medium">
                    Ghi nhớ đăng nhập
                  </label>
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
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs font-semibold uppercase">
                    <span className="bg-card px-3 text-muted-foreground">Hoặc</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-12 w-full justify-center border-2 font-semibold hover:bg-muted/50 bg-transparent"
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
                  Đăng nhập với Google
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Chưa có tài khoản? </span>
                  <Link href="/register" className="font-bold text-primary hover:underline">
                    Đăng ký ngay
                  </Link>
                </div>

                <div className="text-center text-sm">
                  <Link href="/forgot-password" className="font-bold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <Link href="#" className="font-semibold text-primary hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="#" className="font-semibold text-primary hover:underline">
              Chính sách bảo mật
            </Link>{" "}
            của chúng tôi
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-primary/80 to-indigo-500">
          <Image
            src="/modern-medical-clinic-reception-area-with-natural-.jpg"
            alt="Diamond Health Clinic"
            fill
            className="object-cover opacity-15"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-white/15 to-transparent blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-white/15 to-transparent blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative flex h-full flex-col justify-center px-20 text-primary-foreground">
          <div className="max-w-lg space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Hệ thống quản lý hiện đại
            </div>
            <h2 className="text-5xl font-bold leading-tight text-balance">Chào mừng đến với Diamond Health</h2>
            <p className="text-xl leading-relaxed opacity-95">
              Hệ thống quản lý phòng khám hiện đại, giúp bạn dễ dàng đặt lịch khám, theo dõi sức khỏe và kết nối với bác
              sĩ.
            </p>
            <div className="space-y-6 pt-6">
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">Đặt lịch dễ dàng</h3>
                  <p className="leading-relaxed opacity-90">Chọn bác sĩ và thời gian phù hợp chỉ với vài cú click</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">Theo dõi sức khỏe</h3>
                  <p className="leading-relaxed opacity-90">Xem lịch sử khám bệnh và kết quả xét nghiệm mọi lúc</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">Tư vấn trực tuyến</h3>
                  <p className="leading-relaxed opacity-90">Kết nối với bác sĩ qua video call khi cần thiết</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
