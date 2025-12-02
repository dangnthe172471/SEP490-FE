"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  FileText,
  Users,
  Activity,
  Phone,
  User,
  Clock,
  Stethoscope,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Cần import Tooltip
import { Appointment, AppointmentDetail } from "@/lib/types/appointment-doctor";
import {
  getDoctorAppointments,
  getDoctorAppointmentDetail,
} from "@/lib/services/appointment-doctor-service";
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation";
import {
  MedicalRecordService,
  type MedicalRecordDto,
} from "@/lib/services/medical-record-service";

type ShiftKey = "morning" | "afternoon" | "evening";
const SHIFTS: Record<
  ShiftKey,
  { label: string; timeWindow: string; startHour: number; endHour: number }
> = {
  morning: {
    label: "Sáng",
    timeWindow: "07:00 – 12:00",
    startHour: 7,
    endHour: 12,
  },
  afternoon: {
    label: "Chiều",
    timeWindow: "13:00 – 17:00",
    startHour: 13,
    endHour: 17,
  },
  evening: {
    label: "Tối",
    timeWindow: "17:00 – 21:00",
    startHour: 17,
    endHour: 21,
  },
};

/* ===== Màu theo Status: Confirmed -> xanh, Cancelled -> đỏ ===== */
const statusToClasses = (s: Appointment["status"]) =>
  s === "Cancelled"
    ? "bg-red-100 text-red-800 border border-red-300"
    : "bg-green-100 text-green-800 border border-green-300"; // default coi như Confirmed

/* ===== Date helpers ===== */
const toISO = (d: Date) => {
  const y = d.getFullYear(),
    m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISO(d);
};
const startOfWeekMonday = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return toISO(d);
};
const generate7Days = (startISO: string) =>
  Array.from({ length: 7 }, (_, i) => addDays(startISO, i));
const getShiftForTime = (time: string): ShiftKey | null => {
  const [h, m] = time.split(":");
  const hm = parseInt(h, 10) + parseInt(m ?? "0", 10) / 60;
  if (hm >= 7 && hm < 12) return "morning";
  if (hm >= 13 && hm < 17) return "afternoon";
  if (hm >= 17 && hm < 21) return "evening";
  return null;
};
const formatDM = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};
const weekLabel = (startISO: string) =>
  `${formatDM(startISO)} To ${formatDM(addDays(startISO, 6))}`;

/** Tạo danh sách tuần (bắt đầu Thứ Hai) của năm */
const weeksOfYear = (year: number) => {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const firstISO = startOfWeekMonday(toISO(jan1));
  const list: string[] = [];
  let cur = firstISO;
  while (new Date(cur + "T00:00:00") <= dec31) {
    list.push(cur);
    cur = addDays(cur, 7);
  }
  return list;
};

