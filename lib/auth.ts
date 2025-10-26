// Authentication and authorization utilities
import { authService } from './services/auth.service'
import { ApiError } from './types/api'

export type UserRole = "doctor" | "nurse" | "reception" | "pharmacy" | "admin" | "management" | "patient"

export interface User {
    id: string
    email: string
    name: string
    role: UserRole
    department?: string
    avatar?: string
}

// Get current user from localStorage
export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const userStr = localStorage.getItem("currentUser")
    if (!userStr) return null

    try {
        return JSON.parse(userStr)
    } catch {
        return null
    }
}

export function setCurrentUser(user: User | null) {
    if (typeof window === "undefined") return

    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user))
    } else {
        localStorage.removeItem("currentUser")
    }
}

export function logout() {
    setCurrentUser(null)
    authService.clearToken()

    if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('auth_token')
        window.dispatchEvent(new Event('storage'))
        // Không redirect tự động, để component xử lý
    }
}

function mapBackendRoleToFrontend(backendRole: string): UserRole {
    const roleMapping: Record<string, UserRole> = {
        'Doctor': 'doctor',
        'Nurse': 'nurse',
        'Receptionist': 'reception',
        'Pharmacy Provider': 'pharmacy',
        'Administrator': 'admin',
        'Clinic Manager': 'management',
        'Patient': 'patient'
    }
    return roleMapping[backendRole] || 'patient'
}

export async function login(phone: string, password: string): Promise<User> {
    try {
        const response = await authService.login({ phone, password })
        const user: User = {
            id: response.user.userId.toString(),
            email: response.user.email || response.user.phone || '',
            name: response.user.fullName || `User ${response.user.phone}`,
            role: mapBackendRoleToFrontend(response.user.role || 'Patient'),
        }
        setCurrentUser(user)
        return user
    } catch (error: unknown) {
        if (error instanceof ApiError) {
            if (error.status === 401) {
                // Giữ nguyên message từ backend (có thể là tài khoản bị khóa)
                throw new Error(error.message)
            }
            throw new Error(`Lỗi đăng nhập: ${error.message}`)
        }
        throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.")
    }
}

export function getRoleName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
        doctor: "Bác sĩ",
        nurse: "Điều dưỡng",
        reception: "Lễ tân",
        pharmacy: "Dược sĩ",
        admin: "Quản trị viên",
        management: "Quản lý",
        patient: "Bệnh nhân",
    }
    return roleNames[role]
}

export function getDashboardPath(role: UserRole): string {
    const paths: Record<UserRole, string> = {
        doctor: "/doctor",
        nurse: "/nurse",
        reception: "/reception",
        pharmacy: "/pharmacy",
        admin: "/admin",
        management: "/management",
        patient: "/",
    }
    return paths[role]
}

// --- PHẦN CODE MỚI THÊM VÀO ---

/**
 * Kiểm tra nhanh xem người dùng đã đăng nhập hay chưa.
 * Trả về true nếu có cả user object và token.
 */
export function isLoggedIn(): boolean {
    if (typeof window === "undefined") return false

    const user = getCurrentUser()
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')

    return !!user && !!token
}

/**
 * Kiểm tra xem người dùng hiện tại có thuộc một vai trò (hoặc nhóm vai trò) cụ thể hay không.
 * @param allowedRoles Một vai trò (UserRole) hoặc một mảng các vai trò ([UserRole, UserRole]).
 * @returns boolean
 */
export function hasRole(allowedRoles: UserRole | UserRole[]): boolean {
    const user = getCurrentUser()
    if (!user) return false

    if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(user.role)
    }

    return user.role === allowedRoles
}

/**
 * Lấy token xác thực hiện tại từ localStorage.
 */
export function getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem('token') || localStorage.getItem('auth_token')
}


