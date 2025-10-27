"use client"

import { RecordCard } from "./record-card"
import type { RecordListItemDto, PagedResult } from "@/lib/types/doctor-record"

interface RecordListProps {
  data: PagedResult<RecordListItemDto>
  isLoading?: boolean
  onViewDetails?: (recordId: number) => void
  onViewPrescription?: (prescriptionId: number) => void
  onPrescribe?: (record: RecordListItemDto) => void
}

export function RecordList({
  data,
  isLoading,
  onViewDetails,
  onViewPrescription,
  onPrescribe,
}: RecordListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data.items || data.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không có hồ sơ bệnh nhân</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.items.map((record) => (
        <RecordCard
          key={record.recordId}
          record={record}
          onViewDetails={onViewDetails}
          onViewPrescription={onViewPrescription}
          onPrescribe={onPrescribe}
        />
      ))}
    </div>
  )
}
