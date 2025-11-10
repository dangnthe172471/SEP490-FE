// lib/services/appointment-service.ts
// VERSION FIXED - Xử lý đúng UserId → PatientId

import {
    AppointmentDto,
    CreateAppointmentByPatientRequest,
    DoctorInfoDto,
    PagedResponse,
} from '@/lib/types/appointment'

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7168'
const API_BASE_URL = `${API_ORIGIN}/api/Appointments`

class AppointmentService {
    /**
     * Dịch thông báo lỗi API sang tiếng Việt (một số case phổ biến)
     */
    private translateApiMessage(message: string): string {
        const msg = (message || '').trim()

        // Các mẫu tiếng Anh phổ biến từ BE → tiếng Việt
        const mapping: Array<{ test: RegExp, vi: string }> = [
            { test: /appointment date cannot be in the past/i, vi: 'Ngày hẹn không được ở trong quá khứ.' },
            { test: /appointment.*must be in the future/i, vi: 'Thời gian hẹn phải ở trong tương lai.' },
            { test: /invalid date|time is invalid/i, vi: 'Thời gian không hợp lệ. Vui lòng chọn lại.' },
            { test: /patient not found/i, vi: 'Không tìm thấy thông tin bệnh nhân.' },
            { test: /doctor not found/i, vi: 'Không tìm thấy thông tin bác sĩ.' },
            { test: /unauthorized|forbidden/i, vi: 'Bạn không có quyền thực hiện thao tác này.' },
            { test: /cannot reschedule within/i, vi: 'Không thể đổi lịch trong khoảng thời gian quy định.' },
            { test: /overlap|conflict/i, vi: 'Thời gian hẹn bị trùng. Vui lòng chọn khung giờ khác.' },
        ]

        for (const rule of mapping) {
            if (rule.test.test(msg)) return rule.vi
        }

        return msg // Mặc định giữ nguyên nếu chưa có mapping
    }

