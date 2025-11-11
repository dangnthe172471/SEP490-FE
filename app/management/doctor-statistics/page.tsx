"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import PatientCountChart from "@/components/charts/patient-count-chart"
import VisitTrendChart from "@/components/charts/visit-trend-chart"
import ReturnRateChart from "@/components/charts/return-rate-chart"
import { getDoctorStatisticsSummary } from "@/lib/services/doctor-statistics-service"
import type { DoctorStatisticsSummaryDto } from "@/lib/types/doctor-statistics"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"
import PageGuard from "@/components/PageGuard"

// ===== Helpers =====
function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getRoleFromClaims(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null
  const msRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
  const role = payload.role ?? msRole ?? null
  return typeof role === "string" ? role : Array.isArray(role) ? role[0] : null
}

// yyyy-mm-dd
function toDateInputValue(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${d}`
}

const ALLOWED_ROLE_VALUES = [
  "Administrator",
  "Clinic Manager",
  "Doctor",
  "admin",
  "management",
  "doctor",
]
const ALLOWED_ROLE_NORMALIZED = ALLOWED_ROLE_VALUES.map((r) => r.toLowerCase())

// ===== Main Page =====
export default function DoctorStatisticsPage() {
  const navigation = getManagerNavigation()
  const { toast } = useToast()

  const [isClient, setIsClient] = useState(false)

  const [token, setToken] = useState("")
  const [role, setRole] = useState<string | null>(null)

  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")

  const [summary, setSummary] = useState<DoctorStatisticsSummaryDto | null>(null)
  const [loading, setLoading] = useState(false)

  // --- 1. Đảm bảo chạy trên client (tránh hydration mismatch)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // --- 2. Lấy token + role + set default range 30 ngày
  useEffect(() => {
    if (!isClient) return

    const t =
      (localStorage.getItem("auth_token") || localStorage.getItem("access_token")) ?? ""
    setToken(t)

    if (t) {
      const payload = decodeJwtPayload(t)
      const r = getRoleFromClaims(payload)
      setRole(r || null)
    } else {
      setRole(null)
    }

    // default range: 30 ngày gần nhất
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - 30)
    setFromDate(toDateInputValue(from))
    setToDate(toDateInputValue(to))
  }, [isClient])

  // --- 3. Hàm load summary theo khoảng thời gian
  const loadSummary = useCallback(
    async (fromStr: string, toStr: string) => {
      if (!token || !role) return

      const normalizedRole = role.toLowerCase()
      const canView = ALLOWED_ROLE_NORMALIZED.includes(normalizedRole)
      if (!canView) {
        setSummary(null)
        toast({
          title: "Không có quyền truy cập",
          description: "Trang này chỉ dành cho Administrator, Clinic Manager và Doctor.",
          variant: "destructive",
        })
        return
      }

      if (!fromStr || !toStr) return

      try {
        setLoading(true)

        const from = new Date(fromStr)
        const to = new Date(toStr)
        // đảm bảo to >= from
        if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
          throw new Error("Khoảng thời gian không hợp lệ.")
        }

        // gửi ISO (backend đã nhận from/to)
        const data = await getDoctorStatisticsSummary(
          from.toISOString(),
          to.toISOString(),
          { token }
        )
        setSummary(data)
      } catch (error: any) {
        setSummary(null)
        toast({
          title: "Lỗi tải dữ liệu",
          description:
            error?.message === "UNAUTHORIZED"
              ? "Bạn không có quyền hoặc phiên đăng nhập đã hết hạn."
              : error?.message || "Không thể tải thống kê bác sĩ.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [token, role, toast]
  )

  // --- 4. Tự động load khi đã có token + role + date range
  useEffect(() => {
    if (!isClient) return
    if (!token || role === null) return
    if (!fromDate || !toDate) return

    loadSummary(fromDate, toDate)
  }, [isClient, token, role, fromDate, toDate, loadSummary])

  // ❗ Tránh SSR mismatch: lần render đầu là null
  if (!isClient) return null

  const normalizedRole = (role || "").toLowerCase()
  const canView = ALLOWED_ROLE_NORMALIZED.includes(normalizedRole)

  const handleApplyRange = () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Thiếu ngày",
        description: "Vui lòng chọn đầy đủ Từ ngày và Đến ngày.",
        variant: "destructive",
      })
      return
    }
    loadSummary(fromDate, toDate)
  }

  return (
    <PageGuard allowedRoles={ALLOWED_ROLE_VALUES}>
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thống kê Bác sĩ</h1>
            <p className="text-muted-foreground">
              Theo dõi hiệu suất và tỷ lệ tái khám của đội ngũ bác sĩ theo từng giai đoạn.
            </p>
          </div>

          {/* Bộ lọc thời gian */}
          {canView && (
            <Card>
              <CardHeader>
                <CardTitle>Khoảng thời gian</CardTitle>
                <CardDescription>
                  Chọn giai đoạn muốn xem thống kê (mặc định 30 ngày gần nhất).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-sm font-medium">Từ ngày</label>
                  <input
                    type="date"
                    className="mt-1 block rounded-md border px-3 py-2 text-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Đến ngày</label>
                  <input
                    type="date"
                    className="mt-1 block rounded-md border px-3 py-2 text-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleApplyRange} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Áp dụng
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Đang tải */}
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Đang tải dữ liệu thống kê...</span>
              </CardContent>
            </Card>
          )}

          {/* Sai quyền */}
          {!loading && !canView && (
            <Card>
              <CardHeader>
                <CardTitle>Không có quyền truy cập</CardTitle>
                <CardDescription>
                  Bạn đang đăng nhập với vai trò <b>{role || "Unknown"}</b>.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Có dữ liệu */}
          {!loading && canView && summary && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Số lượng bệnh nhân & lượt khám</CardTitle>
                  <CardDescription>
                    So sánh khối lượng công việc giữa các bác sĩ trong giai đoạn chọn.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PatientCountChart data={summary.patientCountByDoctor} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Xu hướng số ca khám</CardTitle>
                  <CardDescription>
                    Theo dõi biến động số ca khám theo ngày trong giai đoạn chọn.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VisitTrendChart data={summary.visitTrend} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tỷ lệ tái khám</CardTitle>
                  <CardDescription>
                    Đánh giá mức độ quay lại của bệnh nhân với từng bác sĩ.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReturnRateChart data={summary.returnRates} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Không có dữ liệu */}
          {!loading && canView && !summary && (
            <Card>
              <CardHeader>
                <CardTitle>Không có dữ liệu</CardTitle>
                <CardDescription>
                  Không tìm thấy thống kê trong khoảng thời gian đã chọn.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </PageGuard>
  )
}
