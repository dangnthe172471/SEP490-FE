const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://localhost:7168").trim();
// bảo đảm có /api ở cuối
const API_BASE_URL = RAW_BASE.replace(/\/+$/, "").endsWith("/api")
  ? RAW_BASE.replace(/\/+$/, "")
  : `${RAW_BASE.replace(/\/+$/, "")}/api`;

import type {
  ReadMedicineDto,
  CreateMedicineDto,
  UpdateMedicineDto,
  PagedResult,
} from "@/lib/types/medicine";

async function readBodySafe(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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
      const msg =
        (payload && typeof payload === "object" && "message" in payload
          ? (payload as any).message
          : payload) || `Failed to fetch medicines (${res.status})`;
      throw new Error(String(msg));
    }
    return payload as PagedResult<ReadMedicineDto>;
  },

  async getMine(token: string): Promise<ReadMedicineDto[]> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const url = `${API_BASE_URL}/Medicine/mine`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const payload = await readBodySafe(res);
      const msg =
        (payload && typeof payload === "object" && "message" in payload
          ? (payload as any).message
          : payload) || `Failed to fetch medicines (${res.status})`;
      throw new Error(String(msg));
    }
    return res.json();
  },

  async getById(id: number, token: string): Promise<ReadMedicineDto> {
    if (!token) throw new Error("Thiếu token xác thực.");
    const res = await fetch(`${API_BASE_URL}/Medicine/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await readBodySafe(res);
    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && "message" in data
          ? (data as any).message
          : data) || `Failed to fetch medicine (${res.status})`;
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
      const msg =
        (payload && typeof payload === "object" && "message" in payload
          ? (payload as any).message
          : payload) || `Failed to create medicine (${res.status})`;
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
      const msg =
        (payload && typeof payload === "object" && "message" in payload
          ? (payload as any).message
          : payload) || `Failed to update medicine (${res.status})`;
      throw new Error(String(msg));
    }
  },
  async getAll(token?: string): Promise<ReadMedicineDto[]> {
    const url = `${API_BASE_URL}/Medicine`; // GET /api/Medicine -> trả tất cả thuốc
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });
    const payload = await readBodySafe(res);
    if (!res.ok) {
      const msg =
        (payload && typeof payload === "object" && "message" in payload
          ? (payload as any).message
          : payload) || `Failed to fetch medicines (${res.status})`;
      throw new Error(String(msg));
    }
    return payload as ReadMedicineDto[];
  },
};
