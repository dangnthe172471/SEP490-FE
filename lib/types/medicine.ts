export interface ReadMedicineDto {
  medicineId: number;
  medicineName: string;
  status?: string | null;

  providerId: number;
  providerName?: string | null;

  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  route: string | null;
  prescriptionUnit: string | null;
  therapeuticClass: string | null;
  packSize: string | null;
  commonSideEffects?: string | null;
  noteForDoctor?: string | null;
}

export interface CreateMedicineDto {
  medicineName: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  route: string;
  prescriptionUnit: string;
  therapeuticClass: string;
  packSize: string;
  commonSideEffects?: string;
  noteForDoctor?: string;
  status?: "Providing" | "Stopped";
}

export interface UpdateMedicineDto {
  medicineName?: string;
  activeIngredient?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
  prescriptionUnit?: string;
  therapeuticClass?: string;
  packSize?: string;
  commonSideEffects?: string;
  noteForDoctor?: string;
  status?: "Providing" | "Stopped";
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface BulkImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}