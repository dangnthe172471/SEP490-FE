"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Baby,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { getNurseNavigation } from "@/lib/navigation/nurse-navigation"
import {
  getTestWorklist,
  getTestResultsByRecord,
} from "@/lib/services/test-results-service"
import type {
  PagedResult,
  TestWorklistItemDto,
  RequiredState,
  ReadTestResultDto,
} from "@/lib/types/test-results"

import {
  CombinedStatusPill,
  type CombinedStatusSnapshot,
} from "@/components/combined-status-pill"
import { TestResultDialog } from "@/components/test-result-dialog"
import { InternalMedDialog } from "@/components/internal-med-dialog"
import { PediatricDialog } from "@/components/pediatric-dialog"
import { DermatologyDialog } from "@/components/dermatology-dialog"
import { getInternalMed } from "@/lib/services/internal-med-service"
import { getPediatric } from "@/lib/services/pediatric-service"
import { getDermatology } from "@/lib/services/dermatology-service"

import type {
  ReadInternalMedRecordDto,
  ReadPediatricRecordDto,
  ReadDermatologyRecordDto,
} from "@/lib/types/specialties"

type RecordActivity = {
  hasInternal: boolean
  internalComplete: boolean
  hasPediatric: boolean
  pediatricComplete: boolean
  hasDermatology: boolean
  dermatologyComplete: boolean
  testsRequested: number
  testsComplete: boolean
}

const isNumberFilled = (value: number | null | undefined) =>
  value !== null && value !== undefined && !Number.isNaN(value)

const isInternalRecordComplete = (
  record: ReadInternalMedRecordDto | null
): boolean =>
  !!record &&
  isNumberFilled(record.bloodPressure) &&
  isNumberFilled(record.heartRate) &&
  isNumberFilled(record.bloodSugar)

const isPediatricRecordComplete = (
  record: ReadPediatricRecordDto | null
): boolean =>
  !!record &&
  isNumberFilled(record.weightKg) &&
  isNumberFilled(record.heightCm) &&
  isNumberFilled(record.heartRate) &&
  isNumberFilled(record.temperatureC)

const isDermatologyRecordComplete = (
  record: ReadDermatologyRecordDto | null
): boolean =>
  !!record && !!record.resultSummary && record.resultSummary.trim().length > 0

const isPendingResult = (value: string | null | undefined) => {
  if (!value) return true
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return true
  return ["pending", "chờ", "đang chờ", "awaiting"].some((marker) =>
    trimmed.includes(marker)
  )
}

/* ===== Helpers đọc token & roles từ JWT ===== */
type JwtPayload = { [key: string]: any }

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded =
      base64.length % 4 === 0
        ? base64
        : base64.padEnd(base64.length + (4 - (base64.length % 4)), "=")
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function extractRoles(payload: JwtPayload | null): string[] {
  if (!payload) return []

  const raw =
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    payload["roles"] ??
    payload["role"]

  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.map((r) => String(r))
  }

  return String(raw)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
}

function getAccessTokenFromClient(): string | null {
  if (typeof window === "undefined") return null
  try {
    return (
      window.localStorage.getItem("accessToken") ??
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("access_token")
    )
  } catch {
    return null
  }
}

