// TestType API Types
export interface TestTypeDto {
    testTypeId: number
    testName: string
    description?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateTestTypeRequest {
    testName: string
    description?: string
}

export interface UpdateTestTypeRequest {
    testName: string
    description?: string
}

export interface PagedResponse<T> {
    data: T[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
    errors?: string[]
}
