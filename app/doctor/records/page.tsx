"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon, FileText, Users, Activity, Plus, MessageCircle, UserPlus, HeartPulse, Search, Filter, X } from "lucide-react"
import { getDoctorNavigation } from "@/lib/navigation"
import { getCurrentUser } from "@/lib/auth"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface MedicalRecord {
  recordId: number
  doctorNotes: string
  diagnosis: string
  createdAt: string
  appointmentId: number
  appointment: {
    appointmentId: number
    appointmentDate: string
    doctorId: number
    patientId: number
    status: string
    reasonForVisit?: string
  }
  internalMedRecord?: {
    bloodPressure?: number
    heartRate?: number
    bloodSugar?: number
    notes?: string
  }
  prescriptions?: any[]
  testResults?: any[]
  payments?: any[]
}

interface AppointmentDetail {
  patientName: string
  patientPhone: string
  doctorName: string
  doctorSpecialty: string
  status: string
  reasonForVisit: string
  appointmentDate?: string
}

interface PatientDetail {
  fullName: string
  gender: string
  dob: string
  phone: string
  email: string
  allergies: string
  medicalHistory: string
}

// Enriched record type with additional fetched data
type EnrichedMedicalRecord = MedicalRecord & {
  appointmentInfo?: AppointmentDetail
  patientData?: PatientDetail
}

