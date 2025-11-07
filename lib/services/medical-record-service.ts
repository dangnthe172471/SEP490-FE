import type { ReadInternalMedRecordDto, ReadPediatricRecordDto } from "@/lib/types/specialties"

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7168'
const API_BASE_URL = `${API_ORIGIN}/api/MedicalRecord`

export interface AppointmentLiteDto {
  appointmentId: number
  patientId: number
  doctorId: number
  appointmentDate: string
  status: string
  reasonForVisit?: string | null
}

export interface PaymentDto {
  paymentId: number
  recordId: number
  amount: number
  paymentDate: string
  method: string
  status: string
}

export interface PrescriptionDto {
  prescriptionId: number
  recordId: number
  doctorId: number
  issuedDate?: string | null
  prescriptionDetails?: PrescriptionDetailDto[]
}

export interface PrescriptionDetailDto {
  prescriptionDetailId: number
  prescriptionId: number
  medicineId: number
  medicineName: string
  dosage: string
  duration: string
}

export interface TestResultDto {
  testResultId: number
  recordId: number
  testTypeId: number
  resultValue?: string | null
  unit?: string | null
  attachment?: string | null
  resultDate?: string | null
  notes?: string | null
}

export interface MedicalRecordDto {
  recordId: number
  appointmentId: number
  doctorNotes?: string | null
  diagnosis?: string | null
  createdAt?: string | null
  appointment?: AppointmentLiteDto | null
  internalMedRecord?: ReadInternalMedRecordDto | null
  obstetricRecord?: unknown | null
  pediatricRecord?: ReadPediatricRecordDto | null
  payments: PaymentDto[]
  prescriptions: PrescriptionDto[]
  testResults: TestResultDto[]
}

export interface CreateMedicalRecordRequest {
  appointmentId: number
  doctorNotes?: string | null
  diagnosis?: string | null
}

export interface UpdateMedicalRecordRequest {
  doctorNotes?: string | null
  diagnosis?: string | null
}

function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || undefined
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    const prefix = `HTTP ${res.status}`
    // Always include status so callers can detect 404
    throw new Error(text ? `${prefix}: ${text}` : prefix)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

export const MedicalRecordService = {
  async getByAppointmentId(appointmentId: number): Promise<MedicalRecordDto | null> {
    try {
      return await request<MedicalRecordDto>(`/by-appointment/${appointmentId}`)
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (msg.includes('HTTP 404') || msg.toLowerCase().includes('no medical record')) return null
      throw e
    }
  },
  async create(req: CreateMedicalRecordRequest): Promise<MedicalRecordDto> {
    // After creating, refetch by appointment to get the fully populated object
    const created = await request<MedicalRecordDto>('', { method: 'POST', body: JSON.stringify(req) })
    try {
      const full = await request<MedicalRecordDto>(`/by-appointment/${created.appointmentId}`)
      return full
    } catch {
      return created
    }
  },
  async ensureByAppointment(appointmentId: number): Promise<MedicalRecordDto> {
    const existing = await this.getByAppointmentId(appointmentId)
    if (existing) return existing
    return this.create({ appointmentId })
  },
  async update(recordId: number, req: UpdateMedicalRecordRequest): Promise<MedicalRecordDto> {
    return request<MedicalRecordDto>(`/${recordId}`, { method: 'PUT', body: JSON.stringify(req) })
  },
}


