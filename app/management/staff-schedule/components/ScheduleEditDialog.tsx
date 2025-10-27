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

    // Khi mở popup → set lại giá trị ngày
    useEffect(() => {
        if (open) {
            setFromDate(effectiveFrom?.split("T")[0] || "")
            setToDate(effectiveTo?.split("T")[0] || "")
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

    // Toggle chọn bác sĩ
    const toggleDoctor = (shiftId: number, doctorId: number) => {
        setSelectedDoctorsByShift((prev) => {
            const list = new Set(prev[shiftId] || [])
            list.has(doctorId) ? list.delete(doctorId) : list.add(doctorId)
            return { ...prev, [shiftId]: Array.from(list) }
        })
    }

    // Gửi cập nhật
    const handleSave = async () => {
        if (new Date(toDate) < new Date()) {
            alert(" Không thể chỉnh sửa khoảng thời gian đã qua!")
            return
        }

        setLoading(true)
        try {
            for (const shift of shifts) {
                const current = shift.doctors.map((d) => d.doctorID)
                const updated = selectedDoctorsByShift[shift.shiftID] || []

                const addDoctorIds = updated.filter((id) => !current.includes(id))
                const removeDoctorIds = current.filter((id) => !updated.includes(id))

                // Nếu không thay đổi gì và ToDate không đổi → bỏ qua
                if (addDoctorIds.length === 0 && removeDoctorIds.length === 0 && toDate === effectiveTo) continue

                // Gửi payload chuẩn theo BE
                await managerService.updateDoctorShiftRange({
                    shiftId: shift.shiftID,
                    fromDate,
                    toDate: effectiveTo, // ngày cũ
                    newToDate: toDate,   // ngày mới
                    addDoctorIds,
                    removeDoctorIds,
                })
            }

            alert(" Cập nhật lịch làm việc thành công.")
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
                            onChange={(e) => setToDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Danh sách ca và bác sĩ */}
                {shifts.map((shift) => (
                    <div key={shift.shiftID} className="border rounded-md p-3 bg-muted/30 mb-3">
                        <p className="font-semibold mb-1">{shift.shiftType}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                        </p>

                        {doctors.map((d) => (
                            <label key={d.doctorID} className="flex items-center gap-2 py-1">
                                <Checkbox
                                    checked={selectedDoctorsByShift[shift.shiftID]?.includes(d.doctorID) ?? false}
                                    onCheckedChange={() => toggleDoctor(shift.shiftID, d.doctorID)}
                                />
                                <div>
                                    <p className="text-sm font-medium">{d.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{d.specialty}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                ))}

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