export default function DoctorAppointmentsPage() {
  const router = useRouter();

  // Get doctor navigation from centralized config
  const navigation = getDoctorNavigation();

  // ---- Khởi tạo theo hôm nay
  const today = new Date();
  const todayISO = toISO(today);
  const currentWeekStart = startOfWeekMonday(todayISO);

  // ---- YEAR + WEEK (2 dropdown)
  const [year, setYear] = useState<number>(today.getFullYear());
  const [weekStart, setWeekStart] = useState<string>(currentWeekStart);

  const yearOptions = useMemo(() => {
    const y = today.getFullYear();
    return Array.from({ length: 9 }, (_, i) => y - 4 + i);
  }, [today]);

  const weekOptions = useMemo(() => weeksOfYear(year), [year]);

  useEffect(() => {
    const wsYear = new Date(weekStart + "T00:00:00").getFullYear();
    if (wsYear !== year && weekOptions.length) setWeekStart(weekOptions[0]);
  }, [year, weekOptions, weekStart]);

  // ---- Data
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AppointmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Medical record state (within the detail modal)
  const [record, setRecord] = useState<MedicalRecordDto | null>(null);
  const [mrLoading, setMrLoading] = useState(false);
  const [mrError, setMrError] = useState<string | null>(null);
  const [mrSaved, setMrSaved] = useState<boolean>(false);

  const loadOrCreateMedicalRecord = async () => {
    if (!selected) return;
    try {
      setMrLoading(true);
      setMrError(null);
      const rec = await MedicalRecordService.ensureByAppointment(
        selected.appointmentId
      );
      // Redirect to a dedicated doctor record detail page (reusing reception UX)
      router.push(`/doctor/records/${rec.recordId}`);
    } catch (e: any) {
      setMrError(e?.message ?? "Không thể tải hồ sơ bệnh án");
    } finally {
      setMrLoading(false);
    }
  };

  const saveMedicalRecord = async () => {
    if (!record) return;
    try {
      setMrLoading(true);
      setMrError(null);
      const updated = await MedicalRecordService.update(record.recordId, {
        doctorNotes: record.doctorNotes ?? undefined,
        diagnosis: record.diagnosis ?? undefined,
      });
      // Refetch full object to ensure related lists are fresh
      const fresh = await MedicalRecordService.getByAppointmentId(
        updated.appointmentId
      );
      setRecord(fresh ?? updated);
      setMrSaved(true);
      setTimeout(() => setMrSaved(false), 1500);
    } catch (e: any) {
      setMrError(e?.message ?? "Không thể cập nhật hồ sơ bệnh án");
    } finally {
      setMrLoading(false);
    }
  };

  // ---- Load list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDoctorAppointments();
        if (mounted) setItems(data);
      } catch (e: any) {
        const msg = e?.message ?? "Không thể tải dữ liệu";
        if (
          (msg === "UNAUTHORIZED" || /401|403/.test(msg)) &&
          window.location.pathname !== "/login"
        ) {
          router.replace("/login?reason=unauthorized");
          return;
        }
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  // ---- 7 ngày theo tuần đã chọn
  const weekDates = useMemo(() => generate7Days(weekStart), [weekStart]);

  const filteredAppointments = useMemo(
    () => items.filter((a) => weekDates.includes(a.appointmentDateISO)),
    [items, weekDates]
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        morning: Appointment[];
        afternoon: Appointment[];
        evening: Appointment[];
      }
    >();
    for (const d of weekDates)
      map.set(d, { morning: [], afternoon: [], evening: [] });
    for (const apt of filteredAppointments) {
      const s = getShiftForTime(apt.appointmentTime);
      if (!s) continue;
      map.get(apt.appointmentDateISO)![s].push(apt);
    }
    for (const d of weekDates) {
      const b = map.get(d);
      if (!b) continue;
      b.morning.sort((a, b) =>
        a.appointmentTime.localeCompare(b.appointmentTime)
      );
      b.afternoon.sort((a, b) =>
        a.appointmentTime.localeCompare(b.appointmentTime)
      );
      b.evening.sort((a, b) =>
        a.appointmentTime.localeCompare(b.appointmentTime)
      );
    }
    return map;
  }, [filteredAppointments, weekDates]);

  const total = filteredAppointments.length;

  const openDetail = async (apt: Appointment) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const d = await getDoctorAppointmentDetail(apt.appointmentId);
      setSelected(d);
    } catch (e: any) {
      const msg = e?.message ?? "Không thể tải chi tiết";
      if (
        (msg === "UNAUTHORIZED" || /401|403/.test(msg)) &&
        window.location.pathname !== "/login"
      ) {
        router.replace("/login?reason=unauthorized");
        return;
      }
      setDetailError(msg);
      setSelected({
        ...apt,
        doctorId: 0,
        doctorName: "",
        doctorSpecialty: "",
        createdAt: null,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lịch hẹn</h1>
            <p className="text-muted-foreground">
              Xem lịch theo ca (Sáng/Chiều/Tối) trong 7 ngày
            </p>
          </div>

          {/* 2 dropdown: YEAR + WEEK */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-red-600 underline">
                Year
              </span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[110px]"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Week
              </span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[200px]"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              >
                {weekOptions.map((ws) => (
                  <option key={ws} value={ws}>
                    {weekLabel(ws)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Thống kê nhỏ */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="tabular-nums">
            Tổng: {total}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setYear(today.getFullYear());
              setWeekStart(currentWeekStart);
            }}
          >
            Tuần hiện tại
          </Button>
        </div>

        {/* Báo trạng thái fetch */}
        {loading && (
          <p className="text-sm text-muted-foreground">Đang tải danh sách…</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Bảng lịch */}
        <div className="overflow-x-auto rounded-lg shadow-lg border border-slate-200 bg-white font-sans">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                <th className="p-4 text-left text-white font-bold sticky left-0 bg-blue-700 w-56">
                  Ca &amp; khung giờ
                </th>
                {weekDates.map((iso) => {
                  const d = new Date(iso + "T00:00:00");
                  const dow = d.toLocaleDateString("vi-VN", {
                    weekday: "short",
                  });
                  const dm = d.toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  });
                  return (
                    <th
                      key={iso}
                      className="p-4 text-center text-white font-bold min-w-60"
                    >
                      <div className="whitespace-pre-line leading-tight tracking-wide">
                        {`${dow}\n${dm}`}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(["morning", "afternoon", "evening"] as ShiftKey[]).map(
                (shiftKey) => (
                  <tr
                    key={shiftKey}
                    className="align-top hover:bg-slate-50 transition-colors"
                  >
                    <td className="border border-slate-300 p-5 font-semibold bg-slate-50 sticky left-0">
                      <div className="text-slate-900 text-base">
                        {SHIFTS[shiftKey].label}
                      </div>
                      <div className="text-xs text-slate-600 leading-tight mt-0.5">
                        {SHIFTS[shiftKey].timeWindow}
                      </div>
                    </td>
                    {weekDates.map((iso) => {
                      const items = grouped.get(iso)?.[shiftKey] ?? [];
                      return (
                        <td
                          key={`${shiftKey}-${iso}`}
                          className="border border-slate-300 p-4 align-top"
                        >
                          {items.length ? (
                            <div className="space-y-3">
                              {items.map((apt) => (
                                <button
                                  key={apt.appointmentId}
                                  onClick={() => openDetail(apt)}
                                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer border hover:shadow-md ${statusToClasses(
                                    apt.status
                                  )}`}
                                  title={`${apt.patientName} (${apt.appointmentTime})`}
                                >
                                  <div className="flex items-center gap-3 leading-none">
                                    <Clock className="w-5 h-5 shrink-0 translate-y-[0.5px]" />
                                    <span className="font-semibold tabular-nums tracking-tight text-base">
                                      {apt.appointmentTime}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-[15px] leading-tight">
                                    <User className="w-4 h-4 shrink-0" />
                                    <span className="font-medium truncate">
                                      {apt.patientName}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-20 text-slate-300 text-sm font-medium">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Chi tiết lịch hẹn
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {detailLoading && (
                <p className="text-sm text-muted-foreground">
                  Đang tải chi tiết…
                </p>
              )}
              {detailError && (
                <p className="text-sm text-red-600">{detailError}</p>
              )}
              <div className="space-y-4">
                {/* 1. TRẠNG THÁI */}
                <div className="bg-slate-50 p-4 rounded">
                  <label className="text-xs font-semibold text-slate-600 uppercase">
                    Trạng thái:{" "}
                  </label>
                  <Badge
                    className={`mt-2 text-base py-1 px-3 ${statusToClasses(
                      selected.status
                    )}`}
                  >
                    {selected.status}
                  </Badge>
                </div>

                {/* 2. NGÀY/GIỜ KHÁM (Không thay đổi) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-blue-600" /> Ngày
                      khám
                    </label>
                    <p className="font-medium">
                      {new Date(
                        selected.appointmentDateISO + "T00:00:00"
                      ).toLocaleDateString("vi-VN", {
                        weekday: "short",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-600" /> Giờ khám
                    </label>
                    <p className="font-medium">{selected.appointmentTime}</p>
                  </div>
                  {/* Đã xóa Lý do khám ban đầu tại đây */}
                </div>

                {/* 3. THÔNG TIN BỆNH NHÂN (Đã sửa) */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" /> Thông tin bệnh
                    nhân
                  </h3>
                  <div className="bg-slate-50 p-3 rounded space-y-1">
                    {/* TÊN BỆNH NHÂN & TOOLTIP LÝ DO KHÁM */}
                    <div className="flex items-center gap-2">
                      <p className="flex-shrink-0">
                        <span className="text-sm text-slate-600">Tên: </span>
                        <span className="font-medium">
                          {selected.patientName}
                        </span>
                      </p>

                      {/* Sử dụng Tooltip để hiển thị Lý do khám */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* Đã thêm màu cam tại đây */}
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer text-xs py-0.5 px-2 **bg-orange-100 text-orange-800** border-orange-300 bg-orange-200 transition"
                            >
                              Lý do khám
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3 bg-gray-800 text-white rounded shadow-lg">
                            <p className="font-semibold mb-1">Lý do khám:</p>
                            <p>{selected.reasonForVisit}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">
                        {selected.patientPhone}
                      </span>
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={loadOrCreateMedicalRecord}>
                        Hồ sơ bệnh án
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 4. THÔNG TIN BÁC SĨ (Không thay đổi) */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" /> Thông tin
                    bác sĩ
                  </h3>
                  <div className="bg-blue-50 p-3 rounded space-y-1">
                    <p>
                      <span className="text-sm text-slate-600">Tên: </span>
                      {selected.doctorName}
                    </p>
                    <p>
                      <span className="text-sm text-slate-600">
                        Chuyên khoa:{" "}
                      </span>
                      {selected.doctorSpecialty}
                    </p>
                    {selected.createdAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        Tạo lúc: {selected.createdAt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Moved to dedicated page /doctor/records/[id] for full view/edit */}
    </DashboardLayout>
  );
}
