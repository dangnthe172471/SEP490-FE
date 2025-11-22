"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

import {
  getDermatology,
  updateDermatology,
} from "@/lib/services/dermatology-service"
import type { ReadDermatologyRecordDto } from "@/lib/types/specialties"

// Lấy userId hiện tại từ localStorage / JWT
function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null

  // 1. Ưu tiên đọc currentUser (đang lưu: {"id":6,...})
  const currentUserRaw = localStorage.getItem("currentUser")
  if (currentUserRaw) {
    try {
      const obj = JSON.parse(currentUserRaw)
      const id = Number(obj.id ?? obj.userId ?? obj.UserId)
      if (Number.isFinite(id)) {
        return id
      }
    } catch {
      // ignore parse error
    }
  }

  // 2. Thử key userId (nếu có)
  const stored = localStorage.getItem("userId")
  if (stored && !Number.isNaN(Number(stored))) {
    return Number(stored)
  }

  // 3. Fallback: decode JWT
  const token =
    localStorage.getItem("auth_token") || localStorage.getItem("token")
  if (!token) return null

  try {
    const payloadPart = token.split(".")[1]
    const decoded = JSON.parse(
      atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")),
    )

    const candidate =
      decoded["nameid"] ?? decoded["sub"] ?? decoded["userId"] ?? decoded["UserId"]

    const num = Number(candidate)
    return Number.isFinite(num) ? num : null
  } catch {
    return null
  }
}

interface DermatologyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordId: number
  onSaved?: () => void
}

export function DermatologyDialog({
  open,
  onOpenChange,
  recordId,
  onSaved,
}: DermatologyDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [derm, setDerm] = useState<ReadDermatologyRecordDto | null>(null)

  // Y tá chỉ được nhập 3 trường này
  const [procedureNotes, setProcedureNotes] = useState("")
  const [resultSummary, setResultSummary] = useState("")
  const [attachment, setAttachment] = useState("")

  useEffect(() => {
    if (!open || !recordId) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const d = await getDermatology(recordId)
        if (!d) {
          setError("Không tìm thấy hồ sơ Da liễu cho bản ghi này.")
          setDerm(null)
          return
        }
        setDerm(d)
        setProcedureNotes(d.procedureNotes ?? "")
        setResultSummary(d.resultSummary ?? "")
        setAttachment(d.attachment ?? "")
      } catch (e: any) {
        setError(e?.message ?? "Không thể tải dữ liệu Da liễu.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, recordId])

  const reset = () => {
    setError(null)
    setDerm(null)
    setProcedureNotes("")
    setResultSummary("")
    setAttachment("")
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  const handleSave = async () => {
    if (!derm) {
      setError("Không có dữ liệu Da liễu để lưu.")
      return
    }
    if (!resultSummary.trim()) {
      setError("Vui lòng nhập 'Kết quả da liễu'.")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const performerId = getCurrentUserId()

      // LƯU Ý: gửi **recordId** (ID của MedicalRecord), KHÔNG gửi dermRecordId
      await updateDermatology(derm.recordId, {
        // 2 trường bác sĩ yêu cầu – giữ nguyên, không cho sửa
        requestedProcedure: derm.requestedProcedure ?? undefined,
        bodyArea: derm.bodyArea ?? undefined,

        // 3 trường y tá nhập
        procedureNotes: procedureNotes.trim() || null,
        resultSummary: resultSummary.trim(),
        attachment: attachment.trim() || null,

        // người thực hiện
        performedByUserId: performerId ?? undefined,
      })

      onSaved?.()
      handleClose()
    } catch (e: any) {
      setError(e?.message ?? "Không thể lưu kết quả Da liễu.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose()
        else onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Điền kết quả khám da liễu</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải dữ liệu Da liễu...
          </div>
        ) : !derm ? (
          <p className="text-sm text-muted-foreground">
            Không có yêu cầu khám da liễu cho hồ sơ này.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Thủ thuật yêu cầu – chỉ đọc */}
            <div className="space-y-1">
              <Label>Thủ thuật yêu cầu (bác sĩ gửi)</Label>
              <Input value={derm.requestedProcedure} disabled />
            </div>

            {/* Vùng yêu cầu – chỉ đọc */}
            <div className="space-y-1">
              <Label>Vùng yêu cầu (bác sĩ gửi)</Label>
              <Input value={derm.bodyArea ?? ""} disabled />
            </div>

            {/* Y tá điền thêm thông tin thực hiện */}
            <div className="space-y-1">
              <Label>Ghi chú thủ thuật (y tá thực hiện)</Label>
              <Textarea
                value={procedureNotes}
                onChange={(e) => setProcedureNotes(e.target.value)}
                rows={2}
                placeholder="Các bước thực hiện, thuốc sử dụng, phản ứng da, v.v..."
              />
            </div>

            <div className="space-y-1">
              <Label>Kết quả da liễu</Label>
              <Textarea
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                rows={3}
                placeholder="Mô tả tình trạng sau thủ thuật, đánh giá đáp ứng..."
              />
            </div>

            <div className="space-y-1">
              <Label>Đính kèm (link ảnh / tài liệu)</Label>
              <Input
                value={attachment}
                onChange={(e) => setAttachment(e.target.value)}
                placeholder="https://... (tùy chọn)"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
          <Button onClick={handleSave} disabled={saving || !derm}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu kết quả"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
