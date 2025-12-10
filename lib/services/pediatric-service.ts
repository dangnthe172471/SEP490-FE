import type {
  ReadPediatricRecordDto,
  CreatePediatricRecordDto,
  UpdatePediatricRecordDto,
} from "@/lib/types/specialties"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.diamondhealth.io.vn"

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
    ;(base as any).Authorization = `Bearer ${token}`
  }
  return { ...base, ...extra }
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

const BASE_PATH = "/api/PediatricRecords"

export async function getPediatric(
  recordId: number
): Promise<ReadPediatricRecordDto | null> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    cache: "no-store",
    headers: authHeaders(),
  })
  if (res.status === 404) return null
  return toJson<ReadPediatricRecordDto>(res)
}

export async function createPediatric(
  dto: CreatePediatricRecordDto
): Promise<ReadPediatricRecordDto> {
  const res = await fetch(api(BASE_PATH), {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadPediatricRecordDto>(res)
}

export async function updatePediatric(
  recordId: number,
  dto: UpdatePediatricRecordDto
): Promise<ReadPediatricRecordDto> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadPediatricRecordDto>(res)
}

export async function deletePediatric(recordId: number): Promise<void> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    method: "DELETE",
    cache: "no-store",
    headers: authHeaders(),
  })
  await toJson<void>(res)
}
