"use client";

import { useState, useRef, useEffect } from "react";
import RubyText from "@/components/RubyText";
import { toKana, toRomaji } from "wanakana";
import Link from "next/link";

interface Line {
    sentence: string;
    kana: string;
    meaning: string;
}

const KIMIGAYO_BASE: Line[] = [
    { sentence: "君が代は", kana: "きみがよは", meaning: "May your reign" },
    { sentence: "千代に八千代に", kana: "ちよにやちよに", meaning: "Continue for a thousand, eight thousand generations" },
    { sentence: "さざれ石の", kana: "さざれいしの", meaning: "Until the pebbles" },
    { sentence: "いわおとなりて", kana: "いわおとなりて", meaning: "Grow into boulders" },
    { sentence: "苔のむすまで", kana: "こけのむすまで", meaning: "And moss covers them" }
];

const IROHA_BASE: Line[] = [
    { sentence: "色は匂へど散りぬるを", kana: "いろはにほへとちりぬるを", meaning: "Even the blossoming flowers will eventually scatter" },
    { sentence: "我が世誰ぞ常ならむ", kana: "わかよたれそつねならむ", meaning: "Who in our world is unchanging?" },
    { sentence: "有為の奥山今日越えて", kana: "うゐのおくやまけふこえて", meaning: "Crossing the deep mountains of karma today" },
    { sentence: "浅き夢見じ酔ひもせず", kana: "あさきゆめみしゑひもせす", meaning: "I shall not dream shallow dreams, nor be intoxicated" }
];

const SOSEKI_BASE: Line[] = [
    { sentence: "吾輩は猫である", kana: "わがはいはねこである", meaning: "I am a cat" },
    { sentence: "名前はまだ無い", kana: "なまえはまだない", meaning: "As yet I have no name" },
    { sentence: "どこで生れたかとんと見当がつかぬ", kana: "どこでうまれたかとんとけんとうがつかぬ", meaning: "I have no idea where I was born" },
    { sentence: "何でも薄暗いじめじめした所で", kana: "なんでもうすぐらいじめじめしたところで", meaning: "All I remember is that in a gloomy, damp place" },
    { sentence: "ニャーニャー泣いていた事だけは記憶している", kana: "にゃーにゃーないていたことだけはきおくしている", meaning: "I was crying 'meow meow'" }
];

type TestMode = "verse" | "full" | "iroha" | "soseki" | null;

