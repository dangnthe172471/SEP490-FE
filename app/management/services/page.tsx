"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Search,
  Loader2,
  TestTube,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Trash2,
} from "lucide-react";
import { serviceService } from "@/lib/services/service-service";
import type { ServiceDto, CreateServiceRequest, UpdateServiceRequest, PagedResponse } from "@/lib/types/service";
import { useToast } from "@/hooks/use-toast";
import { getManagerNavigation } from "@/lib/navigation/manager-navigation";

interface FormData {
  serviceName: string;
  description: string;
  price: number | null;
  isActive: boolean;
}

export default function ServicesManagementPage() {
  const navigation = getManagerNavigation();

  const [services, setServices] = useState<ServiceDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isActiveFilter, setIsActiveFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    serviceName: "",
    description: "",
    price: null,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Load services với phân trang + filter
  const loadServices = async (
    _page = pageNumber,
    _size = pageSize,
    _isActive: "All" | "Active" | "Inactive" = isActiveFilter
  ) => {
    try {
      setLoading(true);

      // Tạo searchTerm kết hợp với filter
      let effectiveSearchTerm = searchTerm.trim();
      if (_isActive !== "All") {
        // Nếu có filter, không cần thêm vào searchTerm vì backend sẽ filter
        // Nhưng ta có thể filter client-side sau khi load
      }

      const result: PagedResponse<ServiceDto> = await serviceService.getPaged(
        _page,
        _size,
        effectiveSearchTerm || undefined
      );

      // Filter client-side theo isActive nếu cần
      let filteredItems = result.data;
      if (_isActive !== "All") {
        filteredItems = result.data.filter((s) =>
          _isActive === "Active" ? s.isActive : !s.isActive
        );
      }

      setServices(filteredItems);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setPageNumber(result.pageNumber);
      setPageSize(result.pageSize);
    } catch (error: any) {
      console.error("Failed to load services:", error);
      setServices([]);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách dịch vụ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices(1, pageSize, isActiveFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi đổi filter -> reset về trang 1 và reload
  useEffect(() => {
    loadServices(1, pageSize, isActiveFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveFilter]);

  // Lọc client-side trên TRANG HIỆN TẠI (search)
  const filteredServices = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return services;
    return services.filter((s) => {
      const name = (s.serviceName || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      const category = (s.category || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || category.includes(q);
    });
  }, [services, searchTerm]);

  const handleOpenDialog = (service?: ServiceDto) => {
    if (service) {
      setEditingId(service.serviceId);
      setFormData({
        serviceName: service.serviceName,
        description: service.description || "",
        price: service.price ?? null,
        isActive: service.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        serviceName: "",
        description: "",
        price: null,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  // Validate form before save
  const validateForm = (): string | null => {
    if (!formData.serviceName.trim()) {
      return "Vui lòng nhập tên dịch vụ";
    }
    if (formData.serviceName.trim().length < 2) {
      return "Tên dịch vụ phải có ít nhất 2 ký tự";
    }
    if (formData.serviceName.trim().length > 150) {
      return "Tên dịch vụ không được vượt quá 150 ký tự";
    }
    if (formData.description && formData.description.trim().length > 500) {
      return "Mô tả không được vượt quá 500 ký tự";
    }
    if (formData.price !== null && formData.price < 0) {
      return "Giá dịch vụ không được âm";
    }
    if (formData.price !== null && formData.price > 999999999) {
      return "Giá dịch vụ không được vượt quá 999.999.999 VNĐ";
    }
    return null;
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ serviceName: "", description: "", price: null, isActive: true });
  };

  const handleOpenDeleteDialog = (service: ServiceDto) => {
    setDeletingId(service.serviceId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSave = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      toast({ title: "Lỗi", description: validationError, variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        const updateData: UpdateServiceRequest = {
          serviceName: formData.serviceName.trim(),
          description: formData.description.trim() || null,
          price: formData.price,
          isActive: formData.isActive,
        };
        await serviceService.update(editingId, updateData);
        await loadServices(pageNumber, pageSize, isActiveFilter);
        toast({ title: "Thành công", description: "Cập nhật dịch vụ thành công" });
      } else {
        const createData: CreateServiceRequest = {
          serviceName: formData.serviceName.trim(),
          description: formData.description.trim() || null,
          price: formData.price,
          isActive: formData.isActive,
        };
        await serviceService.create(createData);
        await loadServices(1, pageSize, isActiveFilter);
        toast({ title: "Thành công", description: "Tạo dịch vụ thành công" });
      }

      handleCloseDialog();
    } catch (error: any) {
      console.error("Failed to save service:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lưu dịch vụ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      await serviceService.delete(deletingId);
      await loadServices(pageNumber, pageSize, isActiveFilter);
      toast({ title: "Thành công", description: "Xóa dịch vụ thành công" });
      handleCloseDeleteDialog();
    } catch (error: any) {
      console.error("Failed to delete service:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể xóa dịch vụ",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? ("default" as const) : ("secondary" as const);
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Hoạt động" : "Không hoạt động";
  };

  // Handlers phân trang
  const canPrev = pageNumber > 1;
  const canNext = pageNumber < totalPages;

  const goFirst = () => canPrev && loadServices(1, pageSize, isActiveFilter);
  const goPrev = () => canPrev && loadServices(pageNumber - 1, pageSize, isActiveFilter);
  const goNext = () => canNext && loadServices(pageNumber + 1, pageSize, isActiveFilter);
  const goLast = () => canNext && loadServices(totalPages, pageSize, isActiveFilter);

  const handleChangePageSize = (value: number) => {
    setPageSize(value);
    loadServices(1, value, isActiveFilter);
  };

  // Format giá để hiển thị (200.000 ₫)
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format giá để nhập (chỉ số, có dấu chấm ngăn cách)
  const formatPriceInput = (value: string | number | null): string => {
    if (value === null || value === undefined || value === "") return "";
    const str = typeof value === "number" ? value.toString() : value;
    // Xóa tất cả ký tự không phải số
    const numbers = str.replace(/\D/g, "");
    if (!numbers) return "";

    // Chuyển sang số và format lại với dấu chấm
    const num = parseInt(numbers, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("vi-VN");
  };

  // Parse giá từ format có dấu chấm về number
  const parsePriceInput = (value: string): number | null => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return null;
    const num = parseInt(numbers, 10);
    return isNaN(num) ? null : num;
  };

  // Handle price input change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const parsed = parsePriceInput(inputValue);
    setFormData({
      ...formData,
      price: parsed,
    });
  };

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý dịch vụ</h1>
            <p className="text-muted-foreground">Quản lý danh sách dịch vụ y tế</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Thêm dịch vụ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Chỉnh sửa" : "Thêm"} dịch vụ</DialogTitle>
                <DialogDescription>
                  {editingId ? "Cập nhật thông tin dịch vụ" : "Tạo dịch vụ mới (Category sẽ tự động là 'Test')"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên dịch vụ *</label>
                  <Input
                    placeholder="Nhập tên dịch vụ"
                    value={formData.serviceName}
                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    placeholder="Nhập mô tả dịch vụ"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Giá (VNĐ)</label>
                  <div className="relative mt-1">
                    <Input
                      type="text"
                      placeholder="Nhập giá dịch vụ (ví dụ: 200000 hoặc 200.000)"
                      value={formatPriceInput(formData.price)}
                      onChange={handlePriceChange}
                      className="pr-12"
                      inputMode="numeric"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₫
                    </span>
                  </div>
                  {formData.price !== null && formData.price > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPrice(formData.price)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Không hoạt động</option>
                  </select>
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
              <CardTitle className="text-sm font-medium">Tổng số dịch vụ</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Tổng số dịch vụ trong hệ thống</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động (trang hiện tại)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter((s) => s.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Đếm theo dữ liệu trang đang xem</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kết quả tìm kiếm (trang hiện tại)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredServices.length}</div>
              <p className="text-xs text-muted-foreground">Lọc theo ô tìm kiếm trên trang hiện tại</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm</CardTitle>
            <CardDescription>Tìm theo tên, mô tả hoặc category (trên trang hiện tại)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter trạng thái */}
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value as "All" | "Active" | "Inactive")}
                className="w-[160px] rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="All">Tất cả</option>
                <option value="Active">Hoạt động</option>
                <option value="Inactive">Không hoạt động</option>
              </select>

              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Xóa tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <div className="flex items-end justify-between gap-4">
              <div>
                <CardTitle>Danh sách dịch vụ</CardTitle>
                <CardDescription>
                  Trang <b>{pageNumber}</b>/<b>{totalPages}</b> · Hiển thị <b>{services.length}</b> / Trang · Tổng{" "}
                  <b>{totalCount}</b>
                </CardDescription>
              </div>
              {/* Page size */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Số dòng/trang</span>
                <select
                  value={pageSize}
                  onChange={(e) => handleChangePageSize(Number(e.target.value))}
                  className="w-[84px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
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
                        <TableHead>STT</TableHead>
                        <TableHead>Tên dịch vụ</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.length > 0 ? (
                        filteredServices.map((service, index) => (
                          <TableRow key={service.serviceId}>
                            <TableCell>
                              <Badge variant="outline">{(pageNumber - 1) * pageSize + index + 1}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{service.serviceName}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {service.description || "-"}
                            </TableCell>
                            <TableCell className="text-sm">{formatPrice(service.price)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{service.category || "Test"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(service.isActive)}>
                                {getStatusLabel(service.isActive)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDialog(service)}
                                  className="gap-1"
                                  disabled={saving}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Sửa
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleOpenDeleteDialog(service)}
                                  className="gap-1"
                                  disabled={deleting}
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
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "Không tìm thấy dịch vụ nào trong trang hiện tại" : "Chưa có dịch vụ nào"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Đang xem <b>{(pageNumber - 1) * pageSize + (services.length > 0 ? 1 : 0)}</b>–
                    <b>{Math.min((pageNumber - 1) * pageSize + services.length, totalCount)}</b> trên <b>{totalCount}</b>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={goFirst} disabled={!canPrev}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goPrev} disabled={!canPrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm">
                      Trang <b>{pageNumber}</b> / <b>{totalPages}</b>
                    </span>
                    <Button variant="outline" size="sm" onClick={goNext} disabled={!canNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goLast} disabled={!canNext}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCloseDeleteDialog} disabled={deleting}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xóa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

