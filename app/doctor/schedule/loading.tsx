export default function ScheduleLoading() {
    return (
        <div className="space-y-6 p-6">
            <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-20 bg-muted rounded-lg animate-pulse" />
            <div className="grid gap-4 md:grid-cols-7">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    )
}
