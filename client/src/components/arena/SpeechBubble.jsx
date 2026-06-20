import { motion, AnimatePresence } from 'framer-motion';

const MAX_CHARS = 120;

export default function SpeechBubble({ text, side = 'left', visible }) {
  const truncated = text && text.length > MAX_CHARS ? text.slice(0, MAX_CHARS).trim() + '…' : text;
  const isLeft = side === 'left';

  return (
    <AnimatePresence>
      {visible && truncated && (
        <motion.div
          className="absolute bottom-full pointer-events-none z-10"
          style={{ [isLeft ? 'left' : 'right']: 0, maxWidth: 220, marginBottom: 10 }}
          initial={{ opacity: 0, y: 10, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
        >
          {/* bubble body */}
          <div
            className="relative px-3 py-2 rounded-xl text-xs leading-relaxed text-gray-900 font-medium"
            style={{ background: '#F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            {truncated}

            {/* pixel-style tail */}
            <div
              className="absolute"
              style={{
                top: '100%',
                [isLeft ? 'left' : 'right']: 16,
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '7px solid #F0F0F0',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
