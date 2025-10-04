"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Package, ShoppingCart, Pill, Search, AlertTriangle, Plus } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/pharmacy", icon: Activity },
  { name: "Đơn thuốc", href: "/pharmacy/prescriptions", icon: ShoppingCart },
  { name: "Kho thuốc", href: "/pharmacy/inventory", icon: Package },
  { name: "Thuốc", href: "/pharmacy/medicines", icon: Pill },
]

// Mock inventory data
const mockInventory = [
  {
    id: "M001",
    name: "Paracetamol 500mg",
    category: "Giảm đau - Hạ sốt",
    stock: 50,
    minStock: 200,
    unit: "viên",
    price: 500,
    expiryDate: "2025-12-31",
    supplier: "Công ty Dược phẩm ABC",
  },
  {
    id: "M002",
    name: "Amoxicillin 500mg",
    category: "Kháng sinh",
    stock: 30,
    minStock: 150,
    unit: "viên",
    price: 1200,
    expiryDate: "2025-06-30",
    supplier: "Công ty Dược phẩm XYZ",
  },
  {
    id: "M003",
    name: "Vitamin C 1000mg",
    category: "Vitamin & Khoáng chất",
    stock: 80,
    minStock: 300,
    unit: "viên",
    price: 800,
    expiryDate: "2026-03-31",
    supplier: "Công ty Dược phẩm DEF",
  },
  {
    id: "M004",
    name: "Ibuprofen 400mg",
    category: "Giảm đau - Hạ sốt",
    stock: 250,
    minStock: 200,
    unit: "viên",
    price: 1500,
    expiryDate: "2025-09-30",
    supplier: "Công ty Dược phẩm ABC",
  },
  {
    id: "M005",
    name: "Omeprazole 20mg",
    category: "Tiêu hóa",
    stock: 180,
    minStock: 150,
    unit: "viên",
    price: 2000,
    expiryDate: "2025-11-30",
    supplier: "Công ty Dược phẩm XYZ",
  },
]

export default function PharmacyInventoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredInventory = mockInventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const lowStockItems = filteredInventory.filter((item) => item.stock < item.minStock)
  const normalStockItems = filteredInventory.filter((item) => item.stock >= item.minStock)

  const getStockStatus = (stock: number, minStock: number) => {
    const percentage = (stock / minStock) * 100
    if (percentage < 50) return { label: "Rất thấp", variant: "destructive" as const }
    if (percentage < 100) return { label: "Thấp", variant: "secondary" as const }
    return { label: "Đủ", variant: "outline" as const }
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý kho thuốc</h1>
            <p className="text-muted-foreground">Theo dõi tồn kho và nhập xuất thuốc</p>
          </div>
          <Button onClick={() => router.push("/pharmacy/inventory/import")}>
            <Plus className="mr-2 h-4 w-4" />
            Nhập thuốc
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng loại thuốc</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockInventory.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tồn kho thấp</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tồn kho tốt</CardTitle>
              <Activity className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{normalStockItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giá trị kho</CardTitle>
              <Package className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(mockInventory.reduce((sum, item) => sum + item.stock * item.price, 0) / 1000000).toFixed(1)}M
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm thuốc</CardTitle>
            <CardDescription>Tìm theo tên, mã thuốc hoặc danh mục</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nhập tên thuốc, mã thuốc hoặc danh mục..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Cảnh báo tồn kho thấp
              </CardTitle>
              <CardDescription>Các loại thuốc cần nhập thêm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => {
                  const status = getStockStatus(item.stock, item.minStock)
                  return (
                    <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge variant="outline">{item.id}</Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-destructive font-medium">
                            Tồn: {item.stock} {item.unit}
                          </span>
                          <span className="text-muted-foreground">
                            Tối thiểu: {item.minStock} {item.unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">HSD: {item.expiryDate}</p>
                      </div>
                      <Button size="sm" onClick={() => router.push(`/pharmacy/inventory/import?medicineId=${item.id}`)}>
                        Nhập thêm
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Normal Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thuốc trong kho</CardTitle>
            <CardDescription>Tất cả thuốc có sẵn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInventory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Không tìm thấy thuốc nào</p>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item.stock, item.minStock)
                  return (
                    <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge variant="outline">{item.id}</Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="font-medium">
                            Tồn: {item.stock} {item.unit}
                          </span>
                          <span className="text-muted-foreground">
                            Giá: {item.price.toLocaleString()}đ/{item.unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          HSD: {item.expiryDate} • {item.supplier}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/pharmacy/medicines/${item.id}`)}
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
