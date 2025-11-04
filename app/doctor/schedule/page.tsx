"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
import { doctorScheduleService } from "@/lib/services/doctor-schedule-service"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { getCurrentUser } from "@/lib/auth"
import type { DoctorScheduleDto } from "@/lib/types/doctor-schedule-type"
import { showErrorAlert } from "@/lib/sweetalert-config"
import { managerService } from "@/lib/services/manager-service"
import type { ShiftResponseDto } from "@/lib/types/doctor-schedule-type"
import PageGuard from "@/components/PageGuard"

export default function DoctorSchedulePage() {
    const navigation = getDoctorNavigation()
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [doctorId, setDoctorId] = useState<number | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [scheduleData, setScheduleData] = useState<DoctorScheduleDto[]>([])
    const [loading, setLoading] = useState(false)

    // const shifts = [
    //     { id: "morning", name: "Ca sáng", startTime: "07:00", endTime: "11:00", color: "bg-blue-50 border-blue-200" },
    //     { id: "afternoon", name: "Ca chiều", startTime: "13:00", endTime: "17:00", color: "bg-amber-50 border-amber-200" },
    //     { id: "evening", name: "Ca tối", startTime: "17:00", endTime: "21:00", color: "bg-purple-50 border-purple-200" },
    // ]
    const [shifts, setShifts] = useState<ShiftResponseDto[]>([])
    const [loadingShifts, setLoadingShifts] = useState(false)

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                setLoadingShifts(true)
                const data = await managerService.getAllShifts()

                const colored = data.map((s) => ({
                    ...s,
                    color:
                        s.shiftType === "Sáng"
                            ? "bg-blue-50 border-blue-200"
                            : s.shiftType === "Chiều"
                                ? "bg-amber-50 border-amber-200"
                                : "bg-purple-50 border-purple-200",
                }))
                setShifts(colored)
            } catch (err) {
                console.error("Lỗi khi tải danh sách ca làm:", err)
            } finally {
                setLoadingShifts(false)
            }
        }

        fetchShifts()
    }, [])
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]

    // === Lấy user hiện tại ===
    useEffect(() => {
        const user = getCurrentUser()
        if (user) setCurrentUser(user)
    }, [])

    // === Lấy doctorId từ userId ===
    useEffect(() => {
        if (!currentUser) return
        const fetchDoctorId = async () => {
            try {
                const id = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))
                setDoctorId(id)
            } catch (err) {
                console.error("Error fetching doctor ID:", err)
                await showErrorAlert("Lỗi", "Không thể lấy thông tin bác sĩ hiện tại.")
            }
        }
        fetchDoctorId()
    }, [currentUser])
    const [selectedDate, setSelectedDate] = useState("")

    const handleDateChange = async (date: string) => {
        setSelectedDate(date)
        const parsed = new Date(date)
        if (!isNaN(parsed.getTime())) {
            setCurrentDate(parsed)
        }
        if (!doctorId) return

        try {
            setLoading(true)
            const data = await doctorScheduleService.getScheduleByRange(doctorId, date, date)
            setScheduleData(data)
        } catch (err) {
            console.error("Lỗi khi lấy lịch theo ngày:", err)
        } finally {
            setLoading(false)
        }
    }

    // === Utility: lấy thứ 2 của tuần ===
    const getMonday = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(d.setDate(diff))
    }

    const getWeekRange = () => {
        const monday = getMonday(currentDate)
        const sunday = new Date(monday)
        sunday.setDate(sunday.getDate() + 6)

        const format = (d: Date) => d.toISOString().split("T")[0]
        return { start: format(monday), end: format(sunday) }
    }

    // === Gọi API lịch làm việc ===
    useEffect(() => {
        if (!doctorId) return
        const fetchSchedule = async () => {
            setLoading(true)
            try {
                const { start, end } = getWeekRange()
                const data = await doctorScheduleService.getScheduleByRange(doctorId, start, end)
                setScheduleData(data)
            } catch (err) {
                console.error("Lỗi khi lấy lịch:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchSchedule()
    }, [doctorId, currentDate])

    // === Dựng lịch theo tuần ===
    const generateWeekSchedule = () => {
        const monday = getMonday(currentDate)
        const weekDays = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)
            const isoDate = date.toISOString().split("T")[0]
            const shiftMap: Record<string, any> = {}
            shifts.forEach((shift) => {
                const match = scheduleData.find(
                    (s) =>
                        s.date === isoDate &&
                        s.shiftType === shift.shiftType
                )

                shiftMap[shift.shiftID] = match ? shift : null
            })
            weekDays.push({
                date: isoDate,
                dayName: dayNames[i],
                dayNumber: date.getDate(),
                shifts: shiftMap,
            })
        }
        return weekDays
    }

    const weekSchedule = generateWeekSchedule()

    const handlePreviousWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() - 7)
        setCurrentDate(newDate)
    }

    const handleNextWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + 7)
        setCurrentDate(newDate)
    }

    const handleToday = () => {
        const today = new Date()
        const formatted = today.toISOString().split("T")[0]

     
        setSelectedDate(formatted)
        setCurrentDate(today)
    }

    // === Thống kê ===
    const stats = (() => {
        let totalShifts = 0
        const workingDays = new Set<string>()
        const shiftCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0 }

        weekSchedule.forEach((day) => {
            Object.entries(day.shifts).forEach(([id, s]) => {
                if (s) {
                    totalShifts++
                    workingDays.add(day.date)
                    shiftCounts[id]++
                }
            })
        })

        return {
            totalShifts,
            totalHours: totalShifts * 4,
            workingDays: workingDays.size,
            restDays: 7 - workingDays.size,
            shiftCounts,
        }
    })()

    return (

        <PageGuard allowedRoles={["doctor", "admin"]}>
            <DashboardLayout navigation={navigation}>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch làm việc</h1>
                        <p className="text-muted-foreground">Xem lịch làm việc của bạn trong tuần</p>
                    </div>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="mb-3">
                                        Ngày bắt đầu
                                    </CardTitle>

                                    <CardDescription>{getWeekRange().start}</CardDescription>
                                </div>
                                <div>
                                    <CardTitle className="mb-3">
                                        Ngày kết thúc
                                    </CardTitle>
                                    <CardDescription>{getWeekRange().end}</CardDescription>
                                </div>
                                {/* <div>
                                    <CardTitle>Thứ 2 - Chủ nhật</CardTitle>
                                </div> */}
                                <CardTitle>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                                />
                                </CardTitle>

                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={handlePreviousWeek}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleToday}>
                                        Hôm nay
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleNextWeek}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>

                            </div>
                        </CardHeader>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="p-6 text-center text-muted-foreground">Đang tải dữ liệu...</div>
                                ) : scheduleData.length === 0 ? (
                                    <div className="p-6 text-center text-muted-foreground">Không có lịch làm việc cho tuần này.</div>
                                ) : (
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-primary/20">
                                                <th className="px-4 py-3 text-left font-semibold text-sm text-primary w-32">Ca làm việc</th>
                                                {weekSchedule.map((day) => (
                                                    <th key={day.date} className="px-4 py-3 text-center font-semibold text-sm text-primary">
                                                        <div>{day.dayName}</div>
                                                        <div className="text-lg font-bold">{day.dayNumber}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shifts.map((shift) => (
                                                <tr key={shift.shiftID} className="border-b border-border">
                                                    <td className="px-4 py-4 font-semibold text-sm border-r border-border sticky left-0 bg-background">
                                                        {shift.shiftType}
                                                    </td>
                                                    {weekSchedule.map((day) => (
                                                        <td key={`${day.date}-${shift.shiftID}`} className="px-4 py-4 text-center border-r border-border">
                                                            {day.shifts[shift.shiftID] ? (
                                                                <div className={`p-3 rounded-lg border-2 ${shift.color}`}>
                                                                    <div className="text-xs text-green-600">
                                                                        {shift.startTime?.substring(0, 5)} - {shift.endTime?.substring(0, 5)}

                                                                    </div>
                                                                    <div className="text-xs font-medium mt-1 text-gray-600 ">
                                                                        {
                                                                            scheduleData.find(
                                                                                s =>
                                                                                    s.date === day.date &&
                                                                                    s.shiftType === shift.shiftType
                                                                            )?.roomName || "Không có phòng"
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted-foreground text-sm font-medium">-</div>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tóm tắt tuần */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tóm tắt tuần</CardTitle>
                            {/* {doctorId && (
                            <CardDescription>Bác sĩ ID: {doctorId}</CardDescription>
                        )} */}
                            <CardDescription>Thống kê nhanh các ca làm việc</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                {shifts.map((shift) => (
                                    <div key={shift.shiftID} className={`space-y-2 p-4 rounded-lg border-2 ${shift.color}`}>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />


                                            <span className="font-semibold">{shift.shiftType}</span>
                                        </div>
                                        <p className="text-sm">
                                            {shift.startTime?.substring(0, 5)} - {shift.endTime?.substring(0, 5)}
                                        </p>

                                        <p className="text-xs text-muted-foreground">{stats.shiftCounts[shift.shiftID]} ngày trong tuần</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-muted">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng ca làm việc</p>
                                        <p className="text-2xl font-bold">{stats.totalShifts}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Giờ làm việc</p>
                                        <p className="text-2xl font-bold">{stats.totalHours}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày làm việc</p>
                                        <p className="text-2xl font-bold">{stats.workingDays}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ngày nghỉ</p>
                                        <p className="text-2xl font-bold">{stats.restDays}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </PageGuard>
    )
}
