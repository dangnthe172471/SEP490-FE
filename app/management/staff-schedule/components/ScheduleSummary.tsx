"use client"

import { useEffect, useMemo, useState } from "react"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto } from "@/lib/types/manager-type"

// Hàm tính tuần
function getWeekRange(dateString: string) {
    const date = dateString
        ? new Date(dateString + "T00:00:00")
        : new Date()

    let day = date.getDay()
    if (day === 0) day = 7

    const monday = new Date(date)
    monday.setDate(date.getDate() - day + 1)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0],
    }
}

export default function ScheduleSummary() {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0] // default = hôm nay
    )

    const { startDate, endDate } = useMemo(
        () => getWeekRange(selectedDate),
        [selectedDate]
    )

    const [doctors, setDoctors] = useState<DoctorDto[]>([])

    useEffect(() => {
        async function load() {
            const list = await managerService.getDoctorsWithoutSchedule(startDate, endDate)
            setDoctors(list)
        }
        load()
    }, [startDate, endDate])

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="mt-4 space-y-4">


            <div className="flex items-center gap-2 bg-muted/30">
                <label className="text-sm">Chọn ngày:</label>

                <input
                    type="date"
                    className="border rounded px-3 py-2"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>


            <div className="grid grid-cols-3 gap-4 mt-4">


                <div className="p-4 rounded bg-muted/30">
                    <p className="text-sm text-muted-foreground">Tuần chứa ngày đã chọn</p>
                    <p className="text-sm font-medium mt-1">
                        {formatDate(startDate)} → {formatDate(endDate)}
                    </p>
                </div>


                <div className="p-4 rounded bg-muted/30">
                    <p className="text-sm text-muted-foreground">Nhân viên chưa phân lịch</p>
                    <p className="text-2xl font-bold mt-1">{doctors.length}</p>
                </div>


                <div className="p-4 rounded bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Danh sách</p>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {doctors.length > 0 ? (
                            doctors.map((d) => (
                                <li key={d.doctorID}>• {d.fullName} — {d.specialty}</li>
                            ))
                        ) : (
                            <li className="text-muted-foreground">Tất cả đều đã có lịch </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}
