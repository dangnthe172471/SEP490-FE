import type {
  ReadInternalMedRecordDto,
  CreateInternalMedRecordDto,
  UpdateInternalMedRecordDto,
  SpecialtyStatus,
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
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

const BASE_PATH = "/api/InternalMedRecords"

export async function getInternalMed(recordId: number): Promise<ReadInternalMedRecordDto | null> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), { cache: "no-store" })
  if (res.status === 404) return null
  return toJson<ReadInternalMedRecordDto>(res)
}

export async function createInternalMed(
  dto: CreateInternalMedRecordDto
): Promise<ReadInternalMedRecordDto> {
  const res = await fetch(api(BASE_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
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
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadInternalMedRecordDto>(res)
}

export async function deleteInternalMed(recordId: number): Promise<void> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), { method: "DELETE", cache: "no-store" })
  await toJson<void>(res)
}

export async function getSpecialtyStatus(recordId: number): Promise<SpecialtyStatus> {
  // maps InternalMedRecordsController [HttpGet("status/{recordId:int}")]
  const res = await fetch(api(`${BASE_PATH}/status/${recordId}`), { cache: "no-store" })
  return toJson<SpecialtyStatus>(res)
}