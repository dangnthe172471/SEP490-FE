"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Check, User, Phone, Mail } from "lucide-react"
import { patientService, UserDto } from "@/lib/services/patient-service"

export default function TestPatientAPI() {
    const [searchTerm, setSearchTerm] = useState("")
    const [patients, setPatients] = useState<UserDto[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPatient, setSelectedPatient] = useState<UserDto | null>(null)

    const handleSearch = async () => {
        if (!searchTerm.trim()) return

        try {
            setIsLoading(true)
            setError(null)

            console.log('🔍 Testing patient search with term:', searchTerm)

            const results = await patientService.searchPatientsByKeywordWithAppointmentAPI(searchTerm)

            console.log('📥 Search results:', results)

            setPatients(results)
        } catch (err: any) {
            console.error('❌ Search failed:', err)
            setError(err.message || 'Không thể tìm kiếm bệnh nhân')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePatientSelect = (patient: UserDto) => {
        setSelectedPatient(patient)
    }

    const handleTestDirectAPI = async (patientId: number) => {
        try {
            setIsLoading(true)
            setError(null)

            console.log('🔍 Testing direct API call for patient ID:', patientId)

            const patient = await patientService.getPatientById(patientId)

            console.log('📥 Direct API result:', patient)

            setPatients([patient])
            setSelectedPatient(patient)
        } catch (err: any) {
            console.error('❌ Direct API failed:', err)
            setError(err.message || `Không thể lấy thông tin bệnh nhân ID ${patientId}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Test Patient API - /api/Appointments/patients/{id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Input */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Tìm kiếm bệnh nhân</Label>
                        <div className="flex gap-2">
                            <Input
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập tên, ID, SĐT hoặc email..."
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} disabled={isLoading || !searchTerm.trim()}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm kiếm"}
                            </Button>
                        </div>
                    </div>

                    {/* Direct API Test Buttons */}
                    <div className="space-y-2">
                        <Label>Test Direct API Calls:</Label>
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map(id => (
                                <Button
                                    key={id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTestDirectAPI(id)}
                                    disabled={isLoading}
                                >
                                    Test ID {id}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Results */}
                    {patients.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold">Kết quả tìm kiếm ({patients.length}):</h3>
                            {patients.map((patient) => (
                                <Card key={patient.userId} className={`cursor-pointer transition-colors ${selectedPatient?.userId === patient.userId ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`} onClick={() => handlePatientSelect(patient)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium">{patient.fullName}</p>
                                                        <Badge variant="outline">ID: {patient.userId}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{patient.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{patient.email}</span>
                                                        </div>
                                                    </div>
                                                    {patient.allergies && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            Dị ứng: {patient.allergies}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedPatient?.userId === patient.userId && (
                                                <Check className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Selected Patient Info */}
                    {selectedPatient && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-green-800 mb-2">
                                    <Check className="h-4 w-4" />
                                    <span className="font-medium">Bệnh nhân đã chọn:</span>
                                </div>
                                <div className="text-sm text-green-700">
                                    <p><strong>ID:</strong> {selectedPatient.userId}</p>
                                    <p><strong>Tên:</strong> {selectedPatient.fullName}</p>
                                    <p><strong>SĐT:</strong> {selectedPatient.phone}</p>
                                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                                    {selectedPatient.allergies && <p><strong>Dị ứng:</strong> {selectedPatient.allergies}</p>}
                                    {selectedPatient.medicalHistory && <p><strong>Tiền sử:</strong> {selectedPatient.medicalHistory}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
