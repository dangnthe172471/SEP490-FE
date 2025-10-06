import Link from "next/link"
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex  items-center justify-center rounded-lg">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="h-25 w-25 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none text-primary">Diamond Health</span>
                <span className="text-xs text-muted-foreground">Phòng khám đa khoa</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chăm sóc sức khỏe toàn diện với đội ngũ bác sĩ chuyên môn cao và trang thiết bị hiện đại.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#services" className="text-muted-foreground transition-colors hover:text-primary">
                  Dịch vụ khám chữa bệnh
                </Link>
              </li>
              <li>
                <Link href="#doctors" className="text-muted-foreground transition-colors hover:text-primary">
                  Đội ngũ bác sĩ
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-muted-foreground transition-colors hover:text-primary">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-muted-foreground transition-colors hover:text-primary">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
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
          <div>
            <h3 className="mb-4 text-sm font-bold">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">1900-xxxx</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">info@diamondhealth.vn</span>
              </li>
            </ul>

            <div className="mt-4 flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                aria-label="Youtube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Diamond Health. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
