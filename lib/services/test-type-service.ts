// test-type-service.ts
import { TestTypeDto, CreateTestTypeRequest, UpdateTestTypeRequest, PagedResponse } from '@/lib/types/test-type'

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'https://api.diamondhealth.io.vn'
const API_BASE_URL = `${API_ORIGIN}/api/TestTypes`

class TestTypeService {
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        // 🔥 LẤY TOKEN TỪ LOCALSTORAGE
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('token') || localStorage.getItem('auth_token')
            : null

        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // 🔥 THÊM AUTHORIZATION HEADER NẾU CÓ TOKEN
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        }

        const response = await fetch(url, config)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }

        if (response.status === 204) {
            return {} as T
        }

        return response.json()
    }

    async getAll(): Promise<TestTypeDto[]> {
        return this.request<TestTypeDto[]>('')
    }

    async getPaged(pageNumber = 1, pageSize = 10, searchTerm?: string): Promise<PagedResponse<TestTypeDto>> {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
        })
        if (searchTerm) params.append('searchTerm', searchTerm)
        const raw = await this.request<any>(`/paged?${params.toString()}`)

        const items = raw?.items ?? raw?.Items ?? []
        const totalCount = raw?.totalCount ?? raw?.TotalCount ?? 0
        const respPageNumber = raw?.pageNumber ?? raw?.PageNumber ?? pageNumber
        const respPageSize = raw?.pageSize ?? raw?.PageSize ?? pageSize
        const totalPages = raw?.totalPages ?? raw?.TotalPages ?? Math.ceil(totalCount / Math.max(1, respPageSize))

        return {
            data: items as TestTypeDto[],
            totalCount,
            pageNumber: respPageNumber,
            pageSize: respPageSize,
            totalPages,
            hasPreviousPage: respPageNumber > 1,
            hasNextPage: respPageNumber < totalPages,
        }
    }

    // ⭐ BỔ SUNG: Lấy theo ID
    async getById(id: number): Promise<TestTypeDto> {
        return this.request<TestTypeDto>(`/${id}`)
    }

    // ⭐ BỔ SUNG: Tạo mới
    async create(data: CreateTestTypeRequest): Promise<number> {
        return this.request<number>('', { method: 'POST', body: JSON.stringify(data) })
    }

    // ⭐ BỔ SUNG: Cập nhật
    async update(id: number, data: UpdateTestTypeRequest): Promise<TestTypeDto> {
        return this.request<TestTypeDto>(`/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    }

    // ⭐ BỔ SUNG: Xóa
    async delete(id: number): Promise<void> {
        return this.request<void>(`/${id}`, { method: 'DELETE' })
    }

    // ⭐ BỔ SUNG: Thống kê tổng quan (Mock/Placeholder - Cần API backend thực tế)
    async getTestTypeStatistics(): Promise<{ totalTestTypes: number }> {
        // Đây là một placeholder, bạn sẽ cần một API thực tế để lấy thống kê
        console.log("📊 [getTestTypeStatistics] Using mock data.")
        return { totalTestTypes: 42 } // Ví dụ
    }

    // ⭐ BỔ SUNG: Thống kê số lượng xét nghiệm (Mock/Placeholder - Cần API backend thực tế)
    async getTestTypeUsageTimeSeries(params: { from?: string; to?: string; groupBy?: "day" | "month" } = {}): Promise<Array<{ period: string; count: number }>> {
        console.log("📊 [getTestTypeUsageTimeSeries] Using mock data:", params)
        // Dữ liệu mock: số lượng xét nghiệm được thực hiện
        const mockData = [
            { period: "2025-10-01", count: 10 },
            { period: "2025-10-02", count: 15 },
            { period: "2025-10-03", count: 8 },
            { period: "2025-10-04", count: 20 },
            { period: "2025-10-05", count: 12 },
        ]
        return mockData.map(item => ({
            ...item,
            period: params.groupBy === 'month' ? item.period.substring(0, 7) : item.period
        }))
    }
}

export const testTypeService = new TestTypeService()