"use client"

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Users, PieChart as PieIcon, BarChart3 } from 'lucide-react'
import { DashboardService } from '@/lib/services/dashboard-service'
import { DashboardLayout } from '@/components/dashboard-layout'
import { getManagerNavigation } from '@/lib/navigation'

type Stats = {
    totalPatients: number
    byGender: { male: number; female: number; other: number }
    byAgeGroups: { _0_17: number; _18_35: number; _36_55: number; _56_Plus: number }
    monthlyNewPatients: { month: string; count: number }[]
}

export default function PatientStatsPage() {
    const [data, setData] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [from, setFrom] = useState<string>("")
    const [to, setTo] = useState<string>("")

    const fetchData = (pFrom?: string, pTo?: string) => {
        setError(null)
        if (pFrom && pTo && new Date(pFrom) > new Date(pTo)) {
            setError("Ngày 'từ' phải nhỏ hơn hoặc bằng ngày 'đến'.")
            return
        }
        setLoading(true)
        const svc = new DashboardService()
        svc
            .getPatientStatistics(pFrom, pTo)
            .then(setData)
            .catch((e) => setError(e.message ?? 'Error'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        // default range: last 12 months
        const toDefault = new Date()
        const fromDefault = new Date(toDefault)
        fromDefault.setMonth(fromDefault.getMonth() - 11)
        fromDefault.setDate(1)

        const toStr = toDefault.toISOString().slice(0, 10)
        const fromStr = fromDefault.toISOString().slice(0, 10)
        setFrom(fromStr)
        setTo(toStr)
        fetchData(fromStr, toStr)
    }, [])

    const genderRows = useMemo(() => {
        if (!data) return []
        return [
            { label: 'Nam', value: data.byGender.male },
            { label: 'Nữ', value: data.byGender.female },
            { label: 'Khác', value: data.byGender.other },
        ]
    }, [data])

    const ageRows = useMemo(() => {
        if (!data) return []
        return [
            { label: '0-17', value: data.byAgeGroups._0_17 },
            { label: '18-35', value: data.byAgeGroups._18_35 },
            { label: '36-55', value: data.byAgeGroups._36_55 },
            { label: '56+', value: data.byAgeGroups._56_Plus },
        ]
    }, [data])

    if (loading) return <DashboardLayout navigation={getManagerNavigation()}><div>Đang tải...</div></DashboardLayout>
    if (error) return <DashboardLayout navigation={getManagerNavigation()}><div className="text-red-600">Lỗi: {error}</div></DashboardLayout>
    if (!data) return <DashboardLayout navigation={getManagerNavigation()}><div>Không có dữ liệu</div></DashboardLayout>

    return (
        <DashboardLayout navigation={getManagerNavigation()}>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-56">
                        <h1 className="text-2xl font-semibold tracking-tight">Thống kê bệnh nhân</h1>
                        <p className="text-sm text-muted-foreground">Tổng quan bệnh nhân và tăng trưởng theo tháng</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="h-9 rounded-md border px-2 text-sm bg-background"
                        />
                        <span className="text-muted-foreground">đến</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="h-9 rounded-md border px-2 text-sm bg-background"
                        />
                        <button
                            onClick={() => fetchData(from || undefined, to || undefined)}
                            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm"
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <Card title="Tổng số bệnh nhân" value={data.totalPatients} icon={<Users className="h-5 w-5" />} color="bg-primary/10 text-primary" />

                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Giới tính</div>
                            <div className="rounded-full p-2 bg-pink-100 text-pink-700"><PieIcon className="h-4 w-4" /></div>
                        </div>
                        <SimpleTable rows={genderRows} />
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Nhóm tuổi</div>
                            <div className="rounded-full p-2 bg-amber-100 text-amber-700"><BarChart3 className="h-4 w-4" /></div>
                        </div>
                        <SimpleTable rows={ageRows} />
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Cuộc hẹn theo tháng</div>
                        <div className="rounded-full p-2 bg-emerald-100 text-emerald-700"><TrendingUp className="h-4 w-4" /></div>
                    </div>
                    <ul className="divide-y">
                        {data.monthlyNewPatients.map((m) => (
                            <li key={m.month} className="py-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">{m.month}</span>
                                    <span className="font-semibold">{m.count}</span>
                                </div>
                                <div className="h-2 w-full rounded bg-muted mt-1">
                                    <div className="h-2 rounded bg-emerald-500" style={{ width: `${calcMonthPercent(data.monthlyNewPatients, m.count)}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    )
}

function Card({ title, value, icon, color }: { title: string; value: number; icon?: React.ReactNode; color?: string }) {
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

function SimpleTable({ rows }: { rows: { label: string; value: number }[] }) {
    return (
        <table className="w-full text-sm">
            <tbody>
                {rows.map((r) => (
                    <tr key={r.label}>
                        <td className="py-1 text-gray-700">{r.label}</td>
                        <td className="py-1 text-right font-semibold">{r.value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

function calcMonthPercent(items: { month: string; count: number }[], count: number): number {
    const max = Math.max(1, ...items.map(i => i.count))
    return Math.round((count / max) * 100)
}


