"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, type UserRole } from "@/lib/auth";

interface RoleGuardProps {
    allowedRoles: UserRole[] | UserRole;
    children: ReactNode;
}

/**
 * Component chặn truy cập sai role ở FE.
 * - Nếu chưa đăng nhập hoặc role không nằm trong allowedRoles → redirect và không render children.
 * - Dùng được cho cả page và layout.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const user = getCurrentUser();
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!user || !roles.includes(user.role)) {
            toast({
                variant: "destructive",
                title: "Bạn không có quyền truy cập",
                description: "Tài khoản hiện tại không được phép truy cập trang này.",
            });
            router.replace("/");
            setAuthorized(false);
            return;
        }

        setAuthorized(true);
    }, [allowedRoles, router, toast]);

    // Chờ check xong tránh nháy UI
    if (authorized !== true) return null;

    return <>{children}</>;
}


