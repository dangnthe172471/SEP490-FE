// /app/doctor/patient-records/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Activity, Users, FileText, Calendar as CalendarIcon } from "lucide-react"

import { RecordList } from "@/components/doctor/record-list"
import PrescriptionModal from "@/components/doctor/prescription-modal"

import type { RecordListItemDto, PagedResult } from "@/lib/types/doctor-record"
import { getDoctorRecords } from "@/lib/services/doctor-record-service"
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
import { appointmentService } from "@/lib/services/appointment-service"
import type { DoctorInfoDto } from "@/lib/types/appointment"
import { RoleGuard } from "@/components/role-guard"

export default function DoctorRecordsPage() {
  const router = useRouter()

  // Get doctor navigation from centralized config
  const navigation = getDoctorNavigation()

  // Filters & paging
  const [search, setSearch] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [doctorId, setDoctorId] = useState<string>("")
  const [from, setFrom] = useState("") // yyyy-MM-dd
  const [to, setTo] = useState("")     // yyyy-MM-dd
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(12) // card grid đẹp hơn với 6/12/18/24

  // Doctors list
  const [doctors, setDoctors] = useState<DoctorInfoDto[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)

  // Data (dùng PagedResult để truyền thẳng cho RecordList)
  const [result, setResult] = useState<PagedResult<RecordListItemDto>>({
    items: [],
    pageNumber: 1,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal
  const [selectedRecord, setSelectedRecord] = useState<RecordListItemDto | null>(null)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  // Apply client-side filters for diagnosis and doctor
  const filteredItems = useMemo(() => {
    let items = [...result.items]

    // Filter by diagnosis
    if (diagnosis.trim()) {
      const diagnosisLower = diagnosis.toLowerCase()
      items = items.filter((item) => {
        const itemDiagnosis = item.diagnosisRaw?.toLowerCase() || ""
        return itemDiagnosis.includes(diagnosisLower)
      })
    }

    // Filter by doctor (doctor page shows only current doctor's records, so this might not be needed)
    // But we'll keep it for consistency
    if (doctorId && doctorId !== "all") {
      // Note: Doctor page typically shows only current doctor's records
      // This filter might not be applicable, but we'll keep it for UI consistency
    }

    return items
  }, [result.items, diagnosis, doctorId])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(result.totalCount / pageSize)),
    [result.totalCount, pageSize]
  )

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDoctorRecords({
        pageNumber,
        pageSize,
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
      })
      setResult(data)
    } catch (e: any) {
      const msg = e?.message ?? "Không thể tải danh sách"
      if ((msg === "UNAUTHORIZED" || /401|403/.test(msg)) && window.location.pathname !== "/login") {
        router.replace("/login?reason=unauthorized")
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Load doctors list
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true)
        const result = await appointmentService.getPagedDoctors(1, 1000) // Lấy tất cả
        setDoctors(result.data || [])
      } catch (error) {
        console.error("Error loading doctors:", error)
      } finally {
        setLoadingDoctors(false)
      }
    }
    loadDoctors()
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize])

  const onSearch = () => {
    setPageNumber(1)
    load()
  }

  const onClearFilters = () => {
    setSearch("")
    setDiagnosis("")
    setDoctorId("")
    setFrom("")
    setTo("")
    setPageNumber(1)
    load()
  }

  const onPrescribe = (record: RecordListItemDto) => {
    setSelectedRecord(record)
    setShowPrescriptionModal(true)
  }

  const onSaved = () => {
    setShowPrescriptionModal(false)
    setSelectedRecord(null)
    load()
  }

  // Nếu chọn "từ ngày" mà chưa có "đến ngày", đặt mặc định = from
  useEffect(() => {
    if (from && !to) setTo(from)
  }, [from, to])

  const onViewDetails = (recordId: number) => {
    // Điều hướng đến chi tiết hồ sơ nếu có trang
    // router.push(`/doctor/records/${recordId}`)
    console.log("View record detail:", recordId)
  }

  const onViewPrescription = (prescriptionId: number) => {
    router.push(`/doctor/prescriptions/${prescriptionId}`)
  }

  return (
    <RoleGuard allowedRoles="doctor">
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hồ sơ bệnh án</h1>
              <p className="text-muted-foreground">Lọc theo ngày khám, tìm theo tên bệnh nhân & kê đơn nhanh</p>
            </div>
            <Badge variant="outline" className="tabular-nums">
              Tổng: {result.totalCount} {filteredItems.length !== result.items.length ? `(Đã lọc: ${filteredItems.length})` : ""}
            </Badge>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Tên bệnh nhân</label>
                  <Input
                    placeholder="Nhập tên bệnh nhân…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Chẩn đoán</label>
                  <Input
                    placeholder="Nhập chẩn đoán…"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Bác sĩ</label>
                  <Select value={doctorId} onValueChange={setDoctorId} disabled={loadingDoctors}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả bác sĩ</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.doctorId} value={doctor.doctorId.toString()}>
                          {doctor.fullName} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Từ ngày</label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Đến ngày</label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={onSearch} disabled={loading} className="w-full md:w-auto">
                    {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tìm…</>) : "Tìm kiếm"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    disabled={loading}
                  >
                    Xoá lọc
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Grid thay cho Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh sách</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error ? (
                <p className="text-red-600 text-sm">{error}</p>
              ) : (
                <RecordList
                  data={{
                    ...result,
                    items: filteredItems,
                    totalCount: filteredItems.length,
                  }}
                  isLoading={loading}
                  onViewDetails={onViewDetails}
                  onViewPrescription={onViewPrescription}
                  onPrescribe={onPrescribe}
                />
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Trang {pageNumber}/{totalPages} • Mỗi trang{" "}
                  <select
                    className="ml-1 border rounded px-2 py-1 text-sm"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1) }}
                  >
                    {[6, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNumber >= totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal kê đơn */}
        {selectedRecord && (
          <PrescriptionModal
            isOpen={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            record={selectedRecord}
            onSaved={onSaved}
          />
        )}
      </DashboardLayout>
    </RoleGuard>
  )
}
