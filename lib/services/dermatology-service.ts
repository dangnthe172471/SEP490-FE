import type {
  ReadDermatologyRecordDto,
  CreateDermatologyRecordDto,
  UpdateDermatologyRecordDto,
} from "@/lib/types/specialties"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://localhost:7168"

function api(path: string) {
  return `${API_BASE}${path}`
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(txt || `Request failed (${res.status})`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

const BASE_PATH = "/api/DermatologyRecords"

export async function getDermatology(
  recordId: number
): Promise<ReadDermatologyRecordDto | null> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    cache: "no-store",
  })
  if (res.status === 404) return null
  return toJson<ReadDermatologyRecordDto>(res)
}

export async function createDermatology(
  dto: CreateDermatologyRecordDto
): Promise<ReadDermatologyRecordDto> {
  const res = await fetch(api(BASE_PATH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadDermatologyRecordDto>(res)
}

// PUT theo RecordId (trùng route với getDermatology)
export async function updateDermatology(
  recordId: number,
  dto: UpdateDermatologyRecordDto
): Promise<ReadDermatologyRecordDto> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadDermatologyRecordDto>(res)
}

export async function deleteDermatology(recordId: number): Promise<void> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), {
    method: "DELETE",
    cache: "no-store",
  })
  await toJson<void>(res)
}
