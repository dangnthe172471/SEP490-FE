"use client"

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react"
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
import { Loader2, Save } from "lucide-react"
import {
  getInternalMed,
  createInternalMed,
  updateInternalMed,
} from "@/lib/services/internal-med-service"
import type { ReadInternalMedRecordDto } from "@/lib/types/specialties"

const blockInvalidNumberKeys = (e: KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault()
  }
}

const toPositiveOrNull = (raw: string): number | null => {
  if (!raw) return null
  const num = Number(raw)
  if (!Number.isFinite(num) || num <= 0) return null
  return num
}

const isFormFilled = (data: ReadInternalMedRecordDto) =>
  !!(
    data.bloodPressure &&
    data.heartRate &&
    data.bloodSugar &&
    data.notes &&
    data.notes.toString().trim()
  )

export function InternalMedDialog({
  open,
  onOpenChange,
  recordId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordId: number
  onSaved?: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ReadInternalMedRecordDto>({ recordId })

  // toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] =
    useState<"default" | "destructive">("default")
  const [toastTitle, setToastTitle] = useState("")
  const [toastDesc, setToastDesc] = useState("")

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    getInternalMed(recordId)
      .then((data) => {
        if (!alive) return
        setForm(data ?? { recordId })
      })
      .catch((e: any) =>
        showToast(
          "destructive",
          "Lỗi tải dữ liệu",
          e?.message ?? "Không tải được hồ sơ Nội khoa.",
        ),
      )
      .finally(() => setLoading(false))
    return () => {
      alive = false
    }
  }, [open, recordId])

  const set = <K extends keyof ReadInternalMedRecordDto>(
    k: K,
    v: ReadInternalMedRecordDto[K],
  ) => setForm((prev) => ({ ...prev, [k]: v }))

  const save = async () => {
    if (!isFormFilled(form)) {
      showToast(
        "destructive",
        "Thiếu dữ liệu",
        "Vui lòng nhập đầy đủ Huyết áp, Nhịp tim, Đường huyết và Ghi chú.",
      )
      return
    }

    try {
      setSaving(true)
      const existed = await getInternalMed(recordId)
      const payload = {
        recordId,
        bloodPressure: form.bloodPressure ?? null,
        heartRate: form.heartRate ?? null,
        bloodSugar: form.bloodSugar ?? null,
        notes: form.notes?.toString().trim() ?? null,
      }
      if (existed) {
        await updateInternalMed(recordId, payload)
        showToast("default", "Cập nhật thành công", "Đã lưu khám Nội khoa.")
      } else {
        await createInternalMed(payload)
        showToast("default", "Thêm thành công", "Đã tạo hồ sơ Nội khoa.")
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      showToast(
        "destructive",
        "Lỗi khi lưu",
        e?.message ?? "Không thể lưu hồ sơ Nội khoa.",
      )
    } finally {
      setSaving(false)
    }
  }

  const canSave = !saving && !loading && isFormFilled(form)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Khám Nội khoa</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label>Huyết áp (mmHg)</Label>
                <Input
                  value={form.bloodPressure ?? ""}
                  onChange={(e) =>
                    set("bloodPressure", toPositiveOrNull(e.target.value))
                  }
                  placeholder="VD: 120"
                  type="number"
                  min={1}
                  onKeyDown={blockInvalidNumberKeys}
                />
              </div>
              <div className="space-y-1">
                <Label>Nhịp tim (lần/phút, bpm)</Label>
                <Input
                  value={form.heartRate ?? ""}
                  onChange={(e) =>
                    set("heartRate", toPositiveOrNull(e.target.value))
                  }
                  placeholder="VD: 80"
                  type="number"
                  min={1}
                  onKeyDown={blockInvalidNumberKeys}
                />
              </div>
              <div className="space-y-1">
                <Label>Đường huyết (mmol/L)</Label>
                <Input
                  value={form.bloodSugar ?? ""}
                  onChange={(e) =>
                    set("bloodSugar", toPositiveOrNull(e.target.value))
                  }
                  placeholder="VD: 5.6"
                  type="number"
                  step="0.01"
                  min={0.01}
                  onKeyDown={blockInvalidNumberKeys}
                />
              </div>
              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea
                  className="resize-y whitespace-pre-wrap break-words"
                  style={{ overflowWrap: "anywhere" }}
                  wrap="soft"
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Ví dụ: bệnh nhân hơi mệt, cần theo dõi thêm..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button onClick={save} disabled={!canSave}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toastOpen && (
        <div
          className={`fixed bottom-6 right-6 z-[210] max-w-sm rounded-md px-4 py-3 shadow-md flex flex-col gap-1 ${
            toastVariant === "destructive"
              ? "border border-red-200 bg-red-50 text-red-900"
              : "border border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span className="font-semibold">{toastTitle}</span>
          {toastDesc && <span className="text-sm">{toastDesc}</span>}
        </div>
      )}
    </>
  )

  function showToast(
    variant: "default" | "destructive",
    title: string,
    desc?: string,
  ) {
    setToastVariant(variant)
    setToastTitle(title)
    setToastDesc(desc ?? "")
    setToastOpen(true)
    setTimeout(() => setToastOpen(false), 3000)
  }
}
