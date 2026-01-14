import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFoundPage() {
  const { language } = useLanguage();

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32 flex items-center" data-testid="not-found-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-12 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Number */}
          <div className="relative">
            <span className="font-serif text-[150px] md:text-[200px] leading-none text-[#F2EFE9] select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#8B2E2E] flex items-center justify-center">
                <Search size={32} className="text-white md:w-10 md:h-10" />
              </div>
            </div>
          </div>

          {/* Text */}
          <h1 className="font-serif text-3xl md:text-4xl text-[#2D2A26] mt-8">
            {language === 'de' ? 'Seite nicht gefunden' : 'Page Not Found'}
          </h1>
          
          <p className="text-[#5C5852] mt-4 text-lg max-w-md mx-auto">
            {language === 'de' 
              ? 'Die gesuchte Seite existiert leider nicht. Vielleicht wurde sie verschoben oder gelöscht.' 
              : 'The page you are looking for does not exist. Perhaps it has been moved or deleted.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link 
              to="/" 
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Home size={18} />
              {language === 'de' ? 'Zur Startseite' : 'Go to Homepage'}
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              {language === 'de' ? 'Zurück' : 'Go Back'}
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-16 pt-8 border-t border-[#E5E0D8]">
            <p className="text-sm text-[#969088] mb-4">
              {language === 'de' ? 'Beliebte Seiten:' : 'Popular pages:'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/shop" className="text-[#8B2E2E] hover:underline text-sm">
                {language === 'de' ? 'Shop' : 'Shop'}
              </Link>
              <span className="text-[#D6D0C4]">•</span>
              <Link to="/about" className="text-[#8B2E2E] hover:underline text-sm">
                {language === 'de' ? 'Über Uns' : 'About Us'}
              </Link>
              <span className="text-[#D6D0C4]">•</span>
              <Link to="/tracking" className="text-[#8B2E2E] hover:underline text-sm">
                {language === 'de' ? 'Sendungsverfolgung' : 'Order Tracking'}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
