// Pharmacy navigation configuration
// Centralized navigation for pharmacy role to ensure consistency across all pharmacy pages

import {
    Activity,
    Package,
    ShoppingCart,
    Pill
} from "lucide-react"
import type { NavigationItem } from "./types"

// Pharmacy navigation configuration
export const PHARMACY_NAVIGATION: NavigationItem[] = [
    { name: "Tổng quan", href: "/pharmacy", icon: Activity },
]

// Helper function to get pharmacy navigation
export function getPharmacyNavigation(): NavigationItem[] {
    return [...PHARMACY_NAVIGATION]
}
