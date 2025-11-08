"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { getPediatric, createPediatric, updatePediatric } from "@/lib/services/pediatric-service"
import type { ReadPediatricRecordDto } from "@/lib/types/specialties"

// Radix Toast (Provider đã ở page)
import { Toast, ToastTitle, ToastDescription } from "@/components/ui/toast"

export function PediatricDialog({
  open, onOpenChange, recordId, onSaved
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
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default")
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
      .catch((e: any) => showToast("destructive", "Lỗi tải dữ liệu", e?.message ?? "Không tải được hồ sơ Nhi khoa."))
      .finally(() => setLoading(false))
    return () => { alive = false }
  }, [open, recordId])

  const save = async () => {
    try {
      setSaving(true)
      const existed = await getPediatric(recordId)
      if (existed) {
        await updatePediatric(recordId, {
          weightKg: form.weightKg ?? null,
          heightCm: form.heightCm ?? null,
          heartRate: form.heartRate ?? null,
          temperatureC: form.temperatureC ?? null,
        })
        showToast("default", "Cập nhật thành công", "Đã lưu khám Nhi khoa.")
      } else {
        await createPediatric({
          recordId,
          weightKg: form.weightKg ?? null,
          heightCm: form.heightCm ?? null,
          heartRate: form.heartRate ?? null,
          temperatureC: form.temperatureC ?? null,
        })
        showToast("default", "Thêm thành công", "Đã tạo hồ sơ Nhi khoa.")
      }
      onOpenChange(false)
      onSaved?.()
    } catch (e: any) {
      showToast("destructive", "Lỗi khi lưu", e?.message ?? "Không thể lưu hồ sơ Nhi khoa.")
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof ReadPediatricRecordDto>(k: K, v: ReadPediatricRecordDto[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Khám Nhi khoa</DialogTitle></DialogHeader>
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
                  onChange={e => set("weightKg", e.target.value ? Number(e.target.value) : null)}
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label>Chiều cao (cm)</Label>
                <Input
                  value={form.heightCm ?? ""}
                  onChange={e => set("heightCm", e.target.value ? Number(e.target.value) : null)}
                  type="number"
                  step="0.1"
                />
              </div>
              <div className="space-y-1">
                <Label>Nhịp tim</Label>
                <Input
                  value={form.heartRate ?? ""}
                  onChange={e => set("heartRate", e.target.value ? Number(e.target.value) : null)}
                  type="number"
                />
              </div>
              <div className="space-y-1">
                <Label>Nhiệt độ (°C)</Label>
                <Input
                  value={form.temperatureC ?? ""}
                  onChange={e => set("temperatureC", e.target.value ? Number(e.target.value) : null)}
                  type="number"
                  step="0.1"
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
