"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, UserProfile, updateUserDetails, checkNicknameAvailability } from "@/lib/firestore";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [nickname, setNickname] = useState("");
    const [bio, setBio] = useState("");
    const [photoURL, setPhotoURL] = useState("");

    useEffect(() => {
        if (user) {
            loadProfile();
        } else if (!loading && !user) {
            router.push("/login");
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        try {
            const data = await getUserProfile(user.uid);
            if (data) {
                setProfile(data);
                setNickname(data.nickname || "");
                setBio(data.bio || "");
                setPhotoURL(data.photoURL || "");
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            // Check for nickname uniqueness if changed
            if (nickname !== profile?.nickname) {
                const isAvailable = await checkNicknameAvailability(nickname);
                if (!isAvailable) {
                    alert("⚠️ This nickname is already taken. Please choose another.");
                    setSaving(false);
                    return;
                }
            }

            await updateUserDetails(user.uid, {
                nickname,
                bio,
                photoURL
            });
            // Update local state to reflect changes immediately
            setProfile(prev => prev ? ({ ...prev, nickname, bio, photoURL }) : null);
            alert("Profile updated successfully! ✨");
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center mt-20 text-white">Loading Profile...</div>;

    const displayName = nickname || user?.email?.split('@')[0] || "User";

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
            <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-gray-700">
                <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Edit Profile
                </h1>

                <div className="flex flex-col items-center mb-8">
                    <Avatar
                        src={photoURL || null}
                        alt={displayName}
                        size={100}
                        className="mb-4 ring-4 ring-gray-700 shadow-lg"
                    />
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter your nickname"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Avatar Image URL</label>
                        <input
                            type="url"
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                            placeholder="https://example.com/my-avatar.png"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use your default initial avatar.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${saving
                            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] text-white shadow-blue-500/25"
                            }`}
                    >
                        {saving ? "Saving..." : "Save Profile"}
                    </button>
                </form>
            </div>
        </div>
    );
}
