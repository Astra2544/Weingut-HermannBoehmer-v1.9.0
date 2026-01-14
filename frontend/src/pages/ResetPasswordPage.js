import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        await axios.get(`${API}/customer/password-reset/verify/${token}`);
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(
        language === 'de' 
          ? 'Die Passwörter stimmen nicht überein.'
          : 'Passwords do not match.'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        language === 'de' 
          ? 'Das Passwort muss mindestens 6 Zeichen lang sein.'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/customer/password-reset/confirm`, {
        token,
        new_password: password
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        (language === 'de' 
          ? 'Ein Fehler ist aufgetreten. Der Link ist möglicherweise abgelaufen.'
          : 'An error occurred. The link may have expired.')
      );
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    de: {
      title: 'Neues Passwort festlegen',
      subtitle: 'Geben Sie Ihr neues Passwort ein.',
      password: 'Neues Passwort',
      confirmPassword: 'Passwort bestätigen',
      submit: 'Passwort ändern',
      saving: 'Wird gespeichert...',
      successTitle: 'Passwort geändert!',
      successMessage: 'Ihr Passwort wurde erfolgreich geändert. Sie werden zur Anmeldung weitergeleitet...',
      invalidTitle: 'Ungültiger Link',
      invalidMessage: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.',
      requestNew: 'Neuen Link anfordern',
      noToken: 'Kein Token gefunden',
      noTokenMessage: 'Es wurde kein Zurücksetzungs-Token gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.',
      backToLogin: 'Zurück zur Anmeldung'
    },
    en: {
      title: 'Set New Password',
      subtitle: 'Enter your new password.',
      password: 'New Password',
      confirmPassword: 'Confirm Password',
      submit: 'Change Password',
      saving: 'Saving...',
      successTitle: 'Password Changed!',
      successMessage: 'Your password has been successfully changed. You will be redirected to login...',
      invalidTitle: 'Invalid Link',
      invalidMessage: 'This link is invalid or has expired. Please request a new link.',
      requestNew: 'Request New Link',
      noToken: 'No Token Found',
      noTokenMessage: 'No reset token was found. Please use the link from your email.',
      backToLogin: 'Back to Login'
    }
  };

  const t = texts[language] || texts.de;

  // Loading state
  if (verifying) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[#E5E0D8] p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#8B2E2E] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#5C5852]">
              {language === 'de' ? 'Link wird überprüft...' : 'Verifying link...'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // No token state
  if (!token) {
    return (
      <>
        <SEO title={t.noToken} />
        <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E5E0D8] p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-yellow-600" />
              </div>
              <h1 className="font-serif text-2xl text-[#2D2A26] mb-4">{t.noToken}</h1>
              <p className="text-[#5C5852] mb-6">{t.noTokenMessage}</p>
              <Link
                to="/forgot-password"
                className="inline-block px-6 py-3 bg-[#8B2E2E] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#7A2828] transition-colors"
              >
                {t.requestNew}
              </Link>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <>
        <SEO title={t.invalidTitle} />
        <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E5E0D8] p-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={32} className="text-red-600" />
              </div>
              <h1 className="font-serif text-2xl text-[#2D2A26] mb-4">{t.invalidTitle}</h1>
              <p className="text-[#5C5852] mb-6">{t.invalidMessage}</p>
              <Link
                to="/forgot-password"
                className="inline-block px-6 py-3 bg-[#8B2E2E] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#7A2828] transition-colors"
              >
                {t.requestNew}
              </Link>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO title={t.title} />
      
      <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E0D8] p-8"
          >
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
                <p className="text-[#5C5852]">
                  {t.successMessage}
                </p>
              </motion.div>
            ) : (
              /* Form State */
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F2EFE9] flex items-center justify-center">
                    <Lock size={24} className="text-[#8B2E2E]" />
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
                      htmlFor="password" 
                      className="block text-xs uppercase tracking-wider text-[#969088] mb-2"
                    >
                      {t.password}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 pr-12 border border-[#E5E0D8] bg-white text-[#2D2A26] focus:outline-none focus:border-[#8B2E2E] transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969088] hover:text-[#5C5852]"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="confirmPassword" 
                      className="block text-xs uppercase tracking-wider text-[#969088] mb-2"
                    >
                      {t.confirmPassword}
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-[#E5E0D8] bg-white text-[#2D2A26] focus:outline-none focus:border-[#8B2E2E] transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#8B2E2E] text-white text-sm font-medium tracking-wider uppercase hover:bg-[#7A2828] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.saving : t.submit}
                  </button>
                </form>

                <p className="text-center text-sm text-[#969088] mt-8">
                  <Link to="/login" className="text-[#8B2E2E] hover:underline">
                    {t.backToLogin}
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
