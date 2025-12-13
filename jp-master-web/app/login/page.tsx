"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserProfile, getUserProfile } from "@/lib/firestore";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if profile exists, if not create one
            const profile = await getUserProfile(user.uid);
            if (!profile) {
                await createUserProfile(user.uid, user.email);
            }

            router.push("/");
        } catch (err: any) {
            console.error("Google Login Error:", err);
            setError(err.message);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-center">Login</h2>
                {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-bold">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-bold">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="mt-1 text-right">
                        <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-white">Forgot Password?</Link>
                    </div>
                </div>
                <button
                    type="submit"
                    className="w-full p-2 font-bold text-white bg-blue-600 rounded hover:bg-blue-700 mb-4"
                >
                    Login
                </button>

                <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full p-2 font-bold text-black bg-white rounded hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
                        <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd" />
                    </svg>
                    Google
                </button>

                <p className="mt-4 text-sm text-center">
                    Don't have an account? <Link href="/signup" className="text-blue-400 hover:underline">Sign up</Link>
                </p>
            </form>
        </div>
    );
}
