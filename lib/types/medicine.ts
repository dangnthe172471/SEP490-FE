export interface ReadMedicineDto {
  medicineId: number
  medicineName: string
  sideEffects?: string
  status?: string
  providerId: number
  providerName?: string
}

export interface CreateMedicineDto {
  medicineName: string
  sideEffects?: string
  status?: string
}

export interface UpdateMedicineDto {
  medicineName?: string
  sideEffects?: string
  status?: string
}