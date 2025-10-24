"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, ChevronDown } from "lucide-react"

interface Props {
    schedules: any[]
    setSchedules: (s: any[]) => void
    doctors: any[]
}

export default function ScheduleListView({ schedules, setSchedules }: Props) {
    const toggleExpand = (id: string) => { }

    const handleDelete = (id: string) => {
        if (confirm("Xóa lịch này?")) {
            setSchedules(schedules.filter((s) => s.id !== id))
        }
    }

    if (schedules.length === 0)
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">Không có lịch làm việc nào</CardContent>
            </Card>
        )

    return (
        <div className="space-y-3">
            {schedules.map((schedule, index) => (
                <Card key={schedule.scheduleId ?? `schedule-${index}`}>
                    <CardHeader className="bg-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ChevronDown className="h-5 w-5" />
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <CardTitle className="text-lg">
                                    Lịch ngày {new Date(schedule.date).toLocaleDateString("vi-VN")}
                                </CardTitle>
                                <CardDescription>
                                    {(schedule.shifts?.length ?? 0)} ca làm việc
                                </CardDescription>

                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
