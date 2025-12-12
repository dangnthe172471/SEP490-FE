// test-type-service.ts
import { TestTypeDto, CreateTestTypeRequest, UpdateTestTypeRequest, PagedResponse } from '@/lib/types/test-type'
import { ServiceDto, CreateServiceRequest, UpdateServiceRequest, PagedResponse as ServicePagedResponse } from '@/lib/types/service'

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'https://api.diamondhealth.io.vn'
const API_BASE_URL = `${API_ORIGIN}/api/Services`

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
        const services = await this.request<ServiceDto[]>('')
        // Filter by category = "Test"
        const testServices = services.filter(s => s.category === 'Test')
        // Convert ServiceDto to TestTypeDto
        return testServices.map(service => ({
            testTypeId: service.serviceId,
            testName: service.serviceName,
            description: service.description || undefined,
        }))
    }

    async getPaged(pageNumber = 1, pageSize = 10, searchTerm?: string): Promise<PagedResponse<TestTypeDto>> {
        // Get all services and filter by category="Test" on client side
        // Note: This approach gets all services first, then filters and paginates
        // A better solution would be to add category filter support in backend
        const allServices = await this.request<ServiceDto[]>('')

        // Filter by category = "Test"
        let testServices = allServices.filter(s => s.category === 'Test')

        // Apply search filter if provided
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            testServices = testServices.filter(s =>
                s.serviceName.toLowerCase().includes(term) ||
                (s.description && s.description.toLowerCase().includes(term))
            )
        }

        // Calculate pagination
        const totalCount = testServices.length
        const totalPages = Math.ceil(totalCount / Math.max(1, pageSize))
        const startIndex = (pageNumber - 1) * pageSize
        const paginatedServices = testServices.slice(startIndex, startIndex + pageSize)

        // Convert ServiceDto to TestTypeDto
        const testTypes: TestTypeDto[] = paginatedServices.map(service => ({
            testTypeId: service.serviceId,
            testName: service.serviceName,
            description: service.description || undefined,
        }))

        return {
            data: testTypes,
            totalCount,
            pageNumber,
            pageSize,
            totalPages,
            hasPreviousPage: pageNumber > 1,
            hasNextPage: pageNumber < totalPages,
        }
    }

    // ⭐ BỔ SUNG: Lấy theo ID
    async getById(id: number): Promise<TestTypeDto> {
        const service = await this.request<ServiceDto>(`/${id}`)
        // Verify it's a Test category service
        if (service.category !== 'Test') {
            throw new Error('Service is not a test type')
        }
        return {
            testTypeId: service.serviceId,
            testName: service.serviceName,
            description: service.description || undefined,
        }
    }

    // ⭐ BỔ SUNG: Tạo mới
    async create(data: CreateTestTypeRequest): Promise<number> {
        const createRequest: CreateServiceRequest = {
            serviceName: data.testName,
            description: data.description || null,
            price: null,
            isActive: true,
        }
        return this.request<number>('', { method: 'POST', body: JSON.stringify(createRequest) })
    }

    // ⭐ BỔ SUNG: Cập nhật
    async update(id: number, data: UpdateTestTypeRequest): Promise<TestTypeDto> {
        // First get the existing service to preserve category and other fields
        const existing = await this.request<ServiceDto>(`/${id}`)
        if (existing.category !== 'Test') {
            throw new Error('Service is not a test type')
        }

        const updateRequest: UpdateServiceRequest = {
            serviceName: data.testName,
            description: data.description || null,
            price: existing.price,
            isActive: existing.isActive,
        }
        const updated = await this.request<ServiceDto>(`/${id}`, { method: 'PUT', body: JSON.stringify(updateRequest) })
        return {
            testTypeId: updated.serviceId,
            testName: updated.serviceName,
            description: updated.description || undefined,
        }
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