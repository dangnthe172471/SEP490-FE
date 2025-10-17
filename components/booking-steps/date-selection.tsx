"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateSelectionProps {
    onSelect: (date: string) => void
    onChangeService?: () => void
}

export function DateSelection({ onSelect, onChangeService }: DateSelectionProps) {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 23)) // October 23, 2025
    const [selectedDate, setSelectedDate] = useState<number | null>(null)

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }).toUpperCase()
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const handleSelectDate = (day: number) => {
        setSelectedDate(day)
        const dateStr = `${day}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
        onSelect(dateStr)
    }

    return (
        <div className="space-y-8">
            {/* Calendar Header */}
            <div className="rounded-xl bg-gradient-to-r from-secondary to-secondary/80 p-6 text-white">
                <div className="flex items-center justify-between">
                    <button onClick={handlePrevMonth} className="rounded-lg hover:bg-white/20 p-2 transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h3 className="text-xl font-bold">{monthName}</h3>
                    <button onClick={handleNextMonth} className="rounded-lg hover:bg-white/20 p-2 transition-colors">
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-xl border-2 border-border bg-white p-6">
                {/* Day headers */}
                <div className="mb-4 grid grid-cols-7 gap-2 text-center">
                    {["CN", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy"].map((day) => (
                        <div key={day} className="py-2 font-semibold text-muted-foreground text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                    {emptyDays.map((i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => handleSelectDate(day)}
                            className={`aspect-square rounded-lg font-semibold transition-all ${selectedDate === day
                                    ? "bg-secondary text-white shadow-lg"
                                    : "border-2 border-border text-foreground hover:border-secondary hover:bg-secondary/10"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">Tất cả thời gian theo múi giờ Việt Nam GMT +7</p>

            {onChangeService && (
                <div className="flex justify-center">
                    <button
                        onClick={onChangeService}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline"
                    >
                        Đổi dịch vụ
                    </button>
                </div>
            )}
        </div>
    )
}
