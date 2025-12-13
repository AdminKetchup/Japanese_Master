"use client";

import { useAuth } from "@/context/AuthContext";
import Editor from "@/components/Editor";
import { useState } from "react";
import { LogIn } from "lucide-react";

export default function Home() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [content, setContent] = useState("<p>Start typing...</p>");

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <h1 className="font-bold text-lg text-gray-800">MyArchive Notes</h1>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">{user.displayName}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-red-500 transition"
              >
                Sign Out
              </button>
              <img
                src={user.photoURL || ""}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-gray-200"
              />
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
            >
              <LogIn size={16} />
              Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {user ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Untitled Page"
                className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none placeholder-gray-300 text-gray-900"
              />
            </div>
            <Editor content={content} onChange={setContent} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to your personal archive.</h2>
            <p className="text-gray-500 max-w-md mb-8">
              A simple, block-based note taking app to organize your thoughts.
              Sign in to start writing.
            </p>
            <button
              onClick={() => signInWithGoogle()}
              className="px-6 py-3 bg-black text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
            >
              Get Started
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