export default function NurseTestWorklistPage() {
  const navigation = getNurseNavigation()
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Guard state
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string>("")
  const [toastVariant, setToastVariant] = useState<"error" | "success">("error")

  const goBackSafely = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.replace("/")
    }
  }

  // === filter init
  const queryDate = sp.get("date")
  const defaultToday = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const [date, setDate] = useState<string>(queryDate ?? defaultToday)
  const [patientName, setPatientName] = useState<string>(
    sp.get("patientName") ?? ""
  )

  const queryRequiredState = sp.get("requiredState")
  const [requiredState, setRequiredState] = useState<RequiredState>(
    queryRequiredState === "Missing" ||
      queryRequiredState === "Complete" ||
      queryRequiredState === "All"
      ? (queryRequiredState as RequiredState)
      : "All"
  )

  const [pageNumber, setPageNumber] = useState<number>(
    Number(sp.get("page") ?? 1)
  )

  const queryPageSize = sp.get("pageSize")
  const [pageSize, setPageSize] = useState<number>(
    queryPageSize && !Number.isNaN(Number(queryPageSize))
      ? Number(queryPageSize)
      : 5 // mặc định 5 bản ghi để test
  )

  const [data, setData] = useState<PagedResult<TestWorklistItemDto> | null>(
    null
  )

  const [activityMap, setActivityMap] = useState<Record<number, RecordActivity>>(
    {}
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [openInternal, setOpenInternal] = useState(false)
  const [openPediatric, setOpenPediatric] = useState(false)
  const [openDermatology, setOpenDermatology] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null)

  // === thống kê pending / fulfilled
  const pendingCount = useMemo(() => {
    if (!data?.items) return 0
    return data.items.filter((it) => {
      const a = activityMap[it.recordId]
      if (!a) return true
      const needsInternal = a.hasInternal && !a.internalComplete
      const needsPediatric = a.hasPediatric && !a.pediatricComplete
      const needsDerm = a.hasDermatology && !a.dermatologyComplete
      const needsTests = a.testsRequested > 0 && !a.testsComplete
      return needsInternal || needsPediatric || needsDerm || needsTests
    }).length
  }, [data, activityMap])

  const fulfilledCount = useMemo(() => {
    const total = data?.items?.length ?? 0
    return Math.max(total - pendingCount, 0)
  }, [data, pendingCount])

  // === filter trạng thái bắt buộc trên FE
  const visibleItems = useMemo(() => {
    if (!data?.items) return []

    return data.items.filter((item) => {
      if (requiredState === "All") return true

      const a = activityMap[item.recordId]
      if (!a) return true // chưa có activity thì vẫn hiển thị

      const needsInternal = a.hasInternal && !a.internalComplete
      const needsPediatric = a.hasPediatric && !a.pediatricComplete
      const needsDerm = a.hasDermatology && !a.dermatologyComplete
      const needsTests = a.testsRequested > 0 && !a.testsComplete

      const isPending =
        needsInternal || needsPediatric || needsDerm || needsTests

      if (requiredState === "Missing") return isPending
      if (requiredState === "Complete") return !isPending
      return true
    })
  }, [data, activityMap, requiredState])

  const loadActivities = useCallback(async (items: TestWorklistItemDto[]) => {
    if (!items?.length) {
      setActivityMap({})
      return
    }

    const pairs = await Promise.all(
      items.map(async (it) => {
        const [internal, pediatric, derm, tests] = await Promise.all([
          getInternalMed(it.recordId).catch(() => null),
          getPediatric(it.recordId).catch(() => null),
          getDermatology(it.recordId).catch(
            () => null as ReadDermatologyRecordDto | null
          ),
          getTestResultsByRecord(it.recordId).catch(
            () => [] as ReadTestResultDto[]
          ),
        ])

        const pendingTests = tests.filter((t) =>
          isPendingResult(t.resultValue)
        )
        const entry: RecordActivity = {
          hasInternal: !!internal,
          internalComplete: isInternalRecordComplete(internal),
          hasPediatric: !!pediatric,
          pediatricComplete: isPediatricRecordComplete(pediatric),
          hasDermatology: !!derm,
          dermatologyComplete: isDermatologyRecordComplete(derm),
          testsRequested: tests.length,
          testsComplete: tests.length > 0 && pendingTests.length === 0,
        }

        return [it.recordId, entry] as const
      })
    )

    setActivityMap(Object.fromEntries(pairs))
  }, [])

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await getTestWorklist({
        date: date || null,
        patientName: patientName || null,
        pageNumber,
        pageSize,
      })

      setData(res)
      loadActivities(res.items ?? [])
    } catch (e: any) {
      console.error("Load worklist error:", e)
      const msg = e?.message ?? "Lỗi tải danh sách"

      // Nếu backend trả 401/403 thì coi như không có quyền / hết hạn
      if (msg === "UNAUTHORIZED" || /401|403/.test(msg)) {
        setToastVariant("error")
        setToastMsg(
          "Bạn không có quyền truy cập trang này hoặc trang không tồn tại."
        )
        setToastOpen(true)
        setTimeout(() => setToastOpen(false), 3000)
        goBackSafely()
        return
      }

      setError(msg)
      setToastVariant("error")
      setToastMsg(msg)
      setToastOpen(true)
      setTimeout(() => setToastOpen(false), 3000)
    } finally {
      setLoading(false)
    }
  }, [date, patientName, pageNumber, pageSize, loadActivities])

  // ---- Guard: kiểm tra token + role Nurse trước khi load dữ liệu ----
  useEffect(() => {
    const token = getAccessTokenFromClient()

    if (!token) {
      setToastVariant("error")
      setToastMsg(
        "Bạn không có quyền truy cập trang này hoặc trang không tồn tại."
      )
      setToastOpen(true)
      setTimeout(() => setToastOpen(false), 3000)
      setAuthChecked(true)
      setIsAuthorized(false)
      goBackSafely()
      return
    }

    const payload = decodeJwt(token)
    const roles = extractRoles(payload)

    if (!roles.includes("Nurse")) {
      setToastVariant("error")
      setToastMsg(
        "Bạn không có quyền truy cập trang này hoặc trang không tồn tại."
      )
      setToastOpen(true)
      setTimeout(() => setToastOpen(false), 3000)
      setAuthChecked(true)
      setIsAuthorized(false)
      goBackSafely()
      return
    }

    setIsAuthorized(true)
    setAuthChecked(true)
  }, [router])

  // Chỉ load data khi đã check xong và có quyền
  useEffect(() => {
    if (!authChecked || !isAuthorized) return
    reload()
  }, [authChecked, isAuthorized, reload])

  useEffect(() => {
    const q = new URLSearchParams()
    if (date) q.set("date", date)
    if (patientName) q.set("patientName", patientName)
    if (requiredState) q.set("requiredState", requiredState)
    q.set("page", String(pageNumber))
    q.set("pageSize", String(pageSize))

    router.replace(`${pathname}?${q.toString()}`, { scroll: false })
  }, [date, patientName, requiredState, pageNumber, pageSize, router, pathname])

  const items = data?.items ?? []
  const noVisibleItems =
    !loading && !error && visibleItems && visibleItems.length === 0

  // Chưa check xong quyền thì không render gì để tránh flicker
  if (!authChecked) {
    return null
  }

  // Nếu không được authorize thì guard đã redirect, ở đây trả null
  if (!isAuthorized) {
    return null
  }

  return (
    <>
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Danh sách bệnh nhân cần xét nghiệm / khám chuyên khoa
              </h1>
              <p className="text-muted-foreground">
                Lọc theo ngày, tên bệnh nhân và trạng thái kết quả
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Bộ lọc</CardTitle>
                <CardDescription>
                  Chọn tiêu chí để hiển thị danh sách phù hợp
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label>Ngày khám</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value)
                        setPageNumber(1)
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-200 hover:text-blue-900 transition-colors"
                      onClick={() => {
                        setDate("")
                        setPageNumber(1)
                      }}
                    >
                      Xem tất cả
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Để trống = xem tất cả ngày.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Tên bệnh nhân</Label>
                  <Input
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value)
                      setPageNumber(1)
                    }}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Trạng thái bắt buộc</Label>
                  <Select
                    value={requiredState}
                    onValueChange={(v) => {
                      setRequiredState(v as RequiredState)
                      setPageNumber(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Tất cả</SelectItem>
                      <SelectItem value="Missing">Còn việc</SelectItem>
                      <SelectItem value="Complete">Hoàn tất</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    <br />
                  </p>
                </div>
                <div className="flex items-end">
                  <p className="text-xs text-muted-foreground">
                    Danh sách tự động cập nhật khi thay đổi bộ lọc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Tổng bản ghi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.totalCount ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Còn việc Nội / Nhi / Da liễu / Xét nghiệm
                </CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Hoàn tất Nội / Nhi / Da liễu / Xét nghiệm
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fulfilledCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* List */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Danh sách</CardTitle>
              </div>
              <CardDescription>
                Trang {data?.pageNumber ?? 1} / {data?.totalPages ?? 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : noVisibleItems ? (
                <p className="text-sm text-muted-foreground">
                  Không có bản ghi nào.
                </p>
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleItems.map((item) => {
                      const activity = activityMap[item.recordId]
                      const showInternal = !!activity?.hasInternal
                      const showPediatric = !!activity?.hasPediatric
                      const showDermatology = !!activity?.hasDermatology
                      const showTests = (activity?.testsRequested ?? 0) > 0
                      const specialtyLoaded = activity !== undefined
                      const status: CombinedStatusSnapshot | undefined =
                        activity
                          ? {
                              hasInternal: activity.hasInternal,
                              internalComplete: activity.internalComplete,
                              hasPediatric: activity.hasPediatric,
                              pediatricComplete: activity.pediatricComplete,
                              hasDermatology: activity.hasDermatology,
                              dermatologyComplete: activity.dermatologyComplete,
                              testsRequested: activity.testsRequested,
                              testsComplete: activity.testsComplete,
                            }
                          : undefined

                      return (
                        <div
                          key={item.recordId}
                          className="flex items-start justify-between rounded-xl border p-4"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">
                                {item.patientName}
                              </span>
                              {/* <Badge variant="outline">#{item.patientId}</Badge> */}
                              <CombinedStatusPill status={status} />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Lịch:{" "}
                              {new Date(
                                item.appointmentDate
                              ).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {specialtyLoaded ? (
                              <>
                                {showInternal && (
                                  <Button
                                    variant="secondary"
                                    className="border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-200 hover:text-blue-900"
                                    onClick={() => {
                                      setSelectedRecord(item.recordId)
                                      setOpenInternal(true)
                                    }}
                                  >
                                    <Stethoscope className="mr-2 h-4 w-4" />
                                    Điền Nội khoa
                                  </Button>
                                )}

                                {showPediatric && (
                                  <Button
                                    variant="secondary"
                                    className="border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-900"
                                    onClick={() => {
                                      setSelectedRecord(item.recordId)
                                      setOpenPediatric(true)
                                    }}
                                  >
                                    <Baby className="mr-2 h-4 w-4" />
                                    Điền Nhi khoa
                                  </Button>
                                )}

                                {showDermatology && (
                                  <Button
                                    variant="secondary"
                                    className="border border-pink-100 bg-pink-50 text-pink-700 hover:bg-pink-200 hover:text-pink-900"
                                    onClick={() => {
                                      setSelectedRecord(item.recordId)
                                      setOpenDermatology(true)
                                    }}
                                  >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Điền Da liễu
                                  </Button>
                                )}

                                {showTests && (
                                  <Button
                                    variant="default"
                                    className="border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-300 hover:text-emerald-950"
                                    onClick={() => {
                                      setSelectedRecord(item.recordId)
                                      setDialogOpen(true)
                                    }}
                                  >
                                    Điền kết quả xét nghiệm
                                  </Button>
                                )}

                                {!showInternal &&
                                  !showPediatric &&
                                  !showDermatology &&
                                  !showTests && (
                                    <span className="text-xs italic text-muted-foreground">
                                      Bác sĩ chưa gửi yêu cầu Nội / Nhi / Da
                                      liễu / Xét nghiệm cho bản ghi này.
                                    </span>
                                  )}
                              </>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />{" "}
                                Đang kiểm tra chuyên khoa…
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-xs text-muted-foreground">
                      Hiển thị{" "}
                      {items.length === 0
                        ? 0
                        : (data!.pageNumber - 1) * pageSize + 1}
                      {"–"}
                      {(data!.pageNumber - 1) * pageSize + items.length}{" "}
                      trên {data?.totalCount ?? 0}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">
                          Bản ghi / trang:
                        </span>
                        <Select
                          value={String(pageSize)}
                          onValueChange={(val) => {
                            const size = Number(val) || 5
                            setPageSize(size)
                            setPageNumber(1)
                          }}
                        >
                          <SelectTrigger className="h-8 w-[90px]">
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

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={!data?.hasPrevious}
                          onClick={() =>
                            setPageNumber((p) => Math.max(p - 1, 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-2 text-xs text-muted-foreground">
                          Trang {data?.pageNumber ?? 1} / {data?.totalPages ?? 1}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={!data?.hasNext}
                          onClick={() =>
                            setPageNumber((p) =>
                              data?.totalPages
                                ? Math.min(p + 1, data.totalPages)
                                : p + 1
                            )
                          }
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <TestResultDialog
            open={dialogOpen}
            onOpenChange={(v) => {
              setDialogOpen(v)
              if (!v) reload()
            }}
            recordId={selectedRecord ?? 0}
          />

          <InternalMedDialog
            open={openInternal}
            onOpenChange={setOpenInternal}
            recordId={selectedRecord ?? 0}
            onSaved={reload}
          />

          <PediatricDialog
            open={openPediatric}
            onOpenChange={setOpenPediatric}
            recordId={selectedRecord ?? 0}
            onSaved={reload}
          />

          <DermatologyDialog
            open={openDermatology}
            onOpenChange={setOpenDermatology}
            recordId={selectedRecord ?? 0}
            onSaved={reload}
          />
        </div>
      </DashboardLayout>

      {/* Toast đơn giản */}
      {toastOpen && (
        <div
          className={`fixed bottom-6 right-6 z-[200] flex max-w-sm flex-col gap-1 rounded-md px-4 py-3 shadow-md ${
            toastVariant === "error"
              ? "border border-red-200 bg-red-50 text-red-900"
              : "border border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span className="font-semibold">
            {toastVariant === "error" ? "Lỗi" : "Thành công"}
          </span>
          {toastMsg && <span className="text-sm">{toastMsg}</span>}
        </div>
      )}
    </>
  )
}
