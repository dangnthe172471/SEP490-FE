// Doctor navigation configuration
// Centralized navigation for doctor role to ensure consistency across all doctor pages

import {
  Activity,
  Users,
  Calendar,
  FileText,
  Clock
} from "lucide-react"
import type { NavigationItem } from "./types"

// Doctor navigation configuration
export const DOCTOR_NAVIGATION: NavigationItem[] = [
  { name: "Tổng quan", href: "/doctor", icon: Activity },
  { name: "Bệnh nhân", href: "/doctor/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/doctor/records", icon: FileText },
  { name: "Lịch hẹn", href: "/doctor/appointments", icon: Calendar },
  { name: "Chi tiết khám", href: "/doctor/patient-records", icon: FileText },
  { name: "Đổi ca", href: "/doctor/shift-swap", icon: Clock },
]

// Helper function to get doctor navigation
export function getDoctorNavigation(): NavigationItem[] {
  return [...DOCTOR_NAVIGATION]
}