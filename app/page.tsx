"use client"
import {
  ChevronRight,
  Heart,
  Stethoscope,
  Calendar,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  Activity,
  Shield,
  Award,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PatientHomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Updated logo to use new image */}
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
              <Link href="/" className="text-sm font-medium text-primary">
                Trang chủ
              </Link>
              <Link href="#services" className="text-sm font-medium hover:text-primary transition-colors">
                Dịch vụ
              </Link>
              <Link href="#departments" className="text-sm font-medium hover:text-primary transition-colors">
                Đội ngũ bác sĩ
              </Link>
              <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                Về chúng tôi
              </Link>
              <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
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
      <section className="py-16 md:py-20 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Heart className="h-4 w-4" />
                Phòng khám đa khoa tin cậy tại Hồng đức
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                Kết nối người dân với <span className="text-primary">dịch vụ y tế</span> chất lượng cao
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                Đặt khám nhanh - Lấy số thứ tự truyền - Tư vấn sức khỏe từ xa với đội ngũ bác sĩ chuyên môn cao và trang
                thiết bị y tế hiện đại.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/appointments">
                    <Calendar className="h-5 w-5" />
                    Đặt lịch khám ngay
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
                  <a href="tel:1900xxxx">
                    <Phone className="h-5 w-5" />
                    Hotline: 1900-xxxx
                  </a>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div>
                  <div className="text-3xl font-bold text-primary">100K+</div>
                  <div className="text-sm text-muted-foreground">Lượt khám</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Bác sĩ</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">15+</div>
                  <div className="text-sm text-muted-foreground">Năm kinh nghiệm</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/modern-medical-clinic-reception-with-doctors-and-p.jpg"
                  alt="Diamond Health Clinic"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-card/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Chăm sóc tận tâm</div>
                      <div className="text-sm text-muted-foreground">Đặt lịch 24/7</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Vì sao chọn Diamond Health?</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với sự chuyên nghiệp
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Bác sĩ chuyên môn cao</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo bài bản
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Trang thiết bị hiện đại</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Công nghệ y tế tiên tiến, máy móc hiện đại
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Đặt lịch nhanh chóng</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Đặt lịch online 24/7, tiết kiệm thời gian chờ đợi
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">An toàn tuyệt đối</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Quy trình khám chữa bệnh an toàn, bảo mật thông tin
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary via-primary/95 to-accent text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Con số ấn tượng</h2>
            <p className="text-primary-foreground/80">Được hàng nghìn khách hàng tin tưởng</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">100K+</div>
              <div className="text-sm text-primary-foreground/80">Lượt khám</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
              <div className="text-sm text-primary-foreground/80">Cơ sở y tế</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-sm text-primary-foreground/80">Bác sĩ</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">5K+</div>
              <div className="text-sm text-primary-foreground/80">Lượt truy cập/ngày</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">200+</div>
              <div className="text-sm text-primary-foreground/80">Lịch đặt hẹn/ngày</div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section - Updated links to point to appointments page */}
      <section id="departments" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Các chuyên khoa khám chữa bệnh</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Cung cấp đa dạng các dịch vụ y tế chất lượng cao, đáp ứng mọi nhu cầu chăm sóc sức khỏe
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Nội tổng quát</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Giải quyết các bệnh mắn tính và cấp tính phổ biến như cao huyết áp, đái tháo đường, bệnh tim mạch.
                    Đội ngũ bác sĩ chuyên khoa có kinh nghiệm lâu năm trong chẩn đoán và điều trị.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Khám và điều trị bệnh lý tim mạch</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Bệnh lý hô hấp và tiêu hóa</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Quản lý bệnh mãn tính và huyết áp</span>
                  </li>
                </ul>
                <Button variant="link" className="p-0 h-auto font-semibold text-primary gap-2" asChild>
                  <Link href="/appointments">
                    Đặt lịch khám
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Nhi khoa</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nơi khám bệnh cho trẻ em từ sơ sinh đến 16 tuổi, điều trị các bệnh lý thường gặp ở trẻ, tư vấn dinh
                    dưỡng và phát triển. Chuyên khoa này có đội ngũ bác sĩ nhi khoa giàu kinh nghiệm.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Khám và điều trị bệnh lý trẻ em</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Bệnh lý dinh dưỡng và phát triển</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Tư vấn chăm sóc sức khỏe trẻ em</span>
                  </li>
                </ul>
                <Button variant="link" className="p-0 h-auto font-semibold text-primary gap-2" asChild>
                  <Link href="/appointments">
                    Đặt lịch khám
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Sản - Phụ khoa</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Nơi khám bệnh cho phụ nữ ở mọi lứa tuổi, tư vấn về sức khỏe sinh sản, khám thai định kỳ và các bệnh
                    lý phụ khoa. Chuyên khoa này có đội ngũ bác sĩ sản phụ khoa giàu kinh nghiệm trong chăm sóc sức khỏe
                    phụ nữ.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Khám thai định kỳ và siêu âm thai</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Tư vấn kế hoạch hóa gia đình</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Điều trị bệnh lý phụ khoa</span>
                  </li>
                </ul>
                <Button variant="link" className="p-0 h-auto font-semibold text-primary gap-2" asChild>
                  <Link href="/appointments">
                    Đặt lịch khám
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Đội ngũ bác sĩ chuyên môn cao</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Các bác sĩ giàu kinh nghiệm, tận tâm và được đào tạo bài bản
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: "BS. Nguyễn Văn A", specialty: "Nội tổng quát", exp: "15+ năm" },
              { name: "BS. Trần Thị B", specialty: "Sản - Phụ khoa", exp: "12+ năm" },
              { name: "BS. Lê Văn C", specialty: "Nhi khoa", exp: "10+ năm" },
              { name: "BS. Phạm Thị D", specialty: "Nội tổng quát", exp: "8+ năm" },
            ].map((doctor, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                  <img
                    src={`/placeholder.svg?height=400&width=300&query=professional vietnamese doctor in white coat`}
                    alt={doctor.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6 text-center space-y-2">
                  <h3 className="font-semibold text-lg">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-primary">
                    <Award className="h-4 w-4" />
                    <span>{doctor.exp} kinh nghiệm</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Liên hệ với chúng tôi</h2>
              <p className="text-lg text-muted-foreground text-pretty">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">Địa chỉ</h4>
                  <p className="text-sm text-muted-foreground">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">Điện thoại</h4>
                  <p className="text-sm text-muted-foreground">(028) 1234 5678</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-sm text-muted-foreground">info@diamondhealth.vn</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Updated logo and links */}
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
                  <a href="#departments" className="hover:text-primary transition-colors">
                    Chuyên khoa
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-primary transition-colors">
                    Đội ngũ bác sĩ
                  </a>
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
                <li>
                  <Link href="/doctor" className="hover:text-primary transition-colors">
                    Dành cho bác sĩ
                  </Link>
                </li>
                <li>
                  <Link href="/reception" className="hover:text-primary transition-colors">
                    Dành cho lễ tân
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
