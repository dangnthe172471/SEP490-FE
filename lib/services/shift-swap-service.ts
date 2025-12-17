import { BaseApiService } from "./base-api.service";
import type {
    CreateShiftSwapRequest,
    ReviewShiftSwapRequest,
    ShiftSwapRequestResponse,
    DoctorShift,
    Doctor,
    ApiResponse
} from "@/lib/types/shift-swap";

export class ShiftSwapService extends BaseApiService {
    async createShiftSwapRequest(request: CreateShiftSwapRequest): Promise<ShiftSwapRequestResponse> {
        try {
            const response = await this.request<ApiResponse<ShiftSwapRequestResponse>>('/api/DoctorShiftExchange/create-request', {
                method: 'POST',
                body: JSON.stringify(request)
            });

            if (!response.success || !response.data) {
                const errorMessage = response.message || "Failed to create shift swap request";
                throw new Error(errorMessage);
            }

            return response.data;
        } catch (error: any) {
            // Re-throw with proper error message
            if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error("Failed to create shift swap request");
            }
        }
    }

    async getAllRequests(): Promise<ShiftSwapRequestResponse[]> {
        const response = await this.request<ApiResponse<ShiftSwapRequestResponse[]>>('/api/ManagerShiftSwap/all-requests');

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch all requests");
        }

        return response.data;
    }

    async reviewShiftSwapRequest(exchangeId: number, status: "Approved" | "Rejected", note?: string): Promise<boolean> {
        try {
            const response = await this.request<ApiResponse<null>>('/api/DoctorShiftExchange/review-request', {
                method: 'POST',
                body: JSON.stringify({
                    exchangeId,
                    status
                })
            });

            if (response && response.success === true) {
                return true;
            } else {
                throw new Error(response?.message || "Failed to review shift swap request");
            }
        } catch (error) {
            throw error;
        }
    }

    async getRequestsByDoctorId(doctorId: number): Promise<ShiftSwapRequestResponse[]> {
        const response = await this.request<ApiResponse<ShiftSwapRequestResponse[]>>(`/api/DoctorShiftExchange/doctor/${doctorId}/requests`);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch doctor requests");
        }

        return response.data;
    }

    async getRequestById(exchangeId: number): Promise<ShiftSwapRequestResponse> {
        const response = await this.request<ApiResponse<ShiftSwapRequestResponse>>(`/api/DoctorShiftExchange/${exchangeId}`);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch request");
        }

        return response.data;
    }


    async getDoctorShifts(doctorId: number, from: string, to: string): Promise<DoctorShift[]> {
        const response = await this.request<ApiResponse<DoctorShift[]>>(`/api/DoctorShiftExchange/doctor/${doctorId}/shifts?from=${from}&to=${to}`);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch doctor shifts");
        }

        return response.data;
    }

    async getDoctorsBySpecialty(specialty: string): Promise<Doctor[]> {
        const response = await this.request<ApiResponse<Doctor[]>>(`/api/DoctorShiftExchange/doctors/specialty/${encodeURIComponent(specialty)}`);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch doctors by specialty");
        }

        return response.data;
    }

    async validateShiftSwapRequest(request: CreateShiftSwapRequest): Promise<boolean> {
        const response = await this.request<ApiResponse<null>>('/api/DoctorShiftExchange/validate-request', {
            method: 'POST',
            body: JSON.stringify(request)
        });

        return response.success === true;
    }

    async getDoctorIdByUserId(userId: number): Promise<number> {
        const response = await this.request<ApiResponse<number>>(`/api/DoctorShiftExchange/doctor-id/user/${userId}`);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to get doctor ID from user ID");
        }

        return response.data;
    }

    async getDoctorByUserId(userId: number): Promise<Doctor> {
        const response = await this.request<ApiResponse<Doctor>>(`/api/DoctorShiftExchange/doctor/user/${userId}`);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to get doctor info from user ID");
        }

        return response.data;
    }
}

export const shiftSwapService = new ShiftSwapService();
