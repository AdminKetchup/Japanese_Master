"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/Editor";
import { subscribeToPage, updatePage } from "@/lib/workspace";
import DatabaseView from "@/components/DatabaseView";
import { Share, MoreHorizontal } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";
import AIAssistant from "@/components/AIAssistant";

export default function PageEditor() {
    const params = useParams();
    const pageId = params.pageId as string;

    const [page, setPage] = useState<any>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cover, setCover] = useState("");
    const [icon, setIcon] = useState("");

    // Share UI
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // ... (sync effect)
    useEffect(() => {
        if (page) {
            if (!saving) {
                setTitle(page.title);
                setContent(page.content || "");
                setCover(page.cover || "");
                setIcon(page.icon || "");
            }
        }
    }, [page]);

    // Auto-save logic (Updated to include cover and icon)
    useEffect(() => {
        if (!loading && page && page.type === 'page') {
            if (page.title === title && page.content === content && page.cover === cover && page.icon === icon) return;

            const timer = setTimeout(async () => {
                setSaving(true);
                await updatePage(pageId, { title, content, cover, icon });
                setSaving(false);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [title, content, cover, icon, pageId, loading, page]);

    // ...

    return (
        <div className="w-full relative">
            {/* Cover Image */}
            <div className={`group relative w-full ${cover ? "h-60" : "h-12 hover:bg-gray-50"} transition-all duration-300`}>
                {cover && (
                    <img src={cover} alt="Cover" className="w-full h-full object-cover" />
                )}

                {/* Controls (Visible on hover) */}
                <div className={`absolute bottom-2 right-12 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${!cover && "top-2 right-auto left-12"}`}>
                    {!cover && (
                        <>
                            <button onClick={() => setIcon("😀")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-black px-2 py-1 hover:bg-gray-200 rounded">
                                <span className="opacity-50">☺</span> Add Icon
                            </button>
                            <button onClick={() => setCover("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-black px-2 py-1 hover:bg-gray-200 rounded">
                                <span className="opacity-50">🖼</span> Add Cover
                            </button>
                        </>
                    )}
                    {cover && (
                        <button onClick={() => setCover(`https://source.unsplash.com/random/1200x400?sig=${Math.random()}`)} className="bg-white/80 hover:bg-white text-xs px-2 py-1 rounded shadow-sm">
                            Change Cover
                        </button>
                    )}
                    {cover && (
                        <button onClick={() => setCover("")} className="bg-white/80 hover:bg-white text-xs px-2 py-1 rounded shadow-sm text-red-500">
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full px-12 relative -mt-8 pb-32">
                {/* Icon */}
                {icon && (
                    <div className="relative group w-20 h-20 -mt-10 mb-4 bg-white rounded-full text-6xl shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer select-none" onClick={() => {
                        const newIcon = window.prompt("Enter an emoji:", icon);
                        if (newIcon) setIcon(newIcon);
                    }}>
                        {icon}
                        <button onClick={(e) => { e.stopPropagation(); setIcon(""); }} className="absolute -top-1 -right-1 bg-gray-200 hover:bg-red-100 hover:text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                            <Share size={10} className="rotate-45" /> {/* Use X icon ideally, effectively remove */}
                        </button>
                    </div>
                )}

                {/* Top Bar status & Share (Positioned specifically) */}
                <div className="absolute top-4 right-4 flex items-center gap-4 text-xs text-gray-400 bg-white/80 backdrop-blur p-2 rounded-lg z-20">
                    {/* ... (Existing Top Bar) */}
                    <span>{saving ? "Saving..." : "Saved"}</span>
                    <div className="h-4 w-px bg-gray-200" />
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-1 text-gray-800 font-medium hover:text-black transition"
                    >
                        <Share size={14} /> Share
                    </button>
                    <button className="text-gray-400 hover:text-black">
                        <MoreHorizontal size={14} />
                    </button>
                </div>

                {/* Title Input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none focus:outline-none bg-transparent mb-4 mt-8"
                />

                {/* Editor */}
                <Editor content={content} onChange={setContent} />

                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} initialTab="members" />

                <AIAssistant
                    editorContent={content}
                    onInsertContent={(newText) => setContent(prev => prev + newText)}
                />
            </div>
        </div>
    );
}
