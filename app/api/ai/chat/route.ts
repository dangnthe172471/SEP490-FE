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
- Trả lời thật ngắn gọn, không dài dòng, không cần giải thích quá nhiều.
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

        // Call Gemini API - use gemini-pro as default (most stable)
        // Available models: gemini-pro, gemini-1.5-pro, gemini-1.5-flash-002, gemini-2.0-flash-exp
        const model = process.env.NEXT_PUBLIC_AI_MODEL || "gemini-pro"
        // Use v1 API for stable models, v1beta for experimental models
        const apiVersion = model.includes("exp") || model.includes("2.0") ? "v1beta" : "v1"
        const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`

        console.log("Calling Gemini API with URL:", apiUrl.replace(apiKey, "***"))
        console.log("Request body:", JSON.stringify(requestBody, null, 2))

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        })

        const responseText = await response.text()
        console.log("Gemini API response status:", response.status)
        console.log("Gemini API response:", responseText.substring(0, 500))

        if (!response.ok) {
            let errorMessage = "Failed to get AI response"
            let userFriendlyMessage = "Không thể lấy phản hồi từ AI. Vui lòng thử lại sau."

            try {
                const errorData = JSON.parse(responseText)
                errorMessage = errorData.error?.message || errorData.error || responseText
                console.error("Gemini API error details:", errorData)

                // Xử lý các lỗi cụ thể
                if (errorMessage.includes("not found") || errorMessage.includes("is not found")) {
                    userFriendlyMessage = "Model AI không khả dụng. Vui lòng liên hệ quản trị viên để cấu hình lại."
                } else if (errorMessage.includes("quota") || errorMessage.includes("Quota exceeded")) {
                    userFriendlyMessage = "Đã vượt quá giới hạn sử dụng API. Vui lòng kiểm tra gói dịch vụ và thử lại sau. Xem thêm tại: https://ai.google.dev/gemini-api/docs/rate-limits"
                } else if (errorMessage.includes("rate limit") || errorMessage.includes("rate_limit")) {
                    userFriendlyMessage = "Quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại sau."
                } else if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
                    userFriendlyMessage = "API key không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ quản trị viên."
                } else if (errorMessage.includes("429")) {
                    userFriendlyMessage = "Quá nhiều yêu cầu. Vui lòng đợi và thử lại sau."
                } else if (errorData.error?.message) {
                    // Giữ nguyên message nếu có thể hiểu được
                    userFriendlyMessage = errorData.error.message
                }
            } catch {
                console.error("Gemini API error (raw):", responseText)
                errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`

                // Kiểm tra quota trong raw text
                if (responseText.includes("quota") || responseText.includes("Quota exceeded")) {
                    userFriendlyMessage = "Đã vượt quá giới hạn sử dụng API. Vui lòng kiểm tra gói dịch vụ và thử lại sau."
                }
            }

            return NextResponse.json(
                {
                    error: userFriendlyMessage,
                    details: errorMessage,
                    statusCode: response.status
                },
                { status: response.status }
            )
        }

        let data
        try {
            data = JSON.parse(responseText)
        } catch (error) {
            console.error("Failed to parse Gemini response:", error)
            return NextResponse.json(
                { error: "Invalid response format from AI service" },
                { status: 500 }
            )
        }

        // Check for blocked content or other issues
        if (data.promptFeedback?.blockReason) {
            console.error("Content blocked:", data.promptFeedback)
            return NextResponse.json(
                { error: `Content blocked: ${data.promptFeedback.blockReason}` },
                { status: 400 }
            )
        }

        if (!data.candidates || data.candidates.length === 0) {
            console.error("No candidates in response:", data)
            return NextResponse.json(
                { error: "No response from AI service" },
                { status: 500 }
            )
        }

        const candidate = data.candidates[0]

        // Check if content was blocked
        if (candidate.finishReason === "SAFETY") {
            return NextResponse.json(
                { error: "Response blocked by safety filters" },
                { status: 400 }
            )
        }

        if (!candidate.content?.parts?.[0]?.text) {
            console.error("Invalid candidate structure:", candidate)
            return NextResponse.json(
                { error: "Invalid response structure from AI service" },
                { status: 500 }
            )
        }

        const aiResponse = candidate.content.parts[0].text

        return NextResponse.json({
            response: aiResponse,
        })
    } catch (error) {
        console.error("Error in AI chat API:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}