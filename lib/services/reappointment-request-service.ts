import { BaseApiService } from './base-api.service';
import type {
  CreateReappointmentRequestDto,
  CompleteReappointmentRequestDto,
  ReappointmentRequestDto,
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
  async getPendingReappointmentRequests(): Promise<ReappointmentRequestDto[]> {
    return this.request<ReappointmentRequestDto[]>('/ReceptionistReappointmentRequests/pending');
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

