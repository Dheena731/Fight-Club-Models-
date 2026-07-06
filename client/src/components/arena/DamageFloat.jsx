import { motion } from 'framer-motion';

const CRIT_LINES = ['SAVAGE!', 'BRUTAL!', 'ROASTED!', 'FLAWLESS!'];

// Floating damage number. Crits (big hits) go gold with a callout line.
export default function DamageFloat({ value, id, crit = false }) {
  const color = crit ? '#FACC15' : '#EF4444';
  return (
    <motion.div
      key={id}
      className="absolute font-display pointer-events-none select-none z-20 text-center"
      style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}
      initial={{ opacity: 1, y: 0, scale: crit ? 1.8 : 1.4 }}
      animate={{ opacity: 0, y: crit ? -64 : -52, scale: crit ? 0.9 : 0.7 }}
      transition={{ duration: crit ? 1.3 : 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ fontSize: crit ? 40 : 32, color, textShadow: `0 0 12px ${color}88, 0 2px 0 #0a0a0f` }}>
        -{value}
      </div>
      {crit && (
        <div className="tracking-[0.25em]" style={{ fontSize: 13, color: '#FACC15', textShadow: '0 0 10px #FACC1566' }}>
          {CRIT_LINES[id % CRIT_LINES.length]}
        </div>
      )}
    </motion.div>
  );
}
