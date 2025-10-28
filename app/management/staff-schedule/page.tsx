"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto, ShiftResponseDto } from "@/lib/types/manager-type"
import { Button } from "@/components/ui/button"
import { List, Grid3x3, Plus } from "lucide-react"
import ScheduleCreateDialog from "./components/ScheduleCreateDialog"
import ScheduleListView from "./components/ScheduleListView"
import ScheduleMonthView from "./components/ScheduleMonthView"
import ScheduleSummary from "./components/ScheduleSummary"
import SchedulePeriodListView from "./components/SchedulePeriodListView"

import { BarChart3, Calendar, Clock, FileText, TrendingUp } from "lucide-react"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"


export default function StaffSchedulePage() {
    // Get manager navigation from centralized config
    const navigation = getManagerNavigation()

    const [schedules, setSchedules] = useState<any[]>([])
    const [shifts, setShifts] = useState<ShiftResponseDto[]>([])
    const [doctors, setDoctors] = useState<DoctorDto[]>([])
    const [viewMode, setViewMode] = useState<"list" | "month" | "period">("list")

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        managerService.getAllShifts().then(setShifts)
        managerService.searchDoctors("").then(setDoctors)
    }, [])

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch làm việc nhân viên</h1>
                        <p className="text-muted-foreground">Quản lý lịch làm việc của toàn bộ nhân viên phòng khám</p>
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
                        <List className="h-4 w-4 mr-2" /> Tuần
                    </Button>
                    <Button
                        variant={viewMode === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("month")}
                    >
                        <Grid3x3 className="h-4 w-4 mr-2" /> Tháng
                    </Button>
                    <Button
                        variant={viewMode === "period" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("period")}
                    >
                        <Clock className="h-4 w-4 mr-2" /> Khoảng thời gian tạo lịch
                    </Button>
                </div>

                {viewMode === "list" ? (
                    <ScheduleListView
                        schedules={schedules}
                        setSchedules={setSchedules}
                        doctors={doctors}
                    />
                ) : viewMode === "month" ? (
                    <ScheduleMonthView schedules={schedules} />
                ) : (
                    <SchedulePeriodListView />
                )}


                <ScheduleSummary schedules={schedules} doctors={doctors} />
                <ScheduleCreateDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    shifts={shifts}
                    doctors={doctors}
                    loading={loading}
                    setLoading={setLoading}
                    onCreated={() => {
                        window.location.reload()
                    }}
                />
            </div>
        </DashboardLayout>
    )
}
