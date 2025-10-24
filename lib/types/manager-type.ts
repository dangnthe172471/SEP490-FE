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
    totalItems: number
    pageNumber: number
    pageSize: number
}
