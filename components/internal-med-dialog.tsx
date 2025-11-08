"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from "lucide-react"
import { getInternalMed, createInternalMed, updateInternalMed } from "@/lib/services/internal-med-service"
import type { ReadInternalMedRecordDto } from "@/lib/types/specialties"

// Radix Toast (dùng Provider ở page)
import { Toast, ToastTitle, ToastDescription } from "@/components/ui/toast"

export function InternalMedDialog({
  open, onOpenChange, recordId, onSaved
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
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default")
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
      .catch((e: any) => showToast("destructive", "Lỗi tải dữ liệu", e?.message ?? "Không tải được hồ sơ Nội khoa."))
      .finally(() => setLoading(false))
    return () => { alive = false }
  }, [open, recordId])

  const save = async () => {
    try {
      setSaving(true)
      const existed = await getInternalMed(recordId)
      if (existed) {
        await updateInternalMed(recordId, {
          bloodPressure: form.bloodPressure ?? null,
          heartRate: form.heartRate ?? null,
          bloodSugar: form.bloodSugar ?? null,
          notes: form.notes ?? null,
        })
        showToast("default", "Cập nhật thành công", "Đã lưu khám Nội khoa.")
      } else {
        await createInternalMed({
          recordId,
          bloodPressure: form.bloodPressure ?? null,
          heartRate: form.heartRate ?? null,
          bloodSugar: form.bloodSugar ?? null,
          notes: form.notes ?? null,
        })
        showToast("default", "Thêm thành công", "Đã tạo hồ sơ Nội khoa.")
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      showToast("destructive", "Lỗi khi lưu", e?.message ?? "Không thể lưu hồ sơ Nội khoa.")
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof ReadInternalMedRecordDto>(k: K, v: ReadInternalMedRecordDto[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Khám Nội khoa</DialogTitle></DialogHeader>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label>Huyết áp</Label>
                <Input
                  value={form.bloodPressure ?? ""}
                  onChange={e => set("bloodPressure", e.target.value ? Number(e.target.value) : null)}
                  placeholder="mmHg"
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <Label>Nhịp tim</Label>
                <Input
                  value={form.heartRate ?? ""}
                  onChange={e => set("heartRate", e.target.value ? Number(e.target.value) : null)}
                  placeholder="bpm"
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <Label>Đường huyết</Label>
                <Input
                  value={form.bloodSugar ?? ""}
                  onChange={e => set("bloodSugar", e.target.value ? Number(e.target.value) : null)}
                  placeholder="mmol/L"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea
                  value={form.notes ?? ""}
                  onChange={e => set("notes", e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button onClick={save} disabled={saving || loading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast instance */}
      <Toast open={toastOpen} onOpenChange={setToastOpen} variant={toastVariant}>
        <ToastTitle>{toastTitle}</ToastTitle>
        {toastDesc ? <ToastDescription>{toastDesc}</ToastDescription> : null}
      </Toast>
    </>
  )

  function showToast(variant: "default" | "destructive", title: string, desc?: string) {
    setToastVariant(variant)
    setToastTitle(title)
    setToastDesc(desc ?? "")
    setToastOpen(false)
    setTimeout(() => setToastOpen(true), 10)
  }
}
