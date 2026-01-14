import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LogoutScreen = ({ name, isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#F9F8F6] flex items-center justify-center"
        >
          <div className="relative flex flex-col items-center">
            
            {/* Decorative corners - red tint */}
            <motion.div 
              className="absolute -top-16 -left-16 w-24 h-24 border-t-2 border-l-2 border-[#8B2E2E]/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div 
              className="absolute -top-16 -right-16 w-24 h-24 border-t-2 border-r-2 border-[#8B2E2E]/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
            <motion.div 
              className="absolute -bottom-16 -left-16 w-24 h-24 border-b-2 border-l-2 border-[#8B2E2E]/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
            <motion.div 
              className="absolute -bottom-16 -right-16 w-24 h-24 border-b-2 border-r-2 border-[#8B2E2E]/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />

            {/* Logout Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[0.8rem] tracking-[0.3em] uppercase text-[#969088] mb-2"
              >
                Auf Wiedersehen
              </motion.p>
              <h1 className="font-serif text-4xl md:text-5xl text-[#2D2A26] tracking-tight">
                {name}
              </h1>
              <motion.div 
                className="h-px bg-[#8B2E2E] mx-auto mt-4"
                initial={{ width: 0 }}
                animate={{ width: 120 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </motion.div>

            {/* Animated wave/goodbye icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              className="mt-8"
            >
              <div className="w-16 h-16 rounded-full bg-[#8B2E2E]/10 flex items-center justify-center">
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-[#8B2E2E]"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, 15, -15, 15, 0] }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                >
                  <path
                    d="M7.5 12.5C7.5 10.8431 8.84315 9.5 10.5 9.5H13.5C15.1569 9.5 16.5 10.8431 16.5 12.5V14C16.5 15.6569 15.1569 17 13.5 17H10.5C8.84315 17 7.5 15.6569 7.5 14V12.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 17V21M12 21L9 18M12 21L15 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.5 12V8C7.5 5.51472 9.51472 3.5 12 3.5C14.4853 3.5 16.5 5.51472 16.5 8V12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </motion.svg>
              </div>
            </motion.div>

            {/* Bottom tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="absolute -bottom-24 text-[#8B2E2E] text-xs tracking-wider"
            >
              Erfolgreich abgemeldet
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
