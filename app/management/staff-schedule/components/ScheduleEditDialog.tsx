"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto, ShiftResponseDto } from "@/lib/types/manager-type"
import { formatTime } from "./helpers"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    effectiveFrom: string
    effectiveTo: string
    shifts: ShiftResponseDto[]
    doctors: DoctorDto[]
    onUpdated: () => void
}

export default function ScheduleEditDialog({
    open,
    onOpenChange,
    effectiveFrom,
    effectiveTo,
    shifts,
    doctors,
    onUpdated,
}: Props) {

    const [fromDate, setFromDate] = useState(effectiveFrom)
    const [toDate, setToDate] = useState(effectiveTo)
    const [selectedDoctorsByShift, setSelectedDoctorsByShift] = useState<Record<number, number[]>>({})
    const [loading, setLoading] = useState(false)
    const [searchDoctors, setSearchDoctors] = useState<Record<string, string>>({})
    const [doctorShiftCount, setDoctorShiftCount] = useState<Record<number, number>>({})
    const [doctorLimitStatus, setDoctorLimitStatus] = useState<Record<number, boolean>>({})

    // Khi mở popup load giới hạn bác sĩ (gọi 1 lần)
    useEffect(() => {
        if (open) {
            const from = effectiveFrom?.split("T")[0] || ""
            const to = effectiveTo?.split("T")[0] || ""
            setFromDate(from)
            setToDate(to)
            fetchDoctorLimits(from, to)
        }
    }, [open, effectiveFrom, effectiveTo])

    // Mapping các bác sĩ theo từng ca
    useEffect(() => {
        const map: Record<number, number[]> = {}
        shifts.forEach((s) => {
            map[s.shiftID] = s.doctors?.map((d) => d.doctorID) || []
        })
        setSelectedDoctorsByShift(map)
    }, [shifts])

    // Lấy giới hạn ban đầu và nạp vào hashmap (count)
    const fetchDoctorLimits = async (from: string, to: string) => {
        if (!from || !to) return

        const newCount: Record<number, number> = {}
        const newStatus: Record<number, boolean> = {}

        // Lấy trạng thái có thể thêm 
        for (const doctor of doctors) {
            try {
                const canAdd = await managerService.checkDoctorShiftLimitRange(
                    doctor.doctorID,
                    from,
                    to
                )
                // Nếu không thể thêm => đã đủ 2 ca, khởi tạo là 2
                newCount[doctor.doctorID] = canAdd ? 0 : 2
                newStatus[doctor.doctorID] = !canAdd
            } catch (err) {
                console.error("Check limit failed:", err)
            }
        }


        shifts.forEach((s) => {
            s.doctors?.forEach((d) => {
                newCount[d.doctorID] = (newCount[d.doctorID] || 0) + 1
            })
        })


        doctors.forEach((d) => {
            newStatus[d.doctorID] = (newCount[d.doctorID] || 0) >= 2
        })

        setDoctorShiftCount(newCount)
        setDoctorLimitStatus(newStatus)
    }

    // Toggle chọn bác sĩ (+1 / -1 thay vì gọi lại API)
    const toggleDoctor = (shiftId: number, doctorId: number) => {
        setSelectedDoctorsByShift((prev) => {
            const list = new Set(prev[shiftId] || [])
            const isSelected = list.has(doctorId)

            setDoctorShiftCount((prevCount) => {
                const current = prevCount[doctorId] || 0
                const updated = isSelected ? Math.max(0, current - 1) : current + 1
                return { ...prevCount, [doctorId]: updated }
            })

            if (isSelected) list.delete(doctorId)
            else list.add(doctorId)

            return { ...prev, [shiftId]: Array.from(list) }
        })
    }

    // Cập nhật trạng thái disable dựa vào doctorShiftCount
    useEffect(() => {
        const newStatus: Record<number, boolean> = {}
        doctors.forEach((d) => {
            newStatus[d.doctorID] = (doctorShiftCount[d.doctorID] || 0) >= 2
        })
        setDoctorLimitStatus(newStatus)
    }, [doctorShiftCount])

    // Gửi cập nhật
    const handleSave = async () => {
        if (new Date(toDate) < new Date()) {
            alert("Không thể chỉnh sửa khoảng thời gian đã qua!")
            return
        }

        setLoading(true)
        try {
            for (const shift of shifts) {
                const current = shift.doctors.map((d) => d.doctorID)
                const updated = selectedDoctorsByShift[shift.shiftID] || []

                const addDoctorIds = updated.filter((id) => !current.includes(id))
                const removeDoctorIds = current.filter((id) => !updated.includes(id))

                if (addDoctorIds.length === 0 && removeDoctorIds.length === 0 && toDate === effectiveTo) continue

                await managerService.updateDoctorShiftRange({
                    shiftId: shift.shiftID,
                    fromDate,
                    toDate: effectiveTo,
                    newToDate: toDate,
                    addDoctorIds,
                    removeDoctorIds,
                })
            }

            alert("Cập nhật lịch làm việc thành công!")
            onUpdated()
            onOpenChange(false)
        } catch (err: any) {
            console.error(err)
            alert("Error! " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa lịch làm việc</DialogTitle>
                </DialogHeader>

                {/* Ngày hiệu lực */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="text-sm font-medium">Từ ngày</label>
                        <Input type="date" value={fromDate} disabled className="opacity-70 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Đến ngày</label>
                        <Input
                            type="date"
                            value={toDate}
                            min={fromDate}
                            disabled
                            className="opacity-70 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Danh sách ca và bác sĩ */}
                {shifts.map((shift) => {
                    const search = (searchDoctors[shift.shiftType] || "").toLowerCase()

                    return (
                        <div key={shift.shiftID} className="border rounded-md p-3 bg-muted/30 mb-3">
                            <p className="font-semibold mb-1">{shift.shiftType}</p>
                            <p className="text-xs text-muted-foreground mb-2">
                                {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                            </p>

                            <Input
                                type="text"
                                placeholder="Tìm bác sĩ theo tên hoặc chuyên khoa..."
                                className="h-8 text-sm mb-2"
                                value={searchDoctors[shift.shiftType] || ""}
                                onChange={(e) =>
                                    setSearchDoctors((prev) => ({
                                        ...prev,
                                        [shift.shiftType]: e.target.value,
                                    }))
                                }
                            />

                            {doctors
                                .filter(
                                    (d) =>
                                        d.fullName.toLowerCase().includes(search) ||
                                        d.specialty.toLowerCase().includes(search)
                                )
                                .map((d) => {
                                    const isInCurrentShift =
                                        selectedDoctorsByShift[shift.shiftID]?.includes(d.doctorID) ?? false
                                    const disabled =
                                        !isInCurrentShift && (doctorLimitStatus[d.doctorID] || (doctorShiftCount[d.doctorID] || 0) >= 2)

                                    return (
                                        <label
                                            key={d.doctorID}
                                            className={`flex items-center gap-3 p-2 rounded ${disabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : "hover:bg-muted/50"
                                                }`}
                                        >
                                            <Checkbox
                                                checked={isInCurrentShift}
                                                disabled={disabled}
                                                onCheckedChange={() => toggleDoctor(shift.shiftID, d.doctorID)}
                                            />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {d.fullName}
                                                    {disabled && (
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            (Đã đủ 2 ca trong khoảng)
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{d.specialty}</p>
                                            </div>
                                        </label>
                                    )
                                })}
                        </div>
                    )
                })}

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
