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

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}