"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto, ShiftResponseDto } from "@/lib/types/manager-type"
import { formatTime } from "./helpers"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    shifts: ShiftResponseDto[]
    doctors: DoctorDto[]
    loading: boolean
    setLoading: (val: boolean) => void
    onCreated: (data: any) => void
}

export default function ScheduleCreateDialog({
    open,
    onOpenChange,
    shifts,
    doctors,
    loading,
    setLoading,
    onCreated,
}: Props) {
    // state
    const [selectedDateFrom, setSelectedDateFrom] = useState("")
    const [selectedDateTo, setSelectedDateTo] = useState("")
    const [selectedShifts, setSelectedShifts] = useState<string[]>([])
    const [doctorsByShift, setDoctorsByShift] = useState<Record<string, string[]>>({})
    const [searchDoctors, setSearchDoctors] = useState<Record<string, string>>({})
    // Trạng thái giới hạn ca của bác sĩ
    const [doctorLimitStatus, setDoctorLimitStatus] = useState<Record<string, boolean>>({})

    // Chọn lịch theo tuần hoặc theo tháng
    const [mode, setMode] = useState<"week" | "month">("week")
    // Chọn tháng, năm, và tuần
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [selectedWeek, setSelectedWeek] = useState<number>(1)
    const [dateError, setDateError] = useState<string>("")

    useEffect(() => {
        if (selectedDateFrom && selectedDateTo && selectedDateTo < selectedDateFrom) {
            setSelectedDateTo("")
        }
    }, [selectedDateFrom, selectedDateTo])

    const getMonthRange = (year: number, month: number) => {
        const start = new Date(year, month - 1, 1)
        const end = new Date(year, month, 0)
        return {
            from: start.toISOString().split("T")[0],
            to: end.toISOString().split("T")[0],
        }
    }
    const getWeekRange = (year: number, month: number, week: number) => {

        const firstDayOfMonth = new Date(year, month - 1, 1)

        // Tìm thứ Hai đầu tiên trong (hoặc trước) tháng
        const day = firstDayOfMonth.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const firstMonday = new Date(firstDayOfMonth)
        firstMonday.setDate(firstDayOfMonth.getDate() + diffToMonday)


        const startOfWeek = new Date(firstMonday)
        startOfWeek.setDate(firstMonday.getDate() + (week - 1) * 7)

        // Ngày kết thúc tuần (Chủ nhật)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        return {
            from: startOfWeek.toISOString().split("T")[0],
            to: endOfWeek.toISOString().split("T")[0],
        }
    }


    const getWeekCountInMonth = (year: number, month: number) => {
        const firstDay = new Date(year, month - 1, 1)
        const lastDay = new Date(year, month, 0)
        const used = firstDay.getDay() + lastDay.getDate() // tổng offset + số ngày
        return Math.ceil(used / 7)
    }
    const [totalWeeks, setTotalWeeks] = useState<number>(getWeekCountInMonth(selectedYear, selectedMonth))

    useEffect(() => {
        // Cập nhật số tuần của tháng
        const weekCount = getWeekCountInMonth(selectedYear, selectedMonth)
        setTotalWeeks(weekCount)

        let range: { from: string; to: string } | null = null
        if (mode === "month") {
            range = getMonthRange(selectedYear, selectedMonth)
        } else {
            range = getWeekRange(selectedYear, selectedMonth, selectedWeek)
        }

        const today = new Date().toISOString().split("T")[0]

        if (!range) {
            setDateError("") // reset cảnh báo khi range null
            setSelectedDateFrom("")
            setSelectedDateTo("")
            return
        }


        if (range.from <= today && today <= range.to) {
            setDateError("Khoảng thời gian này đang diễn ra, không thể tạo lịch.")
            setSelectedDateFrom("")
            setSelectedDateTo("")
        } else if (range.to < today) {
            setDateError("Khoảng thời gian này đã qua, không thể tạo lịch.")
            setSelectedDateFrom("")
            setSelectedDateTo("")
        } else {
            setDateError("")
            setSelectedDateFrom(range.from)
            setSelectedDateTo(range.to)
        }
    }, [mode, selectedMonth, selectedYear, selectedWeek])



    // Check giới hạn khi chọn ngày
    useEffect(() => {
        const fetchDoctorLimits = async () => {
            if (!selectedDateFrom) return
            const newStatus: Record<string, boolean> = {}
            for (const doctor of doctors) {
                const canAdd = await managerService.checkDoctorShiftLimit(doctor.doctorID, selectedDateFrom)
                newStatus[doctor.doctorID] = !canAdd // true = đã đủ 2 ca
            }
            setDoctorLimitStatus(newStatus)
        }
        fetchDoctorLimits()
    }, [selectedDateFrom, doctors])

    const resetForm = () => {
        setSelectedDateFrom("")
        setSelectedDateTo("")
        setSelectedShifts([])
        setDoctorsByShift({})
        setSearchDoctors({})
        setDoctorLimitStatus({})
    }

    const toggleShift = (shiftType: string) => {
        setSelectedShifts((prev) =>
            prev.includes(shiftType) ? prev.filter((s) => s !== shiftType) : [...prev, shiftType]
        )
    }

    const toggleDoctor = (shift: string, doctorId: string) => {
        setDoctorsByShift((prev) => {
            const list = new Set(prev[shift] || [])
            list.has(doctorId) ? list.delete(doctorId) : list.add(doctorId)
            return { ...prev, [shift]: Array.from(list) }
        })
    }

    const isShiftUnassigned = (shiftType: string): boolean => {
        const doctors = doctorsByShift[shiftType]
        return !doctors || doctors.length === 0
    }

    const getDoctorCount = (doctorId: string): number => {
        return Object.values(doctorsByShift).reduce(
            (count, arr) => count + (arr.includes(doctorId) ? 1 : 0),
            0
        )
    }

    const handleCreate = async () => {
        if (!selectedDateFrom) {
            alert("Vui lòng chọn ngày bắt đầu!")
            return
        }

        let finalDateTo = selectedDateTo
        if (!selectedDateTo) {
            const from = new Date(selectedDateFrom)
            const autoTo = new Date(from)
            autoTo.setDate(from.getDate() + 30)
            finalDateTo = autoTo.toISOString().split("T")[0]
            const confirmResult = window.confirm(`Lịch sẽ được phân đến ngày: ${finalDateTo}. Bạn có muốn tiếp tục không?`)
            if (!confirmResult) return
        }

        const effectiveFrom = new Date(selectedDateFrom).toISOString().split("T")[0]
        const effectiveTo = new Date(finalDateTo).toISOString().split("T")[0]

        const Shifts = shifts
            .filter((s) => selectedShifts.includes(s.shiftType))
            .map((s) => ({
                shiftID: s.shiftID,
                doctorIDs: doctorsByShift[s.shiftType]?.map(Number) || [],
            }))
            .filter((x) => x.doctorIDs.length > 0)

        try {
            setLoading(true)
            const payload = { effectiveFrom, effectiveTo, Shifts }
            const res = await managerService.createSchedule(payload)
            alert(res.message || "Tạo lịch thành công 🎉")
            resetForm()
            onCreated(payload)
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            alert("Lỗi khi tạo lịch")
        } finally {
            setLoading(false)
        }
    }

    // UI
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tạo lịch làm việc mới</DialogTitle>
                    <DialogDescription>Chọn khoảng ngày, ca và bác sĩ</DialogDescription>
                </DialogHeader>

                {/* 🔹 Chọn chế độ tạo lịch */}
                <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={mode === "week"} onChange={() => setMode("week")} />
                        <span>Theo tuần</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={mode === "month"} onChange={() => setMode("month")} />
                        <span>Theo tháng</span>
                    </label>
                </div>

                {/*  Chọn tháng và năm */}
                <div className="grid grid-cols-2 gap-3 mt-3">

                    <div>
                        <label className="text-sm font-medium">Tháng</label>
                        <select
                            className="w-full border rounded-md h-9 px-2"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    Tháng {i + 1}
                                </option>
                            ))}
                        </select>

                    </div>
                    <div>
                        <label className="text-sm font-medium">Năm</label>
                        <select
                            className="w-full border rounded-md h-9 px-2"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() + i
                                return (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                )
                            })}
                        </select>
                    </div>

                </div>

                {/* Nếu theo tuần thì cho chọn tuần */}
                {mode === "week" && (
                    <div className="mt-3">
                        <label className="text-sm font-medium">Tuần</label>
                        <select
                            className="w-full border rounded-md h-9 px-2"
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        >
                            {Array.from({ length: totalWeeks }, (_, i) => {
                                const week = i + 1
                                const range = getWeekRange(selectedYear, selectedMonth, week)
                                if (!range) return null
                                return (
                                    <option key={week} value={week}>
                                        Tuần {week} {"\u00A0"}   {"\u00A0"}  ({range.from.slice(8, 10)}/{range.from.slice(5, 7)} – {range.to.slice(8, 10)}/{range.to.slice(5, 7)})
                                    </option>
                                )
                            })}
                        </select>

                    </div>
                )}
                <div className="grid  pointer-events-none">

                    {dateError && (
                        <p className="text-sm text-red-500 mt-2">{dateError}</p>
                    )}
                </div>
                {/*  Hiển thị khoảng ngày (chỉ xem) */}
                <div className="grid grid-cols-2 gap-3 mt-4 opacity-60 pointer-events-none">
                    <div>
                        <label className="text-sm font-medium">Từ ngày</label>
                        <Input type="date" value={selectedDateFrom} readOnly />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Đến ngày</label>
                        <Input type="date" value={selectedDateTo} readOnly />
                    </div>
                </div>


                {/* danh sách ca và bác sĩ */}
                <div className="space-y-4 mt-4 border rounded-lg p-4 bg-muted/30">
                    {shifts.map((shift) => {
                        const search = (searchDoctors[shift.shiftType] || "").toLowerCase()

                        return (
                            <div key={shift.shiftType} className="border rounded-lg p-3 bg-white space-y-3">
                                {/* ca */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedShifts.includes(shift.shiftType)}
                                        onChange={() => toggleShift(shift.shiftType)}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {shift.shiftType}
                                            {isShiftUnassigned(shift.shiftType) && (
                                                <span className="text-xs text-red-500 ml-2">(Chưa phân công)</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                                        </p>
                                    </div>
                                </label>

                                {/* bác sĩ */}
                                {selectedShifts.includes(shift.shiftType) && (
                                    <div className="ml-7 space-y-3 border-t pt-3">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Chọn bác sĩ cho ca {shift.shiftType}
                                        </p>

                                        {/* thanh tìm kiếm */}
                                        <Input
                                            type="text"
                                            placeholder="Tìm bác sĩ theo tên hoặc chuyên khoa..."
                                            className="h-8 text-sm"
                                            value={searchDoctors[shift.shiftType] || ""}
                                            onChange={(e) =>
                                                setSearchDoctors((prev) => ({
                                                    ...prev,
                                                    [shift.shiftType]: e.target.value,
                                                }))
                                            }
                                        />

                                        {/* danh sách bác sĩ */}
                                        {doctors
                                            .filter(
                                                (d) =>
                                                    d.fullName.toLowerCase().includes(search) ||
                                                    d.specialty.toLowerCase().includes(search)
                                            )
                                            .map((doctor) => {
                                                const count = getDoctorCount(doctor.doctorID.toString())
                                                const isInCurrentShift = (doctorsByShift[shift.shiftType] || []).includes(
                                                    doctor.doctorID.toString()
                                                )
                                                // Điều kiện limit
                                                const disabled =
                                                    !isInCurrentShift &&
                                                    (count >= 2 || doctorLimitStatus[doctor.doctorID])

                                                return (
                                                    <label
                                                        key={doctor.doctorID}
                                                        className={`flex items-center gap-3 p-2 rounded ${disabled
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : "hover:bg-muted/50"
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={isInCurrentShift}
                                                            disabled={disabled}
                                                            onCheckedChange={() =>
                                                                toggleDoctor(shift.shiftType, doctor.doctorID.toString())
                                                            }
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {doctor.fullName}
                                                                {disabled && (
                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                        (Đã đủ 2 ca)
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {doctor.specialty}
                                                            </p>
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* nút hành động */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleCreate} disabled={loading || !selectedDateFrom}>

                        {loading ? "Đang tạo..." : "Tạo lịch làm việc"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
