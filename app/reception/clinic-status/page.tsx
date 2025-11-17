"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, CheckCircle2, Clock, XCircle, CalendarDays, Users } from 'lucide-react'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Bar,
} from 'recharts'
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

const STATUS_COLORS = ['#facc15', '#60a5fa', '#34d399', '#f87171']

export default function ClinicStatusPage() {
    const [data, setData] = useState<ClinicStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

    const navigation = useMemo(() => getReceptionNavigation(), [])

    const load = useCallback(async (selectedDate?: string) => {
        setLoading(true)
        try {
            const svc = new DashboardService()
            const status = await svc.getClinicStatus(selectedDate)
            setData(status)
            setError(null)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        load(date)
    }, [date, load])

    const appointments = data?.appointments ?? { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    const statusChartData = useMemo(() => ([
        { name: 'Chờ xác nhận', value: appointments.pending },
        { name: 'Đã xác nhận', value: appointments.confirmed },
        { name: 'Hoàn thành', value: appointments.completed },
        { name: 'Đã hủy', value: appointments.cancelled },
    ]), [appointments.pending, appointments.confirmed, appointments.completed, appointments.cancelled])

    const trendChartData = useMemo(() => ([
        { name: 'Chờ', value: appointments.pending },
        { name: 'Xác nhận', value: appointments.confirmed },
        { name: 'Hoàn thành', value: appointments.completed },
        { name: 'Hủy', value: appointments.cancelled },
    ]), [appointments.pending, appointments.confirmed, appointments.completed, appointments.cancelled])

    if (loading) return <DashboardLayout navigation={navigation}><div>Đang tải...</div></DashboardLayout>
    if (error) return <DashboardLayout navigation={navigation}><div className="text-red-600">Lỗi: {error}</div></DashboardLayout>
    if (!data) return <DashboardLayout navigation={navigation}><div>Không có dữ liệu</div></DashboardLayout>

    return (
        <DashboardLayout navigation={navigation}>
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
                            disabled={loading}
                        >
                            Xem
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Tổng lịch" value={appointments.total} icon={<CalendarDays className="h-5 w-5" />} color="bg-primary/10 text-primary" />
                    <StatCard title="Chờ xác nhận" value={appointments.pending} icon={<Clock className="h-5 w-5" />} color="bg-yellow-100 text-yellow-700" />
                    <StatCard title="Đã xác nhận" value={appointments.confirmed} icon={<Activity className="h-5 w-5" />} color="bg-blue-100 text-blue-700" />
                    <StatCard title="Hoàn thành" value={appointments.completed} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-emerald-100 text-emerald-700" />
                    <StatCard title="Đã hủy" value={appointments.cancelled} icon={<XCircle className="h-5 w-5" />} color="bg-red-100 text-red-700" />
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
                            Tổng lịch: <span className="font-medium text-foreground">{appointments.total}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 lg:col-span-2">
                        <p className="text-sm font-medium mb-3">Phân bố trạng thái hôm nay</p>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={`status-${entry.name}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="font-medium">Chi tiết trạng thái</div>
                            <p className="text-sm text-muted-foreground">So sánh số lượng từng trạng thái lịch trong ngày</p>
                        </div>
                        <div className="rounded-full p-2 bg-primary/10 text-primary">
                            <Activity className="h-4 w-4" />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={trendChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {trendChartData.map((entry, index) => (
                                    <Cell key={`bar-${entry.name}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
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

