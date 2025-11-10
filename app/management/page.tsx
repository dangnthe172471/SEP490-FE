"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
  FileText,
  CalendarIcon,
  Clock,
  TestTube,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"
import React from "react"
import PageGuard from "@/components/PageGuard"
import { RevenueChartSection } from "./charts/RevenueChart"
import { useEffect, useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentService } from "@/lib/services/appointment-service"
import type { AppointmentTimeSeriesPoint, AppointmentHeatmapPoint } from "@/lib/types/appointment"

// Mock data for charts
const revenueData = [
  { month: "T1", revenue: 45000000, expenses: 32000000 },
  { month: "T2", revenue: 52000000, expenses: 35000000 },
  { month: "T3", revenue: 48000000, expenses: 33000000 },
  { month: "T4", revenue: 61000000, expenses: 38000000 },
  { month: "T5", revenue: 55000000, expenses: 36000000 },
  { month: "T6", revenue: 67000000, expenses: 40000000 },
]

const patientData = [
  { month: "T1", patients: 450 },
  { month: "T2", patients: 520 },
  { month: "T3", patients: 480 },
  { month: "T4", patients: 610 },
  { month: "T5", patients: 550 },
  { month: "T6", patients: 670 },
]

const departmentData = [
  { name: "Nội khoa", value: 35, color: "hsl(var(--chart-1))" },
  { name: "Nhi khoa", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Da liễu", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Tai mũi họng", value: 15, color: "hsl(var(--chart-4))" },
  { name: "Khác", value: 5, color: "hsl(var(--chart-5))" },
]

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const topDoctors = [
  { name: "BS. Trần Văn B", patients: 145, revenue: 87000000, rating: 4.8 },
  { name: "BS. Lê Thị D", patients: 132, revenue: 79200000, rating: 4.9 },
  { name: "BS. Nguyễn Văn A", patients: 128, revenue: 76800000, rating: 4.7 },
  { name: "BS. Phạm Thị C", patients: 115, revenue: 69000000, rating: 4.6 },
  { name: "BS. Hoàng Văn E", patients: 98, revenue: 58800000, rating: 4.5 },
]

