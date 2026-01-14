import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NewsletterUnsubscribePage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email || !token) {
        setStatus('error');
        setMessage(language === 'de' 
          ? 'Ungültiger Abmelde-Link' 
          : 'Invalid unsubscribe link');
        return;
      }

      try {
        const response = await axios.get(`${API}/newsletter/unsubscribe`, {
          params: { email, token }
        });
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 
          (language === 'de' ? 'Ein Fehler ist aufgetreten' : 'An error occurred'));
      }
    };

    unsubscribe();
  }, [email, token, language]);

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-[#E5E0D8] p-8 md:p-12 text-center">
          
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 size={48} className="animate-spin text-[#8B2E2E] mx-auto mb-6" />
              <p className="text-[#5C5852]">
                {language === 'de' ? 'Wird verarbeitet...' : 'Processing...'}
              </p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Erfolgreich abgemeldet' : 'Successfully Unsubscribed'}
              </h1>
              <p className="text-[#5C5852] mb-2">
                {message}
              </p>
              <p className="text-[#969088] text-sm mb-8">
                {language === 'de' 
                  ? 'Sie werden keine weiteren Newsletter-E-Mails von uns erhalten.' 
                  : 'You will no longer receive newsletter emails from us.'}
              </p>
              
              <div className="pt-6 border-t border-[#E5E0D8]">
                <p className="text-[#969088] text-sm mb-4">
                  {language === 'de' 
                    ? 'Haben Sie sich versehentlich abgemeldet?' 
                    : 'Unsubscribed by accident?'}
                </p>
                <Link 
                  to="/"
                  className="text-[#8B2E2E] hover:underline text-sm"
                >
                  {language === 'de' ? 'Zur Startseite' : 'Go to Homepage'}
                </Link>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-600" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Fehler' : 'Error'}
              </h1>
              <p className="text-[#5C5852] mb-8">
                {message}
              </p>
              <Link 
                to="/"
                className="btn-primary inline-block"
              >
                {language === 'de' ? 'Zur Startseite' : 'Go to Homepage'}
              </Link>
            </motion.div>
          )}

        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-[#969088] text-sm">
            <MailX size={16} />
            <span>
              {language === 'de' 
                ? 'Newsletter-Verwaltung' 
                : 'Newsletter Management'}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
