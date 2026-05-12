// app/lien-he/page.tsx - VERSION ĐÃ KHẮC PHỤC LỖI HYDRATION

"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react"; // Giữ nguyên
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { BookingModal } from "@/components/booking-modal";
import { Toaster, toast } from "react-hot-toast";
import { appointmentService } from "@/lib/services/appointment-service";
import { getCurrentUser } from "@/lib/auth";

import {
  BookingData,
  CreateAppointmentByPatientRequest,
} from "@/lib/types/appointment";

export default function LienHePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    date: "",
    time: "",
    message: "",
    doctorId: null as number | null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ SỬA LỖI HYDRATION: Thêm state isClient
  const [isClient, setIsClient] = useState(false);

  // Lấy user một lần duy nhất
  const loggedInUser = useMemo(() => getCurrentUser(), []);

  // ✅ SỬA LỖI HYDRATION: Dùng useEffect để set isClient
  // useEffect này chỉ chạy ở client, sau khi component đã mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Tự động điền thông tin user
  useEffect(() => {
    if (loggedInUser) {
      setFormData((prev) => ({
        ...prev,
        name: loggedInUser.name || "",
        email: loggedInUser.email || "",
      }));
    }
  }, [loggedInUser]); // Giữ nguyên dependency

  // ... (Các hàm handleBookingComplete, handleInputChange, handleSubmit giữ nguyên) ...
  // ... (Logic bên trong handleSubmit của bạn đã ĐÚNG, không cần sửa) ...
  const handleBookingComplete = useCallback((data: BookingData) => {
    setFormData((prev) => ({
      ...prev,
      service: data.service || "",
      date: data.date || "",
      time: data.time || "",
      doctorId: data.doctorId || null,
    }));
    setIsBookingOpen(false);
  }, []);

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // ✅ BƯỚC 1: Kiểm tra xác thực
      if (!loggedInUser) {
        throw new Error("Vui lòng đăng nhập để đặt lịch khám.");
      }

      if (loggedInUser.role !== "patient") {
        throw new Error("Chỉ tài khoản Bệnh nhân mới có thể đặt lịch khám.");
      }

      // ✅ BƯỚC 2: Validate dữ liệu form
      if (!formData.doctorId) {
        throw new Error("Vui lòng chọn bác sĩ.");
      }

      if (!formData.date || !formData.time) {
        throw new Error("Vui lòng chọn ngày giờ khám.");
      }

      // ✅ BƯỚC 3: Lấy và validate userId
      const userIdStr = loggedInUser.id;
      const userId = parseInt(userIdStr);

      console.log("🔍 [DEBUG] Raw userId from loggedInUser:", userIdStr);
      console.log("🔍 [DEBUG] Parsed userId:", userId);

      if (isNaN(userId) || userId <= 0) {
        throw new Error(
          "Thông tin đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
        );
      }

      // ✅ BƯỚC 4: Chuẩn bị DateTime (ISO string format)
      const [hours, minutes] = formData.time.split(":").map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Thời gian không hợp lệ. Vui lòng chọn lại.");
      }

      // Create Date object safely with proper validation
      // Check if formData.time already has seconds, if not add them
      let timeString = formData.time;
      if (!timeString.includes(":00") || timeString.split(":").length === 2) {
        timeString = `${formData.time}:00`; // Add seconds if not present
      }
      const dateTimeString = `${formData.date}T${timeString}`;

      // Create Date object in local timezone (no UTC conversion)
      const appointmentDate = new Date(dateTimeString);

      // Validate the date is valid
      if (isNaN(appointmentDate.getTime())) {
        throw new Error(
          `Thời gian không hợp lệ: ${dateTimeString}. Vui lòng chọn lại.`,
        );
      }

      // Send local time string to backend (not ISO UTC)
      const appointmentDateStr = dateTimeString;

      console.log("📅 [DEBUG] Appointment DateTime:", {
        selectedDate: formData.date,
        selectedTime: formData.time,
        timeLength: formData.time.length,
        timeFormat: formData.time.includes(":") ? "HH:MM" : "other",
        dateTimeString: dateTimeString,
        appointmentDate: appointmentDate,
        appointmentDateStr: appointmentDateStr,
        isValid: !isNaN(appointmentDate.getTime()),
        note: "Converted to ISO string for backend DateTime parsing",
      });

      // ✅ BƯỚC 5: Tạo request - Backend tự động lấy userId từ JWT token
      const requestData: CreateAppointmentByPatientRequest = {
        doctorId: formData.doctorId,
        appointmentDate: appointmentDateStr,
        reasonForVisit:
          formData.message?.trim() || `Đặt lịch khám: ${formData.service}`,
      };

      console.log("📤 [DEBUG] Request Data:", {
        doctorId: requestData.doctorId,
        appointmentDate: requestData.appointmentDate,
        reasonForVisit: requestData.reasonForVisit,
      });

      // ✅ BƯỚC 6: Gọi API
      const result = await appointmentService.createByPatient(requestData);

      console.log("✅ [SUCCESS] API Response:", result);

      // ✅ BƯỚC 7: Hiển thị thông báo thành công
      const successMsg = `Đặt lịch thành công! Mã lịch hẹn: #${result.appointmentId}`;
      setSuccess(successMsg);
      toast.success(
        "Đặt lịch thành công! Vui lòng kiểm tra email để xác nhận.",
        {
          duration: 6000,
          icon: "✅",
        },
      );

      // ✅ BƯỚC 8: Reset form (giữ lại name và email)
      setFormData((prev) => ({
        name: prev.name,
        email: prev.email,
        service: "",
        date: "",
        time: "",
        message: "",
        doctorId: null,
      }));

      // Scroll lên đầu trang để xem thông báo
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("❌ [ERROR] Appointment Creation Failed:", err);

      let errorMsg = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";

      if (err.message) {
        errorMsg = err.message;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.title) {
        errorMsg = err.response.data.title;
      }

      setError(errorMsg);
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: getDoctors function removed as ServiceSelection now uses Manager API directly

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Toaster position="top-right" />

      <main className="flex-1">
        {/* Hero Section (Giữ nguyên) */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5">
          {/* ... */}
        </section>

        {/* Contact Section */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
              {/* Contact Info (Giữ nguyên) */}
              <div>
                {/* ... (Toàn bộ code thông tin liên hệ giữ nguyên) ... */}
                <h2 className="mb-8 text-3xl font-bold">Thông tin liên hệ</h2>
                <p className="mb-12 text-lg text-muted-foreground">
                  Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Card className="border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                        <MapPin className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Địa chỉ</h3>
                        <p className="text-sm text-muted-foreground">
                          Thôn 1, Thạch Hòa, Thạch Thất, Hà Nội
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg">
                        <Phone className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Hotline</h3>
                        <p className="text-sm text-muted-foreground">
                          0999-999-999
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                        <Mail className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Email</h3>
                        <p className="text-sm text-muted-foreground">
                          diamondheathclinic@gmail.com
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-none bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-lg">
                    <CardContent className="flex flex-col items-center gap-4 p-7 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg">
                        <Clock className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold">Giờ làm việc</h3>
                        <p className="text-sm text-muted-foreground">
                          T2-T7: 8:00 - 22:00
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Form */}
              <Card className="border-none bg-gradient-to-br from-muted/30 to-muted/50 shadow-2xl">
                <CardContent className="p-10">
                  <div className="mb-8 flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <h3 className="text-3xl font-bold">Đặt lịch tư vấn</h3>
                  </div>

                  {/* ✅ SỬA LỖI HYDRATION: Thêm check "isClient &&" */}
                  {/* Chỉ render các khối này ở client */}
                  {isClient && !loggedInUser && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p>
                        Bạn cần đăng nhập với tài khoản Bệnh nhân để đặt lịch.
                      </p>
                    </div>
                  )}

                  {/* ✅ SỬA LỖI HYDRATION: Thêm check "isClient &&" */}
                  {isClient &&
                    loggedInUser &&
                    loggedInUser.role !== "patient" && (
                      <div className="mb-6 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>Chỉ tài khoản Bệnh nhân mới có thể đặt lịch khám.</p>
                      </div>
                    )}

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">
                        Họ và tên{" "}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="h-12 w-full rounded-xl border-2 border-input bg-white px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-muted"
                        placeholder="Nhập họ và tên"
                        required
                        // ✅ SỬA LỖI HYDRATION: Thêm !isClient
                        disabled={!isClient || !!loggedInUser}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-12 w-full rounded-xl border-2 border-input bg-white px-4 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-muted"
                        placeholder="Nhập email"
                        // ✅ SỬA LỖI HYDRATION: Thêm !isClient
                        disabled={!isClient || !!loggedInUser}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold">
                        Đặt lịch khám{" "}
                      </label>
                      <Button
                        type="button"
                        onClick={() => setIsBookingOpen(true)}
                        className="h-12 w-full bg-secondary text-white font-semibold hover:bg-secondary/90"
                        // ✅ SỬA LỖI HYDRATION: Thêm !isClient
                        disabled={
                          !isClient ||
                          !loggedInUser ||
                          loggedInUser.role !== "patient"
                        }
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        {formData.doctorId
                          ? "Thay đổi lịch hẹn"
                          : "Chọn Bác sĩ và Thời gian"}
                      </Button>
                    </div>

                    {formData.doctorId && formData.date && (
                      <div className="rounded-lg bg-secondary/10 p-4 border border-secondary/20">
                        <p className="text-sm font-semibold mb-2">
                          Thông tin đã chọn:
                        </p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {formData.service && (
                            <p>• Dịch vụ: {formData.service}</p>
                          )}
                          {formData.date && (
                            <p>
                              • Ngày:{" "}
                              {new Date(formData.date).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          )}
                          {formData.time && <p>• Giờ: {formData.time}</p>}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-sm font-semibold">
                        Lý do khám
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-xl border-2 border-input bg-white px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                        placeholder="Nhập lý do khám"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <p>{success}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="h-14 w-full bg-primary text-base font-semibold shadow-lg hover:bg-primary/90 disabled:opacity-50"
                      // ✅ SỬA LỖI HYDRATION: Thêm !isClient
                      disabled={
                        !isClient ||
                        isLoading ||
                        !loggedInUser ||
                        loggedInUser.role !== "patient"
                      }
                    >
                      {isLoading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {isBookingOpen && (
            <BookingModal
              isOpen={isBookingOpen}
              onClose={() => setIsBookingOpen(false)}
              onComplete={handleBookingComplete}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
