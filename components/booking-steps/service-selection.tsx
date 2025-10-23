// components/booking-steps/service-selection.tsx
// (This version is correct)

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Award, Briefcase, GraduationCap, Check, Loader2 } from "lucide-react"
import { DoctorInfoDto, PagedResponse } from "@/lib/types/appointment"

// Define props: accepts onSelect callback and getDoctors API function
interface ServiceSelectionProps {
    onSelect: (service: string, price: string, doctorName: string, doctorId: number) => void // Expects 4 args
    getDoctors: (page?: number, size?: number, term?: string) => Promise<PagedResponse<DoctorInfoDto>>
}

export function ServiceSelection({ onSelect, getDoctors }: ServiceSelectionProps) {
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorInfoDto | null>(null)

    // State for API data
    const [doctors, setDoctors] = useState<DoctorInfoDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch doctors when component mounts
    useEffect(() => {
        const fetchAllDoctors = async () => {
            setIsLoading(true)
            setError(null)
            try {
                // Call API function passed via props
                const response = await getDoctors(1, 100) // Fetch up to 100 doctors
                setDoctors(response.data)
            } catch (err: any) {
                setError(err.message || "Không thể tải danh sách bác sĩ.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchAllDoctors()
    }, [getDoctors]) // Re-run if getDoctors changes (though it likely won't)

    // Handler when a doctor card is clicked
    const handleDoctorSelect = (doctor: DoctorInfoDto) => {
        setSelectedDoctor(doctor) // Update state to highlight selection

        // Determine service name from doctor's specialty
        const service = doctor.specialty || "Khám tổng quát";
        const price = "150000"; // Placeholder price

        // Call parent's onSelect with the 4 required pieces of data
        onSelect(
            service,          // Specialty
            price,
            doctor.fullName,  // Name
            doctor.doctorId   // ID
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
                         key={doctor.doctorId}
                         onClick={() => handleDoctorSelect(doctor)}
                         className={`border-2 cursor-pointer transition-all ${selectedDoctor?.doctorId === doctor.doctorId
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
                                         {selectedDoctor?.doctorId === doctor.doctorId && (
                                             <div className="p-1 rounded-full bg-primary">
                                                 <Check className="h-4 w-4 text-white" />
                                             </div>
                                         )}
                                     </div>
                                     {/* Additional details */}
                                     <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                         <div className="flex items-center gap-2">
                                             <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                             <span>{doctor.experienceYears} năm kinh nghiệm</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                                             <span>Đại học Y (ví dụ)</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <Award className="h-3.5 w-3.5 shrink-0" />
                                             <span>Phòng: {doctor.roomName || "N/A"}</span>
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