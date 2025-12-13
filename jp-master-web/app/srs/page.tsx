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
import { calculateNextReview } from "@/lib/srs";

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

            setProgressMap(progress);
            // Use profile limit, or fallback to state limit, or default 20
            const limit = userProfile?.daily_limit || userLimit || 20;

            const now = new Date();
            const queue: Vocab[] = [];

            // 1. Filter by Category
            const filteredVocab = vocabData.filter(v => (v.category || "General") === selectedCategory);

            // 2. Find due items within category
            filteredVocab.forEach((word) => {
                const p = progress[word.id];
                if (p) {
                    // If exists, check if due
                    if (new Date(p.next_review) <= now) {
                        queue.push(word);
                    }
                } else {
                    // If new, add to queue
                    if (queue.length < limit) {
                        queue.push(word);
                    }
                }
            });

            // Shuffle queue
            queue.sort(() => Math.random() - 0.5);

            setSessionQueue(queue);
            if (queue.length > 0) {
                setCurrentCard(queue[0]);
            } else {
                setFinished(true); // Nothing to review
            }
        } catch (e) {
            console.error("Failed to load SRS session", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionClick = async (option: Vocab) => {
        if (selectedOption !== null || !currentCard) return; // Prevent double click

        setSelectedOption(option.id);
        const correct = option.id === currentCard.id;
        setIsCorrect(correct);
        setShowBack(true); // Reveal answer

        // Auto-rate logic
        // If correct -> 3 (Good) or 5 (Easy - not implementing time tracking for MVP)
        // If wrong -> 1 (Hard - reset)
        const quality = correct ? 3 : 1;

        // Delay moving to next card to show feedback
        setTimeout(() => {
            handleRate(quality);
        }, 1500);
    };

    const handleRate = async (quality: number) => {
        if (!currentCard || !user) return;

        // 1. Calculate new SRS state
        const oldProgress = progressMap[currentCard.id] || {
            word_id: currentCard.id,
            next_review: new Date().toISOString().split('T')[0], // irrelevant, just need to init
            interval: 0,
            repetitions: 0,
            easiness: 2.5
        };

        const result = calculateNextReview(
            quality,
            oldProgress.interval,
            oldProgress.repetitions,
            oldProgress.easiness
        );

        const newProgress: WordProgress = {
            word_id: currentCard.id,
            ...result
        };

        // 2. Save to Firestore
        await saveWordProgress(user.uid, newProgress);

        // 3. Update XP (10XP per correct answer, 0 for wrong maybe? Keeping 10 for effort for now as per prev design, but maybe reduce penalize? Let's keep 10)
        // Actually for quiz, maybe only give XP for correct?
        // Let's give 10 XP regardless for now to encourage study.
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
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative min-h-[600px] flex flex-col justify-between">

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

            </div>
        </div>
    );
}
