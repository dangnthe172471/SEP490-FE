"use client"

import { useEffect, useMemo, useState } from 'react'
import { Activity, CheckCircle2, Clock, XCircle, CalendarDays, Users } from 'lucide-react'
import { DashboardService } from '@/lib/services/dashboard-service'
import { DashboardLayout } from '@/components/dashboard-layout'
import { getReceptionNavigation } from '@/lib/navigation'

type ClinicStatus = {
    date: string
    appointments: {
        total: number
        pending: number
        confirmed: number
        completed: number
        cancelled: number
    }
    todayNewPatients: number
}

export default function ClinicStatusPage() {
    const [data, setData] = useState<ClinicStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))

    const load = (d?: string) => {
        setLoading(true)
        const svc = new DashboardService()
        svc
            .getClinicStatus(d)
            .then(setData)
            .catch((e) => setError(e.message ?? 'Error'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        load(date)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Compute derived values unconditionally to keep hook order stable
    const a = data?.appointments || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    const total = Math.max(1, a.total)
    const pct = (n: number) => Math.round((n / total) * 100)
    const summary = useMemo(() => ([
        { label: 'Chờ xác nhận', value: a.pending, percent: pct(a.pending), color: 'text-yellow-700' },
        { label: 'Đã xác nhận', value: a.confirmed, percent: pct(a.confirmed), color: 'text-blue-700' },
        { label: 'Hoàn thành', value: a.completed, percent: pct(a.completed), color: 'text-emerald-700' },
        { label: 'Đã hủy', value: a.cancelled, percent: pct(a.cancelled), color: 'text-red-700' },
    ]), [a.pending, a.confirmed, a.completed, a.cancelled, total])

    if (loading) return <DashboardLayout navigation={getReceptionNavigation()}><div>Đang tải...</div></DashboardLayout>
    if (error) return <DashboardLayout navigation={getReceptionNavigation()}><div className="text-red-600">Lỗi: {error}</div></DashboardLayout>
    if (!data) return <DashboardLayout navigation={getReceptionNavigation()}><div>Không có dữ liệu</div></DashboardLayout>

    return (
        <DashboardLayout navigation={getReceptionNavigation()}>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Trạng thái phòng khám</h1>
                        <p className="text-sm text-muted-foreground">Ngày {new Date(data.date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-9 rounded-md border px-2 text-sm bg-background"
                        />
                        <button
                            onClick={() => load(date)}
                            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm"
                        >
                            Xem
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Tổng lịch" value={a.total} icon={<CalendarDays className="h-5 w-5" />} color="bg-primary/10 text-primary" />
                    <StatCard title="Chờ xác nhận" value={a.pending} icon={<Clock className="h-5 w-5" />} color="bg-yellow-100 text-yellow-700" />
                    <StatCard title="Đã xác nhận" value={a.confirmed} icon={<Activity className="h-5 w-5" />} color="bg-blue-100 text-blue-700" />
                    <StatCard title="Hoàn thành" value={a.completed} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-emerald-100 text-emerald-700" />
                    <StatCard title="Đã hủy" value={a.cancelled} icon={<XCircle className="h-5 w-5" />} color="bg-red-100 text-red-700" />
                </div>

                <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                    <div className="rounded-xl border bg-card p-4 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Bệnh nhân mới hôm nay</p>
                                <p className="text-3xl font-bold mt-1">{data.todayNewPatients}</p>
                            </div>
                            <div className="rounded-full p-3 bg-primary/10 text-primary">
                                <Users className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                            Tổng lịch: <span className="font-medium text-foreground">{a.total}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 lg:col-span-2">
                        <p className="text-sm font-medium mb-3">Tỉ lệ theo trạng thái hôm nay</p>
                        <div className="space-y-3">
                            {summary.map((s) => (
                                <Bar key={s.label} label={`${s.label} · ${s.value}`} percent={s.percent} color={
                                    s.label.includes('Chờ') ? 'bg-yellow-500' : s.label.includes('xác nhận') ? 'bg-blue-500' : s.label.includes('Hoàn') ? 'bg-emerald-500' : 'bg-red-500'
                                } />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon?: React.ReactNode; color?: string }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-muted-foreground">{title}</div>
                    <div className="text-2xl font-bold">{value}</div>
                </div>
                {icon && <div className={`rounded-full p-3 ${color || 'bg-muted text-foreground'}`}>{icon}</div>}
            </div>
        </div>
    )
}

function Bar({ label, percent, color }: { label: string; percent: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{label}</span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 w-full rounded bg-muted">
                <div className={`h-2 rounded ${color}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}


