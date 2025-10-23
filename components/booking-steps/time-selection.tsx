// components/booking-steps/time-selection.tsx
// (This version is correct)

"use client"

import { useState } from "react"

interface TimeSelectionProps {
    onSelect: (time: string) => void // Expects HH:MM output
    onChangeService?: () => void
}

// Static time slots (could be fetched from API if needed)
const timeSlots = {
    morning: ["09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00"],
    afternoon: [
        "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00",
        "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00",
        "18:00 - 19:00",
    ],
}

export function TimeSelection({ onSelect, onChangeService }: TimeSelectionProps) {
    // Stores the full time slot string (e.g., "09:00 - 10:00") for highlighting
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Handler when a time slot button is clicked
    const handleSelectTime = (timeSlot: string) => { // e.g., "09:00 - 10:00"
        setSelectedTime(timeSlot) // Update state for highlighting

        // Extract the start time (HH:MM)
        const startTime = timeSlot.split(' - ')[0]; // e.g., "09:00"
        onSelect(startTime) // Call parent's onSelect with just the start time
    }

    return (
        <div className="space-y-8">
            {/* Morning Slots */}
            <div>
                <h3 className="mb-4 text-xl font-bold text-foreground">Buổi sáng</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                    {timeSlots.morning.map((time) => (
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

            {/* Afternoon Slots */}
            <div>
                <h3 className="mb-4 text-xl font-bold text-foreground">Buổi chiều</h3>
                <div className="grid gap-3 sm:grid-cols-4">
                    {timeSlots.afternoon.map((time) => (
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