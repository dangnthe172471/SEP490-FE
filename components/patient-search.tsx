"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, User, Phone, Mail, Loader2, AlertCircle, Check } from "lucide-react"
import { patientService, PatientInfoDto } from "@/lib/services/patient-service"

interface PatientSearchProps {
    value: string
    onChange: (patientId: string, patientName: string) => void
    placeholder?: string
    label?: string
    required?: boolean
}

export function PatientSearch({
    value,
    onChange,
    placeholder = "Tìm kiếm bệnh nhân theo tên...",
    label = "Bệnh nhân",
    required = false
}: PatientSearchProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [patients, setPatients] = useState<PatientInfoDto[]>([])
    const [defaultPatients, setDefaultPatients] = useState<PatientInfoDto[]>([]) // New state for default patients
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingDefault, setIsLoadingDefault] = useState(false) // New loading state
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPatient, setSelectedPatient] = useState<PatientInfoDto | null>(null)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load default patients on mount
    useEffect(() => {
        loadDefaultPatients()
    }, [])

    // Handle default patients display when defaultPatients changes
    useEffect(() => {
        console.log('🔄 [PatientSearch] Default patients effect triggered:', {
            defaultPatientsLength: defaultPatients.length,
            searchTerm: searchTerm,
            searchTermLength: searchTerm.trim().length
        })

        if (defaultPatients.length > 0 && searchTerm.trim().length === 0) {
            console.log('📋 [PatientSearch] Setting default patients:', defaultPatients)
            setPatients(defaultPatients)
            setIsOpen(true)
        }
    }, [defaultPatients, searchTerm])

    // Debounce search
    useEffect(() => {
        console.log('🔄 [PatientSearch] Debounce search effect triggered:', {
            searchTerm: searchTerm,
            searchTermLength: searchTerm.trim().length,
            defaultPatientsLength: defaultPatients.length
        })

        const timeoutId = setTimeout(() => {
            console.log('⏰ [PatientSearch] Debounce timeout triggered')

            if (searchTerm.trim().length >= 2) {
                console.log('🔍 [PatientSearch] Triggering search for term:', searchTerm.trim())
                searchPatients(searchTerm.trim())
            } else if (searchTerm.trim().length === 0) {
                console.log('📋 [PatientSearch] Showing default patients')
                // Nếu search term rỗng, hiển thị default patients
                setPatients(defaultPatients)
                setIsOpen(true)
            } else {
                console.log('❌ [PatientSearch] Hiding dropdown for short term')
                setPatients([])
                setIsOpen(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchTerm])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const loadDefaultPatients = async () => {
        try {
            setIsLoadingDefault(true)
            setError(null)

            // Sử dụng method mới để lấy tất cả bệnh nhân từ database
            const patientInfos = await patientService.getAllPatientsFromDatabase()

            setDefaultPatients(patientInfos)
        } catch (err: any) {
            console.error('❌ [ERROR] Failed to load default patients:', err)
            setError(err.message || 'Không thể tải danh sách bệnh nhân')
        } finally {
            setIsLoadingDefault(false)
        }
    }

    const searchPatients = async (term: string) => {
        try {
            setIsLoading(true)
            setError(null)

            const patients = await patientService.searchPatientsByKeywordWithAppointmentAPI(term)

            setPatients(patients)
            setIsOpen(true)
        } catch (err: any) {
            console.error('❌ [ERROR] Failed to search patients:', err)
            setError(err.message || 'Không thể tìm kiếm bệnh nhân')
            setPatients([])
            setIsOpen(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePatientSelect = (patient: PatientInfoDto) => {
        setSelectedPatient(patient)
        setSearchTerm(`${patient.userId} - ${patient.fullName}`)
        setIsOpen(false)
        // Sử dụng patientId cho appointment creation
        onChange(patient.patientId.toString(), patient.fullName)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchTerm(value)

        // Nếu user xóa hết text, reset selection
        if (value === "") {
            setSelectedPatient(null)
            onChange("", "")
        }
    }

    const handleInputFocus = () => {
        // Khi focus vào input, hiển thị default patients ngay lập tức
        if (searchTerm.trim().length === 0) {
            setPatients(defaultPatients)
            setIsOpen(true)
        } else if (searchTerm.trim().length >= 2 && patients.length > 0) {
            setIsOpen(true)
        }
    }

    return (
        <div className="space-y-2" ref={searchRef}>
            <Label htmlFor="patient-search">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        id="patient-search"
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        placeholder={placeholder}
                        className="pl-10"
                        required={required}
                    />
                    {(isLoading || isLoadingDefault) && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* Dropdown Results */}
                {isOpen && (
                    <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border">
                        <CardContent className="p-0">
                            {error ? (
                                <div className="flex items-center gap-2 p-4 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            ) : (isLoading || isLoadingDefault) ? ( // Show loading for both search and default load
                                <div className="p-4 text-center text-muted-foreground">
                                    <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                                    <p className="text-sm">Đang tải danh sách bệnh nhân...</p>
                                </div>
                            ) : patients.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Không tìm thấy bệnh nhân nào</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {patients.map((patient) => (
                                        <div
                                            key={patient.userId} // Changed to patient.userId
                                            onClick={() => handlePatientSelect(patient)}
                                            className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm truncate">{patient.fullName}</p>
                                                        <Badge variant="outline" className="text-xs">
                                                            ID: {patient.patientId}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{patient.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{patient.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedPatient?.patientId === patient.patientId && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Selected Patient Info */}
            {selectedPatient && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Đã chọn: {selectedPatient.fullName}</span>
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                        ID: {selectedPatient.patientId} • SĐT: {selectedPatient.phone}
                    </div>
                </div>
            )}
        </div>
    )
}
