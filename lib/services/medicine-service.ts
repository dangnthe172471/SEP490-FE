// /lib/services/medicine-service.ts

const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168").trim();
const API_BASE_URL = RAW_BASE.replace(/\/+$/, "").endsWith("/api")
  ? RAW_BASE.replace(/\/+$/, "")
  : `${RAW_BASE.replace(/\/+$/, "")}/api`;

import type {
  ReadMedicineDto,
  CreateMedicineDto,
  UpdateMedicineDto,
  PagedResult,
  BulkImportResult,
} from "@/lib/types/medicine";

async function readBodySafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;

  if (typeof payload === "object") {
    if ("errors" in payload && payload.errors && typeof payload.errors === "object") {
      const bag = payload.errors as Record<string, string[]>;
      const flat = Object.entries(bag).flatMap(([field, arr]) =>
        (arr || []).map((m) => `${field}: ${m}`)
      );
      if (flat.length > 0) return flat.join("\n");
    }

    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  if (typeof payload === "string") return payload;

  return fallback;
}

export const medicineService = {
  async getMinePaged(
    token: string,
    pageNumber = 1,
    pageSize = 10,
    status?: "Providing" | "Stopped",
    sort?: "az" | "za"
  ): Promise<PagedResult<ReadMedicineDto>> {
    if (!token) throw new Error("Thiếu token xác thực.");

    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);

    const url = `${API_BASE_URL}/Medicine/mine?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await readBodySafe(res);
    if (!res.ok) {
      const msg = extractErrorMessage(payload, `Failed to fetch medicines (${res.status})`);
      throw new Error(String(msg));
    }
    return payload as PagedResult<ReadMedicineDto>;
  },

  async getById(id: number, token: string): Promise<ReadMedicineDto> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const res = await fetch(`${API_BASE_URL}/Medicine/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await readBodySafe(res);
    if (!res.ok) {
      const msg = extractErrorMessage(data, `Failed to fetch medicine (${res.status})`);
      throw new Error(String(msg));
    }
    return data as ReadMedicineDto;
  },

  async create(data: CreateMedicineDto, token: string): Promise<void> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const res = await fetch(`${API_BASE_URL}/Medicine/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const payload = await readBodySafe(res);
    if (!res.ok) {
      const msg = extractErrorMessage(payload, `Failed to create medicine (${res.status})`);
      throw new Error(String(msg));
    }
  },

  async update(id: number, data: UpdateMedicineDto, token: string): Promise<void> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const res = await fetch(`${API_BASE_URL}/Medicine/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const payload = await readBodySafe(res);
    if (!res.ok) {
      const msg = extractErrorMessage(payload, `Failed to update medicine (${res.status})`);
      throw new Error(String(msg));
    }
  },

  async getAll(token?: string): Promise<ReadMedicineDto[]> {
    const url = `${API_BASE_URL}/Medicine`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    const payload = await readBodySafe(res);
    if (!res.ok) {
      const msg = extractErrorMessage(payload, `Failed to fetch medicines (${res.status})`);
      throw new Error(String(msg));
    }
    return payload as ReadMedicineDto[];
  },

  async downloadTemplate(token: string): Promise<Blob> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const res = await fetch(`${API_BASE_URL}/Medicine/excel-template`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const payload = await readBodySafe(res);
      const msg = extractErrorMessage(payload, `Failed to download template (${res.status})`);
      throw new Error(String(msg));
    }

    return await res.blob();
  },

  async importExcel(file: File, token: string): Promise<BulkImportResult> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/Medicine/import-excel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const payload = await readBodySafe(res);
    if (!res.ok) {
      const msg = extractErrorMessage(payload, `Failed to import excel (${res.status})`);
      throw new Error(String(msg));
    }

    return payload as BulkImportResult;
  },
};
