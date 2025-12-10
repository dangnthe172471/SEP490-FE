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

        // Call Gemini API - using gemini-1.5-flash (faster and more cost-effective)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

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
            try {
                const errorData = JSON.parse(responseText)
                errorMessage = errorData.error?.message || errorData.error || responseText
                console.error("Gemini API error details:", errorData)
            } catch {
                console.error("Gemini API error (raw):", responseText)
                errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`
            }

            return NextResponse.json(
                { error: errorMessage },
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