"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRound,Droplet, Heart, Baby, ArrowRight, Phone, Calendar } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function ServicesPage() {
    const searchParams = useSearchParams()
    const specialtyParam = searchParams.get("specialty") || "dermatology"
    const [activeSpecialty, setActiveSpecialty] = useState(specialtyParam)

    const specialties = {
        dermatology: {
            name: "Da liễu",
            icon: UserRound,
            color: "from-pink-500 to-rose-500",
            bgColor: "from-pink/5 to-pink/10",
            ringColor: "ring-pink/10",
            hoverRingColor: "hover:ring-pink/20",
            description: "Chuyên khám và điều trị các bệnh về da với công nghệ hiện đại",
            services: [
                {
                    name: "Khám da liễu tổng quát",
                    description: "Tư vấn & kiểm tra tình trạng da",
                    price: "200.000đ",
                },
                {
                    name: "Điều trị mụn chuyên sâu",
                    description: "Phác đồ theo từng loại da",
                    price: "350.000 – 600.000đ/lần",
                },
                {
                    name: "Liệu trình phục hồi da sau mụn",
                    description: "5 buổi chăm sóc kết hợp ánh sáng sinh học",
                    price: "2.000.000đ/gói",
                },
                {
                    name: "Điều trị nám, tàn nhang bằng laser",
                    description: "Công nghệ Laser Q-switched",
                    price: "1.500.000đ/lần",
                },
            ],
        },
        internal: {
            name: "Nội tổng quát",
            icon: Heart,
            color: "from-blue-500 to-cyan-500",
            bgColor: "from-blue/5 to-blue/10",
            ringColor: "ring-blue/10",
            hoverRingColor: "hover:ring-blue/20",
            description: "Khám sức khỏe tổng quát và điều trị bệnh nội khoa",
            services: [
                {
                    name: "Khám sức khỏe tổng quát",
                    description: "Khám toàn thân, xét nghiệm cơ bản",
                    price: "450.000đ",
                },
                {
                    name: "Gói kiểm tra tim mạch",
                    description: "Siêu âm tim, ECG, xét nghiệm mỡ máu",
                    price: "700.000đ",
                },
                {
                    name: "Gói kiểm tra gan – thận",
                    description: "Siêu âm + xét nghiệm chức năng gan thận",
                    price: "850.000đ",
                },
                {
                    name: "Gói khám định kỳ cho nhân viên",
                    description: "Combo khám máu, huyết áp, mắt, răng, tai mũi họng",
                    price: "Liên hệ (theo số lượng)",
                },
            ],
        },
        pediatrics: {
            name: "Nhi khoa",
            icon: Baby,
            color: "from-amber-500 to-orange-500",
            bgColor: "from-amber/5 to-amber/10",
            ringColor: "ring-amber/10",
            hoverRingColor: "hover:ring-amber/20",
            description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi dậy thì",
            services: [
                {
                    name: "Khám tổng quát cho bé",
                    description: "Đánh giá tăng trưởng, dinh dưỡng",
                    price: "300.000đ",
                },
                {
                    name: "Tư vấn dinh dưỡng trẻ em",
                    description: "1 buổi gặp chuyên gia dinh dưỡng",
                    price: "200.000đ/buổi",
                },
                {
                    name: "Tiêm chủng & kiểm tra sức khỏe định kỳ",
                    description: "Theo phác đồ Bộ Y tế",
                    price: "Từ 350.000đ/lần",
                },
                {
                    name: "Gói khám hô hấp cho bé",
                    description: "X-quang phổi + xét nghiệm máu",
                    price: "600.000đ",
                },
            ],
        },
    }

    const currentSpecialty = specialties[activeSpecialty as keyof typeof specialties]
    const Icon = currentSpecialty.icon

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1">
             
                <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
                    <div className="container mx-auto px-4 py-20 md:py-28">
                        <div className="mx-auto max-w-4xl text-center">
                            <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
                                Dịch vụ {" "}
                                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                    khám chữa bệnh
                                </span>
                            </h1>
                            <p className="text-pretty text-xl leading-relaxed text-muted-foreground">
                                Khám phá các dịch vụ chất lượng cao của chúng tôi với đội ngũ bác sĩ chuyên gia và trang thiết bị hiện
                                đại
                            </p>
                        </div>
                    </div>
                </section>

                {/* Main Content with Sidebar */}
                <section className="bg-white py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid gap-8 lg:grid-cols-4">
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Chuyên khoa</h3>
                                        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-secondary"></div>
                                    </div>
                                    <div className="space-y-3">
                                        {Object.entries(specialties).map(([key, specialty]) => {
                                            const SpecialtyIcon = specialty.icon
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setActiveSpecialty(key)}
                                                    className={`group w-full rounded-xl px-4 py-4 text-left font-medium transition-all ${activeSpecialty === key
                                                            ? `bg-gradient-to-r ${specialty.color} text-white shadow-lg`
                                                            : "bg-muted text-foreground hover:bg-muted/80"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <SpecialtyIcon className="h-5 w-5" />
                                                        <span>{specialty.name}</span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <div className="mt-8 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4 ring-1 ring-primary/20">
                                        <h4 className="mb-3 font-semibold text-foreground">Cần hỗ trợ?</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-primary" />
                                                <span className="text-muted-foreground">1900-xxxx</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <span className="text-muted-foreground">8:00 - 20:00</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="lg:col-span-3">
                                {/* Specialty Header */}
                                <div
                                    className={`mb-12 rounded-2xl bg-gradient-to-br ${currentSpecialty.bgColor} p-8 md:p-12 ring-1 ${currentSpecialty.ringColor}`}
                                >
                                    <div className="flex items-start gap-6">
                                        <div
                                            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentSpecialty.color} text-white shadow-lg`}
                                        >
                                            <Icon className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold md:text-4xl">{currentSpecialty.name}</h2>
                                            <p className="mt-2 text-lg text-muted-foreground">{currentSpecialty.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Services Grid */}
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold">Danh sách dịch vụ</h3>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {currentSpecialty.services.map((service, index) => (
                                            <Card
                                                key={index}
                                                className="border-2 border-border/50 transition-all hover:border-primary hover:shadow-lg"
                                            >
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{service.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <p className="text-sm text-muted-foreground">{service.description}</p>
                                                    <div className="flex items-center justify-between border-t pt-4">
                                                        <span className="text-sm font-medium text-muted-foreground">Giá:</span>
                                                        <span className="text-lg font-bold text-primary">{service.price}</span>
                                                    </div>
                                                    <Link href={`/dich-vu/${activeSpecialty}/${index}`}>
                                                        <Button className="w-full bg-primary hover:bg-primary/90">
                                                            Xem chi tiết
                                                            <ArrowRight className="ml-2 h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA Section */}
                                {/* <div className="mt-16 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 p-8 md:p-12 text-center ring-1 ring-primary/20">
                                    <h3 className="mb-4 text-2xl font-bold">Cần tư vấn thêm?</h3>
                                    <p className="mb-6 text-muted-foreground">
                                        Liên hệ với chúng tôi để được tư vấn chi tiết về các dịch vụ
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                                            <Phone className="mr-2 h-5 w-5" />
                                            Gọi ngay: 1900-xxxx
                                        </Button>
                                        <Button size="lg" variant="outline">
                                            Liên hệ qua email
                                        </Button>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
