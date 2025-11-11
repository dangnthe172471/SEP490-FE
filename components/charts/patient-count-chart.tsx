"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"
import type { DoctorPatientCountDto } from "@/lib/types/doctor-statistics"

interface PatientCountChartProps {
  data: DoctorPatientCountDto[]
}

export default function PatientCountChart({ data }: PatientCountChartProps) {
  const chartData = data.map((item) => ({
    name: item.doctorName,
    patients: item.totalPatients,
    appointments: item.totalAppointments,
  }))

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 56 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="patients" name="Số bệnh nhân" />
        <Bar dataKey="appointments" name="Lượt khám" />
      </BarChart>
    </ResponsiveContainer>
  )
}
