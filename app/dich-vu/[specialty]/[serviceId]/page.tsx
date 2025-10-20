"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserRound, Heart, Baby, ArrowLeft, Clock, Users, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function ServiceDetailPage() {
    const params = useParams()
    const specialty = params.specialty as string
    const serviceId = Number.parseInt(params.serviceId as string)

    const specialties = {
        dermatology: {
            name: "Da liễu",
            icon: UserRound,
            color: "from-pink-500 to-rose-500",
            bgColor: "from-pink/5 to-pink/10",
            description: "Chuyên khám và điều trị các bệnh về da với công nghệ hiện đại",
            services: [
                {
                    name: "Khám da liễu tổng quát",
                    description: "Tư vấn & kiểm tra tình trạng da",
                    price: "200.000đ",
                    details:
                        "Bác sĩ da liễu sẽ thực hiện kiểm tra toàn diện tình trạng da của bạn, đưa ra tư vấn chuyên sâu về chăm sóc da phù hợp với loại da của bạn.",
                    duration: "30-45 phút",
                    benefits: [
                        "Đánh giá chi tiết tình trạng da",
                        "Tư vấn chăm sóc da cá nhân hóa",
                        "Phát hiện sớm các vấn đề về da",
                        "Lập kế hoạch điều trị phù hợp",
                    ],
                },
                {
                    name: "Điều trị mụn chuyên sâu",
                    description: "Phác đồ theo từng loại da",
                    price: "350.000 – 600.000đ/lần",
                    details:
                        "Sử dụng các phương pháp điều trị hiện đại được tùy chỉnh theo loại da và mức độ mụn của bạn. Kết hợp nhiều kỹ thuật để đạt hiệu quả tối ưu.",
                    duration: "45-60 phút",
                    benefits: [
                        "Phác đồ điều trị cá nhân hóa",
                        "Sử dụng công nghệ hiện đại",
                        "Giảm mụn hiệu quả",
                        "Hạn chế tái phát",
                    ],
                },
                {
                    name: "Liệu trình phục hồi da sau mụn",
                    description: "5 buổi chăm sóc kết hợp ánh sáng sinh học",
                    price: "2.000.000đ/gói",
                    details:
                        "Liệu trình 5 buổi chuyên biệt giúp phục hồi da sau mụn, giảm sẹo, cải thiện kết cấu da bằng công nghệ ánh sáng sinh học tiên tiến.",
                    duration: "60 phút/buổi",
                    benefits: ["Giảm sẹo mụn hiệu quả", "Cải thiện kết cấu da", "Tăng độ sáng mịn", "Kết quả lâu dài"],
                },
                {
                    name: "Điều trị nám, tàn nhang bằng laser",
                    description: "Công nghệ Laser Q-switched",
                    price: "1.500.000đ/lần",
                    details:
                        "Sử dụng công nghệ Laser Q-switched tiên tiến để loại bỏ nám và tàn nhang một cách an toàn và hiệu quả, không để lại sẹo.",
                    duration: "30-45 phút",
                    benefits: ["Loại bỏ nám và tàn nhang", "Công nghệ an toàn", "Không để lại sẹo", "Kết quả nhanh chóng"],
                },
            ],
        },
        internal: {
            name: "Nội tổng quát",
            icon: Heart,
            color: "from-blue-500 to-cyan-500",
            bgColor: "from-blue/5 to-blue/10",
            description: "Khám sức khỏe tổng quát và điều trị bệnh nội khoa",
            services: [
                {
                    name: "Khám sức khỏe tổng quát",
                    description: "Khám toàn thân, xét nghiệm cơ bản",
                    price: "450.000đ",
                    details:
                        "Khám sức khỏe toàn diện bao gồm kiểm tra các chỉ số sức khỏe cơ bản, xét nghiệm máu, và tư vấn về lối sống lành mạnh.",
                    duration: "60-90 phút",
                    benefits: [
                        "Kiểm tra sức khỏe toàn diện",
                        "Xét nghiệm cơ bản",
                        "Phát hiện sớm bệnh lý",
                        "Tư vấn phòng ngừa bệnh",
                    ],
                },
                {
                    name: "Gói kiểm tra tim mạch",
                    description: "Siêu âm tim, ECG, xét nghiệm mỡ máu",
                    price: "700.000đ",
                    details:
                        "Gói kiểm tra chuyên sâu tim mạch bao gồm siêu âm tim, điện tâm đồ, và xét nghiệm mỡ máu để đánh giá sức khỏe tim mạch.",
                    duration: "90 phút",
                    benefits: ["Đánh giá chức năng tim", "Phát hiện bệnh tim sớm", "Kiểm tra mỡ máu", "Tư vấn phòng ngừa"],
                },
                {
                    name: "Gói kiểm tra gan – thận",
                    description: "Siêu âm + xét nghiệm chức năng gan thận",
                    price: "850.000đ",
                    details:
                        "Kiểm tra chuyên sâu chức năng gan và thận bằng siêu âm và xét nghiệm máu, giúp phát hiện sớm các vấn đề về gan thận.",
                    duration: "75 phút",
                    benefits: [
                        "Đánh giá chức năng gan thận",
                        "Phát hiện bệnh lý sớm",
                        "Xét nghiệm chức năng",
                        "Tư vấn chế độ ăn",
                    ],
                },
                {
                    name: "Gói khám định kỳ cho nhân viên",
                    description: "Combo khám máu, huyết áp, mắt, răng, tai mũi họng",
                    price: "Liên hệ (theo số lượng)",
                    details:
                        "Gói khám sức khỏe định kỳ toàn diện cho nhân viên công ty, bao gồm các xét nghiệm và kiểm tra cơ bản.",
                    duration: "120 phút",
                    benefits: ["Khám toàn diện", "Giá ưu đãi cho tập thể", "Lập lịch linh hoạt", "Báo cáo chi tiết"],
                },
            ],
        },
        pediatrics: {
            name: "Nhi khoa",
            icon: Baby,
            color: "from-amber-500 to-orange-500",
            bgColor: "from-amber/5 to-amber/10",
            description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi dậy thì",
            services: [
                {
                    name: "Khám tổng quát cho bé",
                    description: "Đánh giá tăng trưởng, dinh dưỡng",
                    price: "300.000đ",
                    details:
                        "Bác sĩ nhi khoa sẽ kiểm tra sức khỏe tổng quát của bé, đánh giá tăng trưởng, phát triển và tình trạng dinh dưỡng.",
                    duration: "30-45 phút",
                    benefits: [
                        "Đánh giá tăng trưởng phát triển",
                        "Kiểm tra sức khỏe toàn diện",
                        "Tư vấn dinh dưỡng",
                        "Phát hiện sớm bất thường",
                    ],
                },
                {
                    name: "Tư vấn dinh dưỡng trẻ em",
                    description: "1 buổi gặp chuyên gia dinh dưỡng",
                    price: "200.000đ/buổi",
                    details:
                        "Chuyên gia dinh dưỡng sẽ tư vấn chi tiết về chế độ ăn phù hợp với độ tuổi và tình trạng sức khỏe của bé.",
                    duration: "45-60 phút",
                    benefits: [
                        "Tư vấn dinh dưỡng cá nhân",
                        "Lập thực đơn phù hợp",
                        "Giải đáp thắc mắc",
                        "Hỗ trợ phát triển tối ưu",
                    ],
                },
                {
                    name: "Tiêm chủng & kiểm tra sức khỏe định kỳ",
                    description: "Theo phác đồ Bộ Y tế",
                    price: "Từ 350.000đ/lần",
                    details: "Tiêm chủng theo phác đồ Bộ Y tế và kiểm tra sức khỏe định kỳ để đảm bảo bé phát triển khỏe mạnh.",
                    duration: "30-45 phút",
                    benefits: ["Tiêm chủng đầy đủ", "Theo phác đồ Bộ Y tế", "Kiểm tra sức khỏe", "Ghi chép chi tiết"],
                },
                {
                    name: "Gói khám hô hấp cho bé",
                    description: "X-quang phổi + xét nghiệm máu",
                    price: "600.000đ",
                    details:
                        "Gói khám chuyên sâu hô hấp cho bé bao gồm X-quang phổi và xét nghiệm máu để đánh giá sức khỏe hô hấp.",
                    duration: "60 phút",
                    benefits: ["Đánh giá sức khỏe hô hấp", "X-quang phổi", "Xét nghiệm máu", "Tư vấn điều trị"],
                },
            ],
        },
    }

    const currentSpecialty = specialties[specialty as keyof typeof specialties]
    const service = currentSpecialty?.services[serviceId]
    const Icon = currentSpecialty?.icon

    if (!currentSpecialty || !service) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Dịch vụ không tìm thấy</h1>
                        <Link href="/dich-vu">
                            <Button className="mt-4">Quay lại trang dịch vụ</Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5 py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <Link href="/dich-vu">
                            <Button variant="ghost" className="mb-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại
                            </Button>
                        </Link>
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-balance md:text-5xl">{service.name}</h1>
                            <p className="mt-4 text-lg text-muted-foreground">{currentSpecialty.name}</p>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className="bg-white py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid gap-12 lg:grid-cols-3">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Service Header Card */}
                                <Card className="border-2 border-border/50">
                                    <CardHeader>
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${currentSpecialty.color} text-white`}
                                            >
                                                <Icon className="h-8 w-8" />
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-2xl">{service.name}</CardTitle>
                                                <p className="mt-2 text-muted-foreground">{service.description}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Description */}
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">Mô tả chi tiết</h2>
                                    <p className="text-lg leading-relaxed text-muted-foreground">{service.details}</p>
                                </div>

                                {/* Benefits */}
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold">Lợi ích chính</h2>
                                    <div className="grid gap-3">
                                        {service.benefits.map((benefit, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                                <span className="text-muted-foreground">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration */}
                                <Card className="border-2 border-border/50 bg-muted/50">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center gap-3">
                                            <Clock className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="font-medium">Thời gian dự kiến</p>
                                                <p className="text-muted-foreground">{service.duration}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 space-y-6">
                                    {/* Price Card */}
                                    <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                                        <CardContent className="pt-6 space-y-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-2">Giá dịch vụ</p>
                                                <p className="text-3xl font-bold text-primary">{service.price}</p>
                                            </div>
                                            <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-base">Đặt lịch khám</Button>
                                            <Button variant="outline" className="w-full h-12 bg-transparent">
                                                Liên hệ tư vấn
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Info Card */}
                                    <Card className="border-2 border-border/50">
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Users className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">Bác sĩ chuyên khoa</p>
                                                    <p className="text-sm text-muted-foreground">Kinh nghiệm 10+ năm</p>
                                                </div>
                                            </div>
                                            <div className="border-t pt-4">
                                                <p className="text-sm font-medium mb-2">Địa chỉ</p>
                                                <p className="text-sm text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12 md:py-16">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-4">Sẵn sàng để khám?</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Liên hệ với chúng tôi ngay hôm nay để đặt lịch khám hoặc nhận tư vấn chi tiết
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button size="lg" className="bg-primary hover:bg-primary/90">
                                Gọi ngay: 1900-xxxx
                            </Button>
                            <Button size="lg" variant="outline">
                                Liên hệ qua email
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
