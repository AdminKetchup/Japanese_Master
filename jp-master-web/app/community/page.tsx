"use client";

import ChatRoom from "@/components/ChatRoom";
import DirectMessage from "@/components/DirectMessage";
import Avatar from "@/components/Avatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    searchUsers,
    sendFriendRequest,
    subscribeToFriendRequests,
    acceptFriendRequest,
    getFriendsList,
    UserProfile,
    FriendRequest
} from "@/lib/firestore";

export default function CommunityPage() {
    const { user } = useAuth();
    const [view, setView] = useState<'global' | 'dm'>('global');
    const [dmFriend, setDmFriend] = useState<UserProfile | null>(null);

    // Social State
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Load Friends
        loadFriends();

        // Subscribe to Requests
        const unsubFn = subscribeToFriendRequests(user.uid, setRequests);
        return () => unsubFn();
    }, [user]);

    const loadFriends = async () => {
        if (user) {
            const list = await getFriendsList(user.uid);
            setFriends(list);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const results = await searchUsers(searchTerm);
            // Filter out self and existing friends
            setSearchResults(results.filter(u => u.uid !== user?.uid)); // Simple self filter
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddFriend = async (targetUid: string) => {
        if (!user) return;
        try {
            // Need my profile data to send request properly, but for MVP assuming current UserProfile is mostly sufficient or handled by backend? 
            // Wait, sendFriendRequest needs full UserProfile object of sender.
            // Ideally we fetch it or pass it.
            // Let's pass a minimal one constructed from Auth User for now, 
            // but `lib/firestore` expects full object.
            // Fix: We should probably fetch my profile once.
            // Just for MVP, I will assume `user` + default values is enough or fetch it.
            // Let's fetch it quickly or refactor. I'll fetch it.
            const userRef = await import("@/lib/firestore").then(m => m.getUserProfile(user.uid));
            if (userRef) {
                await sendFriendRequest(userRef, targetUid);
                alert("Friend request sent!");
                setSearchResults([]);
                setSearchTerm("");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to send request.");
        }
    };

    const handleAccept = async (req: FriendRequest) => {
        if (!user) return;
        try {
            await acceptFriendRequest(req.id, req.fromUid, user.uid);
            // Refresh friends list
            loadFriends();
        } catch (e) {
            console.error(e);
        }
    };

    const openDM = (friend: UserProfile) => {
        setDmFriend(friend);
        setView('dm');
    };

    return (
        <div className="min-h-[85vh] p-4 sm:p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                Community Hub
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Friends & Search (4 Columns) */}
                <div className="lg:col-span-4 bg-gray-800 rounded-2xl p-6 border border-gray-700 h-[600px] flex flex-col">

                    {/* Search Section */}
                    <form onSubmit={handleSearch} className="mb-6 relative">
                        <input
                            type="text"
                            placeholder="Find friend (Email/Nick)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-10 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button type="submit" className="absolute right-3 top-3 text-gray-400 hover:text-white">
                            🔍
                        </button>
                    </form>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mb-6 bg-gray-900 rounded-xl p-2 max-h-40 overflow-y-auto">
                            <p className="text-xs text-gray-500 mb-2 px-2">Search Results:</p>
                            {searchResults.map(u => (
                                <div key={u.uid} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded transition">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={u.photoURL} alt={u.nickname} size={30} />
                                        <span className="text-sm font-bold truncate max-w-[100px]">{u.nickname || u.email?.split('@')[0]}</span>
                                    </div>
                                    <button
                                        onClick={() => handleAddFriend(u.uid)}
                                        className="text-xs bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-500"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Friend Requests */}
                    {requests.length > 0 && (
                        <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-3">
                            <p className="text-xs text-blue-400 font-bold mb-2">Pending Requests ({requests.length})</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {requests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between bg-black/20 p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <Avatar src={req.fromPhoto} alt={req.fromName} size={24} />
                                            <span className="text-sm text-white">{req.fromName}</span>
                                        </div>
                                        <button
                                            onClick={() => handleAccept(req)}
                                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Friend List */}
                    <div className="flex-1 overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4 text-gray-300 flex items-center gap-2">
                            <span>👥</span> My Friends
                        </h2>
                        {friends.length === 0 ? (
                            <p className="text-gray-500 text-center mt-10 text-sm">No friends yet.<br />Search users to add them!</p>
                        ) : (
                            <div className="space-y-2">
                                {friends.map(friend => (
                                    <div
                                        key={friend.uid}
                                        onClick={() => openDM(friend)}
                                        className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl cursor-pointer transition border border-transparent hover:border-gray-500 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar src={friend.photoURL} alt={friend.nickname || friend.email} size={40} />
                                            <div>
                                                <p className="font-bold text-sm text-gray-200 group-hover:text-white">
                                                    {friend.nickname || friend.email?.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-gray-500">Lv. {friend.level}</p>
                                            </div>
                                        </div>
                                        <span className="text-gray-500 group-hover:text-blue-400">💬</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Chat Area (8 Columns) */}
                <div className="lg:col-span-8">
                    {view === 'global' ? (
                        <div className="relative">
                            <ChatRoom />
                            {/* Floating hint */}
                            {/* <div className="absolute top-4 right-20 text-xs text-gray-500">Playing globally</div> */}
                        </div>
                    ) : (
                        dmFriend && (
                            <DirectMessage
                                friend={dmFriend}
                                onClose={() => { setView('global'); setDmFriend(null); }}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
