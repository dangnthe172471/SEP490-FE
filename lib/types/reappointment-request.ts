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

export interface ReappointmentRequestDto {
  notificationId: number;
  title: string;
  content: string;
  type: string;
  createdDate: string;
  isRead: boolean;
  appointmentId: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  preferredDate?: string | null;
  notes?: string | null;
}

