"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Loader2, ClipboardList, Filter, CheckCircle2, XCircle, Stethoscope, Baby } from "lucide-react"
import { getNurseNavigation } from "@/lib/navigation/nurse-navigation"
import { getTestWorklist } from "@/lib/services/test-results-service"
import type { PagedResult, TestWorklistItemDto, RequiredState } from "@/lib/types/test-results"
import { TestResultDialog } from "@/components/test-result-dialog"

// Toast (Radix)
import { Toast, ToastTitle, ToastDescription, ToastProvider, ToastViewport } from "@/components/ui/toast"

// NEW: trạng thái 3 mảng (Nội/Nhi/XN)
import { CombinedStatusPill, type CombinedStatusSnapshot } from "@/components/combined-status-pill"
import { InternalMedDialog } from "@/components/internal-med-dialog"
import { PediatricDialog } from "@/components/pediatric-dialog"

import { getInternalMed } from "@/lib/services/internal-med-service"
import { getPediatric } from "@/lib/services/pediatric-service"
import type { ReadInternalMedRecordDto, ReadPediatricRecordDto } from "@/lib/types/specialties"

type RecordActivity = {
  hasInternal: boolean
  internalComplete: boolean
  hasPediatric: boolean
  pediatricComplete: boolean
}

const isNumberFilled = (value: number | null | undefined) =>
  value !== null && value !== undefined && !Number.isNaN(value)

const isInternalRecordComplete = (record: ReadInternalMedRecordDto | null): boolean =>
  !!record &&
  isNumberFilled(record.bloodPressure) &&
  isNumberFilled(record.heartRate) &&
  isNumberFilled(record.bloodSugar)

const isPediatricRecordComplete = (record: ReadPediatricRecordDto | null): boolean =>
  !!record &&
  isNumberFilled(record.weightKg) &&
  isNumberFilled(record.heightCm) &&
  isNumberFilled(record.heartRate) &&
  isNumberFilled(record.temperatureC)

