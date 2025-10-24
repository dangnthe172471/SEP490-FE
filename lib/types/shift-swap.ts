export interface CreateShiftSwapRequest {
    doctor1Id: number;
    doctor2Id: number;
    doctor1ShiftRefId: number;
    doctor2ShiftRefId: number;
    exchangeDate: string; // DateOnly as string
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
    exchangeDate: string;
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
