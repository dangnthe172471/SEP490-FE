import type {
  PagedResult,
  TestWorklistItemDto,
  RequiredState,
  ReadTestResultDto,
  TestTypeLite,
} from "@/lib/types/test-results"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.diamondhealth.io.vn"

function getAccessToken(): string | null {
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

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken()
  const base: HeadersInit = {
    Accept: "application/json",
  }
  if (token) {
    ; (base as any).Authorization = `Bearer ${token}`
  }
  return { ...base, ...extra }
}

export type GetWorklistParams = {
  date?: string | null
  patientName?: string | null
  requiredState?: RequiredState
  pageNumber?: number
  pageSize?: number
}

export async function getTestWorklist(
  params: GetWorklistParams
): Promise<PagedResult<TestWorklistItemDto>> {
  const url = new URL("/api/TestResults/worklist", API_BASE)
  if (params.date) url.searchParams.set("date", params.date)
  if (params.patientName)
    url.searchParams.set("patientName", params.patientName)
  url.searchParams.set("requiredState", params.requiredState ?? "All")
  url.searchParams.set("pageNumber", String(params.pageNumber ?? 1))
  url.searchParams.set("pageSize", String(params.pageSize ?? 20))

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Worklist failed (${res.status})`)
  }
  return res.json()
}

export async function getTestTypes(): Promise<TestTypeLite[]> {
  const res = await fetch(`${API_BASE}/api/TestResults/types`, {
    cache: "no-store",
    headers: authHeaders(),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Load types failed (${res.status})`)
  }
  return res.json()
}

export async function getTestResultsByRecord(
  recordId: number
): Promise<ReadTestResultDto[]> {
  const res = await fetch(`${API_BASE}/api/TestResults/record/${recordId}`, {
    cache: "no-store",
    headers: authHeaders(),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Load record results failed (${res.status})`)
  }
  return res.json()
}

export type CreateTestResultDto = {
  recordId: number
  testTypeId: number
  resultValue: string
  unit?: string | null
  attachment?: string | null
  resultDate?: string | null // ISO
  notes?: string | null
}

export async function createTestResult(
  body: CreateTestResultDto
): Promise<ReadTestResultDto> {
  const res = await fetch(`${API_BASE}/api/TestResults`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Create result failed (${res.status})`)
  }
  return res.json()
}

export type UpdateTestResultDto = {
  resultValue?: string | null
  unit?: string | null
  attachment?: string | null
  resultDate?: string | null // ISO
  notes?: string | null
}

export async function updateTestResult(
  id: number,
  body: UpdateTestResultDto
): Promise<ReadTestResultDto> {
  const res = await fetch(`${API_BASE}/api/TestResults/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Update result failed (${res.status})`)
  }
  return res.json()
}

export async function deleteTestResult(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/TestResults/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Delete result failed (${res.status})`)
  }
}

export async function hasAnyTestResult(recordId: number): Promise<boolean> {
  const list = await getTestResultsByRecord(recordId)
  return (list?.length ?? 0) > 0
}
