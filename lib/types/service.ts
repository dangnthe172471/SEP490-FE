export interface ServiceDto {
  serviceId: number;
  serviceName: string;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  isActive: boolean;
}

export interface CreateServiceRequest {
  serviceName: string;
  description?: string | null;
  price?: number | null;
  isActive: boolean;
}

export interface UpdateServiceRequest {
  serviceName: string;
  description?: string | null;
  price?: number | null;
  isActive: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

