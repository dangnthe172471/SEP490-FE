export interface PaymentItem {
    name: string;
    quantity: number;
    price: number;
}

export interface CreatePaymentRequest {
    medicalRecordId: number;
    amount: number;
    description: string;
    items: PaymentItem[];
}

export interface PaymentLinkResponse {
    checkoutUrl: string;
}

export interface PaymentDetailsItem {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface PaymentDetailsResponse {
    recordId: number;
    totalAmount: number;
    items: PaymentDetailsItem[];
}

export interface CreatePaymentResponse {
    paymentId: number;
}
export type PaymentChartDto = {
    paymentDate: string
    amount: number
}