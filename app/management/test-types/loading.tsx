import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TestTypesLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-80" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Statistics Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 w-16" />
                    </div>
                </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        {/* Table Rows */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-4 gap-4">
                                <Skeleton className="h-6 w-8" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
                                <div className="flex gap-2 justify-end">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
