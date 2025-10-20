"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { BarChart3, FileText, TrendingUp, Plus, Edit2, Trash2, Search, Building2, Loader2, TestTube, Lock } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { roomService } from "@/lib/services/room-service"
import { RoomDto, CreateRoomRequest, UpdateRoomRequest } from "@/lib/types/room"

const navigation = [
    { name: "Tổng quan", href: "/management", icon: BarChart3 },
    { name: "Báo cáo", href: "/management/reports", icon: FileText },
    { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
    { name: "Loại xét nghiệm", href: "/management/test-types", icon: TestTube },
    { name: "Phòng khám", href: "/management/rooms", icon: Building2 },
]

interface FormData {
    roomName: string
}

export default function RoomsManagementPage() {
    const [rooms, setRooms] = useState<RoomDto[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [formData, setFormData] = useState<FormData>({ roomName: "" })
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

    const filteredRooms = rooms

    // Kiểm tra quyền truy cập khi component mount
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

    const loadRooms = async () => {
        try {
            setLoading(true)
            const result = await roomService.getPaged(pageNumber, pageSize, searchTerm || undefined)
            setRooms(result.data)
            setTotalPages(result.totalPages)
            setTotalCount(result.totalCount)
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể tải danh sách phòng", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthorized) {
            loadRooms()
        }
    }, [isAuthorized, pageNumber, pageSize, searchTerm])

    const handleOpenDialog = (room?: RoomDto) => {
        if (room) {
            setEditingId(room.roomId)
            setFormData({ roomName: room.roomName })
        } else {
            setEditingId(null)
            setFormData({ roomName: "" })
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingId(null)
        setFormData({ roomName: "" })
    }

    const handleSave = async () => {
        if (!formData.roomName.trim()) {
            toast({ title: "Lỗi", description: "Vui lòng nhập tên phòng", variant: "destructive" })
            return
        }

        try {
            setSaving(true)
            if (editingId) {
                const data: UpdateRoomRequest = { roomName: formData.roomName }
                const updated = await roomService.update(editingId, data)
                setRooms(rooms.map((r) => (r.roomId === editingId ? updated : r)))
                toast({ title: "Thành công", description: "Cập nhật phòng thành công" })
            } else {
                const data: CreateRoomRequest = { roomName: formData.roomName }
                await roomService.create(data)
                await loadRooms()
                toast({ title: "Thành công", description: "Tạo phòng thành công" })
            }
            handleCloseDialog()
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể lưu phòng", variant: "destructive" })
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
            await roomService.delete(deleteId)
            setRooms(rooms.filter((r) => r.roomId !== deleteId))
            toast({ title: "Thành công", description: "Xóa phòng thành công" })
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể xóa phòng", variant: "destructive" })
        } finally {
            setDeleting(false)
            setIsDeleteDialogOpen(false)
            setDeleteId(null)
        }
    }

    // Hiển thị loading screen khi kiểm tra quyền
    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Lock className="h-12 w-12 text-destructive" />
                            <h3 className="text-lg font-semibold">Truy cập bị từ chối</h3>
                            <p className="text-sm text-muted-foreground">
                                Bạn không có quyền truy cập trang này. Chỉ Quản lý mới có thể xem danh sách phòng.
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Quản lý phòng</h1>
                        <p className="text-muted-foreground">Quản lý các phòng trong hệ thống</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleOpenDialog()} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Thêm phòng
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? "Chỉnh sửa" : "Thêm"} phòng</DialogTitle>
                                <DialogDescription>
                                    {editingId ? "Cập nhật thông tin phòng" : "Tạo phòng mới"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Tên phòng *</label>
                                    <Input
                                        placeholder="Nhập tên phòng"
                                        value={formData.roomName}
                                        onChange={(e) => setFormData({ roomName: e.target.value })}
                                        className="mt-1"
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

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tổng số phòng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCount}</div>
                            <p className="text-xs text-muted-foreground">Số phòng trong hệ thống</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kết quả tìm kiếm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCount}</div>
                            <p className="text-xs text-muted-foreground">Phòng phù hợp</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "Đang tải" : "Sẵn sàng"}</div>
                            <p className="text-xs text-muted-foreground">Trạng thái dữ liệu</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tìm kiếm</CardTitle>
                        <CardDescription>Tìm kiếm theo tên phòng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm phòng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button variant="outline" onClick={() => setSearchTerm("")}>Xóa</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Danh sách phòng</CardTitle>
                        <CardDescription>Hiển thị {filteredRooms.length} / {totalCount} phòng</CardDescription>
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
                                                <TableHead>Tên phòng</TableHead>
                                                <TableHead className="text-right">Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRooms.length > 0 ? (
                                                filteredRooms.map((room) => (
                                                    <TableRow key={room.roomId}>
                                                        <TableCell>
                                                            <Badge variant="outline">{room.roomId}</Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{room.roomName}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="outline" onClick={() => handleOpenDialog(room)} className="gap-1" disabled={saving || deleting}>
                                                                    <Edit2 className="h-4 w-4" />
                                                                    Sửa
                                                                </Button>
                                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(room.roomId)} className="gap-1" disabled={saving || deleting}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Xóa
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                        {searchTerm ? "Không tìm thấy phòng nào" : "Chưa có phòng nào"}
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

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xóa
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    )
}