export default function TestPage() {
    const [mode, setMode] = useState<TestMode>(null);
    const [lines, setLines] = useState<Line[]>([]);

    // Game State
    const [lineIndex, setLineIndex] = useState(0);
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [totalTypedChars, setTotalTypedChars] = useState(0);
    const [isError, setIsError] = useState(false);
    const [completed, setCompleted] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Initialize Test
    const startTest = (selectedMode: TestMode) => {
        if (!selectedMode) return;

        let testLines: Line[] = [];
        if (selectedMode === "verse") {
            testLines = [...KIMIGAYO_BASE];
        } else if (selectedMode === "full") {
            testLines = [...KIMIGAYO_BASE, ...KIMIGAYO_BASE, ...KIMIGAYO_BASE];
        } else if (selectedMode === "iroha") {
            testLines = [...IROHA_BASE];
        } else if (selectedMode === "soseki") {
            testLines = [...SOSEKI_BASE];
        }

        setLines(testLines);
        setMode(selectedMode);
        setLineIndex(0);
        setInput("");
        setStartTime(null);
        setEndTime(null);
        setTotalTypedChars(0);
        setIsError(false);
        setCompleted(false);
    };

    // Auto-scroll to active line
    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [lineIndex, mode]);

    // Focus input
    useEffect(() => {
        if (mode && !completed) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [lineIndex, mode, completed]);

    const normalize = (str: string) => str.replace(/[。、！\?!\s]/g, "");

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        if (!startTime) {
            setStartTime(Date.now());
        }

        const currentLine = lines[lineIndex];

        // 1. Completion Check
        const normVal = normalize(val);
        const normKana = normalize(currentLine.kana);
        const normSentence = normalize(currentLine.sentence);

        // Check both standard and obsolete kana conversion
        const inputKana = normalize(toKana(val));
        const inputKanaObsolete = normalize(toKana(val, { useObsoleteKana: true }));

        if (normVal === normSentence || inputKana === normKana || inputKanaObsolete === normKana) {
            handleLineComplete();
            return;
        }

        // 2. Error Check (Prefix)
        const targetRomaji = toRomaji(normKana);

        // Relaxed prefix checking
        const isValidKanaPrefix = normKana.startsWith(inputKana) || normKana.startsWith(inputKanaObsolete);
        const isValidRomajiPrefix = targetRomaji.startsWith(normalize(val));

        if (val.length > 0 && !isValidKanaPrefix && !isValidRomajiPrefix) {
            setIsError(true);
        } else {
            setIsError(false);
        }
    };

    const handleLineComplete = () => {
        setTotalTypedChars(prev => prev + lines[lineIndex].sentence.length);
        setInput("");
        setIsError(false);

        if (lineIndex + 1 < lines.length) {
            setLineIndex(prev => prev + 1);
        } else {
            setEndTime(Date.now());
            setCompleted(true);
        }
    };

    const getResults = () => {
        const now = endTime || Date.now();
        const start = startTime || Date.now();
        const timeSeconds = (now - start) / 1000;
        const minutes = timeSeconds / 60;

        // Dynamic WPM calculation during test
        const currentTotalChars = totalTypedChars + input.length;
        const wpm = minutes > 0 ? Math.round((currentTotalChars / 5) / minutes) : 0;

        return { wpm, timeSeconds: Math.round(timeSeconds) };
    };

    const { wpm, timeSeconds } = getResults();

    // -- RENDER: SELECTION SCREEN --
    if (!mode) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-12 bg-gray-900 text-white">
                <div className="max-w-6xl w-full text-center space-y-12">
                    <div>
                        <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Japanese Typing Test
                        </h1>
                        <p className="text-xl text-gray-400">Select your challenge level</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <button
                            onClick={() => startTest("verse")}
                            className="group p-6 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-blue-500 transition-all shadow-xl hover:shadow-2xl text-left"
                        >
                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">1st Verse</h3>
                            <p className="text-gray-400 mb-4 text-sm">Kimigayo Short Ver.</p>
                            <span className="inline-block px-3 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full">5 Lines</span>
                        </button>

                        <button
                            onClick={() => startTest("full")}
                            className="group p-6 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-purple-500 transition-all shadow-xl hover:shadow-2xl text-left"
                        >
                            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Full Version</h3>
                            <p className="text-gray-400 mb-4 text-sm">Kimigayo Loop</p>
                            <span className="inline-block px-3 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full">15 Lines</span>
                        </button>

                        <button
                            onClick={() => startTest("iroha")}
                            className="group p-6 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-red-500 transition-all shadow-xl hover:shadow-2xl text-left"
                        >
                            <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">Iroha Uta</h3>
                            <p className="text-gray-400 mb-4 text-sm">The Perfect Pangram</p>
                            <span className="inline-block px-3 py-1 bg-red-900/50 text-red-300 text-xs rounded-full">4 Lines</span>
                        </button>

                        <button
                            onClick={() => startTest("soseki")}
                            className="group p-6 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-yellow-500 transition-all shadow-xl hover:shadow-2xl text-left"
                        >
                            <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">Literature</h3>
                            <p className="text-gray-400 mb-4 text-sm">I Am a Cat (Inteori)</p>
                            <span className="inline-block px-3 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded-full">5 Lines</span>
                        </button>
                    </div>

                    <Link href="/" className="inline-block text-gray-500 hover:text-white mt-8">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    // -- RENDER: RESULT SCREEN --
    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-12 bg-gray-900 text-white">
                <div className="bg-gray-800/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl max-w-4xl w-full text-center border border-gray-700/50 animate-fade-in">
                    <h1 className="text-4xl font-bold mb-2 text-white">Test Complete! 🎉</h1>
                    <p className="text-gray-400 mb-12">
                        {mode === "verse" ? "1st Verse" : mode === "full" ? "Full Version" : mode === "iroha" ? "Iroha Uta" : "Natsume Soseki"} Challenge
                    </p>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700/50">
                            <p className="text-gray-400 mb-2 uppercase tracking-wider text-sm">Typing Speed</p>
                            <p className="text-7xl font-bold text-yellow-400">{wpm}</p>
                            <p className="text-gray-500 mt-2">WPM</p>
                        </div>
                        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700/50">
                            <p className="text-gray-400 mb-2 uppercase tracking-wider text-sm">Time Taken</p>
                            <p className="text-7xl font-bold text-blue-400">{timeSeconds}</p>
                            <p className="text-gray-500 mt-2">Seconds</p>
                        </div>
                    </div>

                    <div className="flex justify-center space-x-6">
                        <button
                            onClick={() => setMode(null)}
                            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition shadow-lg text-lg flex items-center gap-2"
                        >
                            <span>≡</span> Menu
                        </button>
                        <button
                            onClick={() => startTest(mode)}
                            className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg text-lg flex items-center gap-2"
                        >
                            <span>↻</span> Retake
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // -- RENDER: HANCOM TYPING INTERFACE --
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            {/* 1. Sticky Status Bar (Hancom Style) */}
            <div className="sticky top-0 z-50 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 shadow-lg">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Progress</p>
                            <p className="text-xl font-mono font-bold text-white">
                                <span className="text-green-400">{lineIndex + 1}</span>
                                <span className="text-gray-600 mx-1">/</span>
                                {lines.length}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-gray-700"></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Speed</p>
                            <p className="text-xl font-mono font-bold text-yellow-400">{wpm} WPM</p>
                        </div>
                        <div className="h-8 w-px bg-gray-700"></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Time</p>
                            <p className="text-xl font-mono font-bold text-blue-400">{timeSeconds}s</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setMode(null)}
                        className="text-gray-500 hover:text-white transition px-4 py-2 hover:bg-gray-700 rounded"
                    >
                        Exit
                    </button>
                </div>
                {/* Progress Bar visual */}
                <div className="w-full h-1 bg-gray-700">
                    <div
                        className="h-full bg-green-500 transition-all duration-500 ease-out"
                        style={{ width: `${((lineIndex) / lines.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* 2. Main Typing Area */}
            <div className="flex-grow flex flex-col items-center py-12 px-4 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-10 text-gray-500 tracking-[0.2em] uppercase">
                    {mode === "full" ? "Long Text Practice" : "Short Text Practice"}
                </h2>

                <div className="max-w-5xl w-full space-y-6 pb-40"> {/* pb-40 allows scrolling past bottom */}
                    {lines.map((line, idx) => {
                        const isActive = idx === lineIndex;
                        const isPast = idx < lineIndex;
                        const isFuture = idx > lineIndex;

                        return (
                            <div
                                key={idx}
                                ref={isActive ? activeLineRef : null}
                                className={`relative p-8 rounded-2xl transition-all duration-500 ${isActive
                                    ? "bg-gray-800 border-2 border-blue-500/50 shadow-2xl scale-[1.02] z-10"
                                    : isPast
                                        ? "bg-gray-900/50 grayscale opacity-40 border border-transparent blur-[1px]"
                                        : "bg-gray-800/30 opacity-60 border border-transparent"
                                    }`}
                            >
                                {/* Line Content */}
                                <div className="text-center">
                                    <div className={`text-4xl md:text-5xl font-serif mb-4 transition-colors duration-300 ${isActive ? "text-white" : "text-gray-500"
                                        }`}>
                                        <RubyText
                                            text={line.sentence}
                                            furigana={line.kana}
                                            rtClassName={`transition-all duration-300 ${isActive ? "text-xl text-gray-300 mb-2" : "text-sm text-gray-600 mb-1"
                                                }`}
                                        />
                                    </div>
                                    <p className={`text-lg italic transition-colors duration-300 ${isActive ? "text-blue-400" : "text-gray-700"
                                        }`}>
                                        {line.meaning}
                                    </p>
                                </div>

                                {/* ACTIVE INPUT FIELD (Only visible for active line) */}
                                {isActive && (
                                    <div className="mt-8 animate-fade-in-up">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={handleInput}
                                            className={`w-full bg-gray-900/80 border-2 rounded-xl px-6 py-4 text-center text-3xl md:text-4xl text-white placeholder-gray-600 focus:outline-none focus:ring-4 transition-all shadow-inner ${isError
                                                ? "border-red-500 focus:ring-red-900/50 animate-shake"
                                                : "border-gray-600 focus:border-blue-500 focus:ring-blue-900/50"
                                                }`}
                                            placeholder="Type here..."
                                            autoComplete="off"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
