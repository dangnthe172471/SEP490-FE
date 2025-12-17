import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote, Calendar } from "lucide-react"
import Link from "next/link"
export default function DanhGiaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
                Khách hàng{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  nói gì về chúng tôi
                </span>
              </h1>
              <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ chăm sóc sức khỏe của Diamond Health
              </p>
            </div>
          </div>
        </section>

        {/* Overall Rating */}
        <section className="border-b bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <Card className="border-none bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl ring-1 ring-black/5">
                <CardContent className="p-10 text-center">
                  <div className="mb-6 text-7xl font-bold text-primary">4.9</div>
                  <div className="mb-4 flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-8 w-8 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-xl font-semibold text-muted-foreground">Dựa trên 1,234 đánh giá</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="bg-gradient-to-b from-muted/30 to-white py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Anh Minh Tuấn",
                  location: "Quận 1, TP.HCM",
                  comment:
                    "Dịch vụ tuyệt vời, bác sĩ tận tâm và chuyên nghiệp. Quy trình đặt lịch rất nhanh chóng và tiện lợi. Tôi rất hài lòng với chất lượng khám chữa bệnh tại đây!",
                  rating: 5,
                  date: "15/03/2024",
                },
                {
                  name: "Chị Thu Hương",
                  location: "Quận 3, TP.HCM",
                  comment:
                    "Phòng khám sạch sẽ, hiện đại. Nhân viên thân thiện và chu đáo. Bác sĩ khám rất kỹ và tư vấn chi tiết. Tôi sẽ giới thiệu cho bạn bè và người thân.",
                  rating: 5,
                  date: "12/03/2024",
                },
                {
                  name: "Anh Đức Anh",
                  location: "Quận 7, TP.HCM",
                  comment:
                    "Quy trình khám nhanh chóng, kết quả chính xác. Giá cả hợp lý. Rất đáng tin cậy và chuyên nghiệp! Tôi đã khám ở đây nhiều lần và luôn hài lòng.",
                  rating: 5,
                  date: "10/03/2024",
                },
                {
                  name: "Chị Lan Anh",
                  location: "Quận 2, TP.HCM",
                  comment:
                    "Bác sĩ rất tận tình, giải thích rõ ràng về tình trạng sức khỏe. Phòng khám có đầy đủ trang thiết bị hiện đại. Tôi cảm thấy yên tâm khi khám ở đây.",
                  rating: 5,
                  date: "08/03/2024",
                },
                {
                  name: "Anh Quang Huy",
                  location: "Bình Thạnh, TP.HCM",
                  comment:
                    "Đặt lịch online rất tiện lợi, không phải chờ đợi lâu. Bác sĩ chuyên môn cao, khám bệnh kỹ lưỡng. Giá cả phải chăng, phù hợp với túi tiền.",
                  rating: 5,
                  date: "05/03/2024",
                },
                {
                  name: "Chị Mai Phương",
                  location: "Quận 10, TP.HCM",
                  comment:
                    "Tôi đã khám thai ở đây suốt thai kỳ. Bác sĩ rất tận tâm và chu đáo. Phòng khám sạch sẽ, nhân viên thân thiện. Tôi rất hài lòng và tin tưởng.",
                  rating: 5,
                  date: "02/03/2024",
                },
                {
                  name: "Anh Hoàng Long",
                  location: "Tân Bình, TP.HCM",
                  comment:
                    "Dịch vụ chuyên nghiệp, bác sĩ giàu kinh nghiệm. Quy trình khám bệnh rõ ràng, minh bạch. Tôi đã giới thiệu cho nhiều người quen và họ đều hài lòng.",
                  rating: 5,
                  date: "28/02/2024",
                },
                {
                  name: "Chị Thanh Hà",
                  location: "Phú Nhuận, TP.HCM",
                  comment:
                    "Phòng khám có không gian thoải mái, sạch sẽ. Bác sĩ khám rất kỹ và tư vấn chi tiết. Nhân viên lễ tân nhiệt tình hỗ trợ. Tôi rất hài lòng!",
                  rating: 5,
                  date: "25/02/2024",
                },
                {
                  name: "Anh Tuấn Kiệt",
                  location: "Gò Vấp, TP.HCM",
                  comment:
                    "Tôi đã khám ở nhiều phòng khám nhưng Diamond Health là nơi tôi hài lòng nhất. Bác sĩ chuyên môn cao, tận tâm. Giá cả hợp lý, dịch vụ tốt.",
                  rating: 5,
                  date: "22/02/2024",
                },
              ].map((testimonial, index) => (
                <Card
                  key={index}
                  className="border-none bg-white shadow-xl ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <CardContent className="p-8">
                    <Quote className="mb-4 h-10 w-10 text-primary/20" />
                    <div className="mb-6 flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                      ))}
                    </div>
                    <p className="mb-6 text-base leading-relaxed text-muted-foreground">"{testimonial.comment}"</p>
                    <div className="border-t pt-4">
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{testimonial.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-600 py-20 text-primary-foreground md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-8">
              <h2 className="text-4xl font-bold text-balance md:text-5xl">Trải nghiệm dịch vụ của chúng tôi</h2>
              <p className="text-pretty text-xl leading-relaxed opacity-95">
                Hãy để chúng tôi chăm sóc sức khỏe của bạn với đội ngũ bác sĩ chuyên nghiệp và tận tâm
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/lien-he">
                <Button
                  size="lg"
                  className="h-14 bg-secondary px-8 text-base font-semibold shadow-xl shadow-secondary/30 hover:bg-secondary/90 hover:shadow-2xl hover:shadow-secondary/40"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt lịch khám ngay
                </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
