export type PagedResult<T> = {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export type RequiredState = "All" | "Missing" | "Complete"

export type TestWorklistItemDto = {
  recordId: number
  appointmentId: number
  appointmentDate: string // ISO
  patientId: number
  patientName: string
  hasAllRequiredResults: boolean
  results: ReadTestResultDto[]
}

export type ReadTestResultDto = {
  testResultId: number
  recordId: number
  testTypeId: number
  testName: string
  resultValue: string
  unit?: string | null
  attachment?: string | null
  resultDate?: string | null
  notes?: string | null
}

export type TestTypeLite = {
  testTypeId: number
  testName: string
}
