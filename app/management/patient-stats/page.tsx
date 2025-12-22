"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingUp, Users } from 'lucide-react'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
} from 'recharts'
import { DashboardService } from '@/lib/services/dashboard-service'
import { DashboardLayout } from '@/components/dashboard-layout'
import { getManagerNavigation } from '@/lib/navigation'
import { RoleGuard } from '@/components/role-guard'

type Stats = {
    totalPatients: number
    byGender: { male: number; female: number; other: number }
    byAgeGroups: { _0_17: number; _18_35: number; _36_55: number; _56_Plus: number }
    monthlyNewPatients: { month: string; count: number }[]
}

const GENDER_COLORS = ['#60a5fa', '#f472b6', '#a78bfa']
const AGE_COLORS = ['#34d399', '#fbbf24', '#fb7185', '#a78bfa']

export default function PatientStatsPage() {
    const [data, setData] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')

    const navigation = useMemo(() => getManagerNavigation(), [])

    const fetchData = useCallback(async (start?: string, end?: string) => {
        setError(null)
        if (start && end && new Date(start) > new Date(end)) {
            setError("Ngày 'từ' phải nhỏ hơn hoặc bằng ngày 'đến'.")
            return
        }

        setLoading(true)
        try {
            const svc = new DashboardService()
            const stats = await svc.getPatientStatistics(start, end)
            setData(stats)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const toDefault = new Date()
        const fromDefault = new Date(toDefault)
        fromDefault.setMonth(fromDefault.getMonth() - 11)
        fromDefault.setDate(1)

        const toStr = toDefault.toISOString().slice(0, 10)
        const fromStr = fromDefault.toISOString().slice(0, 10)
        setFrom(fromStr)
        setTo(toStr)
        fetchData(fromStr, toStr)
    }, [fetchData])

    const genderChartData = useMemo(() => {
        if (!data) return []
        return [
            { name: 'Nam', value: data.byGender.male },
            { name: 'Nữ', value: data.byGender.female },
            { name: 'Khác', value: data.byGender.other },
        ]
    }, [data])

    const ageChartData = useMemo(() => {
        if (!data) return []
        return [
            { name: '0-17', value: data.byAgeGroups._0_17 },
            { name: '18-35', value: data.byAgeGroups._18_35 },
            { name: '36-55', value: data.byAgeGroups._36_55 },
            { name: '56+', value: data.byAgeGroups._56_Plus },
        ]
    }, [data])

    return (
        <RoleGuard allowedRoles={["management", "admin"]}>
            <DashboardLayout navigation={navigation}>
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
                            disabled={loading}
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <Card title="Tổng số bệnh nhân" value={data.totalPatients} icon={<Users className="h-5 w-5" />} color="bg-primary/10 text-primary" />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <ChartCard title="Phân bố giới tính">
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={genderChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={2}
                                >
                                    {genderChartData.map((entry, index) => (
                                        <Cell key={`gender-${entry.name}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Phân bố nhóm tuổi">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={ageChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {ageChartData.map((entry, index) => (
                                        <Cell key={`age-${entry.name}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="font-medium">Bệnh nhân mới theo tháng</div>
                            <p className="text-sm text-muted-foreground">Theo dõi tăng trưởng bệnh nhân trong khoảng thời gian đã chọn</p>
                        </div>
                        <div className="rounded-full p-2 bg-emerald-100 text-emerald-700">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={360}>
                        <LineChart data={data.monthlyNewPatients}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            </DashboardLayout>
        </RoleGuard>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="mb-4">
                <div className="font-medium">{title}</div>
                <p className="text-sm text-muted-foreground">Hiển thị dưới dạng biểu đồ để dễ so sánh</p>
            </div>
            {children}
        </div>
    )
}

