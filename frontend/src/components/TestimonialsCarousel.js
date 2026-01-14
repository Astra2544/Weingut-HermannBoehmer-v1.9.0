import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const TestimonialsCarousel = ({ testimonials }) => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goToPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [goToNext]);

  if (!testimonials || testimonials.length === 0) return null;

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      {/* Navigation - Top */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={goToPrev}
          className="w-10 h-10 flex items-center justify-center border border-[#E5E0D8] text-[#5C5852] hover:border-[#8B2E2E] hover:text-[#8B2E2E] transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-[#8B2E2E] w-6' 
                  : 'bg-[#E5E0D8] hover:bg-[#D6D0C4] w-2'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="w-10 h-10 flex items-center justify-center border border-[#E5E0D8] text-[#5C5852] hover:border-[#8B2E2E] hover:text-[#8B2E2E] transition-colors"
          aria-label="Next testimonial"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden min-h-[260px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="testimonial-elegant"
          >
            {/* Stars */}
            <div className="flex gap-1 mb-6 justify-center">
              {[...Array(currentTestimonial.rating)].map((_, i) => (
                <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
              ))}
            </div>
            
            {/* Quote */}
            <p className="font-quote text-xl text-[#5C5852] leading-relaxed text-center">
              &ldquo;{language === 'de' ? currentTestimonial.text_de : currentTestimonial.text_en}&rdquo;
            </p>
            
            {/* Author */}
            <div className="mt-8 pt-6 border-t border-[#E5E0D8] text-center">
              <p className="font-medium text-[#2D2A26]">{currentTestimonial.name}</p>
              <p className="text-sm text-[#969088]">{currentTestimonial.location}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
