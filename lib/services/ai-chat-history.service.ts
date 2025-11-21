import { ref, set, get, serverTimestamp, push, onValue, off } from 'firebase/database'
import { db } from '../firebase'

export interface AIChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number | Date
}

export class AIChatHistoryService {
    private static readonly ROOM_NAME = 'AIChat'
    private static readonly CONVERSATION_PREFIX = 'MR'

    private static getConversationId(recordId: number): string {
        return `${this.CONVERSATION_PREFIX}${recordId}`
    }

    private static getConversationPath(recordId: number): string {
        return `${this.ROOM_NAME}/${this.getConversationId(recordId)}/messages`
    }

    private static parseTimestamp(timestamp: any): Date {
        if (!timestamp) return new Date()

        if (typeof timestamp === 'number') {
            return new Date(timestamp)
        }

        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000)
        }

        return new Date(timestamp)
    }

    private static convertMessagesFromFirebase(messagesData: any): AIChatMessage[] {
        const messages: AIChatMessage[] = []

        Object.keys(messagesData).forEach((messageId) => {
            const message = messagesData[messageId]
            messages.push({
                id: messageId,
                role: message.role,
                content: message.content,
                timestamp: this.parseTimestamp(message.timestamp),
            })
        })

        messages.sort((a, b) => {
            const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp
            const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp
            return timeA - timeB
        })

        return messages
    }

    /**
     * Lưu tin nhắn mới vào lịch sử chat theo từng hồ sơ bệnh án
     */
    static async saveMessage(recordId: number, message: Omit<AIChatMessage, 'id' | 'timestamp'>): Promise<void> {
        if (!db) {
            console.error('Firebase Database is not initialized')
            throw new Error('Firebase Database is not initialized')
        }

        try {
            const messagesRef = ref(db, this.getConversationPath(recordId))
            const newMessageRef = push(messagesRef)

            await set(newMessageRef, {
                role: message.role,
                content: message.content,
                timestamp: serverTimestamp(),
            })

            console.log('Message saved successfully:', newMessageRef.key)
        } catch (error) {
            console.error('Error saving AI chat message:', error)
            throw error
        }
    }

    /**
     * Lấy toàn bộ lịch sử chat của một hồ sơ bệnh án
     */
    static async getChatHistory(recordId: number): Promise<AIChatMessage[]> {
        if (!db) {
            console.warn('Firebase Database is not initialized')
            return []
        }

        try {
            const messagesRef = ref(db, this.getConversationPath(recordId))
            const snapshot = await get(messagesRef)

            if (!snapshot.exists()) {
                return []
            }

            const messagesData = snapshot.val()
            return this.convertMessagesFromFirebase(messagesData)
        } catch (error) {
            console.error('Error loading AI chat history:', error)
            return []
        }
    }

    /**
     * Lắng nghe thay đổi trong lịch sử chat (real-time)
     */
    static listenToChatHistory(
        recordId: number,
        callback: (messages: AIChatMessage[]) => void
    ): () => void {
        if (!db) {
            console.warn('Firebase Database is not initialized')
            return () => { }
        }

        const messagesRef = ref(db, this.getConversationPath(recordId))

        const unsubscribe = onValue(
            messagesRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    callback([])
                    return
                }

                const messagesData = snapshot.val()
                const messages = this.convertMessagesFromFirebase(messagesData)
                callback(messages)
            },
            (error) => {
                console.error('Firebase error:', error)
                callback([])
            }
        )

        return () => {
            off(messagesRef)
            unsubscribe()
        }
    }
}

