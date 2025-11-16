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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit2,
  Search,
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X, // <- dùng cho nút đóng kết quả import
} from "lucide-react";
import { medicineService } from "@/lib/services/medicine-service";
import type {
  ReadMedicineDto,
  CreateMedicineDto,
  UpdateMedicineDto,
  PagedResult,
  BulkImportResult,
} from "@/lib/types/medicine";
import { useToast } from "@/hooks/use-toast";
import { getPharmacyNavigation } from "@/lib/navigation/pharmacy-navigation";

interface FormData {
  medicineName: string;
  status: "Providing" | "Stopped";
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  route: string;
  prescriptionUnit: string;
  therapeuticClass: string;
  packSize: string;
  commonSideEffects: string;
  noteForDoctor: string;
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

/** Validate form giống rule BE */
function validateForm(data: FormData): Partial<Record<keyof FormData, string>> {
  const e: Partial<Record<keyof FormData, string>> = {};

  const required: (keyof FormData)[] = [
    "medicineName",
    "activeIngredient",
    "strength",
    "dosageForm",
    "route",
    "prescriptionUnit",
    "therapeuticClass",
    "packSize",
  ];

  required.forEach((field) => {
    if (!data[field] || data[field].trim().length === 0) {
      e[field] = "Trường này là bắt buộc.";
    }
  });

  const len = (v: string) => (v || "").length;

  if (len(data.medicineName) > 200) e.medicineName = "Tối đa 200 ký tự.";
  if (len(data.activeIngredient) > 200) e.activeIngredient = "Tối đa 200 ký tự.";
  if (len(data.strength) > 50) e.strength = "Tối đa 50 ký tự.";
  if (len(data.dosageForm) > 100) e.dosageForm = "Tối đa 100 ký tự.";
  if (len(data.route) > 50) e.route = "Tối đa 50 ký tự.";
  if (len(data.prescriptionUnit) > 50) e.prescriptionUnit = "Tối đa 50 ký tự.";
  if (len(data.therapeuticClass) > 100) e.therapeuticClass = "Tối đa 100 ký tự.";
  if (len(data.packSize) > 100) e.packSize = "Tối đa 100 ký tự.";
  if (len(data.noteForDoctor) > 500) e.noteForDoctor = "Tối đa 500 ký tự.";
  if (len(data.commonSideEffects) > 2000) e.commonSideEffects = "Tối đa 2000 ký tự.";

  return e;
}

export default function MedicinesManagementPage() {
  const navigation = getPharmacyNavigation();

  const [token, setToken] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);

  const [medicines, setMedicines] = useState<ReadMedicineDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [statusFilter, setStatusFilter] = useState<"All" | "Providing" | "Stopped">("All");
  const [sortBy, setSortBy] = useState<"" | "az" | "za">("");

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    medicineName: "",
    status: "Providing",
    activeIngredient: "",
    strength: "",
    dosageForm: "",
    route: "",
    prescriptionUnit: "",
    therapeuticClass: "",
    packSize: "",
    commonSideEffects: "",
    noteForDoctor: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Import Excel
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

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

      const effectiveStatus = _status === "All" ? undefined : _status;
      const effectiveSort = _sort || undefined;

      const result: PagedResult<ReadMedicineDto> = await medicineService.getMinePaged(
        token,
        _page,
        _size,
        effectiveStatus as "Providing" | "Stopped" | undefined,
        effectiveSort as "az" | "za" | undefined
      );

