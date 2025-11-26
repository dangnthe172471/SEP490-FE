'use client'

import { useState, useEffect } from "react"
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {DollarSign } from 'lucide-react'
import { } from "@/lib/services/payment-service";
import { useSearchParams } from "next/navigation";
import { createPayment, getPaymentStatus, getPaymentDetails } from "@/lib/services/payment-service";
import { PaymentDetailsResponse, PaymentDetailsItem } from "@/lib/types/payment";


export default function PaymentPage() {

    const [loading, setLoading] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsResponse | null>(null);

    const [loadingDetails, setLoadingDetails] = useState(true);
    const searchParams = useSearchParams();
    const medicalRecordId = searchParams.get("medicalRecordId");
    const [isPaid, setIsPaid] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkStatus() {
            if (!medicalRecordId) return;

            try {
                const res = await getPaymentStatus(Number(medicalRecordId));
                // BE trả về Status = "Paid"
                setIsPaid(res.status === "Paid");
            } catch (err) {
                console.log("Lỗi kiểm tra thanh toán", err);
                setIsPaid(false);
            }
        }

        checkStatus();
    }, [medicalRecordId]);

    useEffect(() => {
        async function fetchDetails() {
            if (!medicalRecordId) return;

            try {
                const res = await getPaymentDetails(Number(medicalRecordId));
                setPaymentDetails(res);
            } catch (err) {
                console.error("Lỗi load payment details:", err);
            } finally {
                setLoadingDetails(false);
            }
        }

        fetchDetails();
    }, [medicalRecordId]);

    // ktra medicalrecordid
    if (!medicalRecordId) {
        return <div className="p-10">Không có medicalRecordId!</div>;
    }

    // ktra medical service
    if (loadingDetails) {
        return <div className="p-10">Đang tải thông tin thanh toán...</div>;
    }

    if (!paymentDetails) {
        return <div className="p-10">Không tìm thấy thông tin thanh toán!</div>;
    }
    const services: PaymentDetailsItem[] = paymentDetails.items ?? [];
    const total = paymentDetails.totalAmount ?? 0;


    return (
        <div className='flex min-h-screen flex-col'>
            <Header />

            <main className='flex-1'>
                {/* Page Header */}
                <section className='bg-gradient-to-br from-primary/5 to-primary/10 py-12'>
                    <div className='container mx-auto px-4'>
                        <div className='space-y-3'>
                            <h1 className='text-4xl font-bold'>Thanh toán lịch khám</h1>
                            <p className='text-muted-foreground'>Hoàn tất thanh toán để xác nhận lịch khám của bạn</p>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <section className='py-12'>
                    <div className='container mx-auto px-4'>
                        <div className='grid gap-8 lg:grid-cols-3'>
                            {/* Appointment Details */}
                            <div className='lg:col-span-2 space-y-6'>


                                <Card className='border-0 shadow-lg ring-1 ring-primary/10'>
                                    <CardHeader className='bg-gradient-to-r from-primary/5 to-secondary/5 pb-6'>
                                        <CardTitle className='flex items-center gap-3 text-2xl'>
                                            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20'>
                                                <DollarSign className='h-5 w-5 text-primary' />
                                            </div>
                                            Chi tiết thanh toán
                                        </CardTitle>
                                        <CardDescription className='text-base mt-2'>
                                            Danh sách đầy đủ các dịch vụ và chi phí tương ứng
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className='pt-8'>
                                        <div className='space-y-6'>
                                            {/* Services Table with enhanced styling */}
                                            <div className='overflow-x-auto rounded-lg border border-border/50'>
                                                <table className='w-full text-sm'>
                                                    <thead>
                                                        <tr className='bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50'>
                                                            <th className='text-left py-4 px-6 font-bold text-foreground'>Dịch vụ</th>
                                                            <th className='text-center py-4 px-4 font-bold text-foreground'>Số lượng</th>
                                                            <th className='text-right py-4 px-6 font-bold text-foreground'>Giá</th>
                                                            <th className='text-right py-4 px-6 font-bold text-foreground'>Tổng cộng</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {services.map((service, index) => (
                                                            <tr key={index} className='border-b border-border/30 hover:bg-primary/2'>
                                                                <td className='py-5 px-6'>
                                                                    <p className='font-semibold'>{service.name}</p>
                                                                </td>

                                                                <td className='text-center py-5 px-4'>
                                                                    {service.quantity}
                                                                </td>

                                                                <td className='text-right py-5 px-6 font-medium'>
                                                                    {service.unitPrice.toLocaleString("vi-VN")}đ
                                                                </td>

                                                                <td className='text-right py-5 px-6 font-bold'>
                                                                    {service.total.toLocaleString("vi-VN")}đ
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>

                                                </table>
                                            </div>

                                            {/* Enhanced Pricing Summary with better visual design */}
                                            <div className='bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/3 rounded-xl p-6 border border-primary/10'>
                                                <div className='space-y-4'>
                                                    {/* Subtotal */}
                                                    <div className='flex items-center justify-between pb-4 border-b border-border/30'>
                                                        <div>
                                                            <p className='text-sm font-medium text-muted-foreground'>Tổng tiền dịch vụ</p>
                                                            <p className='text-xs text-muted-foreground mt-1'>Chưa bao gồm thuế VAT</p>
                                                        </div>
                                                        <span className='text-lg font-bold text-foreground'>  {total.toLocaleString('vi-VN')}đ</span>
                                                    </div>

                                                    {/* Tax
                                                    <div className='flex items-center justify-between pb-4 border-b border-border/30'>
                                                        <div>
                                                            <p className='text-sm font-medium text-muted-foreground'>Thuế VAT</p>
                                                            <p className='text-xs text-muted-foreground mt-1'>Tỷ lệ 8% trên tổng tiền</p>
                                                        </div>
                                                        <span className='text-lg font-bold text-orange-600'>{tax.toLocaleString('vi-VN')}đ</span>
                                                    </div> */}

                                                    {/* Total Amount - Prominent */}
                                                    <div className='flex items-center justify-between pt-2 bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-4 rounded-lg'>
                                                        <div>
                                                            <p className='text-sm font-semibold text-foreground'>Tổng cộng</p>
                                                            <p className='text-xs text-muted-foreground mt-1'>Số tiền bạn cần thanh toán</p>
                                                        </div>
                                                        <div className='text-right'>
                                                            <p className='text-3xl font-bold text-primary'>{total.toLocaleString('vi-VN')}đ</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info Banner */}
                                            <div className='bg-blue/5 border border-blue/20 rounded-lg p-4 flex gap-3'>
                                                <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue/20 flex-shrink-0'>
                                                    <span className='text-blue-600 font-bold text-sm'>i</span>
                                                </div>
                                                <div>
                                                    <p className='text-sm font-semibold text-foreground mb-1'>Ghi chú quan trọng</p>
                                                    <p className='text-xs text-muted-foreground'>Giá trên đã bao gồm tất cả chi phí. Không có phí phát sinh thêm. Vui lòng kiểm tra lại trước khi thanh toán.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Methods */}

                            </div>

                            <div className='lg:col-span-1'>
                                <Card className='sticky top-24 border-0 shadow-lg ring-1 ring-primary/10'>
                                    <CardHeader className='bg-gradient-to-br from-primary/5 to-primary/10'>
                                        <CardTitle>Tóm tắt thanh toán</CardTitle>
                                    </CardHeader>
                                    <CardContent className='space-y-6 pt-6'>
                                        <div className='space-y-3'>
                                            <div className='flex justify-between'>
                                                <span className='text-muted-foreground'>Tổng dịch vụ</span>
                                                <span className='font-semibold'>  {total.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            {/* <div className='flex justify-between'>
                                                <span className='text-muted-foreground'>VAT (8%)</span>
                                                <span className='font-semibold'>{tax.toLocaleString('vi-VN')}đ</span>
                                            </div> */}
                                            <div className='flex justify-between'>
                                                <span className='text-muted-foreground'>Phí quản lý</span>
                                                <span className='font-semibold'>Miễn phí</span>
                                            </div>
                                            <div className='flex justify-between'>
                                                <span className='text-muted-foreground'>Phí tư vấn</span>
                                                <span className='font-semibold'>Miễn phí</span>
                                            </div>
                                            <div className='border-t pt-3 flex justify-between'>
                                                <span className='font-semibold'>Tổng cộng</span>
                                                <span className='text-2xl font-bold text-primary'>{total.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        </div>

                                        {isPaid === true ? (
                                            <div className="w-full py-3 text-center bg-green-100 text-green-700 rounded-lg font-semibold">
                                                ✓ Hồ sơ này đã được thanh toán
                                            </div>
                                        ) : (
                                            <Button
                                                className="w-full h-12 text-base font-semibold"
                                                disabled={loading}
                                                onClick={async () => {
                                                    setLoading(true);
                                                    try {
                                                        const payload = {
                                                            medicalRecordId: Number(medicalRecordId),
                                                            amount: total,
                                                            description: "Thanh toán lịch khám",
                                                            items: services.map(s => ({
                                                                name: s.name,
                                                                quantity: s.quantity,
                                                                price: s.unitPrice
                                                            }))

                                                        };

                                                        const res = await createPayment(payload);
                                                        window.location.href = res.checkoutUrl;

                                                    } catch (err: any) {
                                                        console.error(err);
                                                        alert(err.message || "Không thể tạo thanh toán");
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                {loading ? "Đang tạo thanh toán..." : "Thanh toán ngay"}
                                            </Button>
                                        )}



                                        {/* <div className='bg-blue/5 rounded-lg p-4 space-y-2'>
                                            <p className='text-sm font-semibold text-foreground'>Lưu ý quan trọng</p>
                                            <ul className='text-xs text-muted-foreground space-y-1'>
                                                <li>• Thanh toán trước để xác nhận lịch khám</li>
                                                <li>• Hoàn tiền 100% nếu hủy 24 giờ trước</li>
                                                <li>• Khi thanh toán xong, bạn sẽ nhận xác nhận qua email</li>
                                            </ul>
                                        </div> */}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* QR Code Payment Modal */}
            {/* <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
                <DialogContent
                    className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden"
                >
                    {checkoutUrl ? (
                        <iframe
                            src={checkoutUrl}
                            className="w-full h-full border-none"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full">
                            <p className="text-sm text-muted-foreground">Đang tải trang thanh toán...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog> */}



            <Footer />
        </div>
    )
}
