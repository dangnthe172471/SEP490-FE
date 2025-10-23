"use client"

import { useState } from "react"
import { PatientSearch } from "@/components/patient-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestPatientSearch() {
    const [selectedPatientId, setSelectedPatientId] = useState("")
    const [selectedPatientName, setSelectedPatientName] = useState("")

    const handlePatientSelect = (patientId: string, patientName: string) => {
        setSelectedPatientId(patientId)
        setSelectedPatientName(patientName)
    }

    const handleReset = () => {
        setSelectedPatientId("")
        setSelectedPatientName("")
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Test Patient Search Component</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PatientSearch
                        value={selectedPatientId}
                        onChange={handlePatientSelect}
                        placeholder="Tìm kiếm bệnh nhân theo tên, ID, SĐT..."
                        label="Chọn bệnh nhân"
                        required
                    />

                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Selected Patient:</h3>
                        <p><strong>ID:</strong> {selectedPatientId || "Chưa chọn"}</p>
                        <p><strong>Name:</strong> {selectedPatientName || "Chưa chọn"}</p>
                    </div>

                    <Button onClick={handleReset} variant="outline">
                        Reset Selection
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
