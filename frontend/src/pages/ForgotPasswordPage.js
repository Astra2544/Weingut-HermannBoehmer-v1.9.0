import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API}/customer/password-reset/request`, { email });
      setSuccess(true);
    } catch (err) {
      setError(
        language === 'de' 
          ? 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
          : 'An error occurred. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    de: {
      title: 'Passwort vergessen',
      subtitle: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.',
      email: 'E-Mail-Adresse',
      submit: 'Link senden',
      sending: 'Wird gesendet...',
      backToLogin: 'Zurück zur Anmeldung',
      successTitle: 'E-Mail gesendet!',
      successMessage: 'Wenn ein Konto mit dieser E-Mail existiert, erhalten Sie in Kürze eine E-Mail mit weiteren Anweisungen.',
      checkSpam: 'Bitte überprüfen Sie auch Ihren Spam-Ordner.',
      noAccount: 'Noch kein Konto?',
      register: 'Jetzt registrieren'
    },
    en: {
      title: 'Forgot Password',
      subtitle: 'Enter your email address and we\'ll send you a link to reset your password.',
      email: 'Email Address',
      submit: 'Send Link',
      sending: 'Sending...',
      backToLogin: 'Back to Login',
      successTitle: 'Email Sent!',
      successMessage: 'If an account exists with this email, you will receive an email with further instructions shortly.',
      checkSpam: 'Please also check your spam folder.',
      noAccount: 'No account yet?',
      register: 'Register now'
    }
  };

  const t = texts[language] || texts.de;

  return (
    <>
      <SEO 
        title={t.title}
        description="Reset your password"
      />
      
      <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E0D8] p-8"
          >
            {/* Back Link */}
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm text-[#969088] hover:text-[#8B2E2E] transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              {t.backToLogin}
            </Link>

            {success ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h1 className="font-serif text-2xl text-[#2D2A26] mb-4">
                  {t.successTitle}
                </h1>
                <p className="text-[#5C5852] mb-4">
                  {t.successMessage}
                </p>
                <p className="text-sm text-[#969088]">
                  {t.checkSpam}
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-8 px-6 py-3 bg-[#8B2E2E] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#7A2828] transition-colors"
                >
                  {t.backToLogin}
                </Link>
              </motion.div>
            ) : (
              /* Form State */
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F2EFE9] flex items-center justify-center">
                    <Mail size={24} className="text-[#8B2E2E]" />
                  </div>
                  <h1 className="font-serif text-2xl md:text-3xl text-[#2D2A26] mb-2">
                    {t.title}
                  </h1>
                  <p className="text-[#5C5852] text-sm">
                    {t.subtitle}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3"
                  >
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-xs uppercase tracking-wider text-[#969088] mb-2"
                    >
                      {t.email}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-[#E5E0D8] bg-white text-[#2D2A26] focus:outline-none focus:border-[#8B2E2E] transition-colors"
                      placeholder="ihre.email@beispiel.at"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#8B2E2E] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#7A2828] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.sending : t.submit}
                  </button>
                </form>

                {/* Register Link */}
                <p className="text-center text-sm text-[#969088] mt-8">
                  {t.noAccount}{' '}
                  <Link to="/register" className="text-[#8B2E2E] hover:underline">
                    {t.register}
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
