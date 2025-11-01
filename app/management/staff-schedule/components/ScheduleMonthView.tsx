"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { managerService } from "@/lib/services/manager-service"
import type { DailySummaryDto } from "@/lib/types/manager-type"

interface ScheduleMonthViewProps {
    schedules: any[]
}

export default function ScheduleMonthView({ schedules }: ScheduleMonthViewProps) {
    const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
    const [summaries, setSummaries] = useState<DailySummaryDto[]>([])
    const [loading, setLoading] = useState(false)
    const [showMonthPicker, setShowMonthPicker] = useState(false)

    // 🔹 Gọi API
    const fetchSummary = async () => {
        setLoading(true)
        try {
            const data = await managerService.getMonthlySummary(currentYear, currentMonth + 1)
            console.log("📅 Dữ liệu tháng:", currentMonth + 1, currentYear, data)
            setSummaries(data || [])
        } catch (err) {
            console.error("❌ Lỗi khi tải thống kê tháng:", err)
            setSummaries([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSummary()
    }, [currentMonth, currentYear])

    // 🔹 Tạo danh sách ngày trong tháng
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()
    const days = Array.from({ length: totalDays }, (_, i) => {
        const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
        const summary = summaries.find((s) => new Date(s.date).getDate() === i + 1)
        return {
            day: i + 1,
            date,
            shiftCount: summary?.shiftCount ?? 0,
            doctorCount: summary?.doctorCount ?? 0,
        }
    })

    // 🔹 Chia ngày thành tuần (7 ngày / tuần)
    const weeks: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7))
    }

    // 🔹 Điều hướng tháng
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else setCurrentMonth(currentMonth - 1)
    }

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else setCurrentMonth(currentMonth + 1)
    }

    return (
        <div className="space-y-4">
            {/* Header giống list-week */}
            <div className="flex items-center justify-between mb-2">
                <Button variant="outline" onClick={handlePrevMonth}>
                    Tháng trước
                </Button>

                <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 text-lg font-bold hover:bg-muted/30 hover:text-primary"
                        >
                            <Calendar className="h-5 w-5 text-primary" />
                            Tháng {currentMonth + 1} / {currentYear}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="center">
                        <MonthYearPicker
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onChange={(m, y) => {
                                setCurrentMonth(m)
                                setCurrentYear(y)
                                setShowMonthPicker(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>

                <Button variant="outline" onClick={handleNextMonth}>
                    Tháng sau
                </Button>
            </div>

            {/* Hiển thị nội dung */}
            {loading ? (
                <p className="text-center py-10 text-muted-foreground">Đang tải thống kê tháng...</p>
            ) : (
                weeks.map((week, wIndex) => (
                    <Card key={wIndex} className="border shadow-sm">
                        <CardHeader className="bg-muted/40">
                            <CardTitle className="text-base font-semibold">
                                Tuần {wIndex + 1}
                            </CardTitle>
                            <CardDescription>
                                {week[0].day}/{currentMonth + 1} → {week[week.length - 1].day}/{currentMonth + 1}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-7 gap-3 p-4">
                            {week.map((d) => (
                                <div
                                    key={d.day}
                                    className="rounded-lg border p-3 text-center bg-white hover:bg-blue-50 transition"
                                >
                                    <div className="font-semibold">{d.day}</div>
                                    {d.shiftCount > 0 ? (
                                        <div className="space-y-1">
                                            <div className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">{d.shiftCount} ca</div>
                                            <div className="text-xs bg-secondary/10 text-secondary px-1 py-0.5 rounded">{d.doctorCount} người</div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground mt-1">-</div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}

// ========== Component chọn tháng/năm tái sử dụng ==========
function MonthYearPicker({
    currentMonth,
    currentYear,
    onChange,
}: {
    currentMonth: number
    currentYear: number
    onChange: (month: number, year: number) => void
}) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const [yearStr, setYearStr] = useState<string>(String(currentYear))
    const [error, setError] = useState<string | null>(null)

    const yearNum = /^\d{1,4}$/.test(yearStr) ? parseInt(yearStr, 10) : NaN
    const isValidYear = Number.isInteger(yearNum) && yearNum >= 1000 && yearNum <= 3000

    const commitIfValid = () => {
        if (isValidYear) {
            setError(null)
            onChange(currentMonth, yearNum)
        } else {
            setError("Năm phải trong khoảng 1000–3000")
        }
    }

    return (
        <div className="space-y-3 p-1">
            <input
                type="text"
                inputMode="numeric"
                value={yearStr}
                onChange={(e) => setYearStr(e.target.value)}
                onBlur={commitIfValid}
                onKeyDown={(e) => e.key === "Enter" && commitIfValid()}
                className={`w-full border rounded-md px-2 py-1 text-center text-sm outline-none ring-0 focus:ring-2 ${error ? "focus:ring-destructive" : "focus:ring-primary"
                    }`}
                placeholder="YYYY"
            />

            {error && <p className="text-xs text-destructive text-center -mt-2">{error}</p>}

            <div className="grid grid-cols-3 gap-2">
                {months.map((m, idx) => (
                    <Button
                        key={idx}
                        variant={idx === currentMonth ? "default" : "outline"}
                        className="text-sm"
                        onClick={() => (isValidYear ? onChange(idx, yearNum) : setError("Nhập năm hợp lệ trước"))}
                        disabled={!isValidYear}
                    >
                        {m}
                    </Button>
                ))}
            </div>
        </div>
    )
}
