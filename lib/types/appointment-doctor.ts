export type AppointmentListItemDto = {
  appointmentId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
};

export type AppointmentDetailDto = {
  appointmentId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  createdAt?: string | null;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  visitReason?: string | null;
};

export type AppointmentStatus = "Confirmed" | "Cancelled";

export interface Appointment {
  appointmentId: number;
  appointmentDateISO: string;
  appointmentTime: string;
  status: AppointmentStatus;
  patientId: number;
  patientName: string;
  patientPhone: string;
}

export interface AppointmentDetail extends Appointment {
  createdAt?: string | null;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  visitReason?: string | null;
}
