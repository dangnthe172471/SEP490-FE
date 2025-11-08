"use client"

import { toast } from "sonner"
import type {
    DoctorDto,
    ShiftResponseDto,
    CreateScheduleRequest,
    DailyWorkScheduleDto,
    PagedResult,
    DailySummaryDto,
    WorkScheduleGroupDto,
    UpdateDoctorShiftRangeRequest,
} from "@/lib/types/manager-type"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

class BaseService {
    protected baseURL = API_BASE_URL!
    protected token: string | null = null

    constructor() {
        if (typeof window !== "undefined") {
            this.token = localStorage.getItem("auth_token")
        }
    }

    protected async request<T>(
        endpoint: string,
        options: RequestInit = {},
        silent = false
    ): Promise<T | null> {
        const url = `${this.baseURL}${endpoint}`
        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        }

        try {
            const res = await fetch(url, config)

            if (!res.ok) {
                if (!silent) {
                    console.warn(`[ManagerService] HTTP ${res.status}: ${url}`)
                    toast.warning(`API lỗi ${res.status}: ${res.statusText}`)
                }
                return null
            }

            const text = await res.text()
            if (!text) return {} as T

            try {
                return JSON.parse(text)
            } catch (parseErr) {
                if (!silent) {
                    console.error("[ManagerService] JSON parse error:", parseErr)
                    toast.error("Lỗi khi đọc dữ liệu từ máy chủ.")
                }
                return null
            }
        } catch (err: any) {
            if (!silent) {
                console.error("[ManagerService] Fetch error:", err)
                toast.error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.")
            }
            return null
        }
    }
}

class ManagerService extends BaseService {
    async getAllShifts(): Promise<ShiftResponseDto[]> {
        const res = await this.request<ShiftResponseDto[]>("/api/ManageSchedule/shifts")
        return res ?? []
    }

    async getAllDoctors(): Promise<DoctorDto[]> {
        const res = await this.request<DoctorDto[]>("/api/ManageSchedule/doctors")
        return res ?? []
    }

    async searchDoctors(keyword: string): Promise<DoctorDto[]> {
        const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""
        const res = await this.request<DoctorDto[]>(`/api/ManageSchedule/doctors/search${query}`)
        return res ?? []
    }

    async createSchedule(data: CreateScheduleRequest): Promise<{ message: string }> {
        const res = await this.request<{ message: string }>(
            "/api/ManageSchedule/create-schedule",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
        return res ?? { message: "Không thể tạo lịch. Vui lòng thử lại." }
    }

    async getWorkScheduleByRange(startDate: string, endDate: string): Promise<DailyWorkScheduleDto[]> {
        const res = await this.request<DailyWorkScheduleDto[]>(
            `/api/ManageSchedule/getScheduleByRange?start=${startDate}&end=${endDate}`
        )
        return res ?? []
    }

    async getWorkScheduleByDate(date: string, pageNumber = 1, pageSize = 10): Promise<PagedResult<DailyWorkScheduleDto>> {
        const res = await this.request<PagedResult<DailyWorkScheduleDto>>(
            `/api/ManageSchedule/getScheduleByDate?date=${date}&pageNumber=${pageNumber}&pageSize=${pageSize}`
        )
        return res ?? { items: [], totalCount: 0, totalPages: 0, pageNumber, pageSize }
    }

    async getMonthlySummary(year: number, month: number): Promise<DailySummaryDto[]> {
        const res = await this.request<DailySummaryDto[]>(
            `/api/ManageSchedule/monthly-summary?year=${year}&month=${month}`
        )
        return res ?? []
    }

    async listGroupSchedule(pageNumber = 1, pageSize = 5): Promise<PagedResult<WorkScheduleGroupDto>> {
        const res = await this.request<PagedResult<WorkScheduleGroupDto>>(
            `/api/ManageSchedule/listGroupSchedule?pageNumber=${pageNumber}&pageSize=${pageSize}`
        )
        return res ?? { items: [], totalCount: 0, totalPages: 0, pageNumber, pageSize }
    }

    async updateDoctorShiftRange(payload: UpdateDoctorShiftRangeRequest): Promise<{ message: string }> {
        const res = await this.request<{ message: string }>(
            "/api/ManageSchedule/update-doctor-shifts-range",
            {
                method: "PUT",
                body: JSON.stringify(payload),
            }
        )
        return res ?? { message: "Cập nhật thất bại. Vui lòng thử lại." }
    }

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
        toast.success("Cập nhật lịch làm việc thành công.")
        return { message: "Cập nhật lịch làm việc thành công." }
    }

    async checkDoctorShiftLimit(doctorId: number, date: string): Promise<boolean> {
        const res = await this.request<boolean>(
            `/api/ManageSchedule/check-limit?doctorId=${doctorId}&date=${date}`,
            {},
            true
        )

        if (res === null) {
            toast.error("Không thể kiểm tra giới hạn ca làm việc.")
            return false
        }

        return res
    }
    async checkDoctorShiftLimitRange(doctorId: number, fromDate: string, toDate: string): Promise<boolean> {
        const res = await this.request<boolean>(
            `/api/ManageSchedule/check-limit-range?doctorId=${doctorId}&from=${fromDate}&to=${toDate}`,
            {},
            true
        )

        if (res === null) {
            toast.error("Không thể kiểm tra giới hạn ca làm việc trong khoảng thời gian này.")
            return false
        }

        return res
    }


}

export const managerService = new ManagerService()
