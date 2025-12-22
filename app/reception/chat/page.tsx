"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChatInterface } from "@/components/chat-interface"
import { getCurrentUser } from "@/lib/auth"
import { MessageCircle, Users, Clock, Star, ArrowLeft, Home, FileText, Activity, Calendar, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"
import { RoleGuard } from "@/components/role-guard"


export default function ReceptionChatPage() {
    // Get reception navigation from centralized config
    const navigation = getReceptionNavigation()

    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const user = getCurrentUser()
        if (!user) {
            router.push('/')
            return
        }

        // Only allow reception role
        if (user.role !== 'reception') {
            toast.error("Bạn không có quyền truy cập trang này")
            router.push('/')
            return
        }

        setCurrentUser(user)
        setIsLoading(false)
    }, [router])

    if (isLoading) {
        return (
            <RoleGuard allowedRoles="reception">
            <DashboardLayout navigation={navigation}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Đang tải...</p>
                    </div>
                </div>
            </DashboardLayout>
            </RoleGuard>
        )
    }

    if (!currentUser) {
        return null
    }

    return (
        <RoleGuard allowedRoles="reception">
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                {/* Chat Interface */}
                <Card className="shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            Cuộc trò chuyện với bệnh nhân
                        </CardTitle>
                        <CardDescription>
                            Hỗ trợ bệnh nhân qua chat, giải đáp thắc mắc và đặt lịch khám
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ChatInterface currentUser={currentUser} />
                    </CardContent>
                </Card>

                {/* Help Section */}
                <div className="mt-8">
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Hướng dẫn hỗ trợ bệnh nhân
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <MessageCircle className="h-4 w-4 text-primary" />
                                        </div>
                                        <h4 className="font-semibold text-lg">Hỗ trợ đặt lịch:</h4>
                                    </div>
                                    <ul className="space-y-3 text-sm text-muted-foreground ml-6">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            Kiểm tra lịch trống của bác sĩ
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            Hướng dẫn đặt lịch online
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            Xác nhận thông tin lịch hẹn
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                            Gửi thông báo nhắc nhở
                                        </li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <h4 className="font-semibold text-lg">Tư vấn dịch vụ:</h4>
                                    </div>
                                    <ul className="space-y-3 text-sm text-muted-foreground ml-6">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            Giải đáp thắc mắc về dịch vụ
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            Hướng dẫn quy trình khám
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            Tư vấn về bảo hiểm
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                            Xử lý yêu cầu khẩn cấp
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
        </RoleGuard>
    )
}
