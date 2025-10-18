"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
    BarChart3,
    TrendingUp,
    FileText,
    Plus,
    Calendar,
    Clock,
    Users,
    Trash2,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Grid3x3,
    List,
} from "lucide-react"
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
    { id: "S001", name: "BS. Trần Văn B", role: "doctor", department: "Nội khoa", status: "active" },
    { id: "S002", name: "BS. Lê Thị D", role: "doctor", department: "Nhi khoa", status: "active" },
    { id: "S003", name: "Y tá Nguyễn Thị E", role: "nurse", department: "Nội khoa", status: "active" },
    { id: "S004", name: "Y tá Phạm Thị F", role: "nurse", department: "Nhi khoa", status: "active" },
    { id: "S005", name: "Dược sĩ Hoàng Văn G", role: "pharmacist", department: "Nhà thuốc", status: "active" },
    { id: "S006", name: "Lễ tân Trần Thị H", role: "receptionist", department: "Lễ tân", status: "active" },
]

// Mock schedules
const mockSchedules = [
    {
        id: "SCH001",
        date: "2024-07-15",
        shifts: [
            {
                id: "SHIFT001",
                name: "Ca sáng",
                time: "08:00 - 12:00",
                staff: ["S001", "S003", "S006"],
            },
            {
                id: "SHIFT002",
                name: "Ca chiều",
                time: "13:00 - 17:00",
                staff: ["S002", "S004", "S006"],
            },
            {
                id: "SHIFT003",
                name: "Ca tối",
                time: "17:00 - 21:00",
                staff: ["S001", "S005"],
            },
        ],
    },
    {
        id: "SCH002",
        date: "2024-07-16",
        shifts: [
            {
                id: "SHIFT004",
                name: "Ca sáng",
                time: "08:00 - 12:00",
                staff: ["S002", "S003", "S006"],
            },
            {
                id: "SHIFT005",
                name: "Ca chiều",
                time: "13:00 - 17:00",
                staff: ["S001", "S004", "S006"],
            },
            {
                id: "SHIFT006",
                name: "Ca tối",
                time: "17:00 - 21:00",
                staff: ["S002", "S005"],
            },
        ],
    },
]

const SHIFT_TYPES = [
    { name: "Ca sáng", time: "08:00 - 12:00" },
    { name: "Ca chiều", time: "13:00 - 17:00" },
    { name: "Ca tối", time: "17:00 - 21:00" },
]

