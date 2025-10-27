"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, ChevronUp, Clock, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { managerService } from "@/lib/services/manager-service"
import type { WorkScheduleGroupDto, DoctorDto } from "@/lib/types/manager-type"
import ScheduleEditDialog from "@/app/management/staff-schedule/components/ScheduleEditDialog"

export default function SchedulePeriodListView() {
    const [schedules, setSchedules] = useState<WorkScheduleGroupDto[]>([])
    const [expanded, setExpanded] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

   
    //  Phân trang
    const [pageNumber, setPageNumber] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const pageSize = 5

    const [editOpen, setEditOpen] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<WorkScheduleGroupDto | null>(null)
    const [doctors, setDoctors] = useState<DoctorDto[]>([])

    const fetchSchedules = async (page = 1) => {
        setLoading(true)
        try {
            const data = await managerService.listGroupSchedule(page, pageSize)
            console.log(" Dữ liệu nhóm:", data)
            setSchedules(data.items || [])
            setTotalPages(data.totalPages || 1)
            setPageNumber(data.pageNumber || 1)
        } catch (err) {
            console.error(" Lỗi khi tải lịch:", err)
            setSchedules([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSchedules(pageNumber)
        managerService.getAllDoctors().then(setDoctors)
    }, [pageNumber])

    useEffect(() => {
        fetchSchedules(pageNumber)
    }, [pageNumber])

    const formatVN = (d: string | null | undefined) => {
        if (!d) return "—"
        return new Date(d).toLocaleDateString("vi-VN")
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Lịch làm việc theo khoảng thời gian
                </h2>
                <Button variant="outline" onClick={() => fetchSchedules(pageNumber)}>
                    Làm mới
                </Button>
            </div>

            {/* Loading / Empty / Data */}
            {loading ? (
                <p className="text-center text-muted-foreground py-10">Đang tải dữ liệu...</p>
            ) : schedules.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Không có dữ liệu lịch làm việc.</p>
            ) : (
                <>
                    {schedules.map((item, i) => {
                        const title = `${formatVN(item.effectiveFrom)} → ${formatVN(item.effectiveTo)}`
                        const totalShifts = item.shifts?.length ?? 0
                        const totalDoctors = item.shifts?.reduce(
                            (sum, s) => sum + (s.doctors?.length ?? 0),
                            0
                        )

                        return (
                            <Card key={i} className="border shadow-sm">
                                <CardHeader className="flex items-center justify-between hover:bg-muted/40 transition">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer"
                                        onClick={() => setExpanded(expanded === i ? null : i)}
                                    >
                                        {expanded === i ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <Calendar className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                                    </div>

                                    {/* Bên phải: mô tả + nút chỉnh sửa */}
                                    <div className="flex items-center gap-3">
                                        <CardDescription className="text-sm text-muted-foreground">
                                            {totalShifts} ca • {totalDoctors} bác sĩ
                                        </CardDescription>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedSchedule(item)
                                                setEditOpen(true)
                                            }}
                                        >
                                            📝 Chỉnh sửa
                                        </Button>
                                    </div>
                                </CardHeader>


                                {expanded === i && (
                                    <CardContent className="space-y-4 pt-2">
                                        {item.shifts.map((shift, idx) => (
                                            <div key={idx} className="border rounded-md p-3 bg-muted/30 mx-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="h-5 w-5 text-secondary" />
                                                        <div>
                                                            <p className="font-semibold">{shift.shiftType}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {shift.startTime} - {shift.endTime}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* <Button variant="outline" size="sm">
                                                        <Plus className="h-4 w-4 mr-1" /> Thêm bác sĩ
                                                    </Button> */}
                                                </div>

                                                {shift.doctors.length === 0 ? (
                                                    <p className="text-sm italic text-muted-foreground">
                                                        Chưa có bác sĩ trong ca này
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {shift.doctors.map((doc) => (
                                                            <div
                                                                key={`${shift.shiftID}-${doc.doctorID}`}
                                                                className="flex justify-between items-center bg-white px-3 py-2 rounded-md border shadow-sm"
                                                            >
                                                                <div>
                                                                    <p className="font-medium text-sm">{doc.fullName}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {doc.specialty}
                                                                    </p>
                                                                </div>
                                                                {/* <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button> */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}

                    {/* --- Pagination Controls --- */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Trang trước
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            Trang {pageNumber} / {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pageNumber >= totalPages}
                            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                        >
                            Trang sau <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                                {/* --- Dialog chỉnh sửa lịch --- */}
                                {selectedSchedule && (
                                    <ScheduleEditDialog
                                        open={editOpen}
                                        onOpenChange={setEditOpen}
                                        effectiveFrom={selectedSchedule.effectiveFrom}
                                        effectiveTo={selectedSchedule.effectiveTo}
                                        shifts={selectedSchedule.shifts}
                                        doctors={doctors}
                                        onUpdated={() => fetchSchedules(pageNumber)}
                                    />
                                )}

                    </div>
                    
                </>
            )}
        </div>
        
    )
    
}
