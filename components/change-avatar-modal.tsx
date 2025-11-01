"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X, User } from "lucide-react"
import { toast } from "sonner"
import { authService } from "@/lib/services/auth.service"
import { avatarService } from "@/lib/services/avatar.service"

interface ChangeAvatarModalProps {
    isOpen: boolean
    onClose: () => void
    currentAvatar?: string
    userName?: string
    onAvatarChange: (avatarUrl: string) => void
}

export function ChangeAvatarModal({
    isOpen,
    onClose,
    currentAvatar,
    userName = "User",
    onAvatarChange
}: ChangeAvatarModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
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

            setSelectedFile(file)

            // Create preview URL
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Vui lòng chọn ảnh đại diện")
            return
        }

        setIsUploading(true)
        try {
            // Call API to upload avatar
            const response = await authService.changeAvatar(selectedFile)

            onAvatarChange(response.avatarUrl)
            toast.success("Cập nhật ảnh đại diện thành công!")
            onClose()

            // Clean up
            handleRemoveFile()
        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast.error("Có lỗi xảy ra khi cập nhật ảnh đại diện")
        } finally {
            setIsUploading(false)
        }
    }

    const handleClose = () => {
        handleRemoveFile()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Thay đổi ảnh đại diện
                    </DialogTitle>
                    <DialogDescription>
                        Chọn ảnh đại diện mới cho tài khoản của bạn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Avatar Preview */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={previewUrl || currentAvatar || "/placeholder-user.jpg"}
                                    alt={userName}
                                />
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {previewUrl && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                    onClick={handleRemoveFile}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>

                        {previewUrl ? (
                            <p className="text-sm text-green-600 font-medium">
                                Ảnh mới đã được chọn
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Ảnh đại diện hiện tại
                            </p>
                        )}
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="avatar-upload">Chọn ảnh đại diện</Label>
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                ref={fileInputRef}
                                className="cursor-pointer"
                            />
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Định dạng: JPG, PNG, GIF</p>
                            <p>• Kích thước tối đa: 5MB</p>
                            <p>• Khuyến nghị: ảnh vuông, độ phân giải cao</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={isUploading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="flex-1"
                        >
                            {isUploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Đang tải lên...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Cập nhật
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
