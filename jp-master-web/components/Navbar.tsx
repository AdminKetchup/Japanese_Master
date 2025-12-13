"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import { getUserProfile, UserProfile } from "@/lib/firestore";
import { useState, useEffect, useRef } from "react";
import Avatar from "./Avatar";

export default function Navbar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(setProfile);
        }
    }, [user, pathname]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    if (!user) return null;

    const navItems = [
        { name: "Home", href: "/" },
        { name: "Typing Practice", href: "/typing" },
        { name: "Typing Test", href: "/test" },
        { name: "Vocabulary (SRS)", href: "/srs" },
        { name: "Community", href: "/community" },
    ];

    return (
        <nav className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-white font-bold text-xl">
                            🇯🇵 JpMaster
                        </Link>
                        <div className="ml-10 flex items-baseline space-x-4">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-4" ref={menuRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 focus:outline-none group"
                            >
                                <span className="hidden md:block text-gray-300 group-hover:text-white text-sm font-medium mr-2 transition">
                                    {profile?.nickname || user.email?.split('@')[0]}
                                </span>
                                <Avatar
                                    src={profile?.photoURL}
                                    alt={profile?.nickname || user.email}
                                    size={40}
                                    className={`ring-2 transition ${isMenuOpen ? "ring-blue-500" : "ring-gray-700 group-hover:ring-gray-500"}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-3 w-72 bg-[#282828] rounded-xl shadow-2xl py-2 border border-[#3e3e3e] z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    {/* Header */}
                                    <div className="px-5 py-4 border-b border-[#3e3e3e] flex items-center gap-4">
                                        <Avatar
                                            src={profile?.photoURL}
                                            alt={profile?.nickname || user.email}
                                            size={40}
                                        />
                                        <div className="overflow-hidden">
                                            <p className="text-white font-bold truncate">{profile?.nickname || "User"}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <Link href="/profile" className="flex items-center px-5 py-3 text-sm text-gray-200 hover:bg-[#3e3e3e] transition">
                                            <span className="mr-3">👤</span> Your Profile
                                        </Link>
                                        <Link href="/srs" className="flex items-center px-5 py-3 text-sm text-gray-200 hover:bg-[#3e3e3e] transition">
                                            <span className="mr-3">📓</span> Vocabulary Deck
                                        </Link>
                                    </div>

                                    <div className="border-t border-[#3e3e3e] my-1"></div>

                                    <button
                                        onClick={() => signOut(auth)}
                                        className="w-full text-left flex items-center px-5 py-3 text-sm text-gray-200 hover:bg-[#3e3e3e] transition"
                                    >
                                        <span className="mr-3">🚪</span> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav >
    );
}
