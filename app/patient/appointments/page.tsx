"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, User, Stethoscope, Phone, Mail, MapPin, CheckCircle, XCircle, AlertCircle, X } from "lucide-react"
import { appointmentService } from "@/lib/services/appointment-service"
import { AppointmentDto } from "@/lib/types/appointment"
import { Button } from "@/components/ui/button"
import { CancelAppointmentModal } from "@/components/cancel-appointment-modal"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PatientAppointmentsPage() {
    const router = useRouter()
    const [appointments, setAppointments] = useState<AppointmentDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')
    const [cancelModal, setCancelModal] = useState<{
        isOpen: boolean
        appointment: AppointmentDto | null
    }>({ isOpen: false, appointment: null })

    useEffect(() => {
        loadAppointments()
    }, [])

    const loadAppointments = async () => {
        try {
            setLoading(true)
            setError(null)

            const data = await appointmentService.getMyAppointments()
            setAppointments(data)
        } catch (err: any) {
            console.error('Error loading appointments:', err)
            setError(err.message || 'Có lỗi xảy ra khi tải lịch hẹn')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Chờ xử lý
                    </span>
                )
            case 'Confirmed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Đã xác nhận
                    </span>
                )
            case 'Completed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Hoàn thành
                    </span>
                )
            case 'Cancelled':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Đã hủy
                    </span>
                )
            case 'No-Show':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Không đến
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {status || 'Không xác định'}
                    </span>
                )
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

    const filteredAppointments = appointments
        .filter(appointment => {
            switch (filter) {
                case 'upcoming':
                    return appointment.status === 'Pending' || appointment.status === 'Confirmed'
                case 'completed':
                    return appointment.status === 'Completed'
                case 'cancelled':
                    return appointment.status === 'Cancelled'
                default:
                    return true
            }
        })
        .sort((a, b) => {
            // Sort by appointmentDate descending (newest first)
            const dateA = new Date(a.appointmentDate).getTime()
            const dateB = new Date(b.appointmentDate).getTime()
            return dateB - dateA // Descending order (newest first)
        })

    const handleCancel = (appointment: AppointmentDto) => {
        setCancelModal({ isOpen: true, appointment })
    }

    const handleCancelSuccess = () => {
        loadAppointments() // Reload appointments
    }

    const canCancel = (appointment: AppointmentDto) => {
        const status = appointment.status
        // Backend valid statuses: "Pending", "Confirmed", "Completed", "Cancelled", "No-Show"
        // Note: Actual 4-hour rule check is done in CancelAppointmentModal
        return status === 'Pending' || status === 'Confirmed'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center">
                            <XCircle className="h-5 w-5 text-red-400 mr-2" />
                            <h3 className="text-lg font-medium text-red-800">Lỗi tải dữ liệu</h3>
                        </div>
                        <p className="mt-2 text-red-700">{error}</p>
                        <button
                            onClick={loadAppointments}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Lịch hẹn của tôi</h1>
                            <p className="mt-2 text-gray-600">Quản lý và theo dõi các lịch hẹn khám bệnh</p>
                        </div>
                        <button
                            onClick={() => router.push('/lien-he')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            Đặt lịch mới
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { key: 'all', label: 'Tất cả', count: appointments.length },
                                { key: 'upcoming', label: 'Sắp tới', count: appointments.filter(a => a.status?.toLowerCase() === 'booked' || a.status?.toLowerCase() === 'scheduled').length },
                                { key: 'completed', label: 'Hoàn thành', count: appointments.filter(a => a.status?.toLowerCase() === 'completed').length },
                                { key: 'cancelled', label: 'Đã hủy', count: appointments.filter(a => a.status?.toLowerCase() === 'cancelled').length }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as any)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${filter === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Appointments List */}
                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lịch hẹn</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filter === 'all'
                                ? 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch khám để bắt đầu.'
                                : `Không có lịch hẹn ${filter === 'upcoming' ? 'sắp tới' : filter === 'completed' ? 'đã hoàn thành' : 'đã hủy'}.`
                            }
                        </p>
                        {filter === 'all' && (
                            <div className="mt-6">
                                <button
                                    onClick={() => router.push('/lien-he')}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Đặt lịch khám
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredAppointments.map((appointment) => {
                            const { date, time } = formatDateTime(appointment.appointmentDate)

                            return (
                                <div key={appointment.appointmentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Lịch hẹn #{appointment.appointmentId}
                                                </h3>
                                                {getStatusBadge(appointment.status || '')}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Doctor Info */}
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <Stethoscope className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Bác sĩ</h4>
                                                        <p className="text-sm text-gray-600">{appointment.doctorName || 'Chưa xác định'}</p>
                                                        <p className="text-xs text-gray-500">{appointment.doctorSpecialty || 'Chưa xác định'}</p>
                                                    </div>
                                                </div>

                                                {/* Date & Time */}
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                            <Calendar className="w-5 h-5 text-green-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">Thời gian</h4>
                                                        <p className="text-sm text-gray-600">{date}</p>
                                                        <p className="text-xs text-gray-500">{time}</p>
                                                    </div>
                                                </div>

                                                {/* Reason */}
                                                {appointment.reasonForVisit && (
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                                <User className="w-5 h-5 text-yellow-600" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">Lý do khám</h4>
                                                            <p className="text-sm text-gray-600">{appointment.reasonForVisit}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                                <div className="flex space-x-3">
                                                    {canCancel(appointment) && (
                                                        <Button
                                                            onClick={() => handleCancel(appointment)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
                                                        >
                                                            <X className="w-4 h-4 mr-2" />
                                                            Hủy lịch
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => router.push('/lien-he')}
                                                        size="sm"
                                                        className="flex items-center"
                                                    >
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        Đặt lịch mới
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Cancel Modal */}
                {cancelModal.appointment && (
                    <CancelAppointmentModal
                        isOpen={cancelModal.isOpen}
                        onClose={() => setCancelModal({ isOpen: false, appointment: null })}
                        appointment={cancelModal.appointment}
                        onSuccess={handleCancelSuccess}
                    />
                )}
            </div>
            <Footer />
        </div>
    )
}
