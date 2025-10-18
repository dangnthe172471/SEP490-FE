"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, ChevronRight } from "lucide-react"

interface BreadcrumbItem {
    label: string
    href?: string
    isActive?: boolean
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
    showHome?: boolean
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
    const router = useRouter()

    return (
        <nav className="flex items-center gap-2 text-sm">
            {showHome && (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary p-0 h-auto"
                    >
                        <Home className="h-4 w-4" />
                        Trang chủ
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </>
            )}

            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {item.href ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(item.href!)}
                            className={`p-0 h-auto ${item.isActive
                                ? 'text-primary font-medium'
                                : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            {item.label}
                        </Button>
                    ) : (
                        <span className={`${item.isActive
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                            }`}>
                            {item.label}
                        </span>
                    )}

                    {index < items.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            ))}
        </nav>
    )
}
