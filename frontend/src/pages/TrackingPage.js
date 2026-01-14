import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TrackingPage() {
  const { t, language } = useLanguage();
  const { isLoggedIn, isCustomer, token } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // For logged-in customers: their orders
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleSearchDirect = useCallback(async (number) => {
    if (!number.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.get(`${API}/tracking/${number.trim()}`);
      setResult(response.data);
    } catch (err) {
      setError(t('tracking.notFound'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load tracking number from URL parameter
  useEffect(() => {
    const numberFromUrl = searchParams.get('number');
    if (numberFromUrl) {
      setTrackingNumber(numberFromUrl);
      // Auto-search if we have a tracking number from URL
      handleSearchDirect(numberFromUrl);
    }
  }, [searchParams, handleSearchDirect]);

  // Load customer orders if logged in
  useEffect(() => {
    const loadCustomerOrders = async () => {
      if (isLoggedIn && isCustomer && token) {
        setLoadingOrders(true);
        try {
          const response = await axios.get(`${API}/customer/orders`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Filter orders that have tracking numbers and are not delivered
          const activeOrders = response.data.filter(order => 
            order.tracking_number && ['pending', 'paid', 'processing', 'shipped'].includes(order.status)
          );
          setCustomerOrders(activeOrders);
          
          // If there's exactly one active order and no URL param, auto-select it
          const numberFromUrl = searchParams.get('number');
          if (activeOrders.length === 1 && !numberFromUrl) {
            setSelectedOrder(activeOrders[0]);
            setTrackingNumber(activeOrders[0].tracking_number);
            handleSearchDirect(activeOrders[0].tracking_number);
          }
        } catch (err) {
          console.error('Failed to load customer orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      }
    };
    loadCustomerOrders();
  }, [isLoggedIn, isCustomer, token, searchParams, handleSearchDirect]);

  const handleSearch = async (e) => {
    e.preventDefault();
    handleSearchDirect(trackingNumber);
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number);
    handleSearchDirect(order.tracking_number);
  };

  const statusSteps = [
    { key: 'pending', icon: Clock, label: t('tracking.status.pending') },
    { key: 'processing', icon: Package, label: t('tracking.status.processing') },
    { key: 'shipped', icon: Truck, label: t('tracking.status.shipped') },
    { key: 'delivered', icon: CheckCircle, label: t('tracking.status.delivered') }
  ];

  const getStatusIndex = (status) => {
    // Map paid status to pending for display purposes
    const mappedStatus = status === 'paid' ? 'pending' : status;
    return statusSteps.findIndex(s => s.key === mappedStatus);
  };

  const getStatusText = (status) => {
    const texts = {
      pending: language === 'de' ? 'Ausstehend' : 'Pending',
      paid: language === 'de' ? 'Bezahlt' : 'Paid',
      processing: language === 'de' ? 'In Bearbeitung' : 'Processing',
      shipped: language === 'de' ? 'Versendet' : 'Shipped',
      delivered: language === 'de' ? 'Zugestellt' : 'Delivered'
    };
    return texts[status] || status;
  };

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="tracking-page">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-8 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="overline">{language === 'de' ? 'BESTELLUNG' : 'ORDER'}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2D2A26] mt-3 md:mt-4">
            {t('tracking.title')}
          </h1>
          <p className="text-[#5C5852] mt-3 md:mt-4 text-base md:text-lg">{t('tracking.subtitle')}</p>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 pb-16 md:pb-24">
        
        {/* Customer Orders - Show if logged in and has active orders */}
        {isLoggedIn && isCustomer && customerOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="font-serif text-xl text-[#2D2A26] mb-4">
              {language === 'de' ? 'Ihre aktiven Bestellungen' : 'Your Active Orders'}
            </h2>
            <div className="space-y-3">
              {customerOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  className={`w-full text-left p-4 border transition-all ${
                    selectedOrder?.id === order.id 
                      ? 'border-[#8B2E2E] bg-[#8B2E2E]/5' 
                      : 'border-[#E5E0D8] bg-white hover:border-[#8B2E2E]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#2D2A26]">
                        #{order.tracking_number}
                      </p>
                      <p className="text-sm text-[#5C5852] mt-1">
                        {new Date(order.created_at).toLocaleDateString(language === 'de' ? 'de-AT' : 'en-US', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {' • '}€{order.total_amount?.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium ${
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getStatusText(order.status)}
                      </span>
                      <ChevronRight size={18} className="text-[#969088]" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E0D8]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#F9F8F6] text-[#969088]">
                  {language === 'de' ? 'oder Sendungsnummer eingeben' : 'or enter tracking number'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading state for customer orders */}
        {isLoggedIn && isCustomer && loadingOrders && (
          <div className="text-center py-8 mb-8">
            <div className="w-8 h-8 border-2 border-[#8B2E2E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#5C5852] mt-3 text-sm">
              {language === 'de' ? 'Bestellungen werden geladen...' : 'Loading orders...'}
            </p>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4" data-testid="tracking-form">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={t('tracking.placeholder')}
              className="input-elegant pr-10"
              data-testid="tracking-input"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969088]" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap" data-testid="tracking-search-btn">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('tracking.search')}
          </button>
        </form>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 md:mt-8 p-4 md:p-6 border border-red-300 bg-red-50 text-center" data-testid="tracking-error">
            <p className="text-red-600 text-sm md:text-base">{error}</p>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 md:mt-12" 
              data-testid="tracking-result"
            >
              <div className="bg-white border border-[#E5E0D8] p-6 md:p-8">
                {/* Tracking Number */}
                <div className="text-center mb-8 md:mb-12">
                  <p className="text-[#969088] text-xs md:text-sm uppercase tracking-wider">Tracking</p>
                  <p className="text-2xl md:text-3xl font-serif text-[#8B2E2E] mt-2 font-mono">{result.tracking_number}</p>
                </div>

                {/* Status Timeline */}
                <div className="relative">
                  <div className="absolute top-5 md:top-7 left-0 right-0 h-0.5 bg-[#E5E0D8]">
                    <div
                      className="h-full bg-[#8B2E2E] transition-all duration-500"
                      style={{ width: `${(getStatusIndex(result.status) / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>

                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => {
                      const isActive = index <= getStatusIndex(result.status);
                      const isCurrent = step.key === result.status || (result.status === 'paid' && step.key === 'pending');
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center z-10 transition-all duration-300 ${
                            isActive 
                              ? 'bg-[#8B2E2E] text-white' 
                              : 'bg-[#F2EFE9] text-[#969088] border border-[#E5E0D8]'
                          } ${isCurrent ? 'ring-4 ring-[#8B2E2E]/20' : ''}`}>
                            <step.icon size={16} className="md:w-5 md:h-5" />
                          </div>
                          <p className={`mt-2 md:mt-4 text-[10px] md:text-xs uppercase tracking-wider ${
                            isActive ? 'text-[#2D2A26]' : 'text-[#969088]'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* External Tracking Link */}
                {result.carrier_tracking_number && result.carrier_tracking_url && (
                  <div className="mt-8 pt-6 border-t border-[#E5E0D8] text-center">
                    <p className="text-sm text-[#5C5852] mb-3">
                      {language === 'de' ? 'Externe Sendungsverfolgung:' : 'External tracking:'}
                    </p>
                    <a 
                      href={result.carrier_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#8B2E2E] hover:underline"
                    >
                      <Truck size={16} />
                      {result.carrier_tracking_number}
                      <ChevronRight size={14} />
                    </a>
                  </div>
                )}

                {/* Info */}
                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#E5E0D8] grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <p className="text-[#969088] text-xs uppercase tracking-wider">{language === 'de' ? 'Ziel' : 'Destination'}</p>
                    <p className="text-[#2D2A26] font-medium mt-1 text-sm md:text-base">{result.shipping_city}, {result.shipping_country}</p>
                  </div>
                  <div>
                    <p className="text-[#969088] text-xs uppercase tracking-wider">{language === 'de' ? 'Datum' : 'Date'}</p>
                    <p className="text-[#2D2A26] font-medium mt-1 text-sm md:text-base">
                      {new Date(result.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not logged in hint */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-[#F2EFE9] border border-[#E5E0D8] text-center"
          >
            <p className="text-sm text-[#5C5852]">
              {language === 'de' 
                ? 'Melden Sie sich an, um Ihre Bestellungen automatisch zu sehen.' 
                : 'Sign in to automatically see your orders.'}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-[#8B2E2E] text-sm font-medium mt-2 hover:underline">
              {language === 'de' ? 'Jetzt anmelden' : 'Sign in now'}
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        )}
      </section>
    </main>
  );
}
