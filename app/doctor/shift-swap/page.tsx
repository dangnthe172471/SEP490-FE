"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import type { CreateShiftSwapRequest, ShiftSwapRequestResponse, DoctorShift, Doctor } from "@/lib/types/shift-swap"

const navigation = [
    { name: "Tổng quan", href: "/doctor", icon: Calendar },
    { name: "Bệnh nhân", href: "/doctor/patients", icon: Users },
    { name: "Hồ sơ bệnh án", href: "/doctor/records", icon: Calendar },
    { name: "Yêu cầu đổi ca", href: "/doctor/shift-swap", icon: Clock },
]

export default function DoctorShiftSwapPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [myShifts, setMyShifts] = useState<DoctorShift[]>([])
    const [targetShifts, setTargetShifts] = useState<DoctorShift[]>([])
    const [myRequests, setMyRequests] = useState<ShiftSwapRequestResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [doctorsLoading, setDoctorsLoading] = useState(false)
    const [requestsLoading, setRequestsLoading] = useState(false)

    const [formData, setFormData] = useState({
        targetDoctorId: "",
        myShiftId: "",
        targetShiftId: "",
        exchangeDate: ""
    })

    useEffect(() => {
        const user = getCurrentUser()
        if (user) {
            setCurrentUser(user)
            fetchMyShifts()
            fetchMyRequests()
            fetchDoctorsBySpecialty()
        }
    }, [])

    const fetchDoctorsBySpecialty = async () => {
        if (!currentUser) return

        try {
            // TODO: Get current doctor's specialty from API
            // For now, using a placeholder specialty
            const specialty = "Khoa Nội" // This should come from current user's doctor profile
            const doctorsList = await shiftSwapService.getDoctorsBySpecialty(specialty)
            // Filter out current user - we'll need to get current user's doctor ID from API
            const otherDoctors = doctorsList // For now, show all doctors in specialty
            setDoctors(otherDoctors)
        } catch (error) {
            console.error('Error fetching doctors by specialty:', error)
            toast.error("Không thể tải danh sách bác sĩ")
        }
    }

    const fetchMyShifts = async () => {
        if (!currentUser) return

        try {
            setLoading(true)
            const from = new Date().toISOString().split('T')[0]
            const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now

            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))
            const shifts = await shiftSwapService.getDoctorShifts(doctorId, from, to)
            setMyShifts(shifts)
        } catch (error) {
            console.error('Error fetching shifts:', error)
            toast.error("Không thể tải lịch làm việc")
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
            toast.error("Không thể tải yêu cầu đổi ca")
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

            const shifts = await shiftSwapService.getDoctorShifts(parseInt(doctorId), from, to)
            setTargetShifts(shifts)
        } catch (error) {
            console.error('Error fetching target doctor shifts:', error)
            toast.error("Không thể tải lịch làm việc của bác sĩ")
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

        if (!formData.targetDoctorId || !formData.myShiftId || !formData.targetShiftId || !formData.exchangeDate) {
            toast.error("Vui lòng điền đầy đủ thông tin")
            return
        }

        try {
            setLoading(true)

            // Get doctor ID from user ID
            const doctorId = await shiftSwapService.getDoctorIdByUserId(parseInt(currentUser.id))

            const request: CreateShiftSwapRequest = {
                doctor1Id: doctorId,
                doctor2Id: parseInt(formData.targetDoctorId),
                doctor1ShiftRefId: parseInt(formData.myShiftId),
                doctor2ShiftRefId: parseInt(formData.targetShiftId),
                exchangeDate: formData.exchangeDate
            }

            await shiftSwapService.createShiftSwapRequest(request)
            toast.success("Yêu cầu đổi ca đã được gửi thành công")

            // Reset form
            setFormData({
                targetDoctorId: "",
                myShiftId: "",
                targetShiftId: "",
                exchangeDate: ""
            })
            setTargetShifts([])

            // Refresh requests
            fetchMyRequests()
        } catch (error) {
            console.error('Error creating request:', error)
            toast.error("Không thể tạo yêu cầu đổi ca")
        } finally {
            setLoading(false)
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
                                                    {shift.shiftName} - {new Date(shift.effectiveFrom).toLocaleDateString('vi-VN')}
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
                                                    {shift.shiftName} - {new Date(shift.effectiveFrom).toLocaleDateString('vi-VN')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="exchangeDate">Ngày đổi ca</Label>
                                    <Input
                                        id="exchangeDate"
                                        type="date"
                                        value={formData.exchangeDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, exchangeDate: e.target.value }))}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>



                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Đang tạo yêu cầu..." : "Tạo yêu cầu đổi ca"}
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
                                                <p><strong>Ngày đổi:</strong> {new Date(request.exchangeDate).toLocaleDateString('vi-VN')}</p>
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
