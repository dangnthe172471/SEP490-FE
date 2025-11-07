"use client"

import { Badge } from "@/components/ui/badge"

export type CombinedStatusSnapshot = {
  hasInternal: boolean
  internalComplete: boolean
  hasPediatric: boolean
  pediatricComplete: boolean
  testsComplete: boolean
}

export function CombinedStatusPill({
  status,
}: {
  status?: CombinedStatusSnapshot | null
}) {
  if (!status) return <Badge variant="outline">Đang kiểm tra…</Badge>

  const internalVariant = status.internalComplete ? "secondary" : "outline"
  const internalLabel = status.hasInternal
    ? status.internalComplete ? "Nội" : "Nội thiếu"
    : "Nội"

  const pediatricVariant = status.pediatricComplete ? "secondary" : "outline"
  const pediatricLabel = status.hasPediatric
    ? status.pediatricComplete ? "Nhi" : "Nhi thiếu"
    : "Nhi"

  const testsVariant = status.testsComplete ? "secondary" : "outline"
  const testsLabel = status.testsComplete ? "XN đủ" : "XN thiếu"

  return (
    <div className="flex flex-wrap gap-1">
      <Badge
        variant={internalVariant}
        className={!status.internalComplete ? "opacity-70" : undefined}
      >
        {internalLabel}
      </Badge>
      <Badge
        variant={pediatricVariant}
        className={!status.pediatricComplete ? "opacity-70" : undefined}
      >
        {pediatricLabel}
      </Badge>
      <Badge
        variant={testsVariant}
        className={!status.testsComplete ? "opacity-70" : undefined}
      >
        {testsLabel}
      </Badge>
    </div>
  )
}
