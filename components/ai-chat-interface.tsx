"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export function AIChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Xin chào! Tôi là AI hỗ trợ chẩn đoán. Tôi có thể giúp bạn tư vấn về triệu chứng, gợi ý xét nghiệm, và tham khảo thông tin y khoa. Vui lòng mô tả chi tiết về trường hợp bệnh nhân.",
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
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

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        const messageText = input.trim()
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
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: data.response,
                    timestamp: new Date(),
                },
            ])
        } catch (error: any) {
            toast.error(error.message || "Không thể gửi tin nhắn")
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.",
                    timestamp: new Date(),
                },
            ])
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

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatMarkdown = (text: string) => {
        let formatted = text
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')

        // Handle lists
        const lines = formatted.split('\n')
        const result: string[] = []
        let inList = false

        lines.forEach((line) => {
            const listMatch = line.match(/^\s*[-*]\s+(.+)$/)
            if (listMatch) {
                if (!inList) {
                    result.push('<ul class="list-disc list-inside space-y-1 my-2 ml-4">')
                    inList = true
                }
                result.push(`<li>${listMatch[1]}</li>`)
            } else {
                if (inList) {
                    result.push('</ul>')
                    inList = false
                }
                if (line.trim()) {
                    result.push(line)
                }
            }
        })

        if (inList) result.push('</ul>')

        formatted = result.join('\n')
            .replace(/\n\n+/g, '</p><p class="mb-2">')
            .replace(/\n/g, '<br>')

        return `<p class="mb-2">${formatted}</p>`
    }

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] min-h-[600px] border rounded-lg overflow-hidden bg-background">
            {/* Header */}
            <div className="p-4 border-b bg-muted/50 shrink-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 bg-primary/10">
                        <AvatarFallback className="bg-primary/20">
                            <Bot className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-sm">AI Hỗ trợ Chẩn đoán</h3>
                        <p className="text-xs text-muted-foreground">Sẵn sàng hỗ trợ</p>
                    </div>
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
    )
}
