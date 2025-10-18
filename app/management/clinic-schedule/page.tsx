"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, FileText, Calendar, ChevronLeft, ChevronRight, Clock, Search } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navigation = [
    { name: "Tổng quan", href: "/management", icon: BarChart3 },
    { name: "Lịch làm việc", href: "/management/staff-schedule", icon: Calendar },
    { name: "Lịch phòng khám", href: "/management/clinic-schedule", icon: Clock },
    { name: "Báo cáo", href: "/management/reports", icon: FileText },
    { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
]

// Mock data for staff
const mockStaff = [
    { id: "S001", name: "BS. Trần Văn B", role: "doctor", department: "Nội khoa" },
    { id: "S002", name: "BS. Lê Thị D", role: "doctor", department: "Nhi khoa" },
    { id: "S003", name: "Y tá Nguyễn Thị E", role: "nurse", department: "Nội khoa" },
    { id: "S004", name: "Y tá Phạm Thị F", role: "nurse", department: "Nhi khoa" },
    { id: "S005", name: "Dược sĩ Hoàng Văn G", role: "pharmacist", department: "Nhà thuốc" },
    { id: "S006", name: "Lễ tân Trần Thị H", role: "receptionist", department: "Lễ tân" },
]

// Mock schedules
const mockSchedules = [
    {
        id: "SCH001",
        date: "2024-07-15",
        shifts: [
            { id: "SHIFT001", name: "Ca sáng", time: "08:00 - 12:00", staff: ["S001", "S003", "S006"] },
            { id: "SHIFT002", name: "Ca chiều", time: "13:00 - 17:00", staff: ["S002", "S004", "S006"] },
            { id: "SHIFT003", name: "Ca tối", time: "17:00 - 21:00", staff: ["S001", "S005"] },
        ],
    },
    {
        id: "SCH002",
        date: "2024-07-16",
        shifts: [
            { id: "SHIFT004", name: "Ca sáng", time: "08:00 - 12:00", staff: ["S002", "S003", "S006"] },
            { id: "SHIFT005", name: "Ca chiều", time: "13:00 - 17:00", staff: ["S001", "S004", "S006"] },
            { id: "SHIFT006", name: "Ca tối", time: "17:00 - 21:00", staff: ["S002", "S005"] },
        ],
    },
    {
        id: "SCH003",
        date: "2024-07-17",
        shifts: [
            { id: "SHIFT007", name: "Ca sáng", time: "08:00 - 12:00", staff: ["S001", "S004", "S006"] },
            { id: "SHIFT008", name: "Ca chiều", time: "13:00 - 17:00", staff: ["S002", "S003", "S006"] },
            { id: "SHIFT009", name: "Ca tối", time: "17:00 - 21:00", staff: ["S001", "S005"] },
        ],
    },
    {
        id: "SCH004",
        date: "2024-07-18",
        shifts: [
            { id: "SHIFT010", name: "Ca sáng", time: "08:00 - 12:00", staff: ["S002", "S003", "S006"] },
            { id: "SHIFT011", name: "Ca chiều", time: "13:00 - 17:00", staff: ["S001", "S004", "S006"] },
            { id: "SHIFT012", name: "Ca tối", time: "17:00 - 21:00", staff: ["S002", "S005"] },
        ],
    },
    {
        id: "SCH005",
        date: "2024-07-19",
        shifts: [
            { id: "SHIFT013", name: "Ca sáng", time: "08:00 - 12:00", staff: ["S001", "S003", "S006"] },
            { id: "SHIFT014", name: "Ca chiều", time: "13:00 - 17:00", staff: ["S002", "S004", "S006"] },
            { id: "SHIFT015", name: "Ca tối", time: "17:00 - 21:00", staff: ["S001", "S005"] },
        ],
    },
]

