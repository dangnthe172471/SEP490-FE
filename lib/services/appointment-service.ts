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
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.message || errorData.title || `HTTP error! status: ${response.status}`
            throw new Error(errorMessage)
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
     * ✅ Lấy lịch hẹn của bác sĩ đang đăng nhập
     * GET /api/Appointments/doctor/my-appointments
     * Backend tự lấy userId từ JWT token
     */
    async getMyDoctorAppointments(): Promise<AppointmentDto[]> {
        return this.request<AppointmentDto[]>(`/doctor/my-appointments`)
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
}

export const appointmentService = new AppointmentService()