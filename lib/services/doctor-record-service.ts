// /lib/services/doctor-records-service.ts
import type { PagedResult, RecordListItemDto } from "@/lib/types/doctor-record"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""

const ENV_MISSING_MSG =
  "Thiếu biến môi trường: hãy đặt NEXT_PUBLIC_API_BASE_URL (hoặc NEXT_PUBLIC_API_URL) trong .env.local."

function getAccessTokenFromClient(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const fromLS =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("access_token") ??
      undefined
    if (fromLS) return fromLS

    const cookieName = (n: string) =>
      document.cookie?.split("; ")?.find((c) => c.startsWith(`${n}=`))
    const authCookie = cookieName("auth_token")
    const accCookie = cookieName("access_token")
    if (authCookie) return decodeURIComponent(authCookie.split("=")[1])
    if (accCookie) return decodeURIComponent(accCookie.split("=")[1])
    return undefined
  } catch {
    return undefined
  }
}

async function ensureOk(res: Response) {
  if (res.ok) return
  const text = await res.text()
  const msg = text || `HTTP ${res.status}`
  if (res.status === 401 || res.status === 403) {
    const err = new Error("UNAUTHORIZED")
    ;(err as any).detail = msg
    throw err
  }
  throw new Error(msg)
}

export async function getDoctorRecords(params: {
  pageNumber?: number
  pageSize?: number
  from?: string   // yyyy-MM-dd
  to?: string     // yyyy-MM-dd
  search?: string
  token?: string
}): Promise<PagedResult<RecordListItemDto>> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG)

  const q = new URLSearchParams()
  q.set("pageNumber", String(params.pageNumber ?? 1))
  q.set("pageSize", String(params.pageSize ?? 10))
  if (params.from) q.set("from", params.from)
  if (params.to) q.set("to", params.to)
  if (params.search) q.set("search", params.search)

  const token = params.token ?? getAccessTokenFromClient()

  const res = await fetch(
    `${BASE_URL}/api/PrescriptionsDoctor/records?${q.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    }
  )

  await ensureOk(res)
  const raw = await res.json()

  // Chuẩn hoá cả camelCase & PascalCase
  const items: RecordListItemDto[] = (raw.items ?? raw.Items ?? []).map((r: any) => ({
    recordId: r.recordId ?? r.RecordId,
    appointmentId: r.appointmentId ?? r.AppointmentId,
    visitAt: r.visitAt ?? r.VisitAt, // ISO string
    patientId: r.patientId ?? r.PatientId,
    patientName: r.patientName ?? r.PatientName,
    gender: r.gender ?? r.Gender ?? null,
    dob: r.dob ?? r.Dob ?? null,
    phone: r.phone ?? r.Phone ?? null,
    diagnosisRaw: r.diagnosisRaw ?? r.DiagnosisRaw ?? null,
    hasPrescription: r.hasPrescription ?? r.HasPrescription ?? false,
    latestPrescriptionId: r.latestPrescriptionId ?? r.LatestPrescriptionId ?? null,
  }))

  return {
    items,
    pageNumber: raw.pageNumber ?? raw.PageNumber ?? 1,
    pageSize: raw.pageSize ?? raw.PageSize ?? 10,
    totalCount: raw.totalCount ?? raw.TotalCount ?? 0,
    totalPages: raw.totalPages ?? raw.TotalPages ?? Math.ceil((raw.totalCount ?? 0) / (raw.pageSize ?? 10)),
    hasPrevious: raw.hasPrevious ?? raw.HasPrevious ?? false,
    hasNext: raw.hasNext ?? raw.HasNext ?? false,
  }
}