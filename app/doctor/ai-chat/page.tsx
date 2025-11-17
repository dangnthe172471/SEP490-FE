"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AIChatInterface } from "@/components/ai-chat-interface"
import { ClientOnly } from "@/components/client-only"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
import { useEffect, useState } from "react"
import { Bot, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DoctorAIChatPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigation = getDoctorNavigation()

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user || user.role !== "doctor") {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center py-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-2">
                {!user ? "Cần đăng nhập" : "Không có quyền truy cập"}
              </h2>
              <p className="text-muted-foreground">
                {!user
                  ? "Vui lòng đăng nhập với tài khoản Bác sĩ"
                  : "Chỉ tài khoản Bác sĩ mới có thể truy cập trang này"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Hỗ trợ Chẩn đoán</h1>
            <p className="text-sm text-muted-foreground">
              Trò chuyện với AI để được hỗ trợ trong quá trình chẩn đoán
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            AI chỉ là công cụ hỗ trợ tham khảo, không thay thế chẩn đoán chuyên môn của bác sĩ.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-0">
            <ClientOnly>
              <AIChatInterface />
            </ClientOnly>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

