// Common navigation types and interfaces
// Shared types for all navigation configurations

export interface NavigationItem {
    name: string
    href: string
    icon: any
    badge?: string | number
    disabled?: boolean
    children?: NavigationItem[]
}
