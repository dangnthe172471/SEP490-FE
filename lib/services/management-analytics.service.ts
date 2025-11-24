import { BaseApiService } from "./base-api.service"
import { TestDiagnosticStats } from "@/lib/types/management"

interface DiagnosticParams {
  from?: string
  to?: string
  groupBy?: "day" | "month"
}

class ManagementAnalyticsService extends BaseApiService {
  async getTestDiagnosticStats(params: DiagnosticParams = {}): Promise<TestDiagnosticStats> {
    const query = new URLSearchParams()
    if (params.from) query.append("from", params.from)
    if (params.to) query.append("to", params.to)
    if (params.groupBy) query.append("groupBy", params.groupBy)
    const qs = query.toString()

    return this.request<TestDiagnosticStats>(`/api/dashboard/test-diagnostic-stats${qs ? `?${qs}` : ""}`)
  }
}

export const managementAnalyticsService = new ManagementAnalyticsService()

