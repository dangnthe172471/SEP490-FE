"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { ServiceSelection } from "./booking-steps/service-selection"
import { DateSelection } from "./booking-steps/date-selection"
import { TimeSelection } from "./booking-steps/time-selection"

export interface BookingData {
    service?: string
    servicePrice?: string
    doctor?: string
    date?: string
    time?: string
}

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete: (data: BookingData) => void
}

export function BookingModal({ isOpen, onClose, onComplete }: BookingModalProps) {
    const [step, setStep] = useState(1)
    const [bookingData, setBookingData] = useState<BookingData>({})

    if (!isOpen) return null

    const handleServiceSelect = (service: string, price: string, doctor: string) => {
        setBookingData((prev) => ({ ...prev, service, servicePrice: price, doctor }))
        setStep(2)
    }

    const handleDateSelect = (date: string) => {
        setBookingData((prev) => ({ ...prev, date }))
        setStep(3)
    }

    const handleTimeSelect = (time: string) => {
        const finalData = { ...bookingData, time }
        setBookingData(finalData)
        onComplete(finalData)
        onClose()
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleNext = () => {
        if (step === 1 && bookingData.service && bookingData.doctor) {
            setStep(2)
        } else if (step === 2 && bookingData.date) {
            setStep(3)
        }
    }

    const handleClose = () => {
        setStep(1)
        setBookingData({})
        onClose()
    }

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
                                {step === 1 && "Chọn dịch vụ"}
                                {step === 2 && "Chọn ngày khám"}
                                {step === 3 && "Chọn giờ khám"}
                            </h2>
                            {step > 1 && bookingData.service && (
                                <p className="text-sm text-white/80 mt-1">
                                    {bookingData.service}
                                    {bookingData.doctor && ` - ${bookingData.doctor}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={handleClose} className="rounded-lg hover:bg-white/20 p-2 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-8">
                    {step === 1 && <ServiceSelection onSelect={handleServiceSelect} />}
                    {step === 2 && <DateSelection onSelect={handleDateSelect} onChangeService={handleChangeService} />}
                    {step === 3 && <TimeSelection onSelect={handleTimeSelect} onChangeService={handleChangeService} />}
                </div>

                {/* Footer with progress and navigation */}
                <div className="border-t border-border bg-muted/30 px-8 py-6 shrink-0">
                    <div className="flex items-center justify-between mb-4">
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
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Quay lại
                        </button>
                        <button
                            onClick={step === 3 ? () => handleTimeSelect(bookingData.time || "") : handleNext}
                            disabled={
                                (step === 1 && (!bookingData.service || !bookingData.doctor)) || (step === 2 && !bookingData.date)
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
