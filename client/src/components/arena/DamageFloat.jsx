import { motion } from 'framer-motion';

export default function DamageFloat({ value, id }) {
  return (
    <motion.div
      key={id}
      className="absolute font-display pointer-events-none select-none z-20"
      style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', fontSize: 32, color: '#EF4444', textShadow: '0 0 12px #EF444488' }}
      initial={{ opacity: 1, y: 0, scale: 1.4 }}
      animate={{ opacity: 0, y: -52, scale: 0.7 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      -{value}
    </motion.div>
  );
}
