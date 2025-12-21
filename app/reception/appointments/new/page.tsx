"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, UserPlus, Activity, ArrowLeft, Save, Loader2, AlertCircle, FileText, MessageCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useMemo, useState } from "react"
import { DoctorInfoDto, AppointmentDto } from "@/lib/types/appointment"
import { appointmentService } from "@/lib/services/appointment-service"
import { toast } from "react-hot-toast"
import { patientService, PatientInfoDto } from "@/lib/services/patient-service"
import { PatientSearch } from "@/components/patient-search"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"
import { shiftService, ShiftResponseDTO } from "@/lib/services/shift-service"

export default function NewAppointmentPage() {
    // Get reception navigation from centralized config
    const navigation = getReceptionNavigation()

    const router = useRouter()
    const searchParams = useSearchParams()
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [doctors, setDoctors] = useState<DoctorInfoDto[]>([])
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingPatient, setIsLoadingPatient] = useState(false)
    const [shifts, setShifts] = useState<ShiftResponseDTO[]>([])
    const [shiftsLoading, setShiftsLoading] = useState(true)

    const VIETNAM_TIME_SLOTS = useMemo(() => {
        const slots: { value: string; label: string }[] = []
        const formatter = new Intl.DateTimeFormat("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Ho_Chi_Minh",
        })
        for (let hour = 7; hour <= 21; hour++) {
            for (const minute of [0, 30]) {
                const value = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"}`
                const label = formatter.format(new Date(`2020-01-01T${value}:00+07:00`))
                slots.push({ value, label })
            }
        }
        return slots
    }, [])

    const today = useMemo(() => new Date().toISOString().split("T")[0], [])

    const [formData, setFormData] = useState({
        patientId: '',
        patientName: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '17:00', // Default 17:00 GMT+7
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

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                setShiftsLoading(true)
                const data = await shiftService.getAllShifts()
                // Sort shifts by start time
                const sorted = [...data].sort((a, b) => a.startTime.localeCompare(b.startTime))
                setShifts(sorted)
            } catch (err: any) {
                console.error('❌ [ERROR] Failed to fetch shifts:', err)
                setError(err.message || 'Không thể tải ca làm việc')
            } finally {
                setShiftsLoading(false)
            }
        }
        fetchShifts()
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

    // Load patient from URL query param
    useEffect(() => {
        const patientIdParam = searchParams.get('patientId')
        if (patientIdParam && !formData.patientId) {
            const loadPatient = async () => {
                try {
                    setIsLoadingPatient(true)
                    // patientId in URL is actually userId (from patients page)
                    const userId = parseInt(patientIdParam)
                    if (isNaN(userId)) {
                        console.error('Invalid patientId in URL:', patientIdParam)
                        return
                    }

                    // Load patient info by userId
                    const patientInfo = await patientService.getPatientByUserId(userId)

                    // Set patient in form
                    handlePatientSelect(patientInfo.patientId.toString(), patientInfo.fullName)
                } catch (err: any) {
                    console.error('❌ [ERROR] Failed to load patient from URL:', err)
                    toast.error('Không thể tải thông tin bệnh nhân từ URL')
                } finally {
                    setIsLoadingPatient(false)
                }
            }
            loadPatient()
        }
    }, [searchParams, formData.patientId])

    // Helper function to determine which shift a time belongs to
    const getShiftForTime = (time: string): ShiftResponseDTO | undefined => {
        const [h, m] = time.split(":")
        const aptMinutes = parseInt(h, 10) * 60 + parseInt(m ?? "0", 10)
        return shifts.find(s => {
            const [sh, sm] = s.startTime.split(":")
            const [eh, em] = s.endTime.split(":")
            const startMinutes = parseInt(sh, 10) * 60 + parseInt(sm ?? "0", 10)
            const endMinutes = parseInt(eh, 10) * 60 + parseInt(em ?? "0", 10)
            return aptMinutes >= startMinutes && aptMinutes < endMinutes
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Validate form
            if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
                const errorMsg = 'Vui lòng điền đầy đủ thông tin bắt buộc'
                setError(errorMsg)
                toast.error(errorMsg, { duration: 5000 })
                setIsLoading(false)
                return
            }

            // Validate shift: Check if patient already has an appointment in the selected shift on the selected date
            const selectedShift = getShiftForTime(formData.appointmentTime)
            if (!selectedShift) {
                const errorMsg = "Giờ khám không thuộc ca làm việc nào. Vui lòng chọn lại."
                setError(errorMsg)
                toast.error(errorMsg, { duration: 5000 })
                setIsLoading(false)
                return
            }

            // Fetch existing appointments for this patient on this date
            const existingAppointments = await appointmentService.getAllAppointments()
            const patientIdNum = parseInt(formData.patientId)
            const selectedDate = new Date(formData.appointmentDate).toISOString().split('T')[0] // YYYY-MM-DD

            const hasConflict = existingAppointments.some(apt => {
                // Check if same patient
                if (apt.patientId !== patientIdNum) return false

                // Check if same date
                const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0]
                if (aptDate !== selectedDate) return false

                // Check if appointment is not cancelled
                if (apt.status === 'Cancelled') return false

                // Check if same shift - extract time from appointmentDate
                const aptDateObj = new Date(apt.appointmentDate)
                // Get local time hours and minutes (avoid timezone issues)
                const aptHours = aptDateObj.getHours()
                const aptMinutes = aptDateObj.getMinutes()
                const aptTimeString = `${String(aptHours).padStart(2, '0')}:${String(aptMinutes).padStart(2, '0')}`
                const aptShift = getShiftForTime(aptTimeString)
                return aptShift?.shiftID === selectedShift.shiftID
            })

            if (hasConflict) {
                const errorMsg = `Bệnh nhân đã có lịch hẹn trong ca ${selectedShift.shiftType} vào ngày này. Mỗi bệnh nhân chỉ được đặt 1 lịch trong mỗi ca.`
                setError(errorMsg)
                toast.error(errorMsg, { duration: 5000 })
                setIsLoading(false)
                return
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
                const errorMsg = `Thời gian không hợp lệ: ${dateTimeString}. Vui lòng chọn lại.`
                setError(errorMsg)
                toast.error(errorMsg, { duration: 5000 })
                setIsLoading(false)
                return
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
                                        placeholder="Tìm kiếm bệnh nhân theo tên"
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
                                        min={today}
                                        required
                                    />
                                </div>

                                {/* Appointment Time */}
                                <div className="space-y-2">
                                    <Label htmlFor="appointmentTime">
                                        Giờ khám * <span className="text-xs text-muted-foreground">(GMT+7 - Việt Nam)</span>
                                    </Label>
                                    <Select value={formData.appointmentTime} onValueChange={(value) => handleInputChange('appointmentTime', value)}>
                                        <SelectTrigger id="appointmentTime">
                                            <SelectValue placeholder="Chọn giờ khám" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72">
                                            {VIETNAM_TIME_SLOTS.map((slot) => (
                                                <SelectItem key={slot.value} value={slot.value}>
                                                    {slot.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
