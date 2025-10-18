import { AuthTest } from "@/components/auth-test"

export default function TestAuthPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold text-center mb-8">Authentication Test</h1>
            <AuthTest />
        </div>
    )
}
