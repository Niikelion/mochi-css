import BannerLeft from './BannerLeft'
import BannerGrid from './BannerGrid'
import { BannerWide, MiddleSection, VertText } from './styles'

function WideMiddle() {
    return (
        <MiddleSection>
            <svg width="100%" height="100%" viewBox="0 0 560 512" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">

                {/* Portal glow */}
                <radialGradient id="portal" cx="50%" cy="48%" r="38%">
                    <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
                </radialGradient>
                <ellipse cx="200" cy="245" rx="160" ry="130" fill="url(#portal)" />

                <g transform="translate(-80, 0)">
                    {/* Card — top right, slight tilt */}
                    <g transform="translate(370,10) rotate(22)">
                        <rect x="0" y="0" width="130" height="100" rx="7" fill="#181612" stroke="#c9a84c" strokeWidth="0.9" opacity="0.45" />
                        <rect x="8" y="8" width="114" height="44" rx="3" fill="#1e1c18" opacity="0.9" />
                        <rect x="8" y="60" width="72" height="5" rx="2.5" fill="#c9a84c" opacity="0.22" />
                        <rect x="8" y="70" width="52" height="4" rx="2" fill="#c9a84c" opacity="0.13" />
                        <rect x="8" y="79" width="62" height="4" rx="2" fill="#c9a84c" opacity="0.13" />
                        <rect x="8" y="88" width="44" height="4" rx="2" fill="#c9a84c" opacity="0.1" />
                    </g>

                    {/* Button */}
                    <g transform="translate(18,130) rotate(-18)">
                        <rect x="0" y="0" width="118" height="38" rx="5" fill="#181612" stroke="#c9a84c" strokeWidth="1" opacity="0.45" />
                        <text x="59" y="19" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#c9a84c" opacity="0.5">Button</text>
                    </g>

                    {/* Toggle */}
                    <g transform="translate(270,60) rotate(32)">
                        <rect x="0" y="0" width="60" height="30" rx="15" fill="#c9a84c" opacity="0.15" stroke="#c9a84c" strokeWidth="0.9" />
                        <circle cx="43" cy="15" r="11" fill="#c9a84c" opacity="0.28" />
                    </g>

                    {/* Input */}
                    <g transform="translate(130,195) rotate(-8)">
                        <rect x="0" y="0" width="180" height="36" rx="5" fill="#181612" stroke="#c9a84c" strokeWidth="0.8" opacity="0.35" />
                        <text x="14" y="18" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9.5" fill="#c9a84c" opacity="0.3">Search...</text>
                        <circle cx="158" cy="17" r="7" fill="none" stroke="#c9a84c" strokeWidth="1.2" opacity="0.4" />
                        <line x1="163" y1="22" x2="169" y2="28" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                    </g>

                    {/* Chip cluster */}
                    <g transform="translate(60,300) rotate(-25)">
                        <rect x="0" y="0" width="80" height="24" rx="12" fill="#1e1c18" stroke="#c9a84c" strokeWidth="0.7" opacity="0.38" />
                        <text x="40" y="12" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" fill="#c9a84c" opacity="0.48">v4.0.0</text>
                    </g>
                    <g transform="translate(200,330) rotate(15)">
                        <rect x="0" y="0" width="64" height="22" rx="11" fill="#1e1c18" stroke="#c9a84c" strokeWidth="0.7" opacity="0.32" />
                        <text x="32" y="11" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#c9a84c" opacity="0.38">react</text>
                    </g>
                    <g transform="translate(390,280) rotate(-12)">
                        <rect x="0" y="0" width="64" height="22" rx="11" fill="#1e1c18" stroke="#c9a84c" strokeWidth="0.7" opacity="0.32" />
                        <text x="32" y="11" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#c9a84c" opacity="0.38">vite</text>
                    </g>

                    {/* Tooltip */}
                    <g transform="translate(50,55) rotate(-28)">
                        <rect x="0" y="0" width="140" height="30" rx="4" fill="#201e18" stroke="#c9a84c" strokeWidth="0.8" opacity="0.35" />
                        <text x="70" y="15" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="8.5" fill="#c9a84c" opacity="0.4">hover for info</text>
                        <path d="M 64 30 L 70 38 L 76 30" fill="#201e18" stroke="#c9a84c" strokeWidth="0.8" opacity="0.35" />
                    </g>

                    {/* Select */}
                    <g transform="translate(210,400) rotate(-14)">
                        <rect x="0" y="0" width="148" height="34" rx="4" fill="#181612" stroke="#c9a84c" strokeWidth="0.8" opacity="0.32" />
                        <text x="12" y="17" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#c9a84c" opacity="0.3">Framework...</text>
                        <path d="M 128 13 L 136 13 L 132 21 Z" fill="#c9a84c" opacity="0.3" />
                    </g>

                    {/* Slider */}
                    <g transform="translate(430,350) rotate(20)">
                        <rect x="0" y="8" width="140" height="4" rx="2" fill="#1a1814" stroke="#c9a84c" strokeWidth="0.5" opacity="0.28" />
                        <rect x="0" y="8" width="88" height="4" rx="2" fill="#c9a84c" opacity="0.2" />
                        <circle cx="88" cy="10" r="9" fill="#494624" stroke="#494624" strokeWidth="0.9" />
                    </g>

                    {/* Progress bar */}
                    <g transform="translate(300,455) rotate(-6)">
                        <rect x="0" y="0" width="160" height="8" rx="4" fill="#1a1814" stroke="#c9a84c" strokeWidth="0.5" opacity="0.28" />
                        <rect x="0" y="0" width="104" height="8" rx="4" fill="#c9a84c" opacity="0.2" />
                    </g>

                    {/* Notification card */}
                    <g transform="translate(440,170) rotate(-30)">
                        <rect x="0" y="0" width="100" height="58" rx="7" fill="#181612" stroke="#c9a84c" strokeWidth="0.8" opacity="0.28" />
                        <circle cx="84" cy="16" r="9" fill="#c9a84c" opacity="0.18" stroke="#c9a84c" strokeWidth="0.6" />
                        <text x="84" y="16" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" fill="#c9a84c" opacity="0.48">1</text>
                        <rect x="8" y="13" width="64" height="5" rx="2" fill="#c9a84c" opacity="0.15" />
                        <rect x="8" y="23" width="46" height="4" rx="2" fill="#c9a84c" opacity="0.1" />
                        <rect x="8" y="32" width="54" height="4" rx="2" fill="#c9a84c" opacity="0.1" />
                        <rect x="8" y="41" width="38" height="4" rx="2" fill="#c9a84c" opacity="0.08" />
                    </g>

                    {/* Step card 2 */}
                    <g transform="translate(280,240) rotate(12)">
                        <rect x="0" y="0" width="100" height="58" rx="7" fill="#181612" stroke="#c9a84c" strokeWidth="0.8" opacity="0.28" />
                        <circle cx="84" cy="16" r="9" fill="#c9a84c" opacity="0.18" stroke="#c9a84c" strokeWidth="0.6" />
                        <text x="84" y="16" textAnchor="middle" dominantBaseline="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" fill="#c9a84c" opacity="0.48">2</text>
                        <rect x="8" y="13" width="50" height="5" rx="2" fill="#c9a84c" opacity="0.15" />
                        <rect x="8" y="23" width="38" height="4" rx="2" fill="#c9a84c" opacity="0.1" />
                        <rect x="8" y="32" width="58" height="4" rx="2" fill="#c9a84c" opacity="0.1" />
                        <rect x="8" y="41" width="30" height="4" rx="2" fill="#c9a84c" opacity="0.08" />
                    </g>

                    {/* Small card — bottom left, steep tilt */}
                    <g transform="translate(-10,420) rotate(-40)">
                        <rect x="0" y="0" width="90" height="70" rx="6" fill="#181612" stroke="#c9a84c" strokeWidth="0.8" opacity="0.3" />
                        <rect x="6" y="6" width="78" height="30" rx="3" fill="#1e1c18" opacity="0.9" />
                        <rect x="6" y="42" width="54" height="5" rx="2.5" fill="#c9a84c" opacity="0.18" />
                        <rect x="6" y="52" width="38" height="4" rx="2" fill="#c9a84c" opacity="0.1" />
                    </g>
                </g>
            </svg>
        </MiddleSection>
    )
}

export default function MochiWideBanner() {
    return (
        <BannerWide>
            <BannerLeft />
            <WideMiddle />
            <BannerGrid />
            <VertText>スタイルの道</VertText>
        </BannerWide>
    )
}
