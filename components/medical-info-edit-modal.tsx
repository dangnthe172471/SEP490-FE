"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Heart,
    FileText,
    Save,
    X
} from "lucide-react"
import { toast } from "sonner"
import { authService } from "@/lib/services/auth.service"

interface MedicalInfo {
    allergies: string
    medicalHistory: string
}

interface MedicalInfoEditModalProps {
    isOpen: boolean
    onClose: () => void
    medicalInfo: MedicalInfo
    onSave: (updatedInfo: MedicalInfo) => void
}

export function MedicalInfoEditModal({ isOpen, onClose, medicalInfo, onSave }: MedicalInfoEditModalProps) {
    const [formData, setFormData] = useState<MedicalInfo>(medicalInfo)
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field: keyof MedicalInfo, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = async () => {
        try {
            setIsLoading(true)

            // Call API to update medical info
            const response = await authService.updateMedicalInfo(formData)

            onSave({
                allergies: response.user.allergies || '',
                medicalHistory: response.user.medicalHistory || ''
            })
            toast.success(response.message)
            onClose()
        } catch (error) {
            console.error('Error updating medical info:', error)
            toast.error("Có lỗi xảy ra khi cập nhật thông tin y tế")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData(medicalInfo) // Reset to original data
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Cập nhật thông tin y tế
                    </DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin y tế và sức khỏe của bạn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Thông tin y tế
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="allergies">Dị ứng</Label>
                            <Textarea
                                id="allergies"
                                value={formData.allergies}
                                onChange={(e) => handleInputChange('allergies', e.target.value)}
                                placeholder="Mô tả các loại dị ứng (nếu có). Ví dụ: Dị ứng với penicillin, dị ứng với hải sản..."
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-sm text-muted-foreground">
                                Ghi rõ các loại thuốc, thực phẩm hoặc chất gây dị ứng
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medicalHistory">Bệnh lý nền</Label>
                            <Textarea
                                id="medicalHistory"
                                value={formData.medicalHistory}
                                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                                placeholder="Mô tả các bệnh lý nền, bệnh mãn tính (nếu có). Ví dụ: Tiền sử tăng huyết áp, đái tháo đường..."
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-sm text-muted-foreground">
                                Bao gồm các bệnh mãn tính, tiền sử phẫu thuật, bệnh di truyền
                            </p>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900 mb-1">Lưu ý quan trọng</h4>
                                <p className="text-sm text-blue-800">
                                    Thông tin y tế này sẽ giúp bác sĩ đưa ra chẩn đoán và điều trị chính xác hơn.
                                    Vui lòng cập nhật thông tin một cách chính xác và đầy đủ.
                                </p>
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
