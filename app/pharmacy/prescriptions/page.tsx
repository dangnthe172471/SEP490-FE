"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Package, ShoppingCart, Pill, Clock, User } from "lucide-react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Tổng quan", href: "/pharmacy", icon: Activity },
  { name: "Đơn thuốc", href: "/pharmacy/prescriptions", icon: ShoppingCart },
  { name: "Kho thuốc", href: "/pharmacy/inventory", icon: Package },
  { name: "Thuốc", href: "/pharmacy/medicines", icon: Pill },
]

// Mock prescriptions
const mockPrescriptions = [
  {
    id: "DT001",
    patientName: "Nguyễn Văn A",
    patientId: "BN001",
    doctorName: "BS. Trần Văn B",
    status: "pending",
    createdAt: "2024-01-15 09:30",
    items: [
      { name: "Paracetamol 500mg", quantity: 20, unit: "viên", dosage: "1 viên x 3 lần/ngày" },
      { name: "Amoxicillin 500mg", quantity: 15, unit: "viên", dosage: "1 viên x 2 lần/ngày" },
      { name: "Vitamin C 1000mg", quantity: 30, unit: "viên", dosage: "1 viên x 1 lần/ngày" },
    ],
    total: 285000,
  },
  {
    id: "DT002",
    patientName: "Trần Thị C",
    patientId: "BN002",
    doctorName: "BS. Lê Thị D",
    status: "pending",
    createdAt: "2024-01-15 10:00",
    items: [
      { name: "Ibuprofen 400mg", quantity: 10, unit: "viên", dosage: "1 viên khi đau" },
      { name: "Omeprazole 20mg", quantity: 14, unit: "viên", dosage: "1 viên x 1 lần/ngày" },
    ],
    total: 180000,
  },
  {
    id: "DT003",
    patientName: "Phạm Văn E",
    patientId: "BN003",
    doctorName: "BS. Hoàng Văn F",
    status: "processing",
    createdAt: "2024-01-15 10:30",
    items: [
      { name: "Metformin 500mg", quantity: 60, unit: "viên", dosage: "1 viên x 2 lần/ngày" },
      { name: "Atorvastatin 10mg", quantity: 30, unit: "viên", dosage: "1 viên x 1 lần/ngày" },
      { name: "Aspirin 100mg", quantity: 30, unit: "viên", dosage: "1 viên x 1 lần/ngày" },
      { name: "Losartan 50mg", quantity: 30, unit: "viên", dosage: "1 viên x 1 lần/ngày" },
    ],
    total: 520000,
  },
  {
    id: "DT004",
    patientName: "Lê Thị G",
    patientId: "BN004",
    doctorName: "BS. Nguyễn Văn H",
    status: "completed",
    createdAt: "2024-01-15 08:00",
    items: [{ name: "Cetirizine 10mg", quantity: 10, unit: "viên", dosage: "1 viên x 1 lần/ngày" }],
    total: 45000,
  },
]

export default function PharmacyPrescriptionsPage() {
  const router = useRouter()

  const pendingPrescriptions = mockPrescriptions.filter((p) => p.status === "pending")
  const processingPrescriptions = mockPrescriptions.filter((p) => p.status === "processing")
  const completedPrescriptions = mockPrescriptions.filter((p) => p.status === "completed")

  const PrescriptionCard = ({ prescription }: { prescription: (typeof mockPrescriptions)[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{prescription.id}</h3>
                <Badge
                  variant={
                    prescription.status === "pending"
                      ? "secondary"
                      : prescription.status === "processing"
                        ? "default"
                        : "outline"
                  }
                >
                  {prescription.status === "pending"
                    ? "Chờ xử lý"
                    : prescription.status === "processing"
                      ? "Đang xử lý"
                      : "Hoàn thành"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{prescription.patientName}</span>
                </div>
                <Badge variant="outline">{prescription.patientId}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{prescription.doctorName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{prescription.createdAt}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="text-xl font-bold text-primary">{prescription.total.toLocaleString()}đ</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Danh sách thuốc ({prescription.items.length} loại)</p>
            <div className="space-y-2">
              {prescription.items.map((item, index) => (
                <div key={index} className="flex items-start justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.dosage}</p>
                  </div>
                  <p className="text-muted-foreground">
                    {item.quantity} {item.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              variant={prescription.status === "pending" ? "default" : "outline"}
              onClick={() => router.push(`/pharmacy/prescriptions/${prescription.id}`)}
            >
              {prescription.status === "pending" ? "Xử lý" : "Xem chi tiết"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn thuốc</h1>
          <p className="text-muted-foreground">Xử lý và theo dõi đơn thuốc</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Chờ xử lý ({pendingPrescriptions.length})</TabsTrigger>
            <TabsTrigger value="processing">Đang xử lý ({processingPrescriptions.length})</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành ({completedPrescriptions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingPrescriptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có đơn thuốc chờ xử lý</p>
                </CardContent>
              </Card>
            ) : (
              pendingPrescriptions.map((prescription) => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))
            )}
          </TabsContent>

          <TabsContent value="processing" className="space-y-4">
            {processingPrescriptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có đơn thuốc đang xử lý</p>
                </CardContent>
              </Card>
            ) : (
              processingPrescriptions.map((prescription) => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedPrescriptions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Không có đơn thuốc hoàn thành</p>
                </CardContent>
              </Card>
            ) : (
              completedPrescriptions.map((prescription) => (
                <PrescriptionCard key={prescription.id} prescription={prescription} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
