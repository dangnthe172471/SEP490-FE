"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Edit3,
    Shield,
    Heart,
    Clock,
    Stethoscope,
    FileText,
    Settings,
    LogOut,
    ArrowLeft,
    Home,
    MessageCircle
} from "lucide-react"
import { getCurrentUser, logout, User as UserType } from "@/lib/auth"
import { apiService } from "@/api/index"
import { toast } from "sonner"
import { BasicInfoEditModal } from "@/components/basic-info-edit-modal"
import { MedicalInfoEditModal } from "@/components/medical-info-edit-modal"
import { Breadcrumb } from "@/components/breadcrumb"

interface PatientProfile {
    userId: number
    phone?: string
    fullName?: string
    email?: string
    role?: string
    gender?: string
    dob?: string
    allergies?: string
    medicalHistory?: string
}

interface Appointment {
    id: number
    date: string
    time: string
    doctor: string
    department: string
    status: string
    notes?: string
}

interface MedicalRecord {
    id: number
    date: string
    doctor: string
    diagnosis: string
    treatment: string
    prescription?: string
}

export default function ProfilePage() {
    const [currentUser, setCurrentUser] = useState<UserType | null>(null)
    const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false)
    const [isMedicalInfoModalOpen, setIsMedicalInfoModalOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const user = getCurrentUser()
        if (!user) {
            router.push('/')
            return
        }
        setCurrentUser(user)
        fetchPatientData()
    }, [router])

    // Listen for storage changes (logout from other tabs)
    useEffect(() => {
        const handleStorageChange = () => {
            const user = getCurrentUser()
            if (!user) {
                // Clear all data and redirect
                setPatientProfile(null)
                setAppointments([])
                setMedicalRecords([])
                setCurrentUser(null)
                router.push('/')
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [router])

    const fetchPatientData = async () => {
        try {
            setIsLoading(true)

            // Check if user still exists
            const user = getCurrentUser()
            if (!user) {
                // Clear all data and redirect
                setPatientProfile(null)
                setAppointments([])
                setMedicalRecords([])
                setCurrentUser(null)
                router.push('/')
                return
            }

            // Fetch patient profile
            const profile = await apiService.fetchUserProfile()
            setPatientProfile(profile)

            // Set empty arrays for appointments and medical records
            setAppointments([])
            setMedicalRecords([])
        } catch (error) {
            console.error('Error fetching patient data:', error)
            toast.error("Không thể tải thông tin bệnh nhân")
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = () => {
        // Clear all profile data
        setPatientProfile(null)
        setAppointments([])
        setMedicalRecords([])
        setCurrentUser(null)

        logout()
        // logout() already redirects to home, no need for router.push
    }


    const handleSaveBasicInfo = (updatedInfo: any) => {
        if (patientProfile) {
            setPatientProfile({
                ...patientProfile,
                fullName: updatedInfo.fullName,
                email: updatedInfo.email,
                phone: updatedInfo.phone,
                dob: updatedInfo.dob,
                gender: updatedInfo.gender,
            })
        }
        // Refresh data from API
        fetchPatientData()
    }

    const handleSaveMedicalInfo = (updatedInfo: any) => {
        if (patientProfile) {
            setPatientProfile({
                ...patientProfile,
                allergies: updatedInfo.allergies,
                medicalHistory: updatedInfo.medicalHistory
            })
        }
        // Refresh data from API
        fetchPatientData()
    }


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đã hoàn thành':
                return 'bg-green-100 text-green-800'
            case 'Đã đặt lịch':
                return 'bg-blue-100 text-blue-800'
            case 'Đã hủy':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang tải thông tin...</p>
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
                    {/* Breadcrumb Navigation */}
                    <div className="mb-4">
                        <Breadcrumb
                            items={[
                                { label: "Hồ sơ bệnh nhân", isActive: true }
                            ]}
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Quay lại</span>
                            </Button>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Hồ sơ bệnh nhân</h1>
                                <p className="text-muted-foreground mt-2 text-sm lg:text-base">Quản lý thông tin cá nhân và lịch sử khám bệnh</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsBasicInfoModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Edit3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Thông tin cơ bản</span>
                                <span className="sm:hidden">Cơ bản</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsMedicalInfoModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Heart className="h-4 w-4" />
                                <span className="hidden sm:inline">Thông tin y tế</span>
                                <span className="sm:hidden">Y tế</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Đăng xuất</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <Avatar className="h-24 w-24 mx-auto mb-4">
                                        <AvatarImage src="/placeholder-user.jpg" alt={patientProfile.fullName} />
                                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                            {patientProfile.fullName?.charAt(0).toUpperCase() || 'P'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl font-semibold mb-2">{patientProfile.fullName || 'Chưa cập nhật'}</h2>
                                    <Badge variant="secondary" className="mb-4">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Bệnh nhân
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {patientProfile.userId}
                                    </p>

                                    {/* Quick Actions */}
                                    <div className="mt-4 pt-4 border-t space-y-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push('/chat')}
                                            className="w-full flex items-center gap-2"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Chat hỗ trợ
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push('/')}
                                            className="w-full flex items-center gap-2"
                                        >
                                            <Home className="h-4 w-4" />
                                            Về trang chủ
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-red-500" />
                                    Thống kê nhanh
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Lần khám gần nhất</span>
                                    <span className="font-medium">{formatDate(appointments[0]?.date || '')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Tổng số lần khám</span>
                                    <span className="font-medium">{appointments.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Lịch hẹn sắp tới</span>
                                    <span className="font-medium">
                                        {appointments.filter(apt => apt.status === 'Đã đặt lịch').length}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Detailed Info */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="personal" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
                                <TabsTrigger value="appointments">Lịch hẹn</TabsTrigger>
                                <TabsTrigger value="medical">Lịch sử khám</TabsTrigger>
                            </TabsList>

                            {/* Personal Information Tab */}
                            <TabsContent value="personal" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Thông tin cơ bản
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Họ và tên</label>
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{patientProfile.fullName || 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{patientProfile.gender || 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span>{patientProfile.phone || 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span>{patientProfile.email || 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span>{patientProfile.dob ? formatDate(patientProfile.dob) : 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Thông tin y tế
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Dị ứng</label>
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <span>{patientProfile.allergies || 'Không có thông tin'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Bệnh lý nền</label>
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <span>{patientProfile.medicalHistory || 'Không có thông tin'}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Appointments Tab */}
                            <TabsContent value="appointments" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Lịch hẹn khám
                                        </CardTitle>
                                        <CardDescription>
                                            Danh sách các lịch hẹn khám bệnh của bạn
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {appointments.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground">Chưa có lịch hẹn nào</p>
                                                </div>
                                            ) : (
                                                appointments.map((appointment) => (
                                                    <div key={appointment.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-medium">{appointment.doctor}</h3>
                                                            <Badge className={getStatusColor(appointment.status)}>
                                                                {appointment.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(appointment.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4" />
                                                                <span>{appointment.time}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Stethoscope className="h-4 w-4" />
                                                                <span>{appointment.department}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                <span>{appointment.notes}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Medical Records Tab */}
                            <TabsContent value="medical" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Lịch sử khám bệnh
                                        </CardTitle>
                                        <CardDescription>
                                            Hồ sơ khám bệnh và điều trị của bạn
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {medicalRecords.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground">Chưa có hồ sơ khám bệnh</p>
                                                </div>
                                            ) : (
                                                medicalRecords.map((record) => (
                                                    <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="font-medium">{record.doctor}</h3>
                                                            <span className="text-sm text-muted-foreground">{formatDate(record.date)}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">Chẩn đoán</label>
                                                                <p className="mt-1">{record.diagnosis}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium text-muted-foreground">Điều trị</label>
                                                                <p className="mt-1">{record.treatment}</p>
                                                            </div>
                                                            {record.prescription && (
                                                                <div>
                                                                    <label className="text-sm font-medium text-muted-foreground">Đơn thuốc</label>
                                                                    <p className="mt-1 text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                                                        {record.prescription}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Basic Info Edit Modal */}
            {patientProfile && (
                <BasicInfoEditModal
                    isOpen={isBasicInfoModalOpen}
                    onClose={() => setIsBasicInfoModalOpen(false)}
                    basicInfo={{
                        fullName: patientProfile.fullName || '',
                        email: patientProfile.email || '',
                        phone: patientProfile.phone || '',
                        dob: patientProfile.dob || '',
                        gender: patientProfile.gender || '',
                    }}
                    onSave={handleSaveBasicInfo}
                />
            )}

            {/* Medical Info Edit Modal */}
            {patientProfile && (
                <MedicalInfoEditModal
                    isOpen={isMedicalInfoModalOpen}
                    onClose={() => setIsMedicalInfoModalOpen(false)}
                    medicalInfo={{
                        allergies: patientProfile.allergies || '',
                        medicalHistory: patientProfile.medicalHistory || ''
                    }}
                    onSave={handleSaveMedicalInfo}
                />
            )}

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
