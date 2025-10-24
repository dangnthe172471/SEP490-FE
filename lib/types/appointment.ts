// lib/types/appointment.ts
// VERSION FIXED - Type definitions phù hợp với Backend

// DTO Phản hồi phân trang chung
export interface PagedResponse<T> {
    data: T[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
}

// DTO Thông tin bác sĩ
export interface DoctorInfoDto {
    doctorId: number
    userId: number
    fullName: string
    email: string
    phone: string
    specialty: string
    experienceYears: number
    roomId: number
    roomName: string
}

// DTO Thông tin bệnh nhân
export interface PatientInfoDto {
    patientId: number
    userId: number
    fullName: string
    email: string
    phone: string
    allergies?: string
    medicalHistory?: string
}

// DTO Thông tin lịch hẹn
export interface AppointmentDto {
    appointmentId: number
    patientId: number
    patientName: string
    patientPhone: string
    patientEmail?: string
    doctorId: number
    doctorName: string
    doctorSpecialty: string
    appointmentDate: string // ISO DateTime string
    receptionistId?: number
    receptionistName?: string
    status?: string
    createdAt?: string // ISO DateTime string
    reasonForVisit?: string
    updatedBy?: number
}

/**
 * ✅ DTO cho bệnh nhân tạo lịch hẹn
 * 
 * QUAN TRỌNG:
 * - Backend endpoint: POST /api/Appointments/book
 * - Backend tự động lấy userId từ JWT token
 * - Request chỉ cần: doctorId, appointmentDate, reasonForVisit
 * - Không cần gửi patientId vì backend tự lấy từ token
 */
export interface CreateAppointmentByPatientRequest {
    doctorId: number
    appointmentDate: string  // ISO DateTime string (VD: "2025-01-15T14:30:00.000Z")
    reasonForVisit: string
}

/**
 * Dữ liệu trả về từ BookingModal
 * Dùng để người dùng chọn bác sĩ, ngày giờ khám
 */
export interface BookingData {
    service: string   // Tên chuyên khoa hoặc dịch vụ
    date: string      // Định dạng YYYY-MM-DD
    time: string      // Định dạng HH:MM
    doctorId: number  // ID bác sĩ được chọn
}