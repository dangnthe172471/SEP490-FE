"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation";
import {
  MedicalRecordService,
  type MedicalRecordDto,
} from "@/lib/services/medical-record-service";
import {
  getInternalMed,
  createInternalMed,
} from "@/lib/services/internal-med-service";
import {
  getPediatric,
  createPediatric,
} from "@/lib/services/pediatric-service";
import { toast } from "@/hooks/use-toast";
import {
  createTestResult,
  getTestTypes,
  getTestResultsByRecord,
} from "@/lib/services/test-results-service";
import type {
  TestTypeLite,
  ReadTestResultDto,
} from "@/lib/types/test-results";

import { createDermatology } from "@/lib/services/dermatology-service";
import PrescriptionModal from "@/components/doctor/prescription-modal";
import type { RecordListItemDto } from "@/lib/types/doctor-record";
import { appointmentService } from "@/lib/services/appointment-service";
import { patientService } from "@/lib/services/patient-service";
import { userService } from "@/lib/services/user.service";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RoleGuard } from "@/components/role-guard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn";

function buildAttachmentUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

interface PatientDetail {
  fullName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  allergies: string;
  medicalHistory: string;
}

export default function MedicalRecordDetailPage() {
  const navigation = getDoctorNavigation();
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? Number(params.id) : null;

  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [savedDiagnosis, setSavedDiagnosis] = useState<string | null>(null); // Chẩn đoán đã lưu trong database
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [patientCache, setPatientCache] =
    useState<Record<number, PatientDetail>>({});
  const [patientInfo, setPatientInfo] = useState<PatientDetail | null>(null);

  const [creatingInternal, setCreatingInternal] = useState(false);
  const [creatingPediatric, setCreatingPediatric] = useState(false);
  const [creatingDermatology, setCreatingDermatology] = useState(false);

  const [testTypes, setTestTypes] = useState<TestTypeLite[]>([]);
  const [loadingTestTypes, setLoadingTestTypes] = useState(false);
  const [requestingTestTypeId, setRequestingTestTypeId] =
    useState<number | null>(null);

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const [dermRequestedProcedure, setDermRequestedProcedure] = useState("");
  const [dermBodyArea, setDermBodyArea] = useState("");

  // DANH SÁCH KẾT QUẢ XÉT NGHIỆM THỰC TẾ (lấy từ API riêng)
  const [testResults, setTestResults] = useState<ReadTestResultDto[]>([]);

  // Reappointment request state
  const [reappointmentDate, setReappointmentDate] = useState<string>("");
  const [reappointmentTime, setReappointmentTime] = useState<string>("");
  const [reappointmentNotes, setReappointmentNotes] = useState<string>("");
  const [sendingReappointment, setSendingReappointment] = useState(false);
  const VIETNAM_TIME_SLOTS = useMemo(() => {
    const slots: { value: string; label: string }[] = [];
    for (let hour = 7; hour <= 21; hour++) {
      for (const minute of [0, 30]) {
        const value = `${hour.toString().padStart(2, "0")}:${minute === 0 ? "00" : "30"
          }`;
        slots.push({ value, label: value });
      }
    }
    return slots;
  }, []);

  // combobox xét nghiệm
  const [selectedTestTypeId, setSelectedTestTypeId] = useState<number | null>(
    null
  );
  const [openTestPopover, setOpenTestPopover] = useState(false);

  // map để biết record này đã có loại xét nghiệm nào (dùng testResults, không dùng record.testResults nữa)
  const testsByTypeId = useMemo(() => {
    const map = new Map<number, ReadTestResultDto>();
    for (const t of testResults) {
      map.set(t.testTypeId, t);
    }
    return map;
  }, [testResults]);

  // chỉ những loại CHƯA gửi mới được chọn
  const availableTestTypes = useMemo(
    () => testTypes.filter((tt) => !testsByTypeId.has(tt.testTypeId)),
    [testTypes, testsByTypeId]
  );

  // nếu loại đang chọn vừa được gửi (đã có trong testsByTypeId) thì reset selection
  useEffect(() => {
    if (selectedTestTypeId && testsByTypeId.has(selectedTestTypeId)) {
      setSelectedTestTypeId(null);
    }
  }, [selectedTestTypeId, testsByTypeId]);

  const prescriptionRecord = useMemo(() => {
    if (!record) return null;

    const dto: Partial<RecordListItemDto> = {
      recordId: record.recordId,
      patientName: patientInfo?.fullName ?? "",
    };

    return dto as RecordListItemDto;
  }, [record, patientInfo]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await MedicalRecordService.getById(Number(id));
        setRecord(data);
        // Lưu chẩn đoán từ database để kiểm tra
        setSavedDiagnosis(data.diagnosis ?? null);

        // LẤY THÊM TẤT CẢ TESTRESULT CHO RECORD NÀY
        try {
          const tests = await getTestResultsByRecord(data.recordId);
          setTestResults(tests ?? []);
        } catch (err) {
          console.error("Không thể tải kết quả xét nghiệm theo record", err);
        }

        const patientId = data?.appointment?.patientId;
        if (patientId) {
          let patientData = patientCache[patientId];

          if (!patientData) {
            try {
              const patient = await patientService.getById(patientId);
              const userId = patient?.userId;
              if (!userId)
                throw new Error("Không tìm thấy userId trong Patient");

              const userData = await userService.fetchUserById(userId);

              patientData = {
                fullName: userData.fullName ?? "",
                gender: userData.gender ?? "",
                dob: userData.dob ?? "",
                phone: userData.phone ?? "",
                email: userData.email ?? "",
                allergies: patient.allergies ?? "",
                medicalHistory: patient.medicalHistory ?? "",
              };

              if (patientData) {
                setPatientCache((prev) => ({
                  ...prev,
                  [patientId]: patientData as PatientDetail,
                }));
              }
            } catch (error) {
              console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
            }
          }

          setPatientInfo(patientData ?? null);
        }
      } catch (e: any) {
        setError(e?.message ?? "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setLoadingTestTypes(true);
        const types = await getTestTypes();
        if (!aborted) setTestTypes(types);
      } catch (err) {
        console.error("Không thể tải danh sách xét nghiệm", err);
      } finally {
        if (!aborted) setLoadingTestTypes(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const save = async () => {
    if (!record) return;
    try {
      setSaving(true);
      const updated = await MedicalRecordService.update(record.recordId, {
        diagnosis: record.diagnosis ?? undefined,
        doctorNotes: record.doctorNotes ?? undefined,
      });
      setRecord(updated);
      // Cập nhật chẩn đoán đã lưu vào database
      setSavedDiagnosis(updated.diagnosis ?? null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      window.location.reload();
    } catch {
      alert("Không thể lưu hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  const reloadRecord = async () => {
    if (!id) return;
    try {
      const data = await MedicalRecordService.getById(Number(id));
      setRecord(data);
      // Cập nhật chẩn đoán đã lưu sau khi reload
      setSavedDiagnosis(data.diagnosis ?? null);

      // reload luôn testResults cho chắc
      const tests = await getTestResultsByRecord(data.recordId);
      setTestResults(tests ?? []);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: e?.message ?? "Không thể tải lại hồ sơ sau khi kê đơn.",
      });
    }
  };

  const handleOpenPrescription = () => {
    if (!record) return;
    setShowPrescriptionModal(true);
  };

  const handlePrescriptionSaved = async () => {
    setShowPrescriptionModal(false);
    await reloadRecord();
    toast({
      title: "Đã lưu đơn thuốc",
      description: "Đơn thuốc mới đã được cập nhật vào hồ sơ.",
    });
  };

  if (loading) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="p-6">Đang tải dữ liệu…</div>
      </DashboardLayout>
    );
  }

  const ensureInternalRecord = async () => {
    if (!record) throw new Error("Chưa có hồ sơ bệnh án");

    const existing =
      record.internalMedRecord ??
      (await getInternalMed(record.recordId).catch(() => null));
    if (existing) {
      setRecord((prev) =>
        prev ? { ...prev, internalMedRecord: existing } : prev
      );
      toast({
        title: "Hồ sơ Nội khoa đã tồn tại",
        description: "Hồ sơ Nội khoa đã được tạo trước đó.",
      });
      return existing;
    }

    const created = await createInternalMed({ recordId: record.recordId });
    setRecord((prev) =>
      prev ? { ...prev, internalMedRecord: created } : prev
    );
    toast({ title: "Thêm thành công", description: "Đã tạo hồ sơ Nội khoa." });
    return created;
  };

  const ensurePediatricRecord = async () => {
    if (!record) throw new Error("Chưa có hồ sơ bệnh án");

    const existing =
      record.pediatricRecord ??
      (await getPediatric(record.recordId).catch(() => null));
    if (existing) {
      setRecord((prev) =>
        prev ? { ...prev, pediatricRecord: existing } : prev
      );
      toast({
        title: "Hồ sơ Nhi khoa đã tồn tại",
        description: "Hồ sơ Nhi khoa đã được tạo trước đó.",
      });
      return existing;
    }

    const created = await createPediatric({ recordId: record.recordId });
    setRecord((prev) =>
      prev ? { ...prev, pediatricRecord: created } : prev
    );
    toast({ title: "Thêm thành công", description: "Đã tạo hồ sơ Nhi khoa." });
    return created;
  };

  const ensureDermatologyRecord = async (
    requestedProcedure: string,
    bodyArea?: string
  ) => {
    if (!record) throw new Error("Chưa có hồ sơ bệnh án");

    const already =
      Array.isArray(record.dermatologyRecords) &&
      record.dermatologyRecords.length > 0;

    if (already) {
      toast({
        title: "Hồ sơ Da liễu đã tồn tại",
        description: "Hồ sơ Da liễu đã được tạo trước đó.",
      });
      return record.dermatologyRecords![0];
    }

    const created = await createDermatology({
      recordId: record.recordId,
      requestedProcedure,
      bodyArea,
    });

    setRecord((prev) =>
      prev
        ? {
          ...prev,
          dermatologyRecords: [
            ...(prev.dermatologyRecords ?? []),
            created,
          ],
        }
        : prev
    );
    toast({ title: "Thêm thành công", description: "Đã tạo hồ sơ Da liễu." });
    return created;
  };

  const handleCreateInternalMed = async () => {
    if (!record || creatingInternal) return;

    try {
      setCreatingInternal(true);
      await ensureInternalRecord();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi tạo",
        description: e?.message ?? "Không thể tạo hồ sơ Nội khoa.",
      });
    } finally {
      setCreatingInternal(false);
    }
  };

  const handleCreatePediatric = async () => {
    if (!record || creatingPediatric) return;

    try {
      setCreatingPediatric(true);
      await ensurePediatricRecord();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi tạo",
        description: e?.message ?? "Không thể tạo hồ sơ Nhi khoa.",
      });
    } finally {
      setCreatingPediatric(false);
    }
  };

  const handleCreateDermatology = async () => {
    if (!record || creatingDermatology) return;

    if (!dermRequestedProcedure.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Thủ thuật / dịch vụ da liễu yêu cầu.",
      });
      return;
    }

    try {
      setCreatingDermatology(true);
      await ensureDermatologyRecord(
        dermRequestedProcedure.trim(),
        dermBodyArea.trim() || undefined
      );
      setDermRequestedProcedure("");
      setDermBodyArea("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi tạo",
        description: e?.message ?? "Không thể tạo hồ sơ Da liễu.",
      });
    } finally {
      setCreatingDermatology(false);
    }
  };

  const handleRequestTest = async (type: TestTypeLite) => {
    if (!record) return;

    // an toàn: nếu đã có rồi thì không cho tạo nữa
    if (testsByTypeId.has(type.testTypeId)) {
      toast({
        title: "Đã yêu cầu xét nghiệm",
        description: `Xét nghiệm "${type.testName}" đã được tạo cho hồ sơ này.`,
      });
      return;
    }

    try {
      setRequestingTestTypeId(type.testTypeId);
      const created = await createTestResult({
        recordId: record.recordId,
        testTypeId: type.testTypeId,
        resultValue: "PENDING",
        notes: undefined,
      });

      // cập nhật cả record lẫn testResults
      setRecord((prev) =>
        prev
          ? {
            ...prev,
            testResults: [...(prev.testResults ?? []), created],
          }
          : prev
      );
      setTestResults((prev) => [...prev, created]);

      setSelectedTestTypeId(null);

      toast({
        title: "Đã gửi yêu cầu",
        description: `Đã gửi yêu cầu xét nghiệm "${type.testName}" tới điều dưỡng.`,
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi tạo xét nghiệm",
        description: e?.message ?? "Không thể tạo yêu cầu xét nghiệm.",
      });
    } finally {
      setRequestingTestTypeId(null);
    }
  };

  if (!record) {
    return (
      <RoleGuard allowedRoles="doctor">
        <DashboardLayout navigation={navigation}>
          <div className="p-6 text-red-600">Không tìm thấy hồ sơ</div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  const hasPrescriptions =
    !!record.prescriptions && record.prescriptions.length > 0;
  const firstPrescriptionId = hasPrescriptions
    ? record.prescriptions[0].prescriptionId
    : null;

  const hasDermatology =
    Array.isArray(record.dermatologyRecords) &&
    record.dermatologyRecords.length > 0;

  const selectedTest = selectedTestTypeId
    ? availableTestTypes.find((t) => t.testTypeId === selectedTestTypeId)
    : null;

  const noMoreAvailableTests = availableTestTypes.length === 0;

  return (
    <RoleGuard allowedRoles="doctor">
    <DashboardLayout navigation={navigation}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Hồ sơ bệnh án #{record.recordId}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Quay lại
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Đang lưu…" : saved ? "Đã lưu" : "Lưu"}
            </Button>
          </div>
        </div>
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin bệnh nhân</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p>
                <strong>Họ tên:</strong> {patientInfo?.fullName || "—"}
              </p>
              <p>
                <strong>Giới tính:</strong> {patientInfo?.gender || "—"}
              </p>
              <p>
                <strong>Ngày sinh:</strong>{" "}
                {patientInfo?.dob
                  ? new Date(patientInfo.dob).toLocaleDateString("vi-VN")
                  : "—"}
              </p>
              <p>
                <strong>SĐT:</strong> {patientInfo?.phone || "—"}
              </p>
            </div>
            <div>
              <p>
                <strong>Email:</strong> {patientInfo?.email || "—"}
              </p>
              <p>
                <strong>Dị ứng:</strong> {patientInfo?.allergies || "Không có"}
              </p>
              <p>
                <strong>Tiền sử bệnh:</strong>{" "}
                {patientInfo?.medicalHistory || "Không có"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 shadow-sm border border-gray-200 rounded-2xl">
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Cột trái - Loại khám */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Loại khám
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      id: "internal",
                      label: "Khám nội",
                      creating: creatingInternal,
                      created: !!record?.internalMedRecord,
                      onClick: handleCreateInternalMed,
                    },
                    {
                      id: "pediatric",
                      label: "Khám nhi",
                      creating: creatingPediatric,
                      created: !!record?.pediatricRecord,
                      onClick: handleCreatePediatric,
                    },
                    {
                      id: "dermatology",
                      label: "Khám da liễu",
                      creating: creatingDermatology,
                      created: hasDermatology,
                      onClick: handleCreateDermatology,
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.created
                              ? "Đã gửi yêu cầu khám"
                              : "Chưa gửi yêu cầu khám"}
                          </p>
                        </div>

                        {/* NÚT KHÁM (ĐÃ ĐỒNG BỘ MÀU) */}
                        <Button
                          variant={item.created ? "secondary" : "outline"}
                          disabled={
                            item.created ||
                            item.creating ||
                            (item.id === "dermatology" &&
                              !hasDermatology &&
                              !dermRequestedProcedure.trim())
                          }
                          onClick={item.onClick}
                          // Áp dụng màu xanh lá nhạt khi ở trạng thái "Gửi điều dưỡng"
                          className={
                            !item.created && !item.creating
                              ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-300 hover:text-green-800"
                              : "bg-blue-500"
                          }
                        >
                          {item.created
                            ? "Đã gửi"
                            : item.creating
                              ? "Đang gửi..."
                              : "Gửi điều dưỡng"}
                        </Button>
                      </div>

                      {item.id === "dermatology" && !hasDermatology && (
                        <div className="space-y-2 text-sm">
                          <div className="space-y-1">
                            <label className="block text-xs text-slate-700">
                              Thủ thuật / dịch vụ da liễu yêu cầu
                            </label>
                            <Input
                              placeholder="Ví dụ: Lazer điều trị sẹo, peel da..."
                              value={dermRequestedProcedure}
                              onChange={(e) =>
                                setDermRequestedProcedure(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs text-slate-700">
                              Vùng da / vị trí trên cơ thể
                            </label>
                            <Input
                              placeholder="Ví dụ: Mặt, lưng, tay..."
                              value={dermBodyArea}
                              onChange={(e) =>
                                setDermBodyArea(e.target.value)
                              }
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Điều dưỡng sẽ dựa vào thông tin này để chuẩn bị và
                            thực hiện thủ thuật.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cột phải - Yêu cầu xét nghiệm */}
              <div className="space-y-4 lg:border-l border-gray-100 lg:pl-6">
                <h3 className="text-base font-semibold text-gray-800">
                  Yêu cầu xét nghiệm
                </h3>
                {loadingTestTypes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                    Đang tải danh sách xét nghiệm...
                  </div>
                ) : testTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có danh mục xét nghiệm. Vui lòng liên hệ quản trị viên.
                  </p>
                ) : (
                  <div className="space-y-3 w-full">
                    {/* HÀNG 1: dropdown + nút luôn trên cùng một hàng */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 max-w-md">
                        <Popover
                          open={openTestPopover}
                          onOpenChange={setOpenTestPopover}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                              disabled={noMoreAvailableTests}
                            >
                              {noMoreAvailableTests
                                ? "Đã gửi hết các loại xét nghiệm"
                                : selectedTest
                                  ? selectedTest.testName
                                  : "Chọn loại xét nghiệm"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          {!noMoreAvailableTests && (
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-md p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Tìm tên xét nghiệm..."
                                  className="h-9"
                                />
                                <CommandList className="max-h-64 overflow-y-auto">
                                  <CommandEmpty>
                                    Không tìm thấy xét nghiệm phù hợp.
                                  </CommandEmpty>
                                  {availableTestTypes.map((tt) => (
                                    <CommandItem
                                      key={tt.testTypeId}
                                      value={tt.testName}
                                      onSelect={() => {
                                        setSelectedTestTypeId(tt.testTypeId);
                                        setOpenTestPopover(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedTestTypeId === tt.testTypeId
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span className="truncate">
                                        {tt.testName}
                                      </span>
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          )}
                        </Popover>
                      </div>

                      {/* NÚT GỬI ĐIỀU DƯỠNG XÉT NGHIỆM (ĐÃ ĐỒNG BỘ MÀU) */}
                      <Button
                        variant="outline"
                        disabled={
                          noMoreAvailableTests ||
                          !selectedTestTypeId ||
                          requestingTestTypeId !== null
                        }
                        onClick={() => {
                          if (!selectedTestTypeId) return;
                          const type = availableTestTypes.find(
                            (t) => t.testTypeId === selectedTestTypeId
                          );
                          if (type) handleRequestTest(type);
                        }}
                        // Áp dụng màu xanh lá chỉ khi nút không bị disabled và đang ở trạng thái "Gửi điều dưỡng"
                        className={
                          requestingTestTypeId === null && !noMoreAvailableTests && selectedTestTypeId
                            ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-300 hover:text-green-800"
                            : "bg-blue-500 text-white"
                        }
                      >
                        {requestingTestTypeId ? "Đang gửi..." : "Gửi điều dưỡng"}
                      </Button>
                    </div>

                    {/* Danh sách các xét nghiệm đã yêu cầu (giới hạn chiều cao) */}
                    <div className="space-y-2 text-xs text-muted-foreground max-h-64 overflow-y-auto pr-1">
                      {testTypes
                        .map((type) => {
                          const existing = testsByTypeId.get(type.testTypeId);
                          if (!existing) return null;
                          const pending = existing.resultValue
                            ? existing.resultValue
                              .toLowerCase()
                              .includes("pending") ||
                            existing.resultValue
                              .toLowerCase()
                              .includes("chờ")
                            : true;
                          return (
                            <div
                              key={type.testTypeId}
                              className="flex justify-between items-center border rounded px-3 py-2 bg-slate-50"
                            >
                              <span className="font-medium text-slate-700 truncate mr-2">
                                {type.testName}
                              </span>
                              <span>
                                {pending ? "Chờ điều dưỡng" : "Đã có kết quả"}
                              </span>
                            </div>
                          );
                        })
                        .filter(Boolean)}
                      {testResults.length === 0 && (
                        <p>Chưa gửi yêu cầu xét nghiệm nào.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <div className="grid gap-4">
            <div className="bg-slate-50 p-3 rounded">
              <div className="font-semibold mb-1">Thông tin cuộc hẹn</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  Mã hẹn:{" "}
                  <span className="font-medium">
                    {record.appointment?.appointmentId ??
                      record.appointmentId}
                  </span>
                </div>
                <div>
                  Trạng thái:{" "}
                  <span className="font-medium">
                    {record.appointment?.status ?? "-"}
                  </span>
                </div>
                <div>
                  Ngày giờ:{" "}
                  <span className="font-medium">
                    {record.appointment?.appointmentDate
                      ? new Date(
                        record.appointment.appointmentDate
                      ).toLocaleString("vi-VN")
                      : "-"}
                  </span>
                </div>
                <div>
                  Lý do khám:{" "}
                  <span className="font-medium">
                    {record.appointment?.reasonForVisit ?? "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm text-slate-600">Chẩn đoán</label>
                <textarea
                  className="mt-1 w-full border rounded p-2"
                  rows={2}
                  value={record.diagnosis ?? ""}
                  onChange={(e) =>
                    setRecord({ ...record, diagnosis: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">
                  Ghi chú bác sĩ
                </label>
                <textarea
                  className="mt-1 w-full border rounded p-2"
                  rows={3}
                  value={record.doctorNotes ?? ""}
                  onChange={(e) =>
                    setRecord({ ...record, doctorNotes: e.target.value })
                  }
                />
              </div>
            </div>

            {record.internalMedRecord && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-1">Khám nội khoa</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    Huyết áp:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.bloodPressure ?? "-"}
                    </span>
                  </div>
                  <div>
                    Nhịp tim:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.heartRate ?? "-"}
                    </span>
                  </div>
                  <div>
                    Đường huyết:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.bloodSugar ?? "-"}
                    </span>
                  </div>
                  <div>
                    Ghi chú:{" "}
                    <span className="font-medium">
                      {record.internalMedRecord.notes ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {record.pediatricRecord && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-1">Khám nhi khoa</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    Cân nặng:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.weightKg ?? "-"}
                    </span>
                  </div>
                  <div>
                    Chiều cao:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.heightCm ?? "-"}
                    </span>
                  </div>
                  <div>
                    Nhịp tim:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.heartRate ?? "-"}
                    </span>
                  </div>
                  <div>
                    Nhiệt độ:{" "}
                    <span className="font-medium">
                      {record.pediatricRecord.temperatureC ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Kết quả khám da liễu */}
            {record.dermatologyRecords && record.dermatologyRecords.length > 0 && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <div className="font-semibold mb-2">
                  Kết quả khám da liễu ({record.dermatologyRecords.length})
                </div>
                <div className="space-y-3">
                  {record.dermatologyRecords.map((derm) => (
                    <div key={derm.dermRecordId} className="space-y-2">
                      <div>
                        <span className="font-medium">Thủ thuật:</span>{" "}
                        {derm.requestedProcedure ?? "-"}
                      </div>
                      {derm.bodyArea && (
                        <div>
                          <span className="font-medium">Vùng da:</span> {derm.bodyArea}
                        </div>
                      )}
                      {derm.procedureNotes && (
                        <div>
                          <span className="font-medium">Ghi chú thủ thuật:</span>{" "}
                          {derm.procedureNotes}
                        </div>
                      )}
                      {derm.resultSummary && (
                        <div>
                          <span className="font-medium">Kết quả khám da liễu:</span>{" "}
                          {derm.resultSummary}
                        </div>
                      )}
                      {derm.attachment && (
                        <div>
                          <span className="font-medium">Ảnh đính kèm:</span>
                          <div className="mt-2">
                            <a
                              href={buildAttachmentUrl(derm.attachment)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={buildAttachmentUrl(derm.attachment)}
                                alt="Ảnh khám da liễu"
                                className="max-w-xs max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-xs text-muted-foreground">Không thể tải ảnh: ${derm.attachment}</span>`;
                                  }
                                }}
                              />
                            </a>
                          </div>
                        </div>
                      )}
                      {derm.performedAt && (
                        <div className="text-xs text-muted-foreground">
                          Thực hiện lúc:{" "}
                          {new Date(derm.performedAt).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Đơn thuốc */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">
                  Đơn thuốc ({record.prescriptions?.length ?? 0})
                </div>

                {hasPrescriptions ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!firstPrescriptionId) return;
                      router.push(
                        `/doctor/prescriptions/${firstPrescriptionId}`
                      );
                    }}
                  >
                    Xem đơn thuốc
                  </Button>
                ) : (
                  <div className="flex flex-col items-end">
                    {(!savedDiagnosis || savedDiagnosis.trim() === "") && (
                      <div className="rounded-md px-3 py-2 text-sm text-yellow-800">
                        ⚠️ Vui lòng chẩn đoán trước khi kê đơn thuốc
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={handleOpenPrescription}
                      disabled={!savedDiagnosis || savedDiagnosis.trim() === ""}
                      title={!savedDiagnosis || savedDiagnosis.trim() === "" ? "Vui lòng nhập và lưu chẩn đoán trước khi kê đơn" : ""}
                      className={
                        !savedDiagnosis || savedDiagnosis.trim() === ""
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    >
                      Kê đơn thuốc
                    </Button>
                  </div>
                )}
              </div>

              {/* {hasPrescriptions ? (
                <div className="border rounded divide-y">
                  {record.prescriptions!.map((p) => (
                    <div key={p.prescriptionId} className="p-2 text-sm">
                      <div className="flex items-center justify-between pb-2">
                        <div className="font-medium">
                          Đơn #{p.prescriptionId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.issuedDate
                            ? new Date(p.issuedDate).toLocaleString("vi-VN")
                            : "-"}
                        </div>
                      </div>
                      {p.prescriptionDetails &&
                      p.prescriptionDetails.length > 0 ? (
                        <div className="border rounded">
                          {p.prescriptionDetails.map((d) => (
                            <div
                              key={d.prescriptionDetailId}
                              className="grid grid-cols-3 gap-2 p-2 border-b last:border-b-0"
                            >
                              <div className="font-medium truncate">
                                {d.medicineName}
                              </div>
                              <div className="text-muted-foreground">
                                Liều dùng: {d.dosage}
                              </div>
                              <div className="text-right">
                                Thời gian: {d.duration}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Không có chi tiết đơn thuốc
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có đơn thuốc
                </p>
              )} */}
            </div>

            {/* Kết quả xét nghiệm */}
            <div>
              <div className="font-semibold mb-2">
                Kết quả xét nghiệm ({testResults.length})
              </div>
              {testResults.length > 0 ? (
                <div className="border rounded divide-y">
                  {testResults.map((t) => {
                    const typeName =
                      t.testName ??
                      testTypes.find(
                        (tt) => tt.testTypeId === t.testTypeId
                      )?.testName ??
                      `Loại #${t.testTypeId}`;
                    const pending = t.resultValue
                      ? t.resultValue.toLowerCase().includes("pending") ||
                      t.resultValue.toLowerCase().includes("chờ")
                      : true;
                    return (
                      <div
                        key={t.testResultId}
                        className="p-3 text-sm space-y-2 border-b last:border-b-0"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Xét nghiệm:</span>{" "}
                            {typeName}
                          </div>
                          <div>
                            <span className="font-medium">Trạng thái:</span>{" "}
                            {pending ? (
                              <span className="text-orange-600">Chờ kết quả</span>
                            ) : (
                              <span>
                                {t.resultValue ?? "-"}
                                {t.unit && ` ${t.unit}`}
                              </span>
                            )}
                          </div>
                        </div>
                        {t.resultDate && (
                          <div>
                            <span className="font-medium">Ngày kết quả:</span>{" "}
                            {new Date(t.resultDate).toLocaleDateString("vi-VN")}
                          </div>
                        )}
                        {t.notes && (
                          <div>
                            <span className="font-medium">Ghi chú:</span> {t.notes}
                          </div>
                        )}
                        {t.attachment && (
                          <div>
                            <span className="font-medium">Ảnh đính kèm:</span>
                            <div className="mt-2">
                              <a
                                href={buildAttachmentUrl(t.attachment)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                <img
                                  src={buildAttachmentUrl(t.attachment)}
                                  alt={`Ảnh xét nghiệm ${typeName}`}
                                  className="max-w-xs max-h-48 rounded border cursor-pointer hover:opacity-80 transition-opacity object-contain"
                                  onError={(e) => {
                                    // Fallback nếu ảnh không load được
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-xs text-muted-foreground">Không thể tải ảnh: ${t.attachment}</span>`;
                                    }
                                  }}
                                />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có kết quả xét nghiệm
                </p>
              )}
            </div>

            {/* Lên lịch tái khám */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <div className="font-semibold">Lên lịch tái khám</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-100">
                <p className="text-xs text-muted-foreground mb-2">
                  Đặt lịch tái khám trực tiếp cho bệnh nhân. Lịch hẹn sẽ được lưu vào hồ sơ bệnh án và bệnh nhân sẽ nhận được email thông báo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="reappointment-date" className="text-xs">
                      Ngày tái khám mong muốn
                    </Label>
                    <Input
                      id="reappointment-date"
                      type="date"
                      value={reappointmentDate}
                      onChange={(e) => setReappointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reappointment-time" className="text-xs">
                      Giờ tái khám mong muốn{" "}
                      <span className="text-[10px] text-muted-foreground">
                        (Giờ Việt Nam GMT+7)
                      </span>
                    </Label>
                    <select
                      id="reappointment-time"
                      value={reappointmentTime}
                      onChange={(e) => setReappointmentTime(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">-- Chọn giờ --</option>
                      {VIETNAM_TIME_SLOTS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reappointment-notes" className="text-xs">
                    Ghi chú (tùy chọn)
                  </Label>
                  <Textarea
                    id="reappointment-notes"
                    placeholder="Nhập ghi chú về lý do tái khám (sẽ được gửi trong email thông báo cho bệnh nhân)..."
                    value={reappointmentNotes}
                    onChange={(e) => setReappointmentNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!reappointmentDate) {
                      toast({
                        title: "Lỗi",
                        description: "Vui lòng chọn ngày tái khám.",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (!reappointmentTime) {
                      toast({
                        title: "Lỗi",
                        description: "Vui lòng chọn giờ tái khám.",
                        variant: "destructive",
                      });
                      return;
                    }

                    if (!record?.appointment) {
                      toast({
                        title: "Lỗi",
                        description: "Không tìm thấy thông tin lịch hẹn.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const patientId = record.appointment.patientId;
                    const doctorId = record.appointment.doctorId;

                    if (!patientId || !doctorId) {
                      toast({
                        title: "Lỗi",
                        description: "Không tìm thấy thông tin bệnh nhân hoặc bác sĩ.",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      setSendingReappointment(true);

                      // Format datetime: YYYY-MM-DDTHH:mm:ss
                      const appointmentDateTime = `${reappointmentDate}T${reappointmentTime}:00`;

                      // Create appointment directly
                      const reasonForVisit = reappointmentNotes?.trim()
                        ? `Tái khám: ${reappointmentNotes}`
                        : "Tái khám theo yêu cầu của bác sĩ";

                      const appointmentResult = await appointmentService.createByReceptionist({
                        patientId: patientId,
                        doctorId: doctorId,
                        appointmentDate: appointmentDateTime,
                        reasonForVisit: reasonForVisit,
                      });

                      // Update medical record with reappointment info
                      const updatedNotes = record.doctorNotes
                        ? `${record.doctorNotes}\n\n[Lịch tái khám đã đặt: ${new Date(appointmentDateTime).toLocaleString('vi-VN')}]`
                        : `[Lịch tái khám đã đặt: ${new Date(appointmentDateTime).toLocaleString('vi-VN')}]`;

                      await MedicalRecordService.update(record.recordId, {
                        doctorNotes: updatedNotes,
                        diagnosis: record.diagnosis ?? undefined,
                      });

                      toast({
                        title: "Thành công",
                        description: `Đã đặt lịch tái khám cho bệnh nhân vào ${new Date(appointmentDateTime).toLocaleString('vi-VN')}. Bệnh nhân sẽ nhận được email thông báo.`,
                      });

                      // Reset form
                      setReappointmentDate("");
                      setReappointmentTime("");
                      setReappointmentNotes("");

                      // Reload record to show updated info
                      await reloadRecord();
                    } catch (error: any) {
                      console.error("Error creating reappointment:", error);
                      toast({
                        title: "Lỗi",
                        description: error?.message || "Không thể đặt lịch tái khám. Vui lòng thử lại.",
                        variant: "destructive",
                      });
                    } finally {
                      setSendingReappointment(false);
                    }
                  }}
                  disabled={sendingReappointment || !reappointmentDate || !reappointmentTime}
                  size="sm"
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingReappointment ? "Đang đặt lịch..." : "Đặt lịch tái khám"}
                </Button>
              </div>
            </div>

            {/* Thanh toán
            <div>
              <div className="font-semibold mb-2">
                Thanh toán ({record.payments?.length ?? 0})
              </div>
              {record.payments && record.payments.length > 0 ? (
                <div className="border rounded divide-y">
                  {record.payments.map((p) => (
                    <div
                      key={p.paymentId}
                      className="grid grid-cols-4 gap-2 p-2 text-sm"
                    >
                      <div className="col-span-2">
                        {new Date(p.paymentDate).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-right">
                        {p.amount.toLocaleString("vi-VN")} đ
                      </div>
                      <div className="text-right">{p.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có thanh toán
                </p>
              )}
            </div> */}
          </div>
        </Card>
      </div>

      {prescriptionRecord && showPrescriptionModal && (
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          record={prescriptionRecord}
          onSaved={handlePrescriptionSaved}
        />
      )}
    </DashboardLayout>
    </RoleGuard>
  );
}