export default function StaffSchedulePage() {
    const router = useRouter()
    const [schedules, setSchedules] = useState(mockSchedules)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDateFrom, setSelectedDateFrom] = useState("")
    const [selectedDateTo, setSelectedDateTo] = useState("")
    const [selectedShifts, setSelectedShifts] = useState<string[]>([])
    const [doctorsByShift, setDoctorsByShift] = useState<Record<string, string[]>>({})
    const [doctorSearchByShift, setDoctorSearchByShift] = useState<Record<string, string>>({})
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<(typeof mockSchedules)[0] | null>(null)
    const [selectedShift, setSelectedShift] = useState<string | null>(null)
    const [selectedStaffId, setSelectedStaffId] = useState("")
    const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<"list" | "month">("list")
    const [currentMonth, setCurrentMonth] = useState(new Date(2024, 6, 1))

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

    const toggleShiftSelection = (shiftName: string) => {
        setSelectedShifts((prev) => {
            const newShifts = new Set(prev)
            if (newShifts.has(shiftName)) {
                newShifts.delete(shiftName)
                const newDoctorsByShift = { ...doctorsByShift }
                delete newDoctorsByShift[shiftName]
                setDoctorsByShift(newDoctorsByShift)
            } else {
                newShifts.add(shiftName)
                setDoctorsByShift((prev) => ({ ...prev, [shiftName]: [] }))
            }
            return Array.from(newShifts)
        })
    }

    const toggleDoctorForShift = (shiftName: string, doctorId: string) => {
        setDoctorsByShift((prev) => {
            const doctors = prev[shiftName] || []
            const newDoctors = new Set(doctors)
            if (newDoctors.has(doctorId)) {
                newDoctors.delete(doctorId)
            } else {
                newDoctors.add(doctorId)
            }
            return { ...prev, [shiftName]: Array.from(newDoctors) }
        })
    }

    const toggleScheduleExpanded = (scheduleId: string) => {
        setExpandedSchedules((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(scheduleId)) {
                newSet.delete(scheduleId)
            } else {
                newSet.add(scheduleId)
            }
            return newSet
        })
    }

    const handleCreateSchedule = () => {
        if (!selectedDateFrom || !selectedDateTo || selectedShifts.length === 0) return

        const fromDate = new Date(selectedDateFrom)
        const toDate = new Date(selectedDateTo)
        const newSchedules = []

        // Generate schedules for each day in the range
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0]

            const newSchedule = {
                id: `SCH${Date.now()}${Math.random()}`,
                date: dateStr,
                shifts: SHIFT_TYPES.filter((shift) => selectedShifts.includes(shift.name)).map((shift, idx) => ({
                    id: `SHIFT${Date.now()}${idx}`,
                    name: shift.name,
                    time: shift.time,
                    staff: doctorsByShift[shift.name] || [],
                })),
            }

            newSchedules.push(newSchedule)
        }

        setSchedules([...schedules, ...newSchedules])
        setSelectedDateFrom("")
        setSelectedDateTo("")
        setSelectedShifts([])
        setDoctorsByShift({})
        setDoctorSearchByShift({})
        setIsCreateDialogOpen(false)
    }

    const handleAddStaffToShift = () => {
        if (!selectedSchedule || !selectedShift || !selectedStaffId) return

        const updatedSchedules = schedules.map((schedule) => {
            if (schedule.id === selectedSchedule.id) {
                return {
                    ...schedule,
                    shifts: schedule.shifts.map((shift) => {
                        if (shift.id === selectedShift && !shift.staff.includes(selectedStaffId)) {
                            return { ...shift, staff: [...shift.staff, selectedStaffId] }
                        }
                        return shift
                    }),
                }
            }
            return schedule
        })

        setSchedules(updatedSchedules)
        setSelectedStaffId("")
        setIsAddStaffDialogOpen(false)
    }

    const handleRemoveStaffFromShift = (scheduleId: string, shiftId: string, staffId: string) => {
        const updatedSchedules = schedules.map((schedule) => {
            if (schedule.id === scheduleId) {
                return {
                    ...schedule,
                    shifts: schedule.shifts.map((shift) => {
                        if (shift.id === shiftId) {
                            return { ...shift, staff: shift.staff.filter((s) => s !== staffId) }
                        }
                        return shift
                    }),
                }
            }
            return schedule
        })

        setSchedules(updatedSchedules)
    }

    const handleDeleteSchedule = (scheduleId: string) => {
        setSchedules(schedules.filter((s) => s.id !== scheduleId))
    }

    const filteredSchedules = schedules.filter((schedule) => {
        const dateMatch = !searchQuery || schedule.date.includes(searchQuery)
        return dateMatch
    })

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const getWeeksInMonth = (date: Date) => {
        const daysInMonth = getDaysInMonth(date)
        const firstDay = getFirstDayOfMonth(date)
        const totalCells = firstDay + daysInMonth
        return Math.ceil(totalCells / 7)
    }

    const getSchedulesForDate = (date: Date) => {
        const dateStr = date.toISOString().split("T")[0]
        return schedules.filter((s) => s.date === dateStr)
    }

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch làm việc nhân viên</h1>
                        <p className="text-muted-foreground">Quản lý lịch làm việc của toàn bộ nhân viên phòng khám</p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tạo lịch mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Tạo lịch làm việc mới</DialogTitle>
                                <DialogDescription>Chọn khoảng ngày, ca làm việc và bác sĩ cho mỗi ca</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium">Từ ngày</label>
                                        <Input
                                            type="date"
                                            value={selectedDateFrom}
                                            onChange={(e) => setSelectedDateFrom(e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Đến ngày</label>
                                        <Input
                                            type="date"
                                            value={selectedDateTo}
                                            onChange={(e) => setSelectedDateTo(e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-3 block">Chọn ca làm việc và bác sĩ</label>
                                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                                        {SHIFT_TYPES.map((shift) => (
                                            <div key={shift.name} className="border rounded-lg p-3 bg-white space-y-3">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedShifts.includes(shift.name)}
                                                        onChange={() => toggleShiftSelection(shift.name)}
                                                        className="w-4 h-4"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-semibold">{shift.name}</p>
                                                        <p className="text-xs text-muted-foreground">{shift.time}</p>
                                                    </div>
                                                </label>

                                                {selectedShifts.includes(shift.name) && (
                                                    <div className="ml-7 space-y-3 border-t pt-3">
                                                        <p className="text-xs font-medium text-muted-foreground">Chọn bác sĩ cho {shift.name}</p>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Tìm bác sĩ..."
                                                                value={doctorSearchByShift[shift.name] || ""}
                                                                onChange={(e) =>
                                                                    setDoctorSearchByShift((prev) => ({
                                                                        ...prev,
                                                                        [shift.name]: e.target.value,
                                                                    }))
                                                                }
                                                                className="pl-9 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                                            {mockStaff
                                                                .filter((staff) => staff.role === "doctor")
                                                                .filter((doctor) => {
                                                                    const searchTerm = (doctorSearchByShift[shift.name] || "").toLowerCase()
                                                                    return (
                                                                        searchTerm === "" ||
                                                                        doctor.name.toLowerCase().includes(searchTerm) ||
                                                                        doctor.department.toLowerCase().includes(searchTerm)
                                                                    )
                                                                })
                                                                .map((doctor) => (
                                                                    <label
                                                                        key={doctor.id}
                                                                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 rounded"
                                                                    >
                                                                        <Checkbox
                                                                            checked={(doctorsByShift[shift.name] || []).includes(doctor.id)}
                                                                            onCheckedChange={() => toggleDoctorForShift(shift.name, doctor.id)}
                                                                        />
                                                                        <div>
                                                                            <p className="text-sm font-medium">{doctor.name}</p>
                                                                            <p className="text-xs text-muted-foreground">{doctor.department}</p>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                        </div>
                                                        {(doctorsByShift[shift.name] || []).length > 0 && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Đã chọn {(doctorsByShift[shift.name] || []).length} bác sĩ
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreateDialogOpen(false)
                                            setSelectedDateFrom("")
                                            setSelectedDateTo("")
                                            setSelectedShifts([])
                                            setDoctorsByShift({})
                                            setDoctorSearchByShift({})
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleCreateSchedule}
                                        disabled={!selectedDateFrom || !selectedDateTo || selectedShifts.length === 0}
                                    >
                                        Tạo lịch
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex gap-2">
                    <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                        <List className="h-4 w-4 mr-2" />
                        Danh sách
                    </Button>
                    <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" onClick={() => setViewMode("month")}>
                        <Grid3x3 className="h-4 w-4 mr-2" />
                        Tháng
                    </Button>
                </div>

                {/* Search - only show in list view */}
                {viewMode === "list" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Tìm kiếm lịch</CardTitle>
                            <CardDescription>Tìm theo ngày</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Nhập ngày (YYYY-MM-DD)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {viewMode === "list" ? (
                    // LIST VIEW
                    <div className="space-y-3">
                        {filteredSchedules.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <p className="text-muted-foreground">Không có lịch làm việc nào</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredSchedules.map((schedule) => {
                                const isExpanded = expandedSchedules.has(schedule.id)
                                const totalStaff = schedule.shifts.reduce((sum, shift) => sum + shift.staff.length, 0)

                                return (
                                    <Card key={schedule.id} className="overflow-hidden">
                                        <CardHeader
                                            className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                                            onClick={() => toggleScheduleExpanded(schedule.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <ChevronDown
                                                        className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                                                    />
                                                    <Calendar className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            Lịch ngày {new Date(schedule.date).toLocaleDateString("vi-VN")}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {schedule.shifts.length} ca • {totalStaff} nhân viên
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteSchedule(schedule.id)
                                                    }}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        {isExpanded && (
                                            <CardContent className="p-6 border-t">
                                                <div className="space-y-4">
                                                    {schedule.shifts.map((shift) => (
                                                        <div key={shift.id} className="border rounded-lg p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Clock className="h-5 w-5 text-secondary" />
                                                                    <div>
                                                                        <h4 className="font-semibold">{shift.name}</h4>
                                                                        <p className="text-sm text-muted-foreground">{shift.time}</p>
                                                                    </div>
                                                                </div>
                                                                <Dialog
                                                                    open={isAddStaffDialogOpen && selectedShift === shift.id}
                                                                    onOpenChange={(open) => {
                                                                        if (open) {
                                                                            setSelectedSchedule(schedule)
                                                                            setSelectedShift(shift.id)
                                                                        }
                                                                        setIsAddStaffDialogOpen(open)
                                                                    }}
                                                                >
                                                                    <DialogTrigger asChild>
                                                                        <Button size="sm" variant="outline">
                                                                            <Plus className="mr-2 h-4 w-4" />
                                                                            Thêm nhân viên
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Thêm nhân viên vào {shift.name}</DialogTitle>
                                                                            <DialogDescription>Chọn nhân viên để thêm vào ca làm việc này</DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <label className="text-sm font-medium">Chọn nhân viên</label>
                                                                                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                                                                    <SelectTrigger className="mt-2">
                                                                                        <SelectValue placeholder="Chọn nhân viên..." />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {mockStaff.map((staff) => (
                                                                                            <SelectItem key={staff.id} value={staff.id}>
                                                                                                {staff.name} ({getRoleLabel(staff.role)})
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                            <div className="flex gap-2 justify-end">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    onClick={() => {
                                                                                        setIsAddStaffDialogOpen(false)
                                                                                        setSelectedStaffId("")
                                                                                    }}
                                                                                >
                                                                                    Hủy
                                                                                </Button>
                                                                                <Button onClick={handleAddStaffToShift} disabled={!selectedStaffId}>
                                                                                    Thêm
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>

                                                            {/* Staff List */}
                                                            <div className="space-y-2">
                                                                {shift.staff.length === 0 ? (
                                                                    <p className="text-sm text-muted-foreground italic">Chưa có nhân viên nào</p>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {shift.staff.map((staffId) => (
                                                                            <div
                                                                                key={staffId}
                                                                                className="flex items-center justify-between bg-muted/50 p-3 rounded-md"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                                                    <div>
                                                                                        <p className="text-sm font-medium">{getStaffName(staffId)}</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            {getRoleLabel(getStaffRole(staffId))}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleRemoveStaffFromShift(schedule.id, shift.id, staffId)}
                                                                                    className="text-destructive hover:text-destructive"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                )
                            })
                        )}
                    </div>
                ) : (
                    // MONTH VIEW
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
                                        </CardTitle>
                                        <CardDescription>Xem lịch làm việc theo tháng</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                                            Hôm nay
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handleNextMonth}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Array.from({ length: getWeeksInMonth(currentMonth) }).map((_, weekIdx) => {
                                        const weekStart = weekIdx * 7 - getFirstDayOfMonth(currentMonth) + 1
                                        const weekDays = Array.from({ length: 7 }).map((_, dayIdx) => {
                                            const day = weekStart + dayIdx
                                            if (day < 1 || day > getDaysInMonth(currentMonth)) return null
                                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                                            return date
                                        })

                                        return (
                                            <Card key={weekIdx} className="bg-muted/30">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm">
                                                        Tuần {weekIdx + 1} ({weekDays[0]?.toLocaleDateString("vi-VN")} -{" "}
                                                        {weekDays[6]?.toLocaleDateString("vi-VN")})
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-7 gap-2">
                                                        {weekDays.map((date, dayIdx) => {
                                                            if (!date) {
                                                                return <div key={`empty-${dayIdx}`} className="aspect-square" />
                                                            }

                                                            const daySchedules = getSchedulesForDate(date)
                                                            const totalShifts = daySchedules.reduce((sum, s) => sum + s.shifts.length, 0)
                                                            const totalStaff = daySchedules.reduce(
                                                                (sum, s) =>
                                                                    sum + s.shifts.reduce((shiftSum, shift) => shiftSum + shift.staff.length, 0),
                                                                0,
                                                            )

                                                            return (
                                                                <div
                                                                    key={date.toISOString()}
                                                                    className="aspect-square border rounded-lg p-2 bg-white hover:shadow-md transition-shadow cursor-pointer"
                                                                >
                                                                    <div className="text-xs font-semibold mb-1">{date.getDate()}</div>
                                                                    {daySchedules.length === 0 ? (
                                                                        <div className="text-xs text-muted-foreground">-</div>
                                                                    ) : (
                                                                        <div className="space-y-1">
                                                                            <div className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">
                                                                                {totalShifts} ca
                                                                            </div>
                                                                            <div className="text-xs bg-secondary/10 text-secondary px-1 py-0.5 rounded">
                                                                                {totalStaff} người
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Summary Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tóm tắt lịch làm việc</CardTitle>
                        <CardDescription>Thống kê nhân viên theo ca làm việc</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng lịch làm việc</p>
                                <p className="text-3xl font-bold">{schedules.length}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng ca làm việc</p>
                                <p className="text-3xl font-bold">{schedules.reduce((sum, s) => sum + s.shifts.length, 0)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng phân công</p>
                                <p className="text-3xl font-bold">
                                    {schedules.reduce(
                                        (sum, s) => sum + s.shifts.reduce((shiftSum, shift) => shiftSum + shift.staff.length, 0),
                                        0,
                                    )}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Tổng bác sĩ được phân công</p>
                                <p className="text-3xl font-bold">
                                    {
                                        new Set(
                                            schedules.flatMap((s) =>
                                                s.shifts.flatMap((shift) =>
                                                    shift.staff.filter((staffId) => mockStaff.find((s) => s.id === staffId)?.role === "doctor"),
                                                ),
                                            ),
                                        ).size
                                    }
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
