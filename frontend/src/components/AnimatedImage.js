import { useState } from 'react';
import { motion } from 'framer-motion';

export const AnimatedImage = ({ 
  src, 
  alt, 
  className = '', 
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      {/* Pulsing placeholder while loading */}
      {!isLoaded && (
        <motion.div
          className="absolute inset-0 bg-[#F2EFE9]"
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ 
            duration: 1, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Image with fade-in */}
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={isLoaded ? { 
          opacity: 1, 
          scale: 1,
        } : { opacity: 0 }}
        transition={{ 
          duration: 0.4, 
          ease: "easeOut"
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};
