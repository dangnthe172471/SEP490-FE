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
    const [searchDoctor, setSearchDoctor] = useState("") // thanh tìm kiếm

    // nếu đến ngày < từ ngày → reset
    useEffect(() => {
        if (selectedDateFrom && selectedDateTo && selectedDateTo < selectedDateFrom) {
            setSelectedDateTo("")
        }
    }, [selectedDateFrom, selectedDateTo])

    // reset form
    const resetForm = () => {
        setSelectedDateFrom("")
        setSelectedDateTo("")
        setSelectedShifts([])
        setDoctorsByShift({})
        setSearchDoctor("")
    }

    // chọn/ bỏ chọn ca
    const toggleShift = (shiftType: string) => {
        setSelectedShifts((prev) =>
            prev.includes(shiftType) ? prev.filter((s) => s !== shiftType) : [...prev, shiftType]
        )
    }

    // chọn/ bỏ chọn bác sĩ
    const toggleDoctor = (shift: string, doctorId: string) => {
        setDoctorsByShift((prev) => {
            const list = new Set(prev[shift] || [])
            list.has(doctorId) ? list.delete(doctorId) : list.add(doctorId)
            return { ...prev, [shift]: Array.from(list) }
        })
    }

    // kiểm tra ca có bác sĩ nào chưa
    const isShiftUnassigned = (shiftType: string): boolean => {
        const doctors = doctorsByShift[shiftType]
        return !doctors || doctors.length === 0
    }

    // đếm số ca đã chọn của 1 bác sĩ
    const getDoctorCount = (doctorId: string): number => {
        return Object.values(doctorsByShift).reduce(
            (count, arr) => count + (arr.includes(doctorId) ? 1 : 0),
            0
        )
    }

    // tạo lịch
    const handleCreate = async () => {
        if (!selectedDateFrom) {
            alert("Vui lòng chọn ngày bắt đầu!")
            return
        }

        // nếu chưa chọn đến ngày → tự cộng 30 ngày
        let finalDateTo = selectedDateTo
        if (!selectedDateTo) {
            const from = new Date(selectedDateFrom)
            const autoTo = new Date(from)
            autoTo.setDate(from.getDate() + 30)
            finalDateTo = autoTo.toISOString().split("T")[0]
            const confirmResult = window.confirm(`Lịch sẽ được phân đến ngày: ${finalDateTo}. Bạn có muốn tiếp tục không?`)
            if (!confirmResult) {
                return // người dùng chọn Hủy → dừng lại
            }

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

        // if (Shifts.length === 0) {
        //     alert("Chọn ít nhất 1 bác sĩ cho mỗi ca!")
        //     return
        // }

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

                {/* chọn khoảng ngày */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium">Từ ngày</label>
                        <Input
                            type="date"
                            value={selectedDateFrom}
                            onChange={(e) => setSelectedDateFrom(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Đến ngày</label>
                        <Input
                            type="date"
                            value={selectedDateTo}
                            onChange={(e) => setSelectedDateTo(e.target.value)}
                            min={selectedDateFrom || new Date().toISOString().split("T")[0]}
                        />
                    </div>
                </div>

                {/* danh sách ca và bác sĩ */}
                <div className="space-y-4 mt-4 border rounded-lg p-4 bg-muted/30">
                    {shifts.map((shift) => (
                        <div key={shift.shiftType} className="border rounded-lg p-3 bg-white space-y-3">
                            {/* ca */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedShifts.includes(shift.shiftType)}
                                    onChange={() => toggleShift(shift.shiftType)}
                                />
                                <div>
                                    <p className="text-sm font-semibold">{shift.shiftType}
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
                                        value={searchDoctor}
                                        onChange={(e) => setSearchDoctor(e.target.value)}
                                    />

                                    {/* danh sách bác sĩ */}
                                    {doctors
                                        .filter(
                                            (d) =>
                                                d.fullName.toLowerCase().includes(searchDoctor.toLowerCase()) ||
                                                d.specialty.toLowerCase().includes(searchDoctor.toLowerCase())
                                        )
                                        .map((doctor) => {
                                            const count = getDoctorCount(doctor.doctorID.toString())
                                            const isInCurrentShift = (doctorsByShift[shift.shiftType] || []).includes(
                                                doctor.doctorID.toString()
                                            )
                                            const disabled = count >= 2 && !isInCurrentShift

                                            return (
                                                <label
                                                    key={doctor.doctorID}
                                                    className={`flex items-center gap-3 p-2 rounded ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
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
                                                        <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                                                    </div>
                                                </label>
                                            )
                                        })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* nút hành động */}
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? "Đang tạo..." : "Tạo lịch làm việc"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
