// Common API types and interfaces

export interface LoginRequest {
    phone: string
    password: string
}

export interface LoginResponse {
    token: string
    user: {
        userId: number
        phone?: string
        fullName?: string
        email?: string
        role?: string
        gender?: string
        dob?: string
    }
}

export interface RegisterRequest {
    phone: string
    password: string
    fullName: string
    email?: string
    dob?: string
    gender?: string
    roleId: number
}

export interface CreateUserRequest {
    phone: string
    password: string
    fullName: string
    email?: string
    dob?: string
    gender?: string
    roleId: number
    allergies?: string
    medicalHistory?: string
    specialty?: string // Chuyên khoa (chỉ cho bác sĩ)
    experienceYears?: number // Số năm kinh nghiệm (chỉ cho bác sĩ)
    roomId?: number // Phòng làm việc (chỉ cho bác sĩ)
}

export interface UpdateUserRequest {
    phone?: string
    fullName?: string
    email?: string
    dob?: string
    gender?: string
    roleId?: number
    password?: string
    allergies?: string
    medicalHistory?: string
}

export interface RegisterResponse {
    userId: number
}

export interface UserDto {
    userId: number
    phone?: string
    fullName?: string
    email?: string
    role?: string
    gender?: string
    dob?: string
    isActive?: boolean
    allergies?: string
    medicalHistory?: string
    avatar?: string
}

export interface ApiResponse<T = any> {
    success: boolean
    message?: string
    data?: T
    error?: string
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public statusText: string
    ) {
        super(message)
        this.name = 'ApiError'
    }
}
