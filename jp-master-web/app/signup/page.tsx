"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserProfile } from "@/lib/firestore";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {

            // ... inside component ...
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await createUserProfile(userCredential.user.uid, email);
            router.push("/");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Please log in.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Failed to create account. Please try again.");
            }
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <form onSubmit={handleSignup} className="w-full max-w-sm p-8 bg-gray-800 rounded-lg shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-center">Sign Up</h2>
                {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-bold">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-bold">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full p-2 font-bold text-white bg-green-600 rounded hover:bg-green-700"
                >
                    Sign Up
                </button>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link href="/login" className="text-green-400 hover:underline">Login</Link>
                </p>
            </form>
        </div>
    );
}
