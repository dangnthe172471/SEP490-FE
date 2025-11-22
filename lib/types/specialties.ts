export type ReadInternalMedRecordDto = {
  recordId: number
  bloodPressure?: number | null
  heartRate?: number | null
  bloodSugar?: number | null
  notes?: string | null
}

export type CreateInternalMedRecordDto = {
  recordId: number
  bloodPressure?: number | null
  heartRate?: number | null
  bloodSugar?: number | null
  notes?: string | null
}

export type UpdateInternalMedRecordDto = {
  bloodPressure?: number | null
  heartRate?: number | null
  bloodSugar?: number | null
  notes?: string | null
}

export type ReadPediatricRecordDto = {
  recordId: number
  weightKg?: number | null
  heightCm?: number | null
  heartRate?: number | null
  temperatureC?: number | null
}

export type CreatePediatricRecordDto = {
  recordId: number
  weightKg?: number | null
  heightCm?: number | null
  heartRate?: number | null
  temperatureC?: number | null
}

export type UpdatePediatricRecordDto = {
  weightKg?: number | null
  heightCm?: number | null
  heartRate?: number | null
  temperatureC?: number | null
}

export type SpecialtyStatus = {
  recordId: number
  hasPediatric: boolean
  hasInternalMed: boolean
  hasDermatology: boolean
  hasAny: boolean
}

/* NEW: Dermatology */

export type ReadDermatologyRecordDto = {
  dermRecordId: number
  recordId: number
  requestedProcedure: string
  bodyArea?: string | null
  procedureNotes?: string | null
  resultSummary?: string | null
  attachment?: string | null
  performedAt: string // ISO string
}

export type CreateDermatologyRecordDto = {
  recordId: number
  requestedProcedure?: string | null
  bodyArea?: string | null
  procedureNotes?: string | null
}

export type UpdateDermatologyRecordDto = {
  requestedProcedure?: string | null
  bodyArea?: string | null
  procedureNotes?: string | null
  resultSummary?: string | null
  attachment?: string | null
  performedByUserId?: number | null
}
