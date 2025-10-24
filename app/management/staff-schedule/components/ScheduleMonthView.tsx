"use client"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function ScheduleMonthView({ schedules }: { schedules: any[] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const getDays = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>
                            Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
                        </CardTitle>
                        <CardDescription>Xem lịch làm việc theo tháng</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                            }
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                            Hôm nay
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getDays(currentMonth) }).map((_, i) => (
                        <div key={i} className="border p-2 rounded-lg text-xs bg-white">
                            {i + 1}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
