import type {
  ReadInternalMedRecordDto,
  CreateInternalMedRecordDto,
  UpdateInternalMedRecordDto,
  SpecialtyStatus,
} from "@/lib/types/specialties"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.https://api.diamondhealth.io.vn"

function api(path: string) {
  return `${API_BASE}${path}`
}

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

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Request failed (${res.status})`)
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

const BASE_PATH = "/api/InternalMedRecords"

export async function getInternalMed(
  recordId: number
): Promise<ReadInternalMedRecordDto | null> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    cache: "no-store",
    headers: authHeaders(),
  })
  if (res.status === 404) return null
  return toJson<ReadInternalMedRecordDto>(res)
}

export async function createInternalMed(
  dto: CreateInternalMedRecordDto
): Promise<ReadInternalMedRecordDto> {
  const res = await fetch(api(BASE_PATH), {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadInternalMedRecordDto>(res)
}

export async function updateInternalMed(
  recordId: number,
  dto: UpdateInternalMedRecordDto
): Promise<ReadInternalMedRecordDto> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadInternalMedRecordDto>(res)
}

export async function deleteInternalMed(recordId: number): Promise<void> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    method: "DELETE",
    cache: "no-store",
    headers: authHeaders(),
  })
  await toJson<void>(res)
}

export async function getSpecialtyStatus(
  recordId: number
): Promise<SpecialtyStatus> {
  const res = await fetch(api(`${BASE_PATH}/status/${recordId}`), {
    cache: "no-store",
    headers: authHeaders(),
  })
  return toJson<SpecialtyStatus>(res)
}
