// Authentication and authorization utilities
export type UserRole = "doctor" | "nurse" | "reception" | "pharmacy" | "admin" | "management"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  avatar?: string
}

// Mock authentication - replace with real auth later
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
}

// Mock login function - replace with real authentication
export async function login(email: string, password: string): Promise<User> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock users for demo
  const mockUsers: Record<string, User> = {
    "doctor@dhc.vn": {
      id: "1",
      email: "doctor@dhc.vn",
      name: "BS. Nguyễn Văn A",
      role: "doctor",
      department: "Khoa Nội",
    },
    "nurse@dhc.vn": {
      id: "2",
      email: "nurse@dhc.vn",
      name: "Điều dưỡng Trần Thị B",
      role: "nurse",
    },
    "reception@dhc.vn": {
      id: "3",
      email: "reception@dhc.vn",
      name: "Lễ tân Lê Văn C",
      role: "reception",
    },
    "pharmacy@dhc.vn": {
      id: "4",
      email: "pharmacy@dhc.vn",
      name: "Dược sĩ Phạm Thị D",
      role: "pharmacy",
    },
    "admin@dhc.vn": {
      id: "5",
      email: "admin@dhc.vn",
      name: "Quản trị viên",
      role: "admin",
    },
    "manager@dhc.vn": {
      id: "6",
      email: "manager@dhc.vn",
      name: "Giám đốc Hoàng Văn E",
      role: "management",
    },
  }

  const user = mockUsers[email]
  if (!user || password !== "demo123") {
    throw new Error("Email hoặc mật khẩu không đúng")
  }

  return user
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
