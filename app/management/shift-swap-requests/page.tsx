"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/lib/sweetalert-config"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { ShiftSwapRequestResponse } from "@/lib/types/shift-swap"
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  CalendarDays,
  Clock3,
  ArrowUpDown,
  CheckSquare,
  BarChart3,
  FileText,
  CalendarIcon,
  TrendingUp,
  TestTube,
  Building2
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

const navigation = [
  { name: "Tổng quan", href: "/management", icon: BarChart3 },
  { name: "Báo cáo", href: "/management/reports", icon: FileText },
  { name: "Lịch làm việc", href: "/management/staff-schedule", icon: CalendarIcon },
  { name: "Lịch phòng khám", href: "/management/clinic-schedule", icon: Clock },
  { name: "Yêu cầu đổi ca", href: "/management/shift-swap-requests", icon: Calendar },
  { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
  { name: "Loại xét nghiệm", href: "/management/test-types", icon: TestTube },
  { name: "Phòng khám", href: "/management/rooms", icon: Building2 },
]

export default function ManagerShiftSwapRequestsPage() {
  const [allRequests, setAllRequests] = useState<ShiftSwapRequestResponse[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ShiftSwapRequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedRequests, setSelectedRequests] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    fetchAllRequests()
  }, [])

  useEffect(() => {
    filterAndSortRequests()
  }, [allRequests, searchTerm, statusFilter, sortBy, sortOrder])

  const fetchAllRequests = async () => {
    try {
      setLoading(true)
      const response = await shiftSwapService.getAllRequests()
      setAllRequests(response)
    } catch (error: any) {
      console.error("Error fetching requests:", error)
      const errorMessage = error.message || "Không thể tải danh sách yêu cầu"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortRequests = () => {
    let filtered = [...allRequests]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.doctor1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.doctor2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.doctor1Specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.doctor2Specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "date":
          comparison = new Date(a.exchangeDate).getTime() - new Date(b.exchangeDate).getTime()
          break
        case "doctor1":
          comparison = a.doctor1Name.localeCompare(b.doctor1Name)
          break
        case "doctor2":
          comparison = a.doctor2Name.localeCompare(b.doctor2Name)
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = 0
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredRequests(filtered)
  }

  const handleReviewRequest = async (exchangeId: number, status: "Approved" | "Rejected", note?: string) => {
    try {
      setProcessingId(exchangeId)

      const result = await shiftSwapService.reviewShiftSwapRequest(exchangeId, status, note)

      if (result) {
        const statusText = status === "Approved" ? "chấp nhận" : "từ chối"
        await showSuccessAlert(`Đã ${statusText} yêu cầu đổi ca thành công`)
        fetchAllRequests() // Refresh list
        setSelectedRequests([])
      } else {
        await showErrorAlert("Lỗi", "Không thể cập nhật trạng thái yêu cầu")
      }
    } catch (error: any) {
      console.error("Error reviewing request:", error)
      const errorMessage = error.message || "Có lỗi xảy ra khi xử lý yêu cầu"
      await showErrorAlert("Lỗi", errorMessage)
    } finally {
      setProcessingId(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) return

    const result = await showConfirmAlert(
      "Xác nhận chấp nhận hàng loạt",
      `Bạn có chắc chắn muốn chấp nhận ${selectedRequests.length} yêu cầu đổi ca không?`
    )

    if (result.isConfirmed) {
      try {
        setLoading(true)
        for (const requestId of selectedRequests) {
          await shiftSwapService.reviewShiftSwapRequest(requestId, "Approved")
        }
        await showSuccessAlert(`Đã chấp nhận ${selectedRequests.length} yêu cầu đổi ca`)
        fetchAllRequests()
        setSelectedRequests([])
      } catch (error: any) {
        await showErrorAlert("Lỗi", "Có lỗi xảy ra khi xử lý hàng loạt")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) return

    const result = await showConfirmAlert(
      "Xác nhận từ chối hàng loạt",
      `Bạn có chắc chắn muốn từ chối ${selectedRequests.length} yêu cầu đổi ca không?`
    )

    if (result.isConfirmed) {
      try {
        setLoading(true)
        for (const requestId of selectedRequests) {
          await shiftSwapService.reviewShiftSwapRequest(requestId, "Rejected")
        }
        await showSuccessAlert(`Đã từ chối ${selectedRequests.length} yêu cầu đổi ca`)
        fetchAllRequests()
        setSelectedRequests([])
      } catch (error: any) {
        await showErrorAlert("Lỗi", "Có lỗi xảy ra khi xử lý hàng loạt")
      } finally {
        setLoading(false)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock3 className="w-3 h-3 mr-1" />Chờ duyệt</Badge>
      case "Approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Đã chấp nhận</Badge>
      case "Rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" />Đã từ chối</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSwapTypeText = (swapType?: string) => {
    switch (swapType) {
      case "permanent":
        return "Đổi ca vĩnh viễn"
      case "temporary":
        return "Đổi ca 1 ngày"
      default:
        return "Đổi ca 1 ngày"
    }
  }

  const getSwapTypeIcon = (swapType?: string) => {
    switch (swapType) {
      case "permanent":
        return <CalendarDays className="w-4 h-4" />
      case "temporary":
        return <Clock className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const pendingRequests = filteredRequests.filter(req => req.status === "Pending")
  const approvedRequests = filteredRequests.filter(req => req.status === "Approved")
  const rejectedRequests = filteredRequests.filter(req => req.status === "Rejected")

  if (loading) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách yêu cầu...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quản lý yêu cầu đổi ca</h1>
            <p className="text-muted-foreground">Duyệt và xử lý các yêu cầu đổi ca từ bác sĩ</p>
          </div>
          <Button onClick={fetchAllRequests} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                </div>
                <Clock3 className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đã chấp nhận</p>
                  <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên bác sĩ hoặc chuyên khoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Pending">Chờ duyệt</SelectItem>
                    <SelectItem value="Approved">Đã chấp nhận</SelectItem>
                    <SelectItem value="Rejected">Đã từ chối</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Theo ngày</SelectItem>
                    <SelectItem value="doctor1">Theo bác sĩ 1</SelectItem>
                    <SelectItem value="doctor2">Theo bác sĩ 2</SelectItem>
                    <SelectItem value="status">Theo trạng thái</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedRequests.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Đã chọn {selectedRequests.length} yêu cầu
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Chấp nhận tất cả
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBulkReject}
                    disabled={loading}
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Từ chối tất cả
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRequests([])}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock3 className="w-4 h-4" />
              Chờ duyệt ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Đã chấp nhận ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Đã từ chối ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu chờ duyệt</h3>
                  <p className="text-gray-500">Tất cả yêu cầu đã được xử lý</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <Card key={request.exchangeId} className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedRequests.includes(request.exchangeId)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRequests([...selectedRequests, request.exchangeId])
                              } else {
                                setSelectedRequests(selectedRequests.filter(id => id !== request.exchangeId))
                              }
                            }}
                          />
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {getSwapTypeIcon(request.swapType)}
                              Yêu cầu đổi ca #{request.exchangeId}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getSwapTypeText(request.swapType)}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Bác sĩ 1</h4>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{request.doctor1Name}</p>
                            <p className="text-sm text-gray-600">{request.doctor1Specialty}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {request.doctor1ShiftName}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Bác sĩ 2</h4>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{request.doctor2Name}</p>
                            <p className="text-sm text-gray-600">{request.doctor2Specialty}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {request.doctor2ShiftName}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={processingId === request.exchangeId}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingId === request.exchangeId ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              {processingId === request.exchangeId ? "Đang xử lý..." : "Chấp nhận"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Chấp nhận yêu cầu đổi ca</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn chấp nhận yêu cầu đổi ca này không?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleReviewRequest(request.exchangeId, "Approved")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Chấp nhận
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={processingId === request.exchangeId}
                            >
                              {processingId === request.exchangeId ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              {processingId === request.exchangeId ? "Đang xử lý..." : "Từ chối"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Từ chối yêu cầu đổi ca</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn từ chối yêu cầu đổi ca này không?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleReviewRequest(request.exchangeId, "Rejected")}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Từ chối
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu đã chấp nhận</h3>
                  <p className="text-gray-500">Chưa có yêu cầu nào được chấp nhận</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedRequests.map((request) => (
                  <Card key={request.exchangeId} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getSwapTypeIcon(request.swapType)}
                            Yêu cầu đổi ca #{request.exchangeId}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getSwapTypeText(request.swapType)}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Bác sĩ 1</h4>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{request.doctor1Name}</p>
                            <p className="text-sm text-gray-600">{request.doctor1Specialty}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {request.doctor1ShiftName}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Bác sĩ 2</h4>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{request.doctor2Name}</p>
                            <p className="text-sm text-gray-600">{request.doctor2Specialty}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {request.doctor2ShiftName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu bị từ chối</h3>
                  <p className="text-gray-500">Chưa có yêu cầu nào bị từ chối</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {rejectedRequests.map((request) => (
                  <Card key={request.exchangeId} className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getSwapTypeIcon(request.swapType)}
                            Yêu cầu đổi ca #{request.exchangeId}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getSwapTypeText(request.swapType)}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Bác sĩ 1</h4>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{request.doctor1Name}</p>
                            <p className="text-sm text-gray-600">{request.doctor1Specialty}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {request.doctor1ShiftName}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Bác sĩ 2</h4>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{request.doctor2Name}</p>
                            <p className="text-sm text-gray-600">{request.doctor2Specialty}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {request.doctor2ShiftName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}