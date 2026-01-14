import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, User, MapPin, LogOut, ChevronRight, Clock, Truck, CheckCircle,
  ShoppingBag, Lock, Eye, EyeOff, AlertCircle, Award, TrendingUp, Calendar,
  Edit2, Save, X, Mail, FileText, Download
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { LoyaltyBadge } from '../components/LoyaltyIcons';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CustomerDashboardPage() {
  const { language } = useLanguage();
  const { user: customer, token, logout, updateProfile, isLoggedIn, isCustomer, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailResetLoading, setEmailResetLoading] = useState(false);
  const [emailResetSent, setEmailResetSent] = useState(false);
  
  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Address edit state
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    default_address: '',
    default_city: '',
    default_postal: '',
    default_country: 'Österreich',
    billing_same_as_shipping: true,
    billing_address: '',
    billing_city: '',
    billing_postal: '',
    billing_country: 'Österreich'
  });
  const [addressLoading, setAddressLoading] = useState(false);

  // Expanded order state
  const [expandedOrder, setExpandedOrder] = useState(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API}/customer/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/customer/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login');
    }
    // Redirect admin to admin dashboard
    if (!authLoading && isLoggedIn && !isCustomer) {
      navigate('/admin/dashboard');
    }
  }, [authLoading, isLoggedIn, isCustomer, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (customer) {
      setProfileForm({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || ''
      });
      setAddressForm({
        default_address: customer.default_address || '',
        default_city: customer.default_city || '',
        default_postal: customer.default_postal || '',
        default_country: customer.default_country || 'Österreich',
        billing_same_as_shipping: customer.billing_same_as_shipping !== false,
        billing_address: customer.billing_address || '',
        billing_city: customer.billing_city || '',
        billing_postal: customer.billing_postal || '',
        billing_country: customer.billing_country || 'Österreich'
      });
    }
  }, [customer]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error(language === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }
    
    if (passwordForm.new.length < 6) {
      toast.error(language === 'de' ? 'Passwort muss mindestens 6 Zeichen haben' : 'Password must be at least 6 characters');
      return;
    }
    
    setPasswordLoading(true);
    try {
      await axios.put(`${API}/customer/password`, {
        current_password: passwordForm.current,
        new_password: passwordForm.new
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(language === 'de' ? 'Passwort erfolgreich geändert!' : 'Password changed successfully!');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'de' ? 'Fehler beim Ändern des Passworts' : 'Failed to change password'));
    }
    setPasswordLoading(false);
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      toast.success(language === 'de' ? 'Profil aktualisiert!' : 'Profile updated!');
      setEditingProfile(false);
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Speichern' : 'Failed to save');
    }
    setProfileLoading(false);
  };

  const handleAddressSave = async () => {
    setAddressLoading(true);
    try {
      await updateProfile(addressForm);
      toast.success(language === 'de' ? 'Adressen aktualisiert!' : 'Addresses updated!');
      setEditingAddress(false);
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Speichern' : 'Failed to save');
    }
    setAddressLoading(false);
  };

  const handleEmailReset = async () => {
    setEmailResetLoading(true);
    try {
      await axios.post(`${API}/customer/password-reset/request`, { email: customer.email });
      setEmailResetSent(true);
      toast.success(language === 'de' 
        ? 'Ein Link zum Zurücksetzen wurde an Ihre E-Mail gesendet!' 
        : 'A reset link has been sent to your email!');
    } catch (error) {
      toast.error(language === 'de' 
        ? 'Fehler beim Senden der E-Mail' 
        : 'Failed to send email');
    }
    setEmailResetLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'processing': return <Package size={16} />;
      default: return <Clock size={16} />;
    }
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

  const isActiveOrder = (order) => {
    return ['pending', 'paid', 'processing', 'shipped'].includes(order.status);
  };

  if (authLoading || !customer) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B2E2E] border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const activeOrders = orders.filter(isActiveOrder);
  const completedOrders = orders.filter(o => !isActiveOrder(o));

  return (
    <>
      <SEO 
        title={language === 'de' ? 'Mein Konto | Hermann Böhmer' : 'My Account | Hermann Böhmer'}
      />
      <main className="bg-[#F9F8F6] min-h-screen pt-28 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Header with Loyalty Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">
                  {language === 'de' ? 'Willkommen zurück, ' : 'Welcome back, '}{customer.first_name}!
                </h1>
                <p className="text-[#5C5852] mt-1">{customer.email}</p>
              </div>
              
              {/* Loyalty Badge */}
              {stats?.loyalty && (
                <div className="text-center md:text-right">
                  <LoyaltyBadge 
                    tier={stats.loyalty.tier} 
                    size="large"
                  />
                  {stats.loyalty.next_tier && (
                    <p className="text-sm text-[#5C5852] mt-2">
                      {language === 'de' ? 'Noch ' : 'Only '}
                      <span className="font-medium text-[#8B2E2E]">€{stats.loyalty.amount_to_next_tier.toFixed(2)}</span>
                      {language === 'de' ? ` bis ${stats.loyalty.next_tier}` : ` until ${stats.loyalty.next_tier}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-white border border-[#E5E0D8] p-4">
                <div className="flex items-center gap-2 text-[#969088] mb-2">
                  <ShoppingBag size={16} />
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'de' ? 'Bestellungen' : 'Orders'}
                  </span>
                </div>
                <p className="font-serif text-2xl text-[#2D2A26]">{stats.order_count}</p>
              </div>
              
              <div className="bg-white border border-[#E5E0D8] p-4">
                <div className="flex items-center gap-2 text-[#969088] mb-2">
                  <TrendingUp size={16} />
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'de' ? 'Ausgegeben' : 'Spent'}
                  </span>
                </div>
                <p className="font-serif text-2xl text-[#2D2A26]">€{stats.total_spent.toFixed(2)}</p>
              </div>
              
              <div className="bg-white border border-[#E5E0D8] p-4">
                <div className="flex items-center gap-2 text-[#969088] mb-2">
                  <Award size={16} />
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'de' ? 'Status' : 'Status'}
                  </span>
                </div>
                <p className="font-serif text-2xl text-[#2D2A26]">{stats.loyalty.tier}</p>
              </div>
              
              <div className="bg-white border border-[#E5E0D8] p-4">
                <div className="flex items-center gap-2 text-[#969088] mb-2">
                  <Calendar size={16} />
                  <span className="text-xs uppercase tracking-wider">
                    {language === 'de' ? 'Letzte' : 'Last'}
                  </span>
                </div>
                <p className="font-serif text-lg text-[#2D2A26]">
                  {stats.last_order_date 
                    ? new Date(stats.last_order_date).toLocaleDateString(language === 'de' ? 'de-AT' : 'en-US', { day: 'numeric', month: 'short' })
                    : '-'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Progress to Next Tier */}
          {stats?.loyalty?.next_tier && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white border border-[#E5E0D8] p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#5C5852]">
                  {language === 'de' ? 'Fortschritt zu ' : 'Progress to '}{stats.loyalty.next_tier}
                </span>
                <span className="text-sm font-medium text-[#8B2E2E]">
                  {Math.round(stats.loyalty.progress_percent)}%
                </span>
              </div>
              <div className="h-3 bg-[#F2EFE9] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.loyalty.progress_percent}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: stats.loyalty.tier_color }}
                />
              </div>
            </motion.div>
          )}

          <div className="grid md:grid-cols-4 gap-6">
            
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-1"
            >
              <div className="bg-white border border-[#E5E0D8] p-4 sticky top-28">
                <nav className="space-y-1">
                  {[
                    { id: 'overview', icon: Package, label: language === 'de' ? 'Übersicht' : 'Overview' },
                    { id: 'orders', icon: ShoppingBag, label: language === 'de' ? 'Bestellungen' : 'Orders' },
                    { id: 'profile', icon: User, label: language === 'de' ? 'Profil' : 'Profile' },
                    { id: 'address', icon: MapPin, label: language === 'de' ? 'Adresse' : 'Address' },
                    { id: 'security', icon: Lock, label: language === 'de' ? 'Sicherheit' : 'Security' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeTab === item.id ? 'bg-[#F2EFE9] text-[#8B2E2E]' : 'text-[#5C5852] hover:bg-[#F9F8F6]'
                      }`}
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                      {item.id === 'orders' && activeOrders.length > 0 && (
                        <span className="ml-auto bg-[#8B2E2E] text-white text-xs px-2 py-0.5 rounded-full">
                          {activeOrders.length}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
                
                <div className="border-t border-[#E5E0D8] mt-4 pt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[#8B2E2E] hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>{language === 'de' ? 'Abmelden' : 'Logout'}</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-3 space-y-6"
            >
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Active Orders */}
                  {activeOrders.length > 0 && (
                    <div className="bg-white border border-[#E5E0D8] p-6">
                      <h2 className="font-serif text-xl text-[#2D2A26] mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B2E2E] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8B2E2E]"></span>
                        </span>
                        {language === 'de' ? 'Aktive Bestellungen' : 'Active Orders'}
                      </h2>
                      <div className="space-y-3">
                        {activeOrders.slice(0, 3).map((order) => (
                          <motion.div 
                            key={order.id}
                            className="border border-[#E5E0D8] p-4 hover:border-[#8B2E2E] transition-colors cursor-pointer"
                            onClick={() => { setActiveTab('orders'); setExpandedOrder(order.id); }}
                            whileHover={{ x: 5 }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-[#2D2A26]">#{order.tracking_number || order.id.slice(0, 8)}</p>
                                <p className="text-sm text-[#5C5852]">€{order.total_amount?.toFixed(2)}</p>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs border ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/shop" className="bg-white border border-[#E5E0D8] p-6 hover:border-[#8B2E2E] transition-colors group">
                      <ShoppingBag className="text-[#8B2E2E] mb-3" size={24} />
                      <p className="font-medium text-[#2D2A26] group-hover:text-[#8B2E2E]">
                        {language === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
                      </p>
                    </Link>
                    <Link to="/tracking" className="bg-white border border-[#E5E0D8] p-6 hover:border-[#8B2E2E] transition-colors group">
                      <Truck className="text-[#8B2E2E] mb-3" size={24} />
                      <p className="font-medium text-[#2D2A26] group-hover:text-[#8B2E2E]">
                        {language === 'de' ? 'Sendung verfolgen' : 'Track Shipment'}
                      </p>
                    </Link>
                  </div>
                </>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="bg-white border border-[#E5E0D8] p-6">
                  <h2 className="font-serif text-2xl text-[#2D2A26] mb-6">
                    {language === 'de' ? 'Meine Bestellungen' : 'My Orders'}
                  </h2>
                  
                  {loading ? (
                    <div className="py-12 text-center">
                      <div className="w-8 h-8 border-2 border-[#8B2E2E] border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingBag size={48} className="mx-auto text-[#E5E0D8] mb-4" />
                      <p className="text-[#5C5852]">
                        {language === 'de' ? 'Noch keine Bestellungen' : 'No orders yet'}
                      </p>
                      <Link to="/shop" className="btn-primary inline-flex items-center gap-2 mt-4">
                        {language === 'de' ? 'Jetzt einkaufen' : 'Shop Now'}
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <motion.div 
                          key={order.id} 
                          className={`border ${isActiveOrder(order) ? 'border-[#8B2E2E] bg-[#8B2E2E]/5' : 'border-[#E5E0D8]'}`}
                          layout
                        >
                          {/* Order Header */}
                          <div 
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  {isActiveOrder(order) && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B2E2E] opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B2E2E]"></span>
                                    </span>
                                  )}
                                  <p className="font-medium text-[#2D2A26]">
                                    #{order.tracking_number || order.id.slice(0, 8)}
                                  </p>
                                </div>
                                <p className="text-sm text-[#5C5852] mt-1">
                                  {new Date(order.created_at).toLocaleDateString(language === 'de' ? 'de-AT' : 'en-US', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-[#2D2A26]">€{order.total_amount?.toFixed(2)}</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs mt-1 border ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)}
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedOrder === order.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-[#E5E0D8] overflow-hidden"
                              >
                                <div className="p-4 space-y-4">
                                  {/* Items */}
                                  <div>
                                    <p className="text-sm font-medium text-[#969088] mb-2">
                                      {language === 'de' ? 'Artikel' : 'Items'}
                                    </p>
                                    <div className="space-y-2">
                                      {order.item_details?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-[#5C5852]">
                                            {item.quantity}x {language === 'de' ? item.product_name_de : item.product_name_en}
                                          </span>
                                          <span className="text-[#2D2A26]">€{item.subtotal?.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Order Summary */}
                                  <div className="border-t border-[#E5E0D8] pt-3 mt-3 space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-[#969088]">{language === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
                                      <span className="text-[#5C5852]">€{(order.subtotal || (order.total_amount - (order.shipping_cost || 0))).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-[#969088]">{language === 'de' ? 'Versand' : 'Shipping'}</span>
                                      <span className="text-[#5C5852]">
                                        {order.shipping_cost > 0 ? `€${order.shipping_cost.toFixed(2)}` : (language === 'de' ? 'Gratis' : 'Free')}
                                      </span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-[#969088]">{language === 'de' ? 'Rabatt' : 'Discount'}</span>
                                        <span className="text-green-600">-€{order.discount_amount.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-[#E5E0D8]">
                                      <span className="text-[#2D2A26]">{language === 'de' ? 'Gesamt' : 'Total'}</span>
                                      <span className="text-[#8B2E2E]">€{order.total_amount?.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  {/* Shipping Address */}
                                  <div>
                                    <p className="text-sm font-medium text-[#969088] mb-2">
                                      {language === 'de' ? 'Lieferadresse' : 'Shipping Address'}
                                    </p>
                                    <p className="text-sm text-[#5C5852]">
                                      {order.customer_name}<br />
                                      {order.shipping_address}<br />
                                      {order.shipping_postal} {order.shipping_city}<br />
                                      {order.shipping_country}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex flex-wrap gap-4">
                                    {order.tracking_number && (
                                      <Link
                                        to={`/tracking?number=${order.tracking_number}`}
                                        className="inline-flex items-center gap-2 text-sm text-[#8B2E2E] hover:underline"
                                      >
                                        <Truck size={16} />
                                        {language === 'de' ? 'Sendung verfolgen' : 'Track Shipment'}
                                        <ChevronRight size={14} />
                                      </Link>
                                    )}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const response = await axios.get(
                                            `${API}/orders/${order.id}/invoice`,
                                            {
                                              headers: { Authorization: `Bearer ${token}` },
                                              responseType: 'blob'
                                            }
                                          );
                                          const url = window.URL.createObjectURL(new Blob([response.data]));
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.setAttribute('download', `Rechnung_${order.invoice_number || order.tracking_number}.pdf`);
                                          document.body.appendChild(link);
                                          link.click();
                                          link.remove();
                                          window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                          toast.error(language === 'de' ? 'Fehler beim Herunterladen' : 'Download failed');
                                        }
                                      }}
                                      className="inline-flex items-center gap-2 text-sm text-[#5C5852] hover:text-[#8B2E2E] transition-colors"
                                    >
                                      <Download size={16} />
                                      {language === 'de' ? 'Rechnung' : 'Invoice'}
                                      {order.invoice_number && (
                                        <span className="text-xs text-[#969088]">({order.invoice_number})</span>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white border border-[#E5E0D8] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl text-[#2D2A26]">
                      {language === 'de' ? 'Mein Profil' : 'My Profile'}
                    </h2>
                    {!editingProfile ? (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="flex items-center gap-2 text-[#8B2E2E] hover:underline"
                      >
                        <Edit2 size={16} />
                        {language === 'de' ? 'Bearbeiten' : 'Edit'}
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProfile(false)}
                          className="p-2 text-[#969088] hover:text-[#2D2A26]"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                          className="flex items-center gap-2 text-[#8B2E2E] hover:underline"
                        >
                          {profileLoading ? (
                            <span className="w-4 h-4 border-2 border-[#8B2E2E] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {language === 'de' ? 'Speichern' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-[#969088] mb-1">
                        {language === 'de' ? 'Vorname' : 'First Name'}
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.first_name}
                          onChange={(e) => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                          className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                        />
                      ) : (
                        <p className="text-[#2D2A26] py-2">{customer.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-[#969088] mb-1">
                        {language === 'de' ? 'Nachname' : 'Last Name'}
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileForm.last_name}
                          onChange={(e) => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                          className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                        />
                      ) : (
                        <p className="text-[#2D2A26] py-2">{customer.last_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-[#969088] mb-1">E-Mail</label>
                      <p className="text-[#2D2A26] py-2">{customer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-[#969088] mb-1">
                        {language === 'de' ? 'Telefon' : 'Phone'}
                      </label>
                      {editingProfile ? (
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                          className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                        />
                      ) : (
                        <p className="text-[#2D2A26] py-2">{customer.phone || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Address Tab */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  {/* Shipping Address */}
                  <div className="bg-white border border-[#E5E0D8] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl text-[#2D2A26]">
                        {language === 'de' ? 'Lieferadresse' : 'Shipping Address'}
                      </h2>
                      {!editingAddress && (
                        <button
                          onClick={() => setEditingAddress(true)}
                          className="flex items-center gap-2 text-[#8B2E2E] hover:underline"
                        >
                          <Edit2 size={16} />
                          {language === 'de' ? 'Bearbeiten' : 'Edit'}
                        </button>
                      )}
                    </div>
                    
                    {editingAddress ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-[#969088] mb-1">
                            {language === 'de' ? 'Adresse' : 'Address'}
                          </label>
                          <input
                            type="text"
                            value={addressForm.default_address}
                            onChange={(e) => setAddressForm(p => ({ ...p, default_address: e.target.value }))}
                            className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                            placeholder={language === 'de' ? 'Straße und Hausnummer' : 'Street and number'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-[#969088] mb-1">PLZ</label>
                            <input
                              type="text"
                              value={addressForm.default_postal}
                              onChange={(e) => setAddressForm(p => ({ ...p, default_postal: e.target.value }))}
                              className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-[#969088] mb-1">
                              {language === 'de' ? 'Stadt' : 'City'}
                            </label>
                            <input
                              type="text"
                              value={addressForm.default_city}
                              onChange={(e) => setAddressForm(p => ({ ...p, default_city: e.target.value }))}
                              className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-[#969088] mb-1">
                            {language === 'de' ? 'Land' : 'Country'}
                          </label>
                          <select
                            value={addressForm.default_country}
                            onChange={(e) => setAddressForm(p => ({ ...p, default_country: e.target.value }))}
                            className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none bg-white"
                          >
                            <option value="Österreich">Österreich</option>
                            <option value="Deutschland">Deutschland</option>
                            <option value="Schweiz">Schweiz</option>
                          </select>
                        </div>
                      </div>
                    ) : customer.default_address ? (
                      <div className="space-y-1 text-[#2D2A26]">
                        <p>{customer.default_address}</p>
                        <p>{customer.default_postal} {customer.default_city}</p>
                        <p>{customer.default_country}</p>
                      </div>
                    ) : (
                      <p className="text-[#969088]">
                        {language === 'de' 
                          ? 'Keine Lieferadresse gespeichert.' 
                          : 'No shipping address saved.'}
                      </p>
                    )}
                  </div>

                  {/* Billing Address */}
                  <div className="bg-white border border-[#E5E0D8] p-6">
                    <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">
                      {language === 'de' ? 'Rechnungsadresse' : 'Billing Address'}
                    </h2>

                    {editingAddress ? (
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addressForm.billing_same_as_shipping}
                            onChange={(e) => setAddressForm(p => ({ ...p, billing_same_as_shipping: e.target.checked }))}
                            className="w-4 h-4 accent-[#8B2E2E]"
                          />
                          <span className="text-[#2D2A26]">
                            {language === 'de' ? 'Wie Lieferadresse' : 'Same as shipping address'}
                          </span>
                        </label>

                        {!addressForm.billing_same_as_shipping && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 pt-4 border-t border-[#E5E0D8]"
                          >
                            <div>
                              <label className="block text-sm text-[#969088] mb-1">
                                {language === 'de' ? 'Adresse' : 'Address'}
                              </label>
                              <input
                                type="text"
                                value={addressForm.billing_address}
                                onChange={(e) => setAddressForm(p => ({ ...p, billing_address: e.target.value }))}
                                className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-[#969088] mb-1">PLZ</label>
                                <input
                                  type="text"
                                  value={addressForm.billing_postal}
                                  onChange={(e) => setAddressForm(p => ({ ...p, billing_postal: e.target.value }))}
                                  className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-[#969088] mb-1">
                                  {language === 'de' ? 'Stadt' : 'City'}
                                </label>
                                <input
                                  type="text"
                                  value={addressForm.billing_city}
                                  onChange={(e) => setAddressForm(p => ({ ...p, billing_city: e.target.value }))}
                                  className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-[#969088] mb-1">
                                {language === 'de' ? 'Land' : 'Country'}
                              </label>
                              <select
                                value={addressForm.billing_country}
                                onChange={(e) => setAddressForm(p => ({ ...p, billing_country: e.target.value }))}
                                className="w-full px-4 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none bg-white"
                              >
                                <option value="Österreich">Österreich</option>
                                <option value="Deutschland">Deutschland</option>
                                <option value="Schweiz">Schweiz</option>
                              </select>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : customer.billing_same_as_shipping !== false ? (
                      <p className="text-[#5C5852]">
                        {language === 'de' ? 'Gleich wie Lieferadresse' : 'Same as shipping address'}
                      </p>
                    ) : customer.billing_address ? (
                      <div className="space-y-1 text-[#2D2A26]">
                        <p>{customer.billing_address}</p>
                        <p>{customer.billing_postal} {customer.billing_city}</p>
                        <p>{customer.billing_country}</p>
                      </div>
                    ) : (
                      <p className="text-[#969088]">
                        {language === 'de' 
                          ? 'Keine Rechnungsadresse gespeichert.' 
                          : 'No billing address saved.'}
                      </p>
                    )}
                  </div>

                  {/* Save Button */}
                  {editingAddress && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setEditingAddress(false);
                          // Reset to original values
                          setAddressForm({
                            default_address: customer.default_address || '',
                            default_city: customer.default_city || '',
                            default_postal: customer.default_postal || '',
                            default_country: customer.default_country || 'Österreich',
                            billing_same_as_shipping: customer.billing_same_as_shipping !== false,
                            billing_address: customer.billing_address || '',
                            billing_city: customer.billing_city || '',
                            billing_postal: customer.billing_postal || '',
                            billing_country: customer.billing_country || 'Österreich'
                          });
                        }}
                        className="px-6 py-3 text-[#5C5852] hover:text-[#2D2A26]"
                      >
                        {language === 'de' ? 'Abbrechen' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleAddressSave}
                        disabled={addressLoading}
                        className="btn-primary flex items-center gap-2"
                      >
                        {addressLoading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save size={16} />
                            {language === 'de' ? 'Speichern' : 'Save'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Password Change Form */}
                  <div className="bg-white border border-[#E5E0D8] p-6">
                    <h2 className="font-serif text-2xl text-[#2D2A26] mb-6">
                      {language === 'de' ? 'Passwort ändern' : 'Change Password'}
                    </h2>
                    
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                          {language === 'de' ? 'Aktuelles Passwort' : 'Current Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                            required
                            className="w-full px-4 py-3 pr-10 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#969088]"
                          >
                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                          {language === 'de' ? 'Neues Passwort' : 'New Password'}
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                          required
                          minLength={6}
                          className="w-full px-4 py-3 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                        />
                        <p className="text-xs text-[#969088] mt-1">
                          {language === 'de' ? 'Mindestens 6 Zeichen' : 'At least 6 characters'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                          {language === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}
                        </label>
                        <input
                          type={showPasswords ? 'text' : 'password'}
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                          required
                          className="w-full px-4 py-3 border border-[#E5E0D8] focus:border-[#8B2E2E] focus:outline-none"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                      >
                        {passwordLoading ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Lock size={18} />
                            {language === 'de' ? 'Passwort ändern' : 'Change Password'}
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Password Reset via Email */}
                  <div className="bg-white border border-[#E5E0D8] p-6">
                    <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">
                      {language === 'de' ? 'Passwort per E-Mail zurücksetzen' : 'Reset Password via Email'}
                    </h2>
                    <p className="text-[#5C5852] text-sm mb-6">
                      {language === 'de' 
                        ? 'Sie erhalten einen sicheren Link per E-Mail, mit dem Sie Ihr Passwort zurücksetzen können. Der Link ist 30 Minuten gültig.'
                        : 'You will receive a secure link via email to reset your password. The link is valid for 30 minutes.'}
                    </p>
                    
                    {emailResetSent ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700">
                        <CheckCircle size={20} />
                        <span className="text-sm">
                          {language === 'de' 
                            ? `E-Mail wurde an ${customer.email} gesendet. Bitte prüfen Sie Ihren Posteingang.`
                            : `Email sent to ${customer.email}. Please check your inbox.`}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleEmailReset}
                        disabled={emailResetLoading}
                        className="btn-ghost flex items-center gap-2"
                      >
                        {emailResetLoading ? (
                          <span className="w-5 h-5 border-2 border-[#8B2E2E] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Mail size={18} />
                            {language === 'de' ? 'Link per E-Mail senden' : 'Send Link via Email'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
