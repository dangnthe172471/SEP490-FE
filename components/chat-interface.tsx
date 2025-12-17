"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Send,
    MoreVertical,
    User,
    MessageCircle,
    Clock,
    Check,
    CheckCheck
} from "lucide-react"
import { getCurrentUser, getRoleName } from "@/lib/auth"
import { toast } from "sonner"
import { FirebaseChatService, FirebaseMessage, ChatRoom } from "@/lib/firebase-chat"

// Use Firebase types instead of local interfaces

interface ChatInterfaceProps {
    currentUser: {
        id: string
        name: string
        role: string
    }
}

export function ChatInterface({ currentUser }: ChatInterfaceProps) {
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
    const [messages, setMessages] = useState<FirebaseMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Load chat rooms from Firebase
    useEffect(() => {
        if (!currentUser) return

        let unsubscribe: (() => void) | null = null

        if (currentUser.role === 'reception') {
            // Lắng nghe rooms cho reception

            unsubscribe = FirebaseChatService.listenToReceptionRooms(
                (rooms) => {
                    setChatRooms(rooms)

                    // Tự động chọn room đầu tiên nếu chưa có room nào được chọn
                    if (rooms.length > 0 && !selectedRoom) {
                        setSelectedRoom(rooms[0])
                    }

                    setIsLoading(false)
                }
            )
        } else if (currentUser.role === 'patient') {
            // Lắng nghe room cho patient (không tạo room mới)
            unsubscribe = FirebaseChatService.listenToPatientRoom(
                currentUser.id,
                (room) => {
                    if (room) {
                        setChatRooms([room])
                        setSelectedRoom(room)
                    } else {
                        // Nếu chưa có room, tạo room mới
                        FirebaseChatService.createRoom(
                            currentUser.id,
                            currentUser.name
                        ).then(() => {
                            // Sau khi tạo room, lắng nghe lại
                            FirebaseChatService.listenToPatientRoom(
                                currentUser.id,
                                (newRoom) => {
                                    if (newRoom) {
                                        setChatRooms([newRoom])
                                        setSelectedRoom(newRoom)
                                    }
                                }
                            )
                        }).catch((error) => {
                            console.error('Error creating room:', error)
                        })
                    }
                    setIsLoading(false)
                }
            )
        }

        return () => {
            if (unsubscribe) {
                unsubscribe()
            }
        }
    }, [currentUser])

    // Load messages from Firebase
    useEffect(() => {
        if (!selectedRoom) {
            setMessages([])
            return
        }

        const unsubscribe = FirebaseChatService.listenToMessages(
            selectedRoom.id,
            (messages) => {
                setMessages(messages)

                // Đánh dấu tin nhắn đã đọc
                if (messages.length > 0) {
                    FirebaseChatService.markAllMessagesAsRead(selectedRoom.id, currentUser.role as 'patient' | 'reception')
                }
            }
        )

        return () => unsubscribe()
    }, [selectedRoom, currentUser.role])

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                // Scroll trực tiếp trong ScrollArea, không ảnh hưởng đến trang
                const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
                if (scrollContainer) {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight
                }
            }
        }, 100)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Prevent page scroll jump when sending messages
    useEffect(() => {
        const handleScroll = (e: Event) => {
            // Chỉ prevent scroll nếu đang trong chat container
            if (scrollAreaRef.current && scrollAreaRef.current.contains(e.target as Node)) {
                e.stopPropagation()
            }
        }

        const handleScrollIntoView = (e: Event) => {
            // Prevent scrollIntoView from affecting the page
            if (e.target && scrollAreaRef.current && scrollAreaRef.current.contains(e.target as Node)) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        document.addEventListener('scroll', handleScroll, { passive: false })
        document.addEventListener('scroll', handleScrollIntoView, { passive: false })
        return () => {
            document.removeEventListener('scroll', handleScroll)
            document.removeEventListener('scroll', handleScrollIntoView)
        }
    }, [])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedRoom) {
            console.log('Cannot send message:', { newMessage: newMessage.trim(), selectedRoom })
            return
        }

        try {
            await FirebaseChatService.sendMessage(selectedRoom.id, {
                text: newMessage.trim(),
                sender: currentUser.name,
                senderId: currentUser.id,
                userType: currentUser.role as 'patient' | 'reception'
            })
            setNewMessage("")
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error("Không thể gửi tin nhắn")
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatTime = (timestamp: any, showDate: boolean = false) => {
        if (!timestamp) return 'Vừa xong'
        const date = new Date(timestamp)

        const timeStr = date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })

        // Chỉ hiển thị ngày khi showDate = true (cho date separator)
        if (showDate) {
            const now = new Date()
            const isToday = date.toDateString() === now.toDateString()
            const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()

            if (isToday) {
                return `Hôm nay, ${timeStr}`
            } else if (isYesterday) {
                return `Hôm qua, ${timeStr}`
            } else {
                const dateStr = date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
                return `${dateStr}, ${timeStr}`
            }
        }

        // Luôn chỉ trả về giờ khi showDate = false
        return timeStr
    }

    const shouldShowDate = (currentMessage: FirebaseMessage, previousMessage: FirebaseMessage | null) => {
        if (!previousMessage) return true

        const currentDate = new Date(currentMessage.timestamp)
        const previousDate = new Date(previousMessage.timestamp)

        return currentDate.toDateString() !== previousDate.toDateString()
    }

    const getOtherParticipant = (room: ChatRoom) => {
        if (currentUser.role === 'patient') {
            return {
                id: 'reception',
                name: 'Lễ tân hỗ trợ',
                role: 'reception'
            }
        } else {
            return {
                id: room.patientId,
                name: room.patientName,
                role: 'patient'
            }
        }
    }

    return (
        <div className="flex h-[600px] border rounded-lg overflow-hidden shadow-lg" style={{ minHeight: '600px', maxHeight: '600px' }} onScroll={(e) => e.stopPropagation()}>
            {/* Chat Rooms Sidebar */}
            <div className="w-80 border-r bg-gradient-to-b from-muted/50 to-muted/30" onScroll={(e) => e.stopPropagation()}>
                <div className="p-4 border-b bg-background/80 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Tin nhắn
                    </h2>
                </div>

                <ScrollArea className="h-[calc(100%-80px)]" style={{ maxHeight: '520px' }} onScroll={(e) => e.stopPropagation()}>
                    <div className="p-2">
                        {isLoading ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-sm">Đang tải...</p>
                            </div>
                        ) : chatRooms.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
                            </div>
                        ) : (
                            chatRooms.map((room) => {
                                const otherParticipant = getOtherParticipant(room)
                                return (
                                    <div
                                        key={room.id}
                                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedRoom?.id === room.id
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'hover:bg-muted/80 hover:shadow-sm'
                                            }`}
                                        onClick={() => setSelectedRoom(room)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback>
                                                        {otherParticipant?.name?.charAt(0) || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium truncate">
                                                        {otherParticipant?.name}
                                                    </p>
                                                    {room.unreadCount > 0 && (
                                                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                                            {room.unreadCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {room.lastMessage?.text}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {room.lastMessage && formatTime(room.lastMessage.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col" style={{ minHeight: '600px', maxHeight: '600px' }} onScroll={(e) => e.stopPropagation()}>
                {selectedRoom ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b bg-gradient-to-r from-background to-muted/30 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src="" />
                                            <AvatarFallback>
                                                {getOtherParticipant(selectedRoom)?.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">
                                            {getOtherParticipant(selectedRoom)?.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {getRoleName(getOtherParticipant(selectedRoom)?.role as any)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gradient-to-b from-background/50 to-muted/20" style={{ height: '400px', maxHeight: '400px' }} onScroll={(e) => e.stopPropagation()}>
                            <div className="space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        <p className="text-sm">Chưa có tin nhắn nào</p>
                                        <p className="text-xs mt-2">
                                            Debug: messages.length = {messages.length}, roomId = {selectedRoom?.id}
                                        </p>
                                    </div>
                                )}
                                {messages.map((message, index) => {
                                    const isOwn = message.senderId === currentUser.id
                                    const previousMessage = index > 0 ? messages[index - 1] : null
                                    const showDate = shouldShowDate(message, previousMessage)

                                    return (
                                        <div key={message.id}>
                                            {showDate && (
                                                <div className="flex justify-center my-4">
                                                    <div className="px-3 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                                                        {formatTime(message.timestamp, true)}
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    {!isOwn && (
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src="" />
                                                            <AvatarFallback>
                                                                {message.sender.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}

                                                    <div className={`rounded-lg px-3 py-2 shadow-sm ${isOwn
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted/80 backdrop-blur-sm'
                                                        }`}>
                                                        <p className="text-sm">{message.text}</p>
                                                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'
                                                            }`}>
                                                            <span className="text-xs opacity-70">
                                                                {formatTime(message.timestamp)}
                                                            </span>
                                                            {isOwn && (
                                                                <div className="flex items-center">
                                                                    {message.isRead ? (
                                                                        <CheckCheck className="h-3 w-3" />
                                                                    ) : (
                                                                        <Check className="h-3 w-3" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>
                                                    {getOtherParticipant(selectedRoom)?.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="bg-muted rounded-lg px-3 py-2">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="p-4 border-t bg-gradient-to-r from-background to-muted/30 backdrop-blur-sm" style={{ height: '80px', minHeight: '80px' }}>
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1"
                                />
                                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Chọn cuộc trò chuyện</h3>
                            <p className="text-muted-foreground">
                                Chọn một cuộc trò chuyện để bắt đầu chat
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
