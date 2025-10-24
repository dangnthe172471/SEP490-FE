// components/booking-steps/service-selection.tsx
// Updated to use Manager API for doctors

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Award, Briefcase, GraduationCap, Check, Loader2 } from "lucide-react"
import { getToken } from "@/lib/auth"

// Manager API DTOs
export interface DoctorDTO {
    doctorID: number
    fullName: string
    specialty: string
    email: string
}

// Define props: accepts onSelect callback
interface ServiceSelectionProps {
    onSelect: (service: string, price: string, doctorName: string, doctorId: number) => void // Expects 4 args
}

export function ServiceSelection({ onSelect }: ServiceSelectionProps) {
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorDTO | null>(null)

    // State for API data
    const [doctors, setDoctors] = useState<DoctorDTO[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch doctors from Manager API
    const fetchDoctors = async () => {
        const token = getToken()
        if (!token) {
            setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.')
            return
        }

        try {
            const response = await fetch('https://localhost:7168/api/Manager/doctors', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            setDoctors(data)
            console.log('👨‍⚕️ Fetched doctors from Manager API:', data)
        } catch (err: any) {
            console.error('Error fetching doctors:', err)
            setError(err.message || 'Không thể tải danh sách bác sĩ')
        }
    }

    // Fetch doctors when component mounts
    useEffect(() => {
        const fetchAllDoctors = async () => {
            setIsLoading(true)
            setError(null)
            try {
                await fetchDoctors()
            } catch (err: any) {
                setError(err.message || "Không thể tải danh sách bác sĩ.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchAllDoctors()
    }, [])

    // Handler when a doctor card is clicked
    const handleDoctorSelect = (doctor: DoctorDTO) => {
        setSelectedDoctor(doctor) // Update state to highlight selection

        // Determine service name from doctor's specialty
        const service = doctor.specialty || "Khám tổng quát";
        const price = "150000"; // Placeholder price

        // Call parent's onSelect with the 4 required pieces of data
        onSelect(
            service,          // Specialty
            price,
            doctor.fullName,  // Name
            doctor.doctorID   // ID (note: doctorID not doctorId)
        )
    }

    // Loading state display
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Đang tải danh sách bác sĩ...</p>
            </div>
        )
    }

    // Error state display
    if (error) {
        return <p className="text-red-500 text-center">{error}</p>
    }

    // Main render logic
    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Chọn bác sĩ</h3>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                {doctors.length === 0 && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                        Không tìm thấy bác sĩ nào.
                    </div>
                )}

                {/* Map through fetched doctors and render cards */}
                {doctors.map((doctor) => (
                    <Card
                        key={doctor.doctorID}
                        onClick={() => handleDoctorSelect(doctor)}
                        className={`border-2 cursor-pointer transition-all ${selectedDoctor?.doctorID === doctor.doctorID
                            ? "border-primary bg-primary/5 shadow-md" // Highlight if selected
                            : "border-border hover:shadow-md hover:border-primary/50"
                            }`}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Stethoscope className="h-5 w-5 text-primary" />
                                </div>
                                {/* Doctor Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h4 className="font-semibold text-foreground">{doctor.fullName}</h4>
                                            {/* Display specialty */}
                                            <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
                                        </div>
                                        {/* Checkmark if selected */}
                                        {selectedDoctor?.doctorID === doctor.doctorID && (
                                            <div className="p-1 rounded-full bg-primary">
                                                <Check className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Additional details */}
                                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                            <span>Chuyên khoa: {doctor.specialty}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                            <span>Email: {doctor.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Award className="h-3.5 w-3.5 shrink-0" />
                                            <span>ID: {doctor.doctorID}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}