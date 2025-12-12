"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { serviceService } from "@/lib/services/service-service"
import type { ServiceDto } from "@/lib/types/service"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Baby, CheckCircle, Heart, Loader2, Shield, UserRound, Wallet } from "lucide-react"

type SpecialtyKey = "dermatology" | "internal" | "pediatrics"

const SPECIALTIES: Record<
    SpecialtyKey,
    {
        name: string
        icon: typeof UserRound
        color: string
        bgColor: string
        description: string
        category: string
    }
> = {
    dermatology: {
        name: "Da liễu",
        icon: UserRound,
        color: "from-pink-500 to-rose-500",
        bgColor: "from-pink/5 to-pink/10",
        description: "Chuyên khám và điều trị các bệnh về da với công nghệ hiện đại",
        category: "Dermatology",
    },
    internal: {
        name: "Nội tổng quát",
        icon: Heart,
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue/5 to-blue/10",
        description: "Khám sức khỏe tổng quát và điều trị bệnh nội khoa",
        category: "InternalMed",
    },
    pediatrics: {
        name: "Nhi khoa",
        icon: Baby,
        color: "from-amber-500 to-orange-500",
        bgColor: "from-amber/5 to-amber/10",
        description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi dậy thì",
        category: "Pediatric",
    },
}

const formatPrice = (price?: number | null) => {
    if (price === null || price === undefined) return "Liên hệ"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price)
}

export default function ServiceDetailPage() {
    const params = useParams()
    const specialtyParam = params.specialty as string
    const serviceId = Number.parseInt(params.serviceId as string)

    const specialtyKey = useMemo(() => {
        const keys = Object.keys(SPECIALTIES) as SpecialtyKey[]
        return keys.includes(specialtyParam as SpecialtyKey) ? (specialtyParam as SpecialtyKey) : ("dermatology" as SpecialtyKey)
    }, [specialtyParam])

    const specialtyConfig = SPECIALTIES[specialtyKey]
    const Icon = specialtyConfig.icon

    const [service, setService] = useState<ServiceDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!serviceId || Number.isNaN(serviceId)) {
            setError("Mã dịch vụ không hợp lệ")
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchService = async () => {
            try {
                setLoading(true)
                const data = await serviceService.getById(serviceId)
                if (!isMounted) return
                setService(data)
                setError(null)
            } catch (err: any) {
                console.error("Failed to load service detail", err)
                if (!isMounted) return
                setError(err?.message || "Không thể tải thông tin dịch vụ")
                setService(null)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchService()

        return () => {
            isMounted = false
        }
    }, [serviceId])

    const benefits = [
        "Đội ngũ bác sĩ chuyên môn cao",
        "Trang thiết bị hiện đại",
        "Quy trình thăm khám tiêu chuẩn",
        "Hỗ trợ tư vấn sau dịch vụ",
    ]

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang tải thông tin dịch vụ...
                </div>
            )
        }

        if (error || !service) {
            return (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
                    {error || "Không tìm thấy dịch vụ"}
                </div>
            )
        }

        return (
            <div className="grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-2 border-border/50">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${specialtyConfig.color} text-white`}
                                >
                                    <Icon className="h-8 w-8" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">{service.serviceName}</CardTitle>
                                    <p className="mt-2 text-muted-foreground">
                                        {service.description || specialtyConfig.description || "Đang cập nhật mô tả"}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Mô tả chi tiết</h2>
                        <p className="text-lg leading-relaxed text-muted-foreground">
                            {service.description ||
                                "Dịch vụ đang được cập nhật thêm thông tin chi tiết. Vui lòng liên hệ để được hỗ trợ nhanh nhất."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Lợi ích chính</h2>
                        <div className="grid gap-3">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Giá dịch vụ</p>
                                    <Wallet className="h-5 w-5 text-primary" />
                                </div>
                                <p className="text-3xl font-bold text-primary">{formatPrice(service.price)}</p>
                                <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-base">Đặt lịch khám</Button>
                                <Button variant="outline" className="w-full h-12 bg-transparent">
                                    Liên hệ tư vấn
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-border/50">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Chuyên khoa</p>
                                        <p className="text-sm text-muted-foreground">{specialtyConfig.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border-t pt-4">
                                    <UserRound className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Trạng thái</p>
                                        <p className="text-sm text-muted-foreground">
                                            {service.isActive ? "Đang cung cấp" : "Tạm ngưng"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border-t pt-4">
                                    <ArrowLeft className="h-5 w-5 text-primary rotate-180" />
                                    <div>
                                        <p className="text-sm font-medium">Mã dịch vụ</p>
                                        <p className="text-sm text-muted-foreground">#{service.serviceId}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1">
                <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <Link href="/dich-vu">
                            <Button variant="ghost" className="mb-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại
                            </Button>
                        </Link>
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-balance md:text-5xl">
                                {service?.serviceName || "Dịch vụ"}
                            </h1>
                            <p className="mt-4 text-lg text-muted-foreground">{specialtyConfig.name}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white py-12 md:py-16">
                    <div className="container mx-auto px-4">{renderContent()}</div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
