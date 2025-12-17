"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { serviceService } from "@/lib/services/service-service"
import type { ServiceDto } from "@/lib/types/service"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Baby, Calendar, Heart, Loader2, Phone, UserRound, ArrowRight, FlaskConical } from "lucide-react"

type SpecialtyKey = "dermatology" | "internal" | "pediatrics" | "test"

const SPECIALTIES: Record<
    SpecialtyKey,
    {
        name: string
        icon: typeof UserRound
        color: string
        bgColor: string
        ringColor: string
        hoverRingColor: string
        description: string
        category: string
    }
> = {
    dermatology: {
        name: "Da liễu",
        icon: UserRound,
        color: "from-pink-500 to-rose-500",
        bgColor: "from-pink/5 to-pink/10",
        ringColor: "ring-pink/10",
        hoverRingColor: "hover:ring-pink/20",
        description: "Chuyên khám và điều trị các bệnh về da với công nghệ hiện đại",
        category: "Dermatology",
    },
    internal: {
        name: "Nội tổng quát",
        icon: Heart,
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue/5 to-blue/10",
        ringColor: "ring-blue/10",
        hoverRingColor: "hover:ring-blue/20",
        description: "Khám sức khỏe tổng quát và điều trị bệnh nội khoa",
        category: "InternalMed",
    },
    pediatrics: {
        name: "Nhi khoa",
        icon: Baby,
        color: "from-amber-500 to-orange-500",
        bgColor: "from-amber/5 to-amber/10",
        ringColor: "ring-amber/10",
        hoverRingColor: "hover:ring-amber/20",
        description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi dậy thì",
        category: "Pediatric",
    },
    test: {
        name: "Loại xét nghiệm",
        icon: FlaskConical,
        color: "from-green-500 to-emerald-500",
        bgColor: "from-green/5 to-green/10",
        ringColor: "ring-green/10",
        hoverRingColor: "hover:ring-green/20",
        description: "Các gói và loại xét nghiệm chuyên sâu",
        category: "Test",
    },
}

const formatPrice = (price?: number | null) => {
    if (price === null || price === undefined) return "Liên hệ"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price)
}

