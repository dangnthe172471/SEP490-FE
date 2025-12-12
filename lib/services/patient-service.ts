// lib/services/patient-service.ts
// Service để gọi API patients từ backend

import { getToken } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168"

interface SearchUserRequest {
    fullName?: string
    phone?: string
    email?: string
    role?: string
    isActive?: boolean
    pageNumber?: number
    pageSize?: number
}

interface SearchUserResponse {
    users: UserDto[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
}

interface UserDto {
    userId: number
    phone?: string
    fullName?: string
    email?: string
    role?: string
    gender?: string
    dob?: string
    isActive: boolean
    // Patient specific fields
    allergies?: string
    medicalHistory?: string
}

interface PatientInfoDto {
    patientId: number
    userId: number
    fullName: string
    email: string
    phone: string
    allergies?: string
    medicalHistory?: string
}

class PatientService {
    async request<T>(endpoint: string, config: RequestInit = {}): Promise<T> {
        const token = getToken()

        if (!token) {
            throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.')
        }

        const url = `${API_BASE_URL}${endpoint}`

        const defaultConfig: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }

        const finalConfig = { ...defaultConfig, ...config }

        try {
            const response = await fetch(url, finalConfig)

            if (!response.ok) {
                const errorText = await response.text()
                // Graceful handling for expected 404s (e.g., user not mapped to patient yet)
                if (response.status === 404) {
                    throw new Error('HTTP 404')
                }
                if (response.status === 401) {
                    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
                }
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            console.log('✅ [PatientService] Success:', data)

            return data
        } catch (error) {
            // Avoid noisy error overlay; surface error to callers without console spam
            throw error
        }
    }

    /**
     * ✅ Tìm kiếm bệnh nhân
     * POST /api/Users/search
     * Cần role Administrator, Doctor, Receptionist
     */
    async searchPatients(request: SearchUserRequest): Promise<SearchUserResponse> {
        console.log('🔍 [PatientService] Searching patients:', request)

        return this.request<SearchUserResponse>('/api/Users/search', {
            method: 'POST',
            body: JSON.stringify({
                ...request,
                role: 'Patient', // Chỉ tìm bệnh nhân
                isActive: true    // Chỉ tìm bệnh nhân đang hoạt động
            })
        })
    }

    /**
     * ✅ Lấy tất cả bệnh nhân (có phân trang)
     * POST /api/Users/search với role=Patient
     */
    async getAllPatients(pageNumber: number = 1, pageSize: number = 50): Promise<SearchUserResponse> {
        return this.searchPatients({
            pageNumber,
            pageSize
        })
    }

    /**
     * ✅ Tìm kiếm bệnh nhân theo từ khóa
     * POST /api/Users/search với fullName, phone, email
     */
    async searchPatientsByKeyword(keyword: string, pageNumber: number = 1, pageSize: number = 20): Promise<SearchUserResponse> {
        if (!keyword || keyword.trim().length < 2) {
            return {
                users: [],
                totalCount: 0,
                pageNumber: 1,
                pageSize: 20,
                totalPages: 0
            }
        }

        const trimmedKeyword = keyword.trim()

        return this.searchPatients({
            fullName: trimmedKeyword,
            phone: trimmedKeyword,
            email: trimmedKeyword,
            pageNumber,
            pageSize
        })
    }

    /**
     * ✅ Lấy thông tin bệnh nhân theo PatientID
     * GET /api/Appointments/patients/{id}
     */
    async getPatientById(patientId: number): Promise<PatientInfoDto> {
        return this.request<PatientInfoDto>(`/api/Appointments/patients/${patientId}`)
    }

    /**
     * ✅ Lấy thông tin bệnh nhân theo PatientID (endpoint /api/Patient/{id})
     * GET /api/Patient/{id}
     */
    async getById(patientId: number): Promise<any> {
        return this.request<any>(`/api/Patient/${patientId}`)
    }

    /**
     * ✅ Lấy thông tin bệnh nhân theo UserID
     * GET /api/Appointments/patients/user/{userId}
     */
    async getPatientByUserId(userId: number): Promise<PatientInfoDto> {
        return this.request<PatientInfoDto>(`/api/Appointments/patients/user/${userId}`)
    }

    /**
     * ✅ Lấy tất cả bệnh nhân từ database
     * Sử dụng endpoint /api/Users/patients để lấy tất cả bệnh nhân
     */
    async getAllPatientsFromDatabase(): Promise<PatientInfoDto[]> {
        try {
            // Lấy tất cả bệnh nhân từ endpoint /api/Users/patients
            const patientUsers = await this.request<UserDto[]>('/api/Users/patients')

            // Convert UserDto to PatientInfoDto
            const patientInfos: PatientInfoDto[] = []
            for (const user of patientUsers) {
                try {
                    // Tìm PatientInfo từ UserId
                    const patientInfo = await this.getPatientByUserId(user.userId)
                    patientInfos.push(patientInfo)
                } catch (err) {
                    // Patient not found in Patient table, skip
                }
            }

            return patientInfos
        } catch (err: any) {
            console.error('❌ [ERROR] Failed to get all patients from database:', err)
            throw err
        }
    }

    /**
     * ✅ Test method để kiểm tra endpoint /api/Users/patients
     */
    async testGetAllPatients(): Promise<UserDto[]> {
        try {
            const result = await this.request<UserDto[]>('/api/Users/patients')
            return result
        } catch (err: any) {
            console.error('🧪 [PatientService] Test error:', err)
            throw err
        }
    }

    /**
     * ✅ Tìm kiếm bệnh nhân CHỈ theo tên
     * POST /api/Users/search với fullName only
     */
    async searchPatientsByKeywordWithAppointmentAPI(keyword: string): Promise<PatientInfoDto[]> {
        if (!keyword || keyword.trim().length < 2) {
            return []
        }

        const trimmedKeyword = keyword.trim()

        try {
            // Chỉ search theo tên thôi (loại bỏ ID prefix nếu có)
            let searchTerm = trimmedKeyword

            // Nếu có format "ID - Name", chỉ lấy phần tên
            if (trimmedKeyword.includes(' - ')) {
                const parts = trimmedKeyword.split(' - ')
                if (parts.length >= 2) {
                    searchTerm = parts.slice(1).join(' - ') // Lấy phần sau " - "
                }
            }

            const response = await this.searchPatients({
                fullName: searchTerm, // CHỈ search theo tên
                role: "Patient", // Chỉ tìm bệnh nhân
                isActive: true,
                pageNumber: 1,
                pageSize: 20
            })

            // Convert UserDto to PatientInfoDto
            const patientInfos: PatientInfoDto[] = []
            for (const user of response.users) {
                try {
                    // Tìm PatientInfo từ UserId
                    const patientInfo = await this.getPatientByUserId(user.userId)
                    patientInfos.push(patientInfo)
                } catch (err) {
                    // Patient not found in Patient table, skip
                }
            }

            return patientInfos
        } catch (err: any) {
            console.error('❌ [ERROR] Failed to search patients:', err)
            throw err
        }
    }
}

export const patientService = new PatientService()
export type { UserDto, PatientInfoDto, SearchUserRequest, SearchUserResponse }
