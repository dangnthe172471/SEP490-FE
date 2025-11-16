"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Search } from "lucide-react"

import type { RecordListItemDto } from "@/lib/types/doctor-record"
import type { ReadMedicineDto } from "@/lib/types/medicine"
import { medicineService } from "@/lib/services/medicine-service"
import {
  createPrescriptionDoctor,
} from "@/lib/services/prescription-doctor-service"
import type {
  CreatePrescriptionRequest,
} from "@/lib/types/prescription-doctor"

interface PrescriptionItem {
  medicineId: number
  medicineName: string
  providerName?: string
  dosage: string
  duration: string
  instruction?: string
}

interface PrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  record: RecordListItemDto
  onSaved: () => void
}

function normalizeStatus(raw?: string | null): "Providing" | "Stopped" {
  return (raw || "").toLowerCase() === "providing" ? "Providing" : "Stopped"
}

export default function PrescriptionModal({
  isOpen,
  onClose,
  record,
  onSaved,
}: PrescriptionModalProps) {
  const [medicines, setMedicines] = useState<ReadMedicineDto[]>([])
  const [medicineSearch, setMedicineSearch] = useState("")
  const [selectedMedicine, setSelectedMedicine] = useState<ReadMedicineDto | null>(null)

  const [dosage, setDosage] = useState("")
  const [duration, setDuration] = useState("")
  const [instruction, setInstruction] = useState("")

  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [savingPrescription, setSavingPrescription] = useState(false)
  const [notes, setNotes] = useState("")
  const [showMedicineList, setShowMedicineList] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      setLoading(true)
      try {
        const token =
          typeof window !== "undefined"
            ? (localStorage.getItem("auth_token") ??
               localStorage.getItem("access_token") ??
               undefined)
            : undefined

        const data = await medicineService.getAll(token)
        setMedicines(data)
      } catch (e) {
        console.error("Fetch medicines error:", e)
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen])

  const filteredMedicines = medicines.filter((m) => {
    const q = medicineSearch.trim().toLowerCase()
    if (!q) return true
    return (
      (m.medicineName ?? "").toLowerCase().includes(q) ||
      (m.providerName ?? "").toLowerCase().includes(q) ||
      (m.activeIngredient ?? "").toLowerCase().includes(q)
    )
  })

  const handleSelectMedicine = (m: ReadMedicineDto) => {
    setSelectedMedicine(m)
    setMedicineSearch(m.medicineName)
    setShowMedicineList(false)
  }

  const handleAddMedicine = () => {
    if (!selectedMedicine || !dosage.trim() || !duration.trim()) {
      alert("Vui lòng chọn thuốc, nhập Liều lượng và Thời gian dùng")
      return
    }

    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicineId: selectedMedicine.medicineId,
        medicineName: selectedMedicine.medicineName,
        providerName: selectedMedicine.providerName ?? undefined,
        dosage: dosage.trim(),
        duration: duration.trim(),
        instruction: instruction.trim() || undefined,
      },
    ])

    setSelectedMedicine(null)
    setMedicineSearch("")
    setDosage("")
    setDuration("")
    setInstruction("")
    setShowMedicineList(false)
  }

  const handleRemoveItem = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSavePrescription = async () => {
    if (prescriptionItems.length === 0) {
      alert("Vui lòng thêm ít nhất một thuốc")
      return
    }

    setSavingPrescription(true)
    try {
      const payload: CreatePrescriptionRequest = {
        recordId: record.recordId,
        issuedDate: undefined, // để backend tự dùng UtcNow nếu muốn
        notes: notes.trim() || undefined,
        items: prescriptionItems.map((it) => ({
          medicineId: it.medicineId,
          dosage: it.dosage,
          duration: it.duration,
          instruction: it.instruction ?? null,
        })),
      }

      await createPrescriptionDoctor(payload)

      alert("Kê đơn thành công")
      onClose()
      onSaved()
    } catch (e) {
      console.error("Save prescription error:", e)
      alert("Lỗi khi lưu đơn thuốc")
    } finally {
      setSavingPrescription(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[95vw]
          sm:w-[70vw]
          sm:max-w-[70vw]
          lg:w-[66vw]
          lg:max-w-[66vw]
          max-h-[90vh]
          overflow-hidden
          flex flex-col
        "
      >
        <DialogHeader>
          <DialogTitle>Kê đơn thuốc</DialogTitle>
          <div className="mt-2 grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p><strong>Bệnh nhân:</strong> {record.patientName}</p>
              <p><strong>Chẩn đoán:</strong> {record.diagnosisRaw || "Không có"}</p>
            </div>
          </div>
        </DialogHeader>

        {/* BODY SCROLL — KHÔNG CHO MODAL DÀI QUÁ */}
        <div className="space-y-6 overflow-y-auto pr-2 max-h-[calc(90vh-150px)]">
          {/* Chọn thuốc */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Chọn thuốc</h3>

            <div className="space-y-3">
              {/* Tìm thuốc */}
              <div>
                <Label htmlFor="medicine-search" className="text-sm font-medium">
                  Tìm kiếm thuốc
                </Label>

                <div className="relative mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="medicine-search"
                      placeholder="Nhập tên thuốc, hoạt chất hoặc nhà cung cấp..."
                      value={medicineSearch}
                      onChange={(e) => {
                        setMedicineSearch(e.target.value)
                        setShowMedicineList(true)
                        setSelectedMedicine(null)
                      }}
                      onFocus={() => setShowMedicineList(true)}
                      className="pl-10"
                    />
                  </div>

                  {showMedicineList && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                      {loading ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Đang tải...
                        </div>
                      ) : filteredMedicines.length > 0 ? (
                        <div className="py-1">
                          {filteredMedicines.map((m) => (
                            <button
                              key={m.medicineId}
                              onClick={() => handleSelectMedicine(m)}
                              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 text-sm">
                                  <p className="font-medium">{m.medicineName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Hoạt chất: {m.activeIngredient || "Không có dữ liệu"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {m.strength || "?"} · {m.dosageForm || "?"} {m.route ? `(${m.route})` : ""} · Đơn vị: {m.prescriptionUnit || "?"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Nhóm điều trị: {m.therapeuticClass || "Không xác định"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Nhà cung cấp: {m.providerName ?? "Không xác định"}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {normalizeStatus(m.status ?? undefined) === "Providing"
                                    ? "Đang cung cấp"
                                    : "Ngừng"}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          Không tìm thấy thuốc
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Thông tin chi tiết thuốc đã chọn */}
              {selectedMedicine && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1 text-sm">
                      <p className="font-semibold">{selectedMedicine.medicineName}</p>
                      <p className="text-muted-foreground">
                        Hoạt chất: <strong>{selectedMedicine.activeIngredient || "Không có dữ liệu"}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Hàm lượng: <strong>{selectedMedicine.strength || "Không có dữ liệu"}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Dạng / Đường dùng:{" "}
                        <strong>
                          {selectedMedicine.dosageForm || "?"}
                          {selectedMedicine.route ? ` (${selectedMedicine.route})` : ""}
                        </strong>
                      </p>
                      <p className="text-muted-foreground">
                        Đơn vị kê đơn: <strong>{selectedMedicine.prescriptionUnit || "Không có dữ liệu"}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Nhóm điều trị: <strong>{selectedMedicine.therapeuticClass || "Không xác định"}</strong>
                      </p>
                      <p className="text-muted-foreground">
                        Nhà cung cấp: <strong>{selectedMedicine.providerName ?? "Không xác định"}</strong>
                      </p>
                    </div>

                    <Badge variant="outline">
                      {normalizeStatus(selectedMedicine.status ?? undefined) === "Providing"
                        ? "Đang cung cấp"
                        : "Ngừng"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Liều lượng / thời gian / hướng dẫn */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="dosage" className="text-sm font-medium">
                    Liều lượng (Dosage)
                  </Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    placeholder="VD: 2 viên × 3 lần/ngày"
                    onChange={(e) => setDosage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMedicine()}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Thời gian dùng (Duration)
                  </Label>
                  <Input
                    id="duration"
                    value={duration}
                    placeholder="VD: 5 ngày"
                    onChange={(e) => setDuration(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMedicine()}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="instruction" className="text-sm font-medium">
                    Hướng dẫn (Instruction)
                  </Label>
                  <Input
                    id="instruction"
                    value={instruction}
                    placeholder="VD: Uống sau ăn, uống buổi tối..."
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMedicine()}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAddMedicine}
                  disabled={!selectedMedicine || !dosage.trim() || !duration.trim()}
                >
                  Thêm vào đơn
                </Button>
              </div>
            </div>
          </div>

          {/* Danh sách thuốc đã chọn */}
          {prescriptionItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">
                Thuốc đã chọn ({prescriptionItems.length})
              </h3>

              <div className="space-y-2">
                {prescriptionItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.medicineName}</p>
                          <p className="text-sm text-muted-foreground">
                            Nhà cung cấp: {item.providerName ?? "Không xác định"}
                          </p>

                          <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                            <p>
                              Liều lượng: <strong>{item.dosage}</strong>
                            </p>
                            <p>
                              Thời gian dùng: <strong>{item.duration}</strong>
                            </p>
                            {item.instruction && (
                              <p>
                                Hướng dẫn: <strong>{item.instruction}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ghi chú đơn thuốc */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Ghi chú thêm (tùy chọn)
            </Label>
            <Input
              id="notes"
              placeholder="Nhập ghi chú chung cho đơn thuốc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSavePrescription}
            disabled={savingPrescription || prescriptionItems.length === 0}
          >
            {savingPrescription ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              "Lưu đơn thuốc"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
