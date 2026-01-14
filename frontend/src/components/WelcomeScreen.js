import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const WelcomeScreen = ({ name, isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);
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
            
            {/* Decorative corners */}
            <motion.div 
              className="absolute -top-16 -left-16 w-24 h-24 border-t-2 border-l-2 border-[#E5E0D8]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div 
              className="absolute -top-16 -right-16 w-24 h-24 border-t-2 border-r-2 border-[#E5E0D8]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
            <motion.div 
              className="absolute -bottom-16 -left-16 w-24 h-24 border-b-2 border-l-2 border-[#E5E0D8]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
            <motion.div 
              className="absolute -bottom-16 -right-16 w-24 h-24 border-b-2 border-r-2 border-[#E5E0D8]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />

            {/* Welcome Message */}
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
                Willkommen
              </motion.p>
              <h1 className="font-serif text-4xl md:text-5xl text-[#2D2A26] tracking-tight">
                {name}
              </h1>
              <motion.div 
                className="h-px bg-[#C9A96E] mx-auto mt-4"
                initial={{ width: 0 }}
                animate={{ width: 120 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </motion.div>

            {/* Animated checkmark */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              className="mt-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-green-500"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  />
                </motion.svg>
              </div>
            </motion.div>

            {/* Bottom tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="absolute -bottom-24 text-[#C9A96E] text-xs tracking-wider"
            >
              Erfolgreich angemeldet
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
