import {
    CreatePaymentRequest,
    PaymentLinkResponse,
    PaymentDetailsResponse,
    CreatePaymentResponse,
    PaymentChartDto
} from "@/lib/types/payment";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


export async function getPaymentDetails(
  recordId: number
): Promise<PaymentDetailsResponse | null> {
  const res = await fetch(`${API_BASE_URL}/api/Payments/record/${recordId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to load payment details");
  }

  return res.json();
}



export async function createPayment(payload: any): Promise<CreatePaymentResponse> {
    const res = await fetch(`${API_BASE_URL}/api/Payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    // Nếu BE trả về checkoutUrl thì coi như success
    if (data?.checkoutUrl) return data;


    if (!res.ok) throw new Error(data?.message || "Lỗi tạo thanh toán");

    return data;
}

export async function createPayment2(payload: any): Promise<CreatePaymentResponse> {
    const res = await fetch(`${API_BASE_URL}/api/Payments/createReceptionPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (data?.checkoutUrl) return data;

    if (!res.ok) throw new Error(data?.message || "Lỗi tạo thanh toán");

    return data;
}


export async function getPaymentStatus(recordId: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Payments/status/${recordId}`, {
        method: "GET",
        cache: "no-store",
    });

    if (!res.ok) throw new Error("Không lấy được trạng thái thanh toán");

    return res.json();
}

export async function getPaymentsChartData(start: string, end: string): Promise<PaymentChartDto[]> {
    const res = await fetch(`${API_BASE_URL}/api/Payments/payments-chart?start=${start}&end=${end}`, {
        method: "GET",
        cache: "no-store",
    })

    if (!res.ok) throw new Error("Không lấy được dữ liệu chart")

    return res.json()
}


