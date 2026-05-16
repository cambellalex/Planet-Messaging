'use client';

export default function GlobeRocket() {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto select-none">
      {/* Outer orbit path (visual only) */}
      <div
        className="absolute rounded-full border-2 border-dashed"
        style={{
          width: 240,
          height: 240,
          borderColor: 'rgba(96,165,250,0.35)',
        }}
      />

      {/* Globe SVG */}
      <svg
        className="globe-glow relative z-10"
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Planet Messaging globe"
      >
        {/* Ocean base */}
        <circle cx="80" cy="80" r="72" fill="url(#oceanGrad)" />

        {/* Latitude lines */}
        <ellipse cx="80" cy="80" rx="72" ry="24" stroke="rgba(147,197,253,0.3)" strokeWidth="1" fill="none" />
        <ellipse cx="80" cy="80" rx="72" ry="48" stroke="rgba(147,197,253,0.3)" strokeWidth="1" fill="none" />
        <line x1="8" y1="80" x2="152" y2="80" stroke="rgba(147,197,253,0.3)" strokeWidth="1" />

        {/* Longitude arcs */}
        <ellipse cx="80" cy="80" rx="28" ry="72" stroke="rgba(147,197,253,0.3)" strokeWidth="1" fill="none" />
        <ellipse cx="80" cy="80" rx="56" ry="72" stroke="rgba(147,197,253,0.3)" strokeWidth="1" fill="none" />

        {/* Continent shapes (stylised) */}
        <path d="M 55 48 Q 62 38 72 42 Q 80 44 78 54 Q 76 62 68 65 Q 58 66 54 58 Z" fill="rgba(52,211,153,0.85)" />
        <path d="M 82 50 Q 90 44 100 48 Q 108 54 106 64 Q 104 72 96 74 Q 86 75 82 67 Z" fill="rgba(52,211,153,0.85)" />
        <path d="M 58 78 Q 66 72 78 76 Q 86 80 84 92 Q 80 102 70 104 Q 58 104 54 94 Q 50 84 58 78 Z" fill="rgba(52,211,153,0.75)" />
        <path d="M 92 80 Q 100 76 110 82 Q 116 90 112 100 Q 107 108 98 106 Q 88 103 86 94 Z" fill="rgba(52,211,153,0.75)" />

        {/* Globe edge highlight */}
        <circle cx="80" cy="80" r="72" stroke="rgba(147,197,253,0.6)" strokeWidth="2" fill="none" />

        {/* Shine */}
        <ellipse cx="58" cy="52" rx="16" ry="10" fill="rgba(255,255,255,0.18)" transform="rotate(-20 58 52)" />

        <defs>
          <radialGradient id="oceanGrad" cx="38%" cy="35%" r="65%" fx="38%" fy="35%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="60%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
      </svg>

      {/* Rocket — orbits the globe */}
      <div
        className="absolute z-20"
        style={{
          width: 0,
          height: 0,
          top: '50%',
          left: '50%',
        }}
      >
        <div className="rocket-orbit" style={{ position: 'absolute', top: -16, left: -16 }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Rocket"
          >
            {/* Body */}
            <path d="M16 4 C16 4 22 10 22 18 L16 28 L10 18 C10 10 16 4 16 4Z" fill="#f97316" />
            {/* Nose */}
            <path d="M16 4 C13 8 13 14 16 18 C19 14 19 8 16 4Z" fill="#fed7aa" />
            {/* Fins */}
            <path d="M10 18 L6 26 L14 22Z" fill="#dc2626" />
            <path d="M22 18 L26 26 L18 22Z" fill="#dc2626" />
            {/* Flame */}
            <path d="M14 26 Q16 32 18 26 Q16 28 14 26Z" fill="#fde68a" opacity="0.9" />
            {/* Window */}
            <circle cx="16" cy="14" r="3" fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
