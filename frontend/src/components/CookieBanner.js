import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const CookieBanner = () => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('wachau-cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('wachau-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('wachau-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          data-testid="cookie-banner"
        >
          <div className="max-w-4xl mx-auto bg-white border border-[#E5E0D8] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="hidden sm:flex w-12 h-12 bg-[#F2EFE9] items-center justify-center flex-shrink-0">
                  <Cookie size={24} className="text-[#8B2E2E]" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-lg md:text-xl text-[#2D2A26]">
                      {language === 'de' ? 'Cookies & Datenschutz' : 'Cookies & Privacy'}
                    </h3>
                    <button
                      onClick={handleDecline}
                      className="p-1 text-[#969088] hover:text-[#2D2A26] transition-colors md:hidden"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <p className="text-[#5C5852] text-sm md:text-base mt-2 leading-relaxed">
                    {language === 'de' 
                      ? 'Wir verwenden technisch notwendige Cookies für den Warenkorb und Ihre Spracheinstellungen. Diese Daten werden nur lokal in Ihrem Browser gespeichert und nicht an Dritte weitergegeben.'
                      : 'We use technically necessary cookies for the shopping cart and your language settings. This data is only stored locally in your browser and is not shared with third parties.'}
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mt-4">
                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleAccept}
                        className="btn-primary !py-2.5 !px-6 text-xs"
                        data-testid="cookie-accept"
                      >
                        {language === 'de' ? 'Akzeptieren' : 'Accept'}
                      </button>
                      <button
                        onClick={handleDecline}
                        className="btn-secondary !py-2.5 !px-6 text-xs hidden sm:inline-flex"
                        data-testid="cookie-decline"
                      >
                        {language === 'de' ? 'Nur notwendige' : 'Essential only'}
                      </button>
                    </div>

                    {/* Privacy Link */}
                    <Link 
                      to="/privacy" 
                      className="text-sm text-[#8B2E2E] hover:underline"
                      onClick={handleDecline}
                    >
                      {language === 'de' ? 'Mehr erfahren' : 'Learn more'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
