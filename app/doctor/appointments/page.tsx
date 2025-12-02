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
  Phone,
  User,
  Clock,
  Stethoscope,
  X,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";

import { Appointment, AppointmentDetail } from "@/lib/types/appointment-doctor";
import {
  getDoctorAppointments,
  getDoctorAppointmentDetail,
} from "@/lib/services/appointment-doctor-service";
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation";
import { MedicalRecordService } from "@/lib/services/medical-record-service";
import {
  shiftService,
  type ShiftResponseDTO,
} from "@/lib/services/shift-service";

/* ===== Màu theo Status: Confirmed -> xanh, Cancelled -> đỏ ===== */
const statusToClasses = (s: Appointment["status"]) =>
  s === "Cancelled"
    ? "bg-red-100 text-red-800 border border-red-300"
    : "bg-green-100 text-green-800 border border-green-300";

/* ===== Date helpers ===== */
const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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

/* ===== Helpers cho shift/time ===== */
const timeToMinutes = (t: string) => {
  // hỗ trợ "HH:mm" hoặc "HH:mm:ss"
  const [hRaw, mRaw] = t.split(":");
  const h = parseInt(hRaw ?? "0", 10);
  const m = parseInt(mRaw ?? "0", 10);
  return h * 60 + m;
};

const getShiftIdForTime = (
  appointmentTime: string,
  shifts: ShiftResponseDTO[]
): number | null => {
  const aptMinutes = timeToMinutes(appointmentTime);
  for (const s of shifts) {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    if (aptMinutes >= start && aptMinutes < end) {
      return s.shiftID;
    }
  }
  return null;
};

const formatShiftTimeWindow = (shift: ShiftResponseDTO) => {
  const start = shift.startTime.slice(0, 5); // HH:mm
  const end = shift.endTime.slice(0, 5);
  return `${start} – ${end}`;
};

/* ===== Helpers đọc token & role ===== */
function getAccessTokenFromClient(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const fromLS =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("access_token") ??
      undefined;
    if (fromLS) return fromLS;

    const cookieName = (n: string) =>
      document.cookie?.split("; ")?.find((c) => c.startsWith(`${n}=`));
    const authCookie = cookieName("auth_token");
    const accCookie = cookieName("access_token");
    if (authCookie) return decodeURIComponent(authCookie.split("=")[1]);
    if (accCookie) return decodeURIComponent(accCookie.split("=")[1]);

    return undefined;
  } catch {
    return undefined;
  }
}

