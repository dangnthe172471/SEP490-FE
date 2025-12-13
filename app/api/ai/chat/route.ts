import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory } = await request.json()

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            )
        }

        // Use NEXT_PUBLIC_AI_KEY from environment variables
        const apiKey = process.env.NEXT_PUBLIC_AI_KEY

        if (!apiKey) {
            console.error("NEXT_PUBLIC_AI_KEY is not set")
            return NextResponse.json(
                { error: "AI service is not configured" },
                { status: 500 }
            )
        }

        // System instruction for medical assistant
        const systemInstruction =
            `Bạn là một trợ lý AI chuyên hỗ trợ bác sĩ trong việc chẩn đoán và tư vấn y khoa. 
Nhiệm vụ của bạn:
- Hỗ trợ bác sĩ bằng cách cung cấp thông tin y khoa có giá trị tham khảo
- Gợi ý các chẩn đoán phân biệt dựa trên triệu chứng
- Đề xuất các xét nghiệm cần thiết
- Cung cấp thông tin về phác đồ điều trị phổ biến
- Cảnh báo về tương tác thuốc tiềm ẩn
- Bỏ qua chào hỏi và lặp lại thông tin bác sĩ đã cung cấp.

QUAN TRỌNG:
- Đây chỉ là công cụ hỗ trợ, không thay thế chẩn đoán chuyên môn của bác sĩ
- Luôn nhấn mạnh rằng quyết định cuối cùng thuộc về bác sĩ
- Không đưa ra chẩn đoán chắc chắn, chỉ gợi ý và tham khảo
- Trả lời bằng tiếng Việt, chuyên nghiệp và dễ hiểu
- Sử dụng thuật ngữ y khoa chính xác nhưng giải thích rõ ràng`

        // Prepare conversation history for Gemini
        let contents = conversationHistory?.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
        })) || []

        // If no conversation history, add system instruction as first message
        if (contents.length === 0) {
            contents.push({
                role: "user",
                parts: [{ text: systemInstruction + "\n\nCâu hỏi: " + message }],
            })
        } else {
            // Add current message to history
            contents.push({
                role: "user",
                parts: [{ text: message }],
            })
        }

        // Prepare request body
        const requestBody: any = {
            contents: contents,
            generationConfig: {
                temperature: 0.5,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 512,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                },
            ],
        }

        // Fallback models: try 2.0 -> 2.5 -> 1.5
        const fallbackModels = [
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ]

        // Use custom model from env or fallback list
        const customModel = process.env.NEXT_PUBLIC_AI_MODEL
        const modelsToTry = customModel ? [customModel] : fallbackModels

        // Helper function to get API version for a model
        const getApiVersion = (model: string): string => {
            return model.includes("2.5") || model.includes("2.0") || model.includes("exp") ? "v1beta" : "v1"
        }

        // Helper function to call Gemini API with a specific model
        const callGeminiAPI = async (model: string) => {
            const apiVersion = getApiVersion(model)
            const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`

            console.log(`[Gemini API] Trying model: ${model} (${apiVersion})`)
            console.log("Calling Gemini API with URL:", apiUrl.replace(apiKey, "***"))

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            const responseText = await response.text()
            console.log(`[Gemini API] Response status: ${response.status} for model ${model}`)

            return { response, responseText, model }
        }

        // Try each model in order until one succeeds
        let lastError: any = null
        for (const model of modelsToTry) {
            try {
                const { response, responseText } = await callGeminiAPI(model)

                if (response.ok) {
                    let data
                    try {
                        data = JSON.parse(responseText)
                    } catch (error) {
                        console.error(`[Gemini API] Failed to parse response from ${model}:`, error)
                        continue // Try next model
                    }

                    // Check for blocked content or other issues
                    if (data.promptFeedback?.blockReason) {
                        console.error(`[Gemini API] Content blocked by ${model}:`, data.promptFeedback)
                        continue // Try next model
                    }

                    if (!data.candidates || data.candidates.length === 0) {
                        console.error(`[Gemini API] No candidates from ${model}:`, data)
                        continue // Try next model
                    }

                    const candidate = data.candidates[0]

                    // Check if content was blocked
                    if (candidate.finishReason === "SAFETY") {
                        console.error(`[Gemini API] Response blocked by safety filters for ${model}`)
                        continue // Try next model
                    }

                    if (!candidate.content?.parts?.[0]?.text) {
                        console.error(`[Gemini API] Invalid candidate structure from ${model}:`, candidate)
                        continue // Try next model
                    }

                    const aiResponse = candidate.content.parts[0].text
                    console.log(`[Gemini API] Successfully got response from ${model}`)

                    return NextResponse.json({
                        response: aiResponse,
                        model: model, // Include which model was used
                    })
                } else {
                    // Parse error to check if we should try next model
                    let errorMessage = ""
                    try {
                        const errorData = JSON.parse(responseText)
                        errorMessage = errorData.error?.message || errorData.error || responseText
                    } catch {
                        errorMessage = responseText
                    }

                    // If model not found or quota exceeded, try next model
                    const shouldRetry = errorMessage.includes("not found") ||
                        errorMessage.includes("is not found") ||
                        errorMessage.includes("quota") ||
                        errorMessage.includes("Quota exceeded")

                    if (shouldRetry && modelsToTry.indexOf(model) < modelsToTry.length - 1) {
                        console.log(`[Gemini API] Model ${model} failed, trying next model...`)
                        lastError = { response, responseText, errorMessage }
                        continue // Try next model
                    } else {
                        // Last model failed or non-retryable error
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
            try {
                const errorData = JSON.parse(lastError.responseText)
                errorMessage = errorData.error?.message || errorData.error || lastError.responseText

                // Xử lý các lỗi cụ thể
                if (errorMessage.includes("not found") || errorMessage.includes("is not found")) {
                    userFriendlyMessage = "Tất cả các model AI đều không khả dụng. Vui lòng liên hệ quản trị viên."
                } else if (errorMessage.includes("quota") || errorMessage.includes("Quota exceeded")) {
                    userFriendlyMessage = "Đã vượt quá giới hạn sử dụng API. Vui lòng kiểm tra gói dịch vụ và thử lại sau. Xem thêm tại: https://ai.google.dev/gemini-api/docs/rate-limits"
                } else if (errorMessage.includes("rate limit") || errorMessage.includes("rate_limit")) {
                    userFriendlyMessage = "Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại sau."
                } else if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
                    userFriendlyMessage = "API key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên."
                } else if (errorMessage.includes("429")) {
                    userFriendlyMessage = "Quá nhiều yêu cầu. Vui lòng đợi và thử lại sau."
                }
            } catch {
                errorMessage = lastError.responseText || errorMessage
            }
        }

        return NextResponse.json(
            {
                error: userFriendlyMessage,
                details: errorMessage,
                statusCode: lastError?.response?.status || 500
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