export default function ClinicSchedulePage() {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date("2024-07-15"))
    const [searchQuery, setSearchQuery] = useState("")

    const getStaffName = (staffId: string) => {
        return mockStaff.find((s) => s.id === staffId)?.name || "Unknown"
    }

    const getStaffRole = (staffId: string) => {
        const staff = mockStaff.find((s) => s.id === staffId)
        return staff?.role || "unknown"
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "doctor":
                return "Bác sĩ"
            case "nurse":
                return "Y tá"
            case "pharmacist":
                return "Dược sĩ"
            case "receptionist":
                return "Lễ tân"
            default:
                return role
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case "doctor":
                return "bg-blue-100 text-blue-800"
            case "nurse":
                return "bg-pink-100 text-pink-800"
            case "pharmacist":
                return "bg-green-100 text-green-800"
            case "receptionist":
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    // Get week dates
    const getWeekDates = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(d.setDate(diff))

        const week = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday)
            date.setDate(date.getDate() + i)
            week.push(date)
        }
        return week
    }

    const weekDates = getWeekDates(currentDate)
    const weekStart = weekDates[0]
    const weekEnd = weekDates[6]

    // Get schedules for the week
    const weekSchedules = mockSchedules.filter((schedule) => {
        const scheduleDate = new Date(schedule.date)
        return scheduleDate >= weekStart && scheduleDate <= weekEnd
    })

    // Get all staff working in the week
    const staffInWeek = new Set<string>()
    weekSchedules.forEach((schedule) => {
        schedule.shifts.forEach((shift) => {
            shift.staff.forEach((staffId) => {
                staffInWeek.add(staffId)
            })
        })
    })

    const filteredStaff = Array.from(staffInWeek)
        .map((id) => mockStaff.find((s) => s.id === id))
        .filter((s) => s && (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())))

    const getStaffShifts = (staffId: string, date: Date) => {
        const dateStr = date.toISOString().split("T")[0]
        const schedule = weekSchedules.find((s) => s.date === dateStr)
        if (!schedule) return []

        return schedule.shifts.filter((shift) => shift.staff.includes(staffId))
    }

    const handlePrevWeek = () => {
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
        setCurrentDate(new Date())
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch phòng khám</h1>
                        <p className="text-muted-foreground">Xem lịch làm việc toàn bộ nhân viên theo tuần</p>
                    </div>
                </div>

                {/* Week Navigation */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>
                                    Tuần {weekStart.toLocaleDateString("vi-VN")} - {weekEnd.toLocaleDateString("vi-VN")}
                                </CardTitle>
                                <CardDescription>
                                    Hiển thị lịch làm việc từ {weekStart.toLocaleDateString("vi-VN")} đến{" "}
                                    {weekEnd.toLocaleDateString("vi-VN")}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
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

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tìm kiếm nhân viên</CardTitle>
                        <CardDescription>Tìm theo tên nhân viên</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Nhập tên nhân viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule Grid */}
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="border-r px-4 py-3 text-left font-semibold text-sm w-48">Nhân viên</th>
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
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                                Không có nhân viên nào
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((staff) => (
                                            <tr key={staff?.id} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="border-r px-4 py-3">
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm">{staff?.name}</p>
                                                        <Badge variant="outline" className={getRoleColor(staff?.role || "")}>
                                                            {getRoleLabel(staff?.role || "")}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                {weekDates.map((date) => {
                                                    const shifts = getStaffShifts(staff?.id || "", date)
                                                    return (
                                                        <td key={date.toISOString()} className="border-r px-4 py-3 text-center min-w-32">
                                                            {shifts.length === 0 ? (
                                                                <span className="text-xs text-muted-foreground">-</span>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {shifts.map((shift) => (
                                                                        <div
                                                                            key={shift.id}
                                                                            className="bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs font-medium text-primary"
                                                                        >
                                                                            <div>{shift.name}</div>
                                                                            <div className="text-xs opacity-75">{shift.time}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tóm tắt tuần</CardTitle>
                        <CardDescription>Thống kê nhân viên và ca làm việc</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng nhân viên</p>
                                <p className="text-3xl font-bold">{filteredStaff.length}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng lịch làm việc</p>
                                <p className="text-3xl font-bold">{weekSchedules.length}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng ca làm việc</p>
                                <p className="text-3xl font-bold">{weekSchedules.reduce((sum, s) => sum + s.shifts.length, 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng phân công</p>
                                <p className="text-3xl font-bold">
                                    {weekSchedules.reduce(
                                        (sum, s) => sum + s.shifts.reduce((shiftSum, shift) => shiftSum + shift.staff.length, 0),
                                        0,
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
