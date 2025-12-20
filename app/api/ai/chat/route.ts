import { NextRequest, NextResponse } from "next/server"

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý AI hỗ trợ bác sĩ trong tham khảo chẩn đoán y khoa.

QUY TẮC BẮT BUỘC:
- Không chào hỏi
- Không xưng hô
- Không gọi tên bệnh nhân
- Không hỏi lại

PHẠM VI:
- Chỉ mang tính hỗ trợ chuyên môn
- Không thay thế chẩn đoán bác sĩ
- Không khẳng định chắc chắn khi thiếu dữ liệu

FORMAT TRẢ LỜI (CHỈ DÙNG FORMAT NÀY):
1. Nhận định (phân tích chi tiết các triệu chứng và dữ liệu)
2. Chẩn đoán phân biệt (tối đa 3, giải thích rõ lý do)
3. Xét nghiệm đề xuất (liệt kê đầy đủ và giải thích mục đích)
4. Hướng xử trí (phác đồ điều trị chi tiết, liều lượng nếu có)
5. Cảnh báo (tương tác thuốc, chống chỉ định, lưu ý đặc biệt)

YÊU CẦU:
- Trả lời đầy đủ, chi tiết, không bỏ sót thông tin quan trọng
- Mỗi phần phải có nội dung cụ thể, không chỉ liệt kê
- Dùng bullet points nhưng phải giải thích rõ ràng
- Kết thúc câu đầy đủ, không dở dang
`;

const DEFAULT_MODEL = "gemini-2.5-flash"

const GENERATION_CONFIG = {
    temperature: 0.5,      // Cân bằng giữa chính xác và chi tiết
    topK: 32,              // Nhiều lựa chọn hơn để trả lời đầy đủ
    topP: 0.9,             // Cho phép nhiều từ vựng hơn
    maxOutputTokens: 3072  // Tăng để trả lời dài và đầy đủ
};

const MAX_HISTORY_MESSAGES = 10
const API_TIMEOUT = 30000

const SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
]

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>
        }
        finishReason?: string
    }>
    promptFeedback?: {
        blockReason?: string
    }
    error?: {
        message?: string
    }
}

interface ApiCallResult {
    response: Response
    responseText: string
    model: string
}

function getApiVersion(model: string): string {
    return model.includes("2.5") || model.includes("2.0") || model.includes("exp") ? "v1beta" : "v1"
}

function buildContents(conversationHistory: any[], message: string) {
    const limitedHistory = conversationHistory?.slice(-MAX_HISTORY_MESSAGES) || []
    const contents = limitedHistory.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
    }))

    if (contents.length === 0) {
        contents.push({
            role: "user",
            parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCâu hỏi: ${message}` }],
        })
    } else {
        contents.push({
            role: "user",
            parts: [{ text: message }],
        })
    }

    return contents
}

function buildRequestBody(contents: any[]) {
    return {
        contents,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
    }
}

async function callGeminiAPI(
    model: string,
    apiKey: string,
    requestBody: any
): Promise<ApiCallResult> {
    const apiVersion = getApiVersion(model)
    const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`

    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const responseText = await response.text()
        const duration = Date.now() - startTime

        if (!response.ok || duration > 3000) {
            console.log(`[Gemini API] ${model} - Status: ${response.status}, Duration: ${duration}ms`)
        }

        return { response, responseText, model }
    } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout after ${API_TIMEOUT}ms`)
        }
        throw error
    }
}

function extractTextFromCandidate(candidate: any): string {
    if (!candidate.content?.parts || candidate.content.parts.length === 0) {
        return ""
    }

    return candidate.content.parts
        .map((part: any) => part.text || "")
        .filter((text: string) => text.length > 0)
        .join("")
}

function logResponseDetails(model: string, aiResponse: string, finishReason?: string) {
    const isDevelopment = process.env.NODE_ENV === "development"

    if (isDevelopment) {
        console.log(`[Gemini API] Success: ${model} - ${aiResponse.length} chars - ${finishReason || "NONE"}`)
    }

    if (finishReason === "MAX_TOKENS" || finishReason === "SAFETY") {
        console.warn(`[Gemini API] ${model} - Finish reason: ${finishReason}, Length: ${aiResponse.length} chars`)
    }
}

