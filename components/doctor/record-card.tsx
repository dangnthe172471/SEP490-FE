"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { RecordListItemDto } from "@/lib/types/doctor-record"

interface RecordCardProps {
  record: RecordListItemDto
  onViewDetails?: (recordId: number) => void
  onViewPrescription?: (prescriptionId: number) => void
  onPrescribe?: (record: RecordListItemDto) => void
}

export function RecordCard({
  record,
  onViewDetails,
  onViewPrescription,
  onPrescribe,
}: RecordCardProps) {
  const visitDate = new Date(record.visitAt)
  const formattedDate = format(visitDate, "dd/MM/yyyy HH:mm", { locale: vi })

  const genderText =
    record.gender === "Nam" ? "Nam" : record.gender === "Nữ" ? "Nữ" : "Khác"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{record.patientName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Mã BN: {record.patientId}</p>
          </div>
          {record.hasPrescription ? (
            <Badge variant="default" className="ml-2 bg-green-600">Đã kê đơn</Badge>
          ) : (
            <Badge variant="outline" className="ml-2">Chưa kê đơn</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Giới tính</p>
            <p className="text-sm font-medium">{genderText}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Ngày sinh</p>
            <p className="text-sm font-medium">
              {record.dob
                ? format(new Date(record.dob), "dd/MM/yyyy", { locale: vi })
                : "Không xác định"}
            </p>
          </div>
        </div>

        {/* Liên hệ */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold">Số điện thoại</p>
          <p className="text-sm font-medium">{record.phone || "Không có"}</p>
        </div>

        {/* Thông tin khám */}
        <div>
          <p className="text-xs text-muted-foreground font-semibold">Ngày khám</p>
          <p className="text-sm font-medium">{formattedDate}</p>
        </div>

        {/* Chẩn đoán */}
        {!!record.diagnosisRaw && (
          <div>
            <p className="text-xs text-muted-foreground font-semibold">Chẩn đoán</p>
            <p className="text-sm font-medium line-clamp-2">{record.diagnosisRaw}</p>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onViewDetails?.(record.recordId)}
          >
            Xem chi tiết
          </Button>

          {record.hasPrescription && record.latestPrescriptionId ? (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onViewPrescription?.(record.latestPrescriptionId!)}
            >
              Xem đơn thuốc
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onPrescribe?.(record)}
            >
              Kê đơn
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