export default function NurseTestWorklistPage() {
  const navigation = getNurseNavigation()
  const router = useRouter()
  const sp = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [date, setDate] = useState<string>(sp.get("date") ?? "")
  const [patientName, setPatientName] = useState<string>(sp.get("patientName") ?? "")
  const [requiredState, setRequiredState] = useState<RequiredState>((sp.get("requiredState") as RequiredState) ?? "All")

  // data
  const [pageNumber, setPageNumber] = useState<number>(Number(sp.get("page") ?? 1))
  const [pageSize] = useState<number>(20)
  const [data, setData] = useState<PagedResult<TestWorklistItemDto> | null>(null)

  // activities map cho từng record
  const [activityMap, setActivityMap] = useState<Record<number, RecordActivity>>({})

  // dialogs
  const [dialogOpen, setDialogOpen] = useState(false) // xét nghiệm
  const [openInternal, setOpenInternal] = useState(false) // nội
  const [openPediatric, setOpenPediatric] = useState(false) // nhi
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null)

  // toast (Radix)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string>("")

  // === Đếm số bệnh nhân còn thiếu thông tin Nội/Nhi/XN
  const pendingCount = useMemo(() => {
    if (!data?.items) return 0
    return data.items.filter(it => {
      const a = activityMap[it.recordId]
      if (!a) return true
      const needsInternal = a.hasInternal && !a.internalComplete
      const needsPediatric = a.hasPediatric && !a.pediatricComplete
      const needsTests = !it.hasAllRequiredResults
      return needsInternal || needsPediatric || needsTests
    }).length
  }, [data, activityMap])

  const fulfilledCount = useMemo(() => {
    const total = data?.items?.length ?? 0
    return Math.max(total - pendingCount, 0)
  }, [data, pendingCount])

  const loadActivities = useCallback(async (items: TestWorklistItemDto[]) => {
    if (!items?.length) {
      setActivityMap({})
      return
    }

    const pairs = await Promise.all(items.map(async (it) => {
      const [internal, pediatric] = await Promise.all([
        getInternalMed(it.recordId).catch(() => null),
        getPediatric(it.recordId).catch(() => null),
      ])

      const entry: RecordActivity = {
        hasInternal: !!internal,
        internalComplete: isInternalRecordComplete(internal),
        hasPediatric: !!pediatric,
        pediatricComplete: isPediatricRecordComplete(pediatric),
      }

      return [it.recordId, entry] as const
    }))

    setActivityMap(Object.fromEntries(pairs))
  }, [])

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getTestWorklist({
        date: date || null,
        patientName: patientName || null,
        requiredState,
        pageNumber,
        pageSize,
      })
      setData(res)
      // load trạng thái 3 mảng cho danh sách hiện tại
      loadActivities(res.items ?? [])
    } catch (e: any) {
      const msg = e?.message ?? "Lỗi tải danh sách"
      setError(msg)
      setToastMsg(msg)
      setToastOpen(false)
      setTimeout(() => setToastOpen(true), 10)
    } finally {
      setLoading(false)
    }
  }, [date, patientName, requiredState, pageNumber, pageSize, loadActivities])

  useEffect(() => {
    let mounted = true
    ;(async () => { await reload() })()
    return () => { mounted = false }
  }, [reload])

  const applyFilters = () => {
    const q = new URLSearchParams()
    if (date) q.set("date", date)
    if (patientName) q.set("patientName", patientName)
    if (requiredState) q.set("requiredState", requiredState)
    q.set("page", String(1))
    router.replace(`/nurse/tests/worklist?${q.toString()}`)
    setPageNumber(1)
  }

  return (
    <ToastProvider swipeDirection="right" duration={3000}>
      <DashboardLayout navigation={navigation}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Danh sách bệnh nhân cần xét nghiệm</h1>
              <p className="text-muted-foreground">Lọc theo ngày, tên bệnh nhân và trạng thái kết quả</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Bộ lọc</CardTitle>
                <CardDescription>Chọn tiêu chí để hiển thị danh sách phù hợp</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Ngày khám</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Tên bệnh nhân</Label>
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="VD: Nguyễn Văn A" />
                </div>
                <div className="space-y-1">
                  <Label>Trạng thái bắt buộc</Label>
                  <Select value={requiredState} onValueChange={(v: RequiredState) => setRequiredState(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Tất cả</SelectItem>
                      <SelectItem value="Missing">Thiếu</SelectItem>
                      <SelectItem value="Complete">Đủ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={applyFilters}>
                    <Filter className="mr-2 h-4 w-4" /> Áp dụng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium">Tổng bản ghi</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{data?.totalCount ?? 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Còn việc Nội/Nhi/XN</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hoàn tất Nội/Nhi/XN</CardTitle>
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
              ) : (data?.items?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Không có bản ghi nào.</p>
              ) : (
                <div className="space-y-3">
                  {data!.items.map(item => {
                    const activity = activityMap[item.recordId]
                    const showInternal = !!activity?.hasInternal
                    const showPediatric = !!activity?.hasPediatric
                    const specialtyLoaded = activity !== undefined
                    const status: CombinedStatusSnapshot | undefined = activity
                      ? {
                          hasInternal: activity.hasInternal,
                          internalComplete: activity.internalComplete,
                          hasPediatric: activity.hasPediatric,
                          pediatricComplete: activity.pediatricComplete,
                          testsComplete: item.hasAllRequiredResults,
                        }
                      : undefined

                    return (
                      <div key={item.recordId} className="flex items-start justify-between border rounded-xl p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{item.patientName}</span>
                            <Badge variant="outline">#{item.patientId}</Badge>

                            <CombinedStatusPill status={status} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Lịch: {new Date(item.appointmentDate).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {specialtyLoaded ? (
                            <>
                              {showInternal ? (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRecord(item.recordId)
                                    setOpenInternal(true)
                                  }}
                                >
                                  <Stethoscope className="mr-2 h-4 w-4" /> Khám Nội
                                </Button>
                              ) : null}

                              {showPediatric ? (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRecord(item.recordId)
                                    setOpenPediatric(true)
                                  }}
                                >
                                  <Baby className="mr-2 h-4 w-4" /> Khám Nhi
                                </Button>
                              ) : null}

                              {!showInternal && !showPediatric ? (
                                <span className="text-xs text-muted-foreground italic">
                                  Chưa có hồ sơ Nội/Nhi để cập nhật
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> Đang kiểm tra chuyên khoa…
                            </span>
                          )}

                          <Button
                            variant="default"
                            onClick={() => {
                              setSelectedRecord(item.recordId)
                              setDialogOpen(true)
                            }}
                          >
                            Điền xét nghiệm
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog nhập nhanh xét nghiệm */}
          <TestResultDialog
            open={dialogOpen}
            onOpenChange={(v) => {
              setDialogOpen(v)
              if (!v) reload()
            }}
            recordId={selectedRecord ?? 0}
          />

          {/* Dialog Nội khoa */}
          <InternalMedDialog
            open={openInternal}
            onOpenChange={setOpenInternal}
            recordId={selectedRecord ?? 0}
            onSaved={reload}
          />

          {/* Dialog Nhi khoa */}
          <PediatricDialog
            open={openPediatric}
            onOpenChange={setOpenPediatric}
            recordId={selectedRecord ?? 0}
            onSaved={reload}
          />
        </div>

        {/* Toast lỗi tải (Radix) */}
        <Toast open={toastOpen} onOpenChange={setToastOpen} variant="destructive">
          <ToastTitle>Lỗi tải danh sách</ToastTitle>
          {toastMsg ? <ToastDescription>{toastMsg}</ToastDescription> : null}
        </Toast>

        {/* Viewport đặt cuối */}
        <ToastViewport />
      </DashboardLayout>
    </ToastProvider>
  )
}
