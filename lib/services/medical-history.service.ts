import { BaseApiService } from './base-api.service'
import { ApiResponse } from '@/lib/types/api'

export interface MedicalRecord {
    recordId: number
    appointmentId: number
    patientId: number
    patientName: string
    doctorId: number
    doctorName: string
    doctorSpecialty: string
    appointmentDate: string
    diagnosis?: string
    doctorNotes?: string
    status: string
    createdAt?: string
    prescriptions: Prescription[]
    testResults: TestResult[]
}

export interface Prescription {
    prescriptionId: number
    recordId: number
    doctorId: number
    doctorName: string
    issuedDate?: string
    prescriptionDetails: PrescriptionDetail[]
}

export interface PrescriptionDetail {
    prescriptionDetailId: number
    prescriptionId: number
    medicineId: number
    medicineName: string
    dosage: string
    duration: string
}

export interface TestResult {
    testResultId: number
    recordId: number
    testTypeId: number
    testTypeName: string
    resultValue: string
    unit?: string
    attachment?: string
    resultDate?: string
    notes?: string
}

export class MedicalHistoryService extends BaseApiService {
    /**
     * Lấy lịch sử bệnh án của bệnh nhân theo UserId
     */
    async getMedicalHistory(userId: number): Promise<MedicalRecord[]> {
        const response = await this.request<ApiResponse<MedicalRecord[]>>(`/api/MedicalHistory/user/${userId}`)

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch medical history")
        }

        return response.data
    }
}

export const medicalHistoryService = new MedicalHistoryService()
