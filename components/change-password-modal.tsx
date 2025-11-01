"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"
import { toast } from "sonner"
import { authService } from "@/lib/services/auth.service"

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onPasswordChange: () => void
}


export function ChangePasswordModal({
    isOpen,
    onClose,
    onPasswordChange
}: ChangePasswordModalProps) {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    })
    const [isLoading, setIsLoading] = useState(false)

    // Real-time validation
    const isNewPasswordValid = formData.newPassword.length >= 6
    const doPasswordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== ""
    const isFormValid = isNewPasswordValid && doPasswordsMatch && formData.currentPassword !== ""

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation only
        if (!formData.currentPassword) {
            toast.error("Vui lòng nhập mật khẩu hiện tại")
            return
        }

        if (!formData.newPassword) {
            toast.error("Vui lòng nhập mật khẩu mới")
            return
        }

        if (formData.newPassword.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự")
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp")
            return
        }

        if (formData.currentPassword === formData.newPassword) {
            toast.error("Mật khẩu mới phải khác mật khẩu hiện tại")
            return
        }

        setIsLoading(true)
        try {
            // Call API to change password
            await authService.changePassword(formData.currentPassword, formData.newPassword)

            toast.success("Đổi mật khẩu thành công!")
            onPasswordChange()
            onClose()

            // Reset form
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            })
        } catch (error) {
            console.error('Error changing password:', error)
            // Show specific error message from API
            const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi đổi mật khẩu"
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        })
        setShowPasswords({
            current: false,
            new: false,
            confirm: false
        })
        onClose()
    }


    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Đổi mật khẩu
                    </DialogTitle>
                    <DialogDescription>
                        Để bảo mật tài khoản, hãy sử dụng mật khẩu mạnh và không chia sẻ với ai
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showPasswords.current ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                                placeholder="Nhập mật khẩu hiện tại"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => togglePasswordVisibility('current')}
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Mật khẩu mới</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPasswords.new ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => togglePasswordVisibility('new')}
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {formData.newPassword && (
                            <div className={`text-sm ${isNewPasswordValid ? 'text-green-600' : 'text-red-600'}`}>
                                {isNewPasswordValid ? '✓ Mật khẩu hợp lệ' : '✗ Mật khẩu phải có ít nhất 6 ký tự'}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showPasswords.confirm ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => togglePasswordVisibility('confirm')}
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {formData.confirmPassword && (
                            <div className={`text-sm ${doPasswordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                {doPasswordsMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isFormValid || isLoading}
                            className="flex-1"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Đổi mật khẩu
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
