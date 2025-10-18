// Authentication and authorization utilities
import { apiService, ApiError } from '../api/index'

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
  apiService.clearToken()

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

// Map backend roles to frontend roles
function mapBackendRoleToFrontend(backendRole: string): UserRole {
  const roleMapping: Record<string, UserRole> = {
    'Doctor': 'doctor',
    'Nurse': 'nurse',
    'Receptionist': 'reception',
    'PharmacyProvider': 'pharmacy',
    'Admin': 'admin',
    'Manager': 'management',
    'Patient': 'patient'
  }
  return roleMapping[backendRole] || 'patient'
}

// Real login function using API
export async function login(phone: string, password: string): Promise<User> {
  try {
    // Call backend API
    const response = await apiService.authenticateUser({ phone, password })

    // Create user object from API response
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
        throw new Error("Số điện thoại hoặc mật khẩu không đúng")
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
