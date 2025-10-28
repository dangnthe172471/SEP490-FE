// components/doctor/record-list-table.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { RecordListItemDto } from "@/lib/types/doctor-record"

interface RecordListTableProps {
  records: RecordListItemDto[]
  onPrescribe: (record: RecordListItemDto) => void
}

export default function RecordListTable({ records, onPrescribe }: RecordListTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Bệnh nhân</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Giới tính</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Ngày sinh</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Điện thoại</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Ngày khám</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Chẩn đoán</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Trạng thái</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.recordId} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4 font-medium text-foreground">{record.patientName}</td>
              <td className="py-3 px-4 text-muted-foreground">
                {record.gender === "M" ? "Nam" : record.gender === "F" ? "Nữ" : "Khác"}
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {record.dob ? format(new Date(record.dob), "dd/MM/yyyy", { locale: vi }) : "-"}
              </td>
              <td className="py-3 px-4 text-muted-foreground">{record.phone || "-"}</td>
              <td className="py-3 px-4 text-muted-foreground">
                {format(new Date(record.visitAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </td>
              <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{record.diagnosisRaw || "-"}</td>
              <td className="py-3 px-4">
                {record.hasPrescription ? (
                  <Badge variant="default" className="bg-green-600">Đã kê đơn</Badge>
                ) : (
                  <Badge variant="outline">Chưa kê đơn</Badge>
                )}
              </td>
              <td className="py-3 px-4">
                <Button
                  size="sm"
                  variant={record.hasPrescription ? "outline" : "default"}
                  onClick={() => onPrescribe(record)}
                  disabled={record.hasPrescription}
                  className="gap-2"
                >
                  <Pill className="h-4 w-4" />
                  Kê đơn
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
