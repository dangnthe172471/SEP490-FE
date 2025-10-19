import { ref, set, onValue, serverTimestamp, off } from 'firebase/database'
import { db } from './firebase'

export interface FirebaseMessage {
    id: string
    text: string
    sender: string
    senderId: string
    userType: 'patient' | 'reception'
    timestamp: any
    isRead?: boolean
}

export interface ChatRoom {
    id: string
    patientId: string
    patientName: string
    lastMessage?: FirebaseMessage
    unreadCount: number
    isActive: boolean
}

export class FirebaseChatService {
    static generateRoomId(patientId: string): string {
        return `P${patientId}`
    }

    static parseRoomId(roomId: string): { patientId: string } | null {
        const match = roomId.match(/^P(\d+)$/)
        if (match) {
            return { patientId: match[1] }
        }
        return null
    }

    static async sendMessage(
        roomId: string,
        message: { text: string; sender: string; senderId: string; userType: 'patient' | 'reception' }
    ): Promise<void> {
        try {
            const messageId = `${message.senderId}_${Date.now()}`
            const messageRef = ref(db, `rooms/${roomId}/messages/${messageId}`)

            await set(messageRef, {
                text: message.text.trim(),
                sender: message.sender,
                senderId: message.senderId,
                userType: message.userType,
                timestamp: serverTimestamp(),
                isRead: false,
            })
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error)
            throw error
        }
    }

    static listenToMessages(roomId: string, callback: (messages: FirebaseMessage[]) => void): () => void {
        const messagesRef = ref(db, `rooms/${roomId}/messages`)

        const unsubscribe = onValue(
            messagesRef,
            (snapshot) => {
                const data = snapshot.val()
                if (data) {
                    const messagesData = Object.keys(data).map((key) => ({ id: key, ...data[key] })) as FirebaseMessage[]
                    const sortedMessages = messagesData.sort((a, b) => {
                        const timeA = a.timestamp || 0
                        const timeB = b.timestamp || 0
                        return timeA - timeB
                    })
                    callback(sortedMessages)
                } else {
                    callback([])
                }
            },
            (error) => {
                console.error('Firebase error:', error)
            }
        )

        return unsubscribe
    }

    static listenToReceptionRooms(callback: (rooms: ChatRoom[]) => void): () => void {
        const roomsRef = ref(db, 'rooms')

        const unsubscribe = onValue(roomsRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const rooms: ChatRoom[] = []
                Object.keys(data).forEach((roomKey) => {
                    const roomData = data[roomKey]
                    const parsed = this.parseRoomId(roomKey)
                    if (parsed) {
                        const messages = roomData.messages
                        let lastMessage: FirebaseMessage | undefined
                        let unreadCount = 0
                        if (messages) {
                            const messageKeys = Object.keys(messages)
                            if (messageKeys.length > 0) {
                                const lastMessageKey = messageKeys[messageKeys.length - 1]
                                lastMessage = { id: lastMessageKey, ...messages[lastMessageKey] }
                                unreadCount = messageKeys.filter((key) => {
                                    const msg = messages[key]
                                    return msg.userType === 'patient' && !msg.isRead
                                }).length
                            }
                        }
                        rooms.push({
                            id: roomKey,
                            patientId: parsed.patientId,
                            patientName: roomData.patientName || `Patient ${parsed.patientId}`,
                            lastMessage,
                            unreadCount,
                            isActive: true,
                        })
                    }
                })
                rooms.sort((a, b) => {
                    if (!a.lastMessage && !b.lastMessage) return 0
                    if (!a.lastMessage) return 1
                    if (!b.lastMessage) return -1
                    return (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0)
                })
                callback(rooms)
            } else {
                callback([])
            }
        })

        return unsubscribe
    }

    static listenToPatientRoom(patientId: string, callback: (room: ChatRoom | null) => void): () => void {
        const roomId = this.generateRoomId(patientId)
        const roomRef = ref(db, `rooms/${roomId}`)

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
                const messages = data.messages
                let lastMessage: FirebaseMessage | undefined
                let unreadCount = 0
                if (messages) {
                    const messageKeys = Object.keys(messages)
                    if (messageKeys.length > 0) {
                        const lastMessageKey = messageKeys[messageKeys.length - 1]
                        lastMessage = { id: lastMessageKey, ...messages[lastMessageKey] }
                        unreadCount = messageKeys.filter((key) => {
                            const msg = messages[key]
                            return msg.userType === 'reception' && !msg.isRead
                        }).length
                    }
                }
                const room: ChatRoom = {
                    id: roomId,
                    patientId,
                    patientName: data.patientName || `Patient ${patientId}`,
                    lastMessage,
                    unreadCount,
                    isActive: true,
                }
                callback(room)
            } else {
                callback(null)
            }
        })

        return unsubscribe
    }

    static async createRoom(patientId: string, patientName: string): Promise<string> {
        const roomId = this.generateRoomId(patientId)
        const roomRef = ref(db, `rooms/${roomId}`)
        await set(roomRef, {
            patientId,
            patientName,
            createdAt: serverTimestamp(),
            messages: {},
        })
        return roomId
    }

    static async markMessageAsRead(roomId: string, messageId: string): Promise<void> {
        const messageRef = ref(db, `rooms/${roomId}/messages/${messageId}/isRead`)
        await set(messageRef, true)
    }

    static async markAllMessagesAsRead(roomId: string, userType: 'patient' | 'reception'): Promise<void> {
        const messagesRef = ref(db, `rooms/${roomId}/messages`)
        return new Promise((resolve, reject) => {
            onValue(
                messagesRef,
                (snapshot) => {
                    const data = snapshot.val()
                    if (data) {
                        const promises = Object.keys(data).map(async (key) => {
                            const message = data[key]
                            if (message.userType !== userType && !message.isRead) {
                                const messageRef = ref(db, `rooms/${roomId}/messages/${key}/isRead`)
                                await set(messageRef, true)
                            }
                        })
                        Promise.all(promises)
                            .then(() => {
                                off(messagesRef)
                                resolve()
                            })
                            .catch(reject)
                    } else {
                        off(messagesRef)
                        resolve()
                    }
                },
                { onlyOnce: true }
            )
        })
    }
}


