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
  TestTube, // Sử dụng icon TestTube cho Test Types
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
import { managementAnalyticsService } from "@/lib/services/management-analytics.service"
import type { AppointmentTimeSeriesPoint, AppointmentHeatmapPoint } from "@/lib/types/appointment"
import { getPaymentsChartData } from "@/lib/services/payment-service";
import { DashboardService } from "@/lib/services/dashboard-service"

import type { TestDiagnosticStats } from "@/lib/types/management"

type PatientStats = {
  totalPatients: number
  byGender: { male: number; female: number; other: number }
  byAgeGroups: { _0_17: number; _18_35: number; _36_55: number; _56_Plus: number }
  monthlyNewPatients: { month: string; count: number }[]
}

const GENDER_COLORS = ['#60a5fa', '#f472b6', '#a78bfa']
const AGE_COLORS = ['#34d399', '#fbbf24', '#fb7185', '#a78bfa']

// Mock data for charts (giữ nguyên)

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

// Hàm tiện ích (giữ nguyên)
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
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value)
}


export default function ManagementDashboard() {
  const navigation = getManagerNavigation()

  // --- Appointments analytics states (giữ nguyên) ---
  const [tsData, setTsData] = useState<AppointmentTimeSeriesPoint[]>([])
  const [hmData, setHmData] = useState<AppointmentHeatmapPoint[]>([])
  const [statusStats, setStatusStats] = useState<{ name: string; value: number; color: string }[]>([])
  const [range, setRange] = useState(30)
  const [groupBy, setGroupBy] = useState<"day" | "month">("day")
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

  // ⭐ BỔ SUNG: Test & Diagnostic analytics states
  const [diagnosticStats, setDiagnosticStats] = useState<TestDiagnosticStats | null>(null)
  const [diagnosticLoading, setDiagnosticLoading] = useState(false)
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null)
  const [diagnosticRange, setDiagnosticRange] = useState(30)
  const [diagnosticGroupBy, setDiagnosticGroupBy] = useState<"day" | "month">("day")

  // ⭐ BỔ SUNG: Patient statistics states
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null)
  const [patientStatsLoading, setPatientStatsLoading] = useState(false)
  const [patientStatsError, setPatientStatsError] = useState<string | null>(null)
  const [patientStatsFrom, setPatientStatsFrom] = useState('')
  const [patientStatsTo, setPatientStatsTo] = useState('')


  const rangeOptions = [
    { label: "7 ngày", value: 7 },
    { label: "30 ngày", value: 30 },
    { label: "90 ngày", value: 90 },
  ]

  // --- useEffect cho Appointments (giữ nguyên) ---
  useEffect(() => {
    const load = async () => {
      try {
        setAppointmentsLoading(true)
        setAppointmentsError(null)

        const { from, to } = computeRange(range)
        console.log("📊 Loading appointments analytics:", { from, to, groupBy, range })

        let series: AppointmentTimeSeriesPoint[] = []
        let heatmap: AppointmentHeatmapPoint[] = []
        let stats: any = null
        const errors: string[] = []

        // Load statistics first
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
          const errorMessage = `Một số dữ liệu lịch hẹn không tải được:\n${errors.join('\n')}`
          setAppointmentsError(errorMessage)
          console.warn("⚠️ Some appointment data failed to load:", errors)
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

  // ⭐ BỔ SUNG: useEffect cho Test & Diagnostic
  useEffect(() => {
    const loadDiagnosticStats = async () => {
      try {
        setDiagnosticLoading(true)
        setDiagnosticError(null)

        const { from, to } = computeRange(diagnosticRange)
        console.log("📊 Loading diagnostic analytics:", { from, to, groupBy: diagnosticGroupBy, diagnosticRange })

        const stats = await managementAnalyticsService.getTestDiagnosticStats({
          from,
          to,
          groupBy: diagnosticGroupBy,
        })

        setDiagnosticStats(stats)
      } catch (e: any) {
        console.error("❌ Diagnostic analytics load failed:", e)
        setDiagnosticStats(null)
        setDiagnosticError(e?.message || "Không thể tải dữ liệu xét nghiệm & chẩn đoán")
      } finally {
        setDiagnosticLoading(false)
      }
    }

    loadDiagnosticStats()
  }, [diagnosticRange, diagnosticGroupBy])

  // ⭐ BỔ SUNG: useEffect cho Patient Statistics
  useEffect(() => {
    const loadPatientStats = async () => {
      try {
        setPatientStatsLoading(true)
        setPatientStatsError(null)

        const toDefault = new Date()
        const fromDefault = new Date(toDefault)
        fromDefault.setMonth(fromDefault.getMonth() - 11)
        fromDefault.setDate(1)

        const toStr = patientStatsTo || toDefault.toISOString().slice(0, 10)
        const fromStr = patientStatsFrom || fromDefault.toISOString().slice(0, 10)

        if (!patientStatsFrom || !patientStatsTo) {
          setPatientStatsFrom(fromStr)
          setPatientStatsTo(toStr)
        }

        const svc = new DashboardService()
        const stats = await svc.getPatientStatistics(fromStr, toStr)
        setPatientStats(stats)
      } catch (e: any) {
        console.error("❌ Patient statistics load failed:", e)
        setPatientStats(null)
        setPatientStatsError(e?.message || "Không thể tải dữ liệu thống kê bệnh nhân")
      } finally {
        setPatientStatsLoading(false)
      }
    }

    loadPatientStats()
  }, [patientStatsFrom, patientStatsTo])

  // ⭐ BỔ SUNG: useMemo cho Patient Statistics charts
  const genderChartData = useMemo(() => {
    if (!patientStats) return []
    return [
      { name: 'Nam', value: patientStats.byGender.male },
      { name: 'Nữ', value: patientStats.byGender.female },
      { name: 'Khác', value: patientStats.byGender.other },
    ]
  }, [patientStats])

  const ageChartData = useMemo(() => {
    if (!patientStats) return []
    return [
      { name: '0-17', value: patientStats.byAgeGroups._0_17 },
      { name: '18-35', value: patientStats.byAgeGroups._18_35 },
      { name: '36-55', value: patientStats.byAgeGroups._36_55 },
      { name: '56+', value: patientStats.byAgeGroups._56_Plus },
    ]
  }, [patientStats])

  const handlePatientStatsDateChange = async () => {
    if (patientStatsFrom && patientStatsTo && new Date(patientStatsFrom) > new Date(patientStatsTo)) {
      setPatientStatsError("Ngày 'từ' phải nhỏ hơn hoặc bằng ngày 'đến'.")
      return
    }
    setPatientStatsError(null)
    setPatientStatsLoading(true)
    try {
      const svc = new DashboardService()
      const stats = await svc.getPatientStatistics(patientStatsFrom || undefined, patientStatsTo || undefined)
      setPatientStats(stats)
    } catch (e: any) {
      setPatientStatsError(e?.message || "Không thể tải dữ liệu thống kê bệnh nhân")
    } finally {
      setPatientStatsLoading(false)
    }
  }


  // --- useMemo cho Appointments (giữ nguyên) ---
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

  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [monthlyChange, setMonthlyChange] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Month Now 
      const startNow = `${year}-${String(month).padStart(2, "0")}-01`;
      const endNow = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

      const paymentsNow = await getPaymentsChartData(startNow, endNow);
      const totalNow = paymentsNow.reduce((s, p) => s + p.amount, 0);

      // Previous Month 
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const startPrev = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
      const endPrev = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${new Date(prevYear, prevMonth, 0).getDate()}`;

      const paymentsPrev = await getPaymentsChartData(startPrev, endPrev);
      const totalPrev = paymentsPrev.reduce((s, p) => s + p.amount, 0);


      let changePercent = 0;
      if (totalPrev > 0) changePercent = ((totalNow - totalPrev) / totalPrev) * 100;

      setMonthlyRevenue(totalNow);
      setMonthlyChange(changePercent);
    };

    loadData();
  }, []);


  // ⭐ BỔ SUNG: useMemo cho Test & Diagnostic
  const diagnosticTrendData = useMemo(() => {
    return (diagnosticStats?.trends ?? []).map(point => ({
      label: formatPeriodLabel(point.period, diagnosticGroupBy),
      visitCount: point.visitCount,
      testCount: point.testCount,
    }))
  }, [diagnosticStats, diagnosticGroupBy])

  const visitBarData = useMemo(() => (diagnosticStats?.visitTypeCounts ?? []).map(item => ({
    name: item.label,
    count: item.count,
  })), [diagnosticStats])

  const testBarData = useMemo(() => (diagnosticStats?.testTypeCounts ?? []).map(item => ({
    name: item.label,
    count: item.count,
  })), [diagnosticStats])

  const diagnosticRangeLabel = rangeOptions.find(o => o.value === diagnosticRange)?.label ?? `${diagnosticRange} ngày`


  // --- Stats Card (cập nhật Lịch hẹn và thêm Loại Xét nghiệm) ---
  const stats = [
    {
      title: "Doanh thu tháng này",
      value: new Intl.NumberFormat("vi-VN").format(monthlyRevenue) + " ₫",
      change:
        monthlyChange >= 0
          ? `+${monthlyChange.toFixed(1)}%`
          : `${monthlyChange.toFixed(1)}%`,
      trend: monthlyChange >= 0 ? "up" : "down",
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
      value: "245", // Có thể thay bằng stats.totalAppointments nếu có từ API
      change: "+8.3%",
      trend: "up",
      icon: Calendar,
      color: "text-chart-3",
    },
    {
      title: "Loại xét nghiệm", // ⭐ BỔ SUNG METRIC NÀY
      value: diagnosticStats ? diagnosticStats.totalTests.toString() : "...",
      change: "", // Không có so sánh
      trend: "none",
      icon: TestTube,
      color: "text-chart-5",
    },
  ]

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
                    {stat.change && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {stat.trend === "up" ? (
                          <ArrowUp className="h-3 w-3 text-chart-2" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-destructive" />
                        )}
                        <span className={stat.trend === "up" ? "text-chart-2" : "text-destructive"}>{stat.change}</span>
                        <span>so với tháng trước</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
              <TabsTrigger value="patients">Bệnh nhân</TabsTrigger>
              <TabsTrigger value="appointments">Lịch hẹn</TabsTrigger>
              <TabsTrigger value="diagnostics">Xét nghiệm & Chẩn đoán</TabsTrigger>
            </TabsList>

            {/* Revenue Chart (giữ nguyên) */}
            <RevenueChartSection />

            {/* Patients Chart - Thống kê bệnh nhân */}
            <TabsContent value="patients" className="space-y-4">
              {/* Error Message */}
              {patientStatsError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 text-red-800">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium mb-2">Lỗi khi tải dữ liệu thống kê bệnh nhân</p>
                        <div className="text-sm text-red-600">{patientStatsError}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {patientStatsLoading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                      <span className="text-muted-foreground">Đang tải dữ liệu thống kê bệnh nhân...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patient Statistics Content */}
              {!patientStatsLoading && !patientStatsError && patientStats && (
                <>
                  {/* Date Range Selector và Total Patients Card cùng hàng */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                      <input
                        type="date"
                        value={patientStatsFrom}
                        onChange={(e) => setPatientStatsFrom(e.target.value)}
                        className="h-9 rounded-md border px-2 text-sm bg-background"
                      />
                      <span className="text-muted-foreground">đến</span>
                      <input
                        type="date"
                        value={patientStatsTo}
                        onChange={(e) => setPatientStatsTo(e.target.value)}
                        className="h-9 rounded-md border px-2 text-sm bg-background"
                      />
                      <button
                        onClick={handlePatientStatsDateChange}
                        className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                        disabled={patientStatsLoading}
                      >
                        Áp dụng
                      </button>
                    </div>
                    {/* Total Patients Card */}
                    <Card className="flex-1 min-w-[200px]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng số bệnh nhân</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{patientStats.totalPatients}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gender and Age Distribution Charts */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Phân bố giới tính</CardTitle>
                        <CardDescription>Hiển thị dưới dạng biểu đồ để dễ so sánh</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {genderChartData.length > 0 && genderChartData.some(d => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                              <Pie
                                data={genderChartData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={2}
                              >
                                {genderChartData.map((entry, index) => (
                                  <Cell key={`gender-${entry.name}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                            Chưa có dữ liệu phân bố giới tính.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Phân bố nhóm tuổi</CardTitle>
                        <CardDescription>Hiển thị dưới dạng biểu đồ để dễ so sánh</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {ageChartData.length > 0 && ageChartData.some(d => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={ageChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                {ageChartData.map((entry, index) => (
                                  <Cell key={`age-${entry.name}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                            Chưa có dữ liệu phân bố nhóm tuổi.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly New Patients Chart */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Bệnh nhân mới theo tháng</CardTitle>
                          <CardDescription>Theo dõi tăng trưởng bệnh nhân trong khoảng thời gian đã chọn</CardDescription>
                        </div>
                        <div className="rounded-full p-2 bg-emerald-100 text-emerald-700">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {patientStats.monthlyNewPatients.length > 0 ? (
                        <ResponsiveContainer width="100%" height={360}>
                          <LineChart data={patientStats.monthlyNewPatients}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                          Không có dữ liệu bệnh nhân mới trong khoảng thời gian này.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Appointments Chart (giữ nguyên) */}
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

            {/* ⭐ Phân tích xét nghiệm & chẩn đoán */}
            <TabsContent value="diagnostics" className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={String(diagnosticRange)} onValueChange={(v) => setDiagnosticRange(parseInt(v, 10))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    {rangeOptions.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={diagnosticGroupBy} onValueChange={(v: any) => setDiagnosticGroupBy(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Nhóm theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Theo ngày</SelectItem>
                    <SelectItem value="month">Theo tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {diagnosticError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 text-red-800">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium mb-2">Không thể tải dữ liệu xét nghiệm & chẩn đoán</p>
                        <div className="text-sm text-red-600 whitespace-pre-line mb-2">{diagnosticError}</div>
                        <p className="text-xs text-red-500">Vui lòng kiểm tra kết nối đến backend và quyền truy cập.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {diagnosticLoading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Đang tải dữ liệu thống kê...
                    </div>
                  </CardContent>
                </Card>
              )}

              {!diagnosticLoading && !diagnosticError && diagnosticStats && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Loại khám theo chuyên khoa</CardTitle>
                        <CardDescription>Số lượt dịch vụ khám (ngoại trừ xét nghiệm) trong {diagnosticRangeLabel}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {visitBarData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={visitBarData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="count" name="Số lượt khám" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                            Chưa có dữ liệu dịch vụ khám trong khoảng này.
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Số lượt xét nghiệm theo loại</CardTitle>
                        <CardDescription>Phân bổ số xét nghiệm đã thực hiện</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {testBarData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={testBarData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="count" name="Số xét nghiệm" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                            Chưa có dữ liệu xét nghiệm trong khoảng này.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Xu hướng khám & xét nghiệm</CardTitle>
                      <CardDescription>Số lượt khám và xét nghiệm theo {diagnosticGroupBy === "day" ? "ngày" : "tháng"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {diagnosticTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={340}>
                          <LineChart data={diagnosticTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="visitCount" name="Lượt khám" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                            <Line type="monotone" dataKey="testCount" name="Lượt xét nghiệm" stroke="hsl(var(--chart-4))" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                          Không có dữ liệu xu hướng trong khoảng thời gian này.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Top dịch vụ khám</CardTitle>
                        <CardDescription>Dựa trên số lượt thực hiện</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {diagnosticStats.topVisitServices.length > 0 ? (
                          diagnosticStats.topVisitServices.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-sm text-muted-foreground">{item.count} lượt</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Top xét nghiệm</CardTitle>
                        <CardDescription>Số lượt thực hiện nhiều nhất</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {diagnosticStats.topTestServices.length > 0 ? (
                          diagnosticStats.topTestServices.map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-sm text-muted-foreground">{item.count} lượt</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>


        </div>
      </DashboardLayout>
    </PageGuard>
  )
}