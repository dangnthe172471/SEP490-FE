import {
  Appointment,
  AppointmentDetail,
  AppointmentDetailDto,
  AppointmentListItemDto,
} from "@/lib/types/appointment-doctor";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "";

const ENV_MISSING_MSG =
  "Thiếu biến môi trường: hãy đặt NEXT_PUBLIC_API_BASE_URL (hoặc NEXT_PUBLIC_API_URL) trong .env.local.";

const parseVNDate_toISO = (ddMMyyyy: string) => {
  const [dd, mm, yyyy] = ddMMyyyy.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

function getAccessTokenFromClient(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const fromLS =
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("access_token") ??
      undefined;
    if (fromLS) return fromLS;

    const cookieName = (n: string) =>
      document.cookie?.split("; ")?.find((c) => c.startsWith(`${n}=`));
    const authCookie = cookieName("auth_token");
    const accCookie = cookieName("access_token");
    if (authCookie) return decodeURIComponent(authCookie.split("=")[1]);
    if (accCookie) return decodeURIComponent(accCookie.split("=")[1]);

    return undefined;
  } catch {
    return undefined;
  }
}

type FetchOpts = { token?: string };

async function ensureOk(res: Response) {
  if (res.ok) return;
  const text = await res.text();
  const msg = text || `HTTP ${res.status}`;
  if (res.status === 401 || res.status === 403) {
    const err = new Error("UNAUTHORIZED");
    (err as any).detail = msg;
    throw err;
  }
  throw new Error(msg);
}

export async function getDoctorAppointments(opts?: FetchOpts): Promise<Appointment[]> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG);

  const token = opts?.token ?? getAccessTokenFromClient();

  const res = await fetch(`${BASE_URL}/api/DoctorAppointments/appointments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  await ensureOk(res);

  const data = (await res.json()) as AppointmentListItemDto[];

  return data.map((d) => ({
    appointmentId: d.appointmentId,
    appointmentDateISO: parseVNDate_toISO(d.appointmentDate),
    appointmentTime: d.appointmentTime,
    status: "Confirmed",
    patientId: d.patientId,
    patientName: d.patientName,
    patientPhone: d.patientPhone,
  }));
}

export async function getDoctorAppointmentDetail(
  appointmentId: number,
  opts?: FetchOpts
): Promise<AppointmentDetail> {
  if (!BASE_URL) throw new Error(ENV_MISSING_MSG);

  const token = opts?.token ?? getAccessTokenFromClient();

  const res = await fetch(`${BASE_URL}/api/DoctorAppointments/appointments/${appointmentId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  await ensureOk(res);

  const d = (await res.json()) as AppointmentDetailDto;
  return {
    appointmentId: d.appointmentId,
    appointmentDateISO: parseVNDate_toISO(d.appointmentDate),
    appointmentTime: d.appointmentTime,
    status: "Confirmed",
    patientId: d.patientId,
    patientName: d.patientName,
    patientPhone: d.patientPhone,
    createdAt: d.createdAt ?? null,
    doctorId: d.doctorId,
    doctorName: d.doctorName,
    doctorSpecialty: d.doctorSpecialty,
  };
}