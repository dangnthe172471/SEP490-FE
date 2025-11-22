"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { managerService } from "@/lib/services/manager-service"
import type { WorkScheduleGroupDto, DoctorDto, ShiftResponseDto } from "@/lib/types/manager-type"
import { Button } from "@/components/ui/button"
import { List, Grid3x3, Plus, Clock } from "lucide-react"
import ScheduleCreateDialog from "./components/ScheduleCreateDialog"
import ScheduleWeeklyView from "./components/ScheduleWeeklyView"
import ScheduleMonthView from "./components/ScheduleMonthView"
import ScheduleSummary from "./components/ScheduleSummary"
import SchedulePeriodListView from "./components/SchedulePeriodListView"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"
import PageGuard from "@/components/PageGuard"

export default function StaffSchedulePage() {
    const navigation = getManagerNavigation()

    const [schedules, setSchedules] = useState<any[]>([])
    const [shifts, setShifts] = useState<ShiftResponseDto[]>([])
    const [doctors, setDoctors] = useState<DoctorDto[]>([])
    const [viewMode, setViewMode] = useState<"list" | "month" | "period">("list")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [scheduleGroups, setScheduleGroups] = useState<WorkScheduleGroupDto[]>([])
    const [isMounted, setIsMounted] = useState(false)

    // Chỉ render sau khi mounted để tránh SSR mismatch
    useEffect(() => {
        setIsMounted(true)

        // Load dữ liệu async
        managerService.getAllShifts().then(setShifts)
        managerService.searchDoctors("").then(setDoctors)
        fetchSchedules()
    }, [])

    const fetchSchedules = async () => {
        const data = await managerService.listGroupSchedule(1, 5)
        setScheduleGroups(data.items)
    }

    if (!isMounted) {
        // Hiển thị spinner SSR-safe
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        )
    }

    return (
        <PageGuard allowedRoles={["management", "admin"]}>
            <DashboardLayout navigation={navigation}>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Lịch làm việc nhân viên</h1>
                            <p className="text-muted-foreground">
                                Quản lý lịch làm việc của toàn bộ nhân viên phòng khám
                            </p>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Tạo lịch mới
                        </Button>
                    </div>

                    {/* Switch view */}
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === "list" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4 mr-2" /> Chi tiết
                        </Button>
                        <Button
                            variant={viewMode === "month" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("month")}
                        >
                            <Grid3x3 className="h-4 w-4 mr-2" /> Tổng quan
                        </Button>
                        <Button
                            variant={viewMode === "period" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("period")}
                        >
                            <Clock className="h-4 w-4 mr-2" /> Khoảng thời gian tạo lịch
                        </Button>
                    </div>

                    {/* Views */}
                    {viewMode === "list" ? (
                        <ScheduleWeeklyView />
                    ) : viewMode === "month" ? (
                        <ScheduleMonthView schedules={schedules} />
                    ) : (
                        <SchedulePeriodListView />
                    )}

                    <ScheduleSummary />
                    <ScheduleCreateDialog
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                        shifts={shifts}
                        doctors={doctors}
                        loading={loading}
                        setLoading={setLoading}
                        onCreated={() => {
                            fetchSchedules()
                        }}
                    />
                </div>
            </DashboardLayout>
        </PageGuard>
    )
}
