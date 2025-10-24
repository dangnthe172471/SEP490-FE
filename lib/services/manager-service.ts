import type { DoctorDto, ShiftResponseDto, CreateScheduleRequest, DailyWorkScheduleDto, PagedResult } from "@/lib/types/manager-type"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

class BaseService {
    protected baseURL = API_BASE_URL!
    protected token: string | null = null

    constructor() {
        if (typeof window !== "undefined") {
            this.token = localStorage.getItem("auth_token")
        }
    }

    protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`
        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        }

        const res = await fetch(url, config)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        return text ? JSON.parse(text) : ({} as T)
    }
}

class ManagerService extends BaseService {
    async getAllShifts(): Promise<ShiftResponseDto[]> {
        return this.request<ShiftResponseDto[]>("/api/manager/shifts")
    }

    async getAllDoctors(): Promise<DoctorDto[]> {
        return this.request<DoctorDto[]>("/api/manager/doctors")
    }

    async searchDoctors(keyword: string): Promise<DoctorDto[]> {
        const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""
        return this.request<DoctorDto[]>(`/api/manager/doctors/search${query}`)
    }

    async createSchedule(data: CreateScheduleRequest): Promise<{ message: string }> {
        return this.request<{ message: string }>("/api/manager/create-schedule", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }
    // Lấy lịch theo khoảng ngày
    async getWorkScheduleByRange(startDate: string, endDate: string): Promise<DailyWorkScheduleDto[]> {
        return this.request<DailyWorkScheduleDto[]>(`/api/manager/getScheduleByRange?start=${startDate}&end=${endDate}`)
    }

    // Lấy lịch theo ngày 
    async getWorkScheduleByDate(date: string, pageNumber = 1, pageSize = 10): Promise<PagedResult<DailyWorkScheduleDto>> {
        return this.request<PagedResult<DailyWorkScheduleDto>>(
            `/api/manager/getScheduleByDate?date=${date}&pageNumber=${pageNumber}&pageSize=${pageSize}`
        )
    }

}

export const managerService = new ManagerService()
