"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, Users, CheckCircle, XCircle, AlertCircle, Calendar, User } from "lucide-react"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import type { ShiftSwapRequestResponse, ReviewShiftSwapRequest } from "@/lib/types/shift-swap"

const navigation = [
  { name: "Tổng quan", href: "/management", icon: Calendar },
  { name: "Yêu cầu đổi ca", href: "/management/shift-swap-requests", icon: Clock },
  { name: "Lịch phòng khám", href: "/management/clinic-schedule", icon: Calendar },
  { name: "Lịch nhân viên", href: "/management/staff-schedule", icon: Users },
  { name: "Phòng khám", href: "/management/rooms", icon: Users },
  { name: "Loại xét nghiệm", href: "/management/test-types", icon: Users },
  { name: "Thuốc", href: "/management/medicines", icon: Users },
  { name: "Báo cáo", href: "/management/reports", icon: Users },
  { name: "Phân tích", href: "/management/analytics", icon: Users },
]

export default function ShiftSwapRequestsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [requests, setRequests] = useState<ShiftSwapRequestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    request: ShiftSwapRequestResponse | null
    action: "approve" | "reject" | null
  }>({
    open: false,
    request: null,
    action: null
  })
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
      fetchPendingRequests()
    }
  }, [])

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const pendingRequests = await shiftSwapService.getPendingRequests()
      setRequests(pendingRequests)
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      toast.error("Không thể tải danh sách yêu cầu")
    } finally {
      setLoading(false)
    }
  }

  const openReviewDialog = (request: ShiftSwapRequestResponse, action: "approve" | "reject") => {
    setReviewDialog({
      open: true,
      request,
      action
    })
  }

  const closeReviewDialog = () => {
    setReviewDialog({
      open: false,
      request: null,
      action: null
    })
  }

  const handleReview = async () => {
    if (!reviewDialog.request || !reviewDialog.action) return

    try {
      setReviewing(true)

      const review: ReviewShiftSwapRequest = {
        exchangeId: reviewDialog.request.exchangeId,
        status: reviewDialog.action === "approve" ? "Approved" : "Rejected"
      }

      await shiftSwapService.reviewShiftSwapRequest(review)

      const actionText = reviewDialog.action === "approve" ? "chấp nhận" : "từ chối"
      toast.success(`Đã ${actionText} yêu cầu đổi ca`)

      closeReviewDialog()
      fetchPendingRequests()
    } catch (error) {
      console.error('Error reviewing request:', error)
      toast.error("Không thể xử lý yêu cầu")
    } finally {
      setReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>
      case "Approved":
        return <Badge variant="default" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Đã chấp nhận</Badge>
      case "Rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Duyệt yêu cầu đổi ca</h1>
          <p className="text-muted-foreground">Xem xét và duyệt các yêu cầu đổi ca của bác sĩ</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Yêu cầu chờ duyệt
            </CardTitle>
            <CardDescription>
              Danh sách các yêu cầu đổi ca cần được xem xét
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : requests.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Không có yêu cầu đổi ca nào chờ duyệt
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.exchangeId} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Yêu cầu đổi ca giữa {request.doctor1Name} và {request.doctor2Name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Chuyên khoa: {request.doctor1Specialty}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {request.doctor1Name}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Ca hiện tại:</strong> {request.doctor1ShiftName}</p>
                          <p><strong>Chuyên khoa:</strong> {request.doctor1Specialty}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {request.doctor2Name}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Ca muốn đổi:</strong> {request.doctor2ShiftName}</p>
                          <p><strong>Chuyên khoa:</strong> {request.doctor2Specialty}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p><strong>Ngày đổi ca:</strong> {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => openReviewDialog(request, "approve")}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Chấp nhận
                      </Button>
                      <Button
                        onClick={() => openReviewDialog(request, "reject")}
                        variant="destructive"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Từ chối
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialog.open} onOpenChange={closeReviewDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {reviewDialog.action === "approve" ? "Chấp nhận" : "Từ chối"} yêu cầu đổi ca
              </DialogTitle>
              <DialogDescription>
                {reviewDialog.action === "approve"
                  ? "Bạn có chắc chắn muốn chấp nhận yêu cầu đổi ca này?"
                  : "Bạn có chắc chắn muốn từ chối yêu cầu đổi ca này?"
                }
              </DialogDescription>
            </DialogHeader>

            {reviewDialog.request && (
              <div className="space-y-4">
                <div className="text-sm">
                  <p><strong>Bác sĩ 1:</strong> {reviewDialog.request.doctor1Name}</p>
                  <p><strong>Bác sĩ 2:</strong> {reviewDialog.request.doctor2Name}</p>
                  <p><strong>Ngày đổi:</strong> {new Date(reviewDialog.request.exchangeDate).toLocaleDateString('vi-VN')}</p>
                </div>

              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeReviewDialog}>
                Hủy
              </Button>
              <Button
                onClick={handleReview}
                disabled={reviewing}
                className={reviewDialog.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                }
              >
                {reviewing ? "Đang xử lý..." : (reviewDialog.action === "approve" ? "Chấp nhận" : "Từ chối")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
