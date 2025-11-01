"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import { showErrorAlert, showSuccessAlert } from "@/lib/sweetalert-config"
import type { CreateShiftSwapRequest, ShiftSwapRequestResponse, DoctorShift, Doctor } from "@/lib/types/shift-swap"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"

export default function DoctorShiftSwapPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Get doctor navigation from centralized config
    const navigation = getDoctorNavigation()

    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [myShifts, setMyShifts] = useState<DoctorShift[]>([])
    const [targetShifts, setTargetShifts] = useState<DoctorShift[]>([])
    const [myRequests, setMyRequests] = useState<ShiftSwapRequestResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [doctorsLoading, setDoctorsLoading] = useState(false)
    const [requestsLoading, setRequestsLoading] = useState(false)

    const [swapType, setSwapType] = useState<"temporary" | "permanent">("temporary")
    const [formData, setFormData] = useState({
        targetDoctorId: "",
        myShiftId: "",
        targetShiftId: "",
        exchangeDate: ""
    })

    // Tính toán phạm vi ngày hợp lệ (giao của 2 khoảng ca và không trước ngày mai)
    const selectedMyShift = myShifts.find(s => s.doctorShiftId.toString() === formData.myShiftId)
    const selectedTargetShift = targetShifts.find(s => s.doctorShiftId.toString() === formData.targetShiftId)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    tomorrow.setHours(0, 0, 0, 0)

    const parseDateOnly = (value?: string) => value ? new Date(value) : undefined
    const formatDateOnly = (d?: Date) => d ? d.toISOString().split('T')[0] : undefined

    const myFrom = parseDateOnly(selectedMyShift?.effectiveFrom)
    const myTo = parseDateOnly(selectedMyShift?.effectiveTo)
    const targetFrom = parseDateOnly(selectedTargetShift?.effectiveFrom)
    const targetTo = parseDateOnly(selectedTargetShift?.effectiveTo)

    // minDate = max(tomorrow, myFrom, targetFrom)
    const minCandidates: Date[] = [tomorrow]
    if (myFrom) minCandidates.push(myFrom)
    if (targetFrom) minCandidates.push(targetFrom)
    const computedMinDate = minCandidates.reduce((max, d) => d > max ? d : max)

    // maxDate = min(myTo, targetTo) — chỉ tính khi cả hai có giá trị
    let computedMaxDate: Date | undefined = undefined
    if (myTo && targetTo) {
        computedMaxDate = myTo < targetTo ? myTo : targetTo
    } else if (myTo) {
        computedMaxDate = myTo
    } else if (targetTo) {
        computedMaxDate = targetTo
    }

    const minDateStr = formatDateOnly(computedMinDate)
    const maxDateStr = formatDateOnly(computedMaxDate)
    const isRangeValid = !computedMaxDate || (computedMinDate <= computedMaxDate)

    useEffect(() => {
        const user = getCurrentUser()
        if (user) {
            setCurrentUser(user)
        }
    }, [])

    useEffect(() => {
        if (currentUser) {
            fetchMyShifts()
            fetchMyRequests()
            fetchDoctorsBySpecialty()
        }
    }, [currentUser])

    const fetchDoctorsBySpecialty = async () => {
        if (!currentUser) return

        try {
            setDoctorsLoading(true)
            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))

            const myShifts = await shiftSwapService.getDoctorShifts(doctorId, new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0])

            let specialty = "Tim Mạch" // Default fallback
            if (myShifts.length > 0 && myShifts[0].specialty) {
                specialty = myShifts[0].specialty
            }

            const doctorsList = await shiftSwapService.getDoctorsBySpecialty(specialty)
            const otherDoctors = doctorsList.filter(doctor => doctor.doctorID !== doctorId)
            setDoctors(otherDoctors)

            if (otherDoctors.length === 0) {
                await showErrorAlert("Thông báo", "Không có bác sĩ nào khác trong cùng chuyên khoa")
            }
        } catch (error) {
            console.error('Error fetching doctors by specialty:', error)
            await showErrorAlert("Lỗi", "Không thể tải danh sách bác sĩ: " + (error as Error).message)
        } finally {
            setDoctorsLoading(false)
        }
    }

    const fetchMyShifts = async () => {
        if (!currentUser) return

        try {
            setLoading(true)
            const from = new Date().toISOString().split('T')[0]
            const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now

            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))
            const allShifts = await shiftSwapService.getDoctorShifts(doctorId, from, to)

            // Chỉ lấy lịch có status "Active"
            const activeShifts = allShifts.filter(shift => shift.status === "Active")
            setMyShifts(activeShifts)

            if (activeShifts.length === 0) {
                await showErrorAlert("Thông báo", "Bạn chưa có ca làm việc nào đang hoạt động trong khoảng thời gian này")
            }
        } catch (error) {
            console.error('Error fetching shifts:', error)
            await showErrorAlert("Lỗi", "Không thể tải lịch làm việc: " + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    const fetchMyRequests = async () => {
        if (!currentUser) return

        try {
            setRequestsLoading(true)
            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))
            const requests = await shiftSwapService.getRequestsByDoctorId(doctorId)
            setMyRequests(requests)
        } catch (error) {
            console.error('Error fetching requests:', error)
            await showErrorAlert("Lỗi", "Không thể tải yêu cầu đổi ca: " + (error as Error).message)
        } finally {
            setRequestsLoading(false)
        }
    }

    const handleTargetDoctorChange = async (doctorId: string) => {
        if (!doctorId) {
            setTargetShifts([])
            return
        }

        try {
            setDoctorsLoading(true)
            const doctor = doctors.find(d => d.doctorID.toString() === doctorId)
            if (!doctor) return

            const from = new Date().toISOString().split('T')[0]
            const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            const allShifts = await shiftSwapService.getDoctorShifts(parseInt(doctorId), from, to)

            // Chỉ lấy lịch có status "Active"
            const activeShifts = allShifts.filter(shift => shift.status === "Active")
            setTargetShifts(activeShifts)
        } catch (error) {
            console.error('Error fetching target doctor shifts:', error)
            await showErrorAlert("Lỗi", "Không thể tải lịch làm việc của bác sĩ: " + (error as Error).message)
        } finally {
            setDoctorsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentUser) {
            toast.error("Vui lòng đăng nhập")
            return
        }

        if (!formData.targetDoctorId || !formData.myShiftId || !formData.targetShiftId) {
            toast.error("Vui lòng điền đầy đủ thông tin")
            return
        }

        if (!formData.exchangeDate) {
            toast.error("Vui lòng chọn ngày đổi ca")
            return
        }

        try {
            setLoading(true)

            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))

            const request: CreateShiftSwapRequest = {
                doctor1Id: doctorId,
                doctor2Id: parseInt(formData.targetDoctorId),
                doctor1ShiftRefId: parseInt(formData.myShiftId),
                doctor2ShiftRefId: parseInt(formData.targetShiftId),
                exchangeDate: formData.exchangeDate,
                swapType: swapType
            }

            // Validate: trong khoảng hợp lệ và từ ngày mai trở đi
            const selectedDate = new Date(formData.exchangeDate)
            selectedDate.setHours(0, 0, 0, 0)

            if (selectedDate < tomorrow) {
                toast.error("Chỉ được đổi lịch từ ngày mai trở đi. Không thể đổi lịch hôm nay.")
                return
            }

            if (!isRangeValid) {
                toast.error("Khoảng ngày không hợp lệ giữa hai ca. Vui lòng chọn lại.")
                return
            }

            if (computedMaxDate && selectedDate > computedMaxDate) {
                toast.error("Ngày đổi ca vượt quá ngày kết thúc cho phép.")
                return
            }

            const existingRequests = myRequests.filter(req =>
                (req.doctor1Id === doctorId && req.doctor2Id === parseInt(formData.targetDoctorId)) ||
                (req.doctor1Id === parseInt(formData.targetDoctorId) && req.doctor2Id === doctorId)
            ).filter(req => {
                if (swapType === "temporary") {
                    return req.exchangeDate === formData.exchangeDate && req.status === "Pending"
                } else {
                    return req.swapType === "permanent" && req.exchangeDate === formData.exchangeDate && req.status === "Pending"
                }
            })

            if (existingRequests.length > 0) {
                const message = swapType === "temporary"
                    ? "Đã có yêu cầu đổi ca giữa 2 bác sĩ này trong ngày này. Vui lòng chọn ngày khác hoặc bác sĩ khác."
                    : "Đã có yêu cầu đổi ca vĩnh viễn giữa 2 bác sĩ này bắt đầu từ ngày này. Vui lòng chọn ngày khác hoặc bác sĩ khác."
                toast.error(message)
                return
            }

            await shiftSwapService.createShiftSwapRequest(request)
            await showSuccessAlert("Yêu cầu đổi ca đã được gửi thành công")

            setFormData({
                targetDoctorId: "",
                myShiftId: "",
                targetShiftId: "",
                exchangeDate: ""
            })
            setTargetShifts([])

            fetchMyRequests()
        } catch (error: any) {
            console.error('Error creating request:', error)

            let errorMessage = "Không thể tạo yêu cầu đổi ca"
            if (error.message) {
                errorMessage = error.message
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            }

            if (errorMessage.includes("Invalid shift swap request")) {
                errorMessage = "Yêu cầu đổi ca không hợp lệ. Có thể đã có yêu cầu đổi ca giữa 2 bác sĩ này trong ngày này, hoặc ca làm việc không tồn tại."
            }

            await showErrorAlert("Lỗi tạo yêu cầu", errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Pending":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 font-medium"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>
            case "Approved":
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold text-sm px-3 py-1"><CheckCircle className="w-4 h-4 mr-1" />Đã chấp nhận</Badge>
            case "Rejected":
                return <Badge variant="destructive" className="font-medium"><XCircle className="w-3 h-3 mr-1" />Bị từ chối</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Yêu cầu đổi ca</h1>
                    <p className="text-muted-foreground">Tạo yêu cầu đổi ca với bác sĩ cùng chuyên khoa</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tạo yêu cầu mới */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Tạo yêu cầu đổi ca
                            </CardTitle>
                            <CardDescription>
                                Chọn bác sĩ cùng chuyên khoa và ca làm việc để đổi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Loại đổi ca</Label>
                                    <RadioGroup value={swapType} onValueChange={(value: "temporary" | "permanent") => setSwapType(value)}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="temporary" id="temporary" />
                                            <Label htmlFor="temporary">Đổi ca 1 ngày</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="permanent" id="permanent" />
                                            <Label htmlFor="permanent">Đổi ca vĩnh viễn</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="targetDoctor">Bác sĩ muốn đổi ca</Label>
                                    <Select
                                        value={formData.targetDoctorId}
                                        onValueChange={(value) => {
                                            setFormData(prev => ({ ...prev, targetDoctorId: value, targetShiftId: "" }))
                                            handleTargetDoctorChange(value)
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn bác sĩ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map((doctor) => (
                                                <SelectItem key={doctor.doctorID} value={doctor.doctorID.toString()}>
                                                    {doctor.fullName} - {doctor.specialty}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="myShift">Ca của tôi</Label>
                                    <Select
                                        value={formData.myShiftId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, myShiftId: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn ca của bạn" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {myShifts.map((shift) => (
                                                <SelectItem key={shift.doctorShiftId} value={shift.doctorShiftId.toString()}>
                                                    {shift.shiftName}  ({new Date(shift.effectiveFrom).toLocaleDateString('vi-VN')}
                                                    - {new Date(shift.effectiveTo).toLocaleDateString('vi-VN')})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="targetShift">Ca muốn đổi</Label>
                                    <Select
                                        value={formData.targetShiftId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, targetShiftId: value }))}
                                        disabled={!formData.targetDoctorId || doctorsLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn ca muốn đổi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {targetShifts.map((shift) => (
                                                <SelectItem key={shift.doctorShiftId} value={shift.doctorShiftId.toString()}>
                                                    {shift.shiftName}  ({new Date(shift.effectiveFrom).toLocaleDateString('vi-VN')}
                                                    - {new Date(shift.effectiveTo).toLocaleDateString('vi-VN')})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exchangeDate">
                                        {swapType === "temporary" ? "Ngày đổi ca" : "Ngày bắt đầu đổi ca"}
                                    </Label>
                                    <Input
                                        id="exchangeDate"
                                        type="date"
                                        value={formData.exchangeDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, exchangeDate: e.target.value }))}
                                        min={minDateStr}
                                        max={maxDateStr}
                                        disabled={!formData.myShiftId || !formData.targetShiftId || !isRangeValid}
                                    />
                                    <p className="text-sm text-gray-600">
                                        Chỉ được chọn từ ngày mai và trong khoảng hợp lệ của hai ca.
                                    </p>
                                    {formData.myShiftId && formData.targetShiftId && (
                                        <p className="text-xs text-gray-500">
                                            Phạm vi: {minDateStr} {maxDateStr ? `→ ${maxDateStr}` : ""}
                                        </p>
                                    )}
                                    {swapType === "temporary" ? (
                                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                            <strong>Đổi ca 1 ngày:</strong> Ca sẽ được đổi trong ngày {formData.exchangeDate ? new Date(formData.exchangeDate).toLocaleDateString('vi-VN') : 'đã chọn'} và trở về bình thường từ ngày hôm sau.
                                        </p>
                                    ) : (
                                        <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                            <strong>Đổi ca vĩnh viễn:</strong> Từ ngày {formData.exchangeDate ? new Date(formData.exchangeDate).toLocaleDateString('vi-VN') : 'đã chọn'} trở đi, ca của 2 bác sĩ sẽ đổi cho nhau.
                                        </p>
                                    )}
                                </div>



                                <Button type="submit" className="w-full" disabled={loading || !isRangeValid || !formData.myShiftId || !formData.targetShiftId}>
                                    {loading
                                        ? "Đang tạo yêu cầu..."
                                        : swapType === "temporary"
                                            ? "Tạo yêu cầu đổi ca 1 ngày"
                                            : "Tạo yêu cầu đổi ca vĩnh viễn"
                                    }
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Danh sách yêu cầu */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Yêu cầu của tôi
                            </CardTitle>
                            <CardDescription>
                                Danh sách các yêu cầu đổi ca đã gửi
                            </CardDescription>
                            <div className="mt-2">
                                <Button
                                    onClick={fetchMyRequests}
                                    variant="outline"
                                    size="sm"
                                    disabled={requestsLoading}
                                >
                                    {requestsLoading ? "Đang tải..." : "Làm mới"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {requestsLoading ? (
                                <div className="text-center py-4">Đang tải...</div>
                            ) : myRequests.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Bạn chưa có yêu cầu đổi ca nào
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <div className="space-y-4">
                                    {myRequests.map((request) => (
                                        <div key={request.exchangeId} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">Đổi ca với {request.doctor2Name}</h4>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p><strong>Ca của tôi:</strong> {request.doctor1ShiftName}</p>
                                                <p><strong>Ca muốn đổi:</strong> {request.doctor2ShiftName}</p>
                                                {request.swapType?.toLowerCase() === "temporary" ? (
                                                    <p><strong>Ngày đổi:</strong> {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}</p>
                                                ) : (
                                                    <p><strong>Ngày bắt đầu:</strong> {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}</p>
                                                )}
                                                <p><strong>Loại đổi ca:</strong> {
                                                    request.swapType?.toLowerCase() === "permanent"
                                                        ? "Đổi ca vĩnh viễn"
                                                        : request.swapType?.toLowerCase() === "temporary"
                                                            ? "Đổi ca 1 ngày"
                                                            : "Không xác định"
                                                }</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
