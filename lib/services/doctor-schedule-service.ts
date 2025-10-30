import { BaseApiService } from "./base-api.service"
import type { DoctorScheduleDto } from "@/lib/types/doctor-schedule-type"

export class DoctorScheduleService extends BaseApiService {
  
    async getScheduleByRange(
        doctorId: number,
        startDate: string,
        endDate: string
    ): Promise<DoctorScheduleDto[]> {
        const url = `/api/DoctorSchedule/doctor-active-schedule-range/${doctorId}?startDate=${startDate}&endDate=${endDate}`

        try {
            const data = await this.request<DoctorScheduleDto[]>(url, {
                method: "GET",
            })

      
            if (!Array.isArray(data)) {
                console.warn("Không có lịch làm việc cho khoảng này.")
                return []
            }

            return data
        } catch (error) {
            console.error("Lỗi khi gọi API lịch bác sĩ:", error)
            return []
        }
    }
}


export const doctorScheduleService = new DoctorScheduleService()
