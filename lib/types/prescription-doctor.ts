export interface DiagnosisInfoDto {
  code?: string | null;
  text?: string | null;
}

export interface PrescriptionDoctorInfoDto {
  doctorId: number;
  name: string;
  specialty?: string | null;
  phone?: string | null;
}

export interface PrescriptionPatientInfoDto {
  patientId: number;
  name: string;
  gender?: string | null;
  dob?: string | null; 
  phone?: string | null;
}

export interface PrescriptionLineDto {
  prescriptionDetailId: number;
  medicineId: number;
  medicineName: string;
  dosage: string;
  duration?: string | null;
  providerId: number;
  providerName?: string | null;
  providerContact?: string | null;
}

export interface PrescriptionSummaryDto {
  prescriptionId: number;
  issuedDate: string;
  diagnosis: DiagnosisInfoDto;
  doctor: PrescriptionDoctorInfoDto;
  patient: PrescriptionPatientInfoDto;
  items: PrescriptionLineDto[];
}
