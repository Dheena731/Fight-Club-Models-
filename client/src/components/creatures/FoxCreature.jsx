export default function FoxCreature({ color = '#10A37F' }) {
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      {/* ears */}
      <path d="M34 32 L28 8 L44 28" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.15" strokeLinejoin="round"/>
      <path d="M66 32 L72 8 L56 28" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.15" strokeLinejoin="round"/>
      {/* inner ears */}
      <path d="M35 30 L31 16 L41 28" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.3" strokeLinejoin="round"/>
      <path d="M65 30 L69 16 L59 28" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.3" strokeLinejoin="round"/>
      {/* head */}
      <path d="M28 38 Q28 22 50 22 Q72 22 72 38 Q74 52 64 58 Q60 62 50 64 Q40 62 36 58 Q26 52 28 38 Z"
            stroke={color} strokeWidth="2.8" fill={color} fillOpacity="0.07" strokeLinejoin="round"/>
      {/* muzzle */}
      <path d="M38 52 Q50 62 62 52 Q60 68 50 70 Q40 68 38 52 Z"
            stroke={color} strokeWidth="2" fill={color} fillOpacity="0.12" strokeLinejoin="round"/>
      {/* eyes */}
      <ellipse cx="38" cy="40" rx="7" ry="5.5" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.12"/>
      <ellipse cx="62" cy="40" rx="7" ry="5.5" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.12"/>
      <ellipse cx="38" cy="40" rx="3" ry="4" fill={color}/>
      <ellipse cx="62" cy="40" rx="3" ry="4" fill={color}/>
      <circle cx="39.5" cy="38.5" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="63.5" cy="38.5" r="1.5" fill="white" opacity="0.9"/>
      {/* nose */}
      <ellipse cx="50" cy="64" rx="4" ry="3" fill={color}/>
      {/* body */}
      <path d="M30 78 Q28 102 36 110 Q50 118 64 110 Q72 102 70 78 Q66 64 50 66 Q34 64 30 78 Z"
            stroke={color} strokeWidth="2.8" fill={color} fillOpacity="0.07" strokeLinejoin="round"/>
      {/* tail */}
      <path d="M68 80 Q88 72 90 88 Q92 104 78 108 Q70 110 66 100"
            stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill={color} fillOpacity="0.08"/>
      {/* tail tip fluffy circle */}
      <circle cx="84" cy="96" r="8" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15"/>
      <path d="M78 92 Q86 96 80 102" stroke={color} strokeWidth="1.2" opacity="0.4"/>
      {/* paws */}
      <path d="M36 110 Q32 120 38 124 M36 110 Q28 120 32 126" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M64 110 Q68 120 62 124 M64 110 Q72 120 68 126" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
