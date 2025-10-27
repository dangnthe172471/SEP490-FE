"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  UserPlus,
  Activity,
  Search,
  Phone,
  Mail,
  Loader2,
  Trash2,
  Edit3,
  CheckCircle,
  MessageCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { userService } from "@/lib/services/user.service";
import { UserDto } from "@/lib/types/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClientOnly } from "@/components/client-only";
import { DateFormatter } from "@/components/date-formatter";

type User = UserDto & {
  id: string;
  name: string;
  status: string;
  department: string;
};

const navigation = [
  { name: "Tổng quan", href: "/reception", icon: Activity },
  { name: "Lịch hẹn", href: "/reception/appointments", icon: Calendar },
  { name: "Bệnh nhân", href: "/reception/patients", icon: Users },
  { name: "Hồ sơ bệnh án", href: "/reception/records", icon: FileText },
  { name: "Chat hỗ trợ", href: "/reception/chat", icon: MessageCircle },
  { name: "Đăng ký mới", href: "/reception/register", icon: UserPlus },
];

export default function ReceptionPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Gọi API lấy danh sách bệnh nhân
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersData = await userService.fetchAllPatients();

      const processedUsers: User[] = usersData
        .filter((user) => user != null)
        .map((user) => ({
          ...user,
          id: user.userId.toString(),
          name: user.fullName || `User ${user.userId}`,
          status: user.isActive ? "active" : "inactive",
          department: getDepartmentByRole(user.role),
        }));

      setPatients(processedUsers);
    } catch (err: any) {
      console.error("Lỗi khi lấy dữ liệu bệnh nhân:", err);
      setError(err.message || "Không thể tải dữ liệu bệnh nhân từ server.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDepartmentByRole = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "doctor":
        return "Khoa Nội";
      case "nurse":
        return "Điều dưỡng";
      case "pharmacist":
        return "Nhà thuốc";
      case "receptionist":
        return "Lễ tân";
      case "admin":
        return "Quản trị";
      case "management":
        return "Quản lý";
      case "patient":
        return "Bệnh nhân";
      default:
        return "Chưa xác định";
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // // Xóa bệnh nhân
  // const handleDeletePatient = async (id: string, name: string) => {
  //   const confirmMessage = `Bạn có chắc chắn muốn xóa bệnh nhân "${name}"?\nHành động này không thể hoàn tác!`;
  //   if (!confirm(confirmMessage)) return;

  //   try {
  //     setDeletingUserId(id);
  //     await userService.deletePatient(parseInt(id));
  //     toast.success("Xóa bệnh nhân thành công");
  //     await fetchUsers();
  //   } catch (err: any) {
  //     toast.error(err.message || "Không thể xóa bệnh nhân");
  //   } finally {
  //     setDeletingUserId(null);
  //   }
  // };

  // Lọc bệnh nhân
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return patients;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        (p.name?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (p.email?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (p.id?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (p.phone?.toLowerCase().includes(lowerCaseQuery) ?? false)
    );
  }, [patients, searchQuery]);

  const activeUsers = filteredUsers.filter((u) => u.status === "active");

  // Component hiển thị bệnh nhân
  const PatientCard = ({ patient }: { patient: User }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        {" "}
        <CardContent className="p-6">
          {" "}
          <div className="flex items-start justify-between">
            {" "}
            <div className="space-y-3 flex-1">
              {" "}
              <div className="flex items-start justify-between">
                {" "}
                <div>
                  {" "}
                  <div className="flex items-center gap-2 mb-1">
                    {" "}
                    <h3 className="text-lg font-semibold">
                      {patient.name || "N/A"}
                    </h3>{" "}
                    {/* <Badge variant="outline">{patient.id || "N/A"}</Badge>{" "} */}
                  </div>{" "}
                  <div className="flex gap-2 mb-2">
                    <Badge
                      variant={
                        patient.status === "active" ? "default" : "destructive"
                      }
                    >
                      {patient.status === "active" ? (
                        <>
                          {" "}
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          {" "}
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Bị khóa
                        </>
                      )}{" "}
                    </Badge>{" "}
                    <Badge variant="secondary">
                      {patient.gender === "Nam"
                        ? "Nam"
                        : patient.gender === "Nữ"
                        ? "Nữ"
                        : "Khác"}{" "}
                    </Badge>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{patient.phone || "N/A"}</span>
                </div>
              </div>
              {(patient.allergies && patient.allergies.length > 0) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                      <Badge  variant="destructive" className="text-xs">
                        Dị ứng: {patient.allergies}
                      </Badge>
                  </div>
                ) : 
                (
                  <div className="mt-2 flex flex-wrap gap-2">
                      <Badge  variant="destructive" className="text-xs">
                        Dị ứng: Không có
                      </Badge>
                  </div>
                )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                onClick={() => router.push(`/reception/patients/${patient.id}`)}
              >
                <Edit3 className="mr-1 h-3 w-3" />
                Chi tiết
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/reception/appointments/new?patientId=${patient.id}`
                  )
                }
              >
                Đặt lịch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout navigation={navigation}>
      <ClientOnly
        fallback={
          <div className="space-y-6">
            {" "}
            <div className="flex items-center justify-center py-12">
              {" "}
              <Loader2 className="h-8 w-8 animate-spin" />{" "}
            </div>{" "}
          </div>
        }
      >
        {" "}
        <div className="space-y-6">
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <div>
              {" "}
              <h1 className="text-3xl font-bold tracking-tight">
                Danh sách bệnh nhân
              </h1>{" "}
              <p className="text-muted-foreground">
                Tra cứu và quản lý thông tin bệnh nhân
              </p>{" "}
            </div>
            <Button onClick={() => router.push("/reception/patients/new")}>
              {" "}
              <UserPlus className="mr-2 h-4 w-4" />
              Đăng ký mới{" "}
            </Button>{" "}
          </div>
          {/* Tìm kiếm */}
          <Card>
            <CardHeader>
              <CardTitle>Tìm kiếm bệnh nhân</CardTitle>
              <CardDescription>
                Tìm theo tên, mã bệnh nhân hoặc số điện thoại
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên, mã BN hoặc SĐT..."
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
                <p className="text-muted-foreground">
                  Đang tải dữ liệu bệnh nhân...
                </p>
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
                  <Loader2
                    className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          )}
          {/* Danh sách bệnh nhân */}
          {!loading && !error && (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">
                  Tất cả ({filteredUsers.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Đang hoạt động ({activeUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {filteredUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        Không tìm thấy bệnh nhân nào
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredUsers.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {activeUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        Không có bệnh nhân hoạt động
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  activeUsers.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </ClientOnly>
    </DashboardLayout>
  );
}
