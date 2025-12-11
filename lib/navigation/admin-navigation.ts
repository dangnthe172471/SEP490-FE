// Admin navigation configuration
// Centralized navigation for admin role to ensure consistency across all admin pages

import {
    Activity,
    Users,
    Shield,
    Settings
} from "lucide-react"
import type { NavigationItem } from "./types"

// Admin navigation configuration
export const ADMIN_NAVIGATION: NavigationItem[] = [
    // { name: "Tổng quan", href: "/admin", icon: Activity },
    { name: "Người dùng", href: "/admin/users", icon: Users },
    { name: "Phân quyền", href: "/admin/roles", icon: Shield },
    // { name: "Cài đặt", href: "/admin/settings", icon: Settings },
]

// Helper function to get admin navigation
export function getAdminNavigation(): NavigationItem[] {
    return [...ADMIN_NAVIGATION]
}