function getRoleFromToken(token?: string): string | null {
  if (!token || typeof window === "undefined") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      base.length % 4 === 0
        ? base
        : base.padEnd(base.length + (4 - (base.length % 4)), "=");
    const json = atob(padded);
    const payload = JSON.parse(json);

    return (
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload["role"] ??
      null
    );
  } catch {
    return null;
  }
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const navigation = getDoctorNavigation();

  const goBackSafely = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Dùng để chặn render UI khi chưa check xong quyền
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getAccessTokenFromClient();

    if (!token) {
      toast({
        variant: "destructive",
        title: "Bạn không có quyền truy cập",
        description: "Vui lòng đăng nhập để tiếp tục.",
      });
      goBackSafely();
      return;
    }

    const role = getRoleFromToken(token);

    if (role !== "Doctor") {
      toast({
        variant: "destructive",
        title: "Bạn không có quyền truy cập",
        description:
          "Bạn không có quyền truy cập trang này hoặc trang không tồn tại.",
      });
      goBackSafely();
      return;
    }

    setAuthChecked(true);
  }, [router, toast]);

  // ---- Khởi tạo theo hôm nay ----
  const today = new Date();
  const todayISO = toISO(today);
  const currentWeekStart = startOfWeekMonday(todayISO);

  // ---- YEAR + WEEK (2 dropdown)
  const [year, setYear] = useState<number>(today.getFullYear());
  const [weekStart, setWeekStart] = useState<string>(currentWeekStart);

  // cửa sổ năm động 10 năm quanh năm hiện tại
  const yearOptions = useMemo(
    () => Array.from({ length: 10 }, (_, i) => year - 5 + i),
    [year]
  );

  const weekOptions = useMemo(() => weeksOfYear(year), [year]);

  useEffect(() => {
    const wsYear = new Date(weekStart + "T00:00:00").getFullYear();
    if (wsYear !== year && weekOptions.length) setWeekStart(weekOptions[0]);
  }, [year, weekOptions, weekStart]);

  // ---- Data: appointments ----
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AppointmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [, setMrLoading] = useState(false);
  const [, setMrError] = useState<string | null>(null);

  const [showReasonPopup, setShowReasonPopup] = useState(false);

  const [shifts, setShifts] = useState<ShiftResponseDTO[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);

  const loadOrCreateMedicalRecord = async () => {
    if (!selected) return;
    try {
      setMrLoading(true);
      setMrError(null);
      const rec = await MedicalRecordService.ensureByAppointment(
        selected.appointmentId
      );
      toast({
        title: "Thành công",
        description: "Đã mở hồ sơ bệnh án của bệnh nhân.",
        className: "border border-green-500 bg-green-50 text-green-900",
      });
      router.push(`/doctor/records/${rec.recordId}`);
    } catch (e: any) {
      const msg = e?.message ?? "Không thể tải hồ sơ bệnh án";
      setMrError(msg);
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setMrLoading(false);
    }
  };

  // ---- Load appointments: chỉ chạy khi đã authChecked === true ----
  useEffect(() => {
    if (!authChecked) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDoctorAppointments();
        if (mounted) setItems(data);
      } catch (e: any) {
        const msg = e?.message ?? "Không thể tải dữ liệu";

        if (msg.includes("User hiện tại không phải là bác sĩ")) {
          toast({
            variant: "destructive",
            title: "Bạn không có quyền truy cập",
            description:
              "Bạn không có quyền truy cập trang này hoặc trang không tồn tại.",
          });
          goBackSafely();
          return;
        }

        if (msg === "UNAUTHORIZED" || /401|403/.test(msg)) {
          toast({
            variant: "destructive",
            title: "Phiên làm việc hết hạn",
            description: "Vui lòng đăng nhập lại.",
          });
          goBackSafely();
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
  }, [authChecked, router, toast]);

  // ---- Load shifts: cũng chờ authChecked ----
  useEffect(() => {
    if (!authChecked) return;

    let mounted = true;
    (async () => {
      try {
        setShiftsLoading(true);
        setShiftsError(null);
        const data = await shiftService.getAllShifts();
        if (mounted) {
          const sorted = [...data].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          );
          setShifts(sorted);
        }
      } catch (e: any) {
        if (mounted)
          setShiftsError(e?.message ?? "Không thể tải ca làm việc");
      } finally {
        setShiftsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authChecked]);

  // ---- 7 ngày theo tuần đã chọn ----
  const weekDates = useMemo(() => generate7Days(weekStart), [weekStart]);

  const filteredAppointments = useMemo(
    () => items.filter((a) => weekDates.includes(a.appointmentDateISO)),
    [items, weekDates]
  );

  /**
   * grouped: Map<dateISO, Record<shiftID, Appointment[]>>
   */
  const grouped = useMemo(() => {
    const map = new Map<string, Record<number, Appointment[]>>();

    for (const d of weekDates) {
      map.set(d, {});
    }

    if (!shifts.length) return map;

    for (const apt of filteredAppointments) {
      const shiftId = getShiftIdForTime(apt.appointmentTime, shifts);
      if (!shiftId) continue;

      const dayBucket = map.get(apt.appointmentDateISO);
      if (!dayBucket) continue;

      if (!dayBucket[shiftId]) {
        dayBucket[shiftId] = [];
      }
      dayBucket[shiftId].push(apt);
    }

    // sort trong từng ca theo giờ
    for (const d of weekDates) {
      const dayBucket = map.get(d);
      if (!dayBucket) continue;
      for (const s of shifts) {
        const list = dayBucket[s.shiftID];
        if (list) {
          list.sort((a, b) =>
            a.appointmentTime.localeCompare(b.appointmentTime)
          );
        }
      }
    }

    return map;
  }, [filteredAppointments, weekDates, shifts]);

  const total = filteredAppointments.length;

  const openDetail = async (apt: Appointment) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const d = await getDoctorAppointmentDetail(apt.appointmentId);
      setSelected(d);
      setShowReasonPopup(false);
    } catch (e: any) {
      const msg = e?.message ?? "Không thể tải chi tiết";

      if (msg === "UNAUTHORIZED" || /401|403/.test(msg)) {
        toast({
          variant: "destructive",
          title: "Phiên làm việc hết hạn",
          description: "Vui lòng đăng nhập lại.",
        });
        goBackSafely();
        return;
      }

      setDetailError(msg);
      setSelected({
        ...apt,
        doctorId: 0,
        doctorName: "",
        doctorSpecialty: "",
        createdAt: null,
      } as AppointmentDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  // ⛔ Nếu chưa check xong quyền thì không render UI
  if (!authChecked) {
    return null;
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lịch hẹn</h1>
            <p className="text-muted-foreground">
              Xem lịch theo ca làm việc trong 7 ngày
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
            className="ml-auto border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-200 hover:text-blue-900 transition-colors"
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
        {shiftsLoading && (
          <p className="text-sm text-muted-foreground">Đang tải ca làm việc…</p>
        )}
        {shiftsError && (
          <p className="text-sm text-red-600">{shiftsError}</p>
        )}

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
              {shifts.map((shift) => (
                <tr
                  key={shift.shiftID}
                  className="align-top hover:bg-slate-50 transition-colors"
                >
                  <td className="border border-slate-300 p-5 font-semibold bg-slate-50 sticky left-0">
                    <div className="text-slate-900 text-base">
                      {shift.shiftType}
                    </div>
                    <div className="text-xs text-slate-600 leading-tight mt-0.5">
                      {formatShiftTimeWindow(shift)}
                    </div>
                  </td>
                  {weekDates.map((iso) => {
                    const dayBucket = grouped.get(iso) ?? {};
                    const items = dayBucket[shift.shiftID] ?? [];
                    return (
                      <td
                        key={`${shift.shiftID}-${iso}`}
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
              ))}
              {!shifts.length && !shiftsLoading && (
                <tr>
                  <td
                    colSpan={1 + weekDates.length}
                    className="p-4 text-center text-sm text-slate-500"
                  >
                    Không có cấu hình ca làm việc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Chi tiết lịch hẹn
                  </h2>
                  <button
                    onClick={() => {
                      setSelected(null);
                      setShowReasonPopup(false);
                    }}
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
                  </div>

                  {/* Thông tin bệnh nhân */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" /> Thông tin bệnh
                      nhân
                    </h3>
                    <div className="bg-slate-50 p-3 rounded space-y-1">
                      <p>
                        <span className="text-sm text-slate-600">Tên: </span>
                        {selected.patientName}
                      </p>
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

                  {/* Lý do khám bệnh */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Lý do khám bệnh
                      </h3>
                      {selected.visitReason && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReasonPopup(true)}
                        >
                          Xem chi tiết lý do
                        </Button>
                      )}
                    </div>
                    {!selected.visitReason && (
                      <p className="mt-2 text-sm text-slate-500 italic">
                        Chưa có lý do khám bệnh.
                      </p>
                    )}
                  </div>

                  {/* Thông tin bác sĩ */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" /> Thông
                      tin bác sĩ
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

          {/* Popup lý do khám bệnh */}
          {selected.visitReason && showReasonPopup && (
            <div className="fixed inset-0 flex items-center justify-center z-60 p-4 pointer-events-none">
              <div
                className="absolute inset-0"
                onClick={() => setShowReasonPopup(false)}
              />
              <Card className="relative w-full max-w-lg max-h-[70vh] shadow-2xl bg-white pointer-events-auto">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">
                      Lý do khám bệnh
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowReasonPopup(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-slate-50 p-3 rounded max-h-[50vh] overflow-y-auto text-sm whitespace-pre-line">
                    {selected.visitReason}
                  </div>
                </div>
                <div className="px-4 pb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReasonPopup(false)}
                  >
                    Đóng
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
