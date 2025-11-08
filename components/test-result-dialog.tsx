// components/test-result-dialog.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  createTestResult,
  getTestResultsByRecord,
  getTestTypes,
  updateTestResult,
} from "@/lib/services/test-results-service"
import type { ReadTestResultDto, TestTypeLite } from "@/lib/types/test-results"
import { Save, Loader2, ChevronsUpDown, Check } from "lucide-react"

// Radix Toast (chỉ dùng Root/Title/Description—KHÔNG tạo Provider ở đây)
import { Toast, ToastTitle, ToastDescription } from "@/components/ui/toast"

// Combobox
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

type RowState = {
  resultValue: string
  unit: string
  attachment: string
  resultDate: string // yyyy-MM-ddTHH:mm
  notes: string
}

export function TestResultDialog({
  open,
  onOpenChange,
  recordId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordId: number
}) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [types, setTypes] = useState<TestTypeLite[]>([])
  const [results, setResults] = useState<ReadTestResultDto[]>([])

  const [typePopoverOpen, setTypePopoverOpen] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)

  const [form, setForm] = useState<RowState>({
    resultValue: "",
    unit: "",
    attachment: "",
    resultDate: toLocalDateTimeInputValue(new Date()),
    notes: "",
  })

  // toast state (Radix) – KHÔNG tạo Provider ở đây
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default")
  const [toastTitle, setToastTitle] = useState("")
  const [toastDesc, setToastDesc] = useState("")

  const existingByType = useMemo(() => {
    const m = new Map<number, ReadTestResultDto>()
    results.forEach(r => m.set(r.testTypeId, r))
    return m
  }, [results])

  const sanitizeValue = (value: string | null | undefined) => {
    if (!value) return ""
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return ""
    if (trimmed.includes("pending") || trimmed.includes("chờ")) return ""
    return value
  }

  useEffect(() => {
    if (!open) return
    let mounted = true
    async function load() {
      try {
        setLoadingData(true)
        const [t, r] = await Promise.all([getTestTypes(), getTestResultsByRecord(recordId)])
        if (!mounted) return
        setTypes(t)
        setResults(r)

        const firstSelected = (r[0]?.testTypeId ?? t[0]?.testTypeId) ?? null
        setSelectedTypeId(firstSelected)

        const exist = r.find(x => x.testTypeId === firstSelected)
        setForm({
          resultValue: sanitizeValue(exist?.resultValue),
          unit: exist?.unit ?? "",
          attachment: exist?.attachment ?? "",
          resultDate: exist?.resultDate ? toLocalDateTimeInputValue(new Date(exist.resultDate)) : toLocalDateTimeInputValue(new Date()),
          notes: exist?.notes ?? "",
        })
      } catch (e: any) {
        showToast("destructive", "Lỗi tải dữ liệu", e?.message ?? "Không tải được dữ liệu.")
      } finally {
        setLoadingData(false)
      }
    }
    load()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordId])

  const onPickType = (id: number) => {
    setSelectedTypeId(id)
    const ex = existingByType.get(id)
    setForm({
      resultValue: sanitizeValue(ex?.resultValue),
      unit: ex?.unit ?? "",
      attachment: ex?.attachment ?? "",
      resultDate: ex?.resultDate ? toLocalDateTimeInputValue(new Date(ex.resultDate)) : toLocalDateTimeInputValue(new Date()),
      notes: ex?.notes ?? "",
    })
    setTypePopoverOpen(false)
  }

  const handleChange = (k: keyof RowState, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!selectedTypeId) return showToast("destructive", "Thiếu loại xét nghiệm", "Hãy chọn loại xét nghiệm.")
    if (!form.resultValue.trim()) return showToast("destructive", "Thiếu dữ liệu", "Giá trị kết quả không được rỗng.")

    try {
      setLoading(true)
      const exist = existingByType.get(selectedTypeId)
      if (exist) {
        await updateTestResult(exist.testResultId, {
          resultValue: form.resultValue.trim(),
          unit: form.unit?.trim() || null,
          attachment: form.attachment?.trim() || null,
          resultDate: form.resultDate ? new Date(form.resultDate).toISOString() : null,
          notes: form.notes?.trim() || null,
        })
        showToast("default", "Cập nhật thành công", "Kết quả xét nghiệm đã được cập nhật.")
      } else {
        await createTestResult({
          recordId,
          testTypeId: selectedTypeId,
          resultValue: form.resultValue.trim(),
          unit: form.unit?.trim() || null,
          attachment: form.attachment?.trim() || null,
          resultDate: form.resultDate ? new Date(form.resultDate).toISOString() : undefined,
          notes: form.notes?.trim() || null,
        })
        showToast("default", "Thêm thành công", "Kết quả xét nghiệm đã được tạo.")
      }
      onOpenChange(false)
    } catch (e: any) {
      showToast("destructive", "Lỗi khi lưu", e?.message ?? "Không thể lưu kết quả.")
    } finally {
      setLoading(false)
    }
  }

  const selectedLabel = useMemo(() => {
    if (!selectedTypeId) return ""
    return types.find(t => t.testTypeId === selectedTypeId)?.testName ?? ""
  }, [selectedTypeId, types])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Điền kết quả xét nghiệm</DialogTitle>
          </DialogHeader>

          {loadingData ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Combobox có tìm kiếm */}
              <div className="space-y-1">
                <Label>Loại xét nghiệm</Label>
                <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={typePopoverOpen} className="w-full justify-between">
                      {selectedLabel || "Chọn loại xét nghiệm"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Tìm loại xét nghiệm..." />
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {types.map(t => {
                            const active = t.testTypeId === selectedTypeId
                            return (
                              <CommandItem key={t.testTypeId} value={t.testName} onSelect={() => onPickType(t.testTypeId)}>
                                <Check className={cn("mr-2 h-4 w-4", active ? "opacity-100" : "opacity-0")} />
                                {t.testName}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Giá trị kết quả *</Label>
                  <Input value={form.resultValue} onChange={(e) => handleChange("resultValue", e.target.value)} placeholder="VD: 145/90 (mmHg)" />
                </div>
                <div className="space-y-1">
                  <Label>Đơn vị</Label>
                  <Input value={form.unit} onChange={(e) => handleChange("unit", e.target.value)} placeholder="mmHg / mmol/L / °C ..." />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Thời điểm kết quả</Label>
                <Input type="datetime-local" value={form.resultDate} onChange={(e) => handleChange("resultDate", e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Đính kèm (URL)</Label>
                <Input value={form.attachment} onChange={(e) => handleChange("attachment", e.target.value)} placeholder="https://... (tùy chọn)" />
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Ghi chú thêm (nếu có)" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button onClick={handleSave} disabled={loading || loadingData}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {loading ? "Đang lưu..." : "Lưu kết quả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast instance (Radix) – dùng Provider ở page */}
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

function toLocalDateTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}
