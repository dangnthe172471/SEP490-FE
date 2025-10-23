// components/booking-steps/date-selection.tsx
// (This version is correct)

"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateSelectionProps {
    onSelect: (date: string) => void // Expects YYYY-MM-DD output
    onChangeService?: () => void
}

export function DateSelection({ onSelect, onChangeService }: DateSelectionProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)) // Start at current month
    const [selectedDate, setSelectedDate] = useState<Date | null>(null) // Store full Date object

    // Helper functions for calendar logic
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }).toUpperCase();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate); // Day of week (0=Sun, 1=Mon, ...)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i); // Blanks before the 1st

    // Check if a day in the current calendar view is in the past
    const isPastDate = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return checkDate < today;
    };

    // Check if a day is today
    const isToday = (day: number) => {
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return checkDate.getTime() === today.getTime();
    };

    // Check if a day is the currently selected one
    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentDate.getMonth() &&
            selectedDate.getFullYear() === currentDate.getFullYear();
    };

    // Determine if the "previous month" button should be enabled
    const canGoPrev = currentDate.getFullYear() > today.getFullYear() ||
        (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() > today.getMonth());

    const handlePrevMonth = () => {
        if (canGoPrev) {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        }
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    // Handler when a date button is clicked
    const handleSelectDate = (day: number) => {
        if (isPastDate(day)) return; // Prevent selecting past dates

        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(dateObj); // Update internal state

        // Format date as "YYYY-MM-DD" before calling parent's onSelect
        const dateStr = dateObj.toISOString().split('T')[0];
        onSelect(dateStr);
    };

    return (
        <div className="space-y-8">
            {/* Header with Month/Year and Navigation */}
            <div className="rounded-xl bg-gradient-to-r from-secondary to-secondary/80 p-6 text-white">
                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrevMonth}
                        disabled={!canGoPrev} // Disable if it's the current month or past
                        className="rounded-lg hover:bg-white/20 p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h3 className="text-xl font-bold">{monthName}</h3>
                    <button onClick={handleNextMonth} className="rounded-lg hover:bg-white/20 p-2 transition-colors">
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-xl border-2 border-border bg-white p-6">
                {/* Day Names Header */}
                <div className="mb-4 grid grid-cols-7 gap-2 text-center">
                    {["CN", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy"].map((day) => (
                        <div key={day} className="py-2 font-semibold text-muted-foreground text-sm">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells before the 1st day */}
                    {emptyDays.map((i) => (
                        <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {/* Date buttons */}
                    {days.map((day) => {
                        const past = isPastDate(day);
                        const selected = isSelected(day);
                        const todayMark = isToday(day);

                        return (
                            <button
                                key={day}
                                onClick={() => handleSelectDate(day)}
                                disabled={past} // Disable past dates
                                className={`aspect-square rounded-lg font-semibold transition-all relative
                                ${selected
                                        ? "bg-secondary text-white shadow-lg" // Selected style
                                        : past
                                            ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed" // Past date style
                                            : "border-2 border-border text-foreground hover:border-secondary hover:bg-secondary/10" // Default style
                                    }
                                ${todayMark && !selected && !past ? "border-primary text-primary" : ""} // Today's style (if not selected/past)
                              `}
                            >
                                {day}
                                {/* Dot indicator for today */}
                                {todayMark && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"></span>}
                            </button>
                        )
                    })}
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">Tất cả thời gian theo múi giờ Việt Nam GMT +7</p>

            {/* Optional "Change Service" link */}
            {onChangeService && (
                <div className="flex justify-center">
                    <button
                        onClick={onChangeService}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline"
                    >
                        Đổi dịch vụ
                    </button>
                </div>
            )}
        </div>
    )
}