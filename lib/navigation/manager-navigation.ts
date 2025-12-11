// Manager navigation configuration
// Centralized navigation for manager role to ensure consistency across all manager pages

import {
    Activity,
    Calendar,
    FileText,
    Clock,
    TrendingUp,
    Building2,
    Package,
    Bell,
    Stethoscope
} from "lucide-react"
import type { NavigationItem } from "./types"

// Manager navigation configuration
export const MANAGER_NAVIGATION: NavigationItem[] = [
    { name: "Tổng quan", href: "/management", icon: Activity },
    { name: "Lịch hẹn", href: "/management/appointments", icon: Calendar },
    // { name: "Báo cáo", href: "/management/reports", icon: FileText },
    { name: "Lịch làm việc", href: "/management/staff-schedule", icon: Calendar },
    // { name: "Lịch phòng khám", href: "/management/clinic-schedule", icon: Clock },
    { name: "Yêu cầu đổi ca", href: "/management/shift-swap-requests", icon: Clock },
    { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
    { name: "Phòng khám", href: "/management/rooms", icon: Building2 },
    { name: "Dịch vụ", href: "/management/services", icon: Stethoscope },
    { name: "Gửi thông báo", href: "/management/notifications", icon: Bell },
]

// Helper function to get manager navigation
export function getManagerNavigation(): NavigationItem[] {
    return [...MANAGER_NAVIGATION]
}
