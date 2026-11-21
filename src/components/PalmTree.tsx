export function PalmTree({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 420" aria-hidden="true" focusable="false">
      <path d="M196 420 C 190 320, 160 230, 150 140 L 160 138 C 172 228, 206 318, 222 420 Z" />
      <g fill="none" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <path d="M154 170 l 10 -3" />
        <path d="M158 200 l 11 -3" />
        <path d="M163 230 l 12 -3" />
        <path d="M169 260 l 13 -3" />
        <path d="M176 290 l 14 -3" />
        <path d="M183 320 l 15 -3" />
        <path d="M189 350 l 16 -3" />
        <path d="M194 380 l 17 -3" />
      </g>
      <g transform="translate(155 136)">
        <path
          id="palm-frond"
          d="M0 0 C 46 -50, 118 -48, 150 28 C 138 12, 128 8, 120 10 C 114 -4, 102 -8, 94 -6 C 86 -18, 72 -20, 62 -14 C 52 -22, 32 -20, 0 0 Z"
        />
        <use href="#palm-frond" transform="rotate(-34) scale(0.95)" />
        <use href="#palm-frond" transform="rotate(22) scale(0.8)" />
        <use href="#palm-frond" transform="rotate(-72) scale(0.7)" />
        <use href="#palm-frond" transform="scale(-1 1) rotate(-6) scale(0.95)" />
        <use href="#palm-frond" transform="scale(-1 1) rotate(-40) scale(0.85)" />
        <use href="#palm-frond" transform="scale(-1 1) rotate(18) scale(0.75)" />
        <use href="#palm-frond" transform="scale(-1 1) rotate(-78) scale(0.6)" />
      </g>
    </svg>
  );
}
