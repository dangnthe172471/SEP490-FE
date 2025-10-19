import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Stethoscope,
  Heart,
  Activity,
  Clock,
  Shield,
  Phone,
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
          <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Phòng khám đa khoa uy tín hàng đầu
                </div>
                <div className="space-y-6">
                  <h1 className="text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                    Kết nối người dân với{" "}
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      dịch vụ y tế
                    </span>{" "}
                    chất lượng cao
                  </h1>
                  <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                    Đặt khám nhanh - Lấy số thứ tự trực tuyến - Tư vấn sức khỏe từ xa với đội ngũ bác sĩ chuyên môn cao
                    và trang thiết bị y tế hiện đại.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    className="h-14 bg-primary px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Đặt lịch khám ngay
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 border-2 border-primary/20 bg-white px-8 text-base font-semibold hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Hotline: 1900-xxxx
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 border-t-2 border-border pt-10">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary md:text-5xl">100K+</div>
                    <div className="text-sm font-medium text-muted-foreground">Lượt khám</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary md:text-5xl">50+</div>
                    <div className="text-sm font-medium text-muted-foreground">Bác sĩ</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary md:text-5xl">15+</div>
                    <div className="text-sm font-medium text-muted-foreground">Năm kinh nghiệm</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
                  <Image
                    src="/modern-healthcare-clinic-with-doctors-and-patients.jpg"
                    alt="Diamond Health Clinic"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Floating card */}
                <Card className="absolute -bottom-8 -left-8 w-80 border-none bg-white shadow-2xl ring-1 ring-black/5">
                  <CardContent className="flex items-center gap-5 p-7">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/80">
                      <Heart className="h-10 w-10 text-secondary-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xl font-bold">Chăm sóc tận tâm</div>
                      <div className="text-sm text-muted-foreground">Hỗ trợ 24/7</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b bg-white py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-5 text-4xl font-bold text-balance md:text-5xl">Vì sao chọn Diamond Health?</h2>
              <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với quy trình chuyên nghiệp
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="group border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                    <Stethoscope className="h-10 w-10" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">Bác sĩ chuyên môn cao</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo bài bản
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg ring-1 ring-secondary/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-secondary/20">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25 transition-transform group-hover:scale-110">
                    <Activity className="h-10 w-10" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">Trang thiết bị hiện đại</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Công nghệ y tế tiên tiến, chính xác cao
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                    <Clock className="h-10 w-10" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">Đặt lịch nhanh chóng</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Đặt lịch online tiện lợi, tiết kiệm thời gian
                  </p>
                </CardContent>
              </Card>

              <Card className="group border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg ring-1 ring-secondary/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-secondary/20">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25 transition-transform group-hover:scale-110">
                    <Shield className="h-10 w-10" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">An toàn tuyệt đối</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Quy trình khám chữa bệnh đạt chuẩn quốc tế
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-primary to-purple-600 py-20 text-primary-foreground md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08)_0%,transparent_50%)]"></div>
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
          <div className="container relative mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Con số ấn tượng</h2>
              <p className="text-lg opacity-90">Được hàng nghìn khách hàng tin tưởng</p>
            </div>
            <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-5">
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <Users className="h-12 w-12 opacity-90" />
                </div>
                <div className="mb-2 text-5xl font-bold">100K+</div>
                <div className="text-base font-medium opacity-90">Lượt khám</div>
              </div>
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <Building2 className="h-12 w-12 opacity-90" />
                </div>
                <div className="mb-2 text-5xl font-bold">3</div>
                <div className="text-base font-medium opacity-90">Cơ sở y tế</div>
              </div>
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <Stethoscope className="h-12 w-12 opacity-90" />
                </div>
                <div className="mb-2 text-5xl font-bold">50+</div>
                <div className="text-base font-medium opacity-90">Bác sĩ</div>
              </div>
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 opacity-90" />
                </div>
                <div className="mb-2 text-5xl font-bold">5K+</div>
                <div className="text-base font-medium opacity-90">Lượt truy cập/tháng</div>
              </div>
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <Calendar className="h-12 w-12 opacity-90" />
                </div>
                <div className="mb-2 text-5xl font-bold">200+</div>
                <div className="text-base font-medium opacity-90">Lượt đặt lịch/ngày</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links to Main Sections */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-5 text-4xl font-bold text-balance md:text-5xl">Khám phá dịch vụ của chúng tôi</h2>
              <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Tìm hiểu thêm về các chuyên khoa, đội ngũ bác sĩ và đánh giá từ khách hàng
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/chuyen-khoa">
                <Card className="group h-full border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/10 transition-all hover:-translate-y-2 hover:shadow-xl hover:ring-primary/20">
                  <CardContent className="flex h-full flex-col items-center p-8 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                      <Stethoscope className="h-10 w-10" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">Chuyên khoa</h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Khám phá các chuyên khoa khám chữa bệnh chất lượng cao
                    </p>
                    <Button variant="link" className="p-0 text-base font-semibold text-primary hover:gap-2">
                      Xem chi tiết
                      <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/bac-si">
                <Card className="group h-full border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg ring-1 ring-secondary/10 transition-all hover:-translate-y-2 hover:shadow-xl hover:ring-secondary/20">
                  <CardContent className="flex h-full flex-col items-center p-8 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25 transition-transform group-hover:scale-110">
                      <Users className="h-10 w-10" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">Đội ngũ bác sĩ</h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Gặp gỡ đội ngũ bác sĩ chuyên môn cao và giàu kinh nghiệm
                    </p>
                    <Button variant="link" className="p-0 text-base font-semibold text-secondary hover:gap-2">
                      Xem chi tiết
                      <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/danh-gia">
                <Card className="group h-full border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/10 transition-all hover:-translate-y-2 hover:shadow-xl hover:ring-primary/20">
                  <CardContent className="flex h-full flex-col items-center p-8 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                      <Heart className="h-10 w-10" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">Đánh giá</h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Xem đánh giá và phản hồi từ khách hàng của chúng tôi
                    </p>
                    <Button variant="link" className="p-0 text-base font-semibold text-primary hover:gap-2">
                      Xem chi tiết
                      <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/lien-he">
                <Card className="group h-full border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg ring-1 ring-secondary/10 transition-all hover:-translate-y-2 hover:shadow-xl hover:ring-secondary/20">
                  <CardContent className="flex h-full flex-col items-center p-8 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25 transition-transform group-hover:scale-110">
                      <Phone className="h-10 w-10" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold">Liên hệ</h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Liên hệ với chúng tôi để được tư vấn và hỗ trợ
                    </p>
                    <Button variant="link" className="p-0 text-base font-semibold text-secondary hover:gap-2">
                      Xem chi tiết
                      <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-600 py-24 text-primary-foreground md:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12)_0%,transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"></div>
          <div className="absolute -left-20 bottom-20 h-80 w-80 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-10">
              <h2 className="text-4xl font-bold text-balance md:text-5xl">Sẵn sàng chăm sóc sức khỏe của bạn?</h2>
              <p className="text-pretty text-xl leading-relaxed opacity-95">
                Đặt lịch khám ngay hôm nay để được tư vấn và chăm sóc bởi đội ngũ bác sĩ chuyên nghiệp
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="h-14 bg-secondary px-8 text-base font-semibold shadow-xl shadow-secondary/30 hover:bg-secondary/90 hover:shadow-2xl hover:shadow-secondary/40"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt lịch khám ngay
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 border-2 border-primary-foreground/30 bg-primary-foreground/10 px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Gọi ngay: 1900-xxxx
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
