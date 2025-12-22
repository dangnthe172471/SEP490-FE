"use client"

import { useEffect, useState, ChangeEvent } from "react"
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

// base URL API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn"

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

// chuẩn hoá URL để hiển thị ảnh
function buildAttachmentUrl(path: string): string {
  if (!path) return ""
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  // path dạng /uploads/... hoặc uploads/...
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
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

  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>("")
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [derm, setDerm] = useState<ReadDermatologyRecordDto | null>(null)

  // Y tá chỉ được nhập 3 trường này
  const [procedureNotes, setProcedureNotes] = useState("")
  const [resultSummary, setResultSummary] = useState("")
  const [attachmentPath, setAttachmentPath] = useState("")

  // toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastVariant, setToastVariant] =
    useState<"default" | "destructive">("default")
  const [toastTitle, setToastTitle] = useState("")
  const [toastDesc, setToastDesc] = useState("")

  useEffect(() => {
    if (!open || !recordId) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const d = await getDermatology(recordId)
        if (!d) {
          const msg = "Không tìm thấy hồ sơ Da liễu cho bản ghi này."
          setError(msg)
          setDerm(null)
          showToast("destructive", "Không tìm thấy", msg)
          return
        }
        setDerm(d)
        setProcedureNotes(d.procedureNotes ?? "")
        setResultSummary(d.resultSummary ?? "")
        setAttachmentPath(d.attachment ?? "")
        setPendingFile(null)
        setLocalPreviewUrl("")
      } catch (e: any) {
        const msg = e?.message ?? "Không thể tải dữ liệu Da liễu."
        setError(msg)
        showToast("destructive", "Lỗi tải dữ liệu", msg)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, recordId])

  // cleanup blob URL
  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const reset = () => {
    setError(null)
    setDerm(null)
    setProcedureNotes("")
    setResultSummary("")
    setAttachmentPath("")
    setPendingFile(null)
    setLocalPreviewUrl("")
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  async function uploadAttachment(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token") || localStorage.getItem("token")
      : null

  try {
    const res = await fetch(`${API_BASE_URL}/api/uploads/attachments`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    })

    //Nếu server trả 413 (Payload Too Large)
    if (res.status === 413) {
      throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh có dung lượng nhỏ hơn.")
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(text || `Upload file thất bại (${res.status}).`)
    }

    const data = (await res.json()) as { relativePath?: string; url?: string }
    return data.relativePath || data.url || ""
  } catch (e: any) {
    const msg = String(e?.message ?? "")
    if (msg.includes("Failed to fetch")) {
      throw new Error("Không upload được. Có thể ảnh quá lớn (tối đa 10MB) hoặc lỗi kết nối/CORS.")
    }
    throw e
  }
}


  const MAX_BYTES = 10 * 1024 * 1024
  const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
  // CHỈ đổi file tạm + preview, không call API
  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.has(file.type)) {
    showToast(
      "destructive",
      "File không hợp lệ",
      "Chỉ cho phép ảnh JPG/PNG/WebP."
    )
    e.currentTarget.value = ""
    setPendingFile(null)
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
    return
  }
    if (file.size > MAX_BYTES) {
    showToast("destructive", "Ảnh quá lớn", "Vui lòng chọn ảnh ≤ 10MB.")
    setPendingFile(null)
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ""
    })
    e.currentTarget.value = "" // reset input để chọn lại
    return
    }

    setPendingFile(file)
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleSave = async () => {
    if (!derm) {
      const msg = "Không có dữ liệu Da liễu để lưu."
      setError(msg)
      showToast("destructive", "Không thể lưu", msg)
      return
    }

    if (!procedureNotes.trim() || !resultSummary.trim()) {
      const msg =
        "Vui lòng nhập đầy đủ 'Ghi chú thủ thuật' và 'Kết quả da liễu'."
      setError(msg)
      showToast("destructive", "Thiếu dữ liệu", msg)
      return
    }

    try {
      setSaving(true)
      setError(null)

      let finalAttachment = attachmentPath

      // nếu chọn file mới -> bây giờ mới upload
      if (pendingFile) {
        setUploadingAttachment(true)
        finalAttachment = await uploadAttachment(pendingFile)
        setAttachmentPath(finalAttachment)
      }

      const performerId = getCurrentUserId()

      await updateDermatology(derm.recordId, {
        requestedProcedure: derm.requestedProcedure ?? undefined,
        bodyArea: derm.bodyArea ?? undefined,

        procedureNotes: procedureNotes.trim(),
        resultSummary: resultSummary.trim(),
        attachment: finalAttachment || null,

        performedByUserId: performerId ?? undefined,
      })

      showToast("default", "Cập nhật thành công", "Đã lưu khám Da liễu.")
      onSaved?.()
      handleClose()
    } catch (e: any) {
      const msg = e?.message ?? "Không thể lưu kết quả Da liễu."
      setError(msg)
      showToast("destructive", "Lỗi khi lưu", msg)
    } finally {
      setUploadingAttachment(false)
      setSaving(false)
    }
  }

  const canSave =
    !!derm && !!procedureNotes.trim() && !!resultSummary.trim() && !saving

  const previewUrl = pendingFile
    ? localPreviewUrl
    : attachmentPath
      ? buildAttachmentUrl(attachmentPath)
      : ""

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleClose()
          else onOpenChange(v)
        }}
      >
        <DialogContent className="w-full sm:max-w-[560px]">
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
                  className="resize-y whitespace-pre-wrap break-words"
                  style={{ overflowWrap: "anywhere" }}
                  wrap="soft"
                  value={procedureNotes}
                  onChange={(e) => setProcedureNotes(e.target.value)}
                  rows={2}
                  placeholder="Các bước thực hiện, thuốc sử dụng, phản ứng da, v.v..."
                />
              </div>

              <div className="space-y-1">
                <Label>Kết quả da liễu</Label>
                <Textarea
                  className="resize-y whitespace-pre-wrap break-words"
                  style={{ overflowWrap: "anywhere" }}
                  wrap="soft"
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  rows={3}
                  placeholder="Mô tả tình trạng sau thủ thuật, đánh giá đáp ứng..."
                />
              </div>

              <div className="space-y-1">
                <Label>Đính kèm (chọn ảnh từ máy)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAttachmentChange}
                  disabled={saving}
                />
                {(uploadingAttachment || saving) && pendingFile && (
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
                          alt="Ảnh đính kèm da liễu"
                          className="max-h-40 w-auto rounded-md object-contain"
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={handleClose}>
              Đóng
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
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

      {/* Dialog phóng to ảnh */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-[70vw] max-h-[70vh] border-none bg-transparent p-0 shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Ảnh đính kèm da liễu</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex h-[70vh] w-full items-center justify-center">
              <img
                src={previewUrl}
                alt="Ảnh da liễu"
                className="max-h-[66vh] max-w-[66vw] rounded-lg object-contain shadow-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {toastOpen && (
        <div
          className={`fixed bottom-6 right-6 z-[210] flex max-w-sm flex-col gap-1 rounded-md px-4 py-3 shadow-md ${toastVariant === "destructive"
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
