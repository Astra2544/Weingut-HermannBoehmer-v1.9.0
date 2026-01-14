import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

export default function CustomerRegisterPage() {
  const { language } = useLanguage();
  const { register, checkEmailExists, isLoggedIn } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

  // Redirect if already logged in
  if (isLoggedIn) {
    navigate('/account');
    return null;
  }

  const from = location.state?.from || '/account';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset email check when email changes
    if (name === 'email') {
      setEmailChecked(false);
      setEmailExists(false);
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email && formData.email.includes('@')) {
      try {
        const exists = await checkEmailExists(formData.email);
        setEmailChecked(true);
        setEmailExists(exists);
        if (exists) {
          setError(language === 'de' 
            ? 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.' 
            : 'This email is already registered. Please sign in.');
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Email check failed:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(language === 'de' ? 'Passwort muss mindestens 6 Zeichen haben' : 'Password must be at least 6 characters');
      return;
    }

    if (emailExists) {
      setError(language === 'de' 
        ? 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.' 
        : 'This email is already registered. Please sign in.');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || null
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || (language === 'de' ? 'Registrierung fehlgeschlagen' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={language === 'de' ? 'Konto erstellen | Hermann Böhmer' : 'Create Account | Hermann Böhmer'}
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
                <UserPlus size={28} className="text-[#8B2E2E]" />
              </div>
              <h1 className="font-serif text-3xl text-[#2D2A26]">
                {language === 'de' ? 'Konto erstellen' : 'Create Account'}
              </h1>
              <p className="text-[#5C5852] mt-2">
                {language === 'de' ? 'Erstellen Sie Ihr Kundenkonto' : 'Create your customer account'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 flex items-start gap-2"
              >
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  {error}
                  {emailExists && (
                    <Link to="/account/login" state={{ from }} className="block mt-1 underline font-medium">
                      {language === 'de' ? '→ Zur Anmeldung' : '→ Go to login'}
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                    {language === 'de' ? 'Vorname' : 'First Name'} *
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                    {language === 'de' ? 'Nachname' : 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'E-Mail' : 'Email'} *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                    required
                    className={`w-full pl-12 pr-12 py-3 border bg-white focus:outline-none transition-colors ${
                      emailChecked 
                        ? emailExists 
                          ? 'border-red-400 focus:border-red-400' 
                          : 'border-green-400 focus:border-green-400'
                        : 'border-[#E5E0D8] focus:border-[#8B2E2E]'
                    }`}
                    placeholder="ihre@email.at"
                  />
                  {emailChecked && (
                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 ${emailExists ? 'text-red-500' : 'text-green-500'}`}>
                      {emailExists ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    </span>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'Telefon' : 'Phone'} ({language === 'de' ? 'optional' : 'optional'})
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                    placeholder="+43 664 123 4567"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'Passwort' : 'Password'} *
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#969088] hover:text-[#5C5852]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-[#969088] mt-1">
                  {language === 'de' ? 'Mindestens 6 Zeichen' : 'At least 6 characters'}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'Passwort bestätigen' : 'Confirm Password'} *
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || emailExists}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    {language === 'de' ? 'Konto erstellen' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-[#5C5852] mt-6">
              {language === 'de' ? 'Bereits ein Konto?' : 'Already have an account?'}{' '}
              <Link to="/account/login" state={{ from }} className="text-[#8B2E2E] hover:underline font-medium">
                {language === 'de' ? 'Anmelden' : 'Sign In'}
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
