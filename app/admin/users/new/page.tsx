"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Activity,
  Users,
  Settings,
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  User,
  Image as ImageIcon
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { adminService } from "@/lib/services/admin-service"
import { ApiError, CreateUserRequest } from "@/lib/types/api"
import { toast } from "sonner"
import { ClientOnly } from "@/components/client-only"
import { getAdminNavigation } from "@/lib/navigation/admin-navigation"
import { shiftSwapService } from "@/lib/services/shift-swap-service"
import { roomService } from "@/lib/services/room-service"

interface CreateUserData {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: number
  gender: string
  dob: string
  allergies: string
  medicalHistory: string
  specialty: string // Chuyên khoa (chỉ cho bác sĩ)
  experienceYears: string // Số năm kinh nghiệm (chỉ cho bác sĩ)
  roomId: string // Phòng làm việc (chỉ cho bác sĩ)
  avatar: string // URL ảnh đại diện
}

const roleOptions = [
  // { value: 2, label: "Bệnh nhân" },
  { value: 3, label: "Lễ tân" },
  { value: 4, label: "Bác sĩ" },
  { value: 5, label: "Y tá" },
  // { value: 6, label: "Nhà cung cấp dược phẩm" },
  // { value: 7, label: "Quản lý phòng khám" },
  // { value: 8, label: "Quản trị viên" },
]

const genderOptions = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
]

