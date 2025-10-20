"use client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Award, GraduationCap, Briefcase } from "lucide-react"
import Image from "next/image"

import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto, ShiftResponseDto } from "@/lib/types/manager-type"
import { useEffect, useState } from "react"
export default function BacSiPage() {
  const [doctors, setDoctors] = useState<DoctorDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await managerService.getAllDoctors()
        setDoctors(data)
      } catch (err) {
        console.error("Lỗi tải danh sách bác sĩ:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
                Đội ngũ{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  bác sĩ chuyên môn cao
                </span>
              </h1>
              <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                Các bác sĩ giàu kinh nghiệm, tận tâm và được đào tạo bài bản tại các trường y khoa hàng đầu
              </p>
            </div>
          </div>
        </section>

        {/* Doctors Grid */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Đang tải danh sách bác sĩ...</p>
            ) : doctors.length === 0 ? (
              <p className="text-center text-muted-foreground">Chưa có bác sĩ nào.</p>
            ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor, index) => (
                <Card
                  key={index}
                  className="group overflow-hidden border-none bg-white shadow-xl ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                    <Image
                      src={`/professional-vietnamese-doctor-in-white-coat-smili.jpg?key=uj04j&height=400&width=400&query=professional Vietnamese doctor in white coat smiling portrait ${doctor.specialty}`}
                      alt={doctor.fullName}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-xl font-bold">{doctor.fullName}</h3>
                    <p className="mb-4 text-sm font-semibold text-primary">{doctor.specialty}</p>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">experience</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground"> education </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-wrap gap-2">
                          {/* {doctor.achievements.map((achievement, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {achievement}
                            </span>
                          ))} */}
                          achievements
                        </div>
                      </div>
                    </div>

                    <Button className="mt-6 w-full bg-primary hover:bg-primary/90">
                      <Calendar className="mr-2 h-4 w-4" />
                      Đặt lịch khám
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>)}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-600 py-20 text-primary-foreground md:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12)_0%,transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
          <div className="container relative mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl space-y-8">
              <h2 className="text-4xl font-bold text-balance md:text-5xl">Tìm bác sĩ phù hợp với bạn</h2>
              <p className="text-pretty text-xl leading-relaxed opacity-95">
                Đặt lịch khám với bác sĩ chuyên khoa phù hợp để được tư vấn và chăm sóc tốt nhất
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
