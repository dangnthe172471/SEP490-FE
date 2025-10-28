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

const navigation = [
  { name: "Tổng quan", href: "/management", icon: BarChart3 },
  { name: "Lịch hẹn", href: "/management/appointments", icon: Calendar },
  { name: "Báo cáo", href: "/management/reports", icon: FileText },
  { name: "Lịch làm việc", href: "/management/staff-schedule", icon: CalendarIcon },
  { name: "Lịch phòng khám", href: "/management/clinic-schedule", icon: Clock },
  { name: "Yêu cầu đổi ca", href: "/management/shift-swap-requests", icon: Calendar },
  { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
  { name: "Loại xét nghiệm", href: "/management/test-types", icon: TestTube },
  { name: "Phòng khám", href: "/management/rooms", icon: Building2 },
]

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

const appointmentStatusData = [
  { name: "Hoàn thành", value: 65, color: "hsl(var(--chart-2))" },
  { name: "Đã đặt", value: 20, color: "hsl(var(--chart-1))" },
  { name: "Đã hủy", value: 10, color: "hsl(var(--destructive))" },
  { name: "Không đến", value: 5, color: "hsl(var(--muted))" },
]

const topDoctors = [
  { name: "BS. Trần Văn B", patients: 145, revenue: 87000000, rating: 4.8 },
  { name: "BS. Lê Thị D", patients: 132, revenue: 79200000, rating: 4.9 },
  { name: "BS. Nguyễn Văn A", patients: 128, revenue: 76800000, rating: 4.7 },
  { name: "BS. Phạm Thị C", patients: 115, revenue: 69000000, rating: 4.6 },
  { name: "BS. Hoàng Văn E", patients: 98, revenue: 58800000, rating: 4.5 },
]

export default function ManagementDashboard() {
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
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu & Chi phí</CardTitle>
                <CardDescription>Biểu đồ doanh thu và chi phí 6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="expenses" name="Chi phí" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

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
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái lịch hẹn</CardTitle>
                <CardDescription>Phân bổ trạng thái các lịch hẹn</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
  )
}
