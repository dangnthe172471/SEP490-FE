export interface DoctorPatientCountDto {
  doctorId: number
  doctorName: string
  specialty: string
  totalPatients: number
  totalAppointments: number
}

export interface DoctorVisitTrendPointDto {
  doctorId: number
  doctorName: string
  date: string
  visitCount: number
}

export interface DoctorReturnRateDto {
  doctorId: number
  doctorName: string
  totalPatients: number
  returnPatients: number
  returnRate: number
}

export interface DoctorStatisticsSummaryDto {
  patientCountByDoctor: DoctorPatientCountDto[]
  visitTrend: DoctorVisitTrendPointDto[]
  returnRates: DoctorReturnRateDto[]
}
