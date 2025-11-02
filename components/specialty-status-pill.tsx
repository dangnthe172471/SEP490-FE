"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getSpecialtyStatus } from "@/lib/services/internal-med-service"
import type { SpecialtyStatus } from "@/lib/types/specialties"

export function SpecialtyStatusPill({ recordId }: { recordId: number }) {
  const [s, setS] = useState<SpecialtyStatus | null>(null)

  useEffect(() => {
    let alive = true
    getSpecialtyStatus(recordId)
      .then(x => { if (alive) setS(x) })
      .catch(() => { if (alive) setS(null) })
    return () => { alive = false }
  }, [recordId])

  if (!s) return <Badge variant="outline">Đang kiểm tra…</Badge>

  if (s.hasBoth) return <Badge variant="secondary">Nội + Nhi</Badge>
  if (s.hasInternalMed) return <Badge variant="secondary">Nội</Badge>
  if (s.hasPediatric) return <Badge variant="secondary">Nhi</Badge>
  return <Badge variant="outline">Chưa khám chuyên khoa</Badge>
}
