"use client";

import { useState, useEffect, useRef } from "react";
import RubyText from "@/components/RubyText";
import quotesData from "../../data/quotes.json";
import { useAuth } from "@/context/AuthContext";
import { updateUserXP } from "@/lib/firestore";
import { toKana, toRomaji } from "wanakana";

interface Quote {
    sentence: string;
    kana: string;
    origin?: string;
    meaning: string;
    category?: string;
}

export default function TypingPage() {
    const { user } = useAuth();
    const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [wpm, setWpm] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isError, setIsError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Category Selection
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const categories = Array.from(new Set(quotesData.map(q => q.category || "General")));

    // Load random quote on mount or category change
    useEffect(() => {
        if (selectedCategory) {
            loadNewQuote();
        }
    }, [selectedCategory]);

    // Helper to strip punctuation/spaces for comparison
    const normalize = (str: string) => {
        return str.replace(/[。、！\?!\s]/g, "");
    };

    const loadNewQuote = () => {
        if (!selectedCategory) return;

        const filteredQuotes = quotesData.filter(q => (q.category || "General") === selectedCategory);
        if (filteredQuotes.length === 0) return;

        const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
        setCurrentQuote(randomQuote);
        setInput("");
        setStartTime(null);
        setWpm(0);
        setIsCorrect(false);
        setIsError(false);
        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        if (!startTime) {
            setStartTime(Date.now());
        }

        if (!currentQuote) return;

        // 1. Completion Check (Normalized)
        const normVal = normalize(val);
        const normKana = normalize(currentQuote.kana);
        const normSentence = normalize(currentQuote.sentence);
        const inputKana = normalize(toKana(val));

        if (normVal === normSentence || inputKana === normKana) {
            setIsError(false);
            handleSuccess();
            return;
        }

        // 2. Error Check (Prefix Matching)
        // Check if input (converted to Kana) is a valid prefix of the target Kana
        // OR if input (raw Romaji) is a valid prefix of the target Romaji (for 'k' vs 'ka' cases)

        // We compare against the "Clean" target to allow typing without punctuation
        const targetRomaji = toRomaji(normKana);

        // Check 1: Kana Prefix (e.g., "こん" matches start of "こんにちは")
        const isValidKanaPrefix = normKana.startsWith(inputKana);

        // Check 2: Romaji Prefix (e.g., "k" matches start of "konnichiwa")
        // Note: We use the raw input for Romaji check
        const isValidRomajiPrefix = targetRomaji.startsWith(normalize(val));

        // If neither is a valid prefix, it's an error
        // Exception: If input is empty, no error
        if (val.length > 0 && !isValidKanaPrefix && !isValidRomajiPrefix) {
            setIsError(true);
        } else {
            setIsError(false);
        }
    };

    const handleSuccess = async () => {
        if (!startTime || isCorrect) return; // Prevent double submission
        setIsCorrect(true);

        const timeTaken = (Date.now() - startTime) / 1000 / 60; // in minutes
        const words = currentQuote?.sentence.length || 0;
        const calculatedWpm = Math.round(words / timeTaken);
        setWpm(calculatedWpm);

        // XP Calculation: Base 10 + Length Bonus
        const xp = 10 + Math.floor(words / 2);

        if (user) {
            await updateUserXP(user.uid, xp);
        }
    };

    if (!selectedCategory) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
                <h1 className="text-3xl font-bold mb-8 text-blue-400">Select a Category</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="p-6 bg-gray-800 hover:bg-gray-700 rounded-xl transition shadow-lg text-xl font-bold text-white border border-gray-700 hover:border-blue-500"
                        >
                            {cat}
                            <p className="text-sm text-gray-400 font-normal mt-2">
                                {quotesData.filter(q => (q.category || "General") === cat).length} Sentences
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (!currentQuote) return <div className="text-center mt-20">Loading...</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12">
            <div className="bg-gray-800/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl max-w-6xl w-full text-center relative border border-gray-700/50">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className="absolute top-6 left-8 text-gray-400 hover:text-white text-lg transition-colors flex items-center gap-2"
                >
                    <span>←</span> Back
                </button>
                <h1 className="text-3xl font-bold mb-8 text-blue-400">Typing Practice</h1>

                {/* Display Quote */}
                {/* Display Quote */}
                <div className="mb-12 p-10 bg-gray-900/50 rounded-2xl border border-gray-700/50 shadow-inner">
                    <div className="text-3xl md:text-5xl mb-8 font-serif tracking-wide leading-relaxed text-white">
                        <RubyText
                            text={currentQuote?.sentence}
                            furigana={currentQuote?.kana}
                            rtClassName="text-sm sm:text-base md:text-lg mb-2 text-gray-400 opacity-90"
                        />
                    </div>
                    <p className="text-gray-300 text-2xl italic mb-4 font-light">"{currentQuote?.meaning}"</p>
                    <p className="text-gray-500 text-lg font-mono tracking-wider">— {currentQuote?.origin} —</p>
                </div>

                {/* Input Area */}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInput}
                    className={`w-full p-6 text-3xl md:text-4xl text-center bg-gray-700/50 rounded-xl focus:outline-none focus:ring-4 transition-all shadow-lg placeholder-gray-500 ${isCorrect
                        ? "ring-green-500 bg-gray-800 text-green-400"
                        : isError
                            ? "ring-red-500 bg-gray-800 text-red-300 animate-shake"
                            : "focus:ring-blue-500 text-white"
                        }`}
                    placeholder="Type here..."
                    disabled={isCorrect}
                    autoComplete="off"
                />

                {/* Stats & Next Button */}
                <div className="mt-8 h-16 flex items-center justify-center space-x-8">
                    {isCorrect && (
                        <div className="animate-fade-in flex items-center space-x-6">
                            <div>
                                <p className="text-sm text-gray-400">Speed</p>
                                <p className="text-2xl font-bold text-yellow-400">{wpm} CPM</p>
                            </div>
                            <button
                                onClick={loadNewQuote}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transform hover:scale-105 transition"
                            >
                                Next Sentence ➡️
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
