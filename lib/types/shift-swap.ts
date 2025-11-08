export interface CreateShiftSwapRequest {
    doctor1Id: number;
    doctor2Id: number;
    doctor1ShiftRefId: number;
    doctor2ShiftRefId: number;
    exchangeDate?: string; // DateOnly as string, optional for permanent
    swapType: "temporary" | "permanent";
}

export interface ReviewShiftSwapRequest {
    exchangeId: number;
    status: "Approved" | "Rejected";
    managerNote?: string;
}

export interface ShiftSwapRequestResponse {
    exchangeId: number;
    doctor1Id: number;
    doctor1Name: string;
    doctor1Specialty: string;
    doctor2Id: number;
    doctor2Name: string;
    doctor2Specialty: string;
    doctor1ShiftRefId: number;
    doctor1ShiftName: string;
    doctor2ShiftRefId: number;
    doctor2ShiftName: string;
    doctorOld1ShiftId: number;
    doctorOld1ShiftName: string;
    doctorOld2ShiftId?: number;
    doctorOld2ShiftName: string;
    exchangeDate?: string; // Đầu tháng sau cho permanent, ngày cụ thể cho temporary
    status: string;
    swapType?: "temporary" | "permanent";
}

export interface DoctorShift {
    doctorShiftId: number;
    doctorId: number;
    doctorName: string;
    specialty: string;
    shiftId: number;
    shiftName: string;
    shiftType: string;
    effectiveFrom: string;
    effectiveTo: string;
    status: string;
}

export interface Doctor {
    doctorID: number;
    fullName: string;
    specialty: string;
    email: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}
