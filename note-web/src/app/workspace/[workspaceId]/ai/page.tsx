"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth"; // Assuming we have auth context
import { generateAIContent } from "@/lib/ai";
import { Sparkles, ArrowUp, Zap, FileText, Globe, Paperclip, Search, CheckCircle2, ChevronDown } from "lucide-react";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AIDashboard() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Model Selection State
    const [model, setModel] = useState("anthropic/claude-4.5-sonnet"); // Default
    const [showModelSelector, setShowModelSelector] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("openrouter_model");
        if (stored) setModel(stored);
    }, []);

    const handleModelChange = (newModel: string) => {
        setModel(newModel);
        localStorage.setItem("openrouter_model", newModel);
        setShowModelSelector(false);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Pass the selected model to the generator
            const content = await generateAIContent(userMsg.content, undefined, model);
            
            const aiMsg: Message = { role: 'assistant', content };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 h-screen overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-[#191919] relative transition-colors">
            
            {/* Top Right Model Selector */}
            <div className="absolute top-6 right-6 z-20">
                <div className="relative">
                    <button
                        onClick={() => setShowModelSelector(!showModelSelector)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                        <Sparkles size={16} className="text-purple-500" />
                        <div className="flex flex-col items-start leading-none gap-0.5">
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Model</span>
                            <span className="text-sm">{model.split('/').pop()}</span>
                        </div>
                        <ChevronDown size={14} className={`opacity-50 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Model Dropdown */}
                    {showModelSelector && (
                        <div className="absolute top-12 right-0 w-64 bg-white dark:bg-[#252525] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[400px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
                             <div className="text-[10px] font-semibold text-gray-400 px-2 py-1 uppercase">2025 / Advanced</div>
                            <button onClick={() => handleModelChange("anthropic/claude-4.5-sonnet")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">Claude 4.5 Sonnet</span> 
                                {model === "anthropic/claude-4.5-sonnet" && <span className="text-blue-500">✓</span>}
                            </button>
                            <button onClick={() => handleModelChange("anthropic/claude-4.5-opus")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">Claude 4.5 Opus</span> 
                                {model === "anthropic/claude-4.5-opus" && <span className="text-blue-500">✓</span>}
                            </button>
                            <button onClick={() => handleModelChange("google/gemini-2.5-flash")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">Gemini 2.5 Flash</span> 
                                {model === "google/gemini-2.5-flash" && <span className="text-blue-500">✓</span>}
                            </button>
                            <button onClick={() => handleModelChange("google/gemini-3.0-pro")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">Gemini 3.0 Pro</span> 
                                {model === "google/gemini-3.0-pro" && <span className="text-blue-500">✓</span>}
                            </button>
                            <button onClick={() => handleModelChange("openai/gpt-5.2")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">GPT-5.2</span> 
                                {model === "openai/gpt-5.2" && <span className="text-blue-500">✓</span>}
                            </button>
                            <button onClick={() => handleModelChange("openai/gpt-5.2-thinking")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">GPT-5.2 (Thinking)</span> 
                                {model === "openai/gpt-5.2-thinking" && <span className="text-blue-500">✓</span>}
                            </button>

                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                            
                            <div className="text-[10px] font-semibold text-gray-400 px-2 py-1 uppercase">Open Source</div>
                             <button onClick={() => handleModelChange("meta-llama/llama-3-70b-instruct")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">Llama 3 70B</span> 
                                {model === "meta-llama/llama-3-70b-instruct" && <span className="text-blue-500">✓</span>}
                            </button>
                            <button onClick={() => handleModelChange("mistralai/mistral-large")} className="w-full text-left px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-200 flex justify-between items-center transition">
                                <span className="font-medium">Mistral Large</span> 
                                {model === "mistralai/mistral-large" && <span className="text-blue-500">✓</span>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full max-w-3xl flex flex-col h-full p-6">
                
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                        {/* Hero Icon */}
                        <div className="w-16 h-16 bg-white dark:bg-[#252525] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl flex items-center justify-center mb-8 relative group">
                            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                            <Sparkles size={32} className="text-gray-800 dark:text-white relative z-10" />
                        </div>

                        <h1 className="text-3xl font-bold mb-10 text-gray-900 dark:text-white tracking-tight">How can I help you today?</h1>

                        {/* Search Box */}
                        <div className="w-full max-w-2xl relative group z-10">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 shadow-sm group-hover:shadow-lg rounded-2xl p-4 transition-all">
                                
                                {/* Top Controls */}
                                <div className="flex items-center gap-2 mb-3">
                                     <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] text-xs font-medium text-gray-600 dark:text-gray-300 transition">
                                        <span className="font-bold text-gray-400">@</span> Add context
                                    </button>
                                </div>

                                {/* Input */}
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Ask, search, or make anything..."
                                    className="w-full bg-transparent text-lg placeholder:text-gray-400 focus:outline-none text-gray-900 dark:text-white"
                                    autoFocus
                                />

                                {/* Bottom Controls */}
                                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-400 text-xs transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                            <Paperclip size={14} /> <span className="hidden sm:inline">Auto</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 dark:text-gray-400 text-xs transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                                            <Globe size={14} /> <span className="hidden sm:inline">Research</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-300 transition">
                                            <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 bg-transparent focus:ring-0 checked:bg-blue-500" />
                                            Allow edits
                                        </label>
                                        <button
                                            onClick={() => handleSend()}
                                            disabled={!input.trim()}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim() ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-100" : "bg-gray-200 dark:bg-[#333] text-gray-400 scale-95"}`}
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Suggestion Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mt-8 max-w-4xl">
                            {[
                                { icon: Sparkles, color: "text-purple-500", label: "New in AI", sub: "Check updates", prompt: "What's new in AI?" },
                                { icon: FileText, color: "text-blue-500", label: "Write agenda", sub: "For meetings", prompt: "Draft a meeting agenda for..." },
                                { icon: Search, color: "text-orange-500", label: "Analyze doc", sub: "Summarize PDF", prompt: "Summarize this document: " },
                                { icon: CheckCircle2, color: "text-green-500", label: "Task tracker", sub: "Create list", prompt: "Create a task list for project: " },
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setInput(item.prompt);
                                    }}
                                    className="flex flex-col gap-2 p-4 rounded-2xl bg-white dark:bg-[#252525] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition text-left group shadow-sm hover:shadow-md"
                                >
                                    <item.icon size={20} className={`${item.color} mb-1`} />
                                    <div>
                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-200">{item.label}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">{item.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Chat Interface (Simple view for now) */
                    <div className="w-full h-full flex flex-col max-w-4xl mx-auto">
                         {/* Chat History */}
                         <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {m.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs shrink-0 shadow-lg">
                                            <Sparkles size={14} />
                                        </div>
                                    )}
                                    <div className={`p-4 rounded-2xl max-w-[80%] leading-relaxed shadow-sm ${
                                        m.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                                            : 'bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700/50 rounded-tl-sm'
                                    }`}>
                                        {m.content}
                                    </div>
                                    {m.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold shrink-0">
                                            U
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-4">
                                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shrink-0 opacity-50">
                                        <Sparkles size={14} />
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm h-8">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Chat Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Reply to AI..."
                                className="w-full bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white shadow-sm"
                                autoFocus
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${input.trim() ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" : "text-gray-300 dark:text-gray-600 cursor-not-allowed"}`}
                            >
                                <ArrowUp size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