      const normalizedItems = (result.items || []).map((m) => ({
        ...m,
        status: normalizeStatus(m.status ?? undefined),
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

  useEffect(() => {
    if (token && isProvider) {
      loadMine(1, pageSize, statusFilter, sortBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortBy]);

  const filteredMedicines = useMemo(() => {
    const q = (searchTerm || "").toLowerCase().trim();
    if (!q) return medicines;
    return medicines.filter((m) => {
      const name = (m.medicineName || "").toLowerCase();
      const active = (m.activeIngredient || "").toLowerCase();
      const group = (m.therapeuticClass || "").toLowerCase();
      const provider = (m.providerName || "").toLowerCase();
      return (
        name.includes(q) ||
        active.includes(q) ||
        group.includes(q) ||
        provider.includes(q)
      );
    });
  }, [medicines, searchTerm]);

  const resetForm = () => {
    setFormData({
      medicineName: "",
      status: "Providing",
      activeIngredient: "",
      strength: "",
      dosageForm: "",
      route: "",
      prescriptionUnit: "",
      therapeuticClass: "",
      packSize: "",
      commonSideEffects: "",
      noteForDoctor: "",
    });
    setErrors({});
  };

  const handleOpenDialog = (medicine?: ReadMedicineDto) => {
    if (medicine) {
      setEditingId(medicine.medicineId);
      setFormData({
        medicineName: medicine.medicineName,
        status: normalizeStatus(medicine.status ?? undefined),
        activeIngredient: medicine.activeIngredient ?? "",
        strength: medicine.strength ?? "",
        dosageForm: medicine.dosageForm ?? "",
        route: medicine.route ?? "",
        prescriptionUnit: medicine.prescriptionUnit ?? "",
        therapeuticClass: medicine.therapeuticClass ?? "",
        packSize: medicine.packSize ?? "",
        commonSideEffects: medicine.commonSideEffects ?? "",
        noteForDoctor: medicine.noteForDoctor ?? "",
      });
    } else {
      setEditingId(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleSave = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Lỗi",
        description: "Vui lòng kiểm tra lại các trường bắt buộc.",
        variant: "destructive",
      });
      return;
    }
    setErrors({});

    if (!token) {
      toast({
        title: "Lỗi",
        description: "Thiếu token. Hãy đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const payloadStatus: "Providing" | "Stopped" = normalizeStatus(formData.status);

      const dtoBase = {
        medicineName: formData.medicineName.trim(),
        activeIngredient: formData.activeIngredient.trim(),
        strength: formData.strength.trim(),
        dosageForm: formData.dosageForm.trim(),
        route: formData.route.trim(),
        prescriptionUnit: formData.prescriptionUnit.trim(),
        therapeuticClass: formData.therapeuticClass.trim(),
        packSize: formData.packSize.trim(),
        commonSideEffects: formData.commonSideEffects.trim() || undefined,
        noteForDoctor: formData.noteForDoctor.trim() || undefined,
        status: payloadStatus,
      };

      if (editingId) {
        const updateData: UpdateMedicineDto = dtoBase;
        await medicineService.update(editingId, updateData, token);
        await loadMine(pageNumber, pageSize, statusFilter, sortBy);
        toast({ title: "Thành công", description: "Cập nhật thuốc thành công" });
      } else {
        const createData: CreateMedicineDto = dtoBase;
        await medicineService.create(createData, token);
        await loadMine(1, pageSize, statusFilter, sortBy);
        toast({ title: "Thành công", description: "Tạo thuốc thành công" });
      }

      handleCloseDialog();
    } catch (error: any) {
      console.error("Failed to save medicine:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lưu thuốc",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeVariant = (status?: string | null) => {
    switch (normalizeStatus(status ?? undefined)) {
      case "Providing":
        return "default" as const;
      case "Stopped":
        return "destructive" as const;
    }
  };

  const getStatusLabel = (status?: string | null) => {
    switch (normalizeStatus(status ?? undefined)) {
      case "Providing":
        return "Providing";
      case "Stopped":
        return "Stopped";
    }
  };

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < totalPages;

  const goFirst = () => canPrev && loadMine(1, pageSize, statusFilter, sortBy);
  const goPrev = () => canPrev && loadMine(pageNumber - 1, pageSize, statusFilter, sortBy);
  const goNext = () => canNext && loadMine(pageNumber + 1, pageSize, statusFilter, sortBy);
  const goLast = () => canNext && loadMine(totalPages, pageSize, statusFilter, sortBy);

  const handleChangePageSize = (value: number) => {
    setPageSize(value);
    loadMine(1, value, statusFilter, sortBy);
  };

  // Excel handlers
  const handleDownloadTemplate = async () => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Thiếu token. Hãy đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }
    try {
      const blob = await medicineService.downloadTemplate(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mau_nhap_thuoc.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: "Đã tải file mẫu Excel.",
      });
    } catch (error: any) {
      console.error("Download template failed:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải file mẫu",
        variant: "destructive",
      });
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setImportFile(file);
    setImportResult(null); // clear kết quả cũ
  };

  const handleImportExcel = async () => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Thiếu token. Hãy đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }
    if (!importFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file Excel (.xlsx) trước.",
        variant: "destructive",
      });
      return;
    }
    try {
      setImporting(true);
      const result = await medicineService.importExcel(importFile, token);
      setImportResult(result);

      // reload lại trang 1 sau khi import xong
      await loadMine(1, pageSize, statusFilter, sortBy);

      // KHÔNG hiển thị toast thành công nữa, chỉ hiển thị block "Kết quả import"
    } catch (error: any) {
      console.error("Import excel failed:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể import Excel",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý thuốc</h1>
            <p className="text-muted-foreground">
              Quản lý danh sách thuốc thuộc nhà cung cấp của bạn
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={blocked}>
                <Plus className="h-4 w-4" />
                Thêm thuốc
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Chỉnh sửa" : "Thêm"} thuốc</DialogTitle>
                <DialogDescription>
                  {editingId ? "Cập nhật thông tin thuốc" : "Tạo thuốc mới với đầy đủ thông tin"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Tên thuốc */}
                <div>
                  <label className="text-sm font-medium">
                    Tên thuốc <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Nhập tên thuốc"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="mt-1"
                  />
                  {errors.medicineName && (
                    <p className="mt-1 text-xs text-red-500">{errors.medicineName}</p>
                  )}
                </div>

                {/* Hoạt chất + Hàm lượng */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      Hoạt chất chính <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Ví dụ: Paracetamol"
                      value={formData.activeIngredient}
                      onChange={(e) =>
                        setFormData({ ...formData, activeIngredient: e.target.value })
                      }
                      className="mt-1"
                    />
                    {errors.activeIngredient && (
                      <p className="mt-1 text-xs text-red-500">{errors.activeIngredient}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Hàm lượng <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="500mg, 5mg/5ml..."
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      className="mt-1"
                    />
                    {errors.strength && (
                      <p className="mt-1 text-xs text-red-500">{errors.strength}</p>
                    )}
                  </div>
                </div>

                {/* Dạng bào chế + Đường dùng */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      Dạng bào chế <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Viên nén, siro, viên nang..."
                      value={formData.dosageForm}
                      onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                      className="mt-1"
                    />
                    {errors.dosageForm && (
                      <p className="mt-1 text-xs text-red-500">{errors.dosageForm}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Đường dùng <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Uống, tiêm, bôi ngoài da..."
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      className="mt-1"
                    />
                    {errors.route && (
                      <p className="mt-1 text-xs text-red-500">{errors.route}</p>
                    )}
                  </div>
                </div>

                {/* Đơn vị kê đơn + Nhóm điều trị */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">
                      Đơn vị kê đơn <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Viên, lọ, ống, hộp..."
                      value={formData.prescriptionUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, prescriptionUnit: e.target.value })
                      }
                      className="mt-1"
                    />
                    {errors.prescriptionUnit && (
                      <p className="mt-1 text-xs text-red-500">{errors.prescriptionUnit}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Nhóm điều trị <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Hạ sốt, giảm đau, kháng sinh..."
                      value={formData.therapeuticClass}
                      onChange={(e) =>
                        setFormData({ ...formData, therapeuticClass: e.target.value })
                      }
                      className="mt-1"
                    />
                    {errors.therapeuticClass && (
                      <p className="mt-1 text-xs text-red-500">{errors.therapeuticClass}</p>
                    )}
                  </div>
                </div>

                {/* Quy cách */}
                <div>
                  <label className="text-sm font-medium">
                    Quy cách đóng gói <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Hộp 10 vỉ x 10 viên..."
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="mt-1"
                  />
                  {errors.packSize && (
                    <p className="mt-1 text-xs text-red-500">{errors.packSize}</p>
                  )}
                </div>

                {/* Tác dụng phụ */}
                <div>
                  <label className="text-sm font-medium">Tác dụng phụ thường gặp</label>
                  <Textarea
                    placeholder="Nhập tác dụng phụ thường gặp..."
                    value={formData.commonSideEffects}
                    onChange={(e) =>
                      setFormData({ ...formData, commonSideEffects: e.target.value })
                    }
                    className="mt-1"
                    rows={3}
                  />
                  {errors.commonSideEffects && (
                    <p className="mt-1 text-xs text-red-500">{errors.commonSideEffects}</p>
                  )}
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="text-sm font-medium">Ghi chú nội bộ cho bác sĩ</label>
                  <Textarea
                    placeholder="Ghi chú hướng dẫn kê đơn, lưu ý đặc biệt..."
                    value={formData.noteForDoctor}
                    onChange={(e) =>
                      setFormData({ ...formData, noteForDoctor: e.target.value })
                    }
                    className="mt-1"
                    rows={3}
                  />
                  {errors.noteForDoctor && (
                    <p className="mt-1 text-xs text-red-500">{errors.noteForDoctor}</p>
                  )}
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: normalizeStatus(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Providing">Providing</option>
                    <option value="Stopped">Stopped</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
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

        {/* Cảnh báo quyền */}
        {blocked && (
          <Card>
            <CardHeader>
              <CardTitle>Không có quyền truy cập</CardTitle>
              <CardDescription>
                Bạn đang đăng nhập với vai trò <b>{role}</b>. Chức năng này chỉ dành cho{" "}
                <b>Pharmacy Provider</b>.
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
              <p className="text-xs text-muted-foreground">
                Tổng số thuốc thuộc nhà cung cấp của bạn
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang cung cấp (trang hiện tại)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {medicines.filter((m) => normalizeStatus(m.status ?? undefined) === "Providing")
                  .length}
              </div>
              <p className="text-xs text-muted-foreground">Đếm theo dữ liệu trang đang xem</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Kết quả tìm kiếm (trang hiện tại)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredMedicines.length}</div>
              <p className="text-xs text-muted-foreground">
                Lọc theo ô tìm kiếm trên trang hiện tại
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search & filter */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm</CardTitle>
            <CardDescription>
              Tìm theo tên, hoạt chất, nhóm điều trị hoặc nhà cung cấp (trên trang hiện tại)
            </CardDescription>
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

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "All" | "Providing" | "Stopped")
                }
                className="w-[160px] rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                <option value="All">All statuses</option>
                <option value="Providing">Providing</option>
                <option value="Stopped">Stopped</option>
              </select>

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

        {/* Medicines Table + Excel import */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Danh sách thuốc</CardTitle>
                <CardDescription>
                  Trang <b>{pageNumber}</b>/<b>{totalPages}</b> · Hiển thị{" "}
                  <b>{medicines.length}</b> / Trang · Tổng <b>{totalCount}</b>
                </CardDescription>
              </div>

              <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={blocked || !token}
                >
                  Tải file mẫu Excel
                </Button>

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="w-56 cursor-pointer"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleImportExcel}
                    disabled={blocked || !token || importing}
                  >
                    {importing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Import Excel
                  </Button>
                </div>
              </div>
            </div>

            {/* Kết quả import (có nút X để đóng) */}
            {importResult && (
              <div className="mt-3 rounded-md border border-muted bg-muted/40 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <div className="font-semibold">Kết quả import:</div>
                  <button
                    type="button"
                    onClick={() => setImportResult(null)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                    aria-label="Đóng kết quả import"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <span>
                    Tổng: <b>{importResult.total}</b>
                  </span>
                  <span>
                    Thành công: <b className="text-green-600">{importResult.success}</b>
                  </span>
                  <span>
                    Thất bại: <b className="text-red-600">{importResult.failed}</b>
                  </span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded bg-background p-2 text-xs">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="text-red-600">
                        • {err}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                        <TableHead>Hoạt chất</TableHead>
                        <TableHead>Hàm lượng</TableHead>
                        <TableHead>Dạng / Đường dùng</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Nhóm điều trị</TableHead>
                        <TableHead>Quy cách</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Nhà cung cấp</TableHead>
                        <TableHead className="max-w-xs">Tác dụng phụ thường gặp</TableHead>
                        <TableHead className="max-w-xs">Ghi chú bác sĩ</TableHead>
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
                            <TableCell className="font-medium">
                              {medicine.medicineName}
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.activeIngredient || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.strength || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.dosageForm || "-"}{" "}
                              {medicine.route ? `(${medicine.route})` : ""}
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.prescriptionUnit || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.therapeuticClass || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.packSize || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(medicine.status)}>
                                {getStatusLabel(medicine.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {medicine.providerName || "-"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {medicine.commonSideEffects || "-"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {medicine.noteForDoctor || "-"}
                            </TableCell>
                            <TableCell className="text-right">
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
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={13}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {searchTerm
                              ? "Không tìm thấy thuốc nào trong trang hiện tại"
                              : "Chưa có thuốc nào"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination controls */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Đang xem{" "}
                    <b>
                      {(pageNumber - 1) * pageSize + (medicines.length > 0 ? 1 : 0)}
                    </b>
                    –
                    <b>
                      {Math.min(
                        (pageNumber - 1) * pageSize + medicines.length,
                        totalCount
                      )}
                    </b>{" "}
                    trên <b>{totalCount}</b>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Dropdown số bản ghi/trang */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Số bản ghi/trang:
                      </span>
                      <select
                        value={pageSize}
                        onChange={(e) =>
                          handleChangePageSize(parseInt(e.target.value, 10))
                        }
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    {/* Nút chuyển trang */}
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
