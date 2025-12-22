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
import { Clock, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import { showErrorAlert, showSuccessAlert } from "@/lib/sweetalert-config"
import type { CreateShiftSwapRequest, ShiftSwapRequestResponse, DoctorShift, Doctor } from "@/lib/types/shift-swap"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
import { RoleGuard } from "@/components/role-guard"

const DAYS_TO_FETCH = 30
const ACTIVE_STATUS = "Active"
const PENDING_STATUS = "Pending"

export default function DoctorShiftSwapPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)
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
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const parseDateOnly = (value?: string): Date | undefined => value ? new Date(value) : undefined
    const formatDateOnly = (d?: Date): string | undefined => d ? d.toISOString().split('T')[0] : undefined
    const getDateRange = (days: number = DAYS_TO_FETCH) => {
        const from = new Date().toISOString().split('T')[0]
        const to = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        return { from, to }
    }
    const getToday = (): Date => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return today
    }

    const myFrom = parseDateOnly(selectedMyShift?.effectiveFrom)
    const myTo = parseDateOnly(selectedMyShift?.effectiveTo)
    const targetFrom = parseDateOnly(selectedTargetShift?.effectiveFrom)
    const targetTo = parseDateOnly(selectedTargetShift?.effectiveTo)

    // minDate = max(tomorrow, myFrom, targetFrom)
    const minCandidates: Date[] = [tomorrow]
    if (myFrom) minCandidates.push(myFrom)
    if (targetFrom) minCandidates.push(targetFrom)
    const computedMinDate = minCandidates.length > 0
        ? minCandidates.reduce((max, d) => d > max ? d : max)
        : tomorrow

    // maxDate = min(myTo, targetTo) — chỉ tính khi cả hai có giá trị
    let computedMaxDate: Date | undefined = undefined
    if (myTo && targetTo) {
        computedMaxDate = myTo < targetTo ? myTo : targetTo
    } else if (myTo) {
        computedMaxDate = myTo
    } else if (targetTo) {
        computedMaxDate = targetTo
    }

    const isRangeValid = !computedMaxDate || (computedMinDate <= computedMaxDate)

    // Tập tên ca mà bác sĩ 1 đã có, dùng để ẩn các ca trùng bên bác sĩ 2
    const myShiftNames = new Set(myShifts.map(shift => shift.shiftName))
    const targetShiftNames = new Set(targetShifts.map(shift => shift.shiftName))

    // Chỉ hiển thị ca của bác sĩ đích mà bác sĩ hiện tại không có (ca riêng)
    const availableTargetShifts = targetShifts.filter(shift => !myShiftNames.has(shift.shiftName))

    // Chỉ hiển thị ca của bác sĩ hiện tại mà bác sĩ đích không có (ca riêng)
    const availableMyShifts = formData.targetDoctorId
        ? myShifts.filter(shift => !targetShiftNames.has(shift.shiftName))
        : myShifts

    useEffect(() => {
        const user = getCurrentUser()
        if (user) {
            setCurrentUser(user)
        }
    }, [])

    useEffect(() => {
        if (currentUser) {
            fetchMyRequests()
            fetchDoctorsBySpecialty()
            if (swapType === "permanent") {
                fetchMyShifts()
            }
        }
    }, [currentUser])

    useEffect(() => {
        // Khi đổi swapType, reload shifts và reset form
        if (currentUser) {
            if (swapType === "permanent") {
                setFormData(prev => ({ ...prev, exchangeDate: "", myShiftId: "", targetShiftId: "", targetDoctorId: "" }))
                setMyShifts([])
                setTargetShifts([])
                fetchMyShifts()
            } else {
                setFormData(prev => ({ ...prev, myShiftId: "", targetShiftId: "", targetDoctorId: "" }))
                setMyShifts([])
                setTargetShifts([])
            }
        }
    }, [swapType])

    const fetchDoctorsBySpecialty = async () => {
        if (!currentUser) return

        try {
            setDoctorsLoading(true)
            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))

            // Lấy thông tin doctor để lấy specialty trực tiếp
            const doctorInfo = await shiftSwapService.getDoctorByUserId(parseInt(currentUser.id))
            if (!doctorInfo || !doctorInfo.specialty) {
                await showErrorAlert("Thông báo", "Không tìm thấy chuyên khoa của bạn")
                return
            }

            const specialty = doctorInfo.specialty
            const doctorsList = await shiftSwapService.getDoctorsBySpecialty(specialty)
            const otherDoctors = doctorsList.filter(doctor => doctor.doctorID !== doctorId)
            setDoctors(otherDoctors)

            if (otherDoctors.length === 0) {
                await showErrorAlert("Thông báo", "Không có bác sĩ nào khác trong cùng chuyên khoa")
            }
        } catch (error) {
            await showErrorAlert("Lỗi", "Không thể tải danh sách bác sĩ: " + (error as Error).message)
        } finally {
            setDoctorsLoading(false)
        }
    }

    const fetchMyShifts = async () => {
        if (!currentUser) return

        try {
            setLoading(true)
            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))

            if (swapType === "temporary" && formData.exchangeDate) {
                // Temporary: fetch shifts trong ngày đã chọn
                const myShiftsForDate = await fetchShiftsForDate(doctorId, formData.exchangeDate)
                setMyShifts(myShiftsForDate)
            } else if (swapType === "permanent") {
                // Permanent: fetch shifts của tháng sau
                const nextMonthStart = new Date()
                nextMonthStart.setMonth(nextMonthStart.getMonth() + 1, 1)
                nextMonthStart.setHours(0, 0, 0, 0)

                // Tính ngày cuối tháng sau
                const nextMonthEnd = new Date(nextMonthStart)
                nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1, 0) // Ngày cuối của tháng sau
                nextMonthEnd.setHours(23, 59, 59, 999)

                const from = nextMonthStart.toISOString().split('T')[0]
                const to = nextMonthEnd.toISOString().split('T')[0]

                const allShifts = await shiftSwapService.getDoctorShifts(doctorId, from, to)
                let activeShifts = allShifts.filter(shift => shift.status === ACTIVE_STATUS)

                // Filter shifts có effectiveFrom >= đầu tháng sau
                activeShifts = activeShifts.filter(shift => {
                    const effectiveFrom = new Date(shift.effectiveFrom)
                    effectiveFrom.setHours(0, 0, 0, 0)
                    return effectiveFrom >= nextMonthStart
                })

                setMyShifts(activeShifts)

                if (activeShifts.length === 0) {
                    await showErrorAlert("Thông báo", "Bạn chưa có ca làm việc nào trong tháng sau")
                }
            } else {
                // Temporary nhưng chưa chọn ngày: không fetch
                setMyShifts([])
            }
        } catch (error) {
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
            await showErrorAlert("Lỗi", "Không thể tải yêu cầu đổi ca: " + (error as Error).message)
        } finally {
            setRequestsLoading(false)
        }
    }

    const fetchShiftsForDate = async (doctorId: number, date: string) => {
        // Fetch shifts cho ngày cụ thể
        const selectedDate = new Date(date)
        const from = date
        const to = date

        const allShifts = await shiftSwapService.getDoctorShifts(doctorId, from, to)
        const activeShifts = allShifts.filter(shift => {
            if (shift.status !== ACTIVE_STATUS) return false

            const effectiveFrom = new Date(shift.effectiveFrom)
            const effectiveTo = new Date(shift.effectiveTo)
            const checkDate = new Date(selectedDate)
            checkDate.setHours(0, 0, 0, 0)

            // Check xem ngày có nằm trong khoảng effectiveFrom và effectiveTo không
            return effectiveFrom <= checkDate && effectiveTo >= checkDate
        })

        return activeShifts
    }

    const handleDateChange = async (date: string) => {
        setFormData(prev => ({ ...prev, exchangeDate: date, myShiftId: "", targetShiftId: "", targetDoctorId: "" }))
        setTargetShifts([])

        if (!currentUser || swapType !== "temporary") return

        try {
            setLoading(true)
            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))

            // Fetch shifts của mình trong ngày đó
            const myShiftsForDate = await fetchShiftsForDate(doctorId, date)
            setMyShifts(myShiftsForDate)
        } catch (error) {
            await showErrorAlert("Lỗi", "Không thể tải lịch làm việc: " + (error as Error).message)
        } finally {
            setLoading(false)
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

            if (swapType === "temporary" && formData.exchangeDate) {
                // Temporary: fetch shifts trong ngày đã chọn
                const targetShiftsForDate = await fetchShiftsForDate(parseInt(doctorId), formData.exchangeDate)
                setTargetShifts(targetShiftsForDate)
            } else if (swapType === "permanent") {
                // Permanent: fetch shifts của tháng sau
                const nextMonthStart = new Date()
                nextMonthStart.setMonth(nextMonthStart.getMonth() + 1, 1)
                nextMonthStart.setHours(0, 0, 0, 0)

                // Tính ngày cuối tháng sau
                const nextMonthEnd = new Date(nextMonthStart)
                nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1, 0) // Ngày cuối của tháng sau
                nextMonthEnd.setHours(23, 59, 59, 999)

                const from = nextMonthStart.toISOString().split('T')[0]
                const to = nextMonthEnd.toISOString().split('T')[0]

                const allShifts = await shiftSwapService.getDoctorShifts(parseInt(doctorId), from, to)

                let activeShifts = allShifts.filter(shift => shift.status === ACTIVE_STATUS)

                // Filter shifts có effectiveFrom >= đầu tháng sau
                activeShifts = activeShifts.filter(shift => {
                    const effectiveFrom = new Date(shift.effectiveFrom)
                    effectiveFrom.setHours(0, 0, 0, 0)
                    return effectiveFrom >= nextMonthStart
                })

                setTargetShifts(activeShifts)
            }
        } catch (error) {
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

        // Chỉ validate exchangeDate nếu temporary
        if (swapType === "temporary") {
            if (!formData.exchangeDate) {
                toast.error("Vui lòng chọn ngày đổi ca")
                return
            }

            const selectedDate = new Date(formData.exchangeDate)
            selectedDate.setHours(0, 0, 0, 0)
            const today = getToday()

            if (selectedDate <= today) {
                toast.error("Chỉ được đổi lịch từ ngày mai trở đi. Không thể đổi lịch hôm nay.")
                return
            }

            if (!isRangeValid) {
                toast.error("Khoảng ngày không hợp lệ giữa hai ca. Vui lòng chọn lại.")
                return
            }
        }

        try {
            setLoading(true)

            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))
            const targetDoctorId = parseInt(formData.targetDoctorId)

            // Kiểm tra ca của bác sĩ 1 phải thuộc về bác sĩ 1
            if (!selectedMyShift || selectedMyShift.doctorId !== doctorId) {
                toast.error("Ca làm việc bạn chọn không thuộc về bạn. Vui lòng chọn lại.")
                setLoading(false)
                return
            }

            // Kiểm tra ca của bác sĩ 2 phải thuộc về bác sĩ 2
            if (!selectedTargetShift || selectedTargetShift.doctorId !== targetDoctorId) {
                toast.error("Ca làm việc bạn chọn không thuộc về bác sĩ đích. Vui lòng chọn lại.")
                setLoading(false)
                return
            }

            // Kiểm tra hai ca phải khác nhau (không thể đổi ca giống nhau)
            if (selectedMyShift.shiftId === selectedTargetShift.shiftId) {
                toast.error("Không thể đổi ca giống nhau. Vui lòng chọn ca khác để đổi.")
                setLoading(false)
                return
            }

            const request: CreateShiftSwapRequest = {
                doctor1Id: doctorId,
                doctor2Id: targetDoctorId,
                doctor1ShiftRefId: parseInt(formData.myShiftId),
                doctor2ShiftRefId: parseInt(formData.targetShiftId),
                ...(swapType === "temporary" && formData.exchangeDate ? { exchangeDate: formData.exchangeDate } : {}),
                swapType: swapType
            }

            // Chỉ validate selectedDate nếu temporary
            if (swapType === "temporary" && computedMaxDate) {
                const selectedDate = new Date(formData.exchangeDate)
                selectedDate.setHours(0, 0, 0, 0)
                if (selectedDate > computedMaxDate) {
                    toast.error("Ngày đổi ca vượt quá ngày kết thúc cho phép.")
                    return
                }
            }

            const existingRequests = myRequests.filter(req => {
                const isSameDoctors = (req.doctor1Id === doctorId && req.doctor2Id === targetDoctorId) ||
                    (req.doctor1Id === targetDoctorId && req.doctor2Id === doctorId)
                if (!isSameDoctors) return false

                const reqSwapType = req.swapType?.toLowerCase()
                const isSameSwapType = reqSwapType === swapType
                const isSameDate = req.exchangeDate === formData.exchangeDate
                const isPending = req.status === PENDING_STATUS

                return isSameSwapType && isSameDate && isPending
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
            const errorMessage = error.message ||
                error.response?.data?.message ||
                "Không thể tạo yêu cầu đổi ca"

            const finalMessage = errorMessage.includes("Invalid shift swap request")
                ? "Yêu cầu đổi ca không hợp lệ. Có thể: hai ca giống nhau, ca làm việc không thuộc về đúng bác sĩ, đã có yêu cầu đổi ca giữa 2 bác sĩ này trong ngày này, hoặc ca làm việc không tồn tại."
                : errorMessage

            await showErrorAlert("Lỗi tạo yêu cầu", finalMessage)
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
        <RoleGuard allowedRoles="doctor">
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

                                {swapType === "temporary" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="exchangeDate">Ngày đổi ca</Label>
                                        <Input
                                            id="exchangeDate"
                                            type="date"
                                            value={formData.exchangeDate}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            min={formatDateOnly(tomorrow)}
                                        />
                                        <p className="text-sm text-gray-600">
                                            Chọn ngày đổi ca (từ ngày mai trở đi). Sau đó sẽ hiển thị các ca làm việc trong ngày đó.
                                        </p>
                                        {formData.exchangeDate && (
                                            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                                                <strong>Đổi ca 1 ngày:</strong> Ca sẽ được đổi trong ngày {new Date(formData.exchangeDate).toLocaleDateString('vi-VN')} và trở về bình thường từ ngày hôm sau.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {swapType === "permanent" && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                            <strong>Đổi ca vĩnh viễn:</strong> Chỉ cho phép đổi ca của tháng sau. Ca của 2 bác sĩ sẽ đổi cho nhau vĩnh viễn từ khi được duyệt.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="targetDoctor">Bác sĩ muốn đổi ca</Label>
                                    <Select
                                        value={formData.targetDoctorId}
                                        onValueChange={(value) => {
                                            setFormData(prev => ({ ...prev, targetDoctorId: value, targetShiftId: "" }))
                                            handleTargetDoctorChange(value)
                                        }}
                                        disabled={swapType === "temporary" && !formData.exchangeDate}
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
                                    {swapType === "temporary" && !formData.exchangeDate && (
                                        <p className="text-xs text-gray-500">Vui lòng chọn ngày đổi ca trước</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="myShift">Ca của tôi {swapType === "temporary" && formData.exchangeDate && `(ngày ${new Date(formData.exchangeDate).toLocaleDateString('vi-VN')})`}</Label>
                                    <Select
                                        value={formData.myShiftId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, myShiftId: value, targetShiftId: "" }))}
                                        disabled={swapType === "temporary" && !formData.exchangeDate}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={swapType === "temporary" && !formData.exchangeDate ? "Chọn ngày đổi ca trước" : "Chọn ca của bạn"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableMyShifts.map((shift) => (
                                                <SelectItem key={shift.doctorShiftId} value={shift.doctorShiftId.toString()}>
                                                    {shift.shiftName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {swapType === "temporary" && formData.exchangeDate && availableMyShifts.length === 0 && (
                                        <p className="text-xs text-orange-500">
                                            {formData.targetDoctorId
                                                ? "Bạn không có ca riêng nào trong ngày này (tất cả ca đều trùng với bác sĩ đích)"
                                                : "Bạn không có ca làm việc nào trong ngày này"}
                                        </p>
                                    )}
                                    {swapType === "permanent" && availableMyShifts.length === 0 && formData.targetDoctorId && (
                                        <p className="text-xs text-orange-500">Bạn không có ca riêng nào trong tháng sau (tất cả ca đều trùng với bác sĩ đích)</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="targetShift">Ca của bác sĩ muốn đổi {swapType === "temporary" && formData.exchangeDate && `(ngày ${new Date(formData.exchangeDate).toLocaleDateString('vi-VN')})`}</Label>
                                    <Select
                                        value={formData.targetShiftId}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, targetShiftId: value }))}
                                        disabled={
                                            !formData.targetDoctorId ||
                                            !formData.myShiftId || // Bắt buộc chọn ca của tôi trước
                                            doctorsLoading ||
                                            (swapType === "temporary" && !formData.exchangeDate)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    !formData.targetDoctorId
                                                        ? "Chọn bác sĩ trước"
                                                        : !formData.myShiftId
                                                            ? "Chọn ca của bạn trước"
                                                            : (swapType === "temporary" && !formData.exchangeDate
                                                                ? "Chọn ngày đổi ca trước"
                                                                : "Chọn ca của bác sĩ muốn đổi")
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTargetShifts.map((shift) => (
                                                <SelectItem key={shift.doctorShiftId} value={shift.doctorShiftId.toString()}>
                                                    {shift.shiftName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {swapType === "temporary" && formData.exchangeDate && formData.targetDoctorId && availableTargetShifts.length === 0 && (
                                        <p className="text-xs text-orange-500">
                                            {formData.myShiftId
                                                ? "Bác sĩ này không có ca riêng nào trong ngày này (tất cả ca đều trùng với ca của bạn)"
                                                : "Bác sĩ này không có ca làm việc nào trong ngày này"}
                                        </p>
                                    )}
                                    {swapType === "permanent" && formData.targetDoctorId && formData.myShiftId && availableTargetShifts.length === 0 && (
                                        <p className="text-xs text-orange-500">Bác sĩ này không có ca riêng nào trong tháng sau (tất cả ca đều trùng với ca của bạn)</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" disabled={loading || (swapType === "temporary" && (!isRangeValid || !formData.exchangeDate)) || !formData.myShiftId || !formData.targetShiftId}>
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
                                                <h4 className="font-medium">
                                                    {request.doctor1Name} đổi ca với {request.doctor2Name}
                                                </h4>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p><strong>Ca của {request.doctor1Name}: </strong> {request.doctorOld1ShiftName || request.doctor1ShiftName}</p>
                                                <p><strong>Ca của {request.doctor2Name}: </strong> {request.doctorOld2ShiftName || request.doctor2ShiftName}</p>
                                                {request.exchangeDate && (
                                                    <p><strong>Ngày đổi: </strong> {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}</p>
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
        </RoleGuard>
    )
}
