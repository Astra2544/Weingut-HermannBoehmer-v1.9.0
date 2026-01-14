import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentDemoPage() {
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const total = searchParams.get('total');

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Call the payment status endpoint to mark as paid
      const response = await axios.get(`${API}/payment/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        clearCart();
        toast.success(language === 'de' ? 'Zahlung erfolgreich!' : 'Payment successful!');
        navigate(`/payment/success?session_id=${sessionId}&order_id=${orderId}`);
      }
    } catch (error) {
      toast.error(language === 'de' ? 'Zahlung fehlgeschlagen' : 'Payment failed');
      setLoading(false);
    }
  };

  if (!orderId || !sessionId) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-[#5C5852]">{language === 'de' ? 'Ungültige Zahlungssitzung' : 'Invalid payment session'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="payment-demo-page">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* Demo Mode Warning */}
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              {language === 'de' ? 'Demo-Modus' : 'Demo Mode'}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {language === 'de' 
                ? 'Dies ist eine Testumgebung. Keine echten Zahlungen werden verarbeitet. Verwenden Sie die Testkarte 4242 4242 4242 4242.' 
                : 'This is a test environment. No real payments will be processed. Use test card 4242 4242 4242 4242.'}
            </p>
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white border border-[#E5E0D8] overflow-hidden">
          {/* Header */}
          <div className="bg-[#2D2A26] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Weingut Hermann Böhmer</p>
                  <p className="text-white/60 text-sm">Secure Checkout</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs">{language === 'de' ? 'Zu zahlen' : 'To pay'}</p>
                <p className="text-white font-serif text-2xl">€{parseFloat(total || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                {language === 'de' ? 'Karteninhaber' : 'Card Holder'}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                required
                className="input-elegant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                {language === 'de' ? 'Kartennummer' : 'Card Number'}
              </label>
              <div className="relative">
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                  required
                  className="input-elegant pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <div className="w-8 h-5 bg-[#1A1F71] rounded text-[8px] text-white flex items-center justify-center font-bold">VISA</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  {language === 'de' ? 'Gültig bis' : 'Expiry'}
                </label>
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                  className="input-elegant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                  CVC
                </label>
                <Input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  required
                  className="input-elegant"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B2E2E] text-white py-4 font-medium hover:bg-[#7a2828] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {language === 'de' ? 'Verarbeitung...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Lock size={18} />
                  {language === 'de' ? `€${parseFloat(total || 0).toFixed(2)} bezahlen` : `Pay €${parseFloat(total || 0).toFixed(2)}`}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="bg-[#F9F8F6] px-6 py-4 border-t border-[#E5E0D8]">
            <div className="flex items-center justify-center gap-2 text-xs text-[#969088]">
              <Lock size={12} />
              <span>{language === 'de' ? 'Sichere 256-bit SSL-Verschlüsselung' : 'Secure 256-bit SSL encryption'}</span>
            </div>
            <div className="flex justify-center gap-3 mt-3">
              <div className="px-2 py-1 bg-white border border-[#E5E0D8] text-[10px] text-[#5C5852]">Visa</div>
              <div className="px-2 py-1 bg-white border border-[#E5E0D8] text-[10px] text-[#5C5852]">Mastercard</div>
              <div className="px-2 py-1 bg-white border border-[#E5E0D8] text-[10px] text-[#5C5852]">AMEX</div>
            </div>
          </div>
        </div>

        {/* Test Card Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 text-sm">
          <p className="font-medium text-blue-800 flex items-center gap-2">
            <CheckCircle size={16} />
            {language === 'de' ? 'Testkarten für Demo:' : 'Test cards for demo:'}
          </p>
          <ul className="mt-2 text-blue-700 space-y-1 text-xs">
            <li>• <code className="bg-blue-100 px-1">4242 4242 4242 4242</code> - {language === 'de' ? 'Erfolgreiche Zahlung' : 'Successful payment'}</li>
            <li>• {language === 'de' ? 'Beliebiges Ablaufdatum in der Zukunft' : 'Any future expiry date'}</li>
            <li>• {language === 'de' ? 'Beliebige 3-stellige CVC' : 'Any 3-digit CVC'}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
