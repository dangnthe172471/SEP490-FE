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
  BarChart3,
  FileText,
  TrendingUp,
  Plus,
  Edit2,
  Search,
  Package,
  Loader2,
  TestTube,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { medicineService } from "@/lib/services/medicine-service";
import type { ReadMedicineDto, CreateMedicineDto, UpdateMedicineDto, PagedResult } from "@/lib/types/medicine";
import { useToast } from "@/hooks/use-toast";
import { getManagerNavigation } from "@/lib/navigation/manager-navigation";

interface FormData {
  medicineName: string;
  sideEffects: string;
  status: "Providing" | "Stopped";
}

/** Giải mã JWT (base64url) an toàn, KHÔNG xác minh chữ ký (chỉ client-side parse) */
function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Lấy role từ các claim có thể xuất hiện */
function getRoleFromClaims(payload: any): string | null {
  if (!payload || typeof payload !== "object") return null;
  const msRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const role = payload.role ?? msRole ?? null;
  return typeof role === "string" ? role : Array.isArray(role) ? role[0] : null;
}

/** Chuẩn hoá trạng thái: chỉ 2 giá trị hợp lệ cho UI */
function normalizeStatus(raw?: string): "Providing" | "Stopped" {
  return (raw || "").toLowerCase() === "providing" ? "Providing" : "Stopped";
}

