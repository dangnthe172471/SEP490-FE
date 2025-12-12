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
    const [isLoadingInitial, setIsLoadingInitial] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Load default patients on mount (non-blocking)
    useEffect(() => {
        // Load trong background, không block UI
        loadDefaultPatients()
    }, [])

    // Load patient when value prop is provided (from URL query param)
    useEffect(() => {
        if (value && !selectedPatient) {
            const loadInitialPatient = async () => {
                try {
                    setIsLoadingInitial(true)
                    // value is patientId, need to find patient info
                    // First try to find in defaultPatients
                    const foundInDefault = defaultPatients.find(p => p.patientId.toString() === value)
                    if (foundInDefault) {
                        setSelectedPatient(foundInDefault)
                        setSearchTerm(`${foundInDefault.userId} - ${foundInDefault.fullName}`)
                        return
                    }

                    // If not found, try to load from API
                    // We need to get patient by patientId, but we only have patientId
                    // Try to search in all patients or load by patientId
                    const allPatients = await patientService.getAllPatientsFromDatabase()
                    const found = allPatients.find(p => p.patientId.toString() === value)
                    if (found) {
                        setSelectedPatient(found)
                        setSearchTerm(`${found.userId} - ${found.fullName}`)
                    }
                } catch (err: any) {
                    console.error('❌ [ERROR] Failed to load initial patient:', err)
                } finally {
                    setIsLoadingInitial(false)
                }
            }
            loadInitialPatient()
        }
    }, [value, selectedPatient, defaultPatients])

    // Handle default patients display when defaultPatients changes
    useEffect(() => {
        // Cập nhật patients khi defaultPatients load xong và dropdown đang mở
        if (defaultPatients.length > 0 && searchTerm.trim().length === 0 && isOpen) {
            setPatients(defaultPatients)
        }
    }, [defaultPatients, searchTerm, isOpen])

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                searchPatients(searchTerm.trim())
            } else if (searchTerm.trim().length === 0) {
                // Nếu search term rỗng, hiển thị default patients (nếu có)
                if (defaultPatients.length > 0) {
                    setPatients(defaultPatients)
                }
                setIsOpen(true)
            } else {
                setPatients([])
                setIsOpen(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchTerm, defaultPatients])

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

            // Load trong background, không block UI
            const patientInfos = await patientService.getAllPatientsFromDatabase()

            setDefaultPatients(patientInfos)

            // Nếu dropdown đang mở và chưa có patients, cập nhật ngay
            if (isOpen && searchTerm.trim().length === 0) {
                setPatients(patientInfos)
            }
        } catch (err: any) {
            console.error('❌ [ERROR] Failed to load default patients:', err)
            // Không set error để không block UI, chỉ log
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
        // Mở dropdown ngay lập tức khi focus, không cần đợi
        setIsOpen(true)

        if (searchTerm.trim().length === 0) {
            // Hiển thị ngay với dữ liệu có sẵn (nếu có)
            if (defaultPatients.length > 0) {
                setPatients(defaultPatients)
            }
        } else if (searchTerm.trim().length >= 2 && patients.length > 0) {
            // Giữ nguyên kết quả search hiện tại
        }
    }

    const handlePatientSelect = (patient: PatientInfoDto) => {
        // Select ngay lập tức, không cần đợi
        setSelectedPatient(patient)
        setSearchTerm(`${patient.userId} - ${patient.fullName}`)
        setIsOpen(false)
        onChange(patient.patientId.toString(), patient.fullName)
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
                    {(isLoading || isLoadingDefault || isLoadingInitial) && (
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
                            ) : (isLoading || (isLoadingDefault && patients.length === 0)) ? (
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
                                                        {/* <Badge variant="outline" className="text-xs">
                                                            ID: {patient.patientId}
                                                        </Badge> */}
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
                        {/* ID: {selectedPatient.patientId}  */}
                        • SĐT: {selectedPatient.phone}
                    </div>
                </div>
            )}
        </div>
    )
}
