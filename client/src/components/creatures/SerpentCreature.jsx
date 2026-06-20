export default function SerpentCreature({ color = '#4285F4' }) {
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      {/* body coil */}
      <path d="M50 90 Q30 90 26 78 Q22 64 34 60 Q44 57 48 66 Q50 72 50 72 Q50 72 52 66 Q56 57 66 60 Q78 64 74 78 Q70 90 50 90 Z"
            stroke={color} strokeWidth="2.8" fill={color} fillOpacity="0.09" strokeLinejoin="round"/>
      {/* scale lines on body */}
      <path d="M34 74 Q50 68 66 74" stroke={color} strokeWidth="1.3" opacity="0.4"/>
      <path d="M30 82 Q50 76 70 82" stroke={color} strokeWidth="1.3" opacity="0.4"/>
      {/* tail curl */}
      <path d="M50 90 Q50 104 42 112 Q36 118 40 124" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {/* LEFT neck */}
      <path d="M36 60 Q26 46 24 30" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.09"/>
      <path d="M36 60 Q26 46 24 30" stroke={color} strokeWidth="2.8" strokeLinecap="round"/>
      {/* LEFT head */}
      <path d="M14 22 Q10 14 20 12 Q26 10 30 16 Q38 14 38 22 Q38 32 28 34 Q16 34 14 22 Z"
            stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.1" strokeLinejoin="round"/>
      {/* left horn */}
      <path d="M20 12 L16 4 M28 12 L30 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* left eye */}
      <circle cx="21" cy="22" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15"/>
      <circle cx="21" cy="22" r="2" fill={color}/>
      <circle cx="22" cy="21" r="0.9" fill="white"/>
      {/* left tongue */}
      <path d="M14 26 L8 28 M8 28 L5 26 M8 28 L5 30" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      {/* RIGHT neck */}
      <path d="M64 60 Q74 46 76 30" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.09"/>
      <path d="M64 60 Q74 46 76 30" stroke={color} strokeWidth="2.8" strokeLinecap="round"/>
      {/* RIGHT head */}
      <path d="M86 22 Q90 14 80 12 Q74 10 70 16 Q62 14 62 22 Q62 32 72 34 Q84 34 86 22 Z"
            stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.1" strokeLinejoin="round"/>
      {/* right horn */}
      <path d="M80 12 L84 4 M72 12 L70 4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* right eye */}
      <circle cx="79" cy="22" r="4" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15"/>
      <circle cx="79" cy="22" r="2" fill={color}/>
      <circle cx="80" cy="21" r="0.9" fill="white"/>
      {/* right tongue */}
      <path d="M86 26 L92 28 M92 28 L95 26 M92 28 L95 30" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      {/* wing left */}
      <path d="M38 70 Q22 58 20 70 Q22 80 36 78" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1"/>
      {/* wing right */}
      <path d="M62 70 Q78 58 80 70 Q78 80 64 78" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1"/>
    </svg>
  );
}
