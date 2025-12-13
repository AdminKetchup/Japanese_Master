"use client";

import { useAuth, AuthProvider } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { performDailyCheckIn, getUserProfile } from "@/lib/firestore";
import Leaderboard from "@/components/Leaderboard";

function ProtectedHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [todayChecked, setTodayChecked] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load user data for streak
  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then((profile) => {
        if (profile) {
          setStreak(profile.streak || 0);
          const today = new Date().toISOString().split('T')[0];
          if (profile.last_checkin === today) {
            setTodayChecked(true);
          }
        }
      });
    }
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    setCheckingIn(true);
    try {
      const result = await performDailyCheckIn(user.uid);
      if (result.success) {
        setStreak(result.streak);
        setTodayChecked(true);
        setCheckInMessage(result.message);
      } else {
        setCheckInMessage(result.message);
      }
    } catch (error) {
      console.error("Check-in failed", error);
      setCheckInMessage("Failed to check in. Try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to JpMaster Web</h1>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">

        {/* Daily Check-in Section */}
        <div className="p-6 md:p-8 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>📅</span> Daily Attendance
          </h2>

          <div className="mb-8 text-center">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Current Streak</p>
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              {streak} <span className="text-2xl text-white">Days</span>
            </p>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={todayChecked || checkingIn}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform ${todayChecked
              ? "bg-green-600/20 text-green-400 border border-green-500 cursor-default"
              : "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 shadow-lg shadow-blue-500/30"
              }`}
          >
            {todayChecked ? "✅ Checked In!" : (checkingIn ? "Checking..." : "Check In (+50 XP)")}
          </button>

          {checkInMessage && (
            <p className={`mt-4 text-sm font-medium animate-pulse ${todayChecked ? "text-green-400" : "text-blue-300"
              }`}>
              {checkInMessage}
            </p>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="flex justify-center">
          <Leaderboard />
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  // We wrapped layout.tsx with AuthProvider, but we can also use it here if needed.
  // However, since layout covers it, we can just use the protected component logic.
  return <ProtectedHome />;
}
