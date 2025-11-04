export default function LoadingNotifications() {
    return (
        <div className="space-y-6">
            <div className="h-12 w-48 bg-muted rounded animate-pulse" />
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                ))}
            </div>
            <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
    )
}
