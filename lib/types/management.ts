export interface CategoryCount {
  label: string
  count: number
  revenue?: number | null
}

export interface DiagnosticTrendPoint {
  period: string
  visitCount: number
  testCount: number
}

export interface TestDiagnosticStats {
  totalVisits: number
  totalTests: number
  visitTypeCounts: CategoryCount[]
  testTypeCounts: CategoryCount[]
  topVisitServices: CategoryCount[]
  topTestServices: CategoryCount[]
  trends: DiagnosticTrendPoint[]
}


