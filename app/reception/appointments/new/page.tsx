"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, UserPlus, Activity, ArrowLeft, Save, Loader2, AlertCircle, FileText, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { DoctorInfoDto, AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"
import { toast } from "react-hot-toast"
import { PatientSearch } from "@/components/patient-search"

const navigation = [
    { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/reception/records", icon: FileText },
  { name: "Chat hỗ trợ", href: "/reception/chat", icon: MessageCircle },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
]

export default function NewAppointmentPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [doctors, setDoctors] = useState<DoctorInfoDto[]>([])
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '17:00', // Set default time to 5:00 PM
        reasonForVisit: '',
        notes: ''
    })

    useEffect(() => {
        const currentUser = getCurrentUser()
        setUser(currentUser)
    }, [])

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setIsLoadingDoctors(true)
                setError(null)
                const response = await appointmentService.getPagedDoctors(1, 100)
                setDoctors(response.data)
            } catch (err: any) {
                console.error('❌ [ERROR] Failed to fetch doctors:', err)
                setError(err.message || 'Không thể tải danh sách bác sĩ')
            } finally {
                setIsLoadingDoctors(false)
            }
        }

        fetchDoctors()
    }, [])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handlePatientSelect = (patientId: string, patientName: string) => {
        setFormData(prev => ({
            ...prev,
            patientId,
            patientName
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Validate form
            if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc')
            }

            // Combine date and time (fix timezone issue)
            // Create Date object safely with proper validation
            // Check if formData.appointmentTime already has seconds, if not add them
            let timeString = formData.appointmentTime
            if (!timeString.includes(':00') || timeString.split(':').length === 2) {
                timeString = `${formData.appointmentTime}:00` // Add seconds if not present
            }
            const dateTimeString = `${formData.appointmentDate}T${timeString}`

            // Create Date object in local timezone (no UTC conversion)
            const appointmentDate = new Date(dateTimeString)

            // Validate the date is valid
            if (isNaN(appointmentDate.getTime())) {
                throw new Error(`Thời gian không hợp lệ: ${dateTimeString}. Vui lòng chọn lại.`)
            }

            // Send local time string to backend (not ISO UTC)
            const appointmentDateStr = dateTimeString

            console.log('📅 Date/Time Debug:', {
                selectedDate: formData.appointmentDate,
                selectedTime: formData.appointmentTime,
                timeLength: formData.appointmentTime.length,
                timeFormat: formData.appointmentTime.includes(':') ? 'HH:MM' : 'other',
                dateTimeString: dateTimeString,
                appointmentDate: appointmentDate,
                appointmentDateStr: appointmentDateStr,
                isValid: !isNaN(appointmentDate.getTime()),
                note: 'Converted to ISO string for backend DateTime parsing'
            })

            // Create appointment request
            const requestData = {
                patientId: parseInt(formData.patientId),
                doctorId: parseInt(formData.doctorId),
                appointmentDate: appointmentDateStr,
                reasonForVisit: formData.reasonForVisit || 'Khám bệnh'
            }

            console.log('📤 Creating appointment:', requestData)

            // Call API to create appointment
            const result = await appointmentService.createByReceptionist(requestData)

            console.log('✅ Appointment created:', result)

            toast.success('Tạo lịch hẹn thành công!', {
                duration: 3000,
                icon: '✅'
            })

            // Redirect to appointments list
            router.push('/reception/appointments')

        } catch (err: any) {
            console.error('❌ [ERROR] Failed to create appointment:', err)
            const errorMsg = err.message || 'Không thể tạo lịch hẹn'
            setError(errorMsg)
            toast.error(errorMsg, { duration: 5000 })
        } finally {
            setIsLoading(false)
        }
    }

    // Kiểm tra authentication
    if (!user) {
        return (
            <DashboardLayout navigation={navigation}>
                <div className="flex items-center justify-center py-8">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 text-center">
                            <div className="text-red-500 mb-4">
                                <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Cần đăng nhập</h2>
                            <p className="text-muted-foreground">
                                Vui lòng đăng nhập với tài khoản Lễ tân để truy cập trang này.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    if (user.role !== 'reception') {
        return (
            <DashboardLayout navigation={navigation}>
                <div className="flex items-center justify-center py-8">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 text-center">
                            <div className="text-orange-500 mb-4">
                                <Users className="h-12 w-12 mx-auto" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
                            <p className="text-muted-foreground">
                                Chỉ tài khoản Lễ tân mới có thể truy cập trang này.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tạo lịch hẹn mới</h1>
                        <p className="text-muted-foreground">Đặt lịch hẹn cho bệnh nhân</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin lịch hẹn</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Patient Search */}
                                <div className="space-y-2">
                                    <PatientSearch
                                        value={formData.patientId}
                                        onChange={handlePatientSelect}
                                        placeholder="Tìm kiếm bệnh nhân theo tên, ID, SĐT..."
                                        label="Bệnh nhân"
                                        required
                                    />
                                </div>

                                {/* Doctor Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="doctorId">Bác sĩ *</Label>
                                    {isLoadingDoctors ? (
                                        <div className="flex items-center gap-2 p-3 border rounded-md">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">Đang tải danh sách bác sĩ...</span>
                                        </div>
                                    ) : (
                                        <Select value={formData.doctorId} onValueChange={(value) => handleInputChange('doctorId', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn bác sĩ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctors.map((doctor) => (
                                                    <SelectItem key={doctor.doctorId} value={doctor.doctorId.toString()}>
                                                        {doctor.fullName} - {doctor.specialty}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* Appointment Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="appointmentDate">Ngày khám *</Label>
                                    <Input
                                        id="appointmentDate"
                                        type="date"
                                        value={formData.appointmentDate}
                                        onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Appointment Time */}
                                <div className="space-y-2">
                                    <Label htmlFor="appointmentTime">Giờ khám *</Label>
                                    <Input
                                        id="appointmentTime"
                                        type="time"
                                        value={formData.appointmentTime}
                                        onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Reason for Visit */}
                            <div className="space-y-2">
                                <Label htmlFor="reasonForVisit">Lý do khám</Label>
                                <Textarea
                                    id="reasonForVisit"
                                    value={formData.reasonForVisit}
                                    onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                                    placeholder="Nhập lý do khám bệnh"
                                    rows={3}
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Nhập ghi chú thêm (nếu có)"
                                    rows={2}
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Tạo lịch hẹn
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
