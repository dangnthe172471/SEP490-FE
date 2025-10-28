// Nurse navigation configuration
// Centralized navigation for nurse role to ensure consistency across all nurse pages

import {
    Activity,
    Users,
    ClipboardList,
    Stethoscope
} from "lucide-react"
import type { NavigationItem } from "./types"

// Nurse navigation configuration
export const NURSE_NAVIGATION: NavigationItem[] = [
    { name: "Tổng quan", href: "/nurse", icon: Activity },
    { name: "Bệnh nhân", href: "/nurse/patients", icon: Users },
    { name: "Nhiệm vụ", href: "/nurse/tasks", icon: ClipboardList },
    { name: "Theo dõi", href: "/nurse/monitoring", icon: Stethoscope },
]

// Helper function to get nurse navigation
export function getNurseNavigation(): NavigationItem[] {
    return [...NURSE_NAVIGATION]
}
