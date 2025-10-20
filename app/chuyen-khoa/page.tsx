import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Baby, UserRound, CheckCircle2, ArrowRight, Calendar } from "lucide-react"

export default function ChuyenKhoaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
                Các chuyên khoa{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  khám chữa bệnh
                </span>
              </h1>
              <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                Cung cấp đa dạng các dịch vụ y tế chất lượng cao, đáp ứng mọi nhu cầu chăm sóc sức khỏe của bạn và gia
                đình
              </p>
            </div>
          </div>
        </section>

        {/* Services Detail */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group overflow-hidden border-none bg-white shadow-xl ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-2xl">
                <CardContent className="p-10">
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                    <Stethoscope className="h-10 w-10" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold">Nội tổng quát</h3>
                  <p className="mb-8 leading-relaxed text-muted-foreground">
                    Giải quyết các bệnh mãn tính và cấp tính phổ biến như: tim mạch, hô hấp, tiêu hóa, tiểu đường, huyết
                    áp. Đây là chuyên khoa có lượng bệnh nhân lớn và thường xuyên nhất.
                  </p>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Khám và điều trị bệnh tim mạch</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Bệnh lý hô hấp và tiêu hóa</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Quản lý tiểu đường và huyết áp</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Khám sức khỏe định kỳ</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Tư vấn dinh dưỡng và lối sống</span>
                    </div>
                  </div>
                  <Button variant="link" className="mt-8 p-0 text-base font-semibold text-primary hover:gap-2">
                    Đặt lịch khám
                    <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-none bg-white shadow-xl ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-2xl">
                <CardContent className="p-10">
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/25 transition-transform group-hover:scale-110">
                    <Baby className="h-10 w-10" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold">Nhi khoa</h3>
                  <p className="mb-8 leading-relaxed text-muted-foreground">
                    Nhu cầu khám bệnh cho trẻ em rất lớn, đặc biệt các bệnh lý hô hấp (viêm họng, viêm phế quản), tiêu
                    hóa. Rất quan trọng để thu hút đối tượng gia đình.
                  </p>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      <span className="leading-relaxed">Khám và điều trị bệnh hô hấp trẻ em</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      <span className="leading-relaxed">Bệnh lý tiêu hóa ở trẻ</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      <span className="leading-relaxed">Tư vấn dinh dưỡng và phát triển</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      <span className="leading-relaxed">Tiêm chủng và phòng ngừa</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      <span className="leading-relaxed">Khám sức khỏe định kỳ cho trẻ</span>
                    </div>
                  </div>
                  <Button variant="link" className="mt-8 p-0 text-base font-semibold text-secondary hover:gap-2">
                    Đặt lịch khám
                    <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-none bg-white shadow-xl ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-2xl md:col-span-2 lg:col-span-1">
                <CardContent className="p-10">
                  <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                    <UserRound className="h-10 w-10" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold">Da liễu</h3>
                  <p className="mb-8 leading-relaxed text-muted-foreground">
                    Chuyên khoa Da liễu cung cấp dịch vụ chẩn đoán, tư vấn và điều trị các bệnh lý về da như mụn trứng cá, viêm da, dị ứng, nấm da và các vấn đề về lão hóa da. Hỗ trợ chăm sóc và điều trị thẩm mỹ da chuyên sâu.
                  </p>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Khám và điều trị mụn trứng cá</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Điều trị viêm da, dị ứng da</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Tư vấn và chăm sóc da liễu chuyên sâu</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Điều trị nám, tàn nhang, lão hóa da</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="leading-relaxed">Điều trị nấm da, vảy nến, rụng tóc</span>
                    </div>
                  </div>
                  <Button variant="link" className="mt-8 p-0 text-base font-semibold text-primary hover:gap-2">
                    Đặt lịch khám
                    <ArrowRight className="ml-1 h-4 w-4 transition-all" />
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-600 py-20 text-primary-foreground md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-8">
              <h2 className="text-4xl font-bold text-balance md:text-5xl">Sẵn sàng đặt lịch khám?</h2>
              <p className="text-pretty text-xl leading-relaxed opacity-95">
                Liên hệ với chúng tôi ngay hôm nay để được tư vấn và chăm sóc bởi đội ngũ bác sĩ chuyên nghiệp
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="h-14 bg-secondary px-8 text-base font-semibold shadow-xl shadow-secondary/30 hover:bg-secondary/90 hover:shadow-2xl hover:shadow-secondary/40"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt lịch khám ngay
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
