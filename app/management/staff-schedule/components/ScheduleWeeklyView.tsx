"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto, DoctorActiveScheduleRangeDto } from "@/lib/types/manager-type"
import { toast } from "sonner"


export default function ScheduleListView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [searchQuery, setSearchQuery] = useState("")
    const [schedules, setSchedules] = useState<DoctorActiveScheduleRangeDto[]>([])
    const [loading, setLoading] = useState(false)

    //  Tính toán tuần hiện tại
    const getWeekDates = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lấy Thứ 2
        const monday = new Date(d.setDate(diff))
        const week = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday)
            date.setDate(date.getDate() + i)
            week.push(date)
        }
        return week
    }

    const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])
    const weekStart = weekDates[0]
    const weekEnd = weekDates[6]


    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true)
            try {
                const startStr = weekStart.toISOString().split("T")[0]
                const endStr = weekEnd.toISOString().split("T")[0]
                const data = await managerService.getAllDoctorSchedules(startStr, endStr)
                setSchedules(data)
            } catch (err) {
                console.error("Lỗi khi tải lịch:", err)
                toast.error("Không thể tải lịch làm việc.")
            } finally {
                setLoading(false)
            }
        }

        fetchSchedules()
    }, [weekStart, weekEnd])

    const groupedSchedules = useMemo(() => {
        const map = new Map<string, DoctorActiveScheduleRangeDto[]>();

        for (const s of schedules) {
            // Tạo key duy nhất gồm tên + chuyên ngành
            const key = `${s.doctorName} — ${s.specialty}`;

            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(s);
        }

        return map;
    }, [schedules]);

    //  Lấy shift theo ngày cho từng nhân viên
    const getShiftsByDate = (doctorName: string, date: Date) => {
        const dateStr = date.toISOString().split("T")[0]
        const staffSchedules = groupedSchedules.get(doctorName) || []
        return staffSchedules.filter(s => s.date === dateStr)
    }

    //  Điều hướng tuần
    const handlePrevWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() - 7)
        setCurrentDate(newDate)
    }

    // Search
    const removeVietnameseTones = (str: string) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
    }


    const handleNextWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + 7)
        setCurrentDate(newDate)
    }

    const handleToday = () => setCurrentDate(new Date())


    const filteredNames = Array.from(groupedSchedules.keys()).filter(name => {
        const nameNoTone = removeVietnameseTones(name).toLowerCase();
        const searchNoTone = removeVietnameseTones(searchQuery).toLowerCase();
        return nameNoTone.includes(searchNoTone);
    });


    return (

        <div className="space-y-6">
            {/* <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch phòng khám</h1>
                        <p className="text-muted-foreground">Xem lịch làm việc toàn bộ nhân viên theo tuần</p>
                    </div>
                </div> */}

            {/* Week Navigation */}
            <Card>
                <CardHeader>
                    <div className="grid grid-cols-4 gap-6 items-center">

                    
                        <div>
                            <CardTitle>Hiển thị lịch làm việc</CardTitle>
                            <CardDescription className="mt-2">
                                từ {weekStart.toLocaleDateString("vi-VN")} đến {weekEnd.toLocaleDateString("vi-VN")}
                            </CardDescription>
                        </div>

                        <div className="flex flex-col">
                            <CardTitle className="text-sm">Tìm kiếm theo ngày</CardTitle>
                            <input
                                type="date"
                                className="border border-gray-300 rounded-md w-50 px-3 py-1 mt-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                value={currentDate.toISOString().split("T")[0]}
                                onChange={(e) => setCurrentDate(new Date(e.target.value))}
                            />
                        </div>

                       
                        <div className="flex flex-col">
                            <CardTitle className="text-sm">Tìm kiếm nhân viên</CardTitle>
                            <div className="relative mt-2 w-50">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Nhập tên nhân viên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" size="sm" onClick={handleToday}>
                                Hôm nay
                            </Button>

                            <Button variant="outline" size="sm" onClick={handleNextWeek}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                    </div>
                </CardHeader>
            </Card>


            {/* Schedule Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-10 text-center text-muted-foreground">Đang tải dữ liệu...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="border-r px-4 py-3 text-left font-semibold text-sm w-48">
                                            Nhân viên
                                        </th>
                                        {weekDates.map((date) => (
                                            <th
                                                key={date.toISOString()}
                                                className="border-r px-4 py-3 text-center font-semibold text-sm min-w-32"
                                            >
                                                <div className="text-xs text-muted-foreground">
                                                    {date.toLocaleDateString("vi-VN", { weekday: "short" })}
                                                </div>
                                                <div className="text-sm font-bold">{date.getDate()}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredNames.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                Không có nhân viên nào
                                            </td>
                                        </tr>
                                    ) : (
                                                filteredNames.map((fullKey) => {
                                                    const [doctorName, specialty] = fullKey.split(" — ");

                                                    return (
                                                        <tr key={fullKey} className="border-b hover:bg-muted/30 transition-colors">
                                                            <td className="border-r px-4 py-3">
                                                                <p className="font-medium text-sm">{doctorName}</p>
                                                                <Badge variant="outline"> {specialty}</Badge>
                                                            </td>

                                                            {weekDates.map((date) => {
                                                                const shifts = getShiftsByDate(fullKey, date);

                                                                const formatTime = (time: string) => {
                                                                    if (!time) return "";
                                                                    const [h, m] = time.split(":");
                                                                    return `${h}:${m}`;
                                                                };

                                                                return (
                                                                    <td key={date.toISOString()} className="border-r px-4 py-3 text-center min-w-32">
                                                                        {shifts.length === 0 ? (
                                                                            <span className="text-xs text-muted-foreground">-</span>
                                                                        ) : (
                                                                            <div className="space-y-1">
                                                                                {shifts.map((s, i) => (
                                                                                    <div
                                                                                        key={i}
                                                                                        className={`rounded px-2 py-1 text-xs font-medium ${s.status === "Exchange"
                                                                                                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                                                                                : "bg-primary/10 text-primary border border-primary/20"
                                                                                            }`}
                                                                                    >
                                                                                        <div>{s.shiftType}</div>
                                                                                        <div className="text-xs opacity-75">
                                                                                            {formatTime(s.startTime)} - {formatTime(s.endTime)}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })

                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

    )
}
