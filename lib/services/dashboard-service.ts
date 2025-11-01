import { BaseApiService } from './base-api.service'

export class DashboardService extends BaseApiService {
    async getClinicStatus(date?: string) {
        const qs = date ? `?date=${encodeURIComponent(date)}` : ''
        return this.request<{
            date: string
            appointments: {
                total: number
                pending: number
                confirmed: number
                completed: number
                cancelled: number
            }
            todayNewPatients: number
        }>(`/api/dashboard/clinic-status${qs}`)
    }

    async getPatientStatistics(from?: string, to?: string) {
        const params: string[] = []
        if (from) params.push(`from=${encodeURIComponent(from)}`)
        if (to) params.push(`to=${encodeURIComponent(to)}`)
        const qs = params.length ? `?${params.join('&')}` : ''
        return this.request<{
            totalPatients: number
            byGender: { male: number; female: number; other: number }
            byAgeGroups: { _0_17: number; _18_35: number; _36_55: number; _56_Plus: number }
            monthlyNewPatients: { month: string; count: number }[]
        }>(`/api/dashboard/patient-statistics${qs}`)
    }
}


