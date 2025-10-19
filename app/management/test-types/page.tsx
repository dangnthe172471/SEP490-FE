"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, FileText, TrendingUp, Plus, Edit2, Trash2, Search, TestTube, Loader2, Pill, } from "lucide-react"
import { useState, useEffect } from "react"
import { testTypeService } from "@/lib/services/test-type-service"
import { TestTypeDto, CreateTestTypeRequest, UpdateTestTypeRequest } from "@/lib/types/test-type"
import { useToast } from "@/hooks/use-toast"

const navigation = [
    { name: "Tổng quan", href: "/management", icon: BarChart3 },
    { name: "Báo cáo", href: "/management/reports", icon: FileText },
    { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
    { name: "Loại xét nghiệm", href: "/management/test-types", icon: TestTube },
    { name: "Thuốc", href: "/management/medicines", icon: Pill },
]

interface FormData {
    testName: string
    description: string
}

export default function TestTypesManagementPage() {
    const [testTypes, setTestTypes] = useState<TestTypeDto[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [formData, setFormData] = useState<FormData>({
        testName: "",
        description: "",
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const { toast } = useToast()

    const filteredTestTypes = testTypes.filter(
        (test) =>
            test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Load test types from API
    const loadTestTypes = async () => {
        try {
            setLoading(true)
            const data = await testTypeService.getAll()
            setTestTypes(data)
        } catch (error) {
            console.error('Failed to load test types:', error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách loại xét nghiệm",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Load data on component mount
    useEffect(() => {
        loadTestTypes()
    }, [])

    const handleOpenDialog = (testType?: TestTypeDto) => {
        if (testType) {
            setEditingId(testType.testTypeId)
            setFormData({
                testName: testType.testName,
                description: testType.description || "",
            })
        } else {
            setEditingId(null)
            setFormData({
                testName: "",
                description: "",
            })
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingId(null)
        setFormData({
            testName: "",
            description: "",
        })
    }

    const handleSave = async () => {
        if (!formData.testName.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tên loại xét nghiệm",
                variant: "destructive",
            })
            return
        }

        try {
            setSaving(true)

            if (editingId) {
                // Update existing
                const updateData: UpdateTestTypeRequest = {
                    testName: formData.testName,
                    description: formData.description,
                }
                const updatedTestType = await testTypeService.update(editingId, updateData)

                setTestTypes(
                    testTypes.map((test) =>
                        test.testTypeId === editingId ? updatedTestType : test
                    )
                )

                toast({
                    title: "Thành công",
                    description: "Cập nhật loại xét nghiệm thành công",
                })
            } else {
                // Create new
                const createData: CreateTestTypeRequest = {
                    testName: formData.testName,
                    description: formData.description,
                }
                const newId = await testTypeService.create(createData)

                // Reload data to get the complete object
                await loadTestTypes()

                toast({
                    title: "Thành công",
                    description: "Tạo loại xét nghiệm thành công",
                })
            }

            handleCloseDialog()
        } catch (error) {
            console.error('Failed to save test type:', error)
            toast({
                title: "Lỗi",
                description: "Không thể lưu loại xét nghiệm",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteClick = (id: number) => {
        setDeleteId(id)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!deleteId) return

        try {
            setDeleting(true)
            await testTypeService.delete(deleteId)

            setTestTypes(testTypes.filter((test) => test.testTypeId !== deleteId))

            toast({
                title: "Thành công",
                description: "Xóa loại xét nghiệm thành công",
            })
        } catch (error) {
            console.error('Failed to delete test type:', error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa loại xét nghiệm",
                variant: "destructive",
            })
        } finally {
            setDeleting(false)
            setIsDeleteDialogOpen(false)
            setDeleteId(null)
        }
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Quản lý loại xét nghiệm</h1>
                        <p className="text-muted-foreground">Quản lý các loại xét nghiệm trong hệ thống</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Thêm loại xét nghiệm
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Chỉnh sửa" : "Thêm"} loại xét nghiệm</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Cập nhật thông tin loại xét nghiệm" : "Tạo loại xét nghiệm mới"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Tên loại xét nghiệm *</label>
                                    <Input
                                        placeholder="Nhập tên loại xét nghiệm"
                                        value={formData.testName}
                                        onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Mô tả</label>
                                    <Textarea
                                        placeholder="Nhập mô tả loại xét nghiệm"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1"
                                        rows={4}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingId ? "Cập nhật" : "Tạo"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng loại xét nghiệm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{testTypes.length}</div>
                            <p className="text-xs text-muted-foreground">Loại xét nghiệm trong hệ thống</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đang sử dụng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{testTypes.length}</div>
                            <p className="text-xs text-muted-foreground">Loại xét nghiệm hoạt động</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kết quả tìm kiếm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredTestTypes.length}</div>
                            <p className="text-xs text-muted-foreground">Loại xét nghiệm phù hợp</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tìm kiếm</CardTitle>
                        <CardDescription>Tìm kiếm loại xét nghiệm theo tên hoặc mô tả</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm loại xét nghiệm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button variant="outline" onClick={() => setSearchTerm("")}>
                                Xóa
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Test Types Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách loại xét nghiệm</CardTitle>
                        <CardDescription>Hiển thị {filteredTestTypes.length} loại xét nghiệm</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Đang tải...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Tên loại xét nghiệm</TableHead>
                                            <TableHead>Mô tả</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTestTypes.length > 0 ? (
                                            filteredTestTypes.map((testType) => (
                                                <TableRow key={testType.testTypeId}>
                                                    <TableCell>
                                                        <Badge variant="outline">{testType.testTypeId}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{testType.testName}</TableCell>
                                                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                                        {testType.description || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenDialog(testType)}
                                                                className="gap-1"
                                                                disabled={saving || deleting}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                                Sửa
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDeleteClick(testType.testTypeId)}
                                                                className="gap-1"
                                                                disabled={saving || deleting}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Xóa
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    {searchTerm ? "Không tìm thấy loại xét nghiệm nào" : "Chưa có loại xét nghiệm nào"}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa loại xét nghiệm này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xóa
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    )
}