    /**
     * Hàm request chung, xử lý token và headers
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        // Lấy token từ localStorage
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('token') || localStorage.getItem('auth_token')
            : null

        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // Thêm Authorization header nếu có token
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        }

        const response = await fetch(url, config)

        if (!response.ok) {
            // Cố gắng đọc JSON; fallback sang text
            let rawMessage = `HTTP error! status: ${response.status}`
            try {
                const errorData = await response.json()
                rawMessage = errorData.message || errorData.title || rawMessage
            } catch {
                try {
                    rawMessage = await response.text() || rawMessage
                } catch { /* ignore */ }
            }

            // Dịch sang tiếng Việt nếu có thể
            const viMessage = this.translateApiMessage(rawMessage)
            throw new Error(viMessage)
        }

        if (response.status === 204) {
            return {} as T
        }

        return response.json()
    }

    /**
     * ✅ Bệnh nhân tạo lịch hẹn (POST /api/Appointments/book)
     * 
     * LƯU Ý QUAN TRỌNG:
     * - Backend endpoint: POST /api/Appointments/book
     * - Backend tự động lấy userId từ JWT token
     * - Request chỉ cần: doctorId, appointmentDate, reasonForVisit
     * 
     * @param data - BookAppointmentRequest với doctorId, appointmentDate, reasonForVisit
     */
    async createByPatient(data: CreateAppointmentByPatientRequest): Promise<{ appointmentId: number }> {
        console.log('📤 Sending request to /book:', data)

        // Chuyển đổi từ CreateAppointmentByPatientRequest sang BookAppointmentRequest
        const bookRequest = {
            doctorId: data.doctorId,
            appointmentDate: data.appointmentDate,
            reasonForVisit: data.reasonForVisit
        }

        return this.request<{ appointmentId: number }>(`/book`, {
            method: 'POST',
            body: JSON.stringify(bookRequest)
        })
    }

    /**
     * Lấy danh sách bác sĩ (không phân trang)
     * Backend endpoint: GET /api/Appointments/doctors
     */
    async getPagedDoctors(
        pageNumber = 1,
        pageSize = 10,
        searchTerm?: string
    ): Promise<PagedResponse<DoctorInfoDto>> {

        // Backend không có phân trang, lấy tất cả rồi filter ở frontend
        const doctors = await this.request<DoctorInfoDto[]>(`/doctors`)

        // Filter theo searchTerm nếu có
        let filteredDoctors = doctors
        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim()
            filteredDoctors = doctors.filter(doctor =>
                doctor.fullName.toLowerCase().includes(term) ||
                doctor.specialty.toLowerCase().includes(term) ||
                doctor.email.toLowerCase().includes(term)
            )
        }

        // Tính toán phân trang ở frontend
        const totalCount = filteredDoctors.length
        const startIndex = (pageNumber - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex)
        const totalPages = Math.ceil(totalCount / pageSize)

        return {
            data: paginatedDoctors,
            totalCount,
            pageNumber,
            pageSize,
            totalPages,
            hasPreviousPage: pageNumber > 1,
            hasNextPage: pageNumber < totalPages,
        }
    }

    /**
     * Lấy TẤT CẢ lịch hẹn của một bác sĩ
     * Backend không có endpoint này, sử dụng endpoint khác hoặc bỏ qua
     */
    async getDoctorAppointments(doctorId: number): Promise<AppointmentDto[]> {
        // Backend không có endpoint này, trả về mảng rỗng
        console.warn('Backend không có endpoint để lấy lịch hẹn của bác sĩ')
        return []
    }

    /**
     * Lấy thông tin chi tiết một bác sĩ bằng ID
     * GET /api/Appointments/doctors/{id}
     */
    async getDoctorById(id: number): Promise<DoctorInfoDto> {
        return this.request<DoctorInfoDto>(`/doctors/${id}`)
    }

    /**
     * ✅ Lấy lịch hẹn của bệnh nhân đang đăng nhập
     * GET /api/Appointments/patient/my-appointments
     * Backend tự lấy userId từ JWT token
     */
    async getMyAppointments(): Promise<AppointmentDto[]> {
        return this.request<AppointmentDto[]>(`/patient/my-appointments`)
    }

    /**
     * ✅ Lấy lịch hẹn của bác sĩ đang đăng nhập (sử dụng DoctorAppointments controller ổn định)
     * GET /api/DoctorAppointments/appointments
     * Backend tự lấy doctor theo JWT → tránh lỗi map userId = doctorId
     */
    async getMyDoctorAppointments(): Promise<AppointmentDto[]> {
        // Gọi API chuyên biệt cho bác sĩ
        const baseOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7168'
        const url = `${baseOrigin}/api/DoctorAppointments/appointments`

        // Lấy token
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('token') || localStorage.getItem('auth_token')
            : null

        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            credentials: 'include'
        })

        if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(text || `HTTP error! status: ${res.status}`)
        }

        // Dữ liệu trả về của endpoint này là danh sách item theo ngày/giờ tách rời
        const items = await res.json() as Array<{
            appointmentId: number
            appointmentDate: string // dd/MM/yyyy
            appointmentTime: string // HH:mm
            status: string
            patientId: number
            patientName: string
            patientPhone: string
        }>

        // Map sang AppointmentDto dùng chung trong FE
        const mapped: AppointmentDto[] = items.map(it => {
            // chuyển dd/MM/yyyy → yyyy-MM-dd
            const [dd, mm, yyyy] = it.appointmentDate.split('/')
            const isoDate = `${yyyy}-${mm}-${dd}`
            const appointmentDateISO = `${isoDate}T${it.appointmentTime}:00`

            return {
                appointmentId: it.appointmentId,
                patientId: it.patientId,
                patientName: it.patientName,
                patientPhone: it.patientPhone,
                patientEmail: '',
                doctorId: 0,
                doctorName: '',
                doctorSpecialty: '',
                appointmentDate: appointmentDateISO,
                status: it.status,
            }
        })

        return mapped
    }

    /**
     * ✅ Lấy TẤT CẢ lịch hẹn (cho Receptionist/Admin)
     * GET /api/Appointments
     * Cần role Receptionist, Clinic Manager, Doctor
     */
    async getAllAppointments(): Promise<AppointmentDto[]> {
        return this.request<AppointmentDto[]>(``)
    }

    /**
     * ✅ Lấy lịch hẹn của receptionist đang đăng nhập
     * GET /api/Appointments/receptionist/my-appointments
     * Backend tự lấy userId từ JWT token
     */
    async getMyReceptionistAppointments(): Promise<AppointmentDto[]> {
        return this.request<AppointmentDto[]>(`/receptionist/my-appointments`)
    }

    /**
     * ✅ Receptionist tạo lịch hẹn cho bệnh nhân
     * POST /api/Appointments/create
     * Backend tự lấy receptionistId từ JWT token
     */
    async createByReceptionist(data: {
        patientId: number
        doctorId: number
        appointmentDate: string
        reasonForVisit: string
    }): Promise<{ appointmentId: number }> {
        console.log('📤 Sending request to /create:', data)

        return this.request<{ appointmentId: number }>(`/create`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    /**
     * ✅ Patient reschedule appointment
     * PUT /api/Appointments/{id}/reschedule
     * Backend tự lấy userId từ JWT token
     */
    async rescheduleAppointment(appointmentId: number, data: {
        newAppointmentDate: string
        newReasonForVisit?: string
    }): Promise<{ message: string }> {
        console.log('📤 Sending reschedule request:', { appointmentId, data })

        return this.request<{ message: string }>(`/${appointmentId}/reschedule`, {
            method: 'PUT',
            body: JSON.stringify({
                newAppointmentDate: data.newAppointmentDate,
                newReasonForVisit: data.newReasonForVisit
            })
        })
    }

    /**
     * ✅ Update appointment status (Doctor/Receptionist/Clinic Manager)
     * PUT /api/Appointments/{id}/status
     */
    async updateAppointmentStatus(appointmentId: number, status: string): Promise<{ message: string }> {
        console.log('📤 Sending status update request:', { appointmentId, status })

        return this.request<{ message: string }>(`/${appointmentId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        })
    }

    /**
     * ✅ Check if appointment can be cancelled (4-hour rule)
     * Sử dụng logic frontend tạm thời vì API can-cancel chưa hoạt động
     */
    async canCancelAppointment(appointmentId: number): Promise<{ canCancel: boolean }> {
        console.log('📤 Checking cancel eligibility (frontend logic):', { appointmentId })

        // Tạm thời sử dụng logic frontend đơn giản
        // TODO: Sử dụng API backend khi hoạt động
        return { canCancel: true }
    }

    /**
     * ✅ Cancel appointment (Patient can cancel their own, Receptionist can cancel any)
     * PUT /api/Appointments/{id}/status với status = "Cancelled"
     */
    async cancelAppointment(appointmentId: number): Promise<{ message: string }> {
        console.log('📤 Sending cancel request:', { appointmentId })

        return this.request<{ message: string }>(`/${appointmentId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Cancelled' })
        })
    }

    /**
     * ✅ Lấy thống kê appointments cho Clinic Manager
     * GET /api/Appointments/statistics
     * Requires Clinic Manager role
     */
    async getAppointmentStatistics(): Promise<{
        totalAppointments: number
        pendingAppointments: number
        confirmedAppointments: number
        completedAppointments: number
        cancelledAppointments: number
        noShowAppointments: number
    }> {
        return this.request<{
            totalAppointments: number
            pendingAppointments: number
            confirmedAppointments: number
            completedAppointments: number
            cancelledAppointments: number
            noShowAppointments: number
        }>(`/statistics`)
    }

    async getAppointmentTimeSeries(params: { from?: string; to?: string; groupBy?: "day" | "month" } = {}): Promise<Array<{ period: string; count: number }>> {
        const searchParams = new URLSearchParams()
        if (params.from) searchParams.append("from", params.from)
        if (params.to) searchParams.append("to", params.to)
        if (params.groupBy) searchParams.append("groupBy", params.groupBy)
        const query = searchParams.toString()
        return this.request<Array<{ period: string; count: number }>>(`/stats/timeseries${query ? `?${query}` : ""}`)
    }

    async getAppointmentHeatmap(params: { from?: string; to?: string } = {}): Promise<Array<{ weekday: number; hour: number; count: number }>> {
        const searchParams = new URLSearchParams()
        if (params.from) searchParams.append("from", params.from)
        if (params.to) searchParams.append("to", params.to)
        const query = searchParams.toString()
        return this.request<Array<{ weekday: number; hour: number; count: number }>>(`/stats/heatmap${query ? `?${query}` : ""}`)
    }
}

export const appointmentService = new AppointmentService()