"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Loader2, ClipboardList, Filter, CheckCircle2, XCircle } from "lucide-react"
import { getNurseNavigation } from "@/lib/navigation/nurse-navigation"
import { getTestWorklist } from "@/lib/services/test-results-service"
import type { PagedResult, TestWorklistItemDto, RequiredState } from "@/lib/types/test-results"
import { TestResultDialog } from "@/components/test-result-dialog"

// 🔑 THÊM: Provider + Viewport từ Radix Toast (file toast.tsx của bạn)
import { Toast, ToastTitle, ToastDescription, ToastProvider, ToastViewport } from "@/components/ui/toast"

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

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null)

  // toast (Radix)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string>("")

  const pendingCount = useMemo(() => {
    if (!data?.items) return 0
    return data.items.filter(i => !i.hasAllRequiredResults).length
  }, [data])

  useEffect(() => {
    let mounted = true
    async function load() {
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
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        const msg = e?.message ?? "Lỗi tải danh sách"
        setError(msg)
        setToastMsg(msg)
        setToastOpen(false)
        setTimeout(() => setToastOpen(true), 10)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [date, patientName, requiredState, pageNumber, pageSize])

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
    // 🔑 BỌC CỤC BỘ: chỉ trong page này, không đụng layout
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
                <CardTitle className="text-sm font-medium">Thiếu kết quả</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đã đủ kết quả</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.max((data?.items?.length ?? 0) - pendingCount, 0)}
                </div>
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
                  {data!.items.map(item => (
                    <div key={item.recordId} className="flex items-start justify-between border rounded-xl p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.patientName}</span>
                          <Badge variant="outline">#{item.patientId}</Badge>
                          {item.hasAllRequiredResults
                            ? <Badge variant="secondary">Đủ kết quả</Badge>
                            : <Badge variant="destructive">Thiếu</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Lịch: {new Date(item.appointmentDate).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRecord(item.recordId)
                            setDialogOpen(true)
                          }}
                        >
                          Điền kết quả
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog nhập nhanh */}
          <TestResultDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            recordId={selectedRecord ?? 0}
          />
        </div>

        {/* Toast lỗi tải (Radix) */}
        <Toast open={toastOpen} onOpenChange={setToastOpen} variant="destructive">
          <ToastTitle>Lỗi tải danh sách</ToastTitle>
          {toastMsg ? <ToastDescription>{toastMsg}</ToastDescription> : null}
        </Toast>

        {/* 🔑 Viewport đặt CUỐI cùng trong page */}
        <ToastViewport />
      </DashboardLayout>
    </ToastProvider>
  )
}