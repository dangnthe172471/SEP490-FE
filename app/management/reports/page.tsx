"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, FileText, Download, Calendar, TestTube, Building2 } from "lucide-react"
import { useState } from "react"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"

const reports = [
  {
    id: "R001",
    title: "Báo cáo doanh thu tháng 6/2024",
    type: "Tài chính",
    date: "2024-06-30",
    status: "completed",
    size: "2.4 MB",
  },
  {
    id: "R002",
    title: "Báo cáo hoạt động khám bệnh Q2/2024",
    type: "Hoạt động",
    date: "2024-06-30",
    status: "completed",
    size: "1.8 MB",
  },
  {
    id: "R003",
    title: "Báo cáo nhân sự tháng 6/2024",
    type: "Nhân sự",
    date: "2024-06-30",
    status: "completed",
    size: "1.2 MB",
  },
  {
    id: "R004",
    title: "Báo cáo tồn kho thuốc tháng 6/2024",
    type: "Kho thuốc",
    date: "2024-06-30",
    status: "completed",
    size: "0.9 MB",
  },
  {
    id: "R005",
    title: "Báo cáo chất lượng dịch vụ Q2/2024",
    type: "Chất lượng",
    date: "2024-06-30",
    status: "completed",
    size: "3.1 MB",
  },
  {
    id: "R006",
    title: "Báo cáo doanh thu tháng 7/2024",
    type: "Tài chính",
    date: "2024-07-31",
    status: "processing",
    size: "-",
  },
]

export default function ManagementReportsPage() {
  // Get manager navigation from centralized config
  const navigation = getManagerNavigation()

  const [selectedType, setSelectedType] = useState<string>("all")

  const reportTypes = ["all", "Tài chính", "Hoạt động", "Nhân sự", "Kho thuốc", "Chất lượng"]

  const filteredReports = selectedType === "all" ? reports : reports.filter((r) => r.type === selectedType)

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Báo cáo</h1>
            <p className="text-muted-foreground">Quản lý và tải xuống các báo cáo hệ thống</p>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Tạo báo cáo mới
          </Button>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Lọc báo cáo</CardTitle>
            <CardDescription>Chọn loại báo cáo muốn xem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {reportTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type === "all" ? "Tất cả" : type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{report.title}</h3>
                      <Badge variant="outline">{report.id}</Badge>
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary">{report.type}</Badge>
                      <span>•</span>
                      <span>Ngày tạo: {report.date}</span>
                      <span>•</span>
                      <span>Kích thước: {report.size}</span>
                    </div>
                    <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                      {report.status === "completed" ? "Hoàn thành" : "Đang xử lý"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {report.status === "completed" && (
                      <Button size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Tải xuống
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Không có báo cáo nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
