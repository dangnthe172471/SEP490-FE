// components/booking-modal.tsx
// (This version is correct and aligns with the others)

"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { ServiceSelection } from "./booking-steps/service-selection"
import { DateSelection } from "./booking-steps/date-selection"
import { TimeSelection } from "./booking-steps/time-selection"

// Import types from the shared file
import {
    BookingData,
    DoctorInfoDto,
    PagedResponse
} from "@/lib/types/appointment"

// Define props using imported types
interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete: (data: BookingData) => void // Uses imported BookingData
    getDoctors: (page?: number, size?: number, term?: string) => Promise<PagedResponse<DoctorInfoDto>> // Prop to pass API function
}

// Internal state structure
interface InternalBookingState {
    service?: string        // Specialty
    servicePrice?: string
    doctorName?: string
    doctorId?: number
    date?: string           // YYYY-MM-DD
    time?: string           // HH:MM
}

export function BookingModal({ isOpen, onClose, onComplete, getDoctors }: BookingModalProps) {
    const [step, setStep] = useState(1)
    const [bookingData, setBookingData] = useState<InternalBookingState>({})

    if (!isOpen) return null

    // Called by ServiceSelection when a doctor is chosen
    const handleServiceSelect = (service: string, price: string, doctorName: string, doctorId: number) => {
        setBookingData((prev) => ({
            ...prev,
            service,        // Specialty
            servicePrice: price,
            doctorName,     // Doctor's Name
            doctorId        // Doctor's ID
        }))
        setStep(2) // Move to date selection
    }

    // Called by DateSelection
    const handleDateSelect = (date: string) => { // date is YYYY-MM-DD
        setBookingData((prev) => ({ ...prev, date }))
        setStep(3) // Move to time selection
    }

    // Called by TimeSelection
    const handleTimeSelect = (time: string) => { // time is HH:MM
        setBookingData((prev) => ({ ...prev, time }))
        // Time is the last step, but completion is handled by the button
    }

    // Called when the "Hoàn thành" button is clicked
    const handleComplete = () => {
        // Validate required data
        if (!bookingData.service || !bookingData.date || !bookingData.time || !bookingData.doctorId) {
            alert("Đã xảy ra lỗi, vui lòng chọn lại.");
            console.error("Dữ liệu đặt lịch bị thiếu:", bookingData);
            return;
        }

        // Map internal state to the external BookingData format
        const finalData: BookingData = {
            service: `${bookingData.service} - ${bookingData.doctorName}`, // Combine specialty and name for display
            date: bookingData.date,     // YYYY-MM-DD
            time: bookingData.time,     // HH:MM
            doctorId: bookingData.doctorId
        };

        // Pass the final data back to the page
        onComplete(finalData);

        // Close and reset the modal
        handleClose();
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    // Logic for the "Tiếp theo" button
    const handleNext = () => {
        if (step === 1 && bookingData.doctorId) { // Check if doctorId is selected
            setStep(2)
        } else if (step === 2 && bookingData.date) { // Check if date is selected
            setStep(3)
        }
    }

    // Close button action
    const handleClose = () => {
        setStep(1)          // Reset step
        setBookingData({})  // Clear selected data
        onClose()           // Call the onClose prop
    }

    // Link to go back to step 1
    const handleChangeService = () => {
        setStep(1)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-white shrink-0">
                    <div className="flex items-center gap-4">
                        {step > 1 && (
                            <button onClick={handleBack} className="rounded-lg hover:bg-white/20 p-2 transition-colors">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold">
                                {step === 1 && "Chọn bác sĩ & Dịch vụ"}
                                {step === 2 && "Chọn ngày khám"}
                                {step === 3 && "Chọn giờ khám"}
                            </h2>
                            {/* Display selected doctor and specialty in header for steps 2 & 3 */}
                            {step > 1 && bookingData.doctorName && (
                                <p className="text-sm text-white/80 mt-1">
                                    {bookingData.doctorName}
                                    {bookingData.service && ` - ${bookingData.service}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={handleClose} className="rounded-lg hover:bg-white/20 p-2 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content Area for Steps */}
                <div className="overflow-y-auto flex-1 p-8">
                    {/* Pass getDoctors function to ServiceSelection */}
                    {step === 1 && (
                        <ServiceSelection
                            onSelect={handleServiceSelect}
                            getDoctors={getDoctors} // Pass the function down
                        />
                    )}
                    {/* DateSelection receives YYYY-MM-DD */}
                    {step === 2 && <DateSelection onSelect={handleDateSelect} onChangeService={handleChangeService} />}
                    {/* TimeSelection receives HH:MM */}
                    {step === 3 && <TimeSelection onSelect={handleTimeSelect} onChangeService={handleChangeService} />}
                </div>

                {/* Footer with Progress Bar and Buttons */}
                <div className="border-t border-border bg-muted/30 px-8 py-6 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        {/* Progress dots */}
                        <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`h-2 w-8 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Bước {step} / 3</span>
                    </div>

                    <div className="flex gap-3 justify-end">
                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Quay lại
                        </button>
                        {/* Next/Complete Button */}
                        <button
                            onClick={step === 3 ? handleComplete : handleNext} // Calls handleComplete on last step
                            disabled={
                                // Disable conditions based on current step and selected data
                                (step === 1 && !bookingData.doctorId) || // Step 1 needs doctorId
                                (step === 2 && !bookingData.date) ||    // Step 2 needs date
                                (step === 3 && !bookingData.time)     // Step 3 needs time
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {step === 3 ? "Hoàn thành" : "Tiếp theo"}
                            {step !== 3 && <ChevronRight className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}