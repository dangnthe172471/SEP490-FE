"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, FileText, Search, Calendar, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { getDoctorRecords } from "@/lib/services/doctor-record-service"
import { patientService } from "@/lib/services/patient-service"
import { AIChatHistoryService } from "@/lib/services/ai-chat-history.service"
import type { RecordListItemDto } from "@/lib/types/doctor-record"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export function AIChatInterface() {
    const initialMessage: Message = {
        id: "1",
        role: "assistant",
        content: "Xin chào! Tôi là AI hỗ trợ chẩn đoán. Tôi có thể giúp bạn tư vấn về triệu chứng, gợi ý xét nghiệm, và tham khảo thông tin y khoa. Vui lòng mô tả chi tiết về trường hợp bệnh nhân hoặc chọn một hồ sơ bệnh án từ danh sách bên trái.",
        timestamp: new Date(),
    }

    const [messages, setMessages] = useState<Message[]>([initialMessage])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<RecordListItemDto | null>(null)
    const [patientContext, setPatientContext] = useState<string>("")
    const [records, setRecords] = useState<RecordListItemDto[]>([])
    const [recordsLoading, setRecordsLoading] = useState(true)
    const [loadingPatientInfo, setLoadingPatientInfo] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isSummarizing, setIsSummarizing] = useState(false)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight
            }
        }, 100)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [input])

    // Load patient records with debounce
    useEffect(() => {
        const loadRecords = async () => {
            try {
                setRecordsLoading(true)
                const data = await getDoctorRecords({
                    pageNumber: 1,
                    pageSize: 50,
                    search: searchQuery || undefined,
                })
                setRecords(data.items)
            } catch (error: any) {
                console.error("Failed to load records:", error)
                toast.error("Không thể tải danh sách hồ sơ bệnh án")
            } finally {
                setRecordsLoading(false)
            }
        }

        // Load immediately on mount, debounce on search
        if (searchQuery) {
            const timeoutId = setTimeout(() => {
                loadRecords()
            }, 300)
            return () => clearTimeout(timeoutId)
        } else {
            loadRecords()
        }
    }, [searchQuery])

    const generateMessageId = (prefix: string) => {
        const now = Date.now()
        const random = Math.random().toString(36).substring(2, 11)
        return `${prefix}-${now}-${random}`
    }

    const formatRecordInfo = (record: RecordListItemDto, patientInfo?: { allergies?: string; medicalHistory?: string }) => {
        const dobFormatted = record.dob
            ? format(new Date(record.dob), "dd/MM/yyyy", { locale: vi })
            : "Không xác định"

        const infoLines = [
            `Bệnh nhân: ${record.patientName}`,
            `- Giới tính: ${record.gender || "Không xác định"}`,
            `- Ngày sinh: ${dobFormatted}`,
        ]

        if (patientInfo?.allergies) {
            infoLines.push(`- Dị ứng: ${patientInfo.allergies}`)
        }

        if (patientInfo?.medicalHistory) {
            infoLines.push(`- Tiền sử bệnh: ${patientInfo.medicalHistory}`)
        }

        return infoLines.join("\n")
    }

    const handleSelectRecord = async (record: RecordListItemDto) => {
        setSelectedRecord(record)
        setLoadingPatientInfo(true)

        try {
            const [patientInfoResult, chatHistoryResult] = await Promise.allSettled([
                patientService.getPatientById(record.patientId),
                AIChatHistoryService.getChatHistory(record.recordId),
            ])

            const patientInfo = patientInfoResult.status === 'fulfilled' ? patientInfoResult.value : undefined
            const chatHistory = chatHistoryResult.status === 'fulfilled' ? chatHistoryResult.value : []

            if (patientInfoResult.status === 'rejected') {
                console.error("Failed to load patient medical info:", patientInfoResult.reason)
            }

            setPatientContext(formatRecordInfo(record, patientInfo))

            if (chatHistory.length > 0) {
                const firebaseMessages: Message[] = chatHistory.map((msg) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
                }))
                setMessages(firebaseMessages)
                toast.success(`Đã tải lịch sử chat cho ${record.patientName}`)
            } else {
                setMessages([initialMessage])
                toast.success(`Đã chọn hồ sơ của ${record.patientName}. Thông tin bệnh nhân sẽ được thêm vào mỗi tin nhắn.`)
            }
        } catch (error) {
            console.error("Unexpected error:", error)
            setPatientContext(formatRecordInfo(record))
            setMessages([initialMessage])
            toast.success(`Đã chọn hồ sơ của ${record.patientName}. Thông tin bệnh nhân sẽ được thêm vào mỗi tin nhắn.`)
        } finally {
            setLoadingPatientInfo(false)
        }
    }

    const createMessage = (role: "user" | "assistant", content: string): Message => ({
        id: generateMessageId(role),
        role,
        content,
        timestamp: new Date(),
    })

    const saveMessagesToFirebase = async (userContent: string, assistantContent: string) => {
        if (!selectedRecord) return

        try {
            await Promise.all([
                AIChatHistoryService.saveMessage(selectedRecord.recordId, {
                    role: "user",
                    content: userContent,
                }),
                AIChatHistoryService.saveMessage(selectedRecord.recordId, {
                    role: "assistant",
                    content: assistantContent,
                }),
            ])
        } catch (error) {
            console.error("Failed to save messages to Firebase:", error)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userInput = input.trim()
        const messageText = patientContext
            ? `${patientContext}\n\nCâu hỏi: ${userInput}`
            : userInput

        const userMessage = createMessage("user", messageText)
        setMessages((prev) => [...prev, userMessage])
        setInput("")

        if (textareaRef.current) {
            textareaRef.current.style.height = "60px"
        }
        setIsLoading(true)

        try {
            const conversationHistory = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }))

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    conversationHistory,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Không thể kết nối với AI")
            }

            const data = await response.json()
            const assistantMessage = createMessage("assistant", data.response)
            setMessages((prev) => [...prev, assistantMessage])

            await saveMessagesToFirebase(messageText, data.response)
        } catch (error: any) {
            toast.error(error.message || "Không thể gửi tin nhắn")
            const errorContent = "Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau."
            const errorMessage = createMessage("assistant", errorContent)
            setMessages((prev) => [...prev, errorMessage])

            await saveMessagesToFirebase(messageText, errorContent)
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSummarize = async () => {
        // Chỉ tổng hợp nếu có ít nhất 2 tin nhắn (không tính initial message)
        const userMessages = messages.filter(msg => msg.role === "user")
        if (userMessages.length === 0) {
            toast.error("Chưa có cuộc trò chuyện để tổng hợp")
            return
        }

        setIsSummarizing(true)

        try {
            const conversationHistory = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }))

            const summarizePrompt = `Hãy tổng hợp toàn bộ cuộc trò chuyện trên và rút ra kết luận:

1. TÓM TẮT: Tóm tắt ngắn gọn các vấn đề đã thảo luận
2. CHẨN ĐOÁN PHÂN BIỆT: Liệt kê các khả năng chẩn đoán đã đề cập
3. XÉT NGHIỆM: Tổng hợp các xét nghiệm đã đề xuất
4. HƯỚNG XỬ TRÍ: Tóm tắt các hướng xử trí đã thảo luận
5. KẾT LUẬN: Đưa ra kết luận tổng hợp và khuyến nghị cuối cùng

Hãy trình bày rõ ràng, ngắn gọn, có cấu trúc.`

            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: summarizePrompt,
                    conversationHistory,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Không thể tổng hợp cuộc trò chuyện")
            }

            const data = await response.json()
            const summaryMessage = createMessage("assistant", `## 📋 TỔNG HỢP CUỘC TRÒ CHUYỆN\n\n${data.response}`)
            setMessages((prev) => [...prev, summaryMessage])

            // Lưu vào Firebase nếu có selectedRecord
            if (selectedRecord) {
                try {
                    await AIChatHistoryService.saveMessage(selectedRecord.recordId, {
                        role: "assistant",
                        content: summaryMessage.content,
                    })
                } catch (error) {
                    console.error("Failed to save summary to Firebase:", error)
                }
            }

            toast.success("Đã tổng hợp cuộc trò chuyện")
        } catch (error: any) {
            toast.error(error.message || "Không thể tổng hợp cuộc trò chuyện")
        } finally {
            setIsSummarizing(false)
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatMarkdown = (text: string): string => {
        const formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')

        const lines = formatted.split('\n')
        const sections: string[] = []
        let currentParagraph: string[] = []
        let inList = false

        const flushParagraph = () => {
            if (currentParagraph.length) {
                sections.push(`<p class="text-sm leading-relaxed">${currentParagraph.join('<br>')}</p>`)
                currentParagraph = []
            }
        }

        const closeList = () => {
            if (inList) {
                sections.push('</ul>')
                inList = false
            }
        }

        for (const rawLine of lines) {
            const line = rawLine.trim()

            if (!line) {
                closeList()
                flushParagraph()
                continue
            }

            const headingMatch = line.match(/^##\s+(.+)$/)
            if (headingMatch) {
                closeList()
                flushParagraph()
                sections.push(`<h3 class="font-semibold text-sm text-primary mt-2">${headingMatch[1]}</h3>`)
                continue
            }

            const listMatch = line.match(/^[-*]\s+(.+)$/)
            if (listMatch) {
                flushParagraph()
                if (!inList) {
                    sections.push('<ul class="list-disc list-inside space-y-1 text-sm pl-4">')
                    inList = true
                }
                sections.push(`<li>${listMatch[1]}</li>`)
                continue
            }

            closeList()
            currentParagraph.push(line)
        }

        closeList()
        flushParagraph()

        return `<div class="space-y-2">${sections.join('')}</div>`
    }

    return (
        <div className="flex h-[calc(100vh-250px)] min-h-[600px] border rounded-lg overflow-hidden bg-background">
            {/* Sidebar - Patient Records */}
            <div className="w-80 border-r bg-muted/30 flex flex-col shrink-0">
                <div className="p-4 border-b bg-muted/50">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">Hồ sơ bệnh án</h3>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                        {recordsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : records.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                Không có hồ sơ nào
                            </div>
                        ) : (
                            records.map((record) => (
                                <div
                                    key={record.recordId}
                                    onClick={() => !loadingPatientInfo && handleSelectRecord(record)}
                                    className={`p-3 rounded-lg transition-colors border ${loadingPatientInfo
                                        ? "cursor-wait opacity-50"
                                        : "cursor-pointer"
                                        } ${selectedRecord?.recordId === record.recordId
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background hover:bg-muted border-border"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold text-sm truncate ${selectedRecord?.recordId === record.recordId
                                                ? "text-primary-foreground"
                                                : ""
                                                }`}>
                                                {record.patientName}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${selectedRecord?.recordId === record.recordId
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                                }`}>
                                                #{record.recordId}
                                            </p>
                                        </div>
                                        {record.hasPrescription && (
                                            <Badge
                                                variant={selectedRecord?.recordId === record.recordId ? "secondary" : "default"}
                                                className="ml-2 shrink-0 text-xs"
                                            >
                                                Đã kê đơn
                                            </Badge>
                                        )}
                                    </div>
                                    <div className={`text-xs space-y-1 ${selectedRecord?.recordId === record.recordId
                                        ? "text-primary-foreground/80"
                                        : "text-muted-foreground"
                                        }`}>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span suppressHydrationWarning>
                                                {format(new Date(record.visitAt), "dd/MM/yyyy", { locale: vi })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="p-4 border-b bg-muted/50 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-9 w-9 bg-primary/10">
                                <AvatarFallback className="bg-primary/20">
                                    <Bot className="h-5 w-5 text-primary" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h3 className="font-semibold text-sm">AI Hỗ trợ Chẩn đoán</h3>
                                <p className="text-xs text-muted-foreground">
                                    {selectedRecord ? `Đang xem: ${selectedRecord.patientName}` : "Sẵn sàng hỗ trợ"}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSummarize}
                            disabled={isSummarizing || isLoading || messages.filter(msg => msg.role === "user").length === 0}
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                        >
                            {isSummarizing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang tổng hợp...
                                </>
                            ) : (
                                <>
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    Tổng hợp
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Messages - Fixed height container for scroll */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <ScrollArea ref={scrollAreaRef} className="h-full">
                        <div className="p-4 space-y-4">
                            {messages.map((message) => {
                                const isUser = message.role === "user"
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                                    >
                                        {!isUser && (
                                            <Avatar className="h-8 w-8 shrink-0 bg-primary/10">
                                                <AvatarFallback className="bg-primary/20">
                                                    <Bot className="h-4 w-4 text-primary" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={`rounded-lg px-4 py-2.5 max-w-[75%] break-words ${isUser
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                                }`}
                                        >
                                            {isUser ? (
                                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                                    {message.content}
                                                </p>
                                            ) : (
                                                <div
                                                    className="text-sm break-words leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ul]:my-2 [&_ul]:ml-4 [&_p]:mb-2"
                                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                                                />
                                            )}
                                            <p
                                                className={`text-xs mt-1.5 ${isUser
                                                    ? "text-primary-foreground/70"
                                                    : "text-muted-foreground"
                                                    }`}
                                                suppressHydrationWarning
                                            >
                                                {formatTime(message.timestamp)}
                                            </p>
                                        </div>
                                        {isUser && (
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                )
                            })}

                            {isLoading && (
                                <div className="flex gap-3">
                                    <Avatar className="h-8 w-8 shrink-0 bg-primary/10">
                                        <AvatarFallback className="bg-primary/20">
                                            <Bot className="h-4 w-4 text-primary" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted rounded-lg px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">Đang xử lý...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-muted/30 shrink-0">
                    <div className="flex gap-2 items-end">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập câu hỏi... (Shift+Enter để xuống dòng)"
                            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
                            disabled={isLoading}
                            rows={1}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className="shrink-0"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
