"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWorkspacePages, Page } from "@/lib/workspace";
import { FileText, Clock, BookOpen, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage({ params }: { params: Promise<{ workspaceId: string }> }) {
    const { workspaceId } = use(params);
    const { user } = useAuth();
    const [recentPages, setRecentPages] = useState<Page[]>([]);
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        // Set Greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");

        // Fetch Pages
        if (workspaceId) {
            getWorkspacePages(workspaceId).then(pages => {
                // Filter out trash
                const visible = pages.filter(p => !p.inTrash);
                // Sort by implicit freshness (or just take first 4 for now)
                setRecentPages(visible.slice(0, 4));
            });
        }
    }, [workspaceId]);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] text-black dark:text-white p-8 md:p-12 transition-colors">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    {greeting}, {user?.displayName || "Guest"}
                </h1>

                {/* Recently Visited */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium uppercase tracking-wider">
                        <Clock size={14} /> Recently visited
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {recentPages.length > 0 ? recentPages.map(page => (
                            <Link
                                key={page.id}
                                href={`/workspace/${workspaceId}/${page.id}`}
                                className="group block bg-gray-50 dark:bg-[#202020] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] p-4 rounded-xl transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            >
                                <div className="text-2xl mb-3">{page.icon || <FileText size={24} className="text-gray-400" />}</div>
                                <div className="font-medium truncate mb-1 text-sm">{page.title || "Untitled"}</div>
                                <div className="text-xs text-gray-400">
                                    {page.section === 'private' ? 'Private' : 'Workspace'}
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-4 text-gray-400 text-sm italic">No recent pages</div>
                        )}
                    </div>
                </div>

                {/* Learn / Suggested */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium uppercase tracking-wider">
                        <BookOpen size={14} /> Learn
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
                            <div className="h-24 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                                <FileText size={32} className="opacity-80" />
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-sm mb-1 group-hover:text-blue-500 transition">Customize & style your content</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                    <BookOpen size={12} /> 9m read
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
                            <div className="h-24 bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
                                <Clock size={32} className="opacity-80" />
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-sm mb-1 group-hover:text-blue-500 transition">Types of content blocks</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                    <Clock size={12} /> 10m watch
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
                            <div className="h-24 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                                <Calendar size={32} className="opacity-80" />
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-sm mb-1 group-hover:text-blue-500 transition">Understanding sharing settings</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                    <BookOpen size={12} /> 6m read
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events (Static Mock) */}
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium uppercase tracking-wider">
                        <Calendar size={14} /> Upcoming events
                    </div>
                    <div className="bg-gray-50 dark:bg-[#202020] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 border border-gray-200 dark:border-gray-800">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                            <Calendar size={24} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="font-semibold mb-1">Connect AI Meeting Notes</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Join calls, transcribe audio, and summarize meetings all in AI Dashboard.</p>
                            <button className="mt-3 text-blue-500 text-sm font-medium hover:underline flex items-center gap-1 justify-center md:justify-start">
                                Connect Calendar <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
