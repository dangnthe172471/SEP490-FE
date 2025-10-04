"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Package, ShoppingCart, Pill, Search, Plus } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/pharmacy", icon: Activity },
  { name: "Đơn thuốc", href: "/pharmacy/prescriptions", icon: ShoppingCart },
  { name: "Kho thuốc", href: "/pharmacy/inventory", icon: Package },
  { name: "Thuốc", href: "/pharmacy/medicines", icon: Pill },
]

// Mock medicines data
const mockMedicines = [
  {
    id: "M001",
    name: "Paracetamol 500mg",
    category: "pain-relief",
    activeIngredient: "Paracetamol",
    manufacturer: "Công ty Dược phẩm ABC",
    dosageForm: "Viên nén",
    description: "Thuốc giảm đau, hạ sốt",
    indications: "Đau đầu, sốt, đau răng, đau cơ",
    contraindications: "Suy gan nặng, dị ứng với paracetamol",
    sideEffects: "Hiếm gặp: buồn nôn, phát ban",
    price: 500,
  },
  {
    id: "M002",
    name: "Amoxicillin 500mg",
    category: "antibiotic",
    activeIngredient: "Amoxicillin",
    manufacturer: "Công ty Dược phẩm XYZ",
    dosageForm: "Viên nang",
    description: "Kháng sinh nhóm penicillin",
    indications: "Nhiễm khuẩn đường hô hấp, tai mũi họng",
    contraindications: "Dị ứng với penicillin",
    sideEffects: "Tiêu chảy, buồn nôn, phát ban",
    price: 1200,
  },
  {
    id: "M003",
    name: "Vitamin C 1000mg",
    category: "vitamin",
    activeIngredient: "Acid ascorbic",
    manufacturer: "Công ty Dược phẩm DEF",
    dosageForm: "Viên sủi",
    description: "Bổ sung vitamin C",
    indications: "Thiếu vitamin C, tăng sức đề kháng",
    contraindications: "Sỏi thận",
    sideEffects: "Hiếm gặp: đau bụng, tiêu chảy",
    price: 800,
  },
  {
    id: "M004",
    name: "Ibuprofen 400mg",
    category: "pain-relief",
    activeIngredient: "Ibuprofen",
    manufacturer: "Công ty Dược phẩm ABC",
    dosageForm: "Viên nén bao phim",
    description: "Thuốc giảm đau, chống viêm",
    indications: "Đau đầu, đau răng, đau khớp, sốt",
    contraindications: "Loét dạ dày, suy thận nặng",
    sideEffects: "Đau bụng, buồn nôn, chóng mặt",
    price: 1500,
  },
  {
    id: "M005",
    name: "Omeprazole 20mg",
    category: "digestive",
    activeIngredient: "Omeprazole",
    manufacturer: "Công ty Dược phẩm XYZ",
    dosageForm: "Viên nang",
    description: "Thuốc ức chế bơm proton",
    indications: "Loét dạ dày, trào ngược dạ dày thực quản",
    contraindications: "Dị ứng với omeprazole",
    sideEffects: "Đau đầu, tiêu chảy, buồn nôn",
    price: 2000,
  },
]

export default function PharmacyMedicinesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    { value: "all", label: "Tất cả", count: mockMedicines.length },
    { value: "pain-relief", label: "Giảm đau - Hạ sốt", count: 2 },
    { value: "antibiotic", label: "Kháng sinh", count: 1 },
    { value: "vitamin", label: "Vitamin & Khoáng chất", count: 1 },
    { value: "digestive", label: "Tiêu hóa", count: 1 },
  ]

  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredMedicines = mockMedicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === "all" || medicine.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Danh mục thuốc</h1>
            <p className="text-muted-foreground">Thông tin chi tiết về các loại thuốc</p>
          </div>
          <Button onClick={() => router.push("/pharmacy/medicines/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm thuốc mới
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm thuốc</CardTitle>
            <CardDescription>Tìm theo tên, mã thuốc hoặc hoạt chất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nhập tên thuốc, mã thuốc hoặc hoạt chất..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label} ({category.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {filteredMedicines.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không tìm thấy thuốc nào</p>
                </CardContent>
              </Card>
            ) : (
              filteredMedicines.map((medicine) => (
                <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{medicine.name}</h3>
                            <Badge variant="outline">{medicine.id}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{medicine.description}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{medicine.dosageForm}</Badge>
                            <Badge variant="outline">{medicine.price.toLocaleString()}đ</Badge>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/pharmacy/medicines/${medicine.id}`)}>
                          Chi tiết
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm font-medium mb-1">Hoạt chất</p>
                          <p className="text-sm text-muted-foreground">{medicine.activeIngredient}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Nhà sản xuất</p>
                          <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Chỉ định</p>
                          <p className="text-sm text-muted-foreground">{medicine.indications}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Chống chỉ định</p>
                          <p className="text-sm text-muted-foreground">{medicine.contraindications}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
