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
import { BarChart3, FileText, TrendingUp, Plus, Edit2, Search, Package, Loader2, TestTube } from "lucide-react";
import { medicineService } from "@/lib/services/medicine-service";
import type { ReadMedicineDto, CreateMedicineDto, UpdateMedicineDto } from "@/lib/types/medicine";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "Tổng quan", href: "/management", icon: BarChart3 },
  { name: "Báo cáo", href: "/management/reports", icon: FileText },
  { name: "Phân tích", href: "/management/analytics", icon: TrendingUp },
  { name: "Loại xét nghiệm", href: "/management/test-types", icon: TestTube },
  { name: "Thuốc", href: "/management/medicines", icon: Package },
];

interface FormData {
  medicineName: string;
  sideEffects: string;
  status: string;
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

export default function MedicinesManagementPage() {
  const [token, setToken] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<ReadMedicineDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    medicineName: "",
    sideEffects: "",
    status: "Available",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Lấy token từ localStorage & rút role từ JWT
  useEffect(() => {
    const t = localStorage.getItem("auth_token") || ""; // <-- đúng key bạn đang lưu
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

  // Load danh sách thuốc của provider hiện tại (chỉ khi có token & đúng role)
  const loadMine = async () => {
    if (!token || !isProvider) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await medicineService.getMine(token);
      setMedicines(data);
    } catch (error: any) {
      console.error("Failed to load medicines:", error);
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
      loadMine();
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

  const filteredMedicines = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return medicines.filter((medicine) => {
      return (
        medicine.medicineName.toLowerCase().includes(q) ||
        (medicine.sideEffects?.toLowerCase().includes(q) ?? false) ||
        (medicine.providerName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [medicines, searchTerm]);

  const handleOpenDialog = (medicine?: ReadMedicineDto) => {
    if (medicine) {
      setEditingId(medicine.medicineId);
      setFormData({
        medicineName: medicine.medicineName,
        sideEffects: medicine.sideEffects || "",
        status: medicine.status || "Available",
      });
    } else {
      setEditingId(null);
      setFormData({
        medicineName: "",
        sideEffects: "",
        status: "Available",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      medicineName: "",
      sideEffects: "",
      status: "Available",
    });
  };

  const handleSave = async () => {
    if (!formData.medicineName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên thuốc",
        variant: "destructive",
      });
      return;
    }
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

      if (editingId) {
        const updateData: UpdateMedicineDto = {
          medicineName: formData.medicineName,
          sideEffects: formData.sideEffects,
          status: formData.status,
        };
        await medicineService.update(editingId, updateData, token);
        await loadMine();

        toast({
          title: "Thành công",
          description: "Cập nhật thuốc thành công",
        });
      } else {
        const createData: CreateMedicineDto = {
          medicineName: formData.medicineName,
          sideEffects: formData.sideEffects,
          status: formData.status,
        };
        await medicineService.create(createData, token);
        await loadMine();

        toast({
          title: "Thành công",
          description: "Tạo thuốc thành công",
        });
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

  const getStatusBadgeVariant = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "available":
        return "default";
      case "unavailable":
        return "secondary";
      case "discontinued":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "available":
        return "Có sẵn";
      case "unavailable":
        return "Không có sẵn";
      case "discontinued":
        return "Ngừng sản xuất";
      default:
        return status || "Không xác định";
    }
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Available">Có sẵn</option>
                    <option value="Unavailable">Không có sẵn</option>
                    <option value="Discontinued">Ngừng sản xuất</option>
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
              <div className="text-2xl font-bold">{medicines.length}</div>
              <p className="text-xs text-muted-foreground">Thuốc trong kho của bạn</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Có sẵn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {medicines.filter((m) => (m.status || "").toLowerCase() === "available").length}
              </div>
              <p className="text-xs text-muted-foreground">Thuốc có sẵn</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kết quả tìm kiếm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredMedicines.length}</div>
              <p className="text-xs text-muted-foreground">Thuốc phù hợp</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm</CardTitle>
            <CardDescription>Tìm theo tên, tác dụng phụ hoặc nhà cung cấp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm thuốc..."
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

        {/* Medicines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thuốc</CardTitle>
            <CardDescription>Hiển thị {filteredMedicines.length} thuốc</CardDescription>
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
                          {searchTerm ? "Không tìm thấy thuốc nào" : "Chưa có thuốc nào"}
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
    </DashboardLayout>
  );
}
