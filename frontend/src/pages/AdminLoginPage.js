import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Input } from '../components/ui/input';
import { useLanguage } from '../context/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLoginPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) navigate('/admin/dashboard');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/login`, {
        email: form.email,
        password: form.password
      });
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_email', response.data.email);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || (language === 'de' ? 'Ungültige Anmeldedaten' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F9F8F6] px-4 sm:px-6" data-testid="admin-login-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 md:mb-12">
          <div className="w-16 h-16 bg-[#8B2E2E] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-serif text-2xl">HB</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">
            Admin
          </h1>
          <p className="text-[#969088] text-sm mt-2">
            {language === 'de' ? 'Hermann Böhmer Weingut' : 'Hermann Böhmer Winery'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#E5E0D8] p-6 md:p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 md:p-4 bg-red-50 border border-red-200 text-red-600 mb-4 md:mb-6" data-testid="login-error">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="admin-login-form">
            <div>
              <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969088]" />
                <Input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} 
                  placeholder="admin@example.com" 
                  required 
                  className="input-elegant pl-10" 
                  data-testid="admin-email-input" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">
                {language === 'de' ? 'Passwort' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969088]" />
                <Input 
                  type={showPassword ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} 
                  placeholder="••••••••" 
                  required 
                  className="input-elegant pl-10 pr-10" 
                  data-testid="admin-password-input" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969088] hover:text-[#2D2A26] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full flex items-center justify-center mt-6" 
              data-testid="admin-submit-btn"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                language === 'de' ? 'Anmelden' : 'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-[#969088] text-center mt-6">
          {language === 'de' ? 'Nur für autorisiertes Personal' : 'Authorized personnel only'}
        </p>
      </motion.div>
    </main>
  );
}
