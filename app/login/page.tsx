import { LoginForm } from "@/components/login-form"
import { Sparkles, Stethoscope } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center p-2">
              <Image
                src="/logo.png"
                alt="Diamond Health Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Diamond Health</h1>
              <p className="text-sm text-primary-foreground/80">Hệ thống quản lý phòng khám</p>
            </div>
          </div>

          <div className="space-y-6 mt-16">
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Nền tảng quản lý
              <br />y tế toàn diện
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed max-w-md text-pretty">
              Tối ưu hóa quy trình làm việc, nâng cao chất lượng chăm sóc bệnh nhân với công nghệ hiện đại
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Quản lý bệnh án điện tử</p>
          </div>
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Chẩn đoán hỗ trợ AI</p>
          </div>
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center p-1">
              <Image
                src="/logo.png"
                alt="Diamond Health Logo"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <p className="text-sm font-medium">Chăm sóc tập trung bệnh nhân</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center p-1">
                <Image
                  src="/logo.png"
                  alt="Diamond Health Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-bold">Diamond Health</h1>
            </div>
          </div>

          <div className="text-center mb-4">
            <Link href="/">
              <Button variant="link" className="text-sm">
                Xem trang chủ
              </Button>
            </Link>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
