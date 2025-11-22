// components/test-result-dialog.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  getTestResultsByRecord,
  updateTestResult,
} from "@/lib/services/test-results-service"
import type { ReadTestResultDto } from "@/lib/types/test-results"
import { Save, Loader2, ChevronsUpDown, Check } from "lucide-react"

// Radix Toast (chỉ dùng Root/Title/Description—KHÔNG tạo Provider ở đây)
import { Toast, ToastTitle, ToastDescription } from "@/components/ui/toast"

// Combobox
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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

  // CHỈ lấy các xét nghiệm bác sĩ đã gửi cho hồ sơ này
  const [results, setResults] = useState<ReadTestResultDto[]>([])

  // chọn xét nghiệm theo testResultId
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null)

  const [form, setForm] = useState<RowState>({
    resultValue: "",
    unit: "",
    attachment: "",
    resultDate: toLocalDateTimeInputValue(new Date()),
    notes: "",
  })

  // toast state (Radix) – KHÔNG tạo Provider ở đây
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">(
    "default"
  )
  const [toastTitle, setToastTitle] = useState("")
  const [toastDesc, setToastDesc] = useState("")

  const sanitizeValue = (value: string | null | undefined) => {
    if (!value) return ""
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return ""
    if (trimmed.includes("pending") || trimmed.includes("chờ")) return ""
    return value
  }

  const selectedResult = useMemo(
    () => results.find((r) => r.testResultId === selectedResultId) ?? null,
    [results, selectedResultId]
  )

  useEffect(() => {
    if (!open || !recordId) return

    let mounted = true

    async function load() {
      try {
        setLoadingData(true)
        // CHỈ load testResults cho recordId
        const r = await getTestResultsByRecord(recordId)
        if (!mounted) return

        setResults(r)

        if (r.length > 0) {
          const first = r[0]
          setSelectedResultId(first.testResultId)
          setForm({
            resultValue: sanitizeValue(first.resultValue),
            unit: first.unit ?? "",
            attachment: first.attachment ?? "",
            resultDate: first.resultDate
              ? toLocalDateTimeInputValue(new Date(first.resultDate))
              : toLocalDateTimeInputValue(new Date()),
            notes: first.notes ?? "",
          })
        } else {
          // không có xét nghiệm nào
          setSelectedResultId(null)
          setForm({
            resultValue: "",
            unit: "",
            attachment: "",
            resultDate: toLocalDateTimeInputValue(new Date()),
            notes: "",
          })
        }
      } catch (e: any) {
        showToast(
          "destructive",
          "Lỗi tải dữ liệu",
          e?.message ?? "Không tải được danh sách xét nghiệm."
        )
      } finally {
        setLoadingData(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordId])

  const onPickResult = (id: number) => {
    setSelectedResultId(id)
    const ex = results.find((r) => r.testResultId === id) ?? null
    setForm({
      resultValue: sanitizeValue(ex?.resultValue),
      unit: ex?.unit ?? "",
      attachment: ex?.attachment ?? "",
      resultDate: ex?.resultDate
        ? toLocalDateTimeInputValue(new Date(ex.resultDate))
        : toLocalDateTimeInputValue(new Date()),
      notes: ex?.notes ?? "",
    })
    setTypePopoverOpen(false)
  }

  const handleChange = (k: keyof RowState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!selectedResultId) {
      return showToast(
        "destructive",
        "Không có xét nghiệm",
        "Bác sĩ chưa gửi yêu cầu xét nghiệm nào cho hồ sơ này."
      )
    }

    if (!form.resultValue.trim()) {
      return showToast(
        "destructive",
        "Thiếu dữ liệu",
        "Giá trị kết quả không được rỗng."
      )
    }

    try {
      setLoading(true)

      await updateTestResult(selectedResultId, {
        resultValue: form.resultValue.trim(),
        unit: form.unit?.trim() || null,
        attachment: form.attachment?.trim() || null,
        resultDate: form.resultDate
          ? new Date(form.resultDate).toISOString()
          : null,
        notes: form.notes?.trim() || null,
      })

      showToast(
        "default",
        "Cập nhật thành công",
        "Kết quả xét nghiệm đã được cập nhật."
      )

      onOpenChange(false)
    } catch (e: any) {
      showToast(
        "destructive",
        "Lỗi khi lưu",
        e?.message ?? "Không thể lưu kết quả."
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedLabel = useMemo(() => {
    if (!selectedResultId) return ""
    return (
      results.find((r) => r.testResultId === selectedResultId)?.testName ?? ""
    )
  }, [selectedResultId, results])

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
          ) : results.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Bác sĩ chưa gửi yêu cầu xét nghiệm nào cho hồ sơ này. Vui lòng
              liên hệ bác sĩ nếu cần bổ sung xét nghiệm.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Combobox chọn xét nghiệm (CHỈ trong các test bác sĩ đã gửi) */}
              <div className="space-y-1">
                <Label>Loại xét nghiệm</Label>
                <Popover
                  open={typePopoverOpen}
                  onOpenChange={setTypePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={typePopoverOpen}
                      className="w-full justify-between"
                    >
                      {selectedLabel || "Chọn loại xét nghiệm"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-h-64 overflow-auto">
                    <Command>
                      <CommandInput placeholder="Tìm loại xét nghiệm..." />
                      <CommandEmpty>Không tìm thấy.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {results.map((r) => {
                            const active = r.testResultId === selectedResultId
                            return (
                              <CommandItem
                                key={r.testResultId}
                                value={r.testName}
                                onSelect={() => onPickResult(r.testResultId)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    active ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {r.testName}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedResult && (
                  <p className="text-xs text-muted-foreground">
                    Mã xét nghiệm: #{selectedResult.testResultId}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Giá trị kết quả *</Label>
                  <Input
                    value={form.resultValue}
                    onChange={(e) =>
                      handleChange("resultValue", e.target.value)
                    }
                    placeholder="VD: 145/90 (mmHg)"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Đơn vị</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    placeholder="mmHg / mmol/L / °C ..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Thời điểm kết quả</Label>
                <Input
                  type="datetime-local"
                  value={form.resultDate}
                  onChange={(e) => handleChange("resultDate", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Đính kèm (URL)</Label>
                <Input
                  value={form.attachment}
                  onChange={(e) =>
                    handleChange("attachment", e.target.value)
                  }
                  placeholder="https://... (tùy chọn)"
                />
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Ghi chú thêm (nếu có)"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || loadingData || results.length === 0}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? "Đang lưu..." : "Lưu kết quả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast instance (Radix) – dùng Provider ở page */}
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        variant={toastVariant}
      >
        <ToastTitle>{toastTitle}</ToastTitle>
        {toastDesc ? <ToastDescription>{toastDesc}</ToastDescription> : null}
      </Toast>
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
