import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LoadingScreen = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Rein dekorativ - nach 2.5 Sekunden ausblenden
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      // Kurze Verzögerung für die Exit-Animation
      const exitTimer = setTimeout(() => {
        onLoadingComplete?.();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [isVisible, onLoadingComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
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

            {/* Logo/Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <h1 className="font-serif text-4xl md:text-5xl text-[#2D2A26] tracking-tight">
                Hermann Böhmer
              </h1>
              <motion.div 
                className="h-px bg-[#C9A96E] mx-auto mt-4"
                initial={{ width: 0 }}
                animate={{ width: 120 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-[0.7rem] tracking-[0.4em] uppercase text-[#969088] mt-3"
              >
                Weingut Dürnstein
              </motion.p>
            </motion.div>

            {/* Three animated dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-2 mt-8"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-[#8B2E2E]/60 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>

            {/* Bottom tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="absolute -bottom-24 text-[#C9A96E] text-xs tracking-wider"
            >
              Handgemacht seit Generationen
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
