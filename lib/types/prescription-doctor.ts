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
  address?: string | null;
}

export interface PrescriptionLineDto {
  prescriptionDetailId: number;

  medicineId: number;
  medicineName: string;

  // Thông tin thuốc (snapshot từ MedicineVersion - nếu backend có trả)
  activeIngredient?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  route?: string | null;
  prescriptionUnit?: string | null;
  therapeuticClass?: string | null;
  packSize?: string | null;
  commonSideEffects?: string | null;
  noteForDoctor?: string | null;

  // Thông tin kê đơn
  dosage: string;
  duration?: string | null;
  instruction?: string | null;

  // Thông tin nhà cung cấp (snapshot)
  providerId?: number | null;
  providerName?: string | null;
  providerContact?: string | null;
}

export interface PrescriptionSummaryDto {
  prescriptionId: number;
  issuedDate: string | null;
  diagnosis: DiagnosisInfoDto;
  doctor: PrescriptionDoctorInfoDto;
  patient: PrescriptionPatientInfoDto;
  items: PrescriptionLineDto[];

  // ghi chú chung của đơn (nếu có)
  notes?: string | null;
}

// ==== DTO dùng khi kê đơn (Doctor tạo mới) ====

export interface CreatePrescriptionItemDto {
  medicineId: number;
  dosage: string;
  duration: string;
  instruction?: string | null;
}

export interface CreatePrescriptionRequest {
  recordId: number;
  issuedDate?: string | null;
  notes?: string | null;
  items: CreatePrescriptionItemDto[];
}