export default function DoctorRecordsPage() {
  // Get reception navigation from centralized config
  const navigation = getDoctorNavigation()

  const router = useRouter()
  const [records, setRecords] = useState<EnrichedMedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [patientCache, setPatientCache] = useState<Record<number, PatientDetail>>({})
  const [appointmentCache, setAppointmentCache] = useState<Record<number, AppointmentDetail>>({})
  
  // Filter states
  const [globalSearch, setGlobalSearch] = useState("") // Search tổng quát
  const [searchName, setSearchName] = useState("")
  const [searchDiagnosis, setSearchDiagnosis] = useState("")
  const [searchDoctor, setSearchDoctor] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined)
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined)
  const [filterWeek, setFilterWeek] = useState<string>("")
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterYear, setFilterYear] = useState<string>("")
  const [filterBloodPressureMin, setFilterBloodPressureMin] = useState<string>("")
  const [filterBloodPressureMax, setFilterBloodPressureMax] = useState<string>("")
  const [filterHeartRateMin, setFilterHeartRateMin] = useState<string>("")
  const [filterHeartRateMax, setFilterHeartRateMax] = useState<string>("")
  const [filterBloodSugarMin, setFilterBloodSugarMin] = useState<string>("")
  const [filterBloodSugarMax, setFilterBloodSugarMax] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    const user = getCurrentUser()

    if (!user?.id) {
      console.error("User chưa đăng nhập hoặc không có ID");
      return;
    }

    const fetchRecords = async () => {
      try {
        const res = await fetch(`https://localhost:7168/api/MedicalRecord/by-doctor/${user.id}`)
        if (!res.ok) throw new Error("Failed to fetch records")
        const data = await res.json()
        // song song fetch thêm dữ liệu từ appointment và user
        const enriched: EnrichedMedicalRecord[] = await Promise.all(
          data.map(async (r: MedicalRecord): Promise<EnrichedMedicalRecord> => {
            // 1) Appointment info (cache by appointmentId)
            let appointmentInfo = appointmentCache[r.appointmentId]
            if (!appointmentInfo) {
              const aRes = await fetch(`https://localhost:7168/api/Appointments/${r.appointmentId}`)
              appointmentInfo = await aRes.json()
              setAppointmentCache((prev) => ({ ...prev, [r.appointmentId]: appointmentInfo }))
            }

            // 2) Patient info (via PatientId from record.appointment)
            const patientId = r?.appointment?.patientId
            let patientData = patientId ? patientCache[patientId] : undefined
            if (!patientData && patientId) {
              // Step 1: get Patient to retrieve userId
              const pRes = await fetch(`https://localhost:7168/api/Patient/${patientId}`)
              if (!pRes.ok) throw new Error("Không thể lấy dữ liệu Patient")
              const patientRaw = await pRes.json()
              const userId = patientRaw?.userId ?? patientRaw?.UserId
              if (!userId) throw new Error("Không tìm thấy userId trong Patient")

              // Step 2: get User details
              const uRes = await fetch(`https://localhost:7168/api/Users/${userId}`)
              if (!uRes.ok) throw new Error("Không thể lấy dữ liệu User")
              const userRaw = await uRes.json()

              // Merge normalized fields for FE display
              patientData = {
                fullName: userRaw.fullName ?? userRaw.FullName ?? "",
                gender: userRaw.gender ?? userRaw.Gender ?? "",
                dob: userRaw.dob ?? userRaw.Dob ?? "",
                phone: userRaw.phone ?? userRaw.Phone ?? "",
                email: userRaw.email ?? userRaw.Email ?? "",
                allergies: patientRaw.allergies ?? patientRaw.Allergies ?? "",
                medicalHistory: patientRaw.medicalHistory ?? patientRaw.MedicalHistory ?? "",
              }
              setPatientCache((prev) => ({ ...prev, [patientId]: patientData! }))
            }

            return {
              ...r,
              appointmentInfo,
              patientData,
            } as EnrichedMedicalRecord
          })
        )

        setRecords(enriched)
      } catch (error) {
        console.error("Error fetching records:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get unique values for filter options
  const uniqueDiagnoses = useMemo(() => {
    const diagnoses = records
      .map((r) => r.diagnosis)
      .filter((d): d is string => typeof d === "string" && d.trim() !== "")
    return Array.from(new Set(diagnoses))
  }, [records])

  const uniqueDoctors = useMemo(() => {
    const doctors = records
      .map((r) => r.appointmentInfo?.doctorName)
      .filter((d): d is string => typeof d === "string" && d.trim() !== "")
    return Array.from(new Set(doctors))
  }, [records])

  const uniqueStatuses = useMemo(() => {
    const statuses = records
      .map((r) => r.appointmentInfo?.status)
      .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    return Array.from(new Set(statuses))
  }, [records])

  // Helper function to get week number
  const getWeekNumber = (date: Date): string => {
    try {
      if (!date || isNaN(date.getTime())) return ""
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${d.getUTCFullYear()}-W${weekNo}`
    } catch (error) {
      console.error("Error calculating week number:", error)
      return ""
    }
  }

  // Helper function to search in all fields
  const searchInAllFields = (record: EnrichedMedicalRecord, searchTerm: string): boolean => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    const p = record.patientData
    const a = record.appointmentInfo
    const med = record.internalMedRecord

    // Search in all text fields
    const searchableText = [
      p?.fullName,
      p?.phone,
      p?.email,
      p?.allergies,
      p?.medicalHistory,
      record.diagnosis,
      record.doctorNotes,
      a?.doctorName,
      a?.doctorSpecialty,
      a?.reasonForVisit,
      a?.status,
      med?.notes,
      String(record.recordId || ""),
      med?.bloodPressure != null ? String(med.bloodPressure) : "",
      med?.heartRate != null ? String(med.heartRate) : "",
      med?.bloodSugar != null ? String(med.bloodSugar) : "",
    ]
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .join(" ")
      .toLowerCase()

    return searchableText.includes(searchLower)
  }

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const p = record.patientData
      const a = record.appointmentInfo
      const med = record.internalMedRecord

      // Global search - search in all fields
      if (globalSearch && !searchInAllFields(record, globalSearch)) {
        return false
      }

      // Filter by patient name
      if (searchName && !p?.fullName?.toLowerCase().includes(searchName.toLowerCase())) {
        return false
      }

      // Filter by diagnosis
      if (searchDiagnosis && !record.diagnosis?.toLowerCase().includes(searchDiagnosis.toLowerCase())) {
        return false
      }

      // Filter by doctor name
      if (searchDoctor && !a?.doctorName?.toLowerCase().includes(searchDoctor.toLowerCase())) {
        return false
      }

      // Filter by status
      if (filterStatus !== "all" && a?.status !== filterStatus) {
        return false
      }

      // Filter by single date
      if (filterDate && a?.appointmentDate) {
        const appointmentDate = new Date(a.appointmentDate)
        const filterDateOnly = new Date(filterDate)
        if (
          appointmentDate.getDate() !== filterDateOnly.getDate() ||
          appointmentDate.getMonth() !== filterDateOnly.getMonth() ||
          appointmentDate.getFullYear() !== filterDateOnly.getFullYear()
        ) {
          return false
        }
      }

      // Filter by date range
      if (filterDateFrom && a?.appointmentDate) {
        const appointmentDate = new Date(a.appointmentDate)
        if (appointmentDate < filterDateFrom) {
          return false
        }
      }
      if (filterDateTo && a?.appointmentDate) {
        const appointmentDate = new Date(a.appointmentDate)
        const nextDay = new Date(filterDateTo)
        nextDay.setDate(nextDay.getDate() + 1)
        if (appointmentDate >= nextDay) {
          return false
        }
      }

      // Filter by week
      if (filterWeek && a?.appointmentDate) {
        const appointmentDate = new Date(a.appointmentDate)
        const weekStr = getWeekNumber(appointmentDate)
        if (weekStr !== filterWeek) {
          return false
        }
      }

      // Filter by month
      if (filterMonth && a?.appointmentDate) {
        const appointmentDate = new Date(a.appointmentDate)
        const monthStr = `${appointmentDate.getFullYear()}-${String(appointmentDate.getMonth() + 1).padStart(2, "0")}`
        if (monthStr !== filterMonth) {
          return false
        }
      }

      // Filter by year
      if (filterYear && a?.appointmentDate) {
        const appointmentDate = new Date(a.appointmentDate)
        if (String(appointmentDate.getFullYear()) !== filterYear) {
          return false
        }
      }

      // Filter by blood pressure
      if (med?.bloodPressure) {
        if (filterBloodPressureMin && med.bloodPressure < Number(filterBloodPressureMin)) {
          return false
        }
        if (filterBloodPressureMax && med.bloodPressure > Number(filterBloodPressureMax)) {
          return false
        }
      } else if (filterBloodPressureMin || filterBloodPressureMax) {
        return false
      }

      // Filter by heart rate
      if (med?.heartRate) {
        if (filterHeartRateMin && med.heartRate < Number(filterHeartRateMin)) {
          return false
        }
        if (filterHeartRateMax && med.heartRate > Number(filterHeartRateMax)) {
          return false
        }
      } else if (filterHeartRateMin || filterHeartRateMax) {
        return false
      }

      // Filter by blood sugar
      if (med?.bloodSugar) {
        if (filterBloodSugarMin && med.bloodSugar < Number(filterBloodSugarMin)) {
          return false
        }
        if (filterBloodSugarMax && med.bloodSugar > Number(filterBloodSugarMax)) {
          return false
        }
      } else if (filterBloodSugarMin || filterBloodSugarMax) {
        return false
      }

      return true
    })
  }, [
    records,
    globalSearch,
    searchName,
    searchDiagnosis,
    searchDoctor,
    filterStatus,
    filterDate,
    filterDateFrom,
    filterDateTo,
    filterWeek,
    filterMonth,
    filterYear,
    filterBloodPressureMin,
    filterBloodPressureMax,
    filterHeartRateMin,
    filterHeartRateMax,
    filterBloodSugarMin,
    filterBloodSugarMax,
  ])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [globalSearch, searchName, searchDiagnosis, searchDoctor, filterStatus, filterDate, filterDateFrom, filterDateTo, filterWeek, filterMonth, filterYear, filterBloodPressureMin, filterBloodPressureMax, filterHeartRateMin, filterHeartRateMax, filterBloodSugarMin, filterBloodSugarMax])

  // Get available weeks, months, years from records
  const availableWeeks = useMemo(() => {
    const weeks = new Set<string>()
    records.forEach((r) => {
      const a = r.appointmentInfo
      if (a?.appointmentDate) {
        try {
          const weekStr = getWeekNumber(new Date(a.appointmentDate))
          if (weekStr) weeks.add(weekStr)
        } catch (error) {
          console.error("Error processing week:", error)
        }
      }
    })
    return Array.from(weeks).sort().reverse()
  }, [records])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    records.forEach((r) => {
      const a = r.appointmentInfo
      if (a?.appointmentDate) {
        const date = new Date(a.appointmentDate)
        months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
      }
    })
    return Array.from(months).sort().reverse()
  }, [records])

  const availableYears = useMemo(() => {
    const years = new Set<string>()
    records.forEach((r) => {
      const a = r.appointmentInfo
      if (a?.appointmentDate) {
        years.add(String(new Date(a.appointmentDate).getFullYear()))
      }
    })
    return Array.from(years).sort().reverse()
  }, [records])

  // Reset all filters
  const resetFilters = () => {
    setGlobalSearch("")
    setSearchName("")
    setSearchDiagnosis("")
    setSearchDoctor("")
    setFilterStatus("all")
    setFilterDate(undefined)
    setFilterDateFrom(undefined)
    setFilterDateTo(undefined)
    setFilterWeek("")
    setFilterMonth("")
    setFilterYear("")
    setFilterBloodPressureMin("")
    setFilterBloodPressureMax("")
    setFilterHeartRateMin("")
    setFilterHeartRateMax("")
    setFilterBloodSugarMin("")
    setFilterBloodSugarMax("")
    setCurrentPage(1)
  }

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      globalSearch !== "" ||
      searchName !== "" ||
      searchDiagnosis !== "" ||
      searchDoctor !== "" ||
      filterStatus !== "all" ||
      filterDate !== undefined ||
      filterDateFrom !== undefined ||
      filterDateTo !== undefined ||
      filterWeek !== "" ||
      filterMonth !== "" ||
      filterYear !== "" ||
      filterBloodPressureMin !== "" ||
      filterBloodPressureMax !== "" ||
      filterHeartRateMin !== "" ||
      filterHeartRateMax !== "" ||
      filterBloodSugarMin !== "" ||
      filterBloodSugarMax !== ""
    )
  }, [
    globalSearch,
    searchName,
    searchDiagnosis,
    searchDoctor,
    filterStatus,
    filterDate,
    filterDateFrom,
    filterDateTo,
    filterWeek,
    filterMonth,
    filterYear,
    filterBloodPressureMin,
    filterBloodPressureMax,
    filterHeartRateMin,
    filterHeartRateMax,
    filterBloodSugarMin,
    filterBloodSugarMax,
  ])

  const RecordCard = ({ record }: { record: EnrichedMedicalRecord }) => {
    const p = record.patientData
    const a = record.appointmentInfo
    const med = record.internalMedRecord

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              {/* Header: bệnh nhân và ID */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{p?.fullName || "Bệnh nhân chưa xác định"}</h3>
                <Badge variant="outline">#{record.recordId}</Badge>
                <Badge variant={a?.status === "Confirmed" ? "default" : "secondary"}>
                  {a?.status || "Chưa rõ"}
                </Badge>
              </div>

              {/* Thông tin bệnh nhân */}
              {p && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Giới tính: {p.gender}</p>
                  <p>Ngày sinh: {new Date(p.dob).toLocaleDateString("vi-VN")}</p>
                  <p>SĐT: {p.phone}</p>
                  <p>Email: {p.email}</p>
                  <p>Dị ứng: {p.allergies || "Không có"}</p>
                  <p>Tiền sử bệnh: {p.medicalHistory || "Không có"}</p>
                </div>
              )}

              {/* Thông tin khám */}
              <div className="mt-3">
                <p className="text-sm font-medium">Ngày khám:{" "}
                  <span className="text-muted-foreground">
                    {a?.appointmentDate
                      ? new Date(a.appointmentDate).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </p>
                <p className="text-sm font-medium">Bác sĩ phụ trách:{" "}
                  <span className="text-muted-foreground">{a?.doctorName || "—"}</span>
                </p>
                <p className="text-sm font-medium">Chuyên khoa:{" "}
                  <span className="text-muted-foreground">{a?.doctorSpecialty || "—"}</span>
                </p>
                <p className="text-sm font-medium">Lý do khám:{" "}
                  <span className="text-muted-foreground">{a?.reasonForVisit || "—"}</span>
                </p>
              </div>

              {/* Kết quả & ghi chú */}
              <div className="space-y-1 mt-2">
                <p><strong>Chẩn đoán:</strong> {record.diagnosis || "—"}</p>
                <p><strong>Ghi chú bác sĩ:</strong> {record.doctorNotes || "—"}</p>
              </div>

              {/* Các chỉ số nội khoa */}
              {med && (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {med.bloodPressure && (
                    <Badge variant="outline">
                      <HeartPulse className="w-4 h-4 mr-1" /> Huyết áp: {med.bloodPressure} mmHg
                    </Badge>
                  )}
                  {med.heartRate && (
                    <Badge variant="outline">Nhịp tim: {med.heartRate} bpm</Badge>
                  )}
                  {med.bloodSugar && (
                    <Badge variant="outline">Đường huyết: {med.bloodSugar} mg/dL</Badge>
                  )}
                </div>
              )}

              {/* Thông tin khác */}
              <div className="flex flex-wrap gap-2 mt-2">
                {record.prescriptions && record.prescriptions.length > 0 && (
                  <Badge variant="outline">{record.prescriptions.length} đơn thuốc</Badge>
                )}
                {record.testResults && record.testResults.length > 0 && (
                  <Badge variant="outline">{record.testResults.length} kết quả xét nghiệm</Badge>
                )}
                {record.payments && record.payments.length > 0 && (
                  <Badge variant="outline">{record.payments.length} giao dịch</Badge>
                )}
              </div>
            </div>

            <Button
              size="sm"
              className="ml-4"
              onClick={() => router.push(`/doctor/records/view/${record.recordId}`)}
            >
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hồ sơ bệnh án</h1>
            <p className="text-muted-foreground">Quản lý toàn bộ hồ sơ khám bệnh</p>
          </div>
          {/* <Button onClick={() => router.push("/reception/records/new")}>
            <Plus className="mr-2 h-4 w-4" /> Tạo hồ sơ mới
          </Button> */}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Đang tải dữ liệu...</p>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Không có hồ sơ bệnh án nào</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filter Section */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      <h3 className="font-semibold">Bộ lọc</h3>
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2">
                          {filteredRecords.length} / {records.length}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                          <X className="h-4 w-4 mr-1" /> Xóa bộ lọc
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        {showFilters ? "Ẩn" : "Hiện"} bộ lọc
                      </Button>
                    </div>
                  </div>

                  {/* Global Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm tổng quát (tên, chẩn đoán, bác sĩ, số điện thoại, email, ghi chú, chỉ số y tế...)"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Quick Search */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo tên bệnh nhân..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo chẩn đoán..."
                        value={searchDiagnosis}
                        onChange={(e) => setSearchDiagnosis(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm theo bác sĩ..."
                        value={searchDoctor}
                        onChange={(e) => setSearchDoctor(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả</SelectItem>
                              {uniqueStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Single Date Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Ngày khám</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filterDate ? format(filterDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filterDate}
                                onSelect={setFilterDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Date Range From */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Từ ngày</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filterDateFrom ? format(filterDateFrom, "dd/MM/yyyy", { locale: vi }) : "Từ ngày"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filterDateFrom}
                                onSelect={setFilterDateFrom}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Date Range To */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Đến ngày</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filterDateTo ? format(filterDateTo, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filterDateTo}
                                onSelect={setFilterDateTo}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Week Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tuần</label>
                          <Select value={filterWeek || "all"} onValueChange={(value) => setFilterWeek(value === "all" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn tuần" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả</SelectItem>
                              {availableWeeks.map((week) => (
                                <SelectItem key={week} value={week}>
                                  {week}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Month Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tháng</label>
                          <Select value={filterMonth || "all"} onValueChange={(value) => setFilterMonth(value === "all" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn tháng" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả</SelectItem>
                              {availableMonths.map((month) => {
                                const [year, monthNum] = month.split("-")
                                return (
                                  <SelectItem key={month} value={month}>
                                    Tháng {monthNum}/{year}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Year Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Năm</label>
                          <Select value={filterYear || "all"} onValueChange={(value) => setFilterYear(value === "all" ? "" : value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn năm" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả</SelectItem>
                              {availableYears.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Medical Indicators Filters */}
                      <div className="space-y-3 pt-2 border-t">
                        <h4 className="font-medium text-sm">Chỉ số y tế</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Blood Pressure */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Huyết áp (mmHg)</label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={filterBloodPressureMin}
                                onChange={(e) => setFilterBloodPressureMin(e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={filterBloodPressureMax}
                                onChange={(e) => setFilterBloodPressureMax(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Heart Rate */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Nhịp tim (bpm)</label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={filterHeartRateMin}
                                onChange={(e) => setFilterHeartRateMin(e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={filterHeartRateMax}
                                onChange={(e) => setFilterHeartRateMax(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Blood Sugar */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Đường huyết (mg/dL)</label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={filterBloodSugarMin}
                                onChange={(e) => setFilterBloodSugarMin(e.target.value)}
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={filterBloodSugarMax}
                                onChange={(e) => setFilterBloodSugarMax(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Records List */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">
                  Tất cả ({filteredRecords.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4">
                {filteredRecords.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không tìm thấy hồ sơ nào phù hợp với bộ lọc</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatedRecords.map((record) => (
                      <RecordCard key={record.recordId} record={record} />
                    ))}
                    
                    {/* Pagination */}
                    {filteredRecords.length > 0 && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                              <span>
                                Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} trong tổng số {filteredRecords.length} hồ sơ
                              </span>
                              <span className="mx-2">•</span>
                              <span>Mỗi trang:</span>
                              <Select
                                value={String(itemsPerPage)}
                                onValueChange={(value) => {
                                  setItemsPerPage(Number(value))
                                  setCurrentPage(1)
                                }}
                              >
                                <SelectTrigger className="w-20 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {totalPages > 1 && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                >
                                  Trước
                                </Button>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number
                                    if (totalPages <= 5) {
                                      pageNum = i + 1
                                    } else if (currentPage <= 3) {
                                      pageNum = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i
                                    } else {
                                      pageNum = currentPage - 2 + i
                                    }
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="w-10"
                                      >
                                        {pageNum}
                                      </Button>
                                    )
                                  })}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                  disabled={currentPage === totalPages}
                                >
                                  Sau
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
