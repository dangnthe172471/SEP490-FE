"use client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Award, GraduationCap, Briefcase, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorHomeDto, ShiftResponseDto } from "@/lib/types/manager-type"
import { useEffect, useState } from "react"
export default function BacSiPage() {
  const [doctors, setDoctors] = useState<DoctorHomeDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6
  const indexOfLast = currentPage * pageSize
  const indexOfFirst = indexOfLast - pageSize

  const [searchTerm, setSearchTerm] = useState("")

  function removeVietnameseTones(str: string) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
  }
  const filteredDoctors = doctors.filter((d) => {
    const name = removeVietnameseTones(d.fullName)
    const specialty = removeVietnameseTones(d.specialty)
    const key = removeVietnameseTones(searchTerm)

    return name.includes(key) || specialty.includes(key)
  })

  const totalPages = Math.ceil(filteredDoctors.length / pageSize)
  const currentDoctors = filteredDoctors.slice(indexOfFirst, indexOfLast)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])


  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await managerService.getAllDoctors2()
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
          <div className="max-w-md mx-auto mb-10">
            <input
              type="text"
              placeholder="Tìm bác sĩ theo tên hoặc chuyên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border  px-6 py-3"
            />
          </div>

          <div className="container mx-auto px-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Đang tải danh sách bác sĩ...</p>
            ) : doctors.length === 0 ? (
              <p className="text-center text-muted-foreground">Chưa có bác sĩ nào.</p>
            ) : (

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {currentDoctors.map((doctor, index) => (

                  <Card
                    key={index}
                    className="group overflow-hidden border-none bg-white shadow-xl ring-1 ring-black/5 transition-all hover:-translate-y-2 hover:shadow-2xl"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                      <Image
                        src={
                          doctor.avatarUrl
                            ? doctor.avatarUrl.startsWith('http')
                              ? doctor.avatarUrl
                              : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.diamondhealth.io.vn'}${doctor.avatarUrl}`
                            : "/logo.png"
                        }
                        alt={doctor.fullName}
                        fill
                        className="object-contain transition-transform group-hover:scale-105"
                        unoptimized
                      />

                    </div>
                    <CardContent className="p-6">
                      <h3 className="mb-3 text-xl font-bold text-foreground">{doctor.fullName}</h3>

                      {/* Specialty */}
                      <div className="mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-primary">{doctor.specialty}</p>
                      </div>

                      {/* Experience Years */}
                      <div className="mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {doctor.experience} {parseInt(doctor.experience) === 1 ? 'năm' : 'năm'} kinh nghiệm
                        </p>
                      </div>

                      {/* Room */}
                      {doctor.roomName && (
                        <div className="mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Phòng: {doctor.roomName}
                          </p>
                        </div>
                      )}

                      <Link href="/lien-he">
                        <Button className="mt-4 w-full bg-primary hover:bg-primary/90">
                          <Calendar className="mr-2 h-4 w-4" />
                          Đặt lịch khám
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>)}
          </div>
          <div className="flex justify-center mt-10 gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Trang Trước
            </Button>

            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Trang sau
            </Button>
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