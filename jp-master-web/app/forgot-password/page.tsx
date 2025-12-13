"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Check your email for the password reset link!");
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setError("User not found.");
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <form onSubmit={handleReset} className="w-full max-w-sm p-8 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-center">Reset Password</h2>

                {message && <p className="mb-4 text-green-500 text-sm font-bold">{message}</p>}
                {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}

                <div className="mb-6">
                    <label className="block mb-2 text-sm font-bold">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                        placeholder="Enter your email"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full p-2 font-bold text-gray-900 bg-yellow-500 rounded hover:bg-yellow-600 transition"
                >
                    Send Reset Link
                </button>

                <p className="mt-4 text-sm text-center">
                    <Link href="/login" className="text-gray-400 hover:text-white transition">Back to Login</Link>
                </p>
            </form>
        </div>
    );
}
