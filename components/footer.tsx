import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-12" suppressHydrationWarning>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" suppressHydrationWarning>
          {/* About */}
          <div suppressHydrationWarning>
            <div className="mb-4 flex items-center gap-2" suppressHydrationWarning>
              <div className="flex  items-center justify-center rounded-lg" suppressHydrationWarning>
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="h-25 w-25 object-contain"
                />
              </div>
              <div className="flex flex-col" suppressHydrationWarning>
                <span className="text-lg font-bold leading-none text-primary">Diamond Health</span>
                <span className="text-xs text-muted-foreground">Phòng khám đa khoa</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chăm sóc sức khỏe toàn diện với đội ngũ bác sĩ chuyên môn cao và trang thiết bị hiện đại.
            </p>
          </div>

          {/* Quick Links */}
          <div suppressHydrationWarning>
            <h3 className="mb-4 text-sm font-bold">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dich-vu" className="text-muted-foreground transition-colors hover:text-primary">
                  Dịch vụ khám chữa bệnh
                </Link>
              </li>
              <li>
                <Link href="/bac-si" className="text-muted-foreground transition-colors hover:text-primary">
                  Đội ngũ bác sĩ
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="text-muted-foreground transition-colors hover:text-primary">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div suppressHydrationWarning>
            <h3 className="mb-4 text-sm font-bold">Chuyên khoa</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Nội tổng quát</li>
              <li className="text-muted-foreground">Nhi khoa</li>
              <li className="text-muted-foreground">Sản - Phụ khoa</li>
              <li className="text-muted-foreground">Khám sức khỏe tổng quát</li>
              <li className="text-muted-foreground">Xét nghiệm</li>
            </ul>
          </div>

          {/* Contact */}
          <div suppressHydrationWarning>
            <h3 className="mb-4 text-sm font-bold">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">Thôn 1, Thạch Hòa, Thạch Thất, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">0978-468-063</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">diamondheathclinic@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground" suppressHydrationWarning>
          <p>© 2025 Diamond Health. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
