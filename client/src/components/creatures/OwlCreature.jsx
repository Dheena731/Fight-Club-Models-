export default function OwlCreature({ color = '#D97757' }) {
  return (
    <svg viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      {/* ear tufts */}
      <path d="M33 28 L27 10 L40 24" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.15" strokeLinejoin="round"/>
      <path d="M67 28 L73 10 L60 24" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.15" strokeLinejoin="round"/>
      {/* head */}
      <circle cx="50" cy="44" r="22" stroke={color} strokeWidth="2.8" fill={color} fillOpacity="0.07"/>
      {/* eye rings */}
      <circle cx="39" cy="43" r="9.5" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.12"/>
      <circle cx="61" cy="43" r="9.5" stroke={color} strokeWidth="2.2" fill={color} fillOpacity="0.12"/>
      {/* pupils */}
      <circle cx="39" cy="43" r="4.5" fill={color}/>
      <circle cx="61" cy="43" r="4.5" fill={color}/>
      {/* eye shine */}
      <circle cx="40.5" cy="41.5" r="1.8" fill="white" opacity="0.9"/>
      <circle cx="62.5" cy="41.5" r="1.8" fill="white" opacity="0.9"/>
      {/* beak */}
      <path d="M46 52 L50 59 L54 52 Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round"/>
      {/* body */}
      <path d="M22 80 Q22 114 50 116 Q78 114 78 80 Q78 62 65 58 Q50 66 35 58 Q22 62 22 80 Z"
            stroke={color} strokeWidth="2.8" fill={color} fillOpacity="0.07" strokeLinejoin="round"/>
      {/* feather lines */}
      <path d="M30 83 Q50 77 70 83" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      <path d="M27 95 Q50 88 73 95" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      <path d="M25 107 Q50 100 75 107" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      {/* wings */}
      <path d="M24 78 Q8 66 13 90 Q17 104 29 95" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill={color} fillOpacity="0.08"/>
      <path d="M76 78 Q92 66 87 90 Q83 104 71 95" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill={color} fillOpacity="0.08"/>
      {/* talons */}
      <path d="M42 116 L36 126 M42 116 L44 126 M42 116 L50 124" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M58 116 L52 126 M58 116 L60 126 M58 116 L66 124" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
