"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Award, Briefcase, GraduationCap, Check } from "lucide-react"

interface Service {
    id: string
    name: string
    price: string
}

interface Doctor {
    name: string
    specialty: string
    experience: string
    education: string
    achievements: string[]
}

const services: Service[] = [
    { id: "1", name: "Khám tư vấn nội tổng quát", price: "0 đ" },
    { id: "2", name: "Khám tư vấn nhi khoa", price: "0 đ" },
    { id: "3", name: "Khám tư vấn da liễu", price: "0 đ" },
]

const doctorsBySpecialty: Record<string, Doctor[]> = {
    "Khám tư vấn nội tổng quát": [
        {
            name: "BS. Nguyễn Văn A",
            specialty: "Nội tổng quát",
            experience: "15 năm kinh nghiệm",
            education: "Đại học Y Hà Nội",
            achievements: ["Bác sĩ ưu tú", "Chứng chỉ hành nghề"],
        },
        {
            name: "BS. Lê Văn C",
            specialty: "Nội tổng quát",
            experience: "18 năm kinh nghiệm",
            education: "Đại học Y Hà Nội",
            achievements: ["Tiến sĩ Y học", "Giảng viên đại học"],
        },
        {
            name: "BS. Hoàng Văn E",
            specialty: "Nội tổng quát",
            experience: "20 năm kinh nghiệm",
            education: "Đại học Y Hà Nội",
            achievements: ["Phó giáo sư", "Bác sĩ ưu tú"],
        },
    ],
    "Khám tư vấn da liễu": [
        {
            name: "BS. Trần Thị B",
            specialty: "Da liễu",
            experience: "12 năm kinh nghiệm",
            education: "Đại học Y Dược TP.HCM",
            achievements: ["Thạc sĩ Y học", "Chuyên gia tư vấn"],
        },
        {
            name: "BS. Vũ Thị F",
            specialty: "Da liễu",
            experience: "14 năm kinh nghiệm",
            education: "Đại học Y Dược TP.HCM",
            achievements: ["Thạc sĩ Y học", "Chuyên gia tư vấn"],
        },
    ],
    "Khám tư vấn nhi khoa": [
        {
            name: "BS. Phạm Thị D",
            specialty: "Nhi khoa",
            experience: "10 năm kinh nghiệm",
            education: "Đại học Y Dược TP.HCM",
            achievements: ["Bác sĩ chuyên khoa I", "Chứng chỉ hành nghề"],
        },
    ],
}

interface ServiceSelectionProps {
    onSelect: (service: string, price: string, doctor: string) => void
}

export function ServiceSelection({ onSelect }: ServiceSelectionProps) {
    const [selected, setSelected] = useState<string | null>(null)
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)

    const selectedService = services.find((s) => s.id === selected)
    const doctors = selectedService ? doctorsBySpecialty[selectedService.name] || [] : []

    const handleSelectDoctor = (doctorName: string) => {
        setSelectedDoctor(doctorName)
        if (selectedService) {
            onSelect(selectedService.name, selectedService.price, doctorName)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Chọn chuyên khoa</label>
                <select
                    value={selected || ""}
                    onChange={(e) => {
                        setSelected(e.target.value)
                        setSelectedDoctor(null)
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-white text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {services.map((service) => (
                        <option key={service.id} value={service.id}>
                            {service.name}
                        </option>
                    ))}
                </select>
            </div>

            {selected && doctors.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Chọn bác sĩ</h3>
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {doctors.map((doctor, index) => (
                            <Card
                                key={index}
                                onClick={() => handleSelectDoctor(doctor.name)}
                                className={`border-2 cursor-pointer transition-all ${selectedDoctor === doctor.name
                                        ? "border-primary bg-primary/5 shadow-md"
                                        : "border-border hover:shadow-md hover:border-primary/50"
                                    }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Stethoscope className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-foreground">{doctor.name}</h4>
                                                    <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
                                                </div>
                                                {selectedDoctor === doctor.name && (
                                                    <div className="p-1 rounded-full bg-primary">
                                                        <Check className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{doctor.experience}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{doctor.education}</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <Award className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {doctor.achievements.map((achievement, i) => (
                                                            <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                                                {achievement}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {selected && doctors.length === 0 && (
                <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                    Không có bác sĩ nào cho chuyên khoa này
                </div>
            )}
        </div>
    )
}
