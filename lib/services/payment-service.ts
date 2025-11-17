import {
    CreatePaymentRequest,
    PaymentLinkResponse,
    PaymentDetailsResponse,
    CreatePaymentResponse
} from "@/lib/types/payment";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


export async function getPaymentDetails(recordId: number): Promise<PaymentDetailsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/Payments/record/${recordId}`, {
        method: "GET",
        cache: "no-store"
    });

    if (!res.ok) {
        throw new Error("Failed to load payment details");
    }

    return res.json();
}



export async function createPayment(payload: any) {
    const res = await fetch(`${API_BASE_URL}/api/Payments/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Lỗi tạo thanh toán");
    }

    return res.json(); // { paymentId, checkoutUrl }
}

export async function getPaymentStatus(recordId: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Payments/status/${recordId}`, {
        method: "GET",
        cache: "no-store",
    });

    if (!res.ok) throw new Error("Không lấy được trạng thái thanh toán");

    return res.json();
}




