"use client"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"

export default function ScheduleSummary({ schedules = [], doctors = [] }: any) {
    const totalShifts = schedules.reduce(
        (sum: number, s: any) => sum + (s.shifts?.length || 0),
        0
    )

    const totalAssignments = schedules.reduce(
        (sum: number, s: any) =>
            sum + (s.shifts?.reduce((t: number, sh: any) => t + (sh.staff?.length || 0), 0) || 0),
        0
    )

    return (
        <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded bg-muted/30">
                <p className="text-sm text-muted-foreground">Tổng lịch</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
            </div>
            <div className="p-4 rounded bg-muted/30">
                <p className="text-sm text-muted-foreground">Tổng ca làm</p>
                <p className="text-2xl font-bold">{totalShifts}</p>
            </div>
            <div className="p-4 rounded bg-muted/30">
                <p className="text-sm text-muted-foreground">Tổng phân công</p>
                <p className="text-2xl font-bold">{totalAssignments}</p>
            </div>
        </div>
    )
}

