import { TestTypeDto, CreateTestTypeRequest, UpdateTestTypeRequest, PagedResponse } from '@/lib/types/test-type'

const API_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7168'
const API_BASE_URL = `${API_ORIGIN}/api/TestTypes`

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

        const raw = await this.request<any>(`/paged?${params.toString()}`)

        // Map BE PagedResponse (Items, TotalCount, PageNumber, PageSize, TotalPages) -> FE PagedResponse
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