export default function MedicinesManagementPage() {
  const [token, setToken] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);

  // Get manager navigation from centralized config
  const navigation = getManagerNavigation()

  const [medicines, setMedicines] = useState<ReadMedicineDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [statusFilter, setStatusFilter] = useState<"All" | "Providing" | "Stopped">("All"); // <-- NEW
  const [sortBy, setSortBy] = useState<"" | "az" | "za">("");                                 // <-- NEW

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    medicineName: "",
    sideEffects: "",
    status: "Providing",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Lấy token từ localStorage & rút role từ JWT
  useEffect(() => {
    const t = localStorage.getItem("auth_token") || "";
    setToken(t);

    if (t) {
      const payload = decodeJwtPayload(t);
      const r = getRoleFromClaims(payload);
      setRole(r);
    } else {
      setRole(null);
      setLoading(false);
    }
  }, []);

  const isProvider = (role || "").toLowerCase() === "pharmacy provider";
  const blocked = role !== null && !isProvider;

  // Load theo phân trang + filter/sort
  const loadMine = async (
    _page = pageNumber,
    _size = pageSize,
    _status: "All" | "Providing" | "Stopped" = statusFilter,
    _sort: "" | "az" | "za" = sortBy
  ) => {
    if (!token || !isProvider) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const effectiveStatus = _status === "All" ? undefined : _status; // chỉ gửi khi khác All
      const effectiveSort = _sort || undefined;                        // "" thì không gửi

      const result: PagedResult<ReadMedicineDto> = await medicineService.getMinePaged(
        token,
        _page,
        _size,
        effectiveStatus as "Providing" | "Stopped" | undefined,
        effectiveSort as "az" | "za" | undefined
      );

      const normalizedItems = (result.items || []).map((m) => ({
        ...m,
        status: normalizeStatus(m.status),
      }));

      setMedicines(normalizedItems);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setPageNumber(result.pageNumber);
      setPageSize(result.pageSize);
    } catch (error: any) {
      console.error("Failed to load medicines:", error);
      setMedicines([]);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải danh sách thuốc",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isProvider) {
      loadMine(1, pageSize, statusFilter, sortBy);
    } else if (blocked) {
      setLoading(false);
      toast({
        title: "Không có quyền",
        description: "Trang này chỉ dành cho tài khoản Pharmacy Provider.",
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  // Khi đổi filter/sort -> reset về trang 1 và reload
  useEffect(() => {
    if (token && isProvider) {
      loadMine(1, pageSize, statusFilter, sortBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortBy]);

  // lọc client-side trên TRANG HIỆN TẠI (search)
  const filteredMedicines = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return medicines;
    return medicines.filter((m) => {
      const name = (m.medicineName || "").toLowerCase();
      const side = (m.sideEffects || "").toLowerCase();
      const provider = (m.providerName || "").toLowerCase();
      return name.includes(q) || side.includes(q) || provider.includes(q);
    });
  }, [medicines, searchTerm]);

  const handleOpenDialog = (medicine?: ReadMedicineDto) => {
    if (medicine) {
      setEditingId(medicine.medicineId);
      setFormData({
        medicineName: medicine.medicineName,
        sideEffects: medicine.sideEffects || "",
        status: normalizeStatus(medicine.status),
      });
    } else {
      setEditingId(null);
      setFormData({
        medicineName: "",
        sideEffects: "",
        status: "Providing",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ medicineName: "", sideEffects: "", status: "Providing" });
  };

  const handleSave = async () => {
    if (!formData.medicineName.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên thuốc", variant: "destructive" });
      return;
    }
    if (!token) {
      toast({ title: "Lỗi", description: "Thiếu token. Hãy đăng nhập lại.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      const payloadStatus: "Providing" | "Stopped" = normalizeStatus(formData.status);

      if (editingId) {
        const updateData: UpdateMedicineDto = {
          medicineName: formData.medicineName,
          sideEffects: formData.sideEffects,
          status: payloadStatus,
        };
        await medicineService.update(editingId, updateData, token);
        await loadMine(pageNumber, pageSize, statusFilter, sortBy); // refresh trang hiện tại với filter/sort
        toast({ title: "Thành công", description: "Cập nhật thuốc thành công" });
      } else {
        const createData: CreateMedicineDto = {
          medicineName: formData.medicineName,
          sideEffects: formData.sideEffects,
          status: payloadStatus,
        };
        await medicineService.create(createData, token);
        await loadMine(1, pageSize, statusFilter, sortBy); // về trang 1, giữ filter/sort
        toast({ title: "Thành công", description: "Tạo thuốc thành công" });
      }

      handleCloseDialog();
    } catch (error: any) {
      console.error("Failed to save medicine:", error);
      toast({ title: "Lỗi", description: error?.message || "Không thể lưu thuốc", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (normalizeStatus(status)) {
      case "Providing":
        return "default" as const;
      case "Stopped":
        return "destructive" as const;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (normalizeStatus(status)) {
      case "Providing":
        return "Providing";
      case "Stopped":
        return "Stopped";
    }
  };

  // handlers phân trang
  const canPrev = pageNumber > 1;
  const canNext = pageNumber < totalPages;

  const goFirst = () => canPrev && loadMine(1, pageSize, statusFilter, sortBy);
  const goPrev = () => canPrev && loadMine(pageNumber - 1, pageSize, statusFilter, sortBy);
  const goNext = () => canNext && loadMine(pageNumber + 1, pageSize, statusFilter, sortBy);
  const goLast = () => canNext && loadMine(totalPages, pageSize, statusFilter, sortBy);

  const handleChangePageSize = (value: number) => {
    setPageSize(value);
    loadMine(1, value, statusFilter, sortBy); // reset về trang 1 khi đổi page size
  };

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý thuốc</h1>
            <p className="text-muted-foreground">Quản lý danh sách thuốc thuộc nhà cung cấp của bạn</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={blocked}>
                <Plus className="h-4 w-4" />
                Thêm thuốc
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Chỉnh sửa" : "Thêm"} thuốc</DialogTitle>
                <DialogDescription>{editingId ? "Cập nhật thông tin thuốc" : "Tạo thuốc mới"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên thuốc *</label>
                  <Input
                    placeholder="Nhập tên thuốc"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tác dụng phụ</label>
                  <Textarea
                    placeholder="Nhập tác dụng phụ của thuốc"
                    value={formData.sideEffects}
                    onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: normalizeStatus(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Providing">Providing</option>
                    <option value="Stopped">Stopped</option>
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

        {/* Cảnh báo quyền khi không phải Provider */}
        {blocked && (
          <Card>
            <CardHeader>
              <CardTitle>Không có quyền truy cập</CardTitle>
              <CardDescription>
                Bạn đang đăng nhập với vai trò <b>{role}</b>. Chức năng này chỉ dành cho <b>Pharmacy Provider</b>.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số thuốc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">Tổng số thuốc thuộc nhà cung cấp của bạn</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang cung cấp (trang hiện tại)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {medicines.filter((m) => normalizeStatus(m.status) === "Providing").length}
              </div>
              <p className="text-xs text-muted-foreground">Đếm theo dữ liệu trang đang xem</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kết quả tìm kiếm (trang hiện tại)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredMedicines.length}</div>
              <p className="text-xs text-muted-foreground">Lọc theo ô tìm kiếm trên trang hiện tại</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm</CardTitle>
            <CardDescription>Tìm theo tên, tác dụng phụ hoặc nhà cung cấp (trên trang hiện tại)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm thuốc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* ✅ Filter trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | "Providing" | "Stopped")}
                className="w-[160px] rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="All">All statuses</option>
                <option value="Providing">Providing</option>
                <option value="Stopped">Stopped</option>
              </select>

              {/* ✅ Sort A→Z / Z→A */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "" | "az" | "za")}
                className="w-[140px] rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="">Sort: default</option>
                <option value="az">Name A → Z</option>
                <option value="za">Name Z → A</option>
              </select>

              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Xóa tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medicines Table */}
        <Card>
          <CardHeader>
            <div className="flex items-end justify-between gap-4">
              <div>
                <CardTitle>Danh sách thuốc</CardTitle>
                <CardDescription>
                  Trang <b>{pageNumber}</b>/<b>{totalPages}</b> · Hiển thị <b>{medicines.length}</b> / Trang · Tổng{" "}
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
                        <TableHead>ID</TableHead>
                        <TableHead>Tên thuốc</TableHead>
                        <TableHead>Tác dụng phụ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicines.length > 0 ? (
                        filteredMedicines.map((medicine) => (
                          <TableRow key={medicine.medicineId}>
                            <TableCell>
                              <Badge variant="outline">{medicine.medicineId}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{medicine.medicineName}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {medicine.sideEffects || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(medicine.status)}>
                                {getStatusLabel(medicine.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{medicine.providerName || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenDialog(medicine)}
                                  className="gap-1"
                                  disabled={saving || blocked}
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Sửa
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {searchTerm ? "Không tìm thấy thuốc nào trong trang hiện tại" : "Chưa có thuốc nào"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Đang xem <b>{(pageNumber - 1) * pageSize + (medicines.length > 0 ? 1 : 0)}</b>–
                    <b>{Math.min((pageNumber - 1) * pageSize + medicines.length, totalCount)}</b> trên <b>{totalCount}</b>
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
      </div>
    </DashboardLayout>
  );
}
