// lib/services/shift-service.ts

import { getToken } from "@/lib/auth"

export interface ShiftResponseDTO {
    shiftID: number
    shiftType: string
    startTime: string // TimeOnly from backend
    endTime: string   // TimeOnly from backend
}

class ShiftService {
    private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7168'

    private async request<T>(endpoint: string, config: RequestInit = {}): Promise<T> {
        const token = getToken()

        if (!token) {
            throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.')
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...config,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...config.headers,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`API Error: ${response.status} ${response.statusText}`, errorText)
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        return response.json()
    }

    /**
     * ✅ Get all shifts
     * GET /api/Manager/shifts
     */
    async getAllShifts(): Promise<ShiftResponseDTO[]> {
        console.log('📤 Fetching shifts from /api/Manager/shifts')

        return this.request<ShiftResponseDTO[]>('/api/Manager/shifts', {
            method: 'GET'
        })
    }

    /**
     * ✅ Get available time slots for a specific date and doctor
     * This would need to be implemented in backend
     */
    async getAvailableTimeSlots(doctorId: number, date: string): Promise<string[]> {
        // This is a placeholder - would need backend implementation
        // For now, return all shifts as available
        const shifts = await this.getAllShifts()
        return shifts.map(shift => `${shift.startTime} - ${shift.endTime}`)
    }
}

export const shiftService = new ShiftService()
