"use client"

import { useState } from "react"
import { X, AlertTriangle, Calendar, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { appointmentService } from "@/lib/services/appointment-service"
import { AppointmentDto } from "@/lib/types/appointment"
import { toast } from "sonner"

interface CancelAppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    appointment: AppointmentDto
    onSuccess: () => void
    skipFourHourCheck?: boolean // Use 24-hour validation instead of 4-hour (for reception use)
}

export function CancelAppointmentModal({
    isOpen,
    onClose,
    appointment,
    onSuccess,
    skipFourHourCheck = false
}: CancelAppointmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    // Helper function to check if appointment can be cancelled based on time
    const checkCancelEligibility = (): { canCancel: boolean; message?: string } => {
        const appointmentDate = new Date(appointment.appointmentDate)
        const now = new Date()
        const diffMs = appointmentDate.getTime() - now.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        if (skipFourHourCheck) {
            // Reception mode: 24-hour rule
            if (diffHours < 4) {
                return {
                    canCancel: false,
                    message: 'Không thể hủy lịch hẹn. Lễ tân chỉ có thể hủy trước tối thiểu 4 giờ so với giờ hẹn.'
                }
            }
        } else {
            // Patient mode: 4-hour rule
            if (diffHours < 4) {
                return {
                    canCancel: false,
                    message: 'Không thể hủy lịch hẹn. Bạn chỉ có thể hủy trước tối thiểu 4 giờ so với giờ hẹn. Vui lòng liên hệ trực tiếp với phòng khám để được hỗ trợ.'
                }
            }
        }

        return { canCancel: true }
    }

    const handleCancel = async () => {
        setIsLoading(true)
        setError(null)

        try {
            console.log('📤 Cancelling appointment:', appointment.appointmentId)

            // Kiểm tra xem có thể hủy không trước khi thực hiện
            const eligibility = checkCancelEligibility()
            if (!eligibility.canCancel) {
                throw new Error(eligibility.message || 'Không thể hủy lịch hẹn.')
            }

            // Call API
            await appointmentService.cancelAppointment(appointment.appointmentId)

            toast.success('Hủy lịch hẹn thành công!')
            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Error cancelling appointment:', err)
            setError(err.message || 'Có lỗi xảy ra khi hủy lịch hẹn')
            toast.error(err.message || 'Có lỗi xảy ra khi hủy lịch hẹn')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDateTime = (dateTimeStr: string) => {
        try {
            const date = new Date(dateTimeStr)
            return {
                date: date.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: date.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }
        } catch (error) {
            return {
                date: 'Ngày không hợp lệ',
                time: 'Giờ không hợp lệ'
            }
        }
    }

    const { date, time } = formatDateTime(appointment.appointmentDate)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                        <h2 className="text-xl font-semibold text-gray-900">Hủy lịch hẹn</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                            <div>
                                <h3 className="font-medium text-red-800">Xác nhận hủy lịch hẹn</h3>
                                <p className="text-sm text-red-700 mt-1">
                                    Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Thông tin lịch hẹn</h3>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Ngày khám</p>
                                    <p className="text-sm text-gray-600">{date}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Giờ khám</p>
                                    <p className="text-sm text-gray-600">{time}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Bác sĩ</p>
                                    <p className="text-sm text-gray-600">{appointment.doctorName}</p>
                                </div>
                            </div>
                            {appointment.reasonForVisit && (
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Lý do khám</p>
                                    <p className="text-sm text-gray-600">{appointment.reasonForVisit}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Không hủy
                        </Button>
                        <Button
                            onClick={handleCancel}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
