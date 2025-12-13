import Image from "next/image";

interface AvatarProps {
    src?: string | null;
    alt?: string | null; // e.g. Email or Nickname
    size?: number;
    className?: string;
}

export default function Avatar({ src, alt, size = 40, className = "" }: AvatarProps) {
    // 1. Generate Initials if no src
    const initial = alt ? alt.charAt(0).toUpperCase() : "?";

    // 2. Generate Random Color based on char code
    const charCode = initial.charCodeAt(0);
    const colors = [
        "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
        "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
        "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
        "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"
    ];
    const bgColor = colors[charCode % colors.length];

    if (src) {
        return (
            <div
                className={`relative rounded-full overflow-hidden border border-gray-700 ${className}`}
                style={{ width: size, height: size }}
            >
                <Image
                    src={src}
                    alt={alt || "Avatar"}
                    fill
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={`flex items-center justify-center rounded-full text-white font-bold border border-white/10 shadow-inner ${bgColor} ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.5 }}
        >
            {initial}
        </div>
    );
}
