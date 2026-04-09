import type { FC, ReactNode } from "react"

export const BoxModel: FC<{ className?: string, children?: ReactNode }> = ({ className, children }) => {
    return (
        <div className={className} style={{ aspectRatio: '1 / 1' }}>
            <svg viewBox="0 -9 210 210" xmlns="http://www.w3.org/2000/svg">
                {/* Outer dashed margin box */}
                <rect x="31" y="22" width="148" height="148" rx="3" fill="none" stroke="#c9a84c" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.22" />
                {/* Middle solid border box */}
                <rect x="49" y="40" width="112" height="112" rx="6" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.5" />

                {/* padding */}
                <rect x="83" y="46" width="44" height="8" fill="#0d0d0f" />
                <text x="105" y="50" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#c9a84c" opacity="0.25" letterSpacing="1">padding</text>
                {/* border */}
                <rect x="83" y="27" width="44" height="8" fill="#0d0d0f" />
                <text x="105" y="31" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#c9a84c" opacity="0.25" letterSpacing="1">border</text>
                {/* margin */}
                <rect x="83" y="9" width="44" height="8" fill="#0d0d0f" />
                <text x="105" y="13" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#c9a84c" opacity="0.25" letterSpacing="1">margin</text>
                <path d="
                    M 66 104
                    C 66 53 144 53 144 104
                    C 144 118 139 128 127 128
                    L 121 128
                    L 121 138
                    Q 121 144 115 144
                    Q 110 144 110 138
                    L 110 128
                    L 100 128
                    L 100 148
                    Q 100 154 95 154
                    Q 89 154 89 148
                    L 89 128
                    L 83 128
                    C 71 128 66 118 66 104
                    Z
                " stroke="#c9a84c" strokeWidth="2.5" strokeLinejoin="round" fill="#181612" />
            </svg>
            {children}
        </div>
    )
}
