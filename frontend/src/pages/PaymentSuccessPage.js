import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
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
  const pendingOrder = searchParams.get('pending_order'); // Base64 encoded order data
  const demoMode = searchParams.get('demo');

  useEffect(() => {
    const verifyPayment = async () => {
      // Demo Mode - verify with pending_order data
      if (demoMode === 'true' && pendingOrder) {
        try {
          const response = await axios.get(`${API}/payment/verify`, {
            params: { pending_order: pendingOrder, demo: 'true' }
          });
          
          if (response.data.success) {
            setOrderData(response.data.order);
            clearCart();
          } else {
            setError(language === 'de' ? 'Zahlung nicht bestätigt' : 'Payment not confirmed');
          }
        } catch (err) {
          console.error('Demo payment verification error:', err);
          setError(language === 'de' ? 'Fehler bei der Zahlungsbestätigung' : 'Payment verification error');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Real Stripe Mode - verify with session_id
      if (!sessionId) {
        setError(language === 'de' ? 'Keine Session gefunden' : 'No session found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/payment/verify`, {
          params: { session_id: sessionId }
        });
        
        if (response.data.success || response.data.payment_status === 'paid') {
          setOrderData(response.data.order || response.data);
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
  }, [sessionId, pendingOrder, demoMode, clearCart, language]);

  if (loading) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-12 py-16 text-center">
          <Loader2 size={48} className="animate-spin text-[#8B2E2E] mx-auto mb-4" />
          <p className="text-[#5C5852]">
            {language === 'de' ? 'Zahlung wird überprüft...' : 'Verifying payment...'}
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-12 py-16 text-center">
          <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h1 className="font-serif text-3xl text-[#2D2A26]">
            {language === 'de' ? 'Fehler' : 'Error'}
          </h1>
          <p className="text-[#5C5852] mt-4">{error}</p>
          <Link to="/cart" className="btn-primary inline-flex items-center gap-2 mt-8">
            {language === 'de' ? 'Zurück zum Warenkorb' : 'Back to Cart'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="payment-success-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-20 h-20 bg-green-600 flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle size={40} className="text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">
              {language === 'de' ? 'Zahlung erfolgreich!' : 'Payment Successful!'}
            </h1>
            <p className="text-[#5C5852] mt-4 text-lg">
              {language === 'de' 
                ? 'Vielen Dank für Ihre Bestellung. Wir haben Ihre Zahlung erhalten und werden Ihre Bestellung schnellstmöglich bearbeiten.' 
                : 'Thank you for your order. We have received your payment and will process your order as soon as possible.'}
            </p>
          </motion.div>
        </div>

        {/* Tracking Number */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#E5E0D8] p-8 mt-8 text-center"
        >
          <p className="text-[#969088] text-xs uppercase tracking-wider">
            {language === 'de' ? 'Ihre Tracking-Nummer' : 'Your Tracking Number'}
          </p>
          <p className="text-3xl font-serif text-[#8B2E2E] mt-3 font-mono">
            {orderData?.tracking_number || '—'}
          </p>
          <p className="text-sm text-[#5C5852] mt-4">
            {language === 'de' 
              ? 'Speichern Sie diese Nummer um Ihre Bestellung zu verfolgen.' 
              : 'Save this number to track your order.'}
          </p>
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#F2EFE9] p-6 mt-6"
        >
          <div className="flex items-start gap-4">
            <Package size={24} className="text-[#8B2E2E] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-lg text-[#2D2A26]">
                {language === 'de' ? 'Wie geht es weiter?' : 'What happens next?'}
              </h3>
              <ul className="text-sm text-[#5C5852] mt-2 space-y-2">
                <li>• {language === 'de' ? 'Sie erhalten eine Bestätigungs-E-Mail' : 'You will receive a confirmation email'}</li>
                <li>• {language === 'de' ? 'Wir bereiten Ihre Bestellung vor' : 'We will prepare your order'}</li>
                <li>• {language === 'de' ? 'Sie werden benachrichtigt wenn es versandt wird' : 'You will be notified when it ships'}</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Link to="/tracking" className="btn-primary inline-flex items-center justify-center gap-2">
            {language === 'de' ? 'Bestellung verfolgen' : 'Track Order'}
            <ArrowRight size={18} />
          </Link>
          <Link to="/shop" className="btn-secondary inline-flex items-center justify-center gap-2">
            {language === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
