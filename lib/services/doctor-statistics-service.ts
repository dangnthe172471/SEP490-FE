import {
  DoctorPatientCountDto,
  DoctorVisitTrendPointDto,
  DoctorReturnRateDto,
  DoctorStatisticsSummaryDto,
} from "@/lib/types/doctor-statistics"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""

const ENV_MISSING_MSG =
  "Thiếu biến môi trường: hãy đặt NEXT_PUBLIC_API_URL_URL (hoặc NEXT_PUBLIC_API_URL) trỏ tới API .NET trong .env.local."

function getAccessTokenFromClient(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const fromLS =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("access_token") ??
      undefined
    if (fromLS) return fromLS

    const cookie = (name: string) =>
      document.cookie
        ?.split("; ")
        ?.find((c) => c.startsWith(`${name}=`))
    const authCookie = cookie("auth_token")
    const accCookie = cookie("access_token")
    if (authCookie) return decodeURIComponent(authCookie.split("=")[1])
    if (accCookie) return decodeURIComponent(accCookie.split("=")[1])
    return undefined
  } catch {
    return undefined
  }
}

async function ensureOk(res: Response) {
  if (res.ok) return
  const text = await res.text().catch(() => "")
  const msg = text || `HTTP ${res.status}`
  if (res.status === 401 || res.status === 403) {
    const err = new Error("UNAUTHORIZED")
    ;(err as any).detail = msg
    throw err
  }
  throw new Error(msg)
}

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      q.append(k, String(v))
    }
  })
  const s = q.toString()
  return s ? `?${s}` : ""
}

type FetchOpts = { token?: string; doctorId?: number }

export async function getDoctorPatientCount(
  fromDate: string,
  toDate: string,
  opts?: FetchOpts
): Promise<DoctorPatientCountDto[]> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG)
  const token = opts?.token ?? getAccessTokenFromClient()

  const query = buildQuery({ fromDate, toDate })
  const res = await fetch(`${BASE_URL}/api/DoctorStatistics/patient-count${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })

  await ensureOk(res)
  return (await res.json()) as DoctorPatientCountDto[]
}

export async function getDoctorVisitTrend(
  fromDate: string,
  toDate: string,
  opts?: FetchOpts
): Promise<DoctorVisitTrendPointDto[]> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG)
  const token = opts?.token ?? getAccessTokenFromClient()

  const query = buildQuery({ fromDate, toDate, doctorId: opts?.doctorId })
  const res = await fetch(`${BASE_URL}/api/DoctorStatistics/visit-trend${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })

  await ensureOk(res)
  // backend trả date dạng ISO string, giữ nguyên, FE convert khi vẽ chart
  return (await res.json()) as DoctorVisitTrendPointDto[]
}

export async function getDoctorReturnRates(
  fromDate: string,
  toDate: string,
  opts?: FetchOpts
): Promise<DoctorReturnRateDto[]> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG)
  const token = opts?.token ?? getAccessTokenFromClient()

  const query = buildQuery({ fromDate, toDate })
  const res = await fetch(`${BASE_URL}/api/DoctorStatistics/return-rate${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })

  await ensureOk(res)
  return (await res.json()) as DoctorReturnRateDto[]
}

export async function getDoctorStatisticsSummary(
  fromDate: string,
  toDate: string,
  opts?: FetchOpts
): Promise<DoctorStatisticsSummaryDto> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG)
  const token = opts?.token ?? getAccessTokenFromClient()

  const query = buildQuery({ fromDate, toDate, doctorId: opts?.doctorId })
  const res = await fetch(`${BASE_URL}/api/DoctorStatistics/summary${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })

  await ensureOk(res)
  return (await res.json()) as DoctorStatisticsSummaryDto
}
