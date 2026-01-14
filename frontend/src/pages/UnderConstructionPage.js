import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Construction, Mail, Clock, Sparkles, Wine } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UnderConstructionPage() {
  const [language, setLanguage] = useState('de');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for subtle parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const content = {
    de: {
      badge: 'BALD VERFÜGBAR',
      title: 'Wir arbeiten an',
      titleAccent: 'etwas Besonderem',
      subtitle: 'Unser Online-Shop wird gerade für Sie vorbereitet. Bald können Sie unsere exquisiten Wachauer Marillenprodukte direkt zu sich nach Hause bestellen.',
      notify: 'Benachrichtigen Sie mich',
      emailPlaceholder: 'Ihre E-Mail-Adresse',
      submit: 'Informiert werden',
      thanks: 'Vielen Dank!',
      thanksText: 'Wir werden Sie benachrichtigen, sobald wir online sind.',
      comingSoon: 'Demnächst verfügbar',
      features: [
        'Premium Marillenlikör',
        'Handgemachte Edelbrände',
        'Feinste Marmeladen'
      ],
      footer: `© ${new Date().getFullYear()} Hermann Böhmer · Weingut Dürnstein`
    },
    en: {
      badge: 'COMING SOON',
      title: "We're crafting",
      titleAccent: 'something special',
      subtitle: 'Our online shop is being prepared for you. Soon you will be able to order our exquisite Wachau apricot products directly to your home.',
      notify: 'Get notified',
      emailPlaceholder: 'Your email address',
      submit: 'Notify me',
      thanks: 'Thank you!',
      thanksText: 'We will notify you as soon as we are online.',
      comingSoon: 'Coming soon',
      features: [
        'Premium Apricot Liqueur',
        'Handcrafted Brandies',
        'Finest Jams'
      ],
      footer: `© ${new Date().getFullYear()} Hermann Böhmer · Winery Dürnstein`
    }
  };

  const t = content[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Subscribe to newsletter via backend API
      await axios.post(`${API}/newsletter/subscribe`, { 
        email,
        source: 'under_construction' // Mark where they signed up from
      });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 400) {
        // Already subscribed - still show success
        setSubmitted(true);
      } else {
        setError(language === 'de' 
          ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
          : 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Floating particles animation
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15
  }));

  return (
    <div className="min-h-screen bg-[#F9F8F6] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #8B2E2E 0%, transparent 70%)',
            top: '-200px',
            right: '-200px',
            x: mousePosition.x * -1,
            y: mousePosition.y * -1,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #D4A574 0%, transparent 70%)',
            bottom: '-150px',
            left: '-150px',
            x: mousePosition.x,
            y: mousePosition.y,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Floating particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-[#8B2E2E]"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              opacity: 0.1,
            }}
            animate={{
              y: [window.innerHeight + 100, -100],
              rotate: [0, 360],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear"
            }}
          />
        ))}

        {/* Decorative lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#8B2E2E" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Language switcher */}
      <motion.div 
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#E5E0D8]">
          <button
            onClick={() => setLanguage('de')}
            className={`text-sm font-medium transition-colors ${
              language === 'de' ? 'text-[#8B2E2E]' : 'text-[#969088] hover:text-[#2D2A26]'
            }`}
          >
            DE
          </button>
          <span className="text-[#D6D0C4]">|</span>
          <button
            onClick={() => setLanguage('en')}
            className={`text-sm font-medium transition-colors ${
              language === 'en' ? 'text-[#8B2E2E]' : 'text-[#969088] hover:text-[#2D2A26]'
            }`}
          >
            EN
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-2 border-[#8B2E2E] mb-6">
            <Wine size={36} className="text-[#8B2E2E]" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-[#2D2A26] tracking-tight">
            Hermann Böhmer
          </h2>
          <p className="text-[0.7rem] tracking-[0.3em] uppercase text-[#969088] mt-1">
            Weingut Dürnstein
          </p>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B2E2E]/10 text-[#8B2E2E] text-xs tracking-[0.2em] uppercase font-medium">
            <Construction size={14} />
            {t.badge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mt-8 mb-6"
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#2D2A26] leading-tight">
            {t.title}
            <br />
            <span className="italic text-[#8B2E2E]">{t.titleAccent}</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-[#5C5852] text-center max-w-xl text-base md:text-lg leading-relaxed mb-12"
        >
          {t.subtitle}
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {t.features.map((feature, index) => (
            <motion.span
              key={feature}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E0D8] text-[#5C5852] text-sm"
            >
              <Sparkles size={12} className="text-[#8B2E2E]" />
              {feature}
            </motion.span>
          ))}
        </motion.div>

        {/* Email signup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="w-full max-w-md"
        >
          {!submitted ? (
            <div className="bg-white p-6 md:p-8 border border-[#E5E0D8] shadow-lg">
              <div className="flex items-center gap-2 text-[#2D2A26] mb-4">
                <Mail size={18} className="text-[#8B2E2E]" />
                <span className="font-medium">{t.notify}</span>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder={t.emailPlaceholder}
                  required
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-[#E5E0D8] bg-[#F9F8F6] focus:border-[#8B2E2E] focus:outline-none transition-colors text-[#2D2A26] disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="px-6 py-3 bg-[#8B2E2E] text-white font-medium hover:bg-[#722626] transition-colors whitespace-nowrap disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t.submit
                  )}
                </motion.button>
              </form>
              {error && (
                <p className="text-red-500 text-sm mt-3">{error}</p>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 border border-[#E5E0D8] shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Mail size={28} className="text-green-600" />
                </motion.div>
              </div>
              <h3 className="font-serif text-2xl text-[#2D2A26] mb-2">{t.thanks}</h3>
              <p className="text-[#5C5852]">{t.thanksText}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Animated clock/coming soon indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex items-center gap-3 text-[#969088]"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Clock size={18} />
          </motion.div>
          <span className="text-sm tracking-wider uppercase">{t.comingSoon}</span>
        </motion.div>

        {/* Version Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-16 max-w-sm mx-auto"
        >
          <div className="flex items-center gap-4 text-[11px] tracking-wider">
            {/* v1.0 - Completed */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
              <span className="text-[#969088] font-medium">v1.0</span>
              <span className="text-[#C5C0B8] text-[9px]">✓</span>
            </div>
            
            {/* Progress line */}
            <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 via-[#8B2E2E]/50 to-[#8B2E2E]/20 rounded-full"></div>
            
            {/* v1.5 - In Progress */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-3 h-3 rounded-full bg-[#8B2E2E] animate-pulse shadow-md"></span>
                <span className="absolute inset-0 w-3 h-3 rounded-full bg-[#8B2E2E] animate-ping opacity-30"></span>
              </div>
              <span className="text-[#8B2E2E] font-semibold">v1.5</span>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex justify-between mt-3 text-[9px]">
            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">
              {language === 'de' ? 'Fertig' : 'Complete'}
            </span>
            <span className="text-[#8B2E2E] bg-[#8B2E2E]/10 px-2 py-0.5 rounded animate-pulse">
              {language === 'de' ? '● In Bearbeitung' : '● In Progress'}
            </span>
          </div>
          
          <p className="text-[#969088] text-[10px] text-center mt-3 tracking-wide">
            {language === 'de' ? 'Bug Fixes & neue Integrationen' : 'Bug fixes & new integrations'}
          </p>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-6 left-0 right-0 text-center"
        >
          <p className="text-[#969088] text-xs tracking-wider">{t.footer}</p>
        </motion.footer>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#8B2E2E]/20" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#8B2E2E]/20" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#8B2E2E]/20" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#8B2E2E]/20" />
    </div>
  );
}
