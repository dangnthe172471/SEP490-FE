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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { BarChart3, FileText, TrendingUp, Plus, Edit2, Trash2, Search, TestTube, Loader2, Building2, Lock } from "lucide-react"
import { useState, useEffect } from "react"
import { testTypeService } from "@/lib/services/test-type-service"
import { TestTypeDto, CreateTestTypeRequest, UpdateTestTypeRequest } from "@/lib/types/test-type"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getManagerNavigation } from "@/lib/navigation/manager-navigation"

interface FormData {
    testName: string
    description: string
}

export default function TestTypesManagementPage() {
    // Get manager navigation from centralized config
    const navigation = getManagerNavigation()

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
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [pageNumber, setPageNumber] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const filteredTestTypes = testTypes

    // 🔒 KIỂM TRA QUYỀN TRUY CẬP
    useEffect(() => {
        if (typeof window === "undefined") return

        const userStr = localStorage.getItem("currentUser")

        if (!userStr) {
            // Không có user đã đăng nhập, redirect về login
            router.push('/login')
            return
        }

        try {
            const user = JSON.parse(userStr)

            // Kiểm tra xem user có role management không
            if (user.role !== 'management') {
                toast({
                    title: "Truy cập bị từ chối",
                    description: "Bạn không có quyền truy cập trang này. Chỉ Quản lý mới có thể xem.",
                    variant: "destructive"
                })
                // Redirect về homepage
                router.push('/')
                return
            }

            setIsAuthorized(true)
        } catch (error) {
            router.push('/login')
        }
    }, [router, toast])

    // Load test types (paged) from API
    const loadTestTypes = async () => {
        try {
            setLoading(true)
            const result = await testTypeService.getPaged(pageNumber, pageSize, searchTerm || undefined)
            setTestTypes(result.data)
            setTotalPages(result.totalPages)
            setTotalCount(result.totalCount)
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
        if (isAuthorized) {
            loadTestTypes()
        }
    }, [isAuthorized, pageNumber, pageSize, searchTerm])

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
                await testTypeService.create(createData)

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

    // 🔒 HIỂN THỊ LOADING SCREEN KHI KIỂM TRA QUYỀN
    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Lock className="h-12 w-12 text-destructive" />
                            <h3 className="text-lg font-semibold">Truy cập bị từ chối</h3>
                            <p className="text-sm text-muted-foreground">
                                Bạn không có quyền truy cập trang này. Chỉ Quản lý mới có thể xem danh sách loại xét nghiệm.
                            </p>
                            <Button onClick={() => router.push('/')} className="mt-4">
                                Về trang chủ
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
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
                            <div className="text-2xl font-bold">{totalCount}</div>
                            <p className="text-xs text-muted-foreground">Loại xét nghiệm trong hệ thống</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Đang sử dụng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCount}</div>
                            <p className="text-xs text-muted-foreground">Loại xét nghiệm hoạt động</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kết quả tìm kiếm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCount}</div>
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
                        <CardDescription>
                            Hiển thị {filteredTestTypes.length} / {totalCount} loại xét nghiệm
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2">Đang tải...</span>
                            </div>
                        ) : (
                            <>
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
                                <Pagination className="mt-4">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setPageNumber((p) => Math.max(1, p - 1))
                                                }}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={pageNumber === i + 1}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        setPageNumber(i + 1)
                                                    }}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setPageNumber((p) => Math.min(totalPages, p + 1))
                                                }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </>
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