export default function ServicesPage() {
    const searchParams = useSearchParams()
    const specialtyParam = (searchParams.get("specialty") as SpecialtyKey | null) || "dermatology"

    const [activeSpecialty, setActiveSpecialty] = useState<SpecialtyKey>(specialtyParam)
    const [services, setServices] = useState<ServiceDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchServices = async () => {
            try {
                setLoading(true)
                const data = await serviceService.getAll()
                if (!isMounted) return

                // Chỉ lấy các dịch vụ có trạng thái hoạt động (isActive = true)
                const activeServices = data.filter((s) => s.isActive === true)
                setServices(activeServices)

                // Nếu specialty hiện tại không có dịch vụ, chuyển sang chuyên khoa đầu tiên có dữ liệu
                const hasServicesForActive = activeServices.some((s) => s.category === SPECIALTIES[activeSpecialty]?.category)
                if (!hasServicesForActive) {
                    const firstWithData = (Object.keys(SPECIALTIES) as SpecialtyKey[]).find((key) =>
                        activeServices.some((s) => s.category === SPECIALTIES[key].category)
                    )
                    if (firstWithData) setActiveSpecialty(firstWithData)
                }
            } catch (err: any) {
                console.error("Failed to load services", err)
                if (!isMounted) return
                setError(err?.message || "Không thể tải danh sách dịch vụ")
                setServices([])
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchServices()

        return () => {
            isMounted = false
        }
    }, [activeSpecialty])


    const servicesBySpecialty = useMemo(() => {
        const grouped: Record<string, ServiceDto[]> = {}
        services.forEach((service) => {
            const entry = (Object.keys(SPECIALTIES) as SpecialtyKey[]).find(
                (key) => SPECIALTIES[key].category === service.category
            )
            if (entry) {
                grouped[entry] = grouped[entry] ? [...grouped[entry], service] : [service]
            }
        })
        return grouped
    }, [services])

    const currentSpecialtyConfig = SPECIALTIES[activeSpecialty]
    const currentServices = servicesBySpecialty[activeSpecialty] || []
    const Icon = currentSpecialtyConfig.icon

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1">
                <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
                    <div className="container mx-auto px-4 py-20 md:py-28">
                        <div className="mx-auto max-w-4xl text-center">
                            <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
                                Dịch vụ{" "}
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
                                        {(Object.keys(SPECIALTIES) as SpecialtyKey[]).map((key) => {
                                            const specialty = SPECIALTIES[key]
                                            const SpecialtyIcon = specialty.icon
                                            const hasData = (servicesBySpecialty[key]?.length ?? 0) > 0
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setActiveSpecialty(key)}
                                                    className={`group w-full rounded-xl px-4 py-4 text-left font-medium transition-all ${activeSpecialty === key
                                                        ? `bg-gradient-to-r ${specialty.color} text-white shadow-lg`
                                                        : "bg-muted text-foreground hover:bg-muted/80"
                                                        } ${!hasData ? "opacity-70" : ""}`}
                                                    disabled={!hasData}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <SpecialtyIcon className="h-5 w-5" />
                                                        <span>{specialty.name}</span>
                                                        {!hasData && <span className="text-xs text-muted-foreground">(Đang cập nhật)</span>}
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
                                                <span className="text-muted-foreground">1900-9999</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <span className="text-muted-foreground">8:00 - 22:00</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-3">
                                <div
                                    className={`mb-12 rounded-2xl bg-gradient-to-br ${currentSpecialtyConfig.bgColor} p-8 md:p-12 ring-1 ${currentSpecialtyConfig.ringColor}`}
                                >
                                    <div className="flex items-start gap-6">
                                        <div
                                            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentSpecialtyConfig.color} text-white shadow-lg`}
                                        >
                                            <Icon className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold md:text-4xl">{currentSpecialtyConfig.name}</h2>
                                            <p className="mt-2 text-lg text-muted-foreground">{currentSpecialtyConfig.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-2xl font-bold">Danh sách dịch vụ</h3>
                                        {loading && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    {!loading && currentServices.length === 0 && !error && (
                                        <div className="rounded-xl border border-border/60 bg-muted/40 p-6 text-center text-muted-foreground">
                                            Chưa có dịch vụ cho chuyên khoa này. Vui lòng chọn chuyên khoa khác hoặc quay lại sau.
                                        </div>
                                    )}

                                    <div className="grid gap-6 md:grid-cols-2">
                                        {loading
                                            ? Array.from({ length: 4 }).map((_, index) => (
                                                <Card
                                                    key={index}
                                                    className="border-2 border-border/50 transition-all hover:border-primary hover:shadow-lg"
                                                >
                                                    <CardHeader>
                                                        <CardTitle className="text-lg">
                                                            <span className="inline-block h-4 w-40 animate-pulse bg-muted" />
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            <span className="inline-block h-3 w-full animate-pulse bg-muted" />
                                                        </p>
                                                        <div className="flex items-center justify-between border-t pt-4">
                                                            <span className="text-sm font-medium text-muted-foreground">Giá:</span>
                                                            <span className="text-lg font-bold text-primary">
                                                                <span className="inline-block h-4 w-24 animate-pulse bg-muted" />
                                                            </span>
                                                        </div>
                                                        <Button disabled className="w-full">
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Đang tải
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))
                                            : currentServices.map((service) => (
                                                <Card
                                                    key={service.serviceId}
                                                    className="border-2 border-border/50 transition-all hover:border-primary hover:shadow-lg"
                                                >
                                                    <CardHeader>
                                                        <CardTitle className="text-lg">{service.serviceName}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            {service.description || "Đang cập nhật mô tả"}
                                                        </p>
                                                        <div className="flex items-center justify-between border-t pt-4">
                                                            <span className="text-sm font-medium text-muted-foreground">Giá:</span>
                                                            <span className="text-lg font-bold text-primary">{formatPrice(service.price)}</span>
                                                        </div>
                                                        <Link href={`/dich-vu/${activeSpecialty}/${service.serviceId}`}>
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
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
