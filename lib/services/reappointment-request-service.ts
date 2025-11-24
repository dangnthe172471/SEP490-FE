import { BaseApiService } from './base-api.service';
import type {
  CreateReappointmentRequestDto,
  CompleteReappointmentRequestDto,
  ReappointmentRequestDto,
  PagedResponse,
} from '@/lib/types/reappointment-request';

class ReappointmentRequestService extends BaseApiService {
  constructor() {
    super();
    this.baseURL = `${this.baseURL}/api`;
  }

  // Doctor: Tạo yêu cầu tái khám
  async createReappointmentRequest(
    data: CreateReappointmentRequestDto
  ): Promise<{ notificationId: number; message: string }> {
    return this.request<{ notificationId: number; message: string }>(
      '/DoctorReappointmentRequests',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Doctor: Lấy danh sách yêu cầu đã tạo
  async getMyReappointmentRequests(): Promise<ReappointmentRequestDto[]> {
    return this.request<ReappointmentRequestDto[]>('/DoctorReappointmentRequests/my-requests');
  }

  // Receptionist: Lấy danh sách yêu cầu tái khám đang chờ
  async getPendingReappointmentRequests(params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<PagedResponse<ReappointmentRequestDto>> {
    const searchParams = new URLSearchParams();
    if (params?.pageNumber) searchParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.searchTerm) searchParams.set('searchTerm', params.searchTerm);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortDirection) searchParams.set('sortDirection', params.sortDirection);

    const query = searchParams.toString();
    const endpoint = query ? `/ReceptionistReappointmentRequests/pending?${query}` : '/ReceptionistReappointmentRequests/pending';

    const raw = await this.request<any>(endpoint);

    const items = raw?.items ?? raw?.Items ?? [];
    const totalCount = raw?.totalCount ?? raw?.TotalCount ?? items.length;
    const pageNumber = raw?.pageNumber ?? raw?.PageNumber ?? params?.pageNumber ?? 1;
    const pageSize = raw?.pageSize ?? raw?.PageSize ?? params?.pageSize ?? (items.length || 1);
    const totalPages = raw?.totalPages ?? raw?.TotalPages ?? Math.ceil(totalCount / Math.max(1, pageSize));

    return {
      items,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
    };
  }

  // Receptionist: Lấy chi tiết yêu cầu tái khám
  async getReappointmentRequestById(
    notificationId: number
  ): Promise<ReappointmentRequestDto> {
    return this.request<ReappointmentRequestDto>(`/ReceptionistReappointmentRequests/${notificationId}`);
  }

  // Receptionist: Xử lý yêu cầu - tạo appointment mới
  async completeReappointmentRequest(
    data: CompleteReappointmentRequestDto
  ): Promise<{ appointmentId: number; message: string }> {
    return this.request<{ appointmentId: number; message: string }>(
      '/ReceptionistReappointmentRequests/complete',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }
}

export const reappointmentRequestService = new ReappointmentRequestService();

