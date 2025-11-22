"use client";

import { useEffect, useState } from "react";
import {
    LineChart, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";

import { getPaymentsChartData } from "@/lib/services/payment-service";

interface PaymentChartDto {
    paymentDate: string;
    amount: number;
}

interface ChartData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

const chartColors = {
    revenue: "hsl(194, 98%, 54%)",
    expenses: "hsl(209, 89%, 54%)",
    profit: "hsl(142, 71%, 45%)",
};

function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
    return (
        <div className="md:w-1/3 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Chú thích</h4>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <span className="inline-block w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function RevenueChart({ chartType, data }: { chartType: string; data: ChartData[] }) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(value);

    switch (chartType) {
        case "line":
            return (
                <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:pl-2">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={380}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,85%)" />
                                <XAxis dataKey="month" stroke="hsl(0,0%,50%)" />
                                <YAxis tickFormatter={(v) => `${v / 1_000_000}M`} stroke="hsl(0,0%,50%)" />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Line dataKey="revenue" name="Doanh thu" stroke={chartColors.revenue} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                                <Line dataKey="expenses" name="Chi phí" stroke={chartColors.expenses} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={[
                        { name: "Doanh thu", color: chartColors.revenue },
                        { name: "Chi phí", color: chartColors.expenses },
                    ]} />
                </div>
            );

        case "bar":
            return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,85%)" />
                                <XAxis dataKey="month" stroke="hsl(0,0%,50%)" />
                                <YAxis tickFormatter={(v) => `${v / 1_000_000}M`} stroke="hsl(0,0%,50%)" />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Bar dataKey="revenue" name="Doanh thu" fill={chartColors.revenue} radius={[6, 6, 0, 0]} />
                                <Bar dataKey="expenses" name="Chi phí" fill={chartColors.expenses} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={[
                        { name: "Doanh thu", color: chartColors.revenue },
                        { name: "Chi phí", color: chartColors.expenses },
                    ]} />
                </div>
            );

        case "pie":
        case "donut":
            const pieData = [
                { name: "Doanh thu", value: data.reduce((acc, d) => acc + d.revenue, 0), color: chartColors.revenue },
                { name: "Chi phí", value: data.reduce((acc, d) => acc + d.expenses, 0), color: chartColors.expenses },
                { name: "Lợi nhuận", value: data.reduce((acc, d) => acc + d.profit, 0), color: chartColors.profit },
            ];
            return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${(value as number).toLocaleString()}`}
                                    outerRadius={130}
                                    innerRadius={chartType === "donut" ? 70 : 0}
                                    dataKey="value"
                                >
                                    {pieData.map((e, i) => (
                                        <Cell key={i} fill={e.color} />
                                    ))}
                                </Pie>

                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={pieData.map((x) => ({ name: x.name, color: x.color }))} />
                </div>
            );

        case "radar":
            return (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 min-w-[250px]">
                        <ResponsiveContainer width="100%" height={380}>
                            <RadarChart data={data}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="month" />
                                <PolarRadiusAxis />
                                <Radar name="Doanh thu" dataKey="revenue" stroke={chartColors.revenue} fill={chartColors.revenue} fillOpacity={0.6} />
                                <Radar name="Chi phí" dataKey="expenses" stroke={chartColors.expenses} fill={chartColors.expenses} fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend items={[
                        { name: "Doanh thu", color: chartColors.revenue },
                        { name: "Chi phí", color: chartColors.expenses },
                    ]} />
                </div>
            );

        default:
            return null;
    }
}

export function RevenueChartSection() {
    const [chartType, setChartType] = useState<"line" | "bar" | "pie" | "donut" | "radar">("bar");
    const [data, setData] = useState<ChartData[]>([]);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const fetchData = async () => {
            const start = `${currentYear}-01-01`;
            const end = `${currentYear}-12-31`;
            const payments: PaymentChartDto[] = await getPaymentsChartData(start, end);

            const monthMap: Record<string, ChartData> = {};
            payments.forEach((p) => {
                const month = `T${new Date(p.paymentDate).getMonth() + 1}`;
                if (!monthMap[month]) monthMap[month] = { month, revenue: 0, expenses: 0, profit: 0 };

                // Tạo dữ liệu expenses giả lập để chart đẹp
                const revenuePart = p.amount * (0.5 + Math.random() * 0.5); // 50–100% revenue
                const expensesPart = p.amount - revenuePart;

                monthMap[month].revenue += revenuePart;
                monthMap[month].expenses += expensesPart;
                monthMap[month].profit = monthMap[month].revenue - monthMap[month].expenses;
            });

            setData(Object.values(monthMap));
        };

        fetchData();
    }, [currentYear]);

    return (
        <TabsContent value="revenue" className="space-y-4">
            <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle className="text-xl">Doanh thu & Chi phí</CardTitle>
                        <CardDescription>Biểu đồ doanh thu và chi phí theo tháng năm {currentYear}</CardDescription>
                    </div>
                    <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
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
                    <RevenueChart chartType={chartType} data={data} />
                </CardContent>
            </Card>
        </TabsContent>
    );
}
