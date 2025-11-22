"use client"

import { Badge } from "@/components/ui/badge"

export type CombinedStatusSnapshot = {
  hasInternal: boolean
  internalComplete: boolean
  hasPediatric: boolean
  pediatricComplete: boolean
  hasDermatology: boolean
  dermatologyComplete: boolean
  testsRequested: number
  testsComplete: boolean
}

interface CombinedStatusPillProps {
  status?: CombinedStatusSnapshot
}

/**
 * Hiển thị các “pill” trạng thái: Nội / Nhi / Da liễu / XN chờ
 */
export function CombinedStatusPill({ status }: CombinedStatusPillProps) {
  if (!status) return null

  const {
    hasInternal,
    internalComplete,
    hasPediatric,
    pediatricComplete,
    hasDermatology,
    dermatologyComplete,
    testsRequested,
    testsComplete,
  } = status

  const showInternal = hasInternal
  const showPediatric = hasPediatric
  const showDerm = hasDermatology
  const showTests = testsRequested > 0

  if (!showInternal && !showPediatric && !showDerm && !showTests) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {showInternal && (
        <Badge
          className="text-xs"
          variant={internalComplete ? "default" : "outline"}
        >
          Nội
        </Badge>
      )}

      {showPediatric && (
        <Badge
          className="text-xs"
          variant={pediatricComplete ? "default" : "outline"}
        >
          Nhi
        </Badge>
      )}

      {showDerm && (
        <Badge
          className="text-xs"
          variant={dermatologyComplete ? "default" : "outline"}
        >
          Da liễu
        </Badge>
      )}

      {showTests && (
        <Badge
          className="text-xs"
          variant={testsComplete ? "secondary" : "outline"}
        >
          {testsComplete ? "XN đủ" : "XN chờ"}
        </Badge>
      )}
    </div>
  )
}
