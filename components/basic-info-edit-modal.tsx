"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Save,
    X
} from "lucide-react"
import { toast } from "sonner"
import { authService } from "@/lib/services/auth.service"

interface BasicInfo {
    fullName: string
    email: string
    phone: string
    dob: string
    gender: string
}

interface BasicInfoEditModalProps {
    isOpen: boolean
    onClose: () => void
    basicInfo: BasicInfo
    onSave: (updatedInfo: BasicInfo) => void
}

export function BasicInfoEditModal({ isOpen, onClose, basicInfo, onSave }: BasicInfoEditModalProps) {
    const [formData, setFormData] = useState<BasicInfo>(basicInfo)
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field: keyof BasicInfo, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = async () => {
        try {
            setIsLoading(true)

            // Validate required fields
            if (!formData.fullName?.trim()) {
                toast.error("Vui lòng nhập họ và tên")
                setIsLoading(false)
                return
            }

            // Validate email is required
            if (!formData.email?.trim()) {
                toast.error("Vui lòng nhập email")
                setIsLoading(false)
                return
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email.trim())) {
                toast.error("Email không hợp lệ")
                setIsLoading(false)
                return
            }

            // Validate date of birth must be before today
            if (formData.dob) {
                const dobDate = new Date(formData.dob)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                if (dobDate >= today) {
                    toast.error("Ngày sinh phải trước ngày hôm nay")
                    setIsLoading(false)
                    return
                }
            }

            // Phone is disabled, so no need to validate

            // Call API to update basic info
            const response = await authService.updateBasicInfo(formData)

            onSave({
                fullName: response.user.fullName || '',
                email: response.user.email || '',
                phone: response.user.phone || '',
                dob: response.user.dob?.toString() || '',
                gender: response.user.gender || ''
            })
            toast.success(response.message)
            onClose()
        } catch (error) {
            console.error('Error updating basic info:', error)
            toast.error("Có lỗi xảy ra khi cập nhật thông tin")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData(basicInfo) // Reset to original data
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Cập nhật thông tin cơ bản
                    </DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin cá nhân cơ bản của bạn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Thông tin cá nhân
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Họ và tên *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                                        className="pl-10"
                                        placeholder="Nhập họ và tên"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="pl-10 bg-gray-100 cursor-not-allowed"
                                        placeholder="Nhập số điện thoại"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="pl-10"
                                        placeholder="Nhập email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dob">Ngày sinh</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => handleInputChange('dob', e.target.value)}
                                        className="pl-10"
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Giới tính</Label>
                                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn giới tính" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Nam">Nam</SelectItem>
                                        <SelectItem value="Nữ">Nữ</SelectItem>
                                        <SelectItem value="Khác">Khác</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <X className="h-4 w-4" />
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
