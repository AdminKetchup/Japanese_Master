"use client";

import { useState, useEffect } from "react";
import { getLeaderboard, UserProfile } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

export default function Leaderboard() {
    const { user } = useAuth();
    const [leaders, setLeaders] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const data = await getLeaderboard(5);
                setLeaders(data);
            } catch (error) {
                console.error("Failed to load leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaders();
    }, []);

    if (loading) return null;

    return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🏆</span> Hall of Fame
            </h2>

            <div className="space-y-4">
                {leaders.map((leader, index) => {
                    const isCurrentUser = user?.uid === leader.uid;
                    const rank = index + 1;

                    let rankColor = "text-gray-400";
                    if (rank === 1) rankColor = "text-yellow-400";
                    if (rank === 2) rankColor = "text-gray-300";
                    if (rank === 3) rankColor = "text-amber-600";

                    return (
                        <div
                            key={leader.uid}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${isCurrentUser
                                ? "bg-blue-600/30 border border-blue-400"
                                : "bg-black/20 hover:bg-black/30"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-xl font-black w-8 text-center ${rankColor}`}>
                                    {rank}
                                </span>
                                <div>
                                    <p className={`font-bold ${isCurrentUser ? "text-blue-200" : "text-white"}`}>
                                        {leader.nickname || leader.email?.split('@')[0] || "Anonymous"}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Lv. {leader.level}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-green-400 font-mono font-bold block">
                                    {leader.xp.toLocaleString()} XP
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500">
                    Compete by interacting with Typing & SRS!
                </p>
            </div>
        </div>
    );
}
