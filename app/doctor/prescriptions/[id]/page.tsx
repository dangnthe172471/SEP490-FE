"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Printer, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import type { PrescriptionSummaryDto } from "@/lib/types/prescription-doctor"
import { getPrescriptionById } from "@/lib/services/prescription-doctor-service"
import { RoleGuard } from "@/components/role-guard"

export default function PrescriptionDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<PrescriptionSummaryDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const goBackSafely = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.replace("/")
    }
  }

  // ===== Load đơn thuốc (RoleGuard chặn Doctor ở bên ngoài) =====
  useEffect(() => {
    if (!id) return

    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getPrescriptionById(Number(id))
        if (mounted) setData(res)
      } catch (e: any) {
        const msg = e?.message ?? "Không thể tải đơn thuốc"

        if (msg === "UNAUTHORIZED" || /401|403/.test(String(msg))) {
          // alert(
          //   "Bạn không có quyền truy cập trang này hoặc trang không tồn tại."
          // )
          goBackSafely()
          return
        }

        if (mounted) setError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, authChecked, isAuthorized])

  const issuedAtStr = useMemo(() => {
    if (!data?.issuedDate) return "-"
    try {
      return format(new Date(data.issuedDate), "dd/MM/yyyy HH:mm", { locale: vi })
    } catch {
      return data.issuedDate
    }
  }, [data])

  const patientDobStr = useMemo(() => {
    const s = data?.patient?.dob
    if (!s) return "-"
    try {
      return format(new Date(s), "dd/MM/yyyy", { locale: vi })
    } catch {
      return s
    }
  }, [data])

  const genderText = useMemo(() => {
    const g = data?.patient?.gender
    if (!g) return "-"
    return g === "M" ? "Nam" : g === "F" ? "Nữ" : g
  }, [data])

  const printPage = () => window.print()

  return (
    <RoleGuard allowedRoles="doctor">
    <main className="min-h-screen bg-background p-4 md:p-6 print:p-0">
      <div className="max-w-5xl mx-auto">
        {/* ACTION BAR (ẩn khi in) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={printPage}>
              <Printer className="w-4 h-4 mr-2" /> In đơn
            </Button>
          </div>
        </div>

        <Card className="shadow print:shadow-none print:border-0 print:rounded-none">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : !data ? (
            <div className="p-6 text-muted-foreground">Không có dữ liệu</div>
          ) : (
            <>
              {/* HEADER */}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold tracking-wide">
                  ĐƠN THUỐC
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ngày kê: {issuedAtStr}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* THÔNG TIN BN / BS */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="font-semibold">Thông tin bệnh nhân</div>
                    <InfoRow label="Họ tên" value={data.patient.name} />
                    <InfoRow label="Giới tính" value={genderText} />
                    <InfoRow label="Ngày sinh" value={patientDobStr} />
                    <InfoRow
                      label="Số điện thoại"
                      value={data.patient.phone ?? "-"}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold">Thông tin bác sĩ</div>
                    <InfoRow label="Họ tên" value={data.doctor.name} />
                    <InfoRow
                      label="Chuyên khoa"
                      value={data.doctor.specialty ?? "-"}
                    />
                    <InfoRow
                      label="Số điện thoại"
                      value={data.doctor.phone ?? "-"}
                    />
                    <InfoRow
                      label="Mã đơn"
                      value={String(data.prescriptionId)}
                    />
                  </div>
                </section>

                {/* CHẨN ĐOÁN */}
                {(data.diagnosis?.code || data.diagnosis?.text) && (
                  <section>
                    <div className="font-semibold mb-2">Chẩn đoán</div>
                    <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
                      {data.diagnosis?.code && (
                        <>
                          <div className="text-muted-foreground">Mã</div>
                          <div>{data.diagnosis.code}</div>
                        </>
                      )}
                      {data.diagnosis?.text && (
                        <>
                          <div className="text-muted-foreground">Nội dung</div>
                          <div>{data.diagnosis.text}</div>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {/* GHI CHÚ ĐƠN (NẾU CÓ) */}
                {data.notes && data.notes.trim() !== "" && (
                  <section>
                    <div className="font-semibold mb-1">
                      Ghi chú đơn thuốc
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {data.notes}
                    </p>
                  </section>
                )}

                <Separator />

                {/* BẢNG THUỐC ĐIỀU TRỊ */}
                <section>
                  <div className="font-semibold mb-3">Thuốc điều trị</div>
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm print:text-[12px]">
                      <thead>
                        <tr className="bg-muted">
                          <Th>STT</Th>
                          <Th>Tên thuốc</Th>
                          <Th>Nhà cung cấp</Th>
                          <Th>Cách dùng (Dosage)</Th>
                          <Th>Thời gian (Duration)</Th>
                          <Th>Hướng dẫn</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((it, idx) => (
                          <tr
                            key={it.prescriptionDetailId}
                            className="border-t"
                          >
                            <Td className="text-center w-12">{idx + 1}</Td>

                            <Td className="font-medium">
                              <div>{it.medicineName}</div>
                              {(it.activeIngredient ||
                                it.strength ||
                                it.dosageForm ||
                                it.route) && (
                                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                  {it.activeIngredient && (
                                    <div>Hoạt chất: {it.activeIngredient}</div>
                                  )}
                                  {(it.strength ||
                                    it.dosageForm ||
                                    it.route) && (
                                    <div>
                                      {it.strength && `${it.strength} · `}
                                      {it.dosageForm ?? ""}{" "}
                                      {it.route ? `(${it.route})` : ""}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Td>

                            <Td>
                              {it.providerName ?? "-"}
                              {it.providerContact && (
                                <div className="text-xs text-muted-foreground">
                                  {it.providerContact}
                                </div>
                              )}
                            </Td>

                            <Td className="whitespace-pre-wrap">
                              {it.dosage}
                            </Td>
                            <Td>{it.duration ?? "-"}</Td>
                            <Td className="whitespace-pre-wrap">
                              {it.instruction ?? "-"}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* CHỮ KÝ BÁC SĨ */}
                <section className="grid grid-cols-2 mt-8 print:mt-6">
                  <div />
                  <div className="text-center">
                    <div className="text-sm italic text-muted-foreground">
                      Bác sĩ kê đơn
                    </div>
                    <div className="h-16" />
                    <div className="font-semibold">{data.doctor.name}</div>
                  </div>
                </section>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
          }
          header,
          nav,
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </main>
    </RoleGuard>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border px-3 py-2 text-left">{children}</th>
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-3 py-2 align-top ${className ?? ""}`}>{children}</td>
}
