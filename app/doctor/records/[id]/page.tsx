"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [patientCache, setPatientCache] = useState<
    Record<number, PatientDetail>
  >({});
  const [patientInfo, setPatientInfo] = useState<PatientDetail | null>(null);
  const [creatingInternal, setCreatingInternal] = useState(false);
  const [creatingPediatric, setCreatingPediatric] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168"
          }/api/MedicalRecord/${id}`
        );
        if (!res.ok) throw new Error("Không thể tải dữ liệu hồ sơ");
        const data: MedicalRecordDto = await res.json();
        setRecord(data);

        const patientId = data?.appointment?.patientId;
        if (patientId) {
          // Kiểm tra cache xem đã có thông tin chưa
          let patientData = patientCache[patientId];

          if (!patientData) {
            try {
              // 🔹 1. Lấy thông tin từ bảng Patient
              const origin =
                process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168";
              const pRes = await fetch(`${origin}/api/Patient/${patientId}`);
              if (!pRes.ok) throw new Error("Không thể lấy dữ liệu Patient");

              const patient = await pRes.json();

              // 🔹 2. Lấy thông tin User từ userId của Patient
              const userId = patient?.userId;
              if (!userId)
                throw new Error("Không tìm thấy userId trong Patient");

              const uRes = await fetch(`${origin}/api/Users/${userId}`);
              if (!uRes.ok) throw new Error("Không thể lấy dữ liệu User");

              const userData = await uRes.json();

              // 🔹 3. Gộp dữ liệu Patient và User (tuỳ ý)
              patientData = { ...patient, ...userData };

              // 🔹 4. Lưu vào cache
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

          // 🔹 5. Cập nhật state
          setPatientInfo(patientData ?? null);
        }
      } catch (e: any) {
        setError(e?.message ?? "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    if (!record) return;
    try {
      setSaving(true);
      const updated = await MedicalRecordService.update(record.recordId, {
        diagnosis: record.diagnosis ?? undefined,
        doctorNotes: record.doctorNotes ?? undefined,
      });
      setRecord(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      alert("Không thể lưu hồ sơ");
    } finally {
      setSaving(false);
    }
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
    setRecord((prev) => (prev ? { ...prev, pediatricRecord: created } : prev));
    toast({ title: "Thêm thành công", description: "Đã tạo hồ sơ Nhi khoa." });
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

  if (!record) {
    return (
      <DashboardLayout navigation={navigation}>
        <div className="p-6 text-red-600">Không tìm thấy hồ sơ</div>
      </DashboardLayout>
    );
  }

  return (
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
            <div className="grid grid-cols-2 gap-6 items-center">
              {/* Cột trái - Loại khám */}
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Loại khám
                </h3>
                <div className="flex gap-3">
                  <Button
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
                    onClick={handleCreateInternalMed}
                    disabled={creatingInternal}
                  >
                    {creatingInternal ? "Đang tạo..." : "Khám nội"}
                  </Button>
                  <Button
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
                    onClick={handleCreatePediatric}
                    disabled={creatingPediatric}
                  >
                    {creatingPediatric ? "Đang tạo..." : "Khám nhi"}
                  </Button>
                </div>
              </div>

              {/* Cột phải - Loại xét nghiệm */}
              <div className="flex flex-col items-center space-y-4 border-l border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">
                  Loại xét nghiệm
                </h3>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="px-6 py-2 rounded-lg text-gray-700 border-gray-300 hover:bg-gray-50 text-sm font-medium transition-all"
                    onClick={handleCreatePediatric}
                    disabled={creatingPediatric}
                  >
                    {creatingPediatric ? "Đang tạo..." : "Xét nghiệm X"}
                  </Button>
                  <Button
                    variant="outline"
                    className="px-6 py-2 rounded-lg text-gray-700 border-gray-300 hover:bg-gray-50 text-sm font-medium transition-all"
                    onClick={handleCreatePediatric}
                    disabled={creatingPediatric}
                  >
                    {creatingPediatric ? "Đang tạo..." : "Xét nghiệm Y"}
                  </Button>
                </div>
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
                    {record.appointment?.appointmentId ?? record.appointmentId}
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
                <label className="text-sm text-slate-600">Ghi chú bác sĩ</label>
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

            <div>
              <div className="font-semibold mb-2">
                Đơn thuốc ({record.prescriptions?.length ?? 0})
              </div>
              {record.prescriptions && record.prescriptions.length > 0 ? (
                <div className="border rounded divide-y">
                  {record.prescriptions.map((p) => (
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
              )}
            </div>

            <div>
              <div className="font-semibold mb-2">
                Kết quả xét nghiệm ({record.testResults?.length ?? 0})
              </div>
              {record.testResults && record.testResults.length > 0 ? (
                <div className="border rounded divide-y">
                  {record.testResults.map((t) => (
                    <div
                      key={t.testResultId}
                      className="grid grid-cols-4 gap-2 p-2 text-sm"
                    >
                      <div className="col-span-2">
                        Loại:{" "}
                        <span className="font-medium">
                          {t.testResultId ?? "-"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        KQ:{" "}
                        <span className="font-medium">
                          {t.resultValue ?? "-"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        {t.resultDate
                          ? new Date(t.resultDate).toLocaleDateString("vi-VN")
                          : "-"}
                      </div>
                      <div className="col-span-2">{t.notes ?? ""}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có kết quả xét nghiệm
                </p>
              )}
            </div>

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
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
