import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Lock, AlertTriangle, CheckCircle, Shield,
  Truck, Package, ArrowLeft, Loader2, MapPin, X
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TEST_CARDS = [
  { number: '4242424242424242', display: '4242 4242 4242 4242', brand: 'Visa', icon: 'VISA' },
  { number: '5555555555554444', display: '5555 5555 5555 4444', brand: 'Mastercard', icon: 'MC' },
  { number: '378282246310005', display: '3782 8224 6310 005', brand: 'American Express', icon: 'AMEX' },
];

export default function CheckoutDemoPage() {
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const fetchSession = async () => {
      if (!token) {
        setError(language === 'de' ? 'Ungültige Checkout-Session' : 'Invalid checkout session');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/checkout/session/${token}`);
        setSessionData(response.data);
        setCardName(response.data.customer_name || '');
      } catch (err) {
        if (err.response?.status === 404) {
          setError(language === 'de' ? 'Checkout-Session nicht gefunden oder bereits abgeschlossen' : 'Checkout session not found or already completed');
        } else if (err.response?.status === 410) {
          setError(language === 'de' ? 'Checkout-Session abgelaufen. Bitte starten Sie den Checkout erneut.' : 'Checkout session expired. Please restart checkout.');
        } else {
          setError(language === 'de' ? 'Fehler beim Laden der Session' : 'Error loading session');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token, language]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const selectTestCard = (card) => {
    setSelectedCard(card.number);
    setCardNumber(card.display);
    setExpiry('12/28');
    setCvc('123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cardNumber || !expiry || !cvc || !cardName) {
      toast.error(language === 'de' ? 'Bitte alle Felder ausfüllen' : 'Please fill all fields');
      return;
    }

    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await axios.post(`${API}/checkout/demo/complete`, null, {
        params: {
          token: token,
          card_number: cardNumber.replace(/\s/g, '')
        }
      });

      if (response.data.success) {
        clearCart();
        toast.success(language === 'de' ? 'Zahlung erfolgreich!' : 'Payment successful!');
        navigate(`/payment/success?demo=true&tracking=${response.data.order.tracking_number}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || (language === 'de' ? 'Zahlung fehlgeschlagen' : 'Payment failed');
      toast.error(errorMsg);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Loader2 size={48} className="animate-spin text-[#8B2E2E] mx-auto mb-4" />
          <p className="text-[#5C5852]">{language === 'de' ? 'Checkout wird geladen...' : 'Loading checkout...'}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] min-h-screen pt-28 md:pt-32">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-red-100 flex items-center justify-center mx-auto mb-6 rounded-full">
            <X size={40} className="text-red-600" />
          </div>
          <h1 className="font-serif text-2xl text-[#2D2A26] mb-4">{language === 'de' ? 'Checkout-Fehler' : 'Checkout Error'}</h1>
          <p className="text-[#5C5852] mb-8">{error}</p>
          <Link to="/cart" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            {language === 'de' ? 'Zurück zum Warenkorb' : 'Back to Cart'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] min-h-screen pt-28 md:pt-32 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-300 p-4 mb-6 flex items-start gap-3 rounded-lg"
        >
          <AlertTriangle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              {language === 'de' ? 'Testmodus aktiv' : 'Test Mode Active'}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              {language === 'de'
                ? 'Dies ist eine Testumgebung. Keine echten Zahlungen werden verarbeitet. Verwenden Sie eine der Testkarten unten.'
                : 'This is a test environment. No real payments will be processed. Use one of the test cards below.'}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-[#2D2A26] to-[#3D3A36] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur flex items-center justify-center rounded-lg">
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-lg">Hermann Böhmer</p>
                      <p className="text-white/60 text-sm">Wachauer Gold Checkout</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs uppercase tracking-wider">{language === 'de' ? 'Zu zahlen' : 'Total'}</p>
                    <p className="text-white font-serif text-3xl mt-1">{sessionData?.total_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-[#E5E0D8] bg-[#FAFAF9]">
                <p className="text-sm font-medium text-[#5C5852] mb-3">
                  {language === 'de' ? 'Testkarte auswählen:' : 'Select test card:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TEST_CARDS.map((card) => (
                    <button
                      key={card.number}
                      type="button"
                      onClick={() => selectTestCard(card)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        selectedCard === card.number
                          ? 'border-[#8B2E2E] bg-[#8B2E2E]/5'
                          : 'border-[#E5E0D8] hover:border-[#8B2E2E]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          card.icon === 'VISA' ? 'bg-[#1A1F71] text-white' :
                          card.icon === 'MC' ? 'bg-[#EB001B] text-white' :
                          'bg-[#006FCF] text-white'
                        }`}>
                          {card.icon}
                        </span>
                        {selectedCard === card.number && (
                          <CheckCircle size={16} className="text-[#8B2E2E]" />
                        )}
                      </div>
                      <p className="text-xs text-[#5C5852] font-mono">{card.display}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                    {language === 'de' ? 'Karteninhaber' : 'Card Holder'}
                  </label>
                  <Input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Max Mustermann"
                    required
                    className="input-elegant text-lg"
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
                      className="input-elegant pr-20 text-lg font-mono tracking-wider"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className="w-8 h-5 bg-[#1A1F71] rounded text-[8px] text-white flex items-center justify-center font-bold">VISA</div>
                      <div className="w-8 h-5 bg-[#EB001B] rounded text-[8px] text-white flex items-center justify-center font-bold">MC</div>
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
                      className="input-elegant text-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2D2A26] mb-2">CVC</label>
                    <Input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      required
                      className="input-elegant text-lg font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-[#8B2E2E] to-[#A33636] text-white py-4 text-lg font-medium hover:from-[#7a2828] hover:to-[#922F2F] transition-all rounded-lg disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 size={22} className="animate-spin" />
                      {language === 'de' ? 'Verarbeitung...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      {language === 'de' ? `€${sessionData?.total_amount?.toFixed(2)} bezahlen` : `Pay €${sessionData?.total_amount?.toFixed(2)}`}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Shield size={16} className="text-green-600" />
                  <span className="text-xs text-[#969088]">
                    {language === 'de' ? 'Sichere 256-bit SSL-Verschlüsselung' : 'Secure 256-bit SSL encryption'}
                  </span>
                </div>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-lg sticky top-28">
              <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAFAF9]">
                <h3 className="font-serif text-xl text-[#2D2A26]">
                  {language === 'de' ? 'Bestellübersicht' : 'Order Summary'}
                </h3>
              </div>

              <div className="p-6 space-y-4 max-h-64 overflow-y-auto">
                {sessionData?.items?.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <img
                      src={item.product_image_url}
                      alt={item.product_name_de}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2D2A26] text-sm truncate">
                        {language === 'de' ? item.product_name_de : item.product_name_en}
                      </p>
                      <p className="text-xs text-[#969088]">{item.quantity}x</p>
                    </div>
                    <p className="text-sm font-medium text-[#8B2E2E]">
                      {item.subtotal?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-[#E5E0D8] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5C5852]">{language === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
                  <span>{sessionData?.subtotal?.toFixed(2)}</span>
                </div>
                {sessionData?.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{language === 'de' ? 'Rabatt' : 'Discount'} ({sessionData?.coupon_code})</span>
                    <span>-€{sessionData?.discount_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Truck size={14} />
                    <span className="text-[#5C5852]">{language === 'de' ? 'Versand' : 'Shipping'}</span>
                  </div>
                  <span className={sessionData?.shipping_cost === 0 ? 'text-green-600' : ''}>
                    {sessionData?.shipping_cost === 0
                      ? (language === 'de' ? 'Gratis' : 'Free')
                      : `€${sessionData?.shipping_cost?.toFixed(2)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-lg font-serif pt-3 border-t border-[#E5E0D8]">
                  <span className="text-[#2D2A26]">{language === 'de' ? 'Gesamt' : 'Total'}</span>
                  <span className="text-[#8B2E2E]">{sessionData?.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#E5E0D8] bg-[#FAFAF9]">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#8B2E2E] flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-[#2D2A26]">{sessionData?.customer_name}</p>
                    <p className="text-[#5C5852]">{sessionData?.shipping_address}</p>
                    <p className="text-[#5C5852]">{sessionData?.shipping_postal} {sessionData?.shipping_city}</p>
                    <p className="text-[#5C5852]">{sessionData?.shipping_country}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <Link to="/cart" className="text-[#8B2E2E] hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            {language === 'de' ? 'Zurück zum Warenkorb' : 'Back to Cart'}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
