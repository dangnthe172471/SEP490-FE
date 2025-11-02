import type {
  ReadPediatricRecordDto,
  CreatePediatricRecordDto,
  UpdatePediatricRecordDto,
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

const BASE_PATH = "/api/PediatricRecords"

export async function getPediatric(recordId: number): Promise<ReadPediatricRecordDto | null> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), { cache: "no-store" })
  if (res.status === 404) return null
  return toJson<ReadPediatricRecordDto>(res)
}

export async function createPediatric(
  dto: CreatePediatricRecordDto
): Promise<ReadPediatricRecordDto> {
  const res = await fetch(api(BASE_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
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
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(dto),
    cache: "no-store",
  })
  return toJson<ReadPediatricRecordDto>(res)
}

export async function deletePediatric(recordId: number): Promise<void> {
  const res = await fetch(api(`${BASE_PATH}/${recordId}`), { method: "DELETE", cache: "no-store" })
  await toJson<void>(res)
}