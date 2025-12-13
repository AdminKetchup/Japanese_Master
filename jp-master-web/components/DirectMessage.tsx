"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendDM, subscribeToDM, ChatMessage, UserProfile, getChatId } from "@/lib/firestore";
import Avatar from "@/components/Avatar";

interface DirectMessageProps {
    friend: UserProfile;
    onClose: () => void;
}

export default function DirectMessage({ friend, onClose }: DirectMessageProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatId = user ? getChatId(user.uid, friend.uid) : "";

    useEffect(() => {
        if (!chatId) return;
        const unsubscribe = subscribeToDM(chatId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        const text = newMessage;
        setNewMessage("");

        try {
            const senderName = user.email?.split('@')[0] || "Me";
            await sendDM(chatId, user.uid, text, senderName);
        } catch (error) {
            console.error("Failed to send DM", error);
            alert("Failed to send message");
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar src={friend.photoURL} alt={friend.nickname || friend.email} size={32} />
                    <span className="font-bold text-white">{friend.nickname || friend.email?.split('@')[0]}</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                        <p>Start a conversation with {friend.nickname}!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = user?.uid === msg.senderId;
                    return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <div
                                className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] break-words ${isMe
                                        ? "bg-purple-600 text-white rounded-tr-none"
                                        : "bg-gray-700 text-gray-200 rounded-tl-none border border-gray-600"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-gray-800 p-4 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${friend.nickname || "friend"}...`}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-full px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 font-bold px-2"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
