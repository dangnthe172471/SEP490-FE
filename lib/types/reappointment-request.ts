export interface CreateReappointmentRequestDto {
  appointmentId: number;
  preferredDate?: string | null; // ISO date string
  notes?: string | null;
}

export interface CompleteReappointmentRequestDto {
  notificationId: number;
  appointmentDate: string; // ISO date string
  reasonForVisit: string;
}

export interface ReappointmentRequestData {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  preferredDate?: string | null;
  notes?: string | null;
  isCompleted?: boolean;
}

export interface ReappointmentRequestDto extends ReappointmentRequestData {
  notificationId: number;
  title: string;
  content: string;
  type: string;
  createdDate: string;
  isRead: boolean;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  doctorName: string;
  doctorSpecialty: string;
}

export interface PagedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}
