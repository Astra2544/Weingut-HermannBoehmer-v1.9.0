import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, User, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

export default function RegisterPage() {
  const { language } = useLanguage();
  const { register, checkEmailExists } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  const from = location.state?.from || '/';

  const handleEmailBlur = async () => {
    if (!form.email || !form.email.includes('@')) return;
    
    try {
      const exists = await checkEmailExists(form.email);
      if (exists) {
        setEmailError(language === 'de' 
          ? 'Diese E-Mail existiert bereits. Bitte melden Sie sich an.' 
          : 'This email already exists. Please sign in.');
        setEmailChecked(false);
      } else {
        setEmailError('');
        setEmailChecked(true);
      }
    } catch (err) {
      console.error('Email check failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError(language === 'de' ? 'Passwort muss mindestens 6 Zeichen haben' : 'Password must be at least 6 characters');
      return;
    }

    if (emailError) {
      return;
    }

    setLoading(true);

    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      // Registration successful - navigate to home after welcome screen
      // The welcome screen will show automatically via AuthContext
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 3000); // Wait for welcome animation
    } catch (err) {
      setError(err.response?.data?.detail || (language === 'de' ? 'Registrierung fehlgeschlagen' : 'Registration failed'));
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setEmailError('');
      setEmailChecked(false);
    }
  };

  return (
    <>
      <SEO 
        title={language === 'de' ? 'Registrieren | Hermann Böhmer' : 'Register | Hermann Böhmer'}
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
                {language === 'de' ? 'Werden Sie Teil unserer Gemeinschaft' : 'Join our community'}
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
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                    {language === 'de' ? 'Vorname' : 'First Name'} *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => updateForm('first_name', e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                    {language === 'de' ? 'Nachname' : 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => updateForm('last_name', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none text-sm"
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'E-Mail' : 'Email'} *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    onBlur={handleEmailBlur}
                    required
                    className={`w-full pl-10 pr-10 py-3 border bg-white focus:outline-none text-sm ${
                      emailError ? 'border-red-400 focus:border-red-500' : 
                      emailChecked ? 'border-green-400 focus:border-green-500' : 
                      'border-[#E5E0D8] focus:border-[#8B2E2E]'
                    }`}
                    placeholder="ihre@email.at"
                  />
                  {emailChecked && !emailError && (
                    <CheckCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {emailError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {emailError}
                    <Link to="/login" className="underline ml-1">
                      {language === 'de' ? 'Zur Anmeldung' : 'Sign in'}
                    </Link>
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'Telefon' : 'Phone'} ({language === 'de' ? 'optional' : 'optional'})
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none text-sm"
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
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#969088] hover:text-[#5C5852]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969088]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    required
                    className={`w-full pl-10 pr-4 py-3 border bg-white focus:outline-none text-sm ${
                      form.confirmPassword && form.password !== form.confirmPassword 
                        ? 'border-red-400' 
                        : 'border-[#E5E0D8] focus:border-[#8B2E2E]'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !!emailError}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-6"
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
              {language === 'de' ? 'Bereits ein Konto? ' : 'Already have an account? '}
              <Link to="/login" className="text-[#8B2E2E] hover:underline font-medium">
                {language === 'de' ? 'Anmelden' : 'Sign In'}
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </>
  );
}
