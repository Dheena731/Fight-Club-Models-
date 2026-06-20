import { motion, AnimatePresence } from 'framer-motion';

// Shows "ROUND N" → "FIGHT!" or "K.O." overlay on the stage.
export default function RoundAnnouncer({ label, sub, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="font-display tracking-widest text-white"
            style={{ fontSize: 52, textShadow: '0 0 24px rgba(255,255,255,0.6)', letterSpacing: '0.2em' }}
            initial={{ scaleX: 2.2, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {label}
          </motion.div>

          {sub && (
            <motion.div
              className="font-display tracking-widest mt-2"
              style={{ fontSize: 34, color: '#EF4444', letterSpacing: '0.3em', textShadow: '0 0 20px #EF444499' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.2 }}
            >
              {sub}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
