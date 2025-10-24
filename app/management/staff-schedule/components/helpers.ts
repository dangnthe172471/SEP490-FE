export function formatTime(timeString: string) {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, minutes)
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}