function parseErrorResponse(responseText: string): string {
    try {
        const errorData = JSON.parse(responseText)
        return errorData.error?.message || errorData.error || responseText
    } catch {
        return responseText
    }
}

function getUserFriendlyErrorMessage(errorMessage: string): string {
    if (errorMessage.includes("not found") || errorMessage.includes("is not found")) {
        return "Tất cả các model AI đều không khả dụng. Vui lòng liên hệ quản trị viên."
    }
    if (errorMessage.includes("quota") || errorMessage.includes("Quota exceeded")) {
        return "Đã vượt quá giới hạn sử dụng API. Vui lòng kiểm tra gói dịch vụ và thử lại sau. Xem thêm tại: https://ai.google.dev/gemini-api/docs/rate-limits"
    }
    if (errorMessage.includes("rate limit") || errorMessage.includes("rate_limit")) {
        return "Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại sau."
    }
    if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
        return "API key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên."
    }
    if (errorMessage.includes("429")) {
        return "Quá nhiều yêu cầu. Vui lòng đợi và thử lại sau."
    }
    return "Không thể lấy phản hồi từ AI. Vui lòng thử lại sau."
}

function validateRequest(message: string, apiKey: string | undefined) {
    if (!message) {
        return NextResponse.json(
            { error: "Message is required" },
            { status: 400 }
        )
    }

    if (!apiKey) {
        console.error("NEXT_PUBLIC_AI_KEY is not set")
        return NextResponse.json(
            { error: "AI service is not configured" },
            { status: 500 }
        )
    }

    return null
}

function processSuccessfulResponse(
    data: GeminiResponse,
    model: string
): NextResponse | null {
    if (data.promptFeedback?.blockReason) {
        console.error(`[Gemini API] Content blocked by ${model}:`, data.promptFeedback)
        return null
    }

    if (!data.candidates || data.candidates.length === 0) {
        console.error(`[Gemini API] No candidates from ${model}`)
        return null
    }

    const candidate = data.candidates[0]

    if (candidate.finishReason === "SAFETY") {
        console.error(`[Gemini API] Response blocked by safety filters for ${model}`)
        return null
    }

    const aiResponse = extractTextFromCandidate(candidate)

    if (!aiResponse || aiResponse.trim().length === 0) {
        console.error(`[Gemini API] Empty response from ${model}`)
        return null
    }

    logResponseDetails(model, aiResponse, candidate.finishReason)

    return NextResponse.json({
        response: aiResponse,
        model,
        finishReason: candidate.finishReason,
    })
}

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory } = await request.json()
        const apiKey = process.env.NEXT_PUBLIC_AI_KEY

        const validationError = validateRequest(message, apiKey)
        if (validationError) {
            return validationError
        }

        const contents = buildContents(conversationHistory, message)
        const requestBody = buildRequestBody(contents)
        const model = process.env.NEXT_PUBLIC_AI_MODEL || DEFAULT_MODEL

        try {
            const { response, responseText } = await callGeminiAPI(model, apiKey!, requestBody)

            if (response.ok) {
                let data: GeminiResponse
                try {
                    data = JSON.parse(responseText)
                } catch (error) {
                    console.error(`[Gemini API] Failed to parse response from ${model}:`, error)
                    return NextResponse.json(
                        { error: "Không thể xử lý phản hồi từ AI. Vui lòng thử lại sau." },
                        { status: 500 }
                    )
                }

                const result = processSuccessfulResponse(data, model)
                if (result) {
                    return result
                }

                return NextResponse.json(
                    { error: "AI không thể tạo phản hồi. Vui lòng thử lại sau." },
                    { status: 500 }
                )
            } else {
                const errorMessage = parseErrorResponse(responseText)
                const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage)

                return NextResponse.json(
                    {
                        error: userFriendlyMessage,
                        details: errorMessage,
                        statusCode: response.status,
                    },
                    { status: response.status }
                )
            }
        } catch (error: any) {
            console.error(`[Gemini API] Error calling ${model}:`, error)
            return NextResponse.json(
                { error: "Không thể kết nối đến AI. Vui lòng thử lại sau." },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error("Error in AI chat API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
