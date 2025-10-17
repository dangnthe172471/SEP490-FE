"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Clock, Mail, Calendar, MessageSquare } from "lucide-react"
import { BookingModal, type BookingData } from "@/components/booking-modal"

export default function LienHePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    specialty: "",
    service: "",
    date: "",
    time: "",
    message: "",
  })

  const handleBookingComplete = (data: BookingData) => {
    setFormData((prev) => ({
      ...prev,
      service: data.service || "",
      date: data.date || "",
      time: data.time || "",
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
                Liên hệ{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  với chúng tôi
                </span>
              </h1>
              <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                Hãy để lại thông tin, chúng tôi sẽ liên hệ với bạn sớm nhất để tư vấn và hỗ trợ
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info & Form */}
        <section className="bg-white py-24 md:py-32 relative">
          <div className="container mx-auto px-4">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              {/* Contact Information */}
              <div>
                <h2 className="mb-8 text-3xl font-bold">Thông tin liên hệ</h2>
                <p className="mb-12 text-lg leading-relaxed text-muted-foreground">
                  Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây.
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Card className="border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/10">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                        <MapPin className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Địa chỉ</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          123 Đường ABC, Quận 1, TP. Hồ Chí Minh
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg ring-1 ring-secondary/10">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25">
                        <Phone className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Hotline</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">1900-xxxx (Hỗ trợ 24/7)</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg ring-1 ring-primary/10">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                        <Mail className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Email</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">contact@diamondhealth.vn</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg ring-1 ring-secondary/10">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25">
                        <Clock className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Giờ làm việc</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">Thứ 2 - Chủ nhật: 7:00 - 20:00</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Contact Form */}
              <Card className="border-none bg-gradient-to-br from-muted/30 to-muted/50 shadow-2xl ring-1 ring-black/5">
                <CardContent className="p-10">
                  <div className="mb-8 flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <h3 className="text-3xl font-bold">Đặt lịch tư vấn</h3>
                  </div>
                  <form className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold">Họ và tên *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="h-12 w-full rounded-xl border-2 border-input bg-white px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold">Số điện thoại *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="h-12 w-full rounded-xl border-2 border-input bg-white px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-12 w-full rounded-xl border-2 border-input bg-white px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                        placeholder="Nhập email"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Đặt lịch khám</label>
                      <Button
                        type="button"
                        onClick={() => setIsBookingOpen(true)}
                        className="h-12 w-full bg-secondary text-white font-semibold hover:bg-secondary/90"
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        Chọn Dịch vụ và Thời gian
                      </Button>
                    </div>

                    {/* Display selected booking info */}
                    {formData.service && (
                      <div className="rounded-lg bg-secondary/10 p-4 border border-secondary/20">
                        <p className="text-sm font-semibold text-foreground mb-2">Thông tin đã chọn:</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {formData.service && <p>• Dịch vụ: {formData.service}</p>}
                          {formData.date && <p>• Ngày: {formData.date}</p>}
                          {formData.time && <p>• Giờ: {formData.time}</p>}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Nội dung</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                        placeholder="Nhập nội dung cần tư vấn"
                      />
                    </div>
                    <Button className="h-14 w-full bg-primary text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30">
                      <Calendar className="mr-2 h-5 w-5" />
                      Gửi thông tin đặt lịch
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <BookingModal
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
            onComplete={handleBookingComplete}
          />
        </section>

        {/* Map Section */}
        <section className="bg-gradient-to-b from-muted/30 to-white py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold">Vị trí phòng khám</h2>
              <p className="text-lg text-muted-foreground">Dễ dàng tìm đường đến phòng khám của chúng tôi</p>
            </div>
            <Card className="overflow-hidden border-none shadow-2xl ring-1 ring-black/5">
              <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-4 h-16 w-16 text-primary" />
                    <p className="text-lg font-semibold text-muted-foreground">Bản đồ sẽ được hiển thị tại đây</p>
                    <p className="text-sm text-muted-foreground">123 Đường ABC, Quận 1, TP. Hồ Chí Minh</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
