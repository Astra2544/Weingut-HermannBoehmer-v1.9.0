import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft,
  Truck, Check, User, MapPin, CreditCard, AlertCircle, Lock, Eye, EyeOff, LogIn,
  Tag, X, Loader2, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CartPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const { user: customer, isLoggedIn, isCustomer, checkEmailExists, register } = useAuth();
  
  // Checkout Steps: 0 = Cart, 1 = Contact, 2 = Shipping, 3 = Payment
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [errors, setErrors] = useState({});
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Coupon/Discount Code State
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount_amount, discount_type, discount_value, description }
  const [couponError, setCouponError] = useState('');
  
  // Customer account creation in checkout
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Test mode indicator
  const [isTestMode, setIsTestMode] = useState(false);
  
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal: '',
    shipping_country: 'Österreich',
    // Billing address fields
    billing_same_as_shipping: true,
    billing_address: '',
    billing_city: '',
    billing_postal: '',
    billing_country: 'Österreich',
    // Options
    save_address: false,
    notes: ''
  });

  // Pre-fill form if logged in
  useEffect(() => {
    if (isLoggedIn && customer) {
      setForm(prev => ({
        ...prev,
        customer_name: `${customer.first_name} ${customer.last_name}`,
        customer_email: customer.email,
        customer_phone: customer.phone || '',
        shipping_address: customer.default_address || '',
        shipping_city: customer.default_city || '',
        shipping_postal: customer.default_postal || '',
        shipping_country: customer.default_country || 'Österreich',
        // Billing
        billing_same_as_shipping: customer.billing_same_as_shipping !== false,
        billing_address: customer.billing_address || '',
        billing_city: customer.billing_city || '',
        billing_postal: customer.billing_postal || '',
        billing_country: customer.billing_country || 'Österreich',
        // Pre-check save if no address saved
        save_address: !customer.default_address
      }));
    }
  }, [isLoggedIn, customer]);

  // Checkout steps configuration
  const steps = [
    { id: 0, name: language === 'de' ? 'Warenkorb' : 'Cart', icon: ShoppingBag },
    { id: 1, name: language === 'de' ? 'Kontakt' : 'Contact', icon: User },
    { id: 2, name: language === 'de' ? 'Versand' : 'Shipping', icon: MapPin },
    { id: 3, name: language === 'de' ? 'Zahlung' : 'Payment', icon: CreditCard },
  ];

  // Fetch shipping rates and checkout status on mount
  useEffect(() => {
    const fetchShippingRates = async () => {
      try {
        const res = await axios.get(`${API}/shipping-rates`);
        setShippingRates(res.data);
      } catch (error) {
        console.error('Error fetching shipping rates:', error);
      }
    };

    const checkTestMode = async () => {
      try {
        const res = await axios.get(`${API}/checkout/status`);
        setIsTestMode(res.data.demo_mode);
      } catch (error) {
        console.error('Error checking checkout status:', error);
      }
    };

    fetchShippingRates();
    checkTestMode();
  }, []);

  // Calculate shipping based on selected country
  const shippingInfo = useMemo(() => {
    const rate = shippingRates.find(r => r.country === form.shipping_country);
    if (!rate) {
      return { cost: 9.90, freeThreshold: 0, isFree: false };
    }
    const isFree = rate.free_shipping_threshold > 0 && subtotal >= rate.free_shipping_threshold;
    return {
      cost: isFree ? 0 : rate.rate,
      freeThreshold: rate.free_shipping_threshold,
      isFree
    };
  }, [shippingRates, form.shipping_country, subtotal]);

  // Calculate discount amount from applied coupon
  const discountAmount = appliedCoupon?.discount_amount || 0;
  
  // Total with discount
  const total = subtotal - discountAmount + shippingInfo.cost;

  // Validate and apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(language === 'de' ? 'Bitte geben Sie einen Gutscheincode ein' : 'Please enter a coupon code');
      return;
    }
    
    setCouponLoading(true);
    setCouponError('');
    setAppliedCoupon(null); // Reset vorher
    
    try {
      const response = await axios.post(`${API}/coupons/validate`, {
        code: couponCode.trim(),
        subtotal: subtotal
      });
      
      // Nur setzen wenn wirklich valid und discount_amount vorhanden
      if (response.data && response.data.valid && response.data.discount_amount > 0) {
        setAppliedCoupon({
          code: response.data.code,
          discount_type: response.data.discount_type,
          discount_value: response.data.discount_value || 0,
          discount_amount: response.data.discount_amount || 0,
          description: response.data.description || ''
        });
        setCouponCode('');
        toast.success(language === 'de' 
          ? `Gutschein "${response.data.code}" angewendet! Sie sparen €${(response.data.discount_amount || 0).toFixed(2)}` 
          : `Coupon "${response.data.code}" applied! You save €${(response.data.discount_amount || 0).toFixed(2)}`
        );
      } else {
        setCouponError(language === 'de' ? 'Ungültiger Gutscheincode' : 'Invalid coupon code');
        toast.error(language === 'de' ? 'Ungültiger Gutscheincode' : 'Invalid coupon code');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || (language === 'de' ? 'Ungültiger Gutscheincode' : 'Invalid coupon code');
      setCouponError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCouponLoading(false);
    }
  };
  
  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    toast.info(language === 'de' ? 'Gutschein entfernt' : 'Coupon removed');
  };

  // Check if cart contains 18+ products
  const has18PlusProducts = useMemo(() => {
    return items.some(item => item.product?.is_18_plus === true || item.product?.alcohol_content > 0);
  }, [items]);

  // Get available countries from shipping rates
  const availableCountries = useMemo(() => {
    if (shippingRates.length === 0) {
      return ['Österreich', 'Deutschland', 'Schweiz', 'Italien', 'Frankreich', 'Niederlande', 'Belgien'];
    }
    return shippingRates.map(r => r.country);
  }, [shippingRates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    // Reset email exists check when email changes
    if (name === 'customer_email') {
      setEmailExists(false);
    }
  };

  // Check if email exists when user wants to create account
  const handleEmailBlur = async () => {
    if (createAccount && form.customer_email && form.customer_email.includes('@') && !isLoggedIn) {
      setCheckingEmail(true);
      try {
        const exists = await checkEmailExists(form.customer_email);
        setEmailExists(exists);
        if (exists) {
          setErrors(prev => ({
            ...prev,
            customer_email: language === 'de' 
              ? 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.' 
              : 'This email is already registered. Please sign in.'
          }));
        }
      } catch (err) {
        console.error('Email check failed:', err);
      } finally {
        setCheckingEmail(false);
      }
    }
  };

  // Validation functions
  const validateContact = () => {
    const newErrors = {};
    
    if (!form.customer_name.trim()) {
      newErrors.customer_name = language === 'de' ? 'Name ist erforderlich' : 'Name is required';
    }
    
    if (!form.customer_email.trim()) {
      newErrors.customer_email = language === 'de' ? 'E-Mail ist erforderlich' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      newErrors.customer_email = language === 'de' ? 'Ungültige E-Mail-Adresse' : 'Invalid email address';
    } else if (createAccount && emailExists) {
      newErrors.customer_email = language === 'de' 
        ? 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.' 
        : 'This email is already registered. Please sign in.';
    }
    
    if (!form.customer_phone.trim()) {
      newErrors.customer_phone = language === 'de' ? 'Telefonnummer ist erforderlich' : 'Phone is required';
    } else if (form.customer_phone.replace(/\D/g, '').length < 6) {
      newErrors.customer_phone = language === 'de' ? 'Ungültige Telefonnummer' : 'Invalid phone number';
    }

    // Validate password if creating account
    if (createAccount && !isLoggedIn) {
      if (!password) {
        newErrors.password = language === 'de' ? 'Passwort ist erforderlich' : 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = language === 'de' ? 'Passwort muss mindestens 6 Zeichen haben' : 'Password must be at least 6 characters';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateShipping = () => {
    const newErrors = {};
    
    if (!form.shipping_address.trim()) {
      newErrors.shipping_address = language === 'de' ? 'Adresse ist erforderlich' : 'Address is required';
    }
    
    if (!form.shipping_city.trim()) {
      newErrors.shipping_city = language === 'de' ? 'Stadt ist erforderlich' : 'City is required';
    }
    
    if (!form.shipping_postal.trim()) {
      newErrors.shipping_postal = language === 'de' ? 'PLZ ist erforderlich' : 'Postal code is required';
    } else if (!/^\d{4,5}$/.test(form.shipping_postal)) {
      newErrors.shipping_postal = language === 'de' ? 'Ungültige PLZ' : 'Invalid postal code';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors = {};
    
    // Only require age verification if cart has 18+ products
    if (has18PlusProducts && !ageVerified) {
      newErrors.age = language === 'de' ? 'Altersbestätigung erforderlich' : 'Age verification required';
    }
    
    if (!termsAccepted) {
      newErrors.terms = language === 'de' ? 'Sie müssen die AGB akzeptieren' : 'You must accept the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1 && validateContact()) {
      // If creating account, register first
      if (createAccount && !isLoggedIn) {
        try {
          setLoading(true);
          const nameParts = form.customer_name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          await register({
            email: form.customer_email,
            password: password,
            first_name: firstName,
            last_name: lastName,
            phone: form.customer_phone
          });
          
          toast.success(language === 'de' ? 'Konto erfolgreich erstellt!' : 'Account created successfully!');
        } catch (err) {
          const errorMsg = err.response?.data?.detail || (language === 'de' ? 'Fehler bei der Registrierung' : 'Registration failed');
          toast.error(errorMsg);
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }
      }
      setCurrentStep(2);
    } else if (currentStep === 2 && validateShipping()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validatePayment()) {
      handleSubmitOrder();
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmitOrder = async () => {
    setLoading(true);

    try {
      // If user wants to save address and is logged in
      if (isLoggedIn && form.save_address && customer?.id) {
        try {
          const { updateProfile } = await import('../context/AuthContext');
          await axios.put(`${API}/customer/profile`, {
            default_address: form.shipping_address,
            default_city: form.shipping_city,
            default_postal: form.shipping_postal,
            default_country: form.shipping_country,
            billing_same_as_shipping: form.billing_same_as_shipping,
            billing_address: form.billing_same_as_shipping ? '' : form.billing_address,
            billing_city: form.billing_same_as_shipping ? '' : form.billing_city,
            billing_postal: form.billing_same_as_shipping ? '' : form.billing_postal,
            billing_country: form.billing_same_as_shipping ? '' : form.billing_country,
            phone: form.customer_phone
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
        } catch (err) {
          console.error('Error saving address:', err);
          // Continue with order even if address save fails
        }
      }

      const orderData = {
        ...form,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        origin_url: window.location.origin,
        customer_id: customer?.id || null,  // Link to customer if logged in
        coupon_code: appliedCoupon?.code || null  // Include coupon code if applied
      };

      // Create order and get Stripe checkout URL
      const response = await axios.post(`${API}/orders/create-checkout`, orderData);
      
      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMsg = error.response?.data?.detail || '';
      
      // Handle Stripe key error gracefully
      if (errorMsg.includes('API Key') || errorMsg.includes('Invalid')) {
        toast.error(
          language === 'de' 
            ? 'Zahlungssystem wird konfiguriert. Bitte kontaktieren Sie uns.' 
            : 'Payment system is being configured. Please contact us.'
        );
      } else {
        toast.error(
          errorMsg || (language === 'de' ? 'Fehler beim Erstellen der Bestellung' : 'Error creating order')
        );
      }
      setLoading(false);
    }
  };

  // Empty cart view
  if (items.length === 0) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="empty-cart-page">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 border border-[#E5E0D8] flex items-center justify-center mx-auto mb-6 md:mb-8">
            <ShoppingBag size={28} className="text-[#969088] md:w-8 md:h-8" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">{t('cart.empty')}</h1>
          <p className="text-[#5C5852] mt-4">
            {language === 'de' ? 'Ihr Warenkorb ist leer.' : 'Your cart is empty.'}
          </p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2 mt-8" data-testid="continue-shopping">
            {t('cart.continue')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-12">
        
        {/* Progress Steps */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div 
                  className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full transition-all ${
                    currentStep > step.id 
                      ? 'bg-green-600 text-white' 
                      : currentStep === step.id 
                        ? 'bg-[#8B2E2E] text-white' 
                        : 'bg-[#E5E0D8] text-[#969088]'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check size={20} />
                  ) : (
                    <step.icon size={18} />
                  )}
                </div>
                
                {/* Step Label (hidden on mobile) */}
                <span className={`hidden md:block ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-[#2D2A26]' : 'text-[#969088]'
                }`}>
                  {step.name}
                </span>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`w-8 md:w-16 h-0.5 mx-2 md:mx-4 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-[#E5E0D8]'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile Step Name */}
          <p className="text-center text-sm font-medium text-[#2D2A26] mt-4 md:hidden">
            {steps[currentStep]?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              
              {/* Step 0: Cart Items */}
              {currentStep === 0 && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <h2 className="font-serif text-2xl text-[#2D2A26] mb-6">
                    {t('cart.title')} ({items.length})
                  </h2>
                  
                  {items.map(item => (
                    <div key={item.product.id} className="bg-white border border-[#E5E0D8] p-4 md:p-6">
                      <div className="flex gap-4">
                        <Link to={`/product/${item.product.slug}`}>
                          <img 
                            src={item.product.image_url} 
                            alt={language === 'de' ? item.product.name_de : item.product.name_en}
                            className="w-20 h-20 md:w-24 md:h-24 object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.product.slug}`}>
                            <h3 className="font-serif text-lg text-[#2D2A26] hover:text-[#8B2E2E] transition-colors truncate">
                              {language === 'de' ? item.product.name_de : item.product.name_en}
                            </h3>
                          </Link>
                          <p className="text-[#8B2E2E] font-serif mt-1">€{item.product.price.toFixed(2)}</p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-[#E5E0D8]">
                              <button 
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-2 hover:bg-[#F2EFE9]"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="px-4 text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-2 hover:bg-[#F2EFE9]"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeItem(item.product.id)}
                              className="p-2 text-[#969088] hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="font-serif text-lg text-[#8B2E2E]">
                            €{(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Coupon/Discount Code Section */}
                  <div className="bg-white border border-[#E5E0D8] p-4 md:p-6 mt-4" data-testid="coupon-section">
                    <div className="flex items-center gap-2 mb-4">
                      <Tag size={18} className="text-[#8B2E2E]" />
                      <h3 className="font-medium text-[#2D2A26]">
                        {language === 'de' ? 'Gutscheincode' : 'Discount Code'}
                      </h3>
                    </div>
                    
                    {appliedCoupon ? (
                      // Applied coupon display
                      <div className="bg-green-50 border border-green-200 p-4 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Check size={20} className="text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                              <p className="text-sm text-green-600">
                                {appliedCoupon.discount_type === 'percent' 
                                  ? `${appliedCoupon.discount_value || 0}% ${language === 'de' ? 'Rabatt' : 'off'}`
                                  : `€${(appliedCoupon.discount_value || 0).toFixed(2)} ${language === 'de' ? 'Rabatt' : 'off'}`
                                }
                                {appliedCoupon.description && ` - ${appliedCoupon.description}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-serif text-lg text-green-700">
                              -€{(appliedCoupon.discount_amount || 0).toFixed(2)}
                            </span>
                            <button 
                              onClick={handleRemoveCoupon}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title={language === 'de' ? 'Gutschein entfernen' : 'Remove coupon'}
                              data-testid="remove-coupon-btn"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Coupon input form
                      <div>
                        <div className="flex gap-2">
                          <Input 
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError('');
                            }}
                            placeholder={language === 'de' ? 'Gutscheincode eingeben' : 'Enter coupon code'}
                            className={`flex-1 input-elegant uppercase ${couponError ? 'border-red-500' : ''}`}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            data-testid="coupon-input"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-5 py-2 bg-[#8B2E2E] text-white font-medium hover:bg-[#722525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            data-testid="apply-coupon-btn"
                          >
                            {couponLoading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              language === 'de' ? 'Anwenden' : 'Apply'
                            )}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <AlertCircle size={14} /> {couponError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Contact Details */}
              {currentStep === 1 && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white border border-[#E5E0D8] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                    <h2 className="font-serif text-2xl text-[#2D2A26]">
                      {language === 'de' ? 'Kontaktdaten' : 'Contact Details'}
                    </h2>
                  </div>

                  {/* Already have account - Login prompt */}
                  {!isLoggedIn && (
                    <div className="bg-[#F2EFE9] border border-[#E5E0D8] p-4 mb-6">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <LogIn size={18} className="text-[#8B2E2E]" />
                          <span className="text-[#2D2A26]">
                            {language === 'de' ? 'Schon ein Kundenkonto?' : 'Already have an account?'}
                          </span>
                        </div>
                        <Link
                          to="/login"
                          state={{ from: '/cart' }}
                          className="text-[#8B2E2E] font-medium hover:underline"
                        >
                          {language === 'de' ? 'Jetzt anmelden' : 'Sign in now'}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Logged in message */}
                  {isLoggedIn && isCustomer && customer && (
                    <div className="bg-green-50 border border-green-200 p-4 mb-6">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check size={18} />
                        <span>
                          {language === 'de' 
                            ? `Angemeldet als ${customer.first_name} ${customer.last_name}` 
                            : `Logged in as ${customer.first_name} ${customer.last_name}`}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-[#5C5852] mb-6">
                    {language === 'de' 
                      ? 'Bitte geben Sie Ihre Kontaktdaten ein. Alle Felder sind Pflichtfelder.' 
                      : 'Please enter your contact details. All fields are required.'}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Vollständiger Name' : 'Full Name'} *
                      </label>
                      <Input 
                        name="customer_name" 
                        value={form.customer_name} 
                        onChange={handleInputChange}
                        placeholder={language === 'de' ? 'Max Mustermann' : 'John Doe'}
                        className={`input-elegant ${errors.customer_name ? 'border-red-500' : ''}`}
                      />
                      {errors.customer_name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.customer_name}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        E-Mail *
                      </label>
                      <Input 
                        type="email"
                        name="customer_email" 
                        value={form.customer_email} 
                        onChange={handleInputChange}
                        onBlur={handleEmailBlur}
                        placeholder="ihre@email.at"
                        disabled={isLoggedIn}
                        className={`input-elegant ${errors.customer_email ? 'border-red-500' : ''} ${isLoggedIn ? 'bg-gray-50' : ''}`}
                      />
                      {errors.customer_email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.customer_email}
                          {emailExists && (
                            <Link to="/login" state={{ from: '/cart' }} className="underline ml-1">
                              {language === 'de' ? 'Zur Anmeldung' : 'Sign in'}
                            </Link>
                          )}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Telefonnummer' : 'Phone Number'} *
                      </label>
                      <Input 
                        type="tel"
                        name="customer_phone" 
                        value={form.customer_phone} 
                        onChange={handleInputChange}
                        placeholder="+43 123 456 7890"
                        className={`input-elegant ${errors.customer_phone ? 'border-red-500' : ''}`}
                      />
                      {errors.customer_phone && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.customer_phone}
                        </p>
                      )}
                      <p className="text-xs text-[#969088] mt-1">
                        {language === 'de' 
                          ? 'Für Rückfragen zur Bestellung' 
                          : 'For questions about your order'}
                      </p>
                    </div>

                    {/* Create Account Switch */}
                    {!isLoggedIn && (
                      <div className="pt-4 border-t border-[#E5E0D8]">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div 
                            className={`relative w-12 h-6 rounded-full transition-colors ${createAccount ? 'bg-[#8B2E2E]' : 'bg-[#E5E0D8]'}`}
                            onClick={() => setCreateAccount(!createAccount)}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${createAccount ? 'translate-x-7' : 'translate-x-1'}`} />
                          </div>
                          <span className="text-[#2D2A26]">
                            {language === 'de' ? 'Kundenkonto erstellen' : 'Create customer account'}
                          </span>
                        </label>
                        <p className="text-xs text-[#969088] mt-2 ml-15">
                          {language === 'de' 
                            ? 'Speichern Sie Ihre Daten für zukünftige Bestellungen und verfolgen Sie Ihre Bestellungen.' 
                            : 'Save your data for future orders and track your orders.'}
                        </p>

                        {/* Password fields when creating account */}
                        {createAccount && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-4"
                          >
                            <div>
                              <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                                {language === 'de' ? 'Passwort' : 'Password'} *
                              </label>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className={`input-elegant pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969088] hover:text-[#5C5852]"
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                              {errors.password && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} /> {errors.password}
                                </p>
                              )}
                              <p className="text-xs text-[#969088] mt-1">
                                {language === 'de' ? 'Mindestens 6 Zeichen' : 'At least 6 characters'}
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                                {language === 'de' ? 'Passwort bestätigen' : 'Confirm Password'} *
                              </label>
                              <Input 
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`input-elegant ${errors.confirmPassword ? 'border-red-500' : ''}`}
                              />
                              {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} /> {errors.confirmPassword}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white border border-[#E5E0D8] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <h2 className="font-serif text-2xl text-[#2D2A26]">
                      {language === 'de' ? 'Lieferadresse' : 'Shipping Address'}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Straße & Hausnummer' : 'Street & Number'} *
                      </label>
                      <Input 
                        name="shipping_address" 
                        value={form.shipping_address} 
                        onChange={handleInputChange}
                        placeholder={language === 'de' ? 'Musterstraße 123' : '123 Example Street'}
                        className={`input-elegant ${errors.shipping_address ? 'border-red-500' : ''}`}
                      />
                      {errors.shipping_address && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} /> {errors.shipping_address}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                          {language === 'de' ? 'PLZ' : 'Postal Code'} *
                        </label>
                        <Input 
                          name="shipping_postal" 
                          value={form.shipping_postal} 
                          onChange={handleInputChange}
                          placeholder="1010"
                          className={`input-elegant ${errors.shipping_postal ? 'border-red-500' : ''}`}
                        />
                        {errors.shipping_postal && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> {errors.shipping_postal}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                          {language === 'de' ? 'Stadt' : 'City'} *
                        </label>
                        <Input 
                          name="shipping_city" 
                          value={form.shipping_city} 
                          onChange={handleInputChange}
                          placeholder={language === 'de' ? 'Wien' : 'Vienna'}
                          className={`input-elegant ${errors.shipping_city ? 'border-red-500' : ''}`}
                        />
                        {errors.shipping_city && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> {errors.shipping_city}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Land' : 'Country'} *
                      </label>
                      <select 
                        name="shipping_country" 
                        value={form.shipping_country} 
                        onChange={handleInputChange}
                        className="input-elegant w-full"
                      >
                        {availableCountries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    {/* Save Address Option */}
                    {isLoggedIn && (
                      <div className="pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={form.save_address}
                            onChange={(e) => setForm(prev => ({ ...prev, save_address: e.target.checked }))}
                            className="w-4 h-4 accent-[#8B2E2E]"
                          />
                          <span className="text-sm text-[#5C5852]">
                            {language === 'de' 
                              ? 'Als Standardadresse speichern' 
                              : 'Save as default address'}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Billing Address Section */}
                  <div className="bg-white border border-[#E5E0D8] p-6 md:p-8 space-y-6">
                    <h2 className="font-serif text-xl text-[#2D2A26]">
                      {language === 'de' ? 'Rechnungsadresse' : 'Billing Address'}
                    </h2>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={form.billing_same_as_shipping}
                        onChange={(e) => setForm(prev => ({ ...prev, billing_same_as_shipping: e.target.checked }))}
                        className="w-5 h-5 accent-[#8B2E2E]"
                      />
                      <span className="text-[#2D2A26]">
                        {language === 'de' 
                          ? 'Rechnungsadresse ist gleich wie Lieferadresse' 
                          : 'Billing address same as shipping address'}
                      </span>
                    </label>

                    {!form.billing_same_as_shipping && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-[#E5E0D8]"
                      >
                        <div>
                          <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                            {language === 'de' ? 'Adresse' : 'Address'} *
                          </label>
                          <Input 
                            name="billing_address" 
                            value={form.billing_address} 
                            onChange={handleInputChange}
                            placeholder={language === 'de' ? 'Straße und Hausnummer' : 'Street and number'}
                            className="input-elegant"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                              {language === 'de' ? 'PLZ' : 'Postal Code'} *
                            </label>
                            <Input 
                              name="billing_postal" 
                              value={form.billing_postal} 
                              onChange={handleInputChange}
                              placeholder="1010"
                              className="input-elegant"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                              {language === 'de' ? 'Stadt' : 'City'} *
                            </label>
                            <Input 
                              name="billing_city" 
                              value={form.billing_city} 
                              onChange={handleInputChange}
                              placeholder={language === 'de' ? 'Wien' : 'Vienna'}
                              className="input-elegant"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                            {language === 'de' ? 'Land' : 'Country'} *
                          </label>
                          <select 
                            name="billing_country" 
                            value={form.billing_country} 
                            onChange={handleInputChange}
                            className="input-elegant w-full"
                          >
                            {availableCountries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>
                    
                  <div className="bg-white border border-[#E5E0D8] p-6 md:p-8">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Anmerkungen (optional)' : 'Notes (optional)'}
                      </label>
                      <textarea 
                        name="notes" 
                        value={form.notes} 
                        onChange={handleInputChange}
                        rows={3}
                        placeholder={language === 'de' ? 'z.B. Lieferhinweise' : 'e.g. Delivery instructions'}
                        className="input-elegant w-full resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-white border border-[#E5E0D8] p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
                        <CreditCard size={20} className="text-white" />
                      </div>
                      <h2 className="font-serif text-2xl text-[#2D2A26]">
                        {language === 'de' ? 'Zahlungsinformationen' : 'Payment Information'}
                      </h2>
                    </div>
                    
                    {/* Order Summary */}
                    <div className="bg-[#F9F8F6] p-4 mb-6">
                      <h3 className="font-medium text-[#2D2A26] mb-3">
                        {language === 'de' ? 'Bestellübersicht' : 'Order Summary'}
                      </h3>
                      <div className="space-y-2 text-sm">
                        {items.map(item => (
                          <div key={item.product.id} className="flex justify-between">
                            <span className="text-[#5C5852]">
                              {item.quantity}× {language === 'de' ? item.product.name_de : item.product.name_en}
                            </span>
                            <span>€{(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-[#E5E0D8]">
                          <span className="text-[#5C5852]">{language === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
                          <span>€{subtotal.toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                              <Tag size={12} />
                              {appliedCoupon.code}
                            </span>
                            <span>-€{(appliedCoupon.discount_amount || 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[#5C5852]">{language === 'de' ? 'Versand' : 'Shipping'}</span>
                          <span className={shippingInfo.isFree ? 'text-green-600' : ''}>
                            {shippingInfo.cost === 0 ? (language === 'de' ? 'Gratis' : 'Free') : `€${shippingInfo.cost.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between font-serif text-lg pt-2 border-t border-[#E5E0D8]">
                          <span>{language === 'de' ? 'Gesamt' : 'Total'}</span>
                          <span className="text-[#8B2E2E]">€{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Shipping To */}
                    <div className="bg-[#F9F8F6] p-4 mb-6">
                      <h3 className="font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Lieferung an' : 'Shipping to'}
                      </h3>
                      <p className="text-sm text-[#5C5852]">
                        {form.customer_name}<br />
                        {form.shipping_address}<br />
                        {form.shipping_postal} {form.shipping_city}<br />
                        {form.shipping_country}
                      </p>
                    </div>
                    
                    {/* Test Mode Banner */}
                    {isTestMode && (
                      <div className="bg-amber-50 border border-amber-300 p-4 mb-6 rounded-lg flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-800">
                            {language === 'de' ? 'Testmodus aktiv' : 'Test Mode Active'}
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            {language === 'de'
                              ? 'Sie können den Checkout mit einer Testkarte abschließen. Keine echte Zahlung wird verarbeitet.'
                              : 'You can complete checkout using a test card. No real payment will be processed.'}
                          </p>
                          <p className="text-xs text-amber-600 mt-2 font-mono">
                            {language === 'de' ? 'Testkarte:' : 'Test card:'} 4242 4242 4242 4242
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Info */}
                    <div className="border border-[#E5E0D8] p-4 mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Lock size={18} className="text-green-600" />
                        <span className="font-medium text-[#2D2A26]">
                          {language === 'de' ? 'Sichere Zahlung mit Stripe' : 'Secure Payment with Stripe'}
                        </span>
                      </div>
                      <p className="text-sm text-[#5C5852]">
                        {language === 'de'
                          ? (isTestMode
                              ? 'Sie werden zu einer sicheren Demo-Zahlungsseite weitergeleitet.'
                              : 'Sie werden zur sicheren Stripe-Zahlungsseite weitergeleitet. Wir akzeptieren Kreditkarten, Debitkarten und weitere Zahlungsmethoden.')
                          : (isTestMode
                              ? 'You will be redirected to a secure demo payment page.'
                              : 'You will be redirected to the secure Stripe payment page. We accept credit cards, debit cards and other payment methods.')}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <div className="px-2 py-1 bg-[#F2EFE9] text-xs text-[#5C5852]">Visa</div>
                        <div className="px-2 py-1 bg-[#F2EFE9] text-xs text-[#5C5852]">Mastercard</div>
                        <div className="px-2 py-1 bg-[#F2EFE9] text-xs text-[#5C5852]">SEPA</div>
                        <div className="px-2 py-1 bg-[#F2EFE9] text-xs text-[#5C5852]">Apple Pay</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Age Verification & Terms */}
                  <div className="bg-white border border-[#E5E0D8] p-6">
                    <div className="space-y-4">
                      {/* Age Verification - Only show if cart has 18+ products */}
                      {has18PlusProducts && (
                        <div className={`p-4 border ${errors.age ? 'border-red-500 bg-red-50' : 'border-[#8B2E2E]/20 bg-[#8B2E2E]/5'}`}>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={ageVerified}
                              onChange={(e) => {
                                setAgeVerified(e.target.checked);
                                if (errors.age) setErrors(prev => ({ ...prev, age: null }));
                              }}
                              className="mt-1 w-5 h-5 accent-[#8B2E2E]"
                            />
                            <span className="text-sm text-[#5C5852]">
                              <span className="font-medium text-[#8B2E2E]">
                                {language === 'de' ? 'Altersbestätigung (Alkoholische Produkte): ' : 'Age Verification (Alcoholic Products): '}
                              </span>
                              {language === 'de' 
                                ? 'Ich bestätige, dass ich mindestens 18 Jahre alt bin. Der Verkauf von Alkohol an Minderjährige ist gesetzlich verboten.' 
                                : 'I confirm that I am at least 18 years old. The sale of alcohol to minors is prohibited by law.'}
                            </span>
                          </label>
                          {errors.age && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                              <AlertCircle size={14} /> {errors.age}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Terms & Conditions */}
                      <div className={`p-4 border ${errors.terms ? 'border-red-500 bg-red-50' : 'border-[#E5E0D8]'}`}>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={termsAccepted}
                            onChange={(e) => {
                              setTermsAccepted(e.target.checked);
                              if (errors.terms) setErrors(prev => ({ ...prev, terms: null }));
                            }}
                            className="mt-1 w-5 h-5 accent-[#8B2E2E]"
                          />
                          <span className="text-sm text-[#5C5852]">
                            {language === 'de' ? (
                              <>Ich akzeptiere die <Link to="/terms" target="_blank" className="text-[#8B2E2E] underline">AGB</Link> und <Link to="/privacy" target="_blank" className="text-[#8B2E2E] underline">Datenschutzerklärung</Link>.</>
                            ) : (
                              <>I accept the <Link to="/terms" target="_blank" className="text-[#8B2E2E] underline">Terms & Conditions</Link> and <Link to="/privacy" target="_blank" className="text-[#8B2E2E] underline">Privacy Policy</Link>.</>
                            )}
                          </span>
                        </label>
                        {errors.terms && (
                          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <AlertCircle size={14} /> {errors.terms}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 0 ? (
                <button 
                  onClick={goToPrevStep}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  {language === 'de' ? 'Zurück' : 'Back'}
                </button>
              ) : (
                <Link to="/shop" className="btn-secondary flex items-center gap-2">
                  <ArrowLeft size={18} />
                  {t('cart.continue')}
                </Link>
              )}
              
              <button 
                onClick={goToNextStep}
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {language === 'de' ? 'Bitte warten...' : 'Please wait...'}
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Lock size={18} />
                    {language === 'de' ? 'Jetzt bezahlen' : 'Pay Now'}
                  </>
                ) : (
                  <>
                    {language === 'de' ? 'Weiter' : 'Continue'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E5E0D8] p-5 md:p-6 sticky top-28">
              <h3 className="font-serif text-xl text-[#2D2A26] mb-6">
                {language === 'de' ? 'Zusammenfassung' : 'Summary'}
              </h3>

              {/* Items Preview */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <img 
                      src={item.product.image_url} 
                      alt=""
                      className="w-12 h-12 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2D2A26] truncate">
                        {language === 'de' ? item.product.name_de : item.product.name_en}
                      </p>
                      <p className="text-xs text-[#969088]">{item.quantity}×</p>
                    </div>
                    <p className="text-sm text-[#8B2E2E]">€{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E5E0D8] pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5C5852]">{t('cart.subtotal')}</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                
                {/* Applied Coupon Discount */}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm" data-testid="sidebar-coupon-discount">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-green-600" />
                      <span className="text-green-600">{appliedCoupon.code}</span>
                    </div>
                    <span className="text-green-600 font-medium">-€{(appliedCoupon.discount_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Truck size={14} />
                    <span className="text-[#5C5852]">{t('cart.shipping')}</span>
                  </div>
                  <span className={shippingInfo.isFree ? 'text-green-600 font-medium' : ''}>
                    {shippingInfo.cost === 0 ? (language === 'de' ? 'Gratis' : 'Free') : `€${shippingInfo.cost.toFixed(2)}`}
                  </span>
                </div>
                
                {/* Free shipping progress */}
                {shippingInfo.freeThreshold > 0 && !shippingInfo.isFree && (
                  <div className="bg-[#F9F8F6] p-3 text-xs">
                    <p className="text-[#5C5852]">
                      {language === 'de' 
                        ? `Noch €${(shippingInfo.freeThreshold - subtotal).toFixed(2)} bis Gratis-Versand`
                        : `€${(shippingInfo.freeThreshold - subtotal).toFixed(2)} more for free shipping`
                      }
                    </p>
                    <div className="mt-2 h-1.5 bg-[#E5E0D8] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#8B2E2E] rounded-full transition-all"
                        style={{ width: `${Math.min((subtotal / shippingInfo.freeThreshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[#E5E0D8]">
                  <div className="flex justify-between text-xl font-serif">
                    <span className="text-[#2D2A26]">{t('cart.total')}</span>
                    <span className="text-[#8B2E2E]">€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-4 border-t border-[#E5E0D8]">
                <div className="flex items-center gap-2 text-xs text-[#969088]">
                  <Lock size={14} />
                  <span>{language === 'de' ? 'Sichere SSL-verschlüsselte Zahlung' : 'Secure SSL encrypted payment'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
