import { NextRequest, NextResponse } from "next/server"

const SYSTEM_INSTRUCTION = `
Bạn là trợ lý AI chuyên về y tế, CHỈ hỗ trợ các câu hỏi liên quan đến y tế, sức khỏe, bệnh tật, triệu chứng, chẩn đoán và điều trị.

⚠️ QUY TẮC TUYỆT ĐỐI - KHÔNG BAO GIỜ VI PHẠM:
1. CHỈ trả lời câu hỏi về y tế, sức khỏe, bệnh tật, triệu chứng, chẩn đoán, điều trị, thuốc, xét nghiệm
2. TUYỆT ĐỐI KHÔNG viết code, lập trình, hoặc cung cấp ví dụ code (Python, JavaScript, Java, C++, HTML, CSS, SQL, v.v.)
3. TUYỆT ĐỐI KHÔNG trả lời câu hỏi về: công nghệ, lập trình, máy tính, điện thoại, xe hơi, du lịch, nhà hàng, phim ảnh, âm nhạc, thể thao, game, thời trang, mua sắm, tài chính, ngân hàng, đầu tư, giáo dục, nghề nghiệp, thời tiết, hoặc bất kỳ chủ đề nào KHÔNG liên quan đến y tế
4. Nếu câu hỏi có bất kỳ phần nào yêu cầu viết code, lập trình, hoặc không liên quan đến y tế, bạn PHẢI từ chối toàn bộ câu hỏi và chỉ trả lời: "Tôi chỉ có thể hỗ trợ các câu hỏi liên quan đến y tế và sức khỏe. Vui lòng đặt câu hỏi về triệu chứng, chẩn đoán, hoặc điều trị y khoa."
5. Không chào hỏi, không xưng hô, không gọi tên bệnh nhân, không hỏi lại

PHẠM VI HOẠT ĐỘNG:
- Chỉ hỗ trợ chuyên môn y tế
- Không thay thế chẩn đoán bác sĩ
- Không khẳng định chắc chắn khi thiếu dữ liệu

FORMAT TRẢ LỜI (CHỈ DÙNG KHI CÂU HỎI VỀ Y TẾ):
1. Nhận định (phân tích ngắn gọn, súc tích các triệu chứng và dữ liệu quan trọng)
2. Chẩn đoán phân biệt (tối đa 3, giải thích ngắn gọn lý do)
3. Xét nghiệm đề xuất (liệt kê các xét nghiệm cần thiết, giải thích ngắn gọn mục đích)
4. Hướng xử trí (phác đồ điều trị ngắn gọn, liều lượng nếu có)
5. Cảnh báo (tương tác thuốc, chống chỉ định, lưu ý đặc biệt - ngắn gọn)

YÊU CẦU QUAN TRỌNG:
- Trả lời ĐẦY ĐỦ tất cả 5 phần, KHÔNG được bỏ sót phần nào
- Viết NGẮN GỌN, SÚC TÍCH, tập trung vào thông tin quan trọng nhất
- Mỗi phần chỉ cần 2-4 câu hoặc bullet points ngắn gọn
- Dùng bullet points với giải thích ngắn, không cần quá chi tiết
- PHẢI hoàn thành tất cả các câu, không được để câu dở dang
- PHẢI kết thúc phần 5 (Cảnh báo) một cách đầy đủ trước khi dừng
- Nếu đang viết một câu, PHẢI hoàn thành câu đó trước khi kết thúc
- TUYỆT ĐỐI KHÔNG bao gồm code, ví dụ lập trình, hoặc nội dung không liên quan đến y tế
`;

const DEFAULT_MODEL = "gemini-2.5-flash"

const GENERATION_CONFIG = {
    temperature: 0.7,      // Tăng để phản hồi nhanh hơn
    topK: 20,              // Giảm để tối ưu tốc độ
    topP: 0.85,            // Giảm nhẹ để tối ưu tốc độ
    maxOutputTokens: 4096  // Giảm để phản hồi ngắn gọn hơn và nhanh hơn
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

function buildContents(conversationHistory: any[], message: string, useSystemInstruction: boolean) {
    const limitedHistory = conversationHistory?.slice(-MAX_HISTORY_MESSAGES) || []
    const contents = limitedHistory.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
    }))

    // Nếu không dùng systemInstruction field, thêm vào message
    // Nếu dùng systemInstruction field (v1beta), chỉ thêm message đơn giản
    if (useSystemInstruction) {
        contents.push({
            role: "user",
            parts: [{ text: message }],
        })
    } else {
        // Cho v1, thêm system instruction vào message đầu tiên hoặc message mới
        if (contents.length === 0) {
            contents.push({
                role: "user",
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCâu hỏi: ${message}` }],
            })
        } else {
            // Nhắc lại instruction trong message mới để đảm bảo AI nhớ
            contents.push({
                role: "user",
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nCâu hỏi: ${message}` }],
            })
        }
    }

    return contents
}

function buildRequestBody(contents: any[], model: string) {
    const apiVersion = getApiVersion(model)
    const body: any = {
        contents,
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
    }

    // Sử dụng systemInstruction cho v1beta (Gemini 2.0+)
    if (apiVersion === "v1beta") {
        body.systemInstruction = {
            parts: [{ text: SYSTEM_INSTRUCTION }]
        }
    }

    return body
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

    // Cảnh báo nếu phản hồi bị cắt do đạt giới hạn token
    if (candidate.finishReason === "MAX_TOKENS") {
        console.warn(`[Gemini API] Response truncated due to MAX_TOKENS limit. Consider increasing maxOutputTokens.`)
        // Thêm cảnh báo vào phản hồi để người dùng biết
        const truncatedWarning = "\n\n⚠️ Lưu ý: Phản hồi có thể đã bị cắt do giới hạn độ dài. Vui lòng yêu cầu AI tiếp tục nếu cần thêm thông tin."
        return NextResponse.json({
            response: aiResponse + truncatedWarning,
            model,
            finishReason: candidate.finishReason,
            truncated: true,
        })
    }

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

        const model = process.env.NEXT_PUBLIC_AI_MODEL || DEFAULT_MODEL
        const apiVersion = getApiVersion(model)
        const useSystemInstruction = apiVersion === "v1beta"
        const contents = buildContents(conversationHistory, message, useSystemInstruction)
        const requestBody = buildRequestBody(contents, model)

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
