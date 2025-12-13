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
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Desktop Nav */}
                    <div className="flex items-center">
                        <Link href="/" className="text-white font-bold text-xl flex-shrink-0">
                            🇯🇵 JpMaster
                        </Link>
                        <div className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
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
                    </div>

                    {/* Right Side (User Profile & Mobile Menu Button) */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button (Hamburger) */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Open main menu</span>
                                {/* Icon when menu is closed */}
                                {!isMenuOpen ? (
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                ) : (
                                    /* Icon when menu is open */
                                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* User Profile Dropdown (Desktop & Mobile - consistent location) */}
                        <div className="relative ml-3" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)} // Reuse same toggle for simplicity or separate? Let's separate for clarity if needed, but here we can reuse or just rely on the mobile menu taking over nav.
                                // Actually, typically profile is separate. Let's keep profile logic but maybe hide the text on mobile.
                                className="flex items-center gap-2 focus:outline-none group"
                            >
                                <span className="hidden md:block text-gray-300 group-hover:text-white text-sm font-medium mr-2 transition">
                                    {profile?.nickname || user.email?.split('@')[0]}
                                </span>
                                <Avatar
                                    src={profile?.photoURL}
                                    alt={profile?.nickname || user.email}
                                    size={32} // Slightly smaller for mobile fit
                                    className={`ring-2 transition ${isMenuOpen ? "ring-blue-500" : "ring-gray-700 group-hover:ring-gray-500"}`}
                                />
                            </button>

                            {/* Dropdown Menu (Combined for User & Nav on Mobile? No, standard pattern is Nav is separate. 
                                Let's keep the existing User Dropdown for Desktop, and add a Mobile Nav Menu below.) 
                            */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-[#282828] rounded-xl shadow-2xl py-2 border border-[#3e3e3e] z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    {/* Mobile Nav Links (Only show on Mobile) */}
                                    <div className="md:hidden border-b border-[#3e3e3e] pb-2 mb-2">
                                        {navItems.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`block px-5 py-3 text-base font-medium ${pathname === item.href ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-[#3e3e3e] hover:text-white"}`}
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* User Info Header */}
                                    <div className="px-5 py-3 border-b border-[#3e3e3e] flex items-center gap-4">
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

                                    {/* User Menu Items */}
                                    <div className="py-2">
                                        <Link href="/profile" className="flex items-center px-5 py-3 text-sm text-gray-200 hover:bg-[#3e3e3e] transition" onClick={() => setIsMenuOpen(false)}>
                                            <span className="mr-3">👤</span> Your Profile
                                        </Link>
                                        <Link href="/srs" className="flex items-center px-5 py-3 text-sm text-gray-200 hover:bg-[#3e3e3e] transition" onClick={() => setIsMenuOpen(false)}>
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
