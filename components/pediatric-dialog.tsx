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
import { Loader2, Save } from "lucide-react"
import {
  getPediatric,
  createPediatric,
  updatePediatric,
} from "@/lib/services/pediatric-service"
import type { ReadPediatricRecordDto } from "@/lib/types/specialties"

// chặn nhập -, +, e, E trên input number
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

const isFormFilled = (data: ReadPediatricRecordDto) =>
  !!(
    data.weightKg &&
    data.heightCm &&
    data.heartRate &&
    data.temperatureC
  )

export function PediatricDialog({
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
  const [form, setForm] = useState<ReadPediatricRecordDto>({ recordId })

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
    getPediatric(recordId)
      .then((data) => {
        if (!alive) return
        setForm(data ?? { recordId })
      })
      .catch((e: any) =>
        showToast(
          "destructive",
          "Lỗi tải dữ liệu",
          e?.message ?? "Không tải được hồ sơ Nhi khoa."
        )
      )
      .finally(() => setLoading(false))
    return () => {
      alive = false
    }
  }, [open, recordId])

  const set = <K extends keyof ReadPediatricRecordDto>(
    k: K,
    v: ReadPediatricRecordDto[K]
  ) => setForm((prev) => ({ ...prev, [k]: v }))

  const save = async () => {
    if (!isFormFilled(form)) {
      showToast(
        "destructive",
        "Thiếu dữ liệu",
        "Vui lòng nhập đầy đủ Cân nặng, Chiều cao, Nhịp tim và Nhiệt độ."
      )
      return
    }

    try {
      setSaving(true)
      const existed = await getPediatric(recordId)
      const payload = {
        recordId,
        weightKg: form.weightKg ?? null,
        heightCm: form.heightCm ?? null,
        heartRate: form.heartRate ?? null,
        temperatureC: form.temperatureC ?? null,
      }
      if (existed) {
        await updatePediatric(recordId, payload)
        showToast("default", "Cập nhật thành công", "Đã lưu khám Nhi khoa.")
      } else {
        await createPediatric(payload)
        showToast("default", "Thêm thành công", "Đã tạo hồ sơ Nhi khoa.")
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      showToast(
        "destructive",
        "Lỗi khi lưu",
        e?.message ?? "Không thể lưu hồ sơ Nhi khoa."
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
            <DialogTitle>Khám Nhi khoa</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cân nặng (kg)</Label>
                <Input
                  value={form.weightKg ?? ""}
                  onChange={(e) =>
                    set("weightKg", toPositiveOrNull(e.target.value))
                  }
                  type="number"
                  step="0.01"
                  min={0.01}
                  onKeyDown={blockInvalidNumberKeys}
                  placeholder="VD: 12.4"
                />
              </div>
              <div className="space-y-1">
                <Label>Chiều cao (cm)</Label>
                <Input
                  value={form.heightCm ?? ""}
                  onChange={(e) =>
                    set("heightCm", toPositiveOrNull(e.target.value))
                  }
                  type="number"
                  step="0.1"
                  min={0.1}
                  onKeyDown={blockInvalidNumberKeys}
                  placeholder="VD: 95.5"
                />
              </div>
              <div className="space-y-1">
                <Label>Nhịp tim (lần/phút, bpm)</Label>
                <Input
                  value={form.heartRate ?? ""}
                  onChange={(e) =>
                    set("heartRate", toPositiveOrNull(e.target.value))
                  }
                  type="number"
                  min={1}
                  onKeyDown={blockInvalidNumberKeys}
                  placeholder="VD: 90"
                />
              </div>
              <div className="space-y-1">
                <Label>Nhiệt độ (°C)</Label>
                <Input
                  value={form.temperatureC ?? ""}
                  onChange={(e) =>
                    set("temperatureC", toPositiveOrNull(e.target.value))
                  }
                  type="number"
                  step="0.1"
                  min={1}
                  onKeyDown={blockInvalidNumberKeys}
                  placeholder="VD: 37.5"
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
    desc?: string
  ) {
    setToastVariant(variant)
    setToastTitle(title)
    setToastDesc(desc ?? "")
    setToastOpen(true)
    setTimeout(() => setToastOpen(false), 3000)
  }
}