export default function ManagementDashboard() {
  // Get manager navigation from centralized config
  const navigation = getManagerNavigation()

  // Appointments analytics states
  const [tsData, setTsData] = useState<AppointmentTimeSeriesPoint[]>([])
  const [hmData, setHmData] = useState<AppointmentHeatmapPoint[]>([])
  const [statusStats, setStatusStats] = useState<{ name: string; value: number; color: string }[]>([])
  const [range, setRange] = useState(30)
  const [groupBy, setGroupBy] = useState<"day" | "month">("day")
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

  const rangeOptions = [
    { label: "7 ngày", value: 7 },
    { label: "30 ngày", value: 30 },
    { label: "90 ngày", value: 90 },
  ]

  const formatDateParam = (date: Date) => date.toISOString().split("T")[0]
  const computeRange = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    return { from: formatDateParam(start), to: formatDateParam(end) }
  }

  const formatPeriodLabel = (period: string, groupBy: "day" | "month") => {
    if (groupBy === "day") {
      const date = new Date(`${period}T00:00:00`)
      if (Number.isNaN(date.getTime())) return period
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
    }
    const [year, month] = period.split("-")
    if (!year || !month) return period
    return `${month}/${year}`
  }

  useEffect(() => {
    const load = async () => {
      try {
        setAppointmentsLoading(true)
        setAppointmentsError(null)

        const { from, to } = computeRange(range)
        console.log("📊 Loading appointments analytics:", { from, to, groupBy, range })

        // Load từng API riêng biệt để xác định API nào bị lỗi
        let series: AppointmentTimeSeriesPoint[] = []
        let heatmap: AppointmentHeatmapPoint[] = []
        let stats: any = null
        const errors: string[] = []

        // Load statistics first (đơn giản nhất)
        try {
          stats = await appointmentService.getAppointmentStatistics()
          console.log("✅ Statistics loaded:", stats)
        } catch (e: any) {
          console.error("❌ Failed to load statistics:", e)
          errors.push(`Statistics: ${e?.message || 'Unknown error'}`)
        }

        // Load time series
        try {
          series = await appointmentService.getAppointmentTimeSeries({ from, to, groupBy })
          console.log("✅ Time series loaded:", series?.length ?? 0, "items")
        } catch (e: any) {
          console.error("❌ Failed to load time series:", e)
          errors.push(`Time series: ${e?.message || 'Unknown error'}`)
        }

        // Load heatmap
        try {
          heatmap = await appointmentService.getAppointmentHeatmap({ from, to })
          console.log("✅ Heatmap loaded:", heatmap?.length ?? 0, "items")
        } catch (e: any) {
          console.error("❌ Failed to load heatmap:", e)
          errors.push(`Heatmap: ${e?.message || 'Unknown error'}`)
        }

        // Set data (ngay cả khi một số API fail)
        setTsData(series || [])
        setHmData(heatmap || [])

        if (stats) {
          setStatusStats([
            { name: "Đang chờ", value: stats.pendingAppointments ?? 0, color: "hsl(var(--chart-1))" },
            { name: "Đã xác nhận", value: stats.confirmedAppointments ?? 0, color: "hsl(var(--chart-2))" },
            { name: "Hoàn thành", value: stats.completedAppointments ?? 0, color: "hsl(var(--chart-3))" },
            { name: "Đã hủy", value: stats.cancelledAppointments ?? 0, color: "hsl(var(--destructive))" },
            { name: "Không đến", value: stats.noShowAppointments ?? 0, color: "hsl(var(--muted))" },
          ])
        } else {
          setStatusStats([])
        }

        // Hiển thị lỗi nếu có
        if (errors.length > 0) {
          const errorMessage = `Một số dữ liệu không tải được:\n${errors.join('\n')}`
          setAppointmentsError(errorMessage)
          console.warn("⚠️ Some data failed to load:", errors)
        }

      } catch (e: any) {
        console.error("❌ Appointments analytics load failed:", e)
        const errorMessage = e?.message || "Không thể tải dữ liệu lịch hẹn"
        setAppointmentsError(errorMessage)
        setTsData([])
        setHmData([])
        setStatusStats([])
      } finally {
        setAppointmentsLoading(false)
      }
    }
    load()
  }, [range, groupBy])

  const lineChartData = useMemo(() => tsData.map(point => ({
    label: formatPeriodLabel(point.period, groupBy),
    count: point.count,
  })), [tsData, groupBy])

  const heatmapLookup = useMemo(() => {
    const map = new Map<string, number>()
    hmData.forEach(point => map.set(`${point.weekday}-${point.hour}`, point.count))
    return map
  }, [hmData])

  const maxHeatmapCount = useMemo(() => hmData.reduce((max, point) => Math.max(max, point.count), 0), [hmData])
  const rangeLabel = rangeOptions.find(o => o.value === range)?.label ?? `${range} ngày`

  const stats = [
    {
      title: "Doanh thu tháng này",
      value: "67.000.000 ₫",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-chart-2",
    },
    {
      title: "Bệnh nhân mới",
      value: "670",
      change: "+21.8%",
      trend: "up",
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "Lịch hẹn",
      value: "245",
      change: "+8.3%",
      trend: "up",
      icon: Calendar,
      color: "text-chart-3",
    },
    {
      title: "Tỷ lệ hoàn thành",
      value: "92%",
      change: "+2.1%",
      trend: "up",
      icon: Activity,
      color: "text-chart-4",
    },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <PageGuard allowedRoles={["management", "admin"]}>
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Quản lý</h1>
            <p className="text-muted-foreground">Tổng quan hoạt động và phân tích kinh doanh</p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {stat.trend === "up" ? (
                        <ArrowUp className="h-3 w-3 text-chart-2" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={stat.trend === "up" ? "text-chart-2" : "text-destructive"}>{stat.change}</span>
                      <span>so với tháng trước</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
              <TabsTrigger value="patients">Bệnh nhân</TabsTrigger>
              <TabsTrigger value="departments">Khoa phòng</TabsTrigger>
              <TabsTrigger value="appointments">Lịch hẹn</TabsTrigger>
            </TabsList>

            {/* Revenue Chart */}
            <RevenueChartSection />

            {/* Patients Chart */}
            <TabsContent value="patients" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lượng bệnh nhân</CardTitle>
                  <CardDescription>Số lượng bệnh nhân khám 6 tháng gần nhất</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={patientData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="patients"
                        name="Bệnh nhân"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Departments Chart */}
            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Phân bổ theo khoa</CardTitle>
                  <CardDescription>Tỷ lệ bệnh nhân theo từng khoa phòng</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appointments Chart */}
            <TabsContent value="appointments" className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={String(range)} onValueChange={(v) => setRange(parseInt(v, 10))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    {rangeOptions.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Nhóm theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Theo ngày</SelectItem>
                    <SelectItem value="month">Theo tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error Message */}
              {appointmentsError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 text-red-800">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium mb-2">Lỗi khi tải dữ liệu lịch hẹn</p>
                        <div className="text-sm text-red-600 whitespace-pre-line mb-2">
                          {appointmentsError}
                        </div>
                        <div className="text-xs text-red-500 mt-2 space-y-1">
                          <p><strong>Vui lòng kiểm tra:</strong></p>
                          <ul className="list-disc list-inside space-y-0.5 ml-2">
                            <li>Bạn đã đăng nhập với role "Clinic Manager"</li>
                            <li>Kết nối với backend đang hoạt động</li>
                            <li>Console (F12) để xem chi tiết lỗi</li>
                            <li>Backend logs để xem lỗi server</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {appointmentsLoading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-muted-foreground">Đang tải dữ liệu lịch hẹn...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!appointmentsLoading && !appointmentsError && (
                <div className="grid gap-6 xl:grid-cols-3">
                  {/* Line chart */}
                  <Card className="xl:col-span-2">
                    <CardHeader>
                      <CardTitle>Xu hướng lịch hẹn</CardTitle>
                      <CardDescription>Số lượng lịch hẹn theo {groupBy === "day" ? "ngày" : "tháng"} trong {rangeLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {lineChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" name="Số lịch hẹn" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                          {tsData.length === 0
                            ? "Không có dữ liệu lịch hẹn trong khoảng thời gian này."
                            : "Đang xử lý dữ liệu..."}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status bar */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Trạng thái lịch hẹn</CardTitle>
                      <CardDescription>Phân bổ trạng thái trong {rangeLabel}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {statusStats.length > 0 && statusStats.some(s => s.value > 0) ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={statusStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" name="Số lịch hẹn">
                              {statusStats.map((entry, index) => (
                                <Cell key={`cell-st-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                          Không có dữ liệu trạng thái.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Heatmap simple grid */}
              {!appointmentsLoading && !appointmentsError && (
                <Card>
                  <CardHeader>
                    <CardTitle>Heatmap theo giờ</CardTitle>
                    <CardDescription>Mức độ bận rộn theo thứ và giờ trong {rangeLabel}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hmData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div
                          className="inline-grid gap-1"
                          style={{ gridTemplateColumns: `repeat(${HOURS.length + 1}, minmax(44px, 1fr))` }}
                        >
                          <div className="text-xs font-medium text-muted-foreground" />
                          {HOURS.map((h) => (
                            <div key={`h-${h}`} className="text-xs text-center text-muted-foreground">
                              {h.toString().padStart(2, "0")}
                            </div>
                          ))}
                          {WEEKDAY_LABELS.map((label, weekdayIndex) => (
                            <React.Fragment key={`row-${label}`}>
                              <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                              {HOURS.map((hour) => {
                                const count = heatmapLookup.get(`${weekdayIndex}-${hour}`) ?? 0
                                const max = Math.max(1, maxHeatmapCount)
                                const intensity = max ? count / max : 0
                                const alpha = 0.2 + intensity * 0.7
                                const color = `rgba(37,99,235,${alpha})`
                                return (
                                  <div
                                    key={`cell-${label}-${hour}`}
                                    className="h-9 flex items-center justify-center rounded-md text-[11px] font-semibold"
                                    style={{ backgroundColor: color, color: intensity > 0.6 ? "#fff" : "#111827" }}
                                  >
                                    {count || ""}
                                  </div>
                                )
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                        Không có dữ liệu heatmap.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Top Doctors */}
          <Card>
            <CardHeader>
              <CardTitle>Bác sĩ xuất sắc</CardTitle>
              <CardDescription>Top 5 bác sĩ có hiệu suất cao nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDoctors.map((doctor, index) => (
                  <div key={doctor.name} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{doctor.patients} bệnh nhân</span>
                          <span>•</span>
                          <span>{formatCurrency(doctor.revenue)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">⭐ {doctor.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </PageGuard>
  )
}
