import { NextRequest, NextResponse } from "next/server"

// Constants
const SYSTEM_INSTRUCTION = `Bạn là trợ lý AI hỗ trợ bác sĩ chẩn đoán và tư vấn y khoa. Nhiệm vụ: gợi ý chẩn đoán phân biệt, đề xuất xét nghiệm, cung cấp phác đồ điều trị, cảnh báo tương tác thuốc. QUAN TRỌNG: Đây chỉ là công cụ hỗ trợ, không thay thế chẩn đoán chuyên môn. Trả lời bằng tiếng Việt, chi tiết, có cấu trúc rõ ràng.`

// Prioritize fastest models first
const FALLBACK_MODELS = [
    "gemini-2.5-flash",  // Fastest, try first
    "gemini-2.0-flash",  // Second fastest
    "gemini-1.5-flash"   // Fallback
]

// Optimized generation config for speed
const GENERATION_CONFIG = {
    temperature: 0.7,
    topK: 32,           // Reduced from 40 for faster generation
    topP: 0.9,          // Reduced from 0.95 for faster generation
    maxOutputTokens: 4096, // Reduced from 8192 for faster response (still enough for detailed answers)
}

const SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
]

// Types
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

// Helper functions
function getApiVersion(model: string): string {
    return model.includes("2.5") || model.includes("2.0") || model.includes("exp") ? "v1beta" : "v1"
}

function buildContents(conversationHistory: any[], message: string) {
    const contents = conversationHistory?.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
    })) || []

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

    // Minimal logging for performance
    const startTime = Date.now()

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    const duration = Date.now() - startTime

    // Only log if there's an error or if it's slow
    if (!response.ok || duration > 3000) {
        console.log(`[Gemini API] ${model} - Status: ${response.status}, Duration: ${duration}ms`)
    }

    return { response, responseText, model }
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

function logResponseDetails(model: string, aiResponse: string, finishReason?: string, partsCount?: number) {
    // Only log essential info for performance
    const isDevelopment = process.env.NODE_ENV === "development"

    if (isDevelopment) {
        console.log(`[Gemini API] Success: ${model} - ${aiResponse.length} chars - ${finishReason || "NONE"}`)
    }

    // Only log detailed info if there's an issue
    if (finishReason === "MAX_TOKENS" || finishReason === "SAFETY") {
        console.warn(`[Gemini API] ${model} - Finish reason: ${finishReason}, Length: ${aiResponse.length} chars`)
    }
}

function checkTruncation(aiResponse: string, finishReason?: string): boolean {
    if (finishReason === "MAX_TOKENS") {
        const lastChar = aiResponse.trim().slice(-1)
        const endsWithPunctuation = /[.!?。！？]/.test(lastChar)
        if (!endsWithPunctuation) {
            console.warn(`[Gemini API] Response appears to be cut off mid-sentence`)
            return true
        }
    }
    return false
}

function parseErrorResponse(responseText: string): string {
    try {
        const errorData = JSON.parse(responseText)
        return errorData.error?.message || errorData.error || responseText
    } catch {
        return responseText
    }
}

function shouldRetryWithNextModel(errorMessage: string): boolean {
    return (
        errorMessage.includes("not found") ||
        errorMessage.includes("is not found") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("Quota exceeded")
    )
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
    // Check for blocked content
    if (data.promptFeedback?.blockReason) {
        console.error(`[Gemini API] Content blocked by ${model}:`, data.promptFeedback)
        return null
    }

    if (!data.candidates || data.candidates.length === 0) {
        console.error(`[Gemini API] No candidates from ${model}`)
        return null
    }

    const candidate = data.candidates[0]

    // Check if content was blocked by safety filters
    if (candidate.finishReason === "SAFETY") {
        console.error(`[Gemini API] Response blocked by safety filters for ${model}`)
        return null
    }

    // Extract text from candidate
    const aiResponse = extractTextFromCandidate(candidate)

    if (!aiResponse || aiResponse.trim().length === 0) {
        console.error(`[Gemini API] Empty response from ${model}`)
        return null
    }

    // Log response details (minimal for performance)
    logResponseDetails(
        model,
        aiResponse,
        candidate.finishReason,
        candidate.content?.parts?.length
    )

    // Only check truncation if finishReason indicates it
    if (candidate.finishReason === "MAX_TOKENS") {
        checkTruncation(aiResponse, candidate.finishReason)
    }

    return NextResponse.json({
        response: aiResponse,
        model,
        finishReason: candidate.finishReason,
    })
}

// Main handler
export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory } = await request.json()
        const apiKey = process.env.NEXT_PUBLIC_AI_KEY

        // Validate request
        const validationError = validateRequest(message, apiKey)
        if (validationError) {
            return validationError
        }

        // Build request
        const contents = buildContents(conversationHistory, message)
        const requestBody = buildRequestBody(contents)

        // Determine models to try
        const customModel = process.env.NEXT_PUBLIC_AI_MODEL
        const modelsToTry = customModel ? [customModel] : FALLBACK_MODELS

        // Try each model until one succeeds
        let lastError: any = null

        for (const model of modelsToTry) {
            try {
                const { response, responseText } = await callGeminiAPI(model, apiKey!, requestBody)

                if (response.ok) {
                    let data: GeminiResponse
                    try {
                        data = JSON.parse(responseText)
                    } catch (error) {
                        console.error(`[Gemini API] Failed to parse response from ${model}:`, error)
                        continue
                    }

                    const result = processSuccessfulResponse(data, model)
                    if (result) {
                        return result
                    }

                    // If processing failed, try next model
                    continue
                } else {
                    // Handle error response
                    const errorMessage = parseErrorResponse(responseText)
                    const shouldRetry = shouldRetryWithNextModel(errorMessage)
                    const isLastModel = modelsToTry.indexOf(model) === modelsToTry.length - 1

                    if (shouldRetry && !isLastModel) {
                        console.log(`[Gemini API] Model ${model} failed, trying next model...`)
                        lastError = { response, responseText, errorMessage }
                        continue
                    } else {
                        lastError = { response, responseText, errorMessage }
                        break
                    }
                }
            } catch (error) {
                console.error(`[Gemini API] Error calling ${model}:`, error)
                lastError = error
                // Continue to next model
            }
        }

        // All models failed, return error
        let errorMessage = "Failed to get AI response"
        let userFriendlyMessage = "Không thể lấy phản hồi từ AI. Vui lòng thử lại sau."

        if (lastError?.responseText) {
            errorMessage = parseErrorResponse(lastError.responseText)
            userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage)
        }

        return NextResponse.json(
            {
                error: userFriendlyMessage,
                details: errorMessage,
                statusCode: lastError?.response?.status || 500,
            },
            { status: lastError?.response?.status || 500 }
        )
    } catch (error) {
        console.error("Error in AI chat API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
