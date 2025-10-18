import { TestTypeDto, CreateTestTypeRequest, UpdateTestTypeRequest, PagedResponse } from '@/lib/types/test-type'

const API_BASE_URL = 'https://localhost:7168/api/TestTypes'

class TestTypeService {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        const defaultHeaders = {
            'Content-Type': 'application/json',
        }

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        }

        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
            }

            // Handle NoContent responses (like DELETE)
            if (response.status === 204) {
                return {} as T
            }

            return await response.json()
        } catch (error) {
            console.error('API request failed:', error)
            throw error
        }
    }

    // Get all test types
    async getAll(): Promise<TestTypeDto[]> {
        return this.request<TestTypeDto[]>('')
    }

    // Get paged test types
    async getPaged(
        pageNumber: number = 1,
        pageSize: number = 10,
        searchTerm?: string
    ): Promise<PagedResponse<TestTypeDto>> {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString(),
        })

        if (searchTerm) {
            params.append('searchTerm', searchTerm)
        }

        return this.request<PagedResponse<TestTypeDto>>(`/paged?${params.toString()}`)
    }

    // Get test type by ID
    async getById(id: number): Promise<TestTypeDto> {
        return this.request<TestTypeDto>(`/${id}`)
    }

    // Create new test type
    async create(data: CreateTestTypeRequest): Promise<number> {
        return this.request<number>('', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    // Update test type
    async update(id: number, data: UpdateTestTypeRequest): Promise<TestTypeDto> {
        return this.request<TestTypeDto>(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    // Delete test type
    async delete(id: number): Promise<void> {
        return this.request<void>(`/${id}`, {
            method: 'DELETE',
        })
    }
}

export const testTypeService = new TestTypeService()
