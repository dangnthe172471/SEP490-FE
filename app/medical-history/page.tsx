"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    Home,
    Search,
    Filter,
    Calendar,
    User,
    Stethoscope,
    FileText,
    Pill,
    Activity,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle
} from "lucide-react"
import { getCurrentUser, User as UserType } from "@/lib/auth"
import { showErrorAlert } from "@/lib/sweetalert-config"
import { toast } from "sonner"
import { Breadcrumb } from "@/components/breadcrumb"
import { medicalHistoryService, MedicalRecord } from "@/lib/services/medical-history.service"


interface PatientProfile {
    userId: number
    fullName?: string
    email?: string
    phone?: string
    gender?: string
    dob?: string
}

export default function MedicalHistoryPage() {
    const [currentUser, setCurrentUser] = useState<UserType | null>(null)
    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
    const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("all")
    const [expandedRecord, setExpandedRecord] = useState<number | null>(null)
    const router = useRouter()

    useEffect(() => {
        const user = getCurrentUser()
        if (!user) {
            router.push('/')
            return
        }
        setCurrentUser(user)
        fetchMedicalHistory()
    }, [router])

    useEffect(() => {
        filterRecords()
    }, [medicalRecords, searchTerm, statusFilter, dateFilter])

    const fetchMedicalHistory = async () => {
        try {
            setIsLoading(true)

            // Get current user ID (assuming user is logged in)
            const currentUser = getCurrentUser()
            if (!currentUser) {
                router.push('/login')
                return
            }

            // Fetch medical history from API using userId
            const records = await medicalHistoryService.getMedicalHistory(parseInt(currentUser.id))
            setMedicalRecords(records)

            // Mock patient profile - thay thế bằng API call thực tế
            setPatientProfile({
                userId: parseInt(currentUser.id),
                fullName: currentUser.name || "Bệnh nhân",
                email: currentUser.email || "",
                phone: "",
                gender: "Nam",
                dob: "1985-05-15"
            })
        } catch (error) {
            console.error('Error fetching medical history:', error)
            await showErrorAlert("Lỗi", "Không thể tải lịch sử bệnh án")

            // Fallback to mock data if API fails
            const mockRecords: MedicalRecord[] = [
                {
                    recordId: 1,
                    appointmentId: 101,
                    patientId: 1,
                    patientName: "Nguyễn Văn Dũng",
                    doctorId: 1,
                    doctorName: "BS. Nguyễn Văn A",
                    doctorSpecialty: "Tim mạch",
                    appointmentDate: "2024-01-15",
                    diagnosis: "Tăng huyết áp",
                    doctorNotes: "Bệnh nhân cần theo dõi huyết áp hàng ngày",
                    status: "Completed",
                    createdAt: "2024-01-15",
                    prescriptions: [
                        {
                            prescriptionId: 1,
                            recordId: 1,
                            doctorId: 1,
                            doctorName: "BS. Nguyễn Văn A",
                            issuedDate: "2024-01-15",
                            prescriptionDetails: [
                                {
                                    prescriptionDetailId: 1,
                                    prescriptionId: 1,
                                    medicineId: 1,
                                    medicineName: "Amlodipine",
                                    dosage: "5mg",
                                    duration: "1 viên/ngày trong 30 ngày"
                                }
                            ]
                        }
                    ],
                    testResults: [
                        {
                            testResultId: 1,
                            recordId: 1,
                            testTypeId: 1,
                            testTypeName: "Đo huyết áp",
                            resultValue: "140/90",
                            unit: "mmHg",
                            notes: "Cao hơn bình thường",
                            resultDate: "2024-01-15"
                        }
                    ]
                }
            ]
            setMedicalRecords(mockRecords)
        } finally {
            setIsLoading(false)
        }
    }

    const filterRecords = () => {
        let filtered = [...medicalRecords]

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(record =>
                record.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())) ||
                record.doctorSpecialty.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(record => record.status === statusFilter)
        }

        // Filter by date
        if (dateFilter !== "all") {
            const now = new Date()
            const recordDate = new Date()

            switch (dateFilter) {
                case "last-month":
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                    filtered = filtered.filter(record => new Date(record.appointmentDate) >= lastMonth)
                    break
                case "last-3-months":
                    const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
                    filtered = filtered.filter(record => new Date(record.appointmentDate) >= last3Months)
                    break
                case "last-year":
                    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                    filtered = filtered.filter(record => new Date(record.appointmentDate) >= lastYear)
                    break
            }
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())

        setFilteredRecords(filtered)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Completed":
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Hoàn thành</Badge>
            case "Ongoing":
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300"><Activity className="w-3 h-3 mr-1" />Đang điều trị</Badge>
            case "Cancelled":
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" />Đã hủy</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const toggleExpanded = (recordId: number) => {
        setExpandedRecord(expandedRecord === recordId ? null : recordId)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang tải lịch sử bệnh án...</p>
                </div>
            </div>
        )
    }

    if (!currentUser || !patientProfile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">Không tìm thấy thông tin bệnh nhân</p>
                        <Button onClick={() => router.push('/')} className="mt-4">
                            Về trang chủ
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <Header />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="mb-4">
                        <Breadcrumb
                            items={[
                                { label: "Hồ sơ bệnh nhân", href: "/profile" },
                                { label: "Lịch sử bệnh án", isActive: true }
                            ]}
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/profile')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Quay lại</span>
                            </Button>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Lịch sử bệnh án</h1>
                                <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                                    Hồ sơ khám bệnh và điều trị của {patientProfile.fullName}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2"
                            >
                                <Home className="h-4 w-4" />
                                <span className="hidden sm:inline">Trang chủ</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tổng số lần khám</p>
                                    <p className="text-2xl font-bold text-blue-600">{medicalRecords.length}</p>
                                </div>
                                <FileText className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Đã hoàn thành</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {medicalRecords.filter(r => r.status === "Completed").length}
                                    </p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Đang điều trị</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {medicalRecords.filter(r => r.status === "Ongoing").length}
                                    </p>
                                </div>
                                <Activity className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Lần khám gần nhất</p>
                                    <p className="text-sm font-bold text-gray-600">
                                        {medicalRecords.length > 0 ? formatDate(medicalRecords[0].appointmentDate) : "Chưa có"}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-gray-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Tìm kiếm theo bác sĩ, chẩn đoán, khoa..."
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
                                        <SelectItem value="Completed">Hoàn thành</SelectItem>
                                        <SelectItem value="Ongoing">Đang điều trị</SelectItem>
                                        <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger className="w-40">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Thời gian" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="last-month">Tháng trước</SelectItem>
                                        <SelectItem value="last-3-months">3 tháng gần</SelectItem>
                                        <SelectItem value="last-year">Năm trước</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Records List */}
                <div className="space-y-4">
                    {filteredRecords.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có hồ sơ bệnh án</h3>
                                <p className="text-gray-500">Chưa có hồ sơ khám bệnh nào được tìm thấy</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredRecords.map((record) => (
                            <Card key={record.recordId} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{record.doctorName}</CardTitle>
                                                    <p className="text-sm text-gray-600">{record.doctorSpecialty}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(record.appointmentDate)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {record.doctorSpecialty}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(record.status)}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleExpanded(record.recordId)}
                                            >
                                                {expandedRecord === record.recordId ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-1">Chẩn đoán</h4>
                                            <p className="text-gray-700">{record.diagnosis || "Chưa có thông tin"}</p>
                                        </div>

                                        {expandedRecord === record.recordId && (
                                            <div className="space-y-4 pt-4 border-t">
                                                {record.doctorNotes && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                            <FileText className="w-4 h-4" />
                                                            Ghi chú bác sĩ
                                                        </h4>
                                                        <p className="text-gray-700">{record.doctorNotes}</p>
                                                    </div>
                                                )}

                                                {record.prescriptions && record.prescriptions.length > 0 && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                            <Pill className="w-4 h-4" />
                                                            Đơn thuốc
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {record.prescriptions.map((prescription) => (
                                                                <div key={prescription.prescriptionId} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                                                    <div className="mb-2">
                                                                        <p className="font-medium text-gray-900">Bác sĩ kê đơn: {prescription.doctorName}</p>
                                                                        {prescription.issuedDate && (
                                                                            <p className="text-sm text-gray-600">Ngày kê: {formatDate(prescription.issuedDate)}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {prescription.prescriptionDetails.map((detail) => (
                                                                            <div key={detail.prescriptionDetailId} className="bg-white p-3 rounded border">
                                                                                <p className="font-medium text-gray-900">{detail.medicineName}</p>
                                                                                <p className="text-sm text-gray-600">Liều lượng: {detail.dosage}</p>
                                                                                <p className="text-sm text-gray-600">Thời gian: {detail.duration}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {record.testResults && record.testResults.length > 0 && (
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                                            <Activity className="w-4 h-4" />
                                                            Kết quả xét nghiệm
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {record.testResults.map((test) => (
                                                                <div key={test.testResultId} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-medium text-gray-900">{test.testTypeName}</p>
                                                                            <p className="text-sm text-gray-600">Kết quả: {test.resultValue} {test.unit || ''}</p>
                                                                            {test.notes && <p className="text-sm text-gray-600">Ghi chú: {test.notes}</p>}
                                                                            {test.resultDate && <p className="text-sm text-gray-600">Ngày xét nghiệm: {formatDate(test.resultDate)}</p>}
                                                                            {test.attachment && (
                                                                                <p className="text-sm text-blue-600">Tài liệu đính kèm: {test.attachment}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="lg"
                    onClick={() => router.push('/')}
                    className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
                >
                    <Home className="h-5 w-5 mr-2" />
                    Về trang chủ
                </Button>
            </div>
        </div>
    )
}
