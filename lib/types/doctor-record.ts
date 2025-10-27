export interface RecordListItemDto {
  recordId: number
  appointmentId: number
  visitAt: string
  patientId: number
  patientName: string
  gender?: string | null
  dob?: string | null
  phone?: string | null
  diagnosisRaw?: string | null
  hasPrescription: boolean
  latestPrescriptionId?: number | null
}

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}