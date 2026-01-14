import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

export default function LoginPage() {
  const { language } = useLanguage();
  const { login, isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get redirect URL from state
  const from = location.state?.from || null;

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate(from || '/');
      }
    }
  }, [isLoggedIn, isAdmin, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, language);
      // Navigation happens after welcome screen closes
      // Wait for welcome animation then navigate
      setTimeout(() => {
        if (result.user_type === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from || '/', { replace: true });
        }
      }, 3000);
    } catch (err) {
      // Server returns translated error message based on language
      setError(err.response?.data?.detail || (language === 'de' ? 'Anmeldung fehlgeschlagen' : 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={language === 'de' ? 'Anmelden | Hermann Böhmer' : 'Login | Hermann Böhmer'}
      />
      <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-[#E5E0D8] p-8 md:p-10"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#F2EFE9] mx-auto mb-4 flex items-center justify-center">
                <LogIn size={28} className="text-[#8B2E2E]" />
              </div>
              <h1 className="font-serif text-3xl text-[#2D2A26]">
                {language === 'de' ? 'Anmelden' : 'Sign In'}
              </h1>
              <p className="text-[#5C5852] mt-2">
                {language === 'de' ? 'Für Kunden und Administratoren' : 'For customers and administrators'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 flex items-center gap-2"
              >
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'E-Mail' : 'Email'}
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                    placeholder="ihre@email.at"
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'Passwort' : 'Password'}
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                    placeholder="••••••••"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#969088] hover:text-[#5C5852]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Forgot Password Link */}
                <div className="text-right mt-2">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-[#8B2E2E] hover:underline"
                  >
                    {language === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                data-testid="submit-btn"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    {language === 'de' ? 'Anmelden' : 'Sign In'}
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-[#E5E0D8]" />
              <span className="text-sm text-[#969088]">
                {language === 'de' ? 'oder' : 'or'}
              </span>
              <div className="flex-1 h-px bg-[#E5E0D8]" />
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              state={{ from }}
              className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
              data-testid="register-link"
            >
              <UserPlus size={18} />
              {language === 'de' ? 'Neues Konto erstellen' : 'Create New Account'}
            </Link>

            {/* Continue as Guest */}
            <p className="text-center text-sm text-[#969088] mt-6">
              {language === 'de' ? 'Oder ' : 'Or '}
              <Link to="/cart" className="text-[#8B2E2E] hover:underline">
                {language === 'de' ? 'als Gast fortfahren' : 'continue as guest'}
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
