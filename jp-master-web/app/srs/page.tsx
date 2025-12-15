"use client";

import { useState, useEffect } from "react";
import RubyText from "@/components/RubyText";
import { vocabData } from "../../data/vocab";
import { useAuth } from "@/context/AuthContext";
import {
    getSRSProgress,
    saveWordProgress,
    updateUserXP,
    getUserProfile,
    updateUserDetails,
    WordProgress
} from "@/lib/firestore";
import { calculateNextReview, calculateRecallProbability } from "@/lib/srs";

interface Vocab {
    id: number;
    category?: string;
    kanji: string;
    kana: string;
    meaning: string;
}

export default function SRSPage() {
    const { user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sessionQueue, setSessionQueue] = useState<Vocab[]>([]);
    const [currentCard, setCurrentCard] = useState<Vocab | null>(null);
    const [progressMap, setProgressMap] = useState<Record<number, WordProgress>>({});
    const [showBack, setShowBack] = useState(false);
    const [loading, setLoading] = useState(false);
    const [finished, setFinished] = useState(false);
    const [userLimit, setUserLimit] = useState(20);

    const [options, setOptions] = useState<Vocab[]>([]);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showRatingButtons, setShowRatingButtons] = useState(false);
    const [pendingCardId, setPendingCardId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get unique categories
    const categories = Array.from(new Set(vocabData.map(v => v.category || "General")));

    useEffect(() => {
        if (currentCard) {
            generateOptions();
        }
    }, [currentCard]);

    useEffect(() => {
        if (user) {
            getUserProfile(user.uid).then(p => {
                if (p && p.daily_limit) setUserLimit(p.daily_limit);
            });
        }
        if (user && selectedCategory) {
            loadSession();
        }
    }, [user, selectedCategory]);

    const generateOptions = () => {
        if (!currentCard) return;

        // 1. Get potential distractors (same category preferred, but fallback to all)
        const categoryItems = vocabData.filter(v => v.category === currentCard.category && v.id !== currentCard.id);
        const distractors: Vocab[] = [];

        // 2. Select 3 random distractors
        const available = [...categoryItems];
        while (distractors.length < 3 && available.length > 0) {
            const randomIndex = Math.floor(Math.random() * available.length);
            distractors.push(available[randomIndex]);
            available.splice(randomIndex, 1);
        }

        // 3. Combine with correct answer and shuffle
        const finalOptions = [...distractors, currentCard];
        finalOptions.sort(() => Math.random() - 0.5);
        setOptions(finalOptions);

        // Reset choice state
        setSelectedOption(null);
        setIsCorrect(null);
        setShowBack(false);
        setShowRatingButtons(false);
        setPendingCardId(null);
    };

    const handleLimitChange = async (val: number) => {
        setUserLimit(val);
        if (user) {
            if (val > 0) await updateUserDetails(user.uid, { daily_limit: val });
        }
    };

    const loadSession = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [progress, userProfile] = await Promise.all([
                getSRSProgress(user.uid),
                import("@/lib/firestore").then(m => m.getUserProfile(user.uid))
            ]);

            console.log("Loaded Progress items:", Object.keys(progress).length);

            setProgressMap(progress);
            // Use profile limit, or fallback to state limit, or default 20
            const limit = userProfile?.daily_limit || userLimit || 20;

            const now = new Date();
            const queue: Vocab[] = [];
            const reviewedTodayCount = 0; // TODO: Track daily limit correctly

            // 1. Filter by Category
            const filteredVocab = vocabData.filter(v => (v.category || "General") === selectedCategory);

            // 2. Candidate List with Metrics
            const candidates: { word: Vocab; p: number; due: boolean; next_review: Date }[] = [];

            filteredVocab.forEach((word) => {
                const p = progress[word.id];
                if (p) {
                    const reviewDate = new Date(p.next_review);

                    // Calculate P(recall)
                    // Elapsed hours
                    const lastReviewDate = p.last_review ? new Date(p.last_review) : new Date(p.next_review); // Fallback
                    // Only use last_review if it exists and is valid, otherwise estimation might be off but acceptable for sorting
                    // Actually, if we don't have last_review, we can't calculate exact P based on T - LastT.
                    // But we can approximate or just rely on 'next_review <= now'.

                    const timeDiff = now.getTime() - (p.last_review ? new Date(p.last_review).getTime() : now.getTime());
                    const elapsedHours = Math.max(0, timeDiff / (1000 * 60 * 60));

                    const prob = p.half_life ? calculateRecallProbability(p.half_life, elapsedHours) : 0; // 0 if new/no half_life

                    if (reviewDate <= now) {
                        candidates.push({ word, p: prob, due: true, next_review: reviewDate });
                    }
                } else {
                    // New Card
                    candidates.push({ word, p: 0, due: true, next_review: new Date(0) });
                }
            });

            // 3. Sort: P(recall) Ascending (Low P first), then Overdue Descending? 
            // User: "P(recall) 낮은 순 / overdue 큰 순"
            candidates.sort((a, b) => {
                // If both are new/p=0, stable sort?
                // New items have p=0 usually (or undefined).
                return a.p - b.p;
            });

            console.log("Total Candidates (Due + New):", candidates.length);

            // Apply Limit
            // We should prioritize "Reviews" (Due) over "New"? Or mix? 
            // Usually Review first.
            const sessionCandidates = candidates.slice(0, limit);

            // Generate Queue
            const finalQueue = sessionCandidates.map(c => c.word);

            console.log("Session Queue Length:", finalQueue.length);

            // No random shuffle if we want to respect P sorting? 
            // User said "Sort by P". So let's keep it sorted or maybe local shuffle for variety?
            // "Sort by P" usually implies strictly showing hardest first.
            // finalQueue.sort(() => Math.random() - 0.5); 

            setSessionQueue(finalQueue);
            if (finalQueue.length > 0) {
                setCurrentCard(finalQueue[0]);
            } else {
                setFinished(true); // Nothing to review
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error occurred';
            console.error("Failed to load SRS session:", message);
            setError(`Failed to load session: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionClick = async (option: Vocab) => {
        if (selectedOption !== null || !currentCard) return; // Prevent double click

        // Capture card reference at click time to prevent race condition
        const cardAtClickTime = currentCard;

        setSelectedOption(option.id);
        const correct = option.id === cardAtClickTime.id;
        setIsCorrect(correct);
        setShowBack(true); // Reveal answer
        setPendingCardId(cardAtClickTime.id);

        // Show manual rating buttons instead of auto-rating
        setTimeout(() => {
            setShowRatingButtons(true);
        }, 500); // Brief delay to let user see answer first
    };

    const handleManualRate = (grade: number) => {
        if (pendingCardId === null) return;
        setShowRatingButtons(false);
        handleRate(grade, pendingCardId);
    };

    const handleRate = async (quality: number, cardIdAtClickTime?: number) => {
        if (!currentCard || !user) return;

        // Verify card hasn't changed (race condition prevention)
        if (cardIdAtClickTime !== undefined && cardIdAtClickTime !== currentCard.id) {
            console.warn("Card changed during rating delay, ignoring stale rating");
            return;
        }

        // 1. Calculate new SRS state
        const oldProgress = progressMap[currentCard.id] || {
            word_id: currentCard.id,
            next_review: new Date().toISOString(), // irrelevant, just need to init
            interval: 0,
            repetitions: 0,
            easiness: 2.5,
            half_life: 0,
            lapses: 0
        };

        const result = calculateNextReview(
            quality,
            oldProgress.half_life || 0,
            oldProgress.repetitions,
            oldProgress.lapses || 0
        );

        const newProgress: WordProgress = {
            word_id: currentCard.id,
            next_review: result.next_review,
            interval: result.interval_days, // Map days for info
            repetitions: result.repetitions,
            easiness: oldProgress.easiness, // Preserve or ignore
            half_life: result.half_life,
            lapses: result.lapses,
            last_review: new Date().toISOString(),
            last_grade: quality
        };

        // 2. Save to Firestore
        await saveWordProgress(user.uid, newProgress);

        // 3. Update XP 
        await updateUserXP(user.uid, 10);

        // 4. Move to next card
        const newQueue = sessionQueue.slice(1);
        setSessionQueue(newQueue);

        if (newQueue.length > 0) {
            setCurrentCard(newQueue[0]);
        } else {
            setFinished(true);
        }
    };

    if (loading) return <div className="text-center mt-20 text-white">Loading Reviews...</div>;

    // Error Display
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
                <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">⚠️ Error</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setError(null)}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (finished) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center text-white">
            <h1 className="text-4xl font-bold mb-4">🎉 Session Complete!</h1>
            <p className="text-xl mb-8">You've reviewed all cards for now.</p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 rounded-full hover:bg-blue-700 transition"
            >
                Check for more
            </button>
        </div>
    );

    if (!selectedCategory) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
                <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                    Select a Deck
                </h1>

                {/* Daily Limit Setting */}
                <div className="mb-8 flex items-center gap-4 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                    <span className="text-gray-300 font-bold">🎯 Daily Goal:</span>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={userLimit}
                        onChange={(e) => handleLimitChange(Number(e.target.value))}
                        className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white text-center focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                    <span className="text-gray-400 text-sm">new words</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="group relative p-8 bg-gray-800 rounded-3xl border-2 border-gray-700 hover:border-green-500 transition-all shadow-xl hover:shadow-2xl text-left overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-2xl font-bold mb-2 group-hover:text-green-400 transition-colors relative z-10">{cat}</h3>
                            <p className="text-gray-400 relative z-10">
                                {vocabData.filter(v => (v.category || "General") === cat).length} Cards
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4">
            <button
                onClick={() => { setSelectedCategory(null); setFinished(false); }}
                className="absolute top-24 left-8 text-gray-500 hover:text-white"
            >
                ← Change Deck
            </button>
            <div className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative min-h-[600px] flex flex-col justify-between">

                {/* Progress Indicator */}
                <div className="absolute top-4 right-4 text-sm text-gray-500">
                    Remaining: {sessionQueue.length}
                </div>

                {/* Front of Card */}
                <div className="flex-grow flex flex-col justify-center mb-8">
                    <h2 className="text-6xl font-black mb-6 select-none animate-fade-in-up">
                        <RubyText text={currentCard?.kanji || ""} furigana={currentCard?.kana || ""} />
                    </h2>

                    {/* Feedback Message */}
                    {selectedOption !== null && (
                        <div className={`text-2xl font-bold animate-bounce ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                            {isCorrect ? "Correct! 🎉" : `Wrong! Answer: ${currentCard?.meaning}`}
                        </div>
                    )}
                </div>

                {/* 4-Choice Buttons */}
                <div className="grid grid-cols-1 gap-3">
                    {options.map((option) => {
                        // Determine button style based on state
                        let btnClass = "bg-gray-700 hover:bg-gray-600 text-white";
                        if (selectedOption !== null) {
                            if (option.id === currentCard?.id) {
                                btnClass = "bg-green-600 text-white ring-2 ring-green-400"; // Always highlight correct
                            } else if (option.id === selectedOption && !isCorrect) {
                                btnClass = "bg-red-600 text-white"; // Highlight wrong selection
                            } else {
                                btnClass = "bg-gray-700 opacity-50 cursor-not-allowed"; // Dim others
                            }
                        }

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionClick(option)}
                                disabled={selectedOption !== null}
                                className={`py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${btnClass}`}
                            >
                                {option.meaning}
                            </button>
                        );
                    })}
                </div>

                {/* Manual Rating Buttons */}
                {showRatingButtons && (
                    <div className="mt-6 animate-fade-in">
                        <p className="text-gray-400 text-sm mb-3">How difficult was this?</p>
                        <div className="flex justify-center gap-2">
                            <button onClick={() => handleManualRate(1)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition">Again</button>
                            <button onClick={() => handleManualRate(2)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition">Hard</button>
                            <button onClick={() => handleManualRate(3)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition">Good</button>
                            <button onClick={() => handleManualRate(4)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition">Easy</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
