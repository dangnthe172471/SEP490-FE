"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Package, ShoppingCart, AlertTriangle, Pill, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/pharmacy", icon: Activity },
  { name: "Đơn thuốc", href: "/pharmacy/prescriptions", icon: ShoppingCart },
  { name: "Kho thuốc", href: "/pharmacy/inventory", icon: Package },
  { name: "Thuốc", href: "/pharmacy/medicines", icon: Pill },
]

// Mock data
const mockPrescriptions = [
  {
    id: "DT001",
    patientName: "Nguyễn Văn A",
    patientId: "BN001",
    doctorName: "BS. Trần Văn B",
    status: "pending",
    createdAt: "2024-01-15 09:30",
    items: 3,
  },
  {
    id: "DT002",
    patientName: "Trần Thị C",
    patientId: "BN002",
    doctorName: "BS. Lê Thị D",
    status: "pending",
    createdAt: "2024-01-15 10:00",
    items: 2,
  },
  {
    id: "DT003",
    patientName: "Phạm Văn E",
    patientId: "BN003",
    doctorName: "BS. Hoàng Văn F",
    status: "processing",
    createdAt: "2024-01-15 10:30",
    items: 4,
  },
]

export default function PharmacyDashboard() {
  const router = useRouter()

  const pendingPrescriptions = mockPrescriptions.filter((p) => p.status === "pending")
  const processingPrescriptions = mockPrescriptions.filter((p) => p.status === "processing")

  const stats = [
    {
      title: "Đơn thuốc chờ",
      value: pendingPrescriptions.length.toString(),
      icon: ShoppingCart,
      color: "text-chart-4",
    },
    {
      title: "Đang xử lý",
      value: processingPrescriptions.length.toString(),
      icon: Activity,
      color: "text-primary",
    },
    {
      title: "Thuốc sắp hết",
      value: "12",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Doanh thu hôm nay",
      value: "8.5M",
      icon: TrendingUp,
      color: "text-chart-2",
    },
  ]

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Nhà thuốc</h1>
          <p className="text-muted-foreground">Quản lý đơn thuốc và kho thuốc</p>
        </div>

        {/* Statistics */}
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
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Đơn thuốc chờ xử lý</CardTitle>
              <CardDescription>Đơn thuốc cần chuẩn bị</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPrescriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Không có đơn thuốc nào</p>
                ) : (
                  pendingPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prescription.id}</span>
                          <Badge variant="secondary">Chờ xử lý</Badge>
                        </div>
                        <p className="text-sm font-medium">{prescription.patientName}</p>
                        <p className="text-sm text-muted-foreground">{prescription.doctorName}</p>
                        <p className="text-xs text-muted-foreground">{prescription.items} loại thuốc</p>
                      </div>
                      <Button size="sm" onClick={() => router.push(`/pharmacy/prescriptions/${prescription.id}`)}>
                        Xử lý
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processing Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Đang xử lý</CardTitle>
              <CardDescription>Đơn thuốc đang chuẩn bị</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processingPrescriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Không có đơn thuốc nào</p>
                ) : (
                  processingPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prescription.id}</span>
                          <Badge>Đang xử lý</Badge>
                        </div>
                        <p className="text-sm font-medium">{prescription.patientName}</p>
                        <p className="text-sm text-muted-foreground">{prescription.doctorName}</p>
                        <p className="text-xs text-muted-foreground">{prescription.items} loại thuốc</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/pharmacy/prescriptions/${prescription.id}`)}
                      >
                        Xem
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các chức năng thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto py-4 flex-col gap-2" onClick={() => router.push("/pharmacy/prescriptions")}>
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm">Quản lý đơn thuốc</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 bg-transparent"
                onClick={() => router.push("/pharmacy/inventory")}
              >
                <Package className="h-5 w-5" />
                <span className="text-sm">Kiểm tra kho</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 bg-transparent"
                onClick={() => router.push("/pharmacy/medicines")}
              >
                <Pill className="h-5 w-5" />
                <span className="text-sm">Danh mục thuốc</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2 bg-transparent"
                onClick={() => router.push("/pharmacy/inventory?filter=low-stock")}
              >
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">Thuốc sắp hết</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cảnh báo tồn kho
            </CardTitle>
            <CardDescription>Các loại thuốc cần nhập thêm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Paracetamol 500mg", stock: 50, minStock: 200, unit: "viên" },
                { name: "Amoxicillin 500mg", stock: 30, minStock: 150, unit: "viên" },
                { name: "Vitamin C 1000mg", stock: 80, minStock: 300, unit: "viên" },
              ].map((medicine, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{medicine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Tồn kho: {medicine.stock} {medicine.unit} / Tối thiểu: {medicine.minStock} {medicine.unit}
                    </p>
                  </div>
                  <Badge variant="destructive">Sắp hết</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
