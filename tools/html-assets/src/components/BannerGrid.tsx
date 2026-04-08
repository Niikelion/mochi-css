import { RightSection } from './styles'

export default function BannerGrid() {
    return (
        <RightSection>
            <svg viewBox="0 -9 420 210" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">

                {/* vertical divider at left edge */}
                <line x1="0" y1="-9" x2="0" y2="210" stroke="#c9a84c" strokeWidth="0.5" opacity="0.2" />

                {/* sub-grid horizontals */}
                <line x1="0" y1="3"   x2="420" y2="3"   stroke="#161412" strokeWidth="0.5" />
                <line x1="0" y1="65"  x2="420" y2="65"  stroke="#161412" strokeWidth="0.5" />
                <line x1="0" y1="127" x2="420" y2="127" stroke="#161412" strokeWidth="0.5" />
                <line x1="0" y1="189" x2="420" y2="189" stroke="#161412" strokeWidth="0.5" />

                {/* sub-grid verticals */}
                <line x1="45"  y1="-9" x2="45"  y2="210" stroke="#131210" strokeWidth="0.5" />
                <line x1="107" y1="-9" x2="107" y2="210" stroke="#131210" strokeWidth="0.5" />
                <line x1="169" y1="-9" x2="169" y2="210" stroke="#131210" strokeWidth="0.5" />
                <line x1="231" y1="-9" x2="231" y2="210" stroke="#131210" strokeWidth="0.5" />
                <line x1="293" y1="-9" x2="293" y2="210" stroke="#131210" strokeWidth="0.5" />
                <line x1="355" y1="-9" x2="355" y2="210" stroke="#131210" strokeWidth="0.5" />

                {/* main grid horizontals */}
                <line x1="0" y1="-28" x2="420" y2="-28" stroke="#1e1c18" strokeWidth="0.5" />
                <line x1="0" y1="34"  x2="420" y2="34"  stroke="#1e1c18" strokeWidth="0.5" />
                <line x1="0" y1="96"  x2="420" y2="96"  stroke="#1e1c18" strokeWidth="0.5" />
                <line x1="0" y1="158" x2="420" y2="158" stroke="#1e1c18" strokeWidth="0.5" />
                <line x1="0" y1="220" x2="420" y2="220" stroke="#1e1c18" strokeWidth="0.5" />

                {/* main grid verticals */}
                <line x1="14"  y1="-9" x2="14"  y2="210" stroke="#1a1814" strokeWidth="0.5" />
                <line x1="76"  y1="-9" x2="76"  y2="210" stroke="#1a1814" strokeWidth="0.5" />
                <line x1="138" y1="-9" x2="138" y2="210" stroke="#1a1814" strokeWidth="0.5" />
                <line x1="200" y1="-9" x2="200" y2="210" stroke="#1a1814" strokeWidth="0.5" />
                <line x1="262" y1="-9" x2="262" y2="210" stroke="#1a1814" strokeWidth="0.5" />
                <line x1="324" y1="-9" x2="324" y2="210" stroke="#1a1814" strokeWidth="0.5" />
                <line x1="386" y1="-9" x2="386" y2="210" stroke="#1a1814" strokeWidth="0.5" />

                {/* Outer dashed margin box */}
                <rect x="126" y="22" width="148" height="148" rx="3" fill="none" stroke="#c9a84c" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.22" />
                {/* Middle solid border box */}
                <rect x="144" y="40" width="112" height="112" rx="6" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.5" />

                {/* padding */}
                <text x="200" y="50" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#c9a84c" opacity="0.25" letterSpacing="1">padding</text>
                {/* border */}
                <rect x="178" y="27" width="44" height="8" fill="#0d0d0f" />
                <text x="200" y="31" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#c9a84c" opacity="0.25" letterSpacing="1">border</text>
                {/* margin */}
                <text x="200" y="13" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" fill="#c9a84c" opacity="0.25" letterSpacing="1">margin</text>

                {/* Inner mochi shape + drips */}
                <path d="
                    M 161 104
                    C 161 53 239 53 239 104
                    C 239 118 234 128 222 128
                    L 216 128
                    L 216 138
                    Q 216 144 210.5 144
                    Q 205 144 205 138
                    L 205 128
                    L 195 128
                    L 195 148
                    Q 195 154 189.5 154
                    Q 184 154 184 148
                    L 184 128
                    L 178 128
                    C 166 128 161 118 161 104
                    Z
                " fill="#181612" />
                <path d="
                    M 161 104
                    C 161 53 239 53 239 104
                    C 239 118 234 128 222 128
                    L 216 128
                    L 216 138
                    Q 216 144 210.5 144
                    Q 205 144 205 138
                    L 205 128
                    L 195 128
                    L 195 148
                    Q 195 154 189.5 154
                    Q 184 154 184 148
                    L 184 128
                    L 178 128
                    C 166 128 161 118 161 104
                    Z
                " fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinejoin="round" />

                {/* kana */}
                <text x="200" y="196" textAnchor="middle" fontFamily="Noto Sans JP, sans-serif" fontSize="9" fontWeight="300" fill="#c9a84c" opacity="0.25" letterSpacing="4"></text>

                {/* corner brackets */}
                <path d="M14 6 L6 6 L6 14"       fill="none" stroke="#c9a84c" strokeWidth="0.6" opacity="0.25" />
                <path d="M406 6 L414 6 L414 14"  fill="none" stroke="#c9a84c" strokeWidth="0.6" opacity="0.25" />
                <path d="M14 198 L6 198 L6 190"  fill="none" stroke="#c9a84c" strokeWidth="0.6" opacity="0.25" />
                <path d="M406 198 L414 198 L414 190" fill="none" stroke="#c9a84c" strokeWidth="0.6" opacity="0.25" />
            </svg>
        </RightSection>
    )
}
