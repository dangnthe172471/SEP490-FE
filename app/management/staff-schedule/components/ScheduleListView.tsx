"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, ChevronUp, Trash2, Clock, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { managerService } from "@/lib/services/manager-service"
import type { DailyWorkScheduleDto, DoctorDto } from "@/lib/types/manager-type"

interface Props {
    schedules: any[]
    setSchedules: React.Dispatch<React.SetStateAction<any[]>>
    doctors: DoctorDto[]
}

export default function ScheduleListView({ schedules, setSchedules, doctors }: Props) {
    const [expandedWeek, setExpandedWeek] = useState<number | null>(0)
    const [expandedDay, setExpandedDay] = useState<string | null>(null)
    const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear())
    const [loading, setLoading] = useState(false)
    const [showMonthPicker, setShowMonthPicker] = useState(false)

    //  Format ngày chuẩn local (không lệch timezone)
    const formatDate = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${y}-${m}-${day}`
    }

    // --- Gọi API ---
    const fetchSchedules = async () => {
        setLoading(true)
        setSchedules([])

        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const start = formatDate(firstDay)
        const end = formatDate(lastDay)

        console.log(" Gọi API lịch từ:", start, "đến:", end)

        try {
            const data = await managerService.getWorkScheduleByRange(start, end)
            console.log(" Dữ liệu nhận từ API:", data)

            // Chuẩn hóa dữ liệu để đảm bảo format ngày tháng nhất quán
            const normalizedData = (data || []).map((schedule: any) => {
                if (schedule.date) {
                    // Đảm bảo date có format YYYY-MM-DD
                    const date = new Date(schedule.date)
                    if (!isNaN(date.getTime())) {
                        schedule.date = formatDate(date)
                    }
                }
                return schedule
            })

            console.log(" Dữ liệu đã chuẩn hóa:", normalizedData)

            // Kiểm tra xem có dữ liệu trùng lặp không
            const uniqueDates = [...new Set(normalizedData.map((s: any) => s.date))]
            console.log(" Unique dates in data:", uniqueDates)

            if (uniqueDates.length !== normalizedData.length) {
                console.warn(" Có dữ liệu trùng lặp trong API response!")
                console.warn(" Điều này có thể do ca làm việc 'vĩnh viễn' (EffectiveTo = NULL) được áp dụng cho tất cả ngày")

                // Lọc bỏ dữ liệu trùng lặp nếu có
                const filteredData = normalizedData.filter((schedule, index, self) =>
                    index === self.findIndex(s => s.date === schedule.date)
                )
                console.log(" Đã lọc bỏ dữ liệu trùng lặp:", filteredData.length, "schedules")
                setSchedules(filteredData)
            } else {
                setSchedules(normalizedData)
            }
        } catch (error) {
            console.error(" Lỗi khi tải lịch:", error)
            setSchedules([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedules()
    }, [currentMonth, currentYear])

    // --- Chia lịch theo tuần (hiện tất cả ngày, kể cả không có dữ liệu) ---
    const groupByWeek = () => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const allDays: DailyWorkScheduleDto[] = []

        console.log(" Schedules data:", schedules)
        console.log(" Processing month:", currentMonth + 1, currentYear)
        console.log(" Total schedules received:", schedules.length)
        console.log(" Schedule dates:", schedules.map((s: any) => s.date))

        for (let i = 0; i < lastDay.getDate(); i++) {
            const d = new Date(currentYear, currentMonth, i + 1)
            const iso = formatDate(d)

            // Tìm dữ liệu cho ngày này với nhiều cách so sánh
            const found = schedules.find((s) => {
                if (!s || !s.date) return false
                // So sánh chính xác
                if (s.date === iso) return true
                // So sánh với format khác (YYYY-MM-DD vs DD/MM/YYYY)
                const sDate = new Date(s.date)
                const targetDate = new Date(iso)
                return sDate.getTime() === targetDate.getTime()
            })

            // Nếu không tìm thấy dữ liệu cụ thể, tạo dữ liệu rỗng
            // KHÔNG sử dụng ca làm việc "vĩnh viễn" vì chúng không thuộc về ngày cụ thể

            console.log(`📅 Day ${i + 1}: ${iso} - Found:`, !!found, found ? found.shifts.length : 0, 'shifts')
            if (found) {
                console.log(`  └─ Shifts for ${iso}:`, found.shifts.map((s: any) => ({ type: s.shiftType, doctors: s.doctors?.length || 0 })))
            }

            // Nếu tìm thấy dữ liệu, sử dụng nó. Nếu không, tạo dữ liệu rỗng
            const cloned = found ? JSON.parse(JSON.stringify(found)) : { date: iso, shifts: [] }
            allDays.push(cloned)
        }

        // Chia tuần bắt đầu từ thứ 2 
        const weeks: DailyWorkScheduleDto[][] = []
        let currentWeek: DailyWorkScheduleDto[] = []

        allDays.forEach((day, index) => {
            const dayOfWeek = new Date(day.date).getDay()

            // Nếu là thứ 2 hoặc tuần đầu tiên
            if (dayOfWeek === 1 || currentWeek.length === 0) {
                if (currentWeek.length > 0) {
                    weeks.push([...currentWeek])
                }
                currentWeek = [day]
            } else {
                currentWeek.push(day)
            }

            // Nếu là ngày cuối cùng của tháng
            if (index === allDays.length - 1) {
                weeks.push([...currentWeek])
            }
        })

        console.log(" Weeks created:", weeks.length, "weeks")
        return weeks
    }


    const weeks = groupByWeek()

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

    // --- Render ---
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <Button variant="outline" onClick={handlePrevMonth}>
                    Tháng trước
                </Button>

                {/* Popover chọn tháng-năm */}
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

            {loading ? (
                <p className="text-center py-10 text-muted-foreground">Đang tải lịch...</p>
            ) : schedules.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-muted-foreground mb-2">Không có dữ liệu lịch làm việc</p>
                    <p className="text-sm text-muted-foreground">
                        Hệ thống chỉ hiển thị ca làm việc có ngày cụ thể, không bao gồm ca "vĩnh viễn"
                    </p>
                </div>
            ) : (
                weeks.map((week, wIndex) => {
                    const firstDay = new Date(week[0].date)
                    const lastDay = new Date(week[week.length - 1].date)
                    const title = `Tuần ${wIndex + 1}: ${firstDay.toLocaleDateString("vi-VN")} → ${lastDay.toLocaleDateString("vi-VN")}`

                    return (
                        <Card key={wIndex} className="border shadow-sm">
                            <CardHeader
                                className="bg-muted/50 flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedWeek(expandedWeek === wIndex ? null : wIndex)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedWeek === wIndex ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">{title}</CardTitle>
                                </div>
                            </CardHeader>

                            {expandedWeek === wIndex && (
                                <CardContent className="space-y-6 mt-2">
                                    {week.map((day, i) => {
                                        const weekday = new Date(day.date).toLocaleDateString("vi-VN", { weekday: "long" })
                                        const totalDoctors = day.shifts.reduce(
                                            (sum, s) => sum + (s.doctors?.length ?? 0),
                                            0
                                        )
                                        const isWeekend = [0, 6].includes(new Date(day.date).getDay())

                                        return (
                                            <Card key={i} className={`border shadow-sm ${isWeekend ? "bg-muted/40" : ""}`}>
                                                <CardHeader
                                                    className="cursor-pointer hover:bg-muted/40 transition"
                                                    onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            <CardTitle className="text-base font-semibold">
                                                                Lịch ngày {weekday},{" "}
                                                                {new Date(day.date).toLocaleDateString("vi-VN")}
                                                            </CardTitle>
                                                        </div>
                                                        {expandedDay === day.date ? (
                                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>

                                                    <CardDescription>
                                                        {day.shifts.length} ca • {totalDoctors} bác sĩ

                                                    </CardDescription>
                                                </CardHeader>

                                                {expandedDay === day.date && (
                                                    <CardContent className="space-y-2 pt-2">
                                                        {day.shifts.length === 0 ? (
                                                            <div className="text-sm italic text-muted-foreground">
                                                                <Button variant="outline" size="sm">
                                                                    <Plus className="h-4 w-4 mr-1" /> Thêm bác sĩ
                                                                </Button>
                                                                <p>Không có ca làm việc được lên lịch cho ngày này</p>
                                                             
                                                                {/* <p className="text-xs mt-1">
                                                                    (Chỉ hiển thị ca làm việc có ngày cụ thể, không bao gồm ca "vĩnh viễn")
                                                                </p> */}
                                                            </div>
                                                        ) : (
                                                            day.shifts.map((shift, idx) => (
                                                                <div key={idx} className="border rounded-md p-3 bg-muted/30 mx-2">
                                                                    <div className="flex justify-between items-center mb-2">

                                                                        <div className="flex items-center gap-3">
                                                                            <Clock className="h-5 w-5 text-secondary" />
                                                                            <div>
                                                                                <p className="font-semibold">{shift.shiftType}</p>
                                                                                <p className="text-sm text-muted-foreground"> {shift.startTime} - {shift.endTime}</p>
                                                                            </div>
                                                                        </div>
                                                                        <Button variant="outline" size="sm">
                                                                            <Plus className="h-4 w-4 mr-1" /> Thêm bác sĩ
                                                                        </Button>
                                                                    </div>

                                                                    {shift.doctors.length === 0 ? (
                                                                        <p className="text-sm italic text-muted-foreground">
                                                                            Chưa có bác sĩ
                                                                        </p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {shift.doctors.map((doc) => (
                                                                                <div
                                                                                    key={doc.doctorID}
                                                                                    className="flex justify-between items-center bg-white px-2 py-1.5 rounded-md shadow-sm"
                                                                                >
                                                                                    <div>
                                                                                        <p className="text-sm font-medium">{doc.fullName}</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {doc.specialty}
                                                                                        </p>
                                                                                    </div>
                                                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                                    </Button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </CardContent>
                                                )}
                                            </Card>
                                        )
                                    })}
                                </CardContent>
                            )}
                        </Card>
                    )
                })
            )}
        </div>
    )
}

// ========== COMPONENT CHỌN THÁNG/NĂM ==========
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

    useEffect(() => {
        setYearStr(String(currentYear))
        setError(null)
    }, [currentYear])

    const yearNum = useMemo(() => (/^\d{1,4}$/.test(yearStr) ? parseInt(yearStr, 10) : NaN), [yearStr])
    const isValidYear = useMemo(() => Number.isInteger(yearNum) && yearNum >= 1000 && yearNum <= 3000, [yearNum])

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
                pattern="[0-9]*"
                value={yearStr}
                onChange={(e) => {
                    const v = e.target.value.trim()
                    if (v === "" || /^[0-9]+$/.test(v)) {
                        setYearStr(v)
                        if (v === "") setError("Vui lòng nhập năm")
                        else if (parseInt(v, 10) < 1000 || parseInt(v, 10) > 3000)
                            setError("Năm phải trong khoảng 1000–3000")
                        else setError(null)
                    }
                }}
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
