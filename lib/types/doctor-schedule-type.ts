export interface DoctorScheduleDto {
    doctorId: number
    doctorName: string
    specialty: string
    roomName: string
    date: string
    shiftType: string
    startTime: string
    endTime: string
    status: string
}
export interface ShiftResponseDto {
    shiftID: number
    shiftType: string
    startTime: string
    endTime: string
    color?: string
}
