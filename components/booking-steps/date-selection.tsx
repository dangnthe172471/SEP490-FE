// components/booking-steps/date-selection.tsx
// Updated to show only dates when doctor has schedule

"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { doctorScheduleService } from "@/lib/services/doctor-schedule-service"
import type { DoctorScheduleDto } from "@/lib/types/doctor-schedule-type"

interface DateSelectionProps {
    onSelect: (date: string) => void // Expects YYYY-MM-DD output
    onChangeService?: () => void
    doctorId?: number // Doctor ID to filter available dates
}

export function DateSelection({ onSelect, onChangeService, doctorId }: DateSelectionProps) {
    // Memoize today to prevent re-renders
    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []); // Empty dependency - only calculate once

    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)) // Start at current month
    const [selectedDate, setSelectedDate] = useState<Date | null>(null) // Store full Date object
    const [availableDates, setAvailableDates] = useState<Set<string>>(new Set()) // Set of available dates (YYYY-MM-DD)
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)

    // Fetch doctor schedule when doctorId changes
    useEffect(() => {
        if (!doctorId) {
            setAvailableDates(new Set()) // Clear if no doctor selected
            setIsLoadingSchedule(false)
            return
        }

        let cancelled = false; // Flag to prevent state updates if component unmounts

        const fetchSchedule = async () => {
            setIsLoadingSchedule(true)
            try {
                // Get schedule for next 3 months
                const startDate = new Date(today)
                const endDate = new Date(today)
                endDate.setMonth(endDate.getMonth() + 3)

                const startDateStr = startDate.toISOString().split('T')[0]
                const endDateStr = endDate.toISOString().split('T')[0]

                const schedules = await doctorScheduleService.getScheduleByRange(
                    doctorId,
                    startDateStr,
                    endDateStr
                )

                // Only update state if component is still mounted and doctorId hasn't changed
                if (!cancelled) {
                    // Extract unique dates from schedules
                    const dates = new Set<string>()
                    schedules.forEach(schedule => {
                        if (schedule.date) {
                            dates.add(schedule.date.split('T')[0]) // Extract YYYY-MM-DD
                        }
                    })

                    setAvailableDates(dates)
                    setIsLoadingSchedule(false)
                }
            } catch (error) {
                console.error('Error fetching doctor schedule:', error)
                if (!cancelled) {
                    setAvailableDates(new Set()) // Clear on error
                    setIsLoadingSchedule(false)
                }
            }
        }

        fetchSchedule()

        // Cleanup function
        return () => {
            cancelled = true
        }
    }, [doctorId]) // Only depend on doctorId, not today

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

    // Check if a day is available (doctor has schedule)
    const isAvailableDate = (day: number) => {
        if (!doctorId) return true // If no doctor selected, show all dates
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        return availableDates.has(dateStr);
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
        if (doctorId && !isAvailableDate(day)) return; // Prevent selecting unavailable dates

        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(dateObj); // Update internal state

        // Format date as "YYYY-MM-DD" without timezone conversion
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dayStr = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

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
                        const available = doctorId ? isAvailableDate(day) : true;

                        return (
                            <button
                                key={day}
                                onClick={() => handleSelectDate(day)}
                                disabled={past || (doctorId && !available)} // Disable past dates and unavailable dates
                                className={`aspect-square rounded-lg font-semibold transition-all relative
                                ${selected
                                        ? "bg-secondary text-white shadow-lg" // Selected style
                                        : past || (doctorId && !available)
                                            ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed" // Past/unavailable date style
                                            : "border-2 border-border text-foreground hover:border-secondary hover:bg-secondary/10" // Default style
                                    }
                                ${todayMark && !selected && !past && available ? "border-primary text-primary" : ""} // Today's style (if not selected/past/unavailable)
                              `}
                            >
                                {day}
                                {/* Dot indicator for today */}
                                {todayMark && available && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"></span>}
                            </button>
                        )
                    })}
                </div>
            </div>

            {isLoadingSchedule && doctorId && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải lịch làm việc của bác sĩ...</span>
                </div>
            )}
            {doctorId && availableDates.size === 0 && !isLoadingSchedule && (
                <p className="text-center text-sm text-red-500">Bác sĩ này chưa có lịch làm việc trong thời gian tới.</p>
            )}

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