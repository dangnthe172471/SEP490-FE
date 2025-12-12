"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Activity,
  Users,
  Settings,
  Shield,
  Search,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit3,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { adminService } from "@/lib/services/admin-service"
import { UserDto } from "@/lib/types/api"
import { toast } from "sonner"
import { ClientOnly } from "@/components/client-only"
import { DateFormatter } from "@/components/date-formatter"
import { getAdminNavigation } from "@/lib/navigation/admin-navigation"
import { managerService } from "@/lib/services/manager-service"
import type { DoctorDto } from "@/lib/types/manager-type"

type User = UserDto & {
  id: string
  name: string
  status: string
  department: string
  joinDate: string
  specialty?: string // Chuyên khoa (chỉ cho bác sĩ)
}

export default function AdminUsersPage() {
  // Get admin navigation from centralized config
  const navigation = getAdminNavigation()

  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [doctorsMap, setDoctorsMap] = useState<Record<number, string>>({}) // userId -> specialty

  // Load doctors để lấy specialty
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        // Dùng appointmentService để lấy doctors với userId
        const { appointmentService } = await import("@/lib/services/appointment-service")
        const doctorsWithUserId = await appointmentService.getPagedDoctors(1, 1000)
        
        // Tạo map userId -> specialty
        const map: Record<number, string> = {}
        const specialtySet = new Set<string>()
        
        doctorsWithUserId.data.forEach((doctor) => {
          if (doctor.userId && doctor.specialty) {
            map[doctor.userId] = doctor.specialty
            specialtySet.add(doctor.specialty)
          }
        })
        
        setDoctorsMap(map)
        setSpecialties(Array.from(specialtySet).sort())
      } catch (err) {
        console.error("Lỗi khi load danh sách bác sĩ:", err)
      }
    }
    loadDoctors()
  }, [])

  // Gọi API lấy danh sách người dùng
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const usersData = await adminService.fetchAllUsers()

      const processedUsers: User[] = usersData
        .filter((user) => user != null)
        .map((user) => ({
          ...user,
          id: user.userId.toString(),
          name: user.fullName || `User ${user.userId}`,
          status: user.isActive ? "active" : "inactive",
          department: getDepartmentByRole(user.role),
          joinDate: "2025-01-01T00:00:00.000Z",
          specialty: doctorsMap[user.userId] || undefined, // Thêm specialty từ map
        }))

      setUsers(processedUsers)
    } catch (err: any) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", err)
      setError(err.message || "Không thể tải dữ liệu người dùng từ server.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [doctorsMap])

  // Update users when doctorsMap changes
  useEffect(() => {
    if (Object.keys(doctorsMap).length > 0 && users.length > 0) {
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          specialty: doctorsMap[user.userId] || user.specialty,
        }))
      )
    }
  }, [doctorsMap])

  // Helper lấy phòng ban theo role
  const getDepartmentByRole = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "doctor":
        return "Bác sĩ"
      case "nurse":
        return "Y tá"
      case "pharmacy provider":
        return "Nhà cung cấp thuốc"
      case "receptionist":
        return "Lễ tân"
      case "administrator":
        return "Quản trị viên"
      case "clinic manager":
        return "Quản lý phòng khám"
      case "patient":
        return "Bệnh nhân"
      default:
        return "Chưa xác định"
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Reset page when specialty filter changes
  useEffect(() => {
    setPageDoctor(1)
  }, [selectedSpecialty])

  // Lọc người dùng theo search
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const lowerCaseQuery = searchQuery.toLowerCase()
    return users.filter(
      (user) =>
        (user.name?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (user.email?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (user.id?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (user.phone?.toLowerCase().includes(lowerCaseQuery) ?? false)
    )
  }, [users, searchQuery])

  // Phân loại theo role
  const activeUsers = filteredUsers.filter((u) => u.status === "active")
  const inActiveUsers = filteredUsers.filter((u) => u.status === "inactive")
  let doctorUsers = filteredUsers.filter((u) => u.role === "Doctor")
  
  // Filter doctors by specialty
  if (selectedSpecialty !== "all") {
    doctorUsers = doctorUsers.filter((u) => u.specialty === selectedSpecialty)
  }
  
  const patientUsers = filteredUsers.filter((u) => u.role === "Patient")
  const receptionistUsers = filteredUsers.filter((u) => u.role === "Receptionist")
  const pharmacyProviderUsers = filteredUsers.filter((u) => u.role === "Pharmacy Provider")
  const clinicManagerUsers = filteredUsers.filter((u) => u.role === "Clinic Manager")
  const nurseUsers = filteredUsers.filter((u) => u.role === "Nurse")

  // --- Pagination setup ---
  const usersPerPage = 5
  const [pageAll, setPageAll] = useState(1)
  const [pageActive, setPageActive] = useState(1)
  const [pageInActive, setPageInActive] = useState(1)
  const [pageDoctor, setPageDoctor] = useState(1)
  const [pagePatient, setPagePatient] = useState(1)
  const [pageReceptionist, setPageReceptionist] = useState(1)
  const [pagePharmacyProvider, setPagePharmacyProvider] = useState(1)
  const [pageClinicManager, setPageClinicManager] = useState(1)
  const [pageNurse, setPageNurse] = useState(1)

  const paginate = (list: User[], currentPage: number) => {
    const startIndex = (currentPage - 1) * usersPerPage
    return list.slice(startIndex, startIndex + usersPerPage)
  }

  const handlePageChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    newPage: number,
    totalPages: number
  ) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setter(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const PaginationControls = ({
    currentPage,
    totalItems,
    onChange,
  }: {
    currentPage: number
    totalItems: number
    onChange: (newPage: number) => void
  }) => {
    const totalPages = Math.ceil(totalItems / usersPerPage)
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center items-center gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => onChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trang trước
        </Button>
        <span className="text-sm text-muted-foreground">
          Trang {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => onChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Trang sau
        </Button>
      </div>
    )
  }

  // Paginated lists
  const paginatedAll = paginate(filteredUsers, pageAll)
  const paginatedActive = paginate(activeUsers, pageActive)
  const paginatedInActive = paginate(inActiveUsers, pageInActive)
  const paginatedDoctor = paginate(doctorUsers, pageDoctor)
  const paginatedPatient = paginate(patientUsers, pagePatient)
  const paginatedReceptionist = paginate(receptionistUsers, pageReceptionist)
  const paginatedPharmacyProvider = paginate(pharmacyProviderUsers, pagePharmacyProvider)
  const paginatedClinicManager = paginate(clinicManagerUsers, pageClinicManager)
  const paginatedNurse = paginate(nurseUsers, pageNurse)

  // Component hiển thị từng user
  const UserCard = ({ user }: { user: User }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">{user.name || "N/A"}</h3>
                  <Badge variant="outline">{user.id || "N/A"}</Badge>
                </div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Badge variant="secondary">{user.role || "N/A"}</Badge>
                  <Badge variant="outline">{user.department || "N/A"}</Badge>
                  {user.role === "Doctor" && user.specialty && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {user.specialty}
                    </Badge>
                  )}
                  <Badge
                    variant={user.status === "active" ? "default" : "destructive"}
                  >
                    {user.status === "active" ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" /> Hoạt động
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 h-3 w-3" /> Bị khóa
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user.phone || "N/A"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ngày tham gia:{" "}
                <DateFormatter dateString={user.joinDate} fallback="N/A" />
              </p>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button size="sm" onClick={() => router.push(`/admin/users/${user.id}`)}>
              <Edit3 className="mr-1 h-3 w-3" /> Chi tiết
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout navigation={navigation}>
      <ClientOnly
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
              <p className="text-muted-foreground">
                Quản lý tài khoản nhân viên trong hệ thống
              </p>
            </div>
            <Button onClick={() => router.push("/admin/users/new")}>
              <UserPlus className="mr-2 h-4 w-4" /> Thêm người dùng
            </Button>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Tìm kiếm người dùng</CardTitle>
              <CardDescription>Tìm theo tên, email hoặc mã nhân viên</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên, email hoặc mã nhân viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Loading & Error */}
          {loading && (
            <Card>
              <CardContent className="py-12 text-center flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-muted-foreground">Đang tải dữ liệu từ API...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="py-12 text-center text-red-500">
                <p className="font-medium">Lỗi: {error}</p>
                <Button
                  onClick={fetchUsers}
                  variant="outline"
                  className="mt-4"
                  disabled={loading}
                >
                  <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          {!loading && !error && (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Tất cả ({filteredUsers.length})</TabsTrigger>
                <TabsTrigger value="active">Hoạt động ({activeUsers.length})</TabsTrigger>
                <TabsTrigger value="inactive">Không hoạt động ({inActiveUsers.length})</TabsTrigger>
                <TabsTrigger value="doctors">Bác sĩ ({doctorUsers.length})</TabsTrigger>
                <TabsTrigger value="patients">Bệnh nhân ({patientUsers.length})</TabsTrigger>
                <TabsTrigger value="receptionists">
                  Lễ tân ({receptionistUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pharmacyProviders">
                  Nhà cung cấp thuốc ({pharmacyProviderUsers.length})
                </TabsTrigger>
                <TabsTrigger value="clinicManagers">
                  Quản lý phòng khám ({clinicManagerUsers.length})
                </TabsTrigger>
                <TabsTrigger value="nurses">Y tá ({nurseUsers.length})</TabsTrigger>
              </TabsList>

              {/* ALL */}
              <TabsContent value="all" className="space-y-4">
                {paginatedAll.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedAll.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageAll}
                  totalItems={filteredUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPageAll, p, Math.ceil(filteredUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* ACTIVE */}
              <TabsContent value="active" className="space-y-4">
                {paginatedActive.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có người dùng hoạt động</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedActive.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageActive}
                  totalItems={activeUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPageActive, p, Math.ceil(activeUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* INACTIVE */}
              <TabsContent value="inactive" className="space-y-4">
                {paginatedInActive.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có người dùng hoạt động</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedInActive.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageInActive}
                  totalItems={inActiveUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPageInActive, p, Math.ceil(inActiveUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* DOCTORS */}
              <TabsContent value="doctors" className="space-y-4">
                {/* Filter by Specialty */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Lọc theo chuyên khoa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                      <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder="Chọn chuyên khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {paginatedDoctor.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        {selectedSpecialty !== "all"
                          ? `Không có bác sĩ nào thuộc chuyên khoa "${selectedSpecialty}"`
                          : "Không có bác sĩ nào"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedDoctor.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageDoctor}
                  totalItems={doctorUsers.length}
                  onChange={(p) => {
                    setPageDoctor(1)
                    handlePageChange(setPageDoctor, p, Math.ceil(doctorUsers.length / usersPerPage))
                  }}
                />
              </TabsContent>

              {/* PATIENTS */}
              <TabsContent value="patients" className="space-y-4">
                {paginatedPatient.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có bệnh nhân nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedPatient.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pagePatient}
                  totalItems={patientUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPagePatient, p, Math.ceil(patientUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* RECEPTIONISTS */}
              <TabsContent value="receptionists" className="space-y-4">
                {paginatedReceptionist.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có lễ tân nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedReceptionist.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageReceptionist}
                  totalItems={receptionistUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPageReceptionist, p, Math.ceil(receptionistUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* PHARMACY PROVIDERS */}
              <TabsContent value="pharmacyProviders" className="space-y-4">
                {paginatedPharmacyProvider.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có nhà cung cấp thuốc nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedPharmacyProvider.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pagePharmacyProvider}
                  totalItems={pharmacyProviderUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPagePharmacyProvider, p, Math.ceil(pharmacyProviderUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* CLINIC MANAGERS */}
              <TabsContent value="clinicManagers" className="space-y-4">
                {paginatedClinicManager.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có quản lý phòng khám nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedClinicManager.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageClinicManager}
                  totalItems={clinicManagerUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPageClinicManager, p, Math.ceil(clinicManagerUsers.length / usersPerPage))
                  }
                />
              </TabsContent>

              {/* NURSES */}
              <TabsContent value="nurses" className="space-y-4">
                {paginatedNurse.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Không có y tá nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  paginatedNurse.map((user) => <UserCard key={user.id} user={user} />)
                )}
                <PaginationControls
                  currentPage={pageNurse}
                  totalItems={nurseUsers.length}
                  onChange={(p) =>
                    handlePageChange(setPageNurse, p, Math.ceil(nurseUsers.length / usersPerPage))
                  }
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </ClientOnly>
    </DashboardLayout>
  )
}
