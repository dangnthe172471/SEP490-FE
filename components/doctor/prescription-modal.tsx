"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Search } from "lucide-react"

import type { RecordListItemDto } from "@/lib/types/doctor-record"
import type { ReadMedicineDto } from "@/lib/types/medicine"
import { medicineService } from "@/lib/services/medicine-service"

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168").replace(/\/+$/, "") + "/api"

function getAccessTokenFromClient(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const ls =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("access_token") ??
      undefined
    if (ls) return ls
    const fromCookie = (n: string) =>
      document.cookie?.split("; ")?.find((c) => c.startsWith(`${n}=`))
    const a = fromCookie("auth_token")
    const b = fromCookie("access_token")
    if (a) return decodeURIComponent(a.split("=")[1])
    if (b) return decodeURIComponent(b.split("=")[1])
  } catch {}
  return undefined
}

interface PrescriptionItem {
  medicineId: number
  medicineName: string
  providerName?: string
  dosage: string
  duration: string
}

interface PrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  record: RecordListItemDto
  onSaved: () => void
}

export default function PrescriptionModal({ isOpen, onClose, record, onSaved }: PrescriptionModalProps) {
  const [medicines, setMedicines] = useState<ReadMedicineDto[]>([])
  const [medicineSearch, setMedicineSearch] = useState("")
  const [selectedMedicine, setSelectedMedicine] = useState<ReadMedicineDto | null>(null)

  // 🔸 2 input riêng: Liều lượng & Thời gian dùng
  const [dosage, setDosage] = useState("")
  const [duration, setDuration] = useState("")

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
        const token = getAccessTokenFromClient()
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
      (m.providerName ?? "").toLowerCase().includes(q)
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
        providerName: selectedMedicine.providerName,
        dosage: dosage.trim(),
        duration: duration.trim(),
      },
    ])
    setSelectedMedicine(null)
    setMedicineSearch("")
    setDosage("")
    setDuration("")
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
      const token = getAccessTokenFromClient()
      const payload = {
        recordId: record.recordId,
        items: prescriptionItems.map((it) => ({
          medicineId: it.medicineId,
          dosage: it.dosage,    // cột Dosage
          duration: it.duration // cột Duration
        })),
        // issuedDate: new Date().toISOString(),
        // notes,
      }

      const res = await fetch(`${BASE_URL}/PrescriptionsDoctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `HTTP ${res.status}`)
      }

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kê đơn thuốc</DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            <p><strong>Bệnh nhân:</strong> {record.patientName}</p>
            <p><strong>Chẩn đoán:</strong> {record.diagnosisRaw || "Không có"}</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chọn thuốc */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Chọn thuốc</h3>

            <div className="space-y-3">
              {/* Search thuốc */}
              <div>
                <Label htmlFor="medicine-search" className="text-sm font-medium">Tìm kiếm thuốc</Label>
                <div className="relative mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="medicine-search"
                      placeholder="Nhập tên thuốc hoặc nhà cung cấp..."
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
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground text-sm">{m.medicineName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {m.providerName ?? "Nhà cung cấp không xác định"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">Không tìm thấy thuốc</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hiển thị provider đã chọn */}
              {selectedMedicine && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                      <p className="font-medium text-foreground">
                        {selectedMedicine.providerName ?? "Không xác định"}
                      </p>
                    </div>
                    <Badge variant="outline">Thuốc</Badge>
                  </div>
                </div>
              )}

              {/* Inputs: Dosage + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dosage" className="text-sm font-medium">Liều lượng (Dosage)</Label>
                  <Input
                    id="dosage"
                    placeholder="VD: 2 viên × 3 lần/ngày"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMedicine()}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-sm font-medium">Thời gian dùng (Duration)</Label>
                  <Input
                    id="duration"
                    placeholder="VD: 5 ngày"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMedicine()}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleAddMedicine} disabled={!selectedMedicine || !dosage.trim() || !duration.trim()}>
                  Thêm vào đơn
                </Button>
              </div>
            </div>
          </div>

          {/* Danh sách đã chọn */}
          {prescriptionItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Thuốc đã chọn ({prescriptionItems.length})</h3>
              <div className="space-y-2">
                {prescriptionItems.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.medicineName}</p>
                          <p className="text-sm text-muted-foreground">
                            Nhà cung cấp: {item.providerName ?? "Không xác định"}
                          </p>
                          <div className="mt-1 text-sm text-muted-foreground">
                            <p>Liều lượng: <strong>{item.dosage}</strong></p>
                            <p>Thời gian dùng: <strong>{item.duration}</strong></p>
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

          {/* Ghi chú (tuỳ chọn) */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Ghi chú thêm (tùy chọn)</Label>
            <Input
              id="notes"
              placeholder="Nhập ghi chú..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSavePrescription} disabled={savingPrescription || prescriptionItems.length === 0}>
            {savingPrescription ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>) : "Lưu đơn thuốc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
