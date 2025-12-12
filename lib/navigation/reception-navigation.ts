// Reception navigation configuration
// Centralized navigation for reception role to ensure consistency across all reception pages

import {
    Activity,
    Calendar,
    Users,
    FileText,
    MessageCircle,
    UserPlus,
    Bell
} from "lucide-react"
import type { NavigationItem } from "./types"

// Reception navigation configuration
export const RECEPTION_NAVIGATION: NavigationItem[] = [
    { name: "Tổng quan", href: "/reception", icon: Activity },
    { name: "Trạng thái phòng khám", href: "/reception/clinic-status", icon: Activity },
    { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
    { name: "Xem lịch", href: "/reception/appointments-schedule", icon: Calendar },
    { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
    { name: "Hồ sơ bệnh án", href: "/reception/records", icon: FileText },
    { name: "Yêu cầu tái khám", href: "/reception/reappointment-requests", icon: Bell },
    { name: "Chat hỗ trợ", href: "/reception/chat", icon: MessageCircle },
]

// Helper function to get reception navigation
export function getReceptionNavigation(): NavigationItem[] {
    return [...RECEPTION_NAVIGATION]
}
