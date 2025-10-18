// Authentication and authorization utilities
import { apiService, ApiError } from '../api/index'

export type UserRole = "doctor" | "nurse" | "reception" | "pharmacy" | "admin" | "management"

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
  // if (!userStr) return null
  if (!userStr) return {
    id: "6",
    email: "manager@dhc.vn",
    name: "Giám đốc Hoàng Văn E",
    role: "management",
  }

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
}

// Real login function using API
export async function login(phone: string, password: string): Promise<User> {
  try {
    // Call backend API
    const response = await apiService.authenticateUser({ phone, password })

    // Get user info from token or make another API call
    // For now, we'll create a user object from the phone
    const user: User = {
      id: phone,
      email: phone, // Using phone as email for compatibility
      name: `User ${phone}`,
      role: "doctor", // Default role, should be extracted from JWT token
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
  }
  return paths[role]
}
