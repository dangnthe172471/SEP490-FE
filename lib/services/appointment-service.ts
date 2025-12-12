// lib/services/appointment-service.ts
// VERSION FIXED - Xử lý đúng UserId → PatientId

import {
    AppointmentDto,
    CreateAppointmentByPatientRequest,
    DoctorInfoDto,
    PagedResponse,
} from '@/lib/types/appointment'

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'https://api.https://api.diamondhealth.io.vn'
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
        } else {
            console.warn("⚠️ [appointment-service] No token found in localStorage")
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        }

        console.log(`🔵 [appointment-service] ${options.method || 'GET'} ${url}`)

        const response = await fetch(url, config)

        console.log(`🔵 [appointment-service] Response status: ${response.status} ${response.statusText}`)

        if (!response.ok) {
            // Clone response để có thể đọc body nhiều lần
            const responseClone = response.clone()
            let rawMessage = `HTTP error! status: ${response.status}`
            let errorData: any = null
            let responseText: string = ""

            try {
                responseText = await responseClone.text()

                if (responseText && responseText.trim()) {
                    try {
                        errorData = JSON.parse(responseText)
                        rawMessage = errorData.message || errorData.title || errorData.error || errorData.detail || rawMessage
                        console.error(`❌ [appointment-service] Error response (parsed):`, errorData)
                    } catch (parseError) {
                        rawMessage = responseText || rawMessage
                        console.error(`❌ [appointment-service] Failed to parse error response as JSON:`, parseError)
                    }
                }
                // Empty response body is acceptable - use default error message
            } catch (readError) {
                console.error(`❌ [appointment-service] Failed to read error response:`, readError)
            }

            console.error(`❌ [appointment-service] Error response summary:`, {
                url: url,
                status: response.status,
                statusText: response.statusText,
                message: rawMessage,
                errorData: errorData,
                responseText: responseText.substring(0, 500) // Limit log size
            })

            // Xử lý các lỗi phổ biến
            if (response.status === 401) {
                throw new Error("Không được phép truy cập. Vui lòng đăng nhập lại.")
            }
            if (response.status === 403) {
                throw new Error("Không có quyền truy cập. Vui lòng kiểm tra role của tài khoản.")
            }
            if (response.status === 404) {
                throw new Error("Không tìm thấy endpoint. Vui lòng kiểm tra API URL.")
            }
            if (response.status >= 500) {
                // Thêm thông tin chi tiết hơn cho lỗi server
                const detailedMessage = errorData?.message || errorData?.title || errorData?.error || rawMessage
                throw new Error(`Lỗi server (${response.status}): ${detailedMessage || 'Vui lòng kiểm tra backend logs và thử lại sau.'}`)
            }

            // Dịch sang tiếng Việt nếu có thể
            const viMessage = this.translateApiMessage(rawMessage)
            throw new Error(viMessage)
        }

        if (response.status === 204) {
            return {} as T
        }

        try {
            const data = await response.json()
            return data
        } catch (error) {
            console.error("❌ [appointment-service] Failed to parse JSON response:", error)
            throw new Error("Không thể parse response từ server.")
        }
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
        try {
            // Backend không có phân trang, lấy tất cả rồi filter ở frontend
            const doctors = await this.request<DoctorInfoDto[]>(`/doctors`) || []

            // Filter theo searchTerm nếu có
            let filteredDoctors = doctors
            if (searchTerm && searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim()
                filteredDoctors = doctors.filter(doctor =>
                    doctor.fullName?.toLowerCase().includes(term) ||
                    doctor.specialty?.toLowerCase().includes(term) ||
                    doctor.email?.toLowerCase().includes(term)
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
        } catch (error: any) {
            // Nếu lỗi, trả về empty result thay vì throw
            console.error('❌ [appointment-service] Failed to get doctors:', error)
            return {
                data: [],
                totalCount: 0,
                pageNumber,
                pageSize,
                totalPages: 0,
                hasPreviousPage: false,
                hasNextPage: false,
            }
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
     * Lấy thông tin chi tiết một appointment bằng ID
     * GET /api/Appointments/{id}
     */
    async getById(appointmentId: number): Promise<AppointmentDto> {
        return this.request<AppointmentDto>(`/${appointmentId}`)
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
        const baseOrigin = process.env.NEXT_PUBLIC_API_URL || 'https://api.https://api.diamondhealth.io.vn'
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
        try {
            console.log("📊 [getAppointmentStatistics] Request: /statistics")
            const result = await this.request<{
                totalAppointments: number
                pendingAppointments: number
                confirmedAppointments: number
                completedAppointments: number
                cancelledAppointments: number
                noShowAppointments: number
            }>(`/statistics`)
            console.log("📊 [getAppointmentStatistics] Response:", result)
            return result
        } catch (error: any) {
            console.error("❌ [getAppointmentStatistics] Error:", error)
            // Check for authorization errors
            if (error?.message?.includes("401") || error?.message?.includes("403") || error?.message?.includes("Unauthorized") || error?.message?.includes("Forbidden")) {
                throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với role 'Clinic Manager'.")
            }
            throw error
        }
    }

    async getAppointmentTimeSeries(params: { from?: string; to?: string; groupBy?: "day" | "month" } = {}): Promise<Array<{ period: string; count: number }>> {
        try {
            const searchParams = new URLSearchParams()
            if (params.from) searchParams.append("from", params.from)
            if (params.to) searchParams.append("to", params.to)
            if (params.groupBy) searchParams.append("groupBy", params.groupBy)
            const query = searchParams.toString()
            const endpoint = `/stats/timeseries${query ? `?${query}` : ""}`
            console.log("📊 [getAppointmentTimeSeries] Request:", endpoint)
            const result = await this.request<Array<{ period: string; count: number }>>(endpoint)
            console.log("📊 [getAppointmentTimeSeries] Response:", result?.length ?? 0, "items")
            return result || []
        } catch (error: any) {
            console.error("❌ [getAppointmentTimeSeries] Error:", error)
            // Check for authorization errors
            if (error?.message?.includes("401") || error?.message?.includes("403") || error?.message?.includes("Unauthorized") || error?.message?.includes("Forbidden")) {
                throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với role 'Clinic Manager'.")
            }
            throw error
        }
    }

    async getAppointmentHeatmap(params: { from?: string; to?: string } = {}): Promise<Array<{ weekday: number; hour: number; count: number }>> {
        try {
            const searchParams = new URLSearchParams()
            if (params.from) searchParams.append("from", params.from)
            if (params.to) searchParams.append("to", params.to)
            const query = searchParams.toString()
            const endpoint = `/stats/heatmap${query ? `?${query}` : ""}`
            console.log("📊 [getAppointmentHeatmap] Request:", endpoint)
            const result = await this.request<Array<{ weekday: number; hour: number; count: number }>>(endpoint)
            console.log("📊 [getAppointmentHeatmap] Response:", result?.length ?? 0, "items")
            return result || []
        } catch (error: any) {
            console.error("❌ [getAppointmentHeatmap] Error:", error)
            // Check for authorization errors
            if (error?.message?.includes("401") || error?.message?.includes("403") || error?.message?.includes("Unauthorized") || error?.message?.includes("Forbidden")) {
                throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với role 'Clinic Manager'.")
            }
            throw error
        }
    }
}

export const appointmentService = new AppointmentService()