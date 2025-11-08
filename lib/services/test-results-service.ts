// lib/services/test-results-service.ts
import type {
  PagedResult,
  TestWorklistItemDto,
  RequiredState,
  ReadTestResultDto,
  TestTypeLite,
} from "@/lib/types/test-results"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://localhost:7168"

export type GetWorklistParams = {
  date?: string | null
  patientName?: string | null
  requiredState?: RequiredState
  pageNumber?: number
  pageSize?: number
}

export async function getTestWorklist(params: GetWorklistParams): Promise<PagedResult<TestWorklistItemDto>> {
  const url = new URL("/api/TestResults/worklist", API_BASE)
  if (params.date) url.searchParams.set("date", params.date)
  if (params.patientName) url.searchParams.set("patientName", params.patientName)
  url.searchParams.set("requiredState", params.requiredState ?? "All")
  url.searchParams.set("pageNumber", String(params.pageNumber ?? 1))
  url.searchParams.set("pageSize", String(params.pageSize ?? 20))

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" })
  if (!res.ok) throw new Error(`Worklist failed (${res.status})`)
  return res.json()
}

export async function getTestTypes(): Promise<TestTypeLite[]> {
  const res = await fetch(`${API_BASE}/api/TestResults/types`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Load types failed (${res.status})`)
  return res.json()
}

export async function getTestResultsByRecord(recordId: number): Promise<ReadTestResultDto[]> {
  const res = await fetch(`${API_BASE}/api/TestResults/record/${recordId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`Load record results failed (${res.status})`)
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

export async function createTestResult(body: CreateTestResultDto): Promise<ReadTestResultDto> {
  const res = await fetch(`${API_BASE}/api/TestResults`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Create result failed (${res.status})`)
  return res.json()
}

export type UpdateTestResultDto = {
  resultValue?: string | null
  unit?: string | null
  attachment?: string | null
  resultDate?: string | null // ISO
  notes?: string | null
}

export async function updateTestResult(id: number, body: UpdateTestResultDto): Promise<ReadTestResultDto> {
  const res = await fetch(`${API_BASE}/api/TestResults/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Update result failed (${res.status})`)
  return res.json()
}

export async function deleteTestResult(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/TestResults/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Delete result failed (${res.status})`)
}

export async function hasAnyTestResult(recordId: number): Promise<boolean> {
  const list = await getTestResultsByRecord(recordId)
  return (list?.length ?? 0) > 0
}
