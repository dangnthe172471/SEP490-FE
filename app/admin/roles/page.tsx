"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Shield } from "lucide-react"
import { getAdminNavigation } from "@/lib/navigation/admin-navigation"
import { roleService } from "@/lib/services/role-service"
import type { RoleDto } from "@/lib/types/role"
import { useToast } from "@/hooks/use-toast"

export default function AdminRolesPage() {
  const navigation = getAdminNavigation()
  const { toast } = useToast()

  const [roles, setRoles] = useState<RoleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true)
        const data = await roleService.getAll()
        setRoles(data)
        setError(null)
      } catch (err: any) {
        const message = err?.message || "Không thể tải danh sách vai trò"
        setError(message)
        toast({
          title: "Lỗi",
          description: message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRoles()
  }, [toast])

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý phân quyền</h1>
          <p className="text-muted-foreground">Danh sách vai trò từ hệ thống</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <div className="h-5 w-32 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-48 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))
            : roles.map((role) => (
              <Card key={role.roleId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {role.roleName}
                      </CardTitle>
                      <CardDescription>Mã vai trò: {role.roleId}</CardDescription>
                    </div>
                    <Badge variant="outline">System role</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Vai trò được đồng bộ từ API. Liên hệ quản trị viên để chỉnh sửa quyền chi tiết.
                  </p>
                </CardContent>
              </Card>
            ))}

          {!loading && roles.length === 0 && !error && (
            <div className="col-span-full">
              <Alert>
                <AlertTitle>Không có dữ liệu</AlertTitle>
                <AlertDescription>Hệ thống chưa có vai trò nào.</AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
