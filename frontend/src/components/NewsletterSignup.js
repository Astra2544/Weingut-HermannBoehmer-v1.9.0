import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const NewsletterSignup = () => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API}/newsletter/subscribe`, { email });
      setSuccess(true);
      toast.success(language === 'de' ? 'Erfolgreich angemeldet!' : 'Successfully subscribed!');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 
        (language === 'de' ? 'Ein Fehler ist aufgetreten.' : 'An error occurred.');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#8B2E2E]/5 border border-[#8B2E2E]/20 p-6 md:p-8 text-center"
      >
        <div className="w-12 h-12 bg-[#8B2E2E] flex items-center justify-center mx-auto mb-4">
          <Check size={24} className="text-white" />
        </div>
        <h4 className="font-serif text-xl text-[#2D2A26]">
          {language === 'de' ? 'Vielen Dank!' : 'Thank you!'}
        </h4>
        <p className="text-[#5C5852] text-sm mt-2">
          {language === 'de' 
            ? 'Sie erhalten bald unsere neuesten Angebote und Neuigkeiten.' 
            : 'You will soon receive our latest offers and news.'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#F2EFE9] p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex w-12 h-12 bg-[#8B2E2E] items-center justify-center flex-shrink-0">
          <Mail size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-serif text-xl text-[#2D2A26]">
            {language === 'de' ? 'Newsletter' : 'Newsletter'}
          </h4>
          <p className="text-[#5C5852] text-sm mt-1">
            {language === 'de' 
              ? 'Erhalten Sie exklusive Angebote und Neuigkeiten aus der Wachau.' 
              : 'Receive exclusive offers and news from Wachau.'}
          </p>
          
          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'de' ? 'Ihre E-Mail' : 'Your email'}
              required
              className="flex-1 px-4 py-3 bg-white border border-[#E5E0D8] focus:border-[#8B2E2E] outline-none text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary !py-3 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {language === 'de' ? 'Anmelden' : 'Subscribe'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <p className="text-xs text-[#969088] mt-3">
            {language === 'de' 
              ? 'Mit der Anmeldung stimmen Sie unserer Datenschutzerklärung zu.' 
              : 'By subscribing, you agree to our privacy policy.'}
          </p>
        </div>
      </div>
    </div>
  );
};
