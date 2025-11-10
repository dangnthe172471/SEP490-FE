"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    MessageCircle,
    UserPlus,
} from "lucide-react"

import { appointmentService } from "@/lib/services/appointment-service"
import { AppointmentDto } from "@/lib/types/appointment"
import { getReceptionNavigation } from "@/lib/navigation/reception-navigation"

type ShiftKey = "morning" | "afternoon" | "evening"
const SHIFTS: Record<ShiftKey, { label: string; timeWindow: string; startHour: number; endHour: number }> = {
    morning: { label: "Sáng", timeWindow: "07:00 – 12:00", startHour: 7, endHour: 12 },
    afternoon: { label: "Chiều", timeWindow: "13:00 – 17:00", startHour: 13, endHour: 17 },
    evening: { label: "Tối", timeWindow: "17:00 – 21:00", startHour: 17, endHour: 21 },
}

/* ===== Date helpers ===== */
const toISO = (d: Date) => {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}
const addDays = (iso: string, days: number) => {
    const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + days); return toISO(d)
}
const startOfWeekMonday = (iso: string) => {
    const d = new Date(iso + "T00:00:00"); const day = d.getDay() === 0 ? 7 : d.getDay(); d.setDate(d.getDate() - (day - 1)); return toISO(d)
}
const generate7Days = (startISO: string) => Array.from({ length: 7 }, (_, i) => addDays(startISO, i))
const getShiftForTime = (time: string): ShiftKey | null => {
    const [h, m] = time.split(":"); const hm = parseInt(h, 10) + (parseInt(m ?? "0", 10) / 60)
    if (hm >= 7 && hm < 12) return "morning"
    if (hm >= 13 && hm < 17) return "afternoon"
    if (hm >= 17 && hm < 21) return "evening"
    return null
}
const formatDM = (iso: string) => {
    const d = new Date(iso + "T00:00:00")
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    return `${dd}/${mm}`
}
const weekLabel = (startISO: string) => `${formatDM(startISO)} To ${formatDM(addDays(startISO, 6))}`

interface AppointmentDisplay {
    appointmentId: number
    patientId: number
    patientName: string
    patientPhone: string
    doctorId: number
    doctorName: string
    doctorSpecialty: string
    appointmentDateISO: string
    appointmentTime: string
    status?: string
    reasonForVisit?: string
}

