"use client"

import { useEffect, useMemo, useState, ChangeEvent } from "react"
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

import { UnitSelect } from "@/components/unit-select"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn"

function buildAttachmentUrl(path: string): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

type RowState = {
  resultValue: string
  unit: string
  attachment: string
  notes: string
}

const sanitizeValue = (value: string | null | undefined) => {
  if (!value) return ""
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ""
  if (trimmed.includes("pending") || trimmed.includes("chờ")) return ""
  return value
}


function stripUnitFromValue(value: string, unit: string): string {
  if (!value || !unit) return value
  const v = value.trim()
  const u = unit.trim()
  if (!u) return value

  // "5.6 %"
  if (v.endsWith(` ${u}`)) return v.slice(0, -(u.length + 1)).trim()

  if (v.endsWith(u)) return v.slice(0, -u.length).trim()

  return value
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

  // upload sẽ chạy khi bấm Lưu
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("")
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

  // CHỈ lấy các xét nghiệm bác sĩ đã gửi cho hồ sơ này
  const [results, setResults] = useState<ReadTestResultDto[]>([])

  // chọn xét nghiệm theo testResultId
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null)

  const [form, setForm] = useState<RowState>({
    resultValue: "",
    unit: "",
    attachment: "",
    notes: "",
  })

  // toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">(
    "default"
  )
  const [toastTitle, setToastTitle] = useState("")
  const [toastDesc, setToastDesc] = useState("")

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
        const r = await getTestResultsByRecord(recordId)
        if (!mounted) return

        setResults(r)

        // reset file tạm & preview khi mở dialog
        setPendingFile(null)
        setLocalPreviewUrl("")

        if (r.length > 0) {
          const first = r[0]
          setSelectedResultId(first.testResultId)

          const sanitized = sanitizeValue(first.resultValue)
          let unit = first.unit ?? ""
          let numeric = sanitized

          //nếu DB đã bị dính unit trong value, strip ra
          if (sanitized && unit) numeric = stripUnitFromValue(sanitized, unit)

          // fallback: nếu không có unit thì thử tách từ value
          if (sanitized && !unit) {
            const parts = sanitized.split(" ")
            if (parts.length > 1) {
              unit = parts[parts.length - 1]
              numeric = parts.slice(0, parts.length - 1).join(" ")
            }
          }

          setForm({
            resultValue: numeric,
            unit,
            attachment: first.attachment ?? "",
            notes: first.notes ?? "",
          })
        } else {
          setSelectedResultId(null)
          setForm({
            resultValue: "",
            unit: "",
            attachment: "",
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
    
  }, [open, recordId])

  
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const onPickResult = (id: number) => {
    setSelectedResultId(id)
    const ex = results.find((r) => r.testResultId === id) ?? null

    const sanitized = sanitizeValue(ex?.resultValue)
    let unit = ex?.unit ?? ""
    let numeric = sanitized

    // ✅ FIX: nếu DB đã bị dính unit trong value, strip ra
    if (sanitized && unit) numeric = stripUnitFromValue(sanitized, unit)

    // fallback: nếu không có unit thì thử tách từ value
    if (sanitized && !unit) {
      const parts = sanitized.split(" ")
      if (parts.length > 1) {
        unit = parts[parts.length - 1]
        numeric = parts.slice(0, parts.length - 1).join(" ")
      }
    }

    // đổi xét nghiệm -> reset file tạm
    setPendingFile(null)
    setLocalPreviewUrl("")

    setForm({
      resultValue: numeric,
      unit,
      attachment: ex?.attachment ?? "",
      notes: ex?.notes ?? "",
    })
    setTypePopoverOpen(false)
  }

  const handleChange = (k: keyof RowState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  // helper: strip theo unit hiện tại để tránh "5.6 g/dL" dính vào ô giá trị
  const stripByCurrentUnit = (value: string) => {
    const u = (form.unit ?? "").trim()
    return u ? stripUnitFromValue(value, u) : value
  }

  // chỉ dùng khi nhấn Lưu
  async function uploadAttachment(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || localStorage.getItem("token")
        : null

    const res = await fetch(`${API_BASE_URL}/api/uploads/attachments`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Upload file thất bại.")
    }

    const data = (await res.json()) as {
      relativePath?: string
      url?: string
    }

    return data.relativePath || data.url || ""
  }

  // chỉ đổi file tạm + preview, KHÔNG gọi API
  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingFile(file)
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

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

      let attachmentPath = form.attachment

      // nếu có chọn file mới thì lúc này mới upload
      if (pendingFile) {
        setUploadingAttachment(true)
        attachmentPath = await uploadAttachment(pendingFile)
        setForm((prev) => ({ ...prev, attachment: attachmentPath }))
      }

      // ✅ FIX LƯU DB: resultValue chỉ lưu GIÁ TRỊ, unit lưu RIÊNG
      const unit = (form.unit ?? "").trim()
      let numeric = form.resultValue.trim()

      // nếu user lỡ nhập kèm unit -> strip để tránh lưu "5,6%" vào value
      if (unit) numeric = stripUnitFromValue(numeric, unit)

      // ✅ Thời điểm luôn lấy theo thời gian hiện tại khi bấm Lưu (local, có giây)
      const nowLocal = toLocalDateTimeInputValue(new Date())
      const normalizedResultDate = `${nowLocal}:00`

      await updateTestResult(selectedResultId, {
        resultValue: numeric,
        unit: unit || null,
        attachment: attachmentPath?.trim() || null,
        // ✅ luôn NOW, không cho user chọn
        resultDate: normalizedResultDate,
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
      setUploadingAttachment(false)
      setLoading(false)
    }
  }

  const selectedLabel = useMemo(() => {
    if (!selectedResultId) return ""
    return (
      results.find((r) => r.testResultId === selectedResultId)?.testName ?? ""
    )
  }, [selectedResultId, results])

  // ưu tiên preview blob nếu đang chọn file mới
  const previewUrl = pendingFile
    ? localPreviewUrl
    : form.attachment
    ? buildAttachmentUrl(form.attachment)
    : ""

  const canSave =
    !loading &&
    !loadingData &&
    results.length > 0 &&
    !!selectedResultId &&
    !!form.resultValue.trim()

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
                      className="w-full justify-between bg-slate-50 text-slate-900 hover:bg-slate-200 hover:text-slate-900 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-900"
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

                {/* {selectedResult && (
                  <p className="text-xs text-muted-foreground">
                    Mã xét nghiệm: #{selectedResult.testResultId}
                  </p>
                )} */}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Giá trị kết quả *</Label>
                  <Input
                    value={form.resultValue}
                    onChange={(e) =>
                      handleChange(
                        "resultValue",
                        stripByCurrentUnit(e.target.value)
                      )
                    }
                    placeholder="VD: 5.6 hoặc 145/90"
                  />
                </div>

                <UnitSelect
                  value={form.unit}
                  onChange={(v) => {
                    setForm((prev) => ({
                      ...prev,
                      unit: v,
                      // ✅ đổi unit -> strip lại value
                      resultValue: v
                        ? stripUnitFromValue(prev.resultValue, v)
                        : prev.resultValue,
                    }))
                  }}
                  placeholder="Chọn đơn vị"
                />
              </div>

              {/* ✅ ĐÃ ẨN trường thời điểm kết quả */}

              <div className="space-y-1">
                <Label>Đính kèm (chọn ảnh từ máy)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAttachmentChange}
                  disabled={loading}
                />
                {(uploadingAttachment || loading) && pendingFile && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Đang upload ảnh...
                  </p>
                )}

                {previewUrl && (
                  <div className="mt-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Xem trước (click để phóng to)
                    </Label>
                    <div className="flex items-center justify-center rounded-md border bg-slate-50 p-2">
                      <button
                        type="button"
                        onClick={() => setImagePreviewOpen(true)}
                        className="focus:outline-none"
                      >
                        <img
                          src={previewUrl}
                          alt="Ảnh đính kèm xét nghiệm"
                          className="max-h-40 w-auto rounded-md object-contain"
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea
                  className="resize-y whitespace-pre-wrap break-words"
                  style={{ overflowWrap: "anywhere" }}
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Ghi chú thêm (nếu có)"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="bg-slate-50 hover:bg-slate-100"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white"
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

      {/* Dialog xem ảnh */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-[70vw] max-h-[70vh] p-0 border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Ảnh đính kèm xét nghiệm</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex h-[70vh] w-full items-center justify-center">
              <img
                src={previewUrl}
                alt="Ảnh xét nghiệm"
                className="max-h-[66vh] max-w-[66vw] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
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
