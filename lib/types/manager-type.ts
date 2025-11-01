export interface DoctorDto {
    doctorID: number
    fullName: string
    specialty: string
    email: string
}

export interface ShiftResponseDto {
    shiftID: number
    shiftType: string
    startTime: string
    endTime: string
    doctors: DoctorDto[] 
}

export interface CreateScheduleRequest {
    effectiveFrom: string
    effectiveTo: string
    Shifts: {
        shiftID: number
        doctorIDs: number[]
    }[]
}

export interface DailyWorkScheduleDto {
    date: string 
    shifts: ShiftResponseDto[]
}
export interface PagedResult<T> {
    items: T[]
    pageNumber: number
    pageSize: number
    totalCount: number
    totalPages?: number    
    hasPrevious?: boolean
    hasNext?: boolean
}

export interface DailySummaryDto {
    date: string
    shiftCount: number
    doctorCount: number
}
// Dữ liệu trả về từ API GetGroupedWorkScheduleListAsync

export interface WorkScheduleGroupDto {
    effectiveFrom: string
    effectiveTo: string
    shifts: ShiftResponseDto[]
}

export interface UpdateDoctorShiftRangeRequest {
    fromDate: string
    toDate: string
    newToDate?: string 
    shiftId: number
    addDoctorIds: number[]
    removeDoctorIds: number[]
}