export default function ReceptionAppointmentsSchedulePage() {
    // Get reception navigation from centralized config
    const navigation = getReceptionNavigation()

    const router = useRouter()

    // ---- Week select (mặc định: tuần hiện tại)
    const todayISO = toISO(new Date())
    const currentWeekStart = startOfWeekMonday(todayISO)
    const [weekStart, setWeekStart] = useState<string>(currentWeekStart)

    // Tạo danh sách tuần: 2 tuần trước → 6 tuần sau (tuỳ ý tăng/giảm)
    const weekOptions = useMemo(() => {
        const base = currentWeekStart
        return Array.from({ length: 9 }, (_, i) => addDays(base, (i - 2) * 7))
    }, [currentWeekStart])

    // ---- Data
    const [appointments, setAppointments] = useState<AppointmentDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selected, setSelected] = useState<AppointmentDisplay | null>(null)

    // ---- Load list
    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)
                    // Reception có thể xem TẤT CẢ appointments
                    const data = await appointmentService.getAllAppointments()
                    if (mounted) setAppointments(data)
                } catch (e: any) {
                    const msg = e?.message ?? "Không thể tải dữ liệu"
                    if ((msg === "UNAUTHORIZED" || /401|403/.test(msg)) && window.location.pathname !== "/login") {
                        router.replace("/login?reason=unauthorized")
                        return
                    }
                    if (mounted) setError(msg)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [router])

    // Convert AppointmentDto to AppointmentDisplay
    const items: AppointmentDisplay[] = useMemo(() => {
        // Chỉ lấy các lịch đã xác nhận (Confirmed)
        const confirmed = appointments.filter(a => (a.status || '').toLowerCase() === 'confirmed')

        return confirmed.map((apt) => {
            const date = new Date(apt.appointmentDate)
            const dateISO = toISO(date)
            const time = date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })

            return {
                appointmentId: apt.appointmentId,
                patientId: apt.patientId,
                patientName: apt.patientName,
                patientPhone: apt.patientPhone,
                doctorId: apt.doctorId,
                doctorName: apt.doctorName,
                doctorSpecialty: apt.doctorSpecialty,
                appointmentDateISO: dateISO,
                appointmentTime: time,
                status: apt.status,
                reasonForVisit: apt.reasonForVisit,
            }
        })
    }, [appointments])

    // ---- 7 ngày theo tuần đã chọn
    const weekDates = useMemo(() => generate7Days(weekStart), [weekStart])

    const filteredAppointments = useMemo(
        () => items.filter((a) => weekDates.includes(a.appointmentDateISO)),
        [items, weekDates]
    )

    const grouped = useMemo(() => {
        const map = new Map<string, { morning: AppointmentDisplay[]; afternoon: AppointmentDisplay[]; evening: AppointmentDisplay[] }>()
        for (const d of weekDates) map.set(d, { morning: [], afternoon: [], evening: [] })
        for (const apt of filteredAppointments) {
            const s = getShiftForTime(apt.appointmentTime)
            if (!s) continue
            map.get(apt.appointmentDateISO)![s].push(apt)
        }
        for (const d of weekDates) {
            const b = map.get(d); if (!b) continue
            b.morning.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
            b.afternoon.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
            b.evening.sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
        }
        return map
    }, [filteredAppointments, weekDates])

    const total = filteredAppointments.length

    const openDetail = (apt: AppointmentDisplay) => {
        setSelected(apt)
    }

    const getStatusBadgeColor = (status?: string) => {
        if (!status) return "bg-gray-100 text-gray-800 border-gray-300"

        switch (status) {
            case 'Pending':
                return "bg-yellow-100 text-yellow-800 border-yellow-300"
            case 'Confirmed':
                return "bg-green-100 text-green-800 border-green-300"
            case 'Completed':
                return "bg-blue-100 text-blue-800 border-blue-300"
            case 'Cancelled':
                return "bg-red-100 text-red-800 border-red-300"
            case 'No-Show':
                return "bg-orange-100 text-orange-800 border-orange-300"
            default:
                return "bg-gray-100 text-gray-800 border-gray-300"
        }
    }

    const getAppointmentCardColor = (status?: string) => {
        if (!status) return "bg-gray-100 text-gray-800 border-gray-300"

        switch (status) {
            case 'Pending':
                return "bg-yellow-100 text-yellow-800 border-yellow-300"
            case 'Confirmed':
                return "bg-green-100 text-green-800 border-green-300"
            case 'Completed':
                return "bg-blue-100 text-blue-800 border-blue-300"
            case 'Cancelled':
                return "bg-red-100 text-red-800 border-red-300"
            case 'No-Show':
                return "bg-orange-100 text-orange-800 border-orange-300"
            default:
                return "bg-gray-100 text-gray-800 border-gray-300"
        }
    }

    return (
        <DashboardLayout navigation={navigation}>
            <div className="space-y-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lịch hẹn</h1>
                        <p className="text-muted-foreground">Xem lịch của TẤT CẢ bệnh nhân và bác sĩ theo ca (Sáng/Chiều/Tối) trong 7 ngày</p>
                    </div>

                    {/* Chỉ 1 ô chọn tuần */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Week</span>
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

                {/* Thống kê nhỏ */}
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="tabular-nums">Tổng: {total}</Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setWeekStart(currentWeekStart)}
                    >
                        Tuần hiện tại
                    </Button>
                </div>

                {/* Báo trạng thái fetch */}
                {loading && <p className="text-sm text-muted-foreground">Đang tải danh sách…</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* Bảng lịch */}
                <div className="overflow-x-auto rounded-lg shadow-lg border border-slate-200 bg-white font-sans">
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                                <th className="p-4 text-left text-white font-bold sticky left-0 bg-blue-700 w-56">
                                    Ca & khung giờ
                                </th>
                                {weekDates.map((iso) => {
                                    const d = new Date(iso + "T00:00:00")
                                    const dow = d.toLocaleDateString("vi-VN", { weekday: "short" })
                                    const dm = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                                    return (
                                        <th key={iso} className="p-4 text-center text-white font-bold min-w-60">
                                            <div className="whitespace-pre-line leading-tight tracking-wide">
                                                {`${dow}\n${dm}`}
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {(["morning", "afternoon", "evening"] as ShiftKey[]).map((shiftKey) => (
                                <tr key={shiftKey} className="align-top hover:bg-slate-50 transition-colors">
                                    <td className="border border-slate-300 p-5 font-semibold bg-slate-50 sticky left-0">
                                        <div className="text-slate-900 text-base">{SHIFTS[shiftKey].label}</div>
                                        <div className="text-xs text-slate-600 leading-tight mt-0.5">{SHIFTS[shiftKey].timeWindow}</div>
                                    </td>
                                    {weekDates.map((iso) => {
                                        const items = grouped.get(iso)?.[shiftKey] ?? []
                                        return (
                                            <td key={`${shiftKey}-${iso}`} className="border border-slate-300 p-4 align-top">
                                                {items.length ? (
                                                    <div className="space-y-3">
                                                        {items.map((apt) => {
                                                            const cardColor = getAppointmentCardColor(apt.status)
                                                            return (
                                                                <button
                                                                    key={apt.appointmentId}
                                                                    onClick={() => openDetail(apt)}
                                                                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${cardColor} hover:shadow-md`}
                                                                    title={`${apt.patientName} (${apt.appointmentTime}) - ${apt.doctorName} - ${apt.status || 'Chưa xác nhận'}`}
                                                                >
                                                                    <div className="flex items-center gap-3 leading-none">
                                                                        <Clock className="w-5 h-5 shrink-0 translate-y-[0.5px]" />
                                                                        <span className="font-semibold tabular-nums tracking-tight text-base">
                                                                            {apt.appointmentTime}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-1 flex items-center gap-2 text-[15px] leading-tight">
                                                                        <User className="w-4 h-4 shrink-0" />
                                                                        <span className="font-medium truncate">{apt.patientName}</span>
                                                                    </div>
                                                                    <div className="mt-1 flex items-center gap-2 text-xs leading-tight">
                                                                        <Stethoscope className="w-3 h-3 shrink-0" />
                                                                        <span className="text-slate-600 truncate">{apt.doctorName}</span>
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-20 text-slate-300 text-sm font-medium">—</div>
                                                )}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
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
                                <h2 className="text-2xl font-bold text-slate-900">Chi tiết lịch hẹn</h2>
                                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded">
                                    <label className="text-xs font-semibold text-slate-600 uppercase">Trạng thái: </label>
                                    <Badge className={`mt-2 ${getStatusBadgeColor(selected.status)} text-base py-1 px-3 border-2`}>
                                        {selected.status || "Chưa xác nhận"}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                            <CalendarIcon className="w-4 h-4 text-blue-600" /> Ngày khám
                                        </label>
                                        <p className="font-medium">
                                            {new Date(selected.appointmentDateISO + "T00:00:00").toLocaleDateString("vi-VN", {
                                                weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
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
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-600" /> Thông tin bệnh nhân
                                    </h3>
                                    <div className="bg-slate-50 p-3 rounded space-y-1">
                                        <p><span className="text-sm text-slate-600">Tên: </span>{selected.patientName}</p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{selected.patientPhone}</span>
                                        </p>
                                        <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push(`/reception/patients/${selected.patientId}`)}>
                                            Xem hồ sơ bệnh nhân
                                        </Button>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-blue-600" /> Thông tin bác sĩ
                                    </h3>
                                    <div className="bg-blue-50 p-3 rounded space-y-1">
                                        <p><span className="text-sm text-slate-600">Tên: </span>{selected.doctorName}</p>
                                        <p><span className="text-sm text-slate-600">Chuyên khoa: </span>{selected.doctorSpecialty}</p>
                                    </div>
                                </div>
                                {selected.reasonForVisit && (
                                    <div className="border-t pt-4">
                                        <h3 className="font-semibold text-slate-900 mb-2">Lý do khám</h3>
                                        <p className="text-sm text-muted-foreground">{selected.reasonForVisit}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    )
}

