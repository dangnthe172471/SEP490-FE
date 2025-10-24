// components/booking-steps/time-selection.tsx
// Updated to use real API data from shifts

"use client"

import { useState, useEffect } from "react"
import { shiftService, ShiftResponseDTO } from "@/lib/services/shift-service"
import { Loader2 } from "lucide-react"

interface TimeSelectionProps {
    onSelect: (time: string) => void // Expects HH:MM output
    onChangeService?: () => void
    doctorId?: number // Optional doctor ID to get specific shifts
    selectedDate?: string // Optional selected date
}

export function TimeSelection({ onSelect, onChangeService, doctorId, selectedDate }: TimeSelectionProps) {
    // Stores the full time slot string (e.g., "09:00 - 10:00") for highlighting
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // State for API data
    const [shifts, setShifts] = useState<ShiftResponseDTO[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch shifts when component mounts
    useEffect(() => {
        const fetchShifts = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const data = await shiftService.getAllShifts()
                setShifts(data)
                console.log('🕐 Fetched shifts:', data)
            } catch (err: any) {
                console.error('Error fetching shifts:', err)
                setError(err.message || 'Không thể tải danh sách ca làm việc')
            } finally {
                setIsLoading(false)
            }
        }
        fetchShifts()
    }, [doctorId, selectedDate]) // Re-fetch if doctor or date changes

    // Handler when a time slot button is clicked
    const handleSelectTime = (timeSlot: string) => { // e.g., "09:00 - 10:00"
        setSelectedTime(timeSlot) // Update state for highlighting

        // Extract the start time (HH:MM)
        const startTime = timeSlot.split(' - ')[0]; // e.g., "09:00"

        console.log('🕐 TimeSelection Debug:', {
            selectedTimeSlot: timeSlot,
            extractedStartTime: startTime,
            note: 'Extracting start time from time slot'
        });

        onSelect(startTime) // Call parent's onSelect with just the start time
    }

    // Group shifts by type (morning/afternoon/evening) based on shift type
    const groupShiftsByTime = (shifts: ShiftResponseDTO[]) => {
        const morning: string[] = []
        const afternoon: string[] = []
        const evening: string[] = []

        shifts.forEach(shift => {
            const timeSlot = `${shift.startTime} - ${shift.endTime}`

            // Group by shift type from database
            if (shift.shiftType === 'Sáng') {
                morning.push(timeSlot)
            } else if (shift.shiftType === 'Chiều') {
                afternoon.push(timeSlot)
            } else if (shift.shiftType === 'Tối') {
                evening.push(timeSlot)
            }
        })

        return { morning, afternoon, evening }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Đang tải ca làm việc...</p>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-primary hover:underline"
                >
                    Thử lại
                </button>
            </div>
        )
    }

    const { morning, afternoon, evening } = groupShiftsByTime(shifts)

    return (
        <div className="space-y-8">
            {/* Morning Slots */}
            {morning.length > 0 && (
                <div>
                    <h3 className="mb-4 text-xl font-bold text-foreground">Buổi sáng</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {morning.map((time) => (
                            <button
                                key={time}
                                onClick={() => handleSelectTime(time)}
                                className={`rounded-xl border-2 px-4 py-3 font-semibold transition-all ${selectedTime === time
                                    ? "border-secondary bg-secondary text-white shadow-lg" // Selected style
                                    : "border-secondary text-secondary hover:bg-secondary/10" // Default style
                                    }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Afternoon Slots */}
            {afternoon.length > 0 && (
                <div>
                    <h3 className="mb-4 text-xl font-bold text-foreground">Buổi chiều</h3>
                    <div className="grid gap-3 sm:grid-cols-4">
                        {afternoon.map((time) => (
                            <button
                                key={time}
                                onClick={() => handleSelectTime(time)}
                                className={`rounded-xl border-2 px-4 py-3 font-semibold transition-all ${selectedTime === time
                                    ? "border-secondary bg-secondary text-white shadow-lg" // Selected style
                                    : "border-secondary text-secondary hover:bg-secondary/10" // Default style
                                    }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Evening Slots */}
            {evening.length > 0 && (
                <div>
                    <h3 className="mb-4 text-xl font-bold text-foreground">Buổi tối</h3>
                    <div className="grid gap-3 sm:grid-cols-4">
                        {evening.map((time) => (
                            <button
                                key={time}
                                onClick={() => handleSelectTime(time)}
                                className={`rounded-xl border-2 px-4 py-3 font-semibold transition-all ${selectedTime === time
                                    ? "border-secondary bg-secondary text-white shadow-lg" // Selected style
                                    : "border-secondary text-secondary hover:bg-secondary/10" // Default style
                                    }`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* No shifts available */}
            {shifts.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Không có ca làm việc nào khả dụng.</p>
                </div>
            )}

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