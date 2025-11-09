"use client"

import { useState } from "react"
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsContent } from "@/components/ui/tabs"


export const revenueData = [
    { month: "T1", revenue: 45000000, expenses: 32000000 },
    { month: "T2", revenue: 52000000, expenses: 35000000 },
    { month: "T3", revenue: 48000000, expenses: 33000000 },
    { month: "T4", revenue: 61000000, expenses: 38000000 },
    { month: "T5", revenue: 55000000, expenses: 36000000 },
    { month: "T6", revenue: 67000000, expenses: 40000000 },
]

const revenuePieData = [
    { name: "Doanh thu Q1-Q2", value: 48.5, color: "hsl(209, 89%, 54%)" },
    { name: "Doanh thu Q3-Q4", value: 54.5, color: "hsl(194, 98%, 54%)" },
    { name: "Chi phí Q1-Q2", value: 33.5, color: "hsl(174, 100%, 52%)" },
    { name: "Chi phí Q3-Q4", value: 37, color: "hsl(268, 78%, 55%)" },
    { name: "Lợi nhuận", value: 26.5, color: "hsl(142, 71%, 45%)" },
]
const revenueRadarData = [
    { period: "T1", revenue: 45, expenses: 32, profit: 13 },
    { period: "T2", revenue: 52, expenses: 35, profit: 17 },
    { period: "T3", revenue: 48, expenses: 33, profit: 15 },
    { period: "T4", revenue: 61, expenses: 38, profit: 23 },
    { period: "T5", revenue: 55, expenses: 36, profit: 19 },
    { period: "T6", revenue: 67, expenses: 40, profit: 27 },
]
function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
    return (
        <div className="md:w-1/3 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Chú thích</h4>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <span
                            className="inline-block w-4 h-4 rounded-sm shadow-sm"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function RevenueChart({
    chartType,
    data,
}: {
    chartType: string
    data: { month: string; revenue: number; expenses: number }[]
}) {

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            minimumFractionDigits: 0,
        }).format(value)

    const chartColors = {
        revenue: "hsl(194, 98%, 54%)",
        expenses: "hsl(209, 89%, 54%)",
        profit: "hsl(142, 71%, 45%)",
    }

    switch (chartType) {

        case "line":
            return (
                <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:pl-2">

                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={380}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,85%)" />
                                <XAxis dataKey="month" stroke="hsl(0,0%,50%)" />
                                <YAxis tickFormatter={(v) => `${v / 1_000_000}M`} stroke="hsl(0,0%,50%)" />
                                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                <Line
                                    dataKey="revenue"
                                    name="Doanh thu"
                                    stroke={chartColors.revenue}
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                                <Line
                                    dataKey="expenses"
                                    name="Chi phí"
                                    stroke={chartColors.expenses}
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend
                        items={[
                            { name: "Doanh thu", color: chartColors.revenue },
                            { name: "Chi phí", color: chartColors.expenses },
                        ]}
                    />
                </div>
            )


        case "bar":
            return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,85%)" />
                                <XAxis dataKey="month" stroke="hsl(0,0%,50%)" />
                                <YAxis tickFormatter={(v) => `${v / 1_000_000}M`} stroke="hsl(0,0%,50%)" />
                                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                <Bar dataKey="revenue" name="Doanh thu" fill={chartColors.revenue} radius={[6, 6, 0, 0]} />
                                <Bar dataKey="expenses" name="Chi phí" fill={chartColors.expenses} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend
                        items={[
                            { name: "Doanh thu", color: chartColors.revenue },
                            { name: "Chi phí", color: chartColors.expenses },
                        ]}
                    />
                </div>
            )


        case "pie":
        case "donut":
            return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={revenuePieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}%`}
                                    outerRadius={130}
                                    innerRadius={chartType === "donut" ? 70 : 0}
                                    dataKey="value"
                                    animationDuration={800}
                                >
                                    {revenuePieData.map((e, i) => (
                                        <Cell key={i} fill={e.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => `${v}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={revenuePieData.map((x) => ({ name: x.name, color: x.color }))} />
                </div>
            )


        case "radar":
            return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={380}>
                            <RadarChart data={revenueRadarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="period" />
                                <PolarRadiusAxis />
                                <Radar
                                    name="Doanh thu"
                                    dataKey="revenue"
                                    stroke={chartColors.revenue}
                                    fill={chartColors.revenue}
                                    fillOpacity={0.6}
                                />
                                <Radar
                                    name="Chi phí"
                                    dataKey="expenses"
                                    stroke={chartColors.expenses}
                                    fill={chartColors.expenses}
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend
                        items={[
                            { name: "Doanh thu", color: chartColors.revenue },
                            { name: "Chi phí", color: chartColors.expenses },
                        ]}
                    />
                </div>
            )

        default:
            return null
    }
}
export function RevenueChartSection() {
    const [revenueChartType, setRevenueChartType] = useState("bar")

    return (
        <TabsContent value="revenue" className="space-y-4">
            <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle className="text-xl">Doanh thu & Chi phí</CardTitle>
                        <CardDescription>Biểu đồ doanh thu và chi phí 6 tháng gần nhất</CardDescription>
                    </div>
                    <Select value={revenueChartType} onValueChange={setRevenueChartType}>
                        <SelectTrigger className="w-44 border-2">
                            <SelectValue placeholder="Chọn loại biểu đồ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="line">📈 Biểu đồ đường</SelectItem>
                            <SelectItem value="bar">📊 Biểu đồ cột</SelectItem>
                            <SelectItem value="pie">🥧 Biểu đồ tròn</SelectItem>
                            <SelectItem value="radar">🎯 Biểu đồ radar</SelectItem>
                            <SelectItem value="donut">🍩 Biểu đồ donut</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>

                <CardContent className="pt-6">
                    <RevenueChart chartType={revenueChartType} data={revenueData} />
                </CardContent>
            </Card>
        </TabsContent>
    )
}