"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiService } from "@/api/index"
import { getCurrentUser, User } from "@/lib/auth"
import { toast } from "sonner"

export function AuthTest() {
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        setUser(getCurrentUser())
    }, [])

    const testEndpoints = [
        { name: "Public Users", endpoint: "fetchAllUsers", description: "Lấy danh sách tất cả users (public)" },
        { name: "Doctor Only", endpoint: "fetchSecureUsers", description: "Chỉ Doctor mới truy cập được" },
        { name: "Admin Only", endpoint: "fetchAdminUsers", description: "Chỉ Admin/Manager mới truy cập được" },
        { name: "Staff Only", endpoint: "fetchStaffUsers", description: "Doctor/Receptionist mới truy cập được" },
        { name: "User Profile", endpoint: "fetchUserProfile", description: "Lấy thông tin user hiện tại" },
    ]

    const handleTest = async (endpoint: string) => {
        setIsLoading(true)
        try {
            let result
            switch (endpoint) {
                case "fetchAllUsers":
                    result = await apiService.fetchAllUsers()
                    break
                case "fetchSecureUsers":
                    result = await apiService.fetchSecureUsers()
                    break
                case "fetchAdminUsers":
                    result = await apiService.fetchAdminUsers()
                    break
                default:
                    throw new Error("Unknown endpoint")
            }

            toast.success(`${endpoint} thành công!`)
            console.log("Result:", result)
        } catch (error: any) {
            toast.error(`Lỗi ${endpoint}: ${error.message}`)
            console.error("Error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Authentication Test Panel</CardTitle>
                <CardDescription>
                    Test các API endpoints với phân quyền khác nhau
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">Current User:</h3>
                    {!isClient ? (
                        <p className="text-muted-foreground">Đang tải...</p>
                    ) : user ? (
                        <div>
                            <p><strong>Name:</strong> {user.name}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Chưa đăng nhập</p>
                    )}
                </div>

                <div className="space-y-3">
                    {testEndpoints.map((test) => (
                        <div key={test.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h4 className="font-medium">{test.name}</h4>
                                <p className="text-sm text-muted-foreground">{test.description}</p>
                            </div>
                            <Button
                                onClick={() => handleTest(test.endpoint)}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                            >
                                Test
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        <strong>Test Accounts:</strong><br />
                        Doctor: 0905123456 / 123<br />
                        Patient: 0906123456 / 123
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
