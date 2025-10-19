"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChatInterface } from "@/components/chat-interface"
import { getCurrentUser, getRoleName } from "@/lib/auth"
import { MessageCircle, Users, Clock, Star, ArrowLeft, Home } from "lucide-react"
import { toast } from "sonner"

export default function ChatPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const user = getCurrentUser()
        if (!user) {
            router.push('/')
            return
        }

        // Only allow patient role
        if (user.role !== 'patient') {
            toast.error("Bạn không có quyền truy cập trang chat")
            router.push('/')
            return
        }

        setCurrentUser(user)
        setIsLoading(false)
    }, [router])

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

    if (!currentUser) {
        return null
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                {/* Navigation */}
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 hover:bg-muted/80"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 hover:bg-muted/80"
                    >
                        <Home className="h-4 w-4" />
                        Trang chủ
                    </Button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-sm">
                        <MessageCircle className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Chat Hỗ Trợ
                        </h1>
                        <p className="text-muted-foreground">
                            Kết nối với lễ tân để được hỗ trợ
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                                    <p className="font-semibold text-green-600">Đang hoạt động</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Thời gian phản hồi</p>
                                    <p className="font-semibold text-blue-600">Trong 5 phút</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Đánh giá</p>
                                    <p className="font-semibold text-yellow-600">4.8/5.0</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Chat Interface */}
            <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Cuộc trò chuyện
                    </CardTitle>
                    <CardDescription>
                        Chat với lễ tân để được hỗ trợ đặt lịch, tư vấn dịch vụ
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
                            Hướng dẫn sử dụng
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 className="font-semibold text-lg">Cho bệnh nhân:</h4>
                                </div>
                                <ul className="space-y-3 text-sm text-muted-foreground ml-6">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                        Đặt lịch khám với bác sĩ
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                        Hỏi về dịch vụ y tế
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                        Tư vấn về bảo hiểm
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                        Hỗ trợ kỹ thuật
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MessageCircle className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-lg">Cho lễ tân:</h4>
                                </div>
                                <ul className="space-y-3 text-sm text-muted-foreground ml-6">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                        Hỗ trợ đặt lịch khám
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                        Giải đáp thắc mắc
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                        Tư vấn dịch vụ
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
    )
}
