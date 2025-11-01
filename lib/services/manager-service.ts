import type { DoctorDto, ShiftResponseDto, CreateScheduleRequest, DailyWorkScheduleDto, PagedResult, DailySummaryDto, WorkScheduleGroupDto, UpdateDoctorShiftRangeRequest } from "@/lib/types/manager-type"

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
    async getMonthlySummary(year: number, month: number): Promise<DailySummaryDto[]> {
        return this.request(`/api/manager/monthly-summary?year=${year}&month=${month}`)
    }

    // Lấy danh sách lịch làm việc đã group theo khoảng thời gian hiệu lực và kết thúc
    async listGroupSchedule(pageNumber = 1, pageSize = 5): Promise<PagedResult<WorkScheduleGroupDto>> {
        return this.request<PagedResult<WorkScheduleGroupDto>>(
            `/api/manager/listGroupSchedule?pageNumber=${pageNumber}&pageSize=${pageSize}`
        )
    }
    async updateDoctorShiftRange(payload: UpdateDoctorShiftRangeRequest): Promise<{ message: string }> {
        return this.request<{ message: string }>("/api/manager/update-doctor-shifts-range", {
            method: "PUT",
            body: JSON.stringify(payload),
        })
    }

    //Cập nhật nhiều ca (tự động gọi tuần tự)
    async updateMultipleShiftRanges(
        fromDate: string,
        toDate: string,
        newToDate: string | null,
        updates: { shiftId: number; addDoctorIds: number[]; removeDoctorIds: number[] }[]
    ): Promise<{ message: string }> {
        for (const update of updates) {
            await this.updateDoctorShiftRange({
                fromDate,
                toDate,
                newToDate: newToDate || toDate,
                shiftId: update.shiftId,
                addDoctorIds: update.addDoctorIds,
                removeDoctorIds: update.removeDoctorIds,
            })
        }
        return { message: "Cập nhật lịch làm việc thành công." }
    }
}




export const managerService = new ManagerService()