export default function CreateUserPage() {
  // Get admin navigation from centralized config
  const navigation = getAdminNavigation()

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<CreateUserData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: 4, // Default to Doctor
    gender: "",
    dob: "",
    allergies: "",
    medicalHistory: "",
    specialty: "",
    experienceYears: "",
    roomId: "",
    avatar: ""
  })
  const [specialties, setSpecialties] = useState<string[]>([])
  const [rooms, setRooms] = useState<{ roomId: number; roomName: string }[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load specialties and rooms on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load specialties from existing doctors
        const { appointmentService } = await import("@/lib/services/appointment-service")
        const doctors = await appointmentService.getPagedDoctors(1, 1000)
        const specialtySet = new Set<string>()
        doctors.data.forEach((doctor) => {
          // Chỉ thêm specialty nếu không rỗng
          if (doctor.specialty && doctor.specialty.trim()) {
            specialtySet.add(doctor.specialty.trim())
          }
        })

        // Nếu chưa có specialty nào, thêm một số specialty mặc định
        if (specialtySet.size === 0) {
          specialtySet.add("Nội khoa")
          specialtySet.add("Ngoại khoa")
          specialtySet.add("Sản phụ khoa")
          specialtySet.add("Nhi khoa")
          specialtySet.add("Da liễu")
          specialtySet.add("Tim mạch")
          specialtySet.add("Thần kinh")
        }

        // Lọc bỏ các giá trị rỗng và sort
        const specialtiesList = Array.from(specialtySet)
          .filter(s => s && s.trim().length > 0)
          .sort()
        setSpecialties(specialtiesList)
      } catch (err) {
        console.error("Lỗi khi load danh sách chuyên khoa:", err)
        // Nếu lỗi, vẫn set một số specialty mặc định
        setSpecialties(["Nội khoa", "Ngoại khoa", "Sản phụ khoa", "Nhi khoa", "Da liễu", "Tim mạch", "Thần kinh"])
      }

      try {
        // Load rooms
        const roomsData = await roomService.getAll()
        if (roomsData && Array.isArray(roomsData) && roomsData.length > 0) {
          setRooms(roomsData.map(r => ({ roomId: r.roomId, roomName: r.roomName })))
        } else {
          console.warn("Rooms data không đúng định dạng hoặc rỗng:", roomsData)
        }
      } catch (err: any) {
        console.error("Lỗi khi load danh sách phòng:", err)
        // Log chi tiết để debug
        if (err instanceof ApiError) {
          console.error("API Error details:", {
            status: err.status,
            message: err.message,
            statusText: err.statusText
          })
        }
        // Không hiển thị toast để tránh làm phiền user, chỉ log
        // User vẫn có thể nhập roomId thủ công nếu cần
      }
    }
    loadData()
  }, [])

  // Reset doctor fields when role changes
  useEffect(() => {
    if (formData.role !== 4) {
      setFormData(prev => ({
        ...prev,
        specialty: "",
        experienceYears: "",
        roomId: ""
      }))
      // Clear errors
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.specialty
        delete newErrors.experienceYears
        delete newErrors.roomId
        return newErrors
      })
    }
  }, [formData.role])

  // Handle input change
  const handleInputChange = (field: keyof CreateUserData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  // Handle avatar file change
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Vui lòng chọn file hình ảnh")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB")
      return
    }

    setAvatarFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  // Upload avatar file
  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token") || localStorage.getItem("token")
      : null

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn"
    const res = await fetch(`${API_BASE_URL}/api/uploads/attachments`, {
      method: "POST",
      headers: token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : undefined,
      body: formData,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Upload thất bại" }))
      throw new Error(errorData.message || "Upload thất bại")
    }

    const data = await res.json()
    return data.relativePath || data.url || ""
  }

  // Handle remove avatar
  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }
    handleInputChange("avatar", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ và tên là bắt buộc"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    const normalizedPhone = formData.phone.replace(/\D/g, "")

    if (!normalizedPhone) {
      newErrors.phone = "Số điện thoại là bắt buộc"
    } else if (!/^[0-9]{10,11}$/.test(normalizedPhone)) {
      newErrors.phone = "Số điện thoại phải có 10-11 chữ số"
    }

    if (!formData.dob) {
      newErrors.dob = "Ngày sinh là bắt buộc";
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();

      // Xóa giờ phút giây để so sánh đúng ngày
      dob.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (dob > today) {
        newErrors.dob = "Ngày sinh không được vượt quá ngày hôm nay";
      }
    }

    if (!formData.gender) {
      newErrors.gender = "Giới tính là bắt buộc"
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc"
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp"
    }

    if (!formData.role || formData.role === 0) {
      newErrors.role = "Vai trò là bắt buộc"
    }

    // Validate doctor-specific fields
    if (formData.role === 4) { // Doctor role
      if (!formData.specialty || !formData.specialty.trim()) {
        newErrors.specialty = "Chuyên khoa là bắt buộc cho bác sĩ"
      }
      if (!formData.experienceYears || !formData.experienceYears.trim()) {
        newErrors.experienceYears = "Số năm kinh nghiệm là bắt buộc"
      } else {
        const years = parseInt(formData.experienceYears)
        if (isNaN(years) || years < 0) {
          newErrors.experienceYears = "Số năm kinh nghiệm phải là số dương"
        }
      }
      if (!formData.roomId || !formData.roomId.trim()) {
        newErrors.roomId = "Phòng làm việc là bắt buộc"
      } else {
        const roomIdNum = parseInt(formData.roomId)
        if (isNaN(roomIdNum) || roomIdNum <= 0) {
          newErrors.roomId = "Phòng làm việc phải là số dương"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin")
      return
    }

    setLoading(true)

    try {
      // Upload avatar if file is selected
      let avatarUrl = formData.avatar
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(avatarFile)
        } catch (error: any) {
          toast.error(error.message || "Không thể tải ảnh đại diện")
          setLoading(false)
          return
        }
      }

      // Prepare create data, only include non-empty fields
      const normalizedPhone = formData.phone.replace(/\D/g, "")

      const createData: CreateUserRequest = {
        phone: normalizedPhone,
        password: formData.password,
        fullName: formData.fullName.trim(),
        roleId: formData.role
      }

      // Only add optional fields if they have values
      if (formData.email && formData.email.trim()) {
        createData.email = formData.email.trim()
      }
      if (formData.dob) {
        createData.dob = new Date(formData.dob).toISOString().split('T')[0]
      }
      if (formData.gender && formData.gender.trim()) {
        createData.gender = formData.gender.trim()
      }
      if (formData.allergies && formData.allergies.trim()) {
        createData.allergies = formData.allergies.trim()
      }
      if (formData.medicalHistory && formData.medicalHistory.trim()) {
        createData.medicalHistory = formData.medicalHistory.trim()
      }
      if (avatarUrl && avatarUrl.trim()) {
        createData.avatar = avatarUrl.trim()
      }

      // Add doctor-specific fields if role is Doctor (required fields)
      if (formData.role === 4) { // Doctor role
        // These fields are required for doctors, so we should always include them
        if (!formData.specialty || !formData.specialty.trim()) {
          toast.error("Vui lòng chọn chuyên khoa cho bác sĩ")
          setLoading(false)
          return
        }
        if (!formData.experienceYears || !formData.experienceYears.trim()) {
          toast.error("Vui lòng nhập số năm kinh nghiệm")
          setLoading(false)
          return
        }
        if (!formData.roomId || !formData.roomId.trim()) {
          toast.error("Vui lòng chọn phòng làm việc")
          setLoading(false)
          return
        }

        createData.specialty = formData.specialty.trim()
        createData.experienceYears = parseInt(formData.experienceYears)
        createData.roomId = parseInt(formData.roomId)
      }

      await adminService.createUserAdmin(createData)
      toast.success("Tạo người dùng thành công!")
      router.push("/admin/users")
    } catch (err: any) {
      console.warn("Error creating user:", err)

      const isDuplicatePhone =
        err instanceof ApiError &&
        err.status === 400 &&
        typeof err.message === "string" &&
        err.message.toLowerCase().includes("số điện thoại")

      if (isDuplicatePhone) {
        const duplicateMsg = err.message || "Số điện thoại đã được sử dụng"
        setErrors(prev => ({
          ...prev,
          phone: duplicateMsg
        }))
        toast.error(duplicateMsg)
        return
      }

      // Handle specific errors for doctor fields
      const errorMsg = err.message || ""
      if (errorMsg.toLowerCase().includes("chuyên khoa")) {
        setErrors(prev => ({
          ...prev,
          specialty: errorMsg
        }))
        toast.error(errorMsg)
        return
      }
      if (errorMsg.toLowerCase().includes("kinh nghiệm")) {
        setErrors(prev => ({
          ...prev,
          experienceYears: errorMsg
        }))
        toast.error(errorMsg)
        return
      }
      if (errorMsg.toLowerCase().includes("phòng")) {
        setErrors(prev => ({
          ...prev,
          roomId: errorMsg
        }))
        toast.error(errorMsg)
        return
      }

      const errorMessage = errorMsg || "Không thể tạo người dùng"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout navigation={navigation}>
      <ClientOnly fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      }>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/users")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Tạo người dùng mới</h1>
                <p className="text-muted-foreground">Thêm người dùng mới vào hệ thống</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cơ bản</CardTitle>
                  <CardDescription>Thông tin cá nhân của người dùng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className={errors.fullName ? "border-red-500" : ""}
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                    {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                      placeholder="example@email.com"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={errors.phone ? "border-red-500" : ""}
                      placeholder="0123 456 789"
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Vai trò *</Label>
                    <Select
                      value={formData.role.toString()}
                      onValueChange={(value) => handleInputChange("role", parseInt(value))}
                    >
                      <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                  </div>

                  {/* Doctor-specific fields */}
                  {formData.role === 4 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Chuyên khoa *</Label>
                        <Select
                          value={formData.specialty}
                          onValueChange={(value) => handleInputChange("specialty", value)}
                        >
                          <SelectTrigger className={errors.specialty ? "border-red-500" : ""}>
                            <SelectValue placeholder="Chọn chuyên khoa" />
                          </SelectTrigger>
                          <SelectContent>
                            {specialties.length > 0 ? (
                              specialties.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>
                                  {specialty}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Đang tải danh sách chuyên khoa...
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experienceYears">Số năm kinh nghiệm *</Label>
                        <Input
                          id="experienceYears"
                          type="number"
                          min="0"
                          value={formData.experienceYears}
                          onChange={(e) => handleInputChange("experienceYears", e.target.value)}
                          className={errors.experienceYears ? "border-red-500" : ""}
                          placeholder="Nhập số năm kinh nghiệm"
                        />
                        {errors.experienceYears && <p className="text-sm text-red-500">{errors.experienceYears}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roomId">Phòng làm việc *</Label>
                        <Select
                          value={formData.roomId}
                          onValueChange={(value) => handleInputChange("roomId", value)}
                        >
                          <SelectTrigger className={errors.roomId ? "border-red-500" : ""}>
                            <SelectValue placeholder={rooms.length > 0 ? "Chọn phòng làm việc" : "Đang tải danh sách phòng..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.length > 0 ? (
                              rooms.map((room) => (
                                <SelectItem key={room.roomId} value={room.roomId.toString()}>
                                  {room.roomName} (ID: {room.roomId})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Đang tải danh sách phòng...
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.roomId && <p className="text-sm text-red-500">{errors.roomId}</p>}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin tài khoản</CardTitle>
                  <CardDescription>Thông tin đăng nhập và bảo mật</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Ảnh đại diện</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          id="avatar"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Chọn ảnh
                        </Button>
                        {avatarFile && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={loading}
                          >
                            Xóa
                          </Button>
                        )}
                      </div>

                      {(avatarPreview || formData.avatar) && (
                        <div className="flex items-center gap-3 rounded-lg border p-3">
                          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-muted">
                            <img
                              src={avatarPreview || formData.avatar || "/placeholder-user.jpg"}
                              alt="Avatar preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-user.jpg"
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Xem trước ảnh đại diện</p>
                            {avatarFile && (
                              <p className="text-xs text-muted-foreground">
                                {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {!avatarPreview && !formData.avatar && (
                        <div className="flex items-center gap-3 rounded-lg border border-dashed p-3 text-muted-foreground">
                          <User className="h-8 w-8" />
                          <p className="text-sm">Chưa có ảnh đại diện</p>
                        </div>
                      )}
                    </div>
                    {errors.avatar && <p className="text-sm text-red-500">{errors.avatar}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={errors.password ? "border-red-500" : ""}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                      placeholder="Nhập lại mật khẩu"
                    />
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Giới tính *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Ngày sinh *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                    />
                    {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medical Information */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Thông tin y tế</CardTitle>
                <CardDescription>Thông tin về sức khỏe và tiền sử bệnh lý</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Dị ứng</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleInputChange("allergies", e.target.value)}
                    placeholder="Nhập thông tin dị ứng (nếu có)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Tiền sử bệnh lý</Label>
                  <Textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    placeholder="Nhập tiền sử bệnh lý (nếu có)"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card> */}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Tạo người dùng
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </ClientOnly>
    </DashboardLayout>
  )
}
