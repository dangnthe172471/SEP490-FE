"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getCurrentUser, isLoggedIn } from "@/lib/auth"

interface PageGuardProps {
    allowedRoles: string[]
    children: React.ReactNode
}

export default function PageGuard({ allowedRoles, children }: PageGuardProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const user = getCurrentUser()

        if (!isLoggedIn() || !user) {
            toast.error("Vui lòng đăng nhập để tiếp tục!")
            // setTimeout(() => router.push("/"), 500)
            router.push('/')
            return
        }

        if (!allowedRoles.includes(user.role)) {
            toast.error(" Bạn không có quyền truy cập trang này!")
            // setTimeout(() => router.push("/"), 500)
            router.push('/')
            return
        }

        setCurrentUser(user)
        setIsLoading(false)
    }, [router, allowedRoles])

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Đang tải...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!currentUser) return null

    return <>{children}</>
}
