"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip, Cell } from "recharts"
import type { DoctorReturnRateDto } from "@/lib/types/doctor-statistics"

interface ReturnRateChartProps {
  data: DoctorReturnRateDto[]
}

export default function ReturnRateChart({ data }: ReturnRateChartProps) {
  const chartData = data.map((item) => ({
    name: item.doctorName,
    returnRate: Number(item.returnRate.toFixed(1)),
    totalPatients: item.totalPatients,
    returnPatients: item.returnPatients,
  }))

  const getBarColor = (rate: number) => {
    if (rate >= 65) return "#16a34a"
    if (rate >= 60) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          label={{ value: "Tỷ lệ (%)", angle: -90, position: "insideLeft", fontSize: 11 }}
        />
        <Tooltip
          formatter={(value: any, name) => {
            if (name === "Tỷ lệ tái khám" && typeof value === "number") {
              return [`${value.toFixed(1)}%`, name]
            }
            return [value, name]
          }}
        />
        <Legend />
        <Bar dataKey="returnRate" name="Tỷ lệ tái khám" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getBarColor(entry.returnRate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
