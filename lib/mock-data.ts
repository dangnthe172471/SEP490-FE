// Mock data for the clinic management system

export interface Patient {
  id: string
  name: string
  dateOfBirth: string
  gender: "male" | "female" | "other"
  phone: string
  email?: string
  address: string
  bloodType?: string
  allergies?: string[]
  chronicConditions?: string[]
}

export interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  date: string
  department: string
  doctor: string
  diagnosis: string
  symptoms: string
  vitalSigns: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
  }
  prescriptions: Prescription[]
  labTests: LabTest[]
  notes: string
  status: "active" | "completed" | "follow-up"
}

export interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  status: "pending" | "dispensed" | "completed"
}

export interface LabTest {
  id: string
  testName: string
  testType: "lab" | "imaging"
  status: "pending" | "in-progress" | "completed"
  requestedDate: string
  completedDate?: string
  results?: string
  notes?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  department: string
  date: string
  time: string
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  reason: string
  notes?: string
}

// Mock patients
export const mockPatients: Patient[] = [
  {
    id: "P001",
    name: "Nguyễn Văn An",
    dateOfBirth: "1985-03-15",
    gender: "male",
    phone: "0901234567",
    email: "nguyenvanan@email.com",
    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
    bloodType: "O+",
    allergies: ["Penicillin"],
    chronicConditions: ["Cao huyết áp"],
  },
  {
    id: "P002",
    name: "Trần Thị Bình",
    dateOfBirth: "1990-07-22",
    gender: "female",
    phone: "0912345678",
    email: "tranthibinh@email.com",
    address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    bloodType: "A+",
    allergies: [],
    chronicConditions: [],
  },
  {
    id: "P003",
    name: "Lê Minh Châu",
    dateOfBirth: "2018-11-10",
    gender: "female",
    phone: "0923456789",
    address: "789 Đường Trần Hưng Đạo, Quận 5, TP.HCM",
    bloodType: "B+",
    allergies: ["Sữa"],
    chronicConditions: [],
  },
  {
    id: "P004",
    name: "Phạm Văn Dũng",
    dateOfBirth: "1978-05-30",
    gender: "male",
    phone: "0934567890",
    address: "321 Đường Võ Văn Tần, Quận 3, TP.HCM",
    bloodType: "AB+",
    allergies: [],
    chronicConditions: ["Đái tháo đường type 2"],
  },
]

