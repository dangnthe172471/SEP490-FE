"use client";

import type {
  PrescriptionSummaryDto,
  CreatePrescriptionRequest,
} from "@/lib/types/prescription-doctor";

const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://api.diamondhealth.io.vn").trim();
const API_BASE_URL = RAW_BASE.replace(/\/+$/, "").endsWith("/api")
  ? RAW_BASE.replace(/\/+$/, "")
  : `${RAW_BASE.replace(/\/+$/, "")}/api`;

function tokenFromBrowser(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const ls =
      localStorage.getItem("auth_token") ??
      localStorage.getItem("access_token") ??
      undefined;
    if (ls) return ls;

    const pick = (n: string) =>
      document.cookie?.split("; ")?.find((c) => c.startsWith(`${n}=`));
    const c1 = pick("auth_token");
    const c2 = pick("access_token");
    if (c1) return decodeURIComponent(c1.split("=")[1]);
    if (c2) return decodeURIComponent(c2.split("=")[1]);
  } catch { }
  return undefined;
}

async function readBodySafe(res: Response) {
  const t = await res.text().catch(() => "");
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

export async function getPrescriptionById(
  id: number,
  token?: string
): Promise<PrescriptionSummaryDto> {
  const url = `${API_BASE_URL}/PrescriptionsDoctor/${id}`;
  const tk = token ?? tokenFromBrowser();

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  const data = await readBodySafe(res);
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? (data as any).message
        : data) || `Failed to fetch prescription (${res.status})`;
    throw new Error(String(msg));
  }
  return data as PrescriptionSummaryDto;
}

export async function createPrescriptionDoctor(
  payload: CreatePrescriptionRequest,
  token?: string
): Promise<PrescriptionSummaryDto> {
  const url = `${API_BASE_URL}/PrescriptionsDoctor`;
  const tk = token ?? tokenFromBrowser();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tk ? { Authorization: `Bearer ${tk}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await readBodySafe(res);
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? (data as any).message
        : data) || `Failed to create prescription (${res.status})`;
    throw new Error(String(msg));
  }
  return data as PrescriptionSummaryDto;
}
