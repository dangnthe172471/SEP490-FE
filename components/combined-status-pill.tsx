"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getSpecialtyStatus } from "@/lib/services/internal-med-service"
import type { SpecialtyStatus } from "@/lib/types/specialties"

export function CombinedStatusPill({
  recordId,
  hasAllRequiredResults, // XN đủ (từ backend)
}: {
  recordId: number
  hasAllRequiredResults: boolean
}) {
  const [s, setS] = useState<SpecialtyStatus | null>(null)

  useEffect(() => {
    let alive = true
    getSpecialtyStatus(recordId)
      .then(x => { if (alive) setS(x) })
      .catch(() => { if (alive) setS(null) })
    return () => { alive = false }
  }, [recordId])

  if (!s) return <Badge variant="outline">Đang kiểm tra…</Badge>

  return (
    <div className="flex flex-wrap gap-1">
      {/* Nội khoa */}
      {s.hasInternalMed
        ? <Badge variant="secondary">Nội</Badge>
        : <Badge variant="outline">Nội</Badge>}

      {/* Nhi khoa */}
      {s.hasPediatric
        ? <Badge variant="secondary">Nhi</Badge>
        : <Badge variant="outline">Nhi</Badge>}

      {/* Xét nghiệm */}
      {hasAllRequiredResults
        ? <Badge variant="secondary">XN đủ</Badge>
        : <Badge variant="outline">XN thiếu</Badge>}
    </div>
  )
}
