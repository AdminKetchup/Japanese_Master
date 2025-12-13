"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendGlobalMessage, subscribeToGlobalChat, cleanupGlobalChat, ChatMessage, getUserProfile, UserProfile } from "@/lib/firestore";
import Avatar from "@/components/Avatar";

export default function ChatRoom() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load user profile for sender name/photo
    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(setProfile);
        }
    }, [user]);

    // Subscribe to chat
    useEffect(() => {
        // Cleanup old messages on enter
        cleanupGlobalChat();

        const unsubscribe = subscribeToGlobalChat((msgs) => {
            setMessages(msgs);
            // Scroll to bottom functionality is usually triggered here
        });
        return () => unsubscribe();
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        const text = newMessage;
        setNewMessage(""); // Optimistic clear

        try {
            const senderName = profile?.nickname || user.email?.split('@')[0] || "Anonymous";
            await sendGlobalMessage(user.uid, text, senderName, profile?.photoURL);
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message");
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center gap-2">
                <span className="text-green-400 text-xl">●</span>
                <h2 className="text-xl font-bold text-white">Global Chat</h2>
                <span className="text-xs text-gray-500 ml-auto">Live</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = user?.uid === msg.senderId;
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <Avatar
                                src={msg.senderPhoto}
                                alt={msg.senderName}
                                size={40}
                                className="mt-1 flex-shrink-0"
                            />
                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-400 font-bold">{msg.senderName}</span>
                                    {/* <span className="text-[10px] text-gray-600">
                                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span> */}
                                </div>
                                <div
                                    className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-md ${isMe
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : "bg-gray-700 text-gray-200 rounded-tl-none border border-gray-600"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="bg-gray-800 p-4 border-t border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-full px-5 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-3 transition shadow-lg flex items-center justify-center aspect-square"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
