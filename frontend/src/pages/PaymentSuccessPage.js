import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Loader2, Sparkles, Mail, Truck } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccessPage() {
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');
  const isDemo = searchParams.get('demo') === 'true';
  const trackingNumber = searchParams.get('tracking');

  useEffect(() => {
    const verifyPayment = async () => {
      if (isDemo && trackingNumber) {
        setOrderData({ tracking_number: trackingNumber });
        clearCart();
        setLoading(false);
        return;
      }

      if (!sessionId) {
        setError(language === 'de' ? 'Keine Session gefunden' : 'No session found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/payment/verify`, {
          params: { session_id: sessionId }
        });

        if (response.data.success) {
          setOrderData(response.data.order);
          clearCart();
        } else {
          setError(language === 'de' ? 'Zahlung nicht bestätigt' : 'Payment not confirmed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(language === 'de' ? 'Fehler bei der Zahlungsbestätigung' : 'Payment verification error');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, isDemo, trackingNumber, clearCart, language]);

  if (loading) {
    return (
      <main className="bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="relative">
            <Loader2 size={56} className="animate-spin text-[#8B2E2E] mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#8B2E2E]/10 animate-ping" />
            </div>
          </div>
          <p className="text-[#5C5852] text-lg">
            {language === 'de' ? 'Zahlung wird überprüft...' : 'Verifying payment...'}
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-red-100 flex items-center justify-center mx-auto mb-6 rounded-full">
            <span className="text-red-600 text-3xl">!</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2D2A26]">
            {language === 'de' ? 'Fehler' : 'Error'}
          </h1>
          <p className="text-[#5C5852] mt-4 text-lg">{error}</p>
          <Link to="/cart" className="btn-primary inline-flex items-center gap-2 mt-8">
            {language === 'de' ? 'Zurück zum Warenkorb' : 'Back to Cart'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] min-h-screen pt-28 md:pt-32" data-testid="payment-success-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-16">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, duration: 0.8 }}
            className="relative w-28 h-28 mx-auto mb-8"
          >
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="absolute inset-2 bg-green-500/30 rounded-full animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center rounded-full shadow-xl">
              <CheckCircle size={56} className="text-white" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles size={28} className="text-amber-500" />
            </motion.div>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-green-400"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0],
                  x: [0, Math.cos((i * 45 * Math.PI) / 180) * 70],
                  y: [0, Math.sin((i * 45 * Math.PI) / 180) * 70],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3 + i * 0.05,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-serif text-4xl md:text-5xl text-[#2D2A26] mb-4">
              {language === 'de' ? 'Vielen Dank!' : 'Thank You!'}
            </h1>
            <p className="text-[#5C5852] text-lg md:text-xl max-w-xl mx-auto">
              {language === 'de'
                ? 'Ihre Bestellung wurde erfolgreich aufgegeben. Wir bereiten sie mit Liebe vor.'
                : 'Your order has been successfully placed. We are preparing it with care.'}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-[#E5E0D8] rounded-2xl p-8 mt-10 text-center shadow-lg"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2EFE9] rounded-full mb-4">
            <Package size={18} className="text-[#8B2E2E]" />
            <span className="text-sm font-medium text-[#5C5852]">
              {language === 'de' ? 'Ihre Tracking-Nummer' : 'Your Tracking Number'}
            </span>
          </div>
          <p className="text-4xl md:text-5xl font-serif text-[#8B2E2E] font-mono tracking-wider">
            {orderData?.tracking_number || '—'}
          </p>
          <p className="text-sm text-[#969088] mt-4">
            {language === 'de'
              ? 'Speichern Sie diese Nummer um Ihre Bestellung zu verfolgen.'
              : 'Save this number to track your order.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
        >
          <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-[#2D2A26] mb-1">
                {language === 'de' ? 'Bestätigung per E-Mail' : 'Email Confirmation'}
              </h3>
              <p className="text-sm text-[#5C5852]">
                {language === 'de'
                  ? 'Sie erhalten in Kürze eine Bestätigungsmail mit allen Details.'
                  : 'You will receive a confirmation email shortly with all details.'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-[#2D2A26] mb-1">
                {language === 'de' ? 'Schneller Versand' : 'Fast Shipping'}
              </h3>
              <p className="text-sm text-[#5C5852]">
                {language === 'de'
                  ? 'Wir versenden innerhalb von 1-2 Werktagen.'
                  : 'We ship within 1-2 business days.'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
        >
          <Link
            to="/tracking"
            className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            {language === 'de' ? 'Bestellung verfolgen' : 'Track Order'}
            <ArrowRight size={20} />
          </Link>
          <Link
            to="/shop"
            className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            {language === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
          </Link>
        </motion.div>

        {isDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center"
          >
            <p className="text-amber-800 text-sm">
              <strong>{language === 'de' ? 'Testmodus:' : 'Test Mode:'}</strong>{' '}
              {language === 'de'
                ? 'Dies war eine Demo-Bestellung. Im Live-Betrieb wird echtes Geld verarbeitet.'
                : 'This was a demo order. In live mode, real money will be processed.'}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
