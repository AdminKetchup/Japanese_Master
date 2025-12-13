interface RubyTextProps {
    text: string;
    furigana: string;
    rtClassName?: string;
    rubyClassName?: string;
}

export default function RubyText({ text, furigana, rtClassName, rubyClassName }: RubyTextProps) {
    // If no furigana, just return text
    if (!furigana) return <span>{text}</span>;

    // Render ruby tag for furigana
    // The structure is <ruby> Kanji <rt> Furigana </rt> </ruby>
    return (
        <ruby className={`group relative inline-block ${rubyClassName || ""}`}>
            {text}
            <rt className={`block text-gray-400 text-center mb-2 group-hover:text-white transition-colors select-none font-light ${rtClassName || "text-sm sm:text-lg"}`}>
                {furigana}
            </rt>
        </ruby>
    );
}
