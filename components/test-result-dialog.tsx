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

// Select đơn vị tách riêng
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
  resultValue: string // chỉ phần số / giá trị
  unit: string // đơn vị (mmHg, mmol/L,...)
  attachment: string
  resultDate: string // yyyy-MM-ddTHH:mm (local)
  notes: string
}

const sanitizeValue = (value: string | null | undefined) => {
  if (!value) return ""
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ""
  if (trimmed.includes("pending") || trimmed.includes("chờ")) return ""
  return value
}

// format Date -> chuỗi cho <input type="datetime-local"> (local time)
function toLocalDateTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

// chuyển chuỗi ngày giờ từ API -> chuỗi datetime-local (KHÔNG đổi timezone)
// API lưu kiểu 2025-12-11T08:29:00 => cắt còn 2025-12-11T08:29
function apiDateToInput(value?: string | null): string {
  if (!value) return toLocalDateTimeInputValue(new Date())
  return value.slice(0, 16) // yyyy-MM-ddTHH:mm
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
    resultDate: toLocalDateTimeInputValue(new Date()),
    notes: "",
  })

  // min cho datetime-local (không chọn quá khứ)
  const [minDateStr, setMinDateStr] = useState<string>(
    toLocalDateTimeInputValue(new Date())
  )

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

    // mỗi lần mở dialog, cập nhật min = thời điểm hiện tại
    const nowStr = toLocalDateTimeInputValue(new Date())
    setMinDateStr(nowStr)

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
          let numeric = sanitized
          let unit = first.unit ?? ""

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
            // dùng trực tiếp chuỗi local từ API (không đổi timezone)
            resultDate: first.resultDate ? apiDateToInput(first.resultDate) : nowStr,
            notes: first.notes ?? "",
          })
        } else {
          setSelectedResultId(null)
          setForm({
            resultValue: "",
            unit: "",
            attachment: "",
            resultDate: nowStr,
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

  // cleanup blob URL khi đổi file / unmount
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const onPickResult = (id: number) => {
    setSelectedResultId(id)
    const ex = results.find((r) => r.testResultId === id) ?? null

    const sanitized = sanitizeValue(ex?.resultValue)
    let numeric = sanitized
    let unit = ex?.unit ?? ""

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
      resultDate: ex?.resultDate
        ? apiDateToInput(ex.resultDate)
        : toLocalDateTimeInputValue(new Date()),
      notes: ex?.notes ?? "",
    })
    setTypePopoverOpen(false)
  }

  const handleChange = (k: keyof RowState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

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
      headers: token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : undefined,
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

  const isResultDateInPast = (value: string) => {
    if (!value) return true
    const picked = new Date(value) // interpret local
    const now = new Date()

    // so sánh theo phút, bỏ giây & milli-giây
    picked.setSeconds(0, 0)
    now.setSeconds(0, 0)

    return picked.getTime() < now.getTime()
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

    if (!form.resultDate) {
      return showToast(
        "destructive",
        "Thiếu thời điểm",
        "Vui lòng chọn Thời điểm kết quả."
      )
    }

    if (isResultDateInPast(form.resultDate)) {
      return showToast(
        "destructive",
        "Thời điểm không hợp lệ",
        "Không được chọn thời điểm kết quả trong quá khứ."
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

      const numeric = form.resultValue.trim()
      const unit = (form.unit ?? "").trim()
      const combined = unit ? `${numeric} ${unit}` : numeric

      // chuẩn hoá: thêm giây nếu thiếu (yyyy-MM-ddTHH:mm -> yyyy-MM-ddTHH:mm:ss)
      const normalizedResultDate =
        form.resultDate.length === 16
          ? `${form.resultDate}:00`
          : form.resultDate

      await updateTestResult(selectedResultId, {
        resultValue: combined,
        unit: unit || null,
        attachment: attachmentPath?.trim() || null,
        // GỬI CHUỖI LOCAL, KHÔNG toISOString (không lệch UTC nữa)
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
    !!form.resultValue.trim() &&
    !!form.resultDate &&
    !isResultDateInPast(form.resultDate)

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
                      className="w-full justify-between bg-slate-50 hover:bg-slate-100"
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
                    placeholder="VD: 5.6 hoặc 145/90"
                  />
                </div>
                {/* Dropdown đơn vị dùng UnitSelect */}
                <UnitSelect
                  value={form.unit}
                  onChange={(v) => handleChange("unit", v)}
                  placeholder="Chọn đơn vị"
                />
              </div>

              <div className="space-y-1">
                <Label>Thời điểm kết quả *</Label>
                <Input
                  type="datetime-local"
                  value={form.resultDate}
                  min={minDateStr}
                  onChange={(e) => handleChange("resultDate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Không chọn thời điểm trong quá khứ.
                </p>
              </div>

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

                {/* Xem trước ảnh */}
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

      {/* Dialog xem ảnh – 2/3 màn hình, căn giữa, có DialogTitle ẩn cho a11y */}
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
          className={`fixed bottom-6 right-6 z-[210] max-w-sm rounded-md px-4 py-3 shadow-md flex flex-col gap-1 ${toastVariant === "destructive"
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
