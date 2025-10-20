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
}

export interface CreateScheduleRequest {
    effectiveFrom: string
    effectiveTo: string
    Shifts: {
        shiftID: number
        doctorIDs: number[]
    }[]
}
