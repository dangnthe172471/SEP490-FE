"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, FileText, Users, Clock, DollarSign, Activity, TestTube, Building2 } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"

// Mock data for detailed analytics
const hourlyPatientData = [
  { hour: "8h", patients: 12 },
  { hour: "9h", patients: 18 },
  { hour: "10h", patients: 25 },
  { hour: "11h", patients: 22 },
  { hour: "12h", patients: 8 },
  { hour: "13h", patients: 15 },
  { hour: "14h", patients: 28 },
  { hour: "15h", patients: 24 },
  { hour: "16h", patients: 20 },
  { hour: "17h", patients: 16 },
]

const weeklyTrendData = [
  { day: "T2", appointments: 45, completed: 42, cancelled: 3 },
  { day: "T3", appointments: 52, completed: 48, cancelled: 4 },
  { day: "T4", appointments: 48, completed: 45, cancelled: 3 },
  { day: "T5", appointments: 61, completed: 56, cancelled: 5 },
  { day: "T6", appointments: 55, completed: 51, cancelled: 4 },
  { day: "T7", appointments: 38, completed: 35, cancelled: 3 },
  { day: "CN", appointments: 25, completed: 23, cancelled: 2 },
]

const serviceRevenueData = [
  { service: "Khám bệnh", revenue: 35000000 },
  { service: "Xét nghiệm", revenue: 18000000 },
  { service: "Siêu âm", revenue: 12000000 },
  { service: "X-quang", revenue: 8000000 },
  { service: "Thuốc", revenue: 22000000 },
]

const patientAgeData = [
  { age: "0-18", count: 120 },
  { age: "19-35", count: 280 },
  { age: "36-50", count: 350 },
  { age: "51-65", count: 220 },
  { age: "65+", count: 180 },
]

const satisfactionData = [
  { month: "T1", score: 4.2 },
  { month: "T2", score: 4.3 },
  { month: "T3", score: 4.4 },
  { month: "T4", score: 4.5 },
  { month: "T5", score: 4.6 },
  { month: "T6", score: 4.7 },
]

export default function ManagementAnalyticsPage() {
  // Get manager navigation from centralized config
  const navigation = getManagerNavigation()

  const insights = [
    {
      title: "Giờ cao điểm",
      value: "14:00 - 15:00",
      description: "Thời gian có nhiều bệnh nhân nhất",
      icon: Clock,
      color: "text-chart-1",
    },
    {
      title: "Dịch vụ phổ biến",
      value: "Khám bệnh",
      description: "Chiếm 35% tổng doanh thu",
      icon: Activity,
      color: "text-chart-2",
    },
    {
      title: "Độ tuổi chính",
      value: "36-50 tuổi",
      description: "Nhóm bệnh nhân đông nhất",
      icon: Users,
      color: "text-chart-3",
    },
    {
      title: "Doanh thu TB/BN",
      value: "1.200.000 ₫",
      description: "Tăng 8% so với tháng trước",
      icon: DollarSign,
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
          <h1 className="text-3xl font-bold tracking-tight">Phân tích chi tiết</h1>
          <p className="text-muted-foreground">Thông tin chuyên sâu về hoạt động phòng khám</p>
        </div>

        {/* Key Insights */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight) => {
            const Icon = insight.icon
            return (
              <Card key={insight.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${insight.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insight.value}</div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue="hourly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hourly">Theo giờ</TabsTrigger>
            <TabsTrigger value="weekly">Theo tuần</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
            <TabsTrigger value="demographics">Nhân khẩu</TabsTrigger>
            <TabsTrigger value="satisfaction">Hài lòng</TabsTrigger>
          </TabsList>

          {/* Hourly Analysis */}
          <TabsContent value="hourly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân bổ bệnh nhân theo giờ</CardTitle>
                <CardDescription>Số lượng bệnh nhân trong ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={hourlyPatientData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      name="Bệnh nhân"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Trends */}
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng theo tuần</CardTitle>
                <CardDescription>Lịch hẹn và tỷ lệ hoàn thành trong tuần</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={weeklyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" name="Tổng lịch hẹn" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="completed" name="Hoàn thành" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="cancelled" name="Đã hủy" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Revenue */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo dịch vụ</CardTitle>
                <CardDescription>Phân tích doanh thu từng loại dịch vụ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={serviceRevenueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${value / 1000000}M`} />
                    <YAxis dataKey="service" type="category" width={100} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="revenue" name="Doanh thu" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demographics */}
          <TabsContent value="demographics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phân bổ độ tuổi</CardTitle>
                <CardDescription>Số lượng bệnh nhân theo nhóm tuổi</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={patientAgeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Số bệnh nhân" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Satisfaction */}
          <TabsContent value="satisfaction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chỉ số hài lòng</CardTitle>
                <CardDescription>Điểm đánh giá trung bình của bệnh nhân</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={satisfactionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Điểm hài lòng"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt hiệu suất</CardTitle>
            <CardDescription>Các chỉ số quan trọng trong tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành lịch hẹn</p>
                <p className="text-2xl font-bold">92%</p>
                <Badge variant="default">Xuất sắc</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Thời gian chờ trung bình</p>
                <p className="text-2xl font-bold">15 phút</p>
                <Badge variant="default">Tốt</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tỷ lệ bệnh nhân quay lại</p>
                <p className="text-2xl font-bold">68%</p>
                <Badge variant="secondary">Khá</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Doanh thu/Bệnh nhân</p>
                <p className="text-2xl font-bold">1.2M ₫</p>
                <Badge variant="default">Tăng 8%</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tỷ lệ sử dụng phòng khám</p>
                <p className="text-2xl font-bold">85%</p>
                <Badge variant="default">Hiệu quả</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Điểm hài lòng trung bình</p>
                <p className="text-2xl font-bold">4.7/5.0</p>
                <Badge variant="default">Xuất sắc</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
