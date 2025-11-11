"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"
import type { DoctorVisitTrendPointDto } from "@/lib/types/doctor-statistics"

interface VisitTrendChartProps {
  data: DoctorVisitTrendPointDto[]
}

export default function VisitTrendChart({ data }: VisitTrendChartProps) {
  // Gom theo ngày, mỗi bác sĩ là 1 key
  const dateMap = new Map<string, any>()

  data.forEach((item) => {
    const dateObj = new Date(item.date)
    const label = dateObj.toLocaleDateString("vi-VN")
    if (!dateMap.has(label)) {
      dateMap.set(label, { date: label })
    }
    const row = dateMap.get(label)!
    row[item.doctorName] = item.visitCount
  })

  const chartData = Array.from(dateMap.values()).sort((a, b) => {
    const [d1, m1, y1] = a.date.split("/").map(Number)
    const [d2, m2, y2] = b.date.split("/").map(Number)
    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime()
  })

  const doctors = Array.from(new Set(data.map((x) => x.doctorName)))
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {doctors.map((doctor, index) => (
          <Line
            key={doctor}
            type="monotone"
            dataKey={doctor}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={doctor}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
