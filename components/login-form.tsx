"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { login, setCurrentUser, getDashboardPath } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const user = await login(email, password)
      setCurrentUser(user)
      router.push(getDashboardPath(user.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
        <CardDescription className="text-center">Nhập thông tin đăng nhập để truy cập hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@dhc.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-muted-foreground">Chưa có tài khoản? </span>
          <Link href="/register" className="text-primary font-medium hover:underline">
            Đăng ký ngay
          </Link>
        </div>

        {/* <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p className="font-semibold">Tài khoản demo:</p>
          <div className="space-y-1 text-xs">
            <p>• Bác sĩ: doctor@dhc.vn</p>
            <p>• Điều dưỡng: nurse@dhc.vn</p>
            <p>• Lễ tân: reception@dhc.vn</p>
            <p>• Dược sĩ: pharmacy@dhc.vn</p>
            <p>• Quản trị: admin@dhc.vn</p>
            <p>• Quản lý: manager@dhc.vn</p>
            <p className="mt-2">Mật khẩu: demo123</p>
          </div>
        </div> */}
      </CardContent>
    </Card>
  )
}
