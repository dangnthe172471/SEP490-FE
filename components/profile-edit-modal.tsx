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
    Heart,
    FileText,
    Save,
    X
} from "lucide-react"
import { toast } from "sonner"

interface PatientProfile {
    userId: number
    phone?: string
    fullName?: string
    email?: string
    role?: string
    gender?: string
    dob?: string
    address?: string
    allergies?: string
    medicalHistory?: string
}

interface ProfileEditModalProps {
    isOpen: boolean
    onClose: () => void
    profile: PatientProfile
    onSave: (updatedProfile: PatientProfile) => void
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
    const [formData, setFormData] = useState<PatientProfile>(profile)
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field: keyof PatientProfile, value: string) => {
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
                return
            }

            if (!formData.phone?.trim()) {
                toast.error("Vui lòng nhập số điện thoại")
                return
            }

            // Here you would typically call an API to update the profile
            // For now, we'll just simulate the update
            await new Promise(resolve => setTimeout(resolve, 1000))

            onSave(formData)
            toast.success("Cập nhật thông tin thành công!")
            onClose()
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error("Có lỗi xảy ra khi cập nhật thông tin")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData(profile) // Reset to original data
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Chỉnh sửa thông tin cá nhân
                    </DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin cá nhân và y tế của bạn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Thông tin cơ bản
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Họ và tên *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        value={formData.fullName || ''}
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
                                        value={formData.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="pl-10"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="pl-10"
                                        placeholder="Nhập email"
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
                                        value={formData.dob || ''}
                                        onChange={(e) => handleInputChange('dob', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Giới tính</Label>
                                <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
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

                        <div className="space-y-2">
                            <Label htmlFor="address">Địa chỉ</Label>
                            <Textarea
                                id="address"
                                value={formData.address || ''}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Nhập địa chỉ"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Thông tin y tế
                        </h3>


                        <div className="space-y-2">
                            <Label htmlFor="allergies">Dị ứng</Label>
                            <Textarea
                                id="allergies"
                                value={formData.allergies || ''}
                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                placeholder="Mô tả các loại dị ứng (nếu có)"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medicalHistory">Bệnh lý nền</Label>
                            <Textarea
                                id="medicalHistory"
                                value={formData.medicalHistory || ''}
                                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                                placeholder="Mô tả các bệnh lý nền, bệnh mãn tính (nếu có)"
                                rows={3}
                            />
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