// Mock medical records
export const mockMedicalRecords: MedicalRecord[] = [
  {
    id: "MR001",
    patientId: "P001",
    patientName: "Nguyễn Văn An",
    date: "2025-01-03",
    department: "Khoa Nội",
    doctor: "BS. Nguyễn Văn A",
    diagnosis: "Tăng huyết áp độ 2",
    symptoms: "Đau đầu, chóng mặt, mệt mỏi",
    vitalSigns: {
      bloodPressure: "150/95",
      heartRate: 82,
      temperature: 36.8,
      weight: 75,
      height: 170,
    },
    prescriptions: [
      {
        id: "RX001",
        medication: "Amlodipine 5mg",
        dosage: "1 viên",
        frequency: "1 lần/ngày",
        duration: "30 ngày",
        instructions: "Uống vào buổi sáng sau ăn",
        status: "dispensed",
      },
      {
        id: "RX002",
        medication: "Losartan 50mg",
        dosage: "1 viên",
        frequency: "1 lần/ngày",
        duration: "30 ngày",
        instructions: "Uống vào buổi tối trước khi ngủ",
        status: "dispensed",
      },
    ],
    labTests: [
      {
        id: "LT001",
        testName: "Xét nghiệm máu tổng quát",
        testType: "lab",
        status: "completed",
        requestedDate: "2025-01-03",
        completedDate: "2025-01-04",
        results: "Bình thường",
      },
    ],
    notes: "Bệnh nhân cần theo dõi huyết áp hàng ngày. Tái khám sau 2 tuần.",
    status: "follow-up",
  },
  {
    id: "MR002",
    patientId: "P002",
    patientName: "Trần Thị Bình",
    date: "2025-01-04",
    department: "Khoa Sản - Phụ khoa",
    doctor: "BS. Nguyễn Văn A",
    diagnosis: "Thai kỳ 12 tuần",
    symptoms: "Khám thai định kỳ",
    vitalSigns: {
      bloodPressure: "110/70",
      heartRate: 75,
      temperature: 36.5,
      weight: 58,
      height: 162,
    },
    prescriptions: [
      {
        id: "RX003",
        medication: "Acid folic 5mg",
        dosage: "1 viên",
        frequency: "1 lần/ngày",
        duration: "30 ngày",
        instructions: "Uống vào buổi sáng",
        status: "pending",
      },
      {
        id: "RX004",
        medication: "Vitamin tổng hợp cho bà bầu",
        dosage: "1 viên",
        frequency: "1 lần/ngày",
        duration: "30 ngày",
        instructions: "Uống sau bữa ăn chính",
        status: "pending",
      },
    ],
    labTests: [
      {
        id: "LT002",
        testName: "Siêu âm thai",
        testType: "imaging",
        status: "completed",
        requestedDate: "2025-01-04",
        completedDate: "2025-01-04",
        results: "Thai phát triển bình thường",
      },
    ],
    notes: "Thai phát triển tốt. Tái khám sau 4 tuần.",
    status: "follow-up",
  },
  {
    id: "MR003",
    patientId: "P003",
    patientName: "Lê Minh Châu",
    date: "2025-01-04",
    department: "Nhi khoa",
    doctor: "BS. Nguyễn Văn A",
    diagnosis: "Viêm họng cấp",
    symptoms: "Sốt, đau họng, ho",
    vitalSigns: {
      temperature: 38.5,
      heartRate: 110,
      weight: 22,
      height: 115,
    },
    prescriptions: [
      {
        id: "RX005",
        medication: "Amoxicillin 250mg",
        dosage: "5ml",
        frequency: "2 lần/ngày",
        duration: "7 ngày",
        instructions: "Uống sau ăn sáng và tối",
        status: "pending",
      },
      {
        id: "RX006",
        medication: "Paracetamol 120mg",
        dosage: "5ml",
        frequency: "Khi sốt trên 38.5°C",
        duration: "5 ngày",
        instructions: "Cách nhau ít nhất 4-6 giờ",
        status: "pending",
      },
    ],
    labTests: [],
    notes: "Cho trẻ uống nhiều nước. Tái khám nếu sốt không giảm sau 3 ngày.",
    status: "active",
  },
]

// Mock appointments
export const mockAppointments: Appointment[] = [
  {
    id: "APT001",
    patientId: "P001",
    patientName: "Nguyễn Văn An",
    doctorId: "1",
    doctorName: "BS. Nguyễn Văn A",
    department: "Khoa Nội",
    date: "2025-01-10",
    time: "09:00",
    status: "scheduled",
    reason: "Tái khám cao huyết áp",
    notes: "Mang theo kết quả đo huyết áp tại nhà",
  },
  {
    id: "APT002",
    patientId: "P004",
    patientName: "Phạm Văn Dũng",
    doctorId: "1",
    doctorName: "BS. Nguyễn Văn A",
    department: "Khoa Nội",
    date: "2025-01-05",
    time: "10:30",
    status: "scheduled",
    reason: "Khám định kỳ đái tháo đường",
  },
  {
    id: "APT003",
    patientId: "P002",
    patientName: "Trần Thị Bình",
    doctorId: "1",
    doctorName: "BS. Nguyễn Văn A",
    department: "Khoa Sản - Phụ khoa",
    date: "2025-01-05",
    time: "14:00",
    status: "scheduled",
    reason: "Khám thai định kỳ",
  },
]
