import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, ShoppingCart, BarChart3, LogOut, Plus, 
  Edit2, Trash2, Save, X, Menu, Home, Eye, Users,
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, PieChart, Calendar, RefreshCw, Download,
  ChevronRight, Clock, CheckCircle, Truck, Box, UserPlus,
  Bell, CheckCheck, MapPin, Mail, Send, Inbox, Newspaper,
  Award, Star, Gift, Settings, History
} from 'lucide-react';
import axios from 'axios';
import { Input } from '../components/ui/input';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { LoyaltyBadge, TierIcon } from '../components/LoyaltyIcons';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboardPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [finance, setFinance] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [adminEmails, setAdminEmails] = useState([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState([]);
  const [loyaltySettings, setLoyaltySettings] = useState(null);
  const [selectedLoyaltyCustomer, setSelectedLoyaltyCustomer] = useState(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState([]);
  const [showLoyaltySettings, setShowLoyaltySettings] = useState(false);
  const [showPointsAdjust, setShowPointsAdjust] = useState(false);
  const [pointsAdjustForm, setPointsAdjustForm] = useState({ points: 0, reason: '' });
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percent', discount_value: 10, min_order_value: '',
    max_uses: '', valid_from: '', valid_until: '', description: '', is_active: true
  });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [selectedCustomerForNotes, setSelectedCustomerForNotes] = useState(null);
  const [customerNotes, setCustomerNotes] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [editingShipping, setEditingShipping] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [emailForm, setEmailForm] = useState({ to_email: '', subject: '', message: '', order_id: null });
  const [productForm, setProductForm] = useState({
    name_de: '', name_en: '', description_de: '', description_en: '',
    price: '', original_price: '', image_url: '', category: 'likoer',
    stock: '', is_featured: false, is_limited: false, is_18_plus: false,
    alcohol_content: '', volume_ml: '500', weight_g: ''
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', category: 'general', date: ''
  });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [shippingForm, setShippingForm] = useState({
    country: '', rate: '', free_shipping_threshold: ''
  });

  // Support both new authToken and legacy admin_token
  const token = localStorage.getItem('authToken') || localStorage.getItem('admin_token');

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [productsRes, ordersRes, statsRes, adminsRes, expensesRes, financeRes, shippingRes, customersRes, newsletterRes, emailsRes, loyaltyCustomersRes, loyaltySettingsRes, couponsRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/orders`, { headers }),
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/admins`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/expenses`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/finance/summary`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/admin/shipping-rates`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/customers`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/newsletter/subscribers`, { headers }).catch(() => ({ data: { subscribers: [], stats: {} } })),
        axios.get(`${API}/admin/email/inbox`, { headers }).catch(() => ({ data: { emails: [], unread_count: 0 } })),
        axios.get(`${API}/admin/loyalty/customers`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/loyalty/settings`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API}/admin/coupons`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/analytics`, { headers }).catch(() => ({ data: null }))
      ]);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
      setAdmins(adminsRes.data);
      setExpenses(expensesRes.data);
      setFinance(financeRes.data);
      setShippingRates(shippingRes.data);
      setCustomers(customersRes.data);
      setNewsletterSubscribers(newsletterRes.data.subscribers || []);
      setNewsletterStats(newsletterRes.data.stats || { total: 0, active: 0, inactive: 0 });
      setAdminEmails(emailsRes.data.emails || []);
      setLoyaltyCustomers(loyaltyCustomersRes.data || []);
      setLoyaltySettings(loyaltySettingsRes.data);
      setCoupons(couponsRes.data || []);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUserType');
    navigate('/login');
  };

  // Fetch data on mount and when token changes
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  // Auto-Refresh und Sound-Benachrichtigung für neue Bestellungen
  useEffect(() => {
    if (!token) return;

    // Sound abspielen bei neuer Bestellung
    const playNotificationSound = () => {
      try {
        // Erzeuge einen Benachrichtigungs-Ton
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Zweiter Ton
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.setValueAtTime(1046.5, audioContext.currentTime); // C6 note
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          osc2.start(audioContext.currentTime);
          osc2.stop(audioContext.currentTime + 0.5);
        }, 200);
      } catch (e) {
        console.log('Audio notification failed:', e);
      }
    };

    // Periodisch auf neue Bestellungen prüfen (alle 30 Sekunden)
    const checkForNewOrders = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API}/admin/stats`, { headers });
        const newCount = res.data?.new_orders_count || 0;
        
        // Wenn mehr neue Bestellungen als vorher und Benachrichtigung aktiviert
        if (newCount > lastOrderCount && lastOrderCount > 0 && notificationEnabled) {
          playNotificationSound();
          toast.success(
            language === 'de' ? '🛒 Neue Bestellung eingegangen!' : '🛒 New order received!',
            { duration: 5000 }
          );
          
          // Browser Notification wenn erlaubt
          if (Notification.permission === 'granted') {
            new Notification('Hermann Böhmer', {
              body: language === 'de' ? 'Neue Bestellung eingegangen!' : 'New order received!',
              icon: '/favicon.ico'
            });
          }
        }
        
        setLastOrderCount(newCount);
      } catch (e) {
        // Silent fail
      }
    };

    // Initial last order count setzen
    if (stats?.new_orders_count !== undefined && lastOrderCount === 0) {
      setLastOrderCount(stats.new_orders_count);
    }

    const interval = setInterval(checkForNewOrders, 30000); // Alle 30 Sekunden
    return () => clearInterval(interval);
  }, [token, lastOrderCount, notificationEnabled, language, stats?.new_orders_count]);

  // E-Mail Funktionen
  const openEmailComposer = (to_email, subject = '', order_id = null) => {
    setEmailForm({
      to_email: to_email,
      subject: subject,
      message: '',
      order_id: order_id
    });
    setShowEmailComposer(true);
    setActiveTab('email');
  };

  const handleSendEmail = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/admin/email/send`, emailForm, { headers });
      toast.success(language === 'de' ? 'E-Mail gesendet!' : 'Email sent!');
      setShowEmailComposer(false);
      setEmailForm({ to_email: '', subject: '', message: '', order_id: null });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'de' ? 'Fehler beim Senden' : 'Error sending'));
    }
  };

  const handleDeleteNewsletter = async (id) => {
    if (!window.confirm(language === 'de' ? 'Abonnent wirklich löschen?' : 'Really delete subscriber?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/admin/newsletter/subscribers/${id}`, { headers });
      toast.success(language === 'de' ? 'Gelöscht' : 'Deleted');
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleSaveProduct = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const data = {
        ...productForm,
        price: parseFloat(productForm.price),
        original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
        stock: parseInt(productForm.stock),
        alcohol_content: productForm.alcohol_content ? parseFloat(productForm.alcohol_content) : null,
        volume_ml: parseInt(productForm.volume_ml) || 500,
        weight_g: productForm.weight_g ? parseInt(productForm.weight_g) : null
      };
      if (editingProduct) {
        await axios.put(`${API}/admin/products/${editingProduct.id}`, data, { headers });
        toast.success(language === 'de' ? 'Produkt aktualisiert' : 'Product updated');
      } else {
        await axios.post(`${API}/admin/products`, data, { headers });
        toast.success(language === 'de' ? 'Produkt erstellt' : 'Product created');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      resetProductForm();
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Speichern' : 'Error saving');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(language === 'de' ? 'Produkt wirklich löschen?' : 'Really delete?')) return;
    try {
      await axios.delete(`${API}/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Gelöscht' : 'Deleted');
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name_de: product.name_de, name_en: product.name_en,
      description_de: product.description_de, description_en: product.description_en,
      price: product.price.toString(), original_price: product.original_price?.toString() || '',
      image_url: product.image_url, category: product.category,
      stock: product.stock.toString(), is_featured: product.is_featured,
      is_limited: product.is_limited, is_18_plus: product.is_18_plus || false,
      alcohol_content: product.alcohol_content?.toString() || '',
      volume_ml: product.volume_ml?.toString() || '500', weight_g: product.weight_g?.toString() || ''
    });
    setShowProductForm(true);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Status aktualisiert' : 'Status updated');
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleSaveExpense = async () => {
    try {
      await axios.post(`${API}/admin/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Ausgabe gespeichert' : 'Expense saved');
      setShowExpenseForm(false);
      setExpenseForm({ description: '', amount: '', category: 'general', date: '' });
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm(language === 'de' ? 'Wirklich löschen?' : 'Really delete?')) return;
    try {
      await axios.delete(`${API}/admin/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Gelöscht' : 'Deleted');
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm(language === 'de' ? 'Admin wirklich löschen?' : 'Really delete admin?')) return;
    try {
      await axios.delete(`${API}/admin/admins/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Admin gelöscht' : 'Admin deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    }
  };

  // Shipping Rate Functions
  const handleSaveShippingRate = async () => {
    if (!shippingForm.country || !shippingForm.rate) {
      toast.error(language === 'de' ? 'Bitte Land und Versandkosten ausfüllen' : 'Please fill country and shipping rate');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const data = {
        country: shippingForm.country,
        rate: parseFloat(shippingForm.rate),
        free_shipping_threshold: shippingForm.free_shipping_threshold ? parseFloat(shippingForm.free_shipping_threshold) : 0
      };
      
      if (editingShipping) {
        await axios.put(`${API}/admin/shipping-rates/${editingShipping.id}`, data, { headers });
        toast.success(language === 'de' ? 'Versandkosten aktualisiert' : 'Shipping rate updated');
      } else {
        await axios.post(`${API}/admin/shipping-rates`, data, { headers });
        toast.success(language === 'de' ? 'Versandkosten erstellt' : 'Shipping rate created');
      }
      setShowShippingForm(false);
      setEditingShipping(null);
      setShippingForm({ country: '', rate: '', free_shipping_threshold: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'de' ? 'Fehler' : 'Error'));
    }
  };

  const handleDeleteShippingRate = async (id) => {
    if (!window.confirm(language === 'de' ? 'Versandkosten wirklich löschen?' : 'Really delete shipping rate?')) return;
    try {
      await axios.delete(`${API}/admin/shipping-rates/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Gelöscht' : 'Deleted');
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleEditShipping = (rate) => {
    setEditingShipping(rate);
    setShippingForm({
      country: rate.country,
      rate: rate.rate.toString(),
      free_shipping_threshold: rate.free_shipping_threshold?.toString() || '0'
    });
    setShowShippingForm(true);
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.password) {
      toast.error(language === 'de' ? 'Bitte alle Felder ausfüllen' : 'Please fill all fields');
      return;
    }
    if (adminForm.password.length < 6) {
      toast.error(language === 'de' ? 'Passwort muss mindestens 6 Zeichen haben' : 'Password must be at least 6 characters');
      return;
    }
    try {
      await axios.post(`${API}/admin/create`, adminForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Admin erstellt' : 'Admin created');
      setShowAdminForm(false);
      setAdminForm({ email: '', password: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'de' ? 'Fehler beim Erstellen' : 'Error creating admin'));
    }
  };

  const markOrderAsSeen = async (orderId) => {
    try {
      await axios.put(`${API}/admin/orders/${orderId}/mark-seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) {
      console.error('Error marking order as seen:', error);
    }
  };

  const markAllOrdersAsSeen = async () => {
    try {
      await axios.put(`${API}/admin/orders/mark-all-seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(language === 'de' ? 'Alle als gelesen markiert' : 'All marked as seen');
      fetchData();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler' : 'Error');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    if (order.is_new) {
      markOrderAsSeen(order.id);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name_de: '', name_en: '', description_de: '', description_en: '',
      price: '', original_price: '', image_url: '', category: 'likoer',
      stock: '', is_featured: false, is_limited: false, is_18_plus: false,
      alcohol_content: '', volume_ml: '500', weight_g: ''
    });
  };

  const navItems = [
    { id: 'overview', icon: BarChart3, label: language === 'de' ? 'Übersicht' : 'Overview' },
    { id: 'orders', icon: ShoppingCart, label: language === 'de' ? 'Bestellungen' : 'Orders', badge: stats?.new_orders_count || 0 },
    { id: 'customers', icon: Users, label: language === 'de' ? 'Kunden' : 'Customers', badge: customers.length },
    { id: 'loyalty', icon: Award, label: language === 'de' ? 'Treuepunkte' : 'Loyalty Points' },
    { id: 'coupons', icon: Gift, label: language === 'de' ? 'Gutscheine' : 'Coupons' },
    { id: 'analytics', icon: PieChart, label: 'Analytics' },
    { id: 'email', icon: Mail, label: language === 'de' ? 'E-Mail' : 'Email', badge: 0 },
    { id: 'newsletter', icon: Newspaper, label: 'Newsletter', badge: newsletterStats.active },
    { id: 'products', icon: Package, label: language === 'de' ? 'Produkte' : 'Products' },
    { id: 'shipping', icon: Truck, label: language === 'de' ? 'Versand' : 'Shipping' },
    { id: 'finance', icon: Wallet, label: language === 'de' ? 'Finanzen' : 'Finance' },
    { id: 'admins', icon: UserPlus, label: language === 'de' ? 'Admins' : 'Admins' }
  ];

  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-800', icon: Clock, label: language === 'de' ? 'Ausstehend' : 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', icon: Box, label: language === 'de' ? 'In Bearbeitung' : 'Processing' },
    shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: language === 'de' ? 'Versendet' : 'Shipped' },
    delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: language === 'de' ? 'Geliefert' : 'Delivered' }
  };

  const expenseCategories = [
    { id: 'general', de: 'Allgemein', en: 'General' },
    { id: 'production', de: 'Produktion', en: 'Production' },
    { id: 'shipping', de: 'Versand', en: 'Shipping' },
    { id: 'marketing', de: 'Marketing', en: 'Marketing' },
    { id: 'salary', de: 'Gehälter', en: 'Salaries' },
    { id: 'rent', de: 'Miete', en: 'Rent' },
    { id: 'utilities', de: 'Nebenkosten', en: 'Utilities' }
  ];

  return (
    <div className="min-h-screen flex bg-[#F9F8F6]" data-testid="admin-dashboard">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-[#E5E0D8] flex-col">
        <div className="p-6 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
              <span className="text-white font-serif text-lg">HB</span>
            </div>
            <div>
              <span className="text-[#2D2A26] block font-serif text-lg">Admin</span>
              <span className="text-xs text-[#969088] truncate block max-w-[160px]">
                {localStorage.getItem('admin_email')}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-[#8B2E2E] text-white' 
                  : 'text-[#5C5852] hover:bg-[#F2EFE9]'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === item.id 
                    ? 'bg-white text-[#8B2E2E]' 
                    : 'bg-[#8B2E2E] text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E0D8] space-y-1">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-[#5C5852] hover:bg-[#F2EFE9] rounded-lg transition-all">
            <Home size={20} />
            <span>{language === 'de' ? 'Zum Shop' : 'To Shop'}</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <LogOut size={20} />
            <span>{language === 'de' ? 'Abmelden' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#E5E0D8] z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#8B2E2E] flex items-center justify-center">
            <span className="text-white font-serif text-sm">HB</span>
          </div>
          <span className="font-serif text-[#2D2A26]">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {(stats?.new_orders_count || 0) > 0 && (
            <button 
              onClick={() => setActiveTab('orders')}
              className="relative p-2"
            >
              <Bell size={20} className="text-[#8B2E2E]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B2E2E] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {stats?.new_orders_count}
              </span>
            </button>
          )}
          <button onClick={() => setMobileMenuOpen(true)} className="p-2">
            <Menu size={24} className="text-[#2D2A26]" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute right-0 top-0 bottom-0 w-72 bg-white">
              <div className="p-4 border-b border-[#E5E0D8] flex justify-between items-center">
                <span className="font-serif text-[#2D2A26]">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}><X size={24} className="text-[#2D2A26]" /></button>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === item.id ? 'bg-[#8B2E2E] text-white' : 'text-[#5C5852]'}`}>
                    <item.icon size={20} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === item.id ? 'bg-white text-[#8B2E2E]' : 'bg-[#8B2E2E] text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="p-4 border-t border-[#E5E0D8]">
                <Link to="/" className="flex items-center gap-3 px-4 py-3 text-[#5C5852]"><Home size={20} /><span>{language === 'de' ? 'Zum Shop' : 'To Shop'}</span></Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600"><LogOut size={20} /><span>{language === 'de' ? 'Abmelden' : 'Logout'}</span></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Dashboard' : 'Dashboard'}</h1>
                <p className="text-[#969088] text-sm mt-1">{language === 'de' ? 'Willkommen zurück!' : 'Welcome back!'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    // Browser Notification Permission anfordern
                    if ('Notification' in window && Notification.permission === 'default') {
                      Notification.requestPermission();
                    }
                    setNotificationEnabled(!notificationEnabled);
                    toast.success(
                      notificationEnabled 
                        ? (language === 'de' ? 'Benachrichtigungen deaktiviert' : 'Notifications disabled')
                        : (language === 'de' ? '🔔 Benachrichtigungen aktiviert' : '🔔 Notifications enabled')
                    );
                  }} 
                  className={`p-2 rounded-lg transition-all ${notificationEnabled ? 'bg-[#8B2E2E] text-white' : 'hover:bg-[#F2EFE9]'}`}
                  title={language === 'de' ? 'Ton-Benachrichtigung bei neuen Bestellungen' : 'Sound notification for new orders'}
                >
                  <Bell size={20} className={notificationEnabled ? 'text-white' : 'text-[#5C5852]'} />
                </button>
                <button onClick={fetchData} className="p-2 hover:bg-[#F2EFE9] rounded-lg transition-all">
                  <RefreshCw size={20} className="text-[#5C5852]" />
                </button>
              </div>
            </div>

            {/* Notification Status */}
            {notificationEnabled && (
              <div className="bg-green-50 border border-green-200 px-4 py-2 flex items-center gap-2 text-green-800 text-sm">
                <Bell size={16} />
                {language === 'de' ? 'Ton-Benachrichtigung aktiv - Sie werden bei neuen Bestellungen benachrichtigt' : 'Sound notification active - You will be notified of new orders'}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#E5E0D8] hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <TrendingUp size={16} className="text-green-500" />
                </div>
                <p className="text-[#969088] text-xs mt-3 uppercase tracking-wider">{language === 'de' ? 'Umsatz' : 'Revenue'}</p>
                <p className="font-serif text-2xl text-[#2D2A26] mt-1">€{(stats?.total_revenue || 0).toFixed(0)}</p>
              </div>

              <div className="bg-white p-5 border border-[#E5E0D8] hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <ShoppingCart size={20} className="text-blue-600" />
                  </div>
                  <span className="text-xs text-blue-600 font-medium">{stats?.pending_orders || 0} {language === 'de' ? 'offen' : 'open'}</span>
                </div>
                <p className="text-[#969088] text-xs mt-3 uppercase tracking-wider">{language === 'de' ? 'Bestellungen' : 'Orders'}</p>
                <p className="font-serif text-2xl text-[#2D2A26] mt-1">{stats?.total_orders || 0}</p>
              </div>

              <div className="bg-white p-5 border border-[#E5E0D8] hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                    <Package size={20} className="text-purple-600" />
                  </div>
                </div>
                <p className="text-[#969088] text-xs mt-3 uppercase tracking-wider">{language === 'de' ? 'Produkte' : 'Products'}</p>
                <p className="font-serif text-2xl text-[#2D2A26] mt-1">{stats?.total_products || 0}</p>
              </div>

              <div className="bg-white p-5 border border-[#E5E0D8] hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
                    <TrendingUp size={20} className="text-amber-600" />
                  </div>
                </div>
                <p className="text-[#969088] text-xs mt-3 uppercase tracking-wider">{language === 'de' ? 'Gewinn' : 'Profit'}</p>
                <p className="font-serif text-2xl text-[#8B2E2E] mt-1">€{(finance?.profit || stats?.total_revenue || 0).toFixed(0)}</p>
              </div>
            </div>

            {/* Order Status Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(statusConfig).map(([key, config]) => (
                <div key={key} className={`${config.color} px-4 py-3 flex items-center gap-3`}>
                  <config.icon size={18} />
                  <div>
                    <p className="text-xs font-medium">{config.label}</p>
                    <p className="font-serif text-lg">{stats?.[`${key}_orders`] || 0}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white border border-[#E5E0D8]">
                <div className="px-5 py-4 border-b border-[#E5E0D8] flex items-center justify-between">
                  <h2 className="font-serif text-lg text-[#2D2A26]">{language === 'de' ? 'Letzte Bestellungen' : 'Recent Orders'}</h2>
                  <button onClick={() => setActiveTab('orders')} className="text-[#8B2E2E] text-sm flex items-center gap-1 hover:underline">
                    {language === 'de' ? 'Alle' : 'All'} <ChevronRight size={14} />
                  </button>
                </div>
                <div className="divide-y divide-[#E5E0D8]">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#F9F8F6]">
                      <div>
                        <p className="font-medium text-[#2D2A26]">{order.customer_name}</p>
                        <p className="text-xs text-[#969088] font-mono">{order.tracking_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-[#8B2E2E]">€{order.total_amount.toFixed(0)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[order.status]?.color}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="px-5 py-8 text-center text-[#969088]">
                      {language === 'de' ? 'Keine Bestellungen' : 'No orders'}
                    </div>
                  )}
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className="bg-white border border-[#E5E0D8]">
                <div className="px-5 py-4 border-b border-[#E5E0D8] flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  <h2 className="font-serif text-lg text-[#2D2A26]">{language === 'de' ? 'Niedriger Bestand' : 'Low Stock'}</h2>
                </div>
                <div className="divide-y divide-[#E5E0D8]">
                  {(stats?.low_stock_products || []).map((product, i) => (
                    <div key={i} className="px-5 py-4 flex items-center justify-between">
                      <span className="text-[#2D2A26]">{product.name_de}</span>
                      <span className={`font-serif ${product.stock < 10 ? 'text-red-600' : 'text-amber-600'}`}>
                        {product.stock} {language === 'de' ? 'Stk.' : 'pcs'}
                      </span>
                    </div>
                  ))}
                  {(!stats?.low_stock_products || stats.low_stock_products.length === 0) && (
                    <div className="px-5 py-8 text-center text-green-600">
                      ✓ {language === 'de' ? 'Alle Bestände OK' : 'All stock OK'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-5 py-4 border-b border-[#E5E0D8]">
                <h2 className="font-serif text-lg text-[#2D2A26]">{language === 'de' ? 'Bestseller' : 'Top Products'}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E0D8]">
                {(stats?.top_products || []).map((product, i) => (
                  <div key={i} className="px-5 py-4 text-center">
                    <p className="text-3xl font-serif text-[#8B2E2E]">#{i + 1}</p>
                    <p className="text-sm text-[#2D2A26] mt-2 line-clamp-1">{product.name_de}</p>
                    <p className="text-xs text-[#969088] mt-1">{product.sold_count} {language === 'de' ? 'verkauft' : 'sold'}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Bestellungen' : 'Orders'}</h1>
                <p className="text-sm text-[#969088] mt-1">
                  {orders.length} {language === 'de' ? 'gesamt' : 'total'}
                  {(stats?.new_orders_count || 0) > 0 && (
                    <span className="text-[#8B2E2E] ml-2 font-medium">
                      • {stats.new_orders_count} {language === 'de' ? 'neue' : 'new'}
                    </span>
                  )}
                </p>
              </div>
              {(stats?.new_orders_count || 0) > 0 && (
                <button 
                  onClick={markAllOrdersAsSeen}
                  className="btn-secondary !py-2 !px-4 flex items-center gap-2 text-xs"
                >
                  <CheckCheck size={16} />
                  {language === 'de' ? 'Alle als gelesen' : 'Mark all read'}
                </button>
              )}
            </div>

            <div className="bg-white border border-[#E5E0D8] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F2EFE9]">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase"></th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">Tracking</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Kunde' : 'Customer'}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase hidden md:table-cell">{language === 'de' ? 'Ort' : 'Location'}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Betrag' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {orders.map(order => (
                      <tr 
                        key={order.id} 
                        className={`cursor-pointer transition-colors ${
                          order.is_new 
                            ? 'bg-[#8B2E2E]/5 hover:bg-[#8B2E2E]/10' 
                            : 'hover:bg-[#F9F8F6]'
                        }`} 
                        onClick={() => handleViewOrder(order)}
                      >
                        <td className="px-3 py-4 w-8">
                          {order.is_new && (
                            <span className="w-2.5 h-2.5 bg-[#8B2E2E] rounded-full block animate-pulse" title={language === 'de' ? 'Neu' : 'New'}></span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-[#8B2E2E]">{order.tracking_number}</span>
                            {order.is_new && (
                              <span className="bg-[#8B2E2E] text-white text-[10px] px-1.5 py-0.5 uppercase font-bold">
                                {language === 'de' ? 'Neu' : 'New'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className={`font-medium ${order.is_new ? 'text-[#8B2E2E]' : 'text-[#2D2A26]'}`}>{order.customer_name}</p>
                            <p className="text-xs text-[#969088]">{order.customer_email}</p>
                            {order.customer_account && (
                              <div className="mt-1">
                                <LoyaltyBadge 
                                  tier={order.customer_account.loyalty_tier} 
                                  size="small"
                                />
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); openEmailComposer(order.customer_email, `Ihre Bestellung ${order.tracking_number}`, order.id); }}
                              className="mt-2 text-xs text-[#8B2E2E] hover:underline flex items-center gap-1"
                            >
                              <Mail size={12} /> {language === 'de' ? 'Kontaktieren' : 'Contact'}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#5C5852] hidden md:table-cell">{order.shipping_city}, {order.shipping_country}</td>
                        <td className="px-5 py-4">
                          <select value={order.status} onChange={(e) => { e.stopPropagation(); handleUpdateOrderStatus(order.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer ${statusConfig[order.status]?.color}`}>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-right font-serif text-[#8B2E2E]">€{order.total_amount.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders.length === 0 && (
                <div className="py-12 text-center text-[#969088]">{language === 'de' ? 'Keine Bestellungen vorhanden' : 'No orders yet'}</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Produkte' : 'Products'}</h1>
              <button onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductForm(true); }}
                className="btn-primary flex items-center gap-2">
                <Plus size={18} />{language === 'de' ? 'Neu' : 'New'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white border border-[#E5E0D8] overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-[#F2EFE9] relative overflow-hidden">
                    <img src={product.image_url} alt={product.name_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {product.is_limited && <span className="absolute top-2 left-2 bg-[#D4AF37] text-xs px-2 py-1 text-[#2D2A26]">LIMITED</span>}
                    {product.is_featured && <span className="absolute top-2 right-2 bg-[#8B2E2E] text-white text-xs px-2 py-1">FEATURED</span>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-[#969088] uppercase">{product.category}</p>
                    <h3 className="font-serif text-[#2D2A26] mt-1 line-clamp-1">{product.name_de}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-serif text-lg text-[#8B2E2E]">€{product.price.toFixed(0)}</span>
                      <span className={`text-xs ${product.stock < 10 ? 'text-red-600' : 'text-[#969088]'}`}>{product.stock} {language === 'de' ? 'Stk.' : 'pcs'}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEditProduct(product)} className="flex-1 py-2 bg-[#F2EFE9] hover:bg-[#8B2E2E] hover:text-white text-[#2D2A26] text-sm flex items-center justify-center gap-1 transition-colors">
                        <Edit2 size={14} />{language === 'de' ? 'Bearbeiten' : 'Edit'}
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <Link to={`/product/${product.slug}`} className="p-2 bg-[#F2EFE9] hover:bg-[#2D2A26] hover:text-white text-[#2D2A26] transition-colors">
                        <Eye size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Versandkosten' : 'Shipping Rates'}</h1>
                <p className="text-sm text-[#969088] mt-1">
                  {language === 'de' ? 'Verwalten Sie Versandkosten für verschiedene Länder' : 'Manage shipping rates for different countries'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setEditingShipping(null);
                  setShippingForm({ country: '', rate: '', free_shipping_threshold: '' });
                  setShowShippingForm(true);
                }} 
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />{language === 'de' ? 'Land hinzufügen' : 'Add Country'}
              </button>
            </div>

            {/* Shipping Rates Table */}
            <div className="bg-white border border-[#E5E0D8] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F2EFE9]">
                    <tr>
                      <th className="text-left px-5 py-4 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Land' : 'Country'}</th>
                      <th className="text-left px-5 py-4 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Versandkosten' : 'Shipping Rate'}</th>
                      <th className="text-left px-5 py-4 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Gratis ab' : 'Free Shipping From'}</th>
                      <th className="text-left px-5 py-4 text-xs font-medium text-[#5C5852] uppercase">Status</th>
                      <th className="text-right px-5 py-4 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Aktionen' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {shippingRates.map(rate => (
                      <tr key={rate.id} className="hover:bg-[#F9F8F6]">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <MapPin size={18} className="text-[#8B2E2E]" />
                            <span className="font-medium text-[#2D2A26]">{rate.country}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-serif text-lg text-[#8B2E2E]">€{rate.rate.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          {rate.free_shipping_threshold > 0 ? (
                            <span className="text-green-600 font-medium">€{rate.free_shipping_threshold.toFixed(0)}</span>
                          ) : (
                            <span className="text-[#969088]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${rate.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {rate.is_active ? (language === 'de' ? 'Aktiv' : 'Active') : (language === 'de' ? 'Inaktiv' : 'Inactive')}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleEditShipping(rate)} 
                              className="p-2 bg-[#F2EFE9] hover:bg-[#8B2E2E] hover:text-white text-[#2D2A26] transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteShippingRate(rate.id)} 
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {shippingRates.length === 0 && (
                <div className="py-12 text-center text-[#969088]">
                  {language === 'de' ? 'Keine Versandkosten definiert' : 'No shipping rates defined'}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 p-4 flex gap-3">
              <div className="text-blue-600 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{language === 'de' ? 'Hinweis' : 'Note'}</p>
                <p>{language === 'de' 
                  ? 'Wenn ein Land nicht in der Liste ist, werden €9.90 Standard-Versandkosten berechnet. Der "Gratis ab"-Wert bestimmt ab welchem Bestellwert der Versand kostenlos ist (0 = kein Gratis-Versand).'
                  : 'If a country is not in the list, €9.90 default shipping will be charged. The "Free From" value determines from which order value shipping is free (0 = no free shipping).'
                }</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Finanzen & Buchhaltung' : 'Finance & Accounting'}</h1>
              <button onClick={() => setShowExpenseForm(true)} className="btn-primary flex items-center gap-2">
                <Plus size={18} />{language === 'de' ? 'Ausgabe' : 'Expense'}
              </button>
            </div>

            {/* Finance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 border border-[#E5E0D8]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                    <TrendingUp size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#969088] uppercase tracking-wider">{language === 'de' ? 'Einnahmen' : 'Revenue'}</p>
                    <p className="font-serif text-3xl text-green-600">€{(finance?.total_revenue || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border border-[#E5E0D8]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
                    <TrendingDown size={24} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#969088] uppercase tracking-wider">{language === 'de' ? 'Ausgaben' : 'Expenses'}</p>
                    <p className="font-serif text-3xl text-red-600">€{(finance?.total_expenses || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 border border-[#E5E0D8]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#8B2E2E]/10 flex items-center justify-center">
                    <DollarSign size={24} className="text-[#8B2E2E]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#969088] uppercase tracking-wider">{language === 'de' ? 'Gewinn' : 'Profit'}</p>
                    <p className={`font-serif text-3xl ${(finance?.profit || 0) >= 0 ? 'text-[#8B2E2E]' : 'text-red-600'}`}>
                      €{(finance?.profit || 0).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Categories */}
            {finance?.expense_categories && Object.keys(finance.expense_categories).length > 0 && (
              <div className="bg-white p-6 border border-[#E5E0D8]">
                <h2 className="font-serif text-lg text-[#2D2A26] mb-4">{language === 'de' ? 'Ausgaben nach Kategorie' : 'Expenses by Category'}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(finance.expense_categories).map(([cat, amount]) => (
                    <div key={cat} className="bg-[#F9F8F6] p-4">
                      <p className="text-xs text-[#969088] uppercase">{expenseCategories.find(c => c.id === cat)?.[language] || cat}</p>
                      <p className="font-serif text-xl text-[#2D2A26] mt-1">€{amount.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses List */}
            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-5 py-4 border-b border-[#E5E0D8]">
                <h2 className="font-serif text-lg text-[#2D2A26]">{language === 'de' ? 'Ausgaben Liste' : 'Expense List'}</h2>
              </div>
              <div className="divide-y divide-[#E5E0D8]">
                {expenses.map(expense => (
                  <div key={expense.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#F9F8F6]">
                    <div>
                      <p className="font-medium text-[#2D2A26]">{expense.description}</p>
                      <p className="text-xs text-[#969088]">{expenseCategories.find(c => c.id === expense.category)?.[language] || expense.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-lg text-red-600">-€{expense.amount.toFixed(0)}</span>
                      <button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="py-8 text-center text-[#969088]">{language === 'de' ? 'Keine Ausgaben erfasst' : 'No expenses recorded'}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Admin-Verwaltung' : 'Admin Management'}</h1>
              <button onClick={() => setShowAdminForm(true)} className="btn-primary flex items-center gap-2">
                <UserPlus size={18} />{language === 'de' ? 'Neuer Admin' : 'New Admin'}
              </button>
            </div>

            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-5 py-4 border-b border-[#E5E0D8] flex items-center justify-between">
                <h2 className="font-serif text-lg text-[#2D2A26]">{language === 'de' ? 'Registrierte Admins' : 'Registered Admins'}</h2>
                <span className="text-sm text-[#969088]">{admins.length} {language === 'de' ? 'gesamt' : 'total'}</span>
              </div>
              <div className="divide-y divide-[#E5E0D8]">
                {admins.map(admin => (
                  <div key={admin.id} className="px-5 py-4 flex items-center justify-between hover:bg-[#F9F8F6]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
                        <Users size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-[#2D2A26]">{admin.email}</p>
                        <p className="text-xs text-[#969088]">ID: {admin.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    {admin.email !== localStorage.getItem('admin_email') && (
                      <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                    {admin.email === localStorage.getItem('admin_email') && (
                      <span className="text-xs bg-[#8B2E2E] text-white px-3 py-1">{language === 'de' ? 'Du' : 'You'}</span>
                    )}
                  </div>
                ))}
                {admins.length === 0 && (
                  <div className="py-8 text-center text-[#969088]">{language === 'de' ? 'Keine Admins gefunden' : 'No admins found'}</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl lg:text-3xl text-[#2D2A26]">{language === 'de' ? 'Kunden' : 'Customers'}</h1>
                <p className="text-sm text-[#969088] mt-1">
                  {customers.length} {language === 'de' ? 'registrierte Kunden' : 'registered customers'}
                </p>
              </div>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Bronze', 'Silber', 'Gold', 'Platinum', 'Diamond'].map(tier => {
                const count = customers.filter(c => c.stats?.loyalty_tier === tier).length;
                return (
                  <div key={tier} className="bg-white border border-[#E5E0D8] p-4 text-center">
                    <div className="flex justify-center">
                      <TierIcon tier={tier} size={32} />
                    </div>
                    <p className="font-serif text-xl text-[#2D2A26] mt-2">{count}</p>
                    <p className="text-xs text-[#969088] uppercase">{tier}</p>
                  </div>
                );
              })}
            </div>

            {/* Customers Table */}
            <div className="bg-white border border-[#E5E0D8] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F2EFE9]">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Kunde' : 'Customer'}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase hidden md:table-cell">Status</th>
                      <th className="text-center px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">Newsletter</th>
                      <th className="text-center px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Bestellungen' : 'Orders'}</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Ausgegeben' : 'Spent'}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase hidden lg:table-cell">{language === 'de' ? 'Letzte Bestellung' : 'Last Order'}</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-[#5C5852] uppercase hidden lg:table-cell">{language === 'de' ? 'Registriert' : 'Registered'}</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-[#5C5852] uppercase">{language === 'de' ? 'Aktionen' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {customers.map(customer => (
                      <tr key={customer.id} className="hover:bg-[#F9F8F6] transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-[#2D2A26]">{customer.first_name} {customer.last_name}</p>
                            <p className="text-xs text-[#969088]">{customer.email}</p>
                            {customer.phone && <p className="text-xs text-[#969088]">{customer.phone}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <LoyaltyBadge 
                            tier={customer.stats?.loyalty_tier} 
                            size="small"
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          {customer.newsletter_subscribed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium">
                              <CheckCircle size={12} />
                              {language === 'de' ? 'Abonniert' : 'Subscribed'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs">
                              {language === 'de' ? 'Nicht abonniert' : 'Not subscribed'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-serif text-lg text-[#2D2A26]">{customer.stats?.order_count || 0}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-serif text-[#8B2E2E]">€{(customer.stats?.total_spent || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#5C5852] hidden lg:table-cell">
                          {customer.stats?.last_order_date 
                            ? new Date(customer.stats.last_order_date).toLocaleDateString(language === 'de' ? 'de-AT' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#5C5852] hidden lg:table-cell">
                          {new Date(customer.created_at).toLocaleDateString(language === 'de' ? 'de-AT' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedCustomerForNotes(customer); setCustomerNotes(customer.admin_notes || ''); }}
                              className={`p-1.5 rounded ${customer.admin_notes ? 'bg-amber-100 text-amber-700' : 'hover:bg-[#F2EFE9] text-[#969088]'}`}
                              title={language === 'de' ? 'Notiz' : 'Note'}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => openEmailComposer(customer.email, '')}
                              className="px-3 py-1.5 text-xs bg-[#8B2E2E] text-white hover:bg-[#7A2828] flex items-center gap-1"
                            >
                              <Mail size={12} /> {language === 'de' ? 'Kontaktieren' : 'Contact'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {customers.length === 0 && (
                <div className="py-12 text-center text-[#969088]">
                  {language === 'de' ? 'Noch keine registrierten Kunden' : 'No registered customers yet'}
                </div>
              )}
            </div>

            {/* Loyalty Tier Legend */}
            <div className="bg-[#F2EFE9] border border-[#E5E0D8] p-6">
              <h3 className="font-serif text-lg text-[#2D2A26] mb-4">{language === 'de' ? 'Kundenwert-Stufen' : 'Loyalty Tiers'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { tier: 'Bronze', range: '€0 - €50' },
                  { tier: 'Silber', range: '€50 - €100' },
                  { tier: 'Gold', range: '€100 - €250' },
                  { tier: 'Platinum', range: '€250 - €500' },
                  { tier: 'Diamond', range: '€500+' }
                ].map(item => (
                  <div key={item.tier} className="bg-white border border-[#E5E0D8] p-3 text-center">
                    <div className="flex justify-center">
                      <TierIcon tier={item.tier} size={28} />
                    </div>
                    <p className="font-medium text-[#2D2A26] mt-1">{item.tier}</p>
                    <p className="text-xs text-[#969088]">{item.range}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Email Tab */}
        {activeTab === 'email' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#2D2A26]">
                {language === 'de' ? 'E-Mail' : 'Email'}
              </h2>
              <button
                onClick={() => setShowEmailComposer(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                {language === 'de' ? 'Neue E-Mail' : 'New Email'}
              </button>
            </div>

            {/* Email Composer */}
            {showEmailComposer && (
              <div className="bg-white border border-[#E5E0D8] p-6">
                <h3 className="font-serif text-lg text-[#2D2A26] mb-4 flex items-center gap-2">
                  <Send size={20} className="text-[#8B2E2E]" />
                  {language === 'de' ? 'E-Mail verfassen' : 'Compose Email'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-[#969088] uppercase block mb-1">{language === 'de' ? 'An' : 'To'}</label>
                    <Input 
                      type="email" 
                      value={emailForm.to_email} 
                      onChange={(e) => setEmailForm(f => ({ ...f, to_email: e.target.value }))}
                      placeholder="kunde@email.at"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#969088] uppercase block mb-1">{language === 'de' ? 'Betreff' : 'Subject'}</label>
                    <Input 
                      value={emailForm.subject} 
                      onChange={(e) => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder={language === 'de' ? 'Betreff eingeben...' : 'Enter subject...'}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#969088] uppercase block mb-1">{language === 'de' ? 'Nachricht' : 'Message'}</label>
                    <textarea 
                      value={emailForm.message} 
                      onChange={(e) => setEmailForm(f => ({ ...f, message: e.target.value }))}
                      rows={8}
                      className="w-full px-3 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] outline-none"
                      placeholder={language === 'de' ? 'Ihre Nachricht...' : 'Your message...'}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendEmail}
                      disabled={!emailForm.to_email || !emailForm.subject || !emailForm.message}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Send size={16} />
                      {language === 'de' ? 'Senden' : 'Send'}
                    </button>
                    <button
                      onClick={() => {
                        setShowEmailComposer(false);
                        setEmailForm({ to_email: '', subject: '', message: '', order_id: null });
                      }}
                      className="px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9]"
                    >
                      {language === 'de' ? 'Abbrechen' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Email History */}
            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-6 py-4 border-b border-[#E5E0D8] flex items-center gap-2">
                <Inbox size={20} className="text-[#8B2E2E]" />
                <h3 className="font-serif text-lg text-[#2D2A26]">
                  {language === 'de' ? 'Gesendete E-Mails' : 'Sent Emails'}
                </h3>
              </div>
              {adminEmails.length === 0 ? (
                <div className="p-8 text-center text-[#969088]">
                  {language === 'de' ? 'Noch keine E-Mails gesendet' : 'No emails sent yet'}
                </div>
              ) : (
                <div className="divide-y divide-[#E5E0D8]">
                  {adminEmails.map(email => (
                    <div key={email.id} className="px-6 py-4 hover:bg-[#F9F8F6]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {email.is_incoming ? (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5">Empfangen</span>
                            ) : (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5">Gesendet</span>
                            )}
                            <span className="text-xs text-[#969088]">
                              {new Date(email.received_at).toLocaleString('de-AT')}
                            </span>
                          </div>
                          <p className="font-medium text-[#2D2A26]">{email.subject}</p>
                          <p className="text-sm text-[#969088]">
                            {email.is_incoming ? 'Von' : 'An'}: {email.is_incoming ? email.from_email : email.to_email}
                          </p>
                          <p className="text-sm text-[#5C5852] mt-1 line-clamp-2">{email.body}</p>
                        </div>
                        <button
                          onClick={() => openEmailComposer(email.to_email, `Re: ${email.subject}`)}
                          className="p-2 hover:bg-[#F2EFE9] rounded"
                          title={language === 'de' ? 'Antworten' : 'Reply'}
                        >
                          <Send size={16} className="text-[#969088]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Newsletter Tab */}
        {activeTab === 'newsletter' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="font-serif text-2xl text-[#2D2A26]">Newsletter</h2>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <p className="font-serif text-3xl text-[#8B2E2E]">{newsletterStats.total}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Gesamt' : 'Total'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <p className="font-serif text-3xl text-green-600">{newsletterStats.active}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Aktiv' : 'Active'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <p className="font-serif text-3xl text-[#969088]">{newsletterStats.inactive}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Abgemeldet' : 'Unsubscribed'}</p>
              </div>
            </div>

            {/* Subscriber List */}
            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-6 py-4 border-b border-[#E5E0D8]">
                <h3 className="font-serif text-lg text-[#2D2A26]">
                  {language === 'de' ? 'Alle Abonnenten' : 'All Subscribers'}
                </h3>
              </div>
              {newsletterSubscribers.length === 0 ? (
                <div className="p-8 text-center text-[#969088]">
                  {language === 'de' ? 'Noch keine Newsletter-Abonnenten' : 'No newsletter subscribers yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9F8F6]">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">E-Mail</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Angemeldet am' : 'Subscribed on'}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Quelle' : 'Source'}</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Aktionen' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8]">
                      {newsletterSubscribers.map(sub => (
                        <tr key={sub.id} className="hover:bg-[#F9F8F6]">
                          <td className="px-5 py-4 font-medium text-[#2D2A26]">{sub.email}</td>
                          <td className="px-5 py-4">
                            {sub.is_active ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800">{language === 'de' ? 'Aktiv' : 'Active'}</span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600">{language === 'de' ? 'Abgemeldet' : 'Unsubscribed'}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-[#5C5852]">
                            {new Date(sub.subscribed_at).toLocaleDateString('de-AT')}
                          </td>
                          <td className="px-5 py-4 text-[#969088] capitalize">{sub.source}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEmailComposer(sub.email, 'Newsletter')}
                                className="p-2 hover:bg-[#F2EFE9] rounded"
                                title={language === 'de' ? 'E-Mail senden' : 'Send email'}
                              >
                                <Mail size={16} className="text-[#969088]" />
                              </button>
                              <button
                                onClick={() => handleDeleteNewsletter(sub.id)}
                                className="p-2 hover:bg-red-50 rounded"
                                title={language === 'de' ? 'Löschen' : 'Delete'}
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Loyalty Points Tab */}
        {activeTab === 'loyalty' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#2D2A26]">
                {language === 'de' ? 'Treuepunkte' : 'Loyalty Points'}
              </h2>
              <button
                onClick={() => setShowLoyaltySettings(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9] transition-colors"
              >
                <Settings size={18} />
                {language === 'de' ? 'Einstellungen' : 'Settings'}
              </button>
            </div>

            {/* Loyalty Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <Award className="w-8 h-8 text-[#8B2E2E] mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">{loyaltyCustomers.length}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Kunden mit Punkten' : 'Customers with points'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">
                  {loyaltyCustomers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Punkte gesamt' : 'Total points'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">
                  {loyaltyCustomers.reduce((sum, c) => sum + (c.earned_points || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Verdiente Punkte' : 'Earned points'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">
                  {loyaltyCustomers.reduce((sum, c) => sum + (c.redeemed_points || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Eingelöst' : 'Redeemed'}</p>
              </div>
            </div>

            {/* Settings Display */}
            {loyaltySettings && (
              <div className="bg-amber-50 border border-amber-200 p-4 flex items-center gap-4">
                <Settings size={20} className="text-amber-600" />
                <div className="text-sm text-amber-800">
                  <strong>{language === 'de' ? 'Aktuelle Einstellungen:' : 'Current settings:'}</strong>{' '}
                  {loyaltySettings.points_per_euro} {language === 'de' ? 'Punkt(e) pro €1' : 'point(s) per €1'} |{' '}
                  1 Punkt = €{loyaltySettings.points_value_euro} |{' '}
                  Min. {loyaltySettings.min_points_redeem} Punkte zum Einlösen
                </div>
              </div>
            )}

            {/* Customers with Points */}
            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-6 py-4 border-b border-[#E5E0D8]">
                <h3 className="font-serif text-lg text-[#2D2A26]">
                  {language === 'de' ? 'Kunden & Punktestand' : 'Customers & Points'}
                </h3>
              </div>
              {loyaltyCustomers.length === 0 ? (
                <div className="p-8 text-center text-[#969088]">
                  {language === 'de' ? 'Noch keine Kunden mit Treuepunkten' : 'No customers with loyalty points yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9F8F6]">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Kunde' : 'Customer'}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">E-Mail</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Punkte' : 'Points'}</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Verdient' : 'Earned'}</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Eingelöst' : 'Redeemed'}</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Aktionen' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8]">
                      {loyaltyCustomers.map(customer => (
                        <tr key={customer.id} className="hover:bg-[#F9F8F6]">
                          <td className="px-5 py-4">
                            <div className="font-medium text-[#2D2A26]">{customer.first_name} {customer.last_name}</div>
                          </td>
                          <td className="px-5 py-4 text-[#5C5852]">{customer.email}</td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 font-bold ${customer.loyalty_points > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                              <Star size={14} />
                              {customer.loyalty_points.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center text-green-600">+{customer.earned_points.toLocaleString()}</td>
                          <td className="px-5 py-4 text-center text-red-500">-{customer.redeemed_points.toLocaleString()}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const headers = { Authorization: `Bearer ${token}` };
                                    const res = await axios.get(`${API}/admin/loyalty/customers/${customer.id}`, { headers });
                                    setSelectedLoyaltyCustomer(res.data);
                                    setLoyaltyTransactions(res.data.transactions || []);
                                  } catch (e) {
                                    toast.error('Fehler beim Laden');
                                  }
                                }}
                                className="p-2 hover:bg-[#F2EFE9] rounded"
                                title={language === 'de' ? 'Details' : 'Details'}
                              >
                                <History size={16} className="text-[#969088]" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLoyaltyCustomer({ customer, loyalty_points: customer.loyalty_points });
                                  setPointsAdjustForm({ points: 0, reason: '' });
                                  setShowPointsAdjust(true);
                                }}
                                className="p-2 hover:bg-[#F2EFE9] rounded"
                                title={language === 'de' ? 'Punkte anpassen' : 'Adjust points'}
                              >
                                <Edit2 size={16} className="text-[#8B2E2E]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Transaction History Modal */}
            {selectedLoyaltyCustomer && !showPointsAdjust && (
              <div className="bg-white border border-[#E5E0D8] mt-4">
                <div className="px-6 py-4 border-b border-[#E5E0D8] flex items-center justify-between">
                  <h3 className="font-serif text-lg text-[#2D2A26]">
                    {language === 'de' ? 'Punkte-Historie:' : 'Points History:'} {selectedLoyaltyCustomer.customer?.first_name} {selectedLoyaltyCustomer.customer?.last_name}
                  </h3>
                  <button onClick={() => setSelectedLoyaltyCustomer(null)} className="p-2 hover:bg-[#F2EFE9] rounded">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="mb-4 p-4 bg-[#F9F8F6] flex items-center justify-between">
                    <span className="text-[#5C5852]">{language === 'de' ? 'Aktueller Stand:' : 'Current balance:'}</span>
                    <span className="font-bold text-xl text-[#8B2E2E]">{selectedLoyaltyCustomer.loyalty_points?.toLocaleString()} Punkte</span>
                  </div>
                  {loyaltyTransactions.length === 0 ? (
                    <p className="text-center text-[#969088] py-4">{language === 'de' ? 'Keine Transaktionen' : 'No transactions'}</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {loyaltyTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-[#F9F8F6] border border-[#E5E0D8]">
                          <div>
                            <p className="font-medium text-[#2D2A26]">{tx.reason}</p>
                            <p className="text-xs text-[#969088]">
                              {new Date(tx.created_at).toLocaleDateString('de-AT')} • {tx.type}
                              {tx.created_by && ` • von ${tx.created_by}`}
                            </p>
                          </div>
                          <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.points > 0 ? '+' : ''}{tx.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#2D2A26]">
                {language === 'de' ? 'Gutscheine & Rabattcodes' : 'Coupons & Discount Codes'}
              </h2>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setCouponForm({
                    code: '', discount_type: 'percent', discount_value: 10, min_order_value: '',
                    max_uses: '', valid_from: '', valid_until: '', description: '', is_active: true
                  });
                  setShowCouponForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#8B2E2E] text-white hover:bg-[#7a2828] transition-colors"
              >
                <Plus size={18} />
                {language === 'de' ? 'Neuer Gutschein' : 'New Coupon'}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <Gift className="w-8 h-8 text-[#8B2E2E] mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">{coupons.length}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Gutscheine gesamt' : 'Total coupons'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">{coupons.filter(c => c.is_active).length}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Aktiv' : 'Active'}</p>
              </div>
              <div className="bg-white border border-[#E5E0D8] p-4 text-center">
                <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-serif text-2xl text-[#2D2A26]">{coupons.reduce((sum, c) => sum + (c.uses_count || 0), 0)}</p>
                <p className="text-sm text-[#969088]">{language === 'de' ? 'Nutzungen' : 'Uses'}</p>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white border border-[#E5E0D8]">
              <div className="px-6 py-4 border-b border-[#E5E0D8]">
                <h3 className="font-serif text-lg text-[#2D2A26]">
                  {language === 'de' ? 'Alle Gutscheine' : 'All Coupons'}
                </h3>
              </div>
              {coupons.length === 0 ? (
                <div className="p-8 text-center text-[#969088]">
                  {language === 'de' ? 'Noch keine Gutscheine erstellt' : 'No coupons created yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9F8F6]">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">Code</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Rabatt' : 'Discount'}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Mindestbestellung' : 'Min. Order'}</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Nutzungen' : 'Uses'}</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-[#969088] uppercase">Status</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-[#969088] uppercase">{language === 'de' ? 'Aktionen' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8]">
                      {coupons.map(coupon => (
                        <tr key={coupon.id} className="hover:bg-[#F9F8F6]">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-[#8B2E2E] bg-[#8B2E2E]/10 px-2 py-1">{coupon.code}</span>
                            {coupon.description && <p className="text-xs text-[#969088] mt-1">{coupon.description}</p>}
                          </td>
                          <td className="px-5 py-4 font-medium">
                            {coupon.discount_type === 'percent' ? `${coupon.discount_value || 0}%` : `€${(coupon.discount_value || 0).toFixed(2)}`}
                          </td>
                          <td className="px-5 py-4 text-[#5C5852]">
                            {coupon.min_order_value ? `€${(coupon.min_order_value || 0).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="text-[#5C5852]">{coupon.uses_count || 0}</span>
                            {coupon.max_uses && <span className="text-[#969088]">/{coupon.max_uses}</span>}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {coupon.is_active ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800">{language === 'de' ? 'Aktiv' : 'Active'}</span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600">{language === 'de' ? 'Inaktiv' : 'Inactive'}</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingCoupon(coupon);
                                  setCouponForm({
                                    code: coupon.code,
                                    discount_type: coupon.discount_type,
                                    discount_value: coupon.discount_value,
                                    min_order_value: coupon.min_order_value || '',
                                    max_uses: coupon.max_uses || '',
                                    valid_from: coupon.valid_from ? coupon.valid_from.slice(0, 16) : '',
                                    valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 16) : '',
                                    description: coupon.description || '',
                                    is_active: coupon.is_active
                                  });
                                  setShowCouponForm(true);
                                }}
                                className="p-2 hover:bg-[#F2EFE9] rounded"
                              >
                                <Edit2 size={16} className="text-[#969088]" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm(language === 'de' ? 'Gutschein wirklich löschen?' : 'Really delete coupon?')) return;
                                  try {
                                    const headers = { Authorization: `Bearer ${token}` };
                                    await axios.delete(`${API}/admin/coupons/${coupon.id}`, { headers });
                                    toast.success(language === 'de' ? 'Gutschein gelöscht' : 'Coupon deleted');
                                    fetchData();
                                  } catch (e) {
                                    toast.error('Fehler');
                                  }
                                }}
                                className="p-2 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} className="text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#2D2A26]">Analytics</h2>
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9]">
                <RefreshCw size={18} />
                {language === 'de' ? 'Aktualisieren' : 'Refresh'}
              </button>
            </div>

            {analytics ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <p className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Bestellungen (30 Tage)' : 'Orders (30 days)'}</p>
                    <p className="font-serif text-3xl text-[#2D2A26] mt-2">{analytics.orders_last_30_days}</p>
                    <p className="text-xs text-[#969088] mt-1">{language === 'de' ? 'Letzte 7 Tage:' : 'Last 7 days:'} {analytics.orders_last_7_days}</p>
                  </div>
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <p className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Umsatz (30 Tage)' : 'Revenue (30 days)'}</p>
                    <p className="font-serif text-3xl text-[#8B2E2E] mt-2">€{analytics.revenue_last_30_days?.toFixed(0) || 0}</p>
                    <p className="text-xs text-[#969088] mt-1">{language === 'de' ? 'Gesamt:' : 'Total:'} €{analytics.total_revenue?.toFixed(0) || 0}</p>
                  </div>
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <p className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Ø Bestellwert' : 'Avg. Order Value'}</p>
                    <p className="font-serif text-3xl text-[#2D2A26] mt-2">€{analytics.avg_order_value?.toFixed(2) || 0}</p>
                  </div>
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <p className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Neue Kunden (30 Tage)' : 'New Customers (30 days)'}</p>
                    <p className="font-serif text-3xl text-[#2D2A26] mt-2">{analytics.new_customers_30_days}</p>
                    <p className="text-xs text-[#969088] mt-1">{language === 'de' ? 'Gesamt:' : 'Total:'} {analytics.total_customers}</p>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Revenue Chart */}
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <h3 className="font-serif text-lg text-[#2D2A26] mb-4">{language === 'de' ? 'Umsatz (letzte 30 Tage)' : 'Revenue (last 30 days)'}</h3>
                    <div className="h-48 flex items-end gap-1">
                      {Object.entries(analytics.daily_revenue || {})
                        .sort(([a], [b]) => a.localeCompare(b))
                        .slice(-14)
                        .map(([day, revenue], i) => {
                          const maxRevenue = Math.max(...Object.values(analytics.daily_revenue || {}), 1);
                          const height = (revenue / maxRevenue) * 100;
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center">
                              <div 
                                className="w-full bg-[#8B2E2E] hover:bg-[#722626] transition-colors"
                                style={{ height: `${Math.max(height, 2)}%` }}
                                title={`${day}: €${revenue.toFixed(0)}`}
                              />
                              {i % 2 === 0 && (
                                <span className="text-[8px] text-[#969088] mt-1 rotate-45">{day.slice(5)}</span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Sales by Country */}
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <h3 className="font-serif text-lg text-[#2D2A26] mb-4">{language === 'de' ? 'Umsatz nach Land' : 'Revenue by Country'}</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.country_revenue || {})
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([country, revenue]) => {
                          const maxRevenue = Math.max(...Object.values(analytics.country_revenue || {}), 1);
                          const width = (revenue / maxRevenue) * 100;
                          return (
                            <div key={country}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#2D2A26]">{country}</span>
                                <span className="text-[#8B2E2E] font-medium">€{revenue.toFixed(0)}</span>
                              </div>
                              <div className="h-2 bg-[#F2EFE9] rounded">
                                <div className="h-full bg-[#8B2E2E] rounded" style={{ width: `${width}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      {Object.keys(analytics.country_revenue || {}).length === 0 && (
                        <p className="text-[#969088] text-center py-4">{language === 'de' ? 'Keine Daten' : 'No data'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* More Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Sales */}
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <h3 className="font-serif text-lg text-[#2D2A26] mb-4">{language === 'de' ? 'Verkäufe nach Kategorie' : 'Sales by Category'}</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.category_sales || {})
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => {
                          const categoryNames = {
                            likoer: 'Likör', edelbrand: 'Edelbrand', marmelade: 'Marmelade',
                            chutney: 'Chutney', pralinen: 'Pralinen', schokolade: 'Schokolade'
                          };
                          return (
                            <div key={category} className="flex items-center justify-between py-2 border-b border-[#E5E0D8]">
                              <span className="text-[#2D2A26]">{categoryNames[category] || category}</span>
                              <span className="font-serif text-[#8B2E2E]">{count} {language === 'de' ? 'verkauft' : 'sold'}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white border border-[#E5E0D8] p-5">
                    <h3 className="font-serif text-lg text-[#2D2A26] mb-4">{language === 'de' ? 'Top 10 Produkte' : 'Top 10 Products'}</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(analytics.top_products || []).map((product, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-[#E5E0D8]">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-[#8B2E2E]/10 text-[#8B2E2E] flex items-center justify-center text-sm font-bold">{i + 1}</span>
                            <span className="text-[#2D2A26] text-sm">{product.name_de}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-serif text-[#8B2E2E]">{product.sold_count || 0}</span>
                            <span className="text-xs text-[#969088] ml-1">{language === 'de' ? 'Stk.' : 'pcs'}</span>
                          </div>
                        </div>
                      ))}
                      {(analytics.top_products || []).length === 0 && (
                        <p className="text-[#969088] text-center py-4">{language === 'de' ? 'Keine Daten' : 'No data'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-[#E5E0D8] p-12 text-center">
                <RefreshCw className="w-8 h-8 text-[#969088] mx-auto mb-3 animate-spin" />
                <p className="text-[#969088]">{language === 'de' ? 'Lade Analytics...' : 'Loading analytics...'}</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Coupon Form Modal */}
      <AnimatePresence>
        {showCouponForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">
                  {editingCoupon ? (language === 'de' ? 'Gutschein bearbeiten' : 'Edit Coupon') : (language === 'de' ? 'Neuer Gutschein' : 'New Coupon')}
                </h2>
                <button onClick={() => setShowCouponForm(false)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-[#969088] uppercase">Code</label>
                  <Input
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="mt-1 font-mono"
                    placeholder="z.B. SOMMER20"
                    disabled={!!editingCoupon}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Rabatt-Typ' : 'Discount Type'}</label>
                    <select
                      value={couponForm.discount_type}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-[#E5E0D8]"
                    >
                      <option value="percent">{language === 'de' ? 'Prozent (%)' : 'Percent (%)'}</option>
                      <option value="fixed">{language === 'de' ? 'Fixbetrag (€)' : 'Fixed (€)'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Rabatt-Wert' : 'Discount Value'}</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Mindestbestellung (€)' : 'Min. Order (€)'}</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={couponForm.min_order_value}
                      onChange={(e) => setCouponForm({ ...couponForm, min_order_value: e.target.value })}
                      className="mt-1"
                      placeholder="optional"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Max. Nutzungen' : 'Max. Uses'}</label>
                    <Input
                      type="number"
                      value={couponForm.max_uses}
                      onChange={(e) => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                      className="mt-1"
                      placeholder="unbegrenzt"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Gültig ab' : 'Valid from'}</label>
                    <Input
                      type="datetime-local"
                      value={couponForm.valid_from}
                      onChange={(e) => setCouponForm({ ...couponForm, valid_from: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Gültig bis' : 'Valid until'}</label>
                    <Input
                      type="datetime-local"
                      value={couponForm.valid_until}
                      onChange={(e) => setCouponForm({ ...couponForm, valid_until: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Beschreibung' : 'Description'}</label>
                  <Input
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    className="mt-1"
                    placeholder={language === 'de' ? 'z.B. Sommeraktion 2025' : 'e.g. Summer Sale 2025'}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={couponForm.is_active}
                    onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="couponActive" className="text-[#2D2A26]">
                    {language === 'de' ? 'Gutschein aktiv' : 'Coupon active'}
                  </label>
                </div>
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowCouponForm(false)} className="px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9]">
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  disabled={!couponForm.code || !couponForm.discount_value}
                  onClick={async () => {
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      const payload = {
                        ...couponForm,
                        min_order_value: couponForm.min_order_value ? parseFloat(couponForm.min_order_value) : null,
                        max_uses: couponForm.max_uses ? parseInt(couponForm.max_uses) : null,
                        valid_from: couponForm.valid_from || null,
                        valid_until: couponForm.valid_until || null
                      };
                      
                      if (editingCoupon) {
                        await axios.put(`${API}/admin/coupons/${editingCoupon.id}`, payload, { headers });
                        toast.success(language === 'de' ? 'Gutschein aktualisiert' : 'Coupon updated');
                      } else {
                        await axios.post(`${API}/admin/coupons`, payload, { headers });
                        toast.success(language === 'de' ? 'Gutschein erstellt' : 'Coupon created');
                      }
                      setShowCouponForm(false);
                      fetchData();
                    } catch (e) {
                      toast.error(e.response?.data?.detail || 'Fehler');
                    }
                  }}
                  className="px-4 py-2 bg-[#8B2E2E] text-white hover:bg-[#7a2828] disabled:opacity-50"
                >
                  <Save size={16} className="inline mr-2" />
                  {language === 'de' ? 'Speichern' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loyalty Settings Modal */}
      <AnimatePresence>
        {showLoyaltySettings && loyaltySettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">{language === 'de' ? 'Treuepunkte Einstellungen' : 'Loyalty Settings'}</h2>
                <button onClick={() => setShowLoyaltySettings(false)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Punkte pro €1 Umsatz' : 'Points per €1 spent'}</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={loyaltySettings.points_per_euro}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_per_euro: parseFloat(e.target.value) || 1 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Wert pro Punkt (€)' : 'Value per point (€)'}</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={loyaltySettings.points_value_euro}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_value_euro: parseFloat(e.target.value) || 0.01 })}
                    className="mt-1"
                  />
                  <p className="text-xs text-[#969088] mt-1">
                    100 Punkte = €{(100 * (loyaltySettings.points_value_euro || 0.01)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Mindestpunkte zum Einlösen' : 'Min. points to redeem'}</label>
                  <Input
                    type="number"
                    value={loyaltySettings.min_points_redeem}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, min_points_redeem: parseInt(e.target.value) || 100 })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="loyaltyActive"
                    checked={loyaltySettings.is_active}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="loyaltyActive" className="text-[#2D2A26]">
                    {language === 'de' ? 'Treuepunkte-System aktiv' : 'Loyalty system active'}
                  </label>
                </div>
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowLoyaltySettings(false)} className="px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9]">
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      await axios.put(`${API}/admin/loyalty/settings`, loyaltySettings, { headers });
                      toast.success(language === 'de' ? 'Einstellungen gespeichert' : 'Settings saved');
                      setShowLoyaltySettings(false);
                      fetchData();
                    } catch (e) {
                      toast.error('Fehler');
                    }
                  }}
                  className="px-4 py-2 bg-[#8B2E2E] text-white hover:bg-[#7a2828]"
                >
                  <Save size={16} className="inline mr-2" />
                  {language === 'de' ? 'Speichern' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Points Adjustment Modal */}
      <AnimatePresence>
        {showPointsAdjust && selectedLoyaltyCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">{language === 'de' ? 'Punkte anpassen' : 'Adjust Points'}</h2>
                <button onClick={() => { setShowPointsAdjust(false); setSelectedLoyaltyCustomer(null); }} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-[#F9F8F6] text-center">
                  <p className="text-sm text-[#969088]">{selectedLoyaltyCustomer.customer?.first_name} {selectedLoyaltyCustomer.customer?.last_name}</p>
                  <p className="text-2xl font-bold text-[#8B2E2E]">{selectedLoyaltyCustomer.loyalty_points || 0} Punkte</p>
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Punkte hinzufügen/abziehen' : 'Add/Remove points'}</label>
                  <Input
                    type="number"
                    value={pointsAdjustForm.points}
                    onChange={(e) => setPointsAdjustForm({ ...pointsAdjustForm, points: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                    placeholder="+100 oder -50"
                  />
                  <p className="text-xs text-[#969088] mt-1">
                    {language === 'de' ? 'Positiv = hinzufügen, Negativ = abziehen' : 'Positive = add, Negative = subtract'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Grund' : 'Reason'}</label>
                  <Input
                    value={pointsAdjustForm.reason}
                    onChange={(e) => setPointsAdjustForm({ ...pointsAdjustForm, reason: e.target.value })}
                    className="mt-1"
                    placeholder={language === 'de' ? 'z.B. Bonus für Treue' : 'e.g. Loyalty bonus'}
                  />
                </div>
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => { setShowPointsAdjust(false); setSelectedLoyaltyCustomer(null); }} className="px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9]">
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  disabled={!pointsAdjustForm.reason || pointsAdjustForm.points === 0}
                  onClick={async () => {
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      await axios.post(`${API}/admin/loyalty/customers/${selectedLoyaltyCustomer.customer?.id}/adjust`, pointsAdjustForm, { headers });
                      toast.success(language === 'de' ? 'Punkte angepasst!' : 'Points adjusted!');
                      setShowPointsAdjust(false);
                      setSelectedLoyaltyCustomer(null);
                      fetchData();
                    } catch (e) {
                      toast.error('Fehler');
                    }
                  }}
                  className="px-4 py-2 bg-[#8B2E2E] text-white hover:bg-[#7a2828] disabled:opacity-50"
                >
                  {language === 'de' ? 'Anpassen' : 'Adjust'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showProductForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">{editingProduct ? (language === 'de' ? 'Bearbeiten' : 'Edit') : (language === 'de' ? 'Neues Produkt' : 'New Product')}</h2>
                <button onClick={() => setShowProductForm(false)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-[#969088] uppercase">Name (DE)</label><Input value={productForm.name_de} onChange={(e) => setProductForm(p => ({ ...p, name_de: e.target.value }))} className="mt-1" /></div>
                  <div><label className="text-xs text-[#969088] uppercase">Name (EN)</label><Input value={productForm.name_en} onChange={(e) => setProductForm(p => ({ ...p, name_en: e.target.value }))} className="mt-1" /></div>
                </div>
                <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Beschreibung (DE)' : 'Description (DE)'}</label><textarea value={productForm.description_de} onChange={(e) => setProductForm(p => ({ ...p, description_de: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] outline-none" /></div>
                <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Beschreibung (EN)' : 'Description (EN)'}</label><textarea value={productForm.description_en} onChange={(e) => setProductForm(p => ({ ...p, description_en: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 border border-[#E5E0D8] focus:border-[#8B2E2E] outline-none" /></div>
                <div className="grid grid-cols-4 gap-4">
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Preis' : 'Price'}</label><Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm(p => ({ ...p, price: e.target.value }))} className="mt-1" /></div>
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Alter Preis' : 'Old Price'}</label><Input type="number" step="0.01" value={productForm.original_price} onChange={(e) => setProductForm(p => ({ ...p, original_price: e.target.value }))} className="mt-1" /></div>
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Bestand' : 'Stock'}</label><Input type="number" value={productForm.stock} onChange={(e) => setProductForm(p => ({ ...p, stock: e.target.value }))} className="mt-1" /></div>
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Alkohol %' : 'Alcohol %'}</label><Input type="number" step="0.1" value={productForm.alcohol_content} onChange={(e) => setProductForm(p => ({ ...p, alcohol_content: e.target.value }))} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Kategorie' : 'Category'}</label><select value={productForm.category} onChange={(e) => setProductForm(p => ({ ...p, category: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-[#E5E0D8]"><option value="likoer">Likör</option><option value="edelbrand">Edelbrand</option><option value="chutney">Chutney</option><option value="marmelade">Marmelade</option><option value="pralinen">Pralinen</option><option value="schokolade">Schokolade</option><option value="geschenk">Geschenkset</option></select></div>
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Volumen (ml)' : 'Volume (ml)'}</label><Input type="number" value={productForm.volume_ml} onChange={(e) => setProductForm(p => ({ ...p, volume_ml: e.target.value }))} className="mt-1" /></div>
                  <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Gewicht (g)' : 'Weight (g)'}</label><Input type="number" value={productForm.weight_g} onChange={(e) => setProductForm(p => ({ ...p, weight_g: e.target.value }))} className="mt-1" placeholder="optional" /></div>
                </div>
                <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Bild-URL' : 'Image URL'}</label><Input value={productForm.image_url} onChange={(e) => setProductForm(p => ({ ...p, image_url: e.target.value }))} className="mt-1" /></div>
                <div className="flex gap-6 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={productForm.is_featured} onChange={(e) => setProductForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Featured</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={productForm.is_limited} onChange={(e) => setProductForm(p => ({ ...p, is_limited: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">{language === 'de' ? 'Limitiert' : 'Limited'}</span></label>
                  <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-1 border border-amber-200"><input type="checkbox" checked={productForm.is_18_plus} onChange={(e) => setProductForm(p => ({ ...p, is_18_plus: e.target.checked }))} className="w-4 h-4 accent-amber-600" /><span className="text-sm text-amber-800 font-medium">Ab 18</span></label>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowProductForm(false)} className="btn-secondary">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                <button onClick={handleSaveProduct} className="btn-primary flex items-center gap-2"><Save size={18} />{language === 'de' ? 'Speichern' : 'Save'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Form Modal */}
      <AnimatePresence>
        {showExpenseForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">{language === 'de' ? 'Neue Ausgabe' : 'New Expense'}</h2>
                <button onClick={() => setShowExpenseForm(false)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Beschreibung' : 'Description'}</label><Input value={expenseForm.description} onChange={(e) => setExpenseForm(p => ({ ...p, description: e.target.value }))} className="mt-1" placeholder={language === 'de' ? 'z.B. Flaschenlieferung' : 'e.g. Bottle delivery'} /></div>
                <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Betrag (€)' : 'Amount (€)'}</label><Input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm(p => ({ ...p, amount: e.target.value }))} className="mt-1" /></div>
                <div><label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Kategorie' : 'Category'}</label><select value={expenseForm.category} onChange={(e) => setExpenseForm(p => ({ ...p, category: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-[#E5E0D8]">
                  {expenseCategories.map(cat => (<option key={cat.id} value={cat.id}>{language === 'de' ? cat.de : cat.en}</option>))}
                </select></div>
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowExpenseForm(false)} className="btn-secondary">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                <button onClick={handleSaveExpense} className="btn-primary">{language === 'de' ? 'Speichern' : 'Save'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="font-serif text-xl text-[#2D2A26]">{language === 'de' ? 'Bestelldetails' : 'Order Details'}</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                {/* Tracking & Status */}
                <div className="bg-[#F9F8F6] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#969088] uppercase">Tracking</p>
                    <p className="font-mono text-lg text-[#8B2E2E]">{selectedOrder.tracking_number}</p>
                  </div>
                  <span className={`text-sm px-3 py-1.5 font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-serif text-lg text-[#2D2A26] mb-3">{language === 'de' ? 'Kundeninformationen' : 'Customer Information'}</h3>
                  <div className="grid grid-cols-2 gap-4 bg-[#F9F8F6] p-4">
                    <div><p className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Name' : 'Name'}</p><p className="font-medium mt-1">{selectedOrder.customer_name}</p></div>
                    <div><p className="text-xs text-[#969088] uppercase">Email</p><p className="text-sm mt-1">{selectedOrder.customer_email}</p></div>
                    <div><p className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Telefon' : 'Phone'}</p><p className="text-sm mt-1">{selectedOrder.customer_phone}</p></div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-serif text-lg text-[#2D2A26] mb-3 flex items-center gap-2">
                    <MapPin size={18} />
                    {language === 'de' ? 'Lieferadresse' : 'Shipping Address'}
                  </h3>
                  <div className="bg-[#F9F8F6] p-4">
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-[#5C5852] mt-1">{selectedOrder.shipping_address}</p>
                    <p className="text-sm text-[#5C5852]">{selectedOrder.shipping_postal} {selectedOrder.shipping_city}</p>
                    <p className="text-sm text-[#5C5852]">{selectedOrder.shipping_country}</p>
                  </div>
                </div>

                {/* Ordered Products */}
                <div>
                  <h3 className="font-serif text-lg text-[#2D2A26] mb-3 flex items-center gap-2">
                    <Package size={18} />
                    {language === 'de' ? 'Bestellte Produkte' : 'Ordered Products'}
                  </h3>
                  <div className="border border-[#E5E0D8] divide-y divide-[#E5E0D8]">
                    {selectedOrder.item_details && selectedOrder.item_details.length > 0 ? (
                      selectedOrder.item_details.map((item, index) => (
                        <div key={index} className="p-4 flex items-center gap-4">
                          <img 
                            src={item.product_image_url} 
                            alt={language === 'de' ? item.product_name_de : item.product_name_en}
                            className="w-16 h-16 object-cover bg-[#F2EFE9]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#2D2A26]">
                              {language === 'de' ? item.product_name_de : item.product_name_en}
                            </p>
                            <p className="text-sm text-[#969088] mt-1">
                              {item.quantity} × €{item.product_price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif text-lg text-[#8B2E2E]">€{item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Fallback for old orders without item_details */
                      selectedOrder.items?.map((item, index) => (
                        <div key={index} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[#2D2A26]">Produkt #{item.product_id.slice(0, 8)}</p>
                            <p className="text-sm text-[#969088]">{language === 'de' ? 'Menge' : 'Quantity'}: {item.quantity}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t-2 border-[#E5E0D8] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5C5852]">{language === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
                    <span>€{(selectedOrder.subtotal || selectedOrder.total_amount - (selectedOrder.shipping_cost || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5C5852]">{language === 'de' ? 'Versand' : 'Shipping'}</span>
                    <span>{selectedOrder.shipping_cost > 0 ? `€${selectedOrder.shipping_cost.toFixed(2)}` : (language === 'de' ? 'Gratis' : 'Free')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E5E0D8]">
                    <span className="font-serif text-xl">{language === 'de' ? 'Gesamt' : 'Total'}</span>
                    <span className="font-serif text-2xl text-[#8B2E2E]">€{selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-4">
                    <p className="text-xs text-amber-600 uppercase mb-1">{language === 'de' ? 'Kundenanmerkungen' : 'Customer Notes'}</p>
                    <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Admin Notes */}
                <div className="border border-[#E5E0D8] p-4">
                  <p className="text-xs text-[#969088] uppercase mb-2">{language === 'de' ? 'Admin-Notiz' : 'Admin Notes'}</p>
                  <textarea
                    value={selectedOrder.admin_notes || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, admin_notes: e.target.value })}
                    placeholder={language === 'de' ? 'Interne Notizen zur Bestellung...' : 'Internal notes about this order...'}
                    className="w-full p-2 border border-[#E5E0D8] text-sm resize-none focus:outline-none focus:border-[#8B2E2E]"
                    rows={3}
                  />
                  <button
                    onClick={async () => {
                      try {
                        const headers = { Authorization: `Bearer ${token}` };
                        await axios.put(`${API}/admin/orders/${selectedOrder.id}/notes`, { notes: selectedOrder.admin_notes }, { headers });
                        toast.success(language === 'de' ? 'Notiz gespeichert' : 'Note saved');
                      } catch (e) {
                        toast.error('Fehler');
                      }
                    }}
                    className="mt-2 px-3 py-1 text-sm bg-[#F2EFE9] hover:bg-[#E5E0D8] text-[#2D2A26] transition-colors"
                  >
                    <Save size={14} className="inline mr-1" />
                    {language === 'de' ? 'Notiz speichern' : 'Save Note'}
                  </button>
                </div>

                {/* Order Date & Invoice */}
                <div className="text-center space-y-3">
                  <p className="text-sm text-[#969088]">
                    {language === 'de' ? 'Bestellt am' : 'Ordered on'}: {new Date(selectedOrder.created_at).toLocaleDateString('de-AT', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {selectedOrder.invoice_number && (
                    <p className="text-sm text-[#969088]">
                      {language === 'de' ? 'Rechnungsnr.' : 'Invoice No.'}: <span className="font-medium text-[#2D2A26]">{selectedOrder.invoice_number}</span>
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        const response = await axios.get(
                          `${API}/admin/orders/${selectedOrder.id}/invoice`,
                          {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: 'blob'
                          }
                        );
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `Rechnung_${selectedOrder.invoice_number || selectedOrder.tracking_number}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        toast.error(language === 'de' ? 'Fehler beim Herunterladen' : 'Download failed');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2EFE9] hover:bg-[#E5E0D8] text-[#2D2A26] text-sm transition-colors"
                  >
                    <Download size={16} />
                    {language === 'de' ? 'Rechnung herunterladen' : 'Download Invoice'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Create Modal */}
      <AnimatePresence>
        {showAdminForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">{language === 'de' ? 'Neuen Admin erstellen' : 'Create New Admin'}</h2>
                <button onClick={() => setShowAdminForm(false)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">Email</label>
                  <Input 
                    type="email" 
                    value={adminForm.email} 
                    onChange={(e) => setAdminForm(p => ({ ...p, email: e.target.value }))} 
                    placeholder="neuer.admin@example.com" 
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">{language === 'de' ? 'Passwort' : 'Password'}</label>
                  <Input 
                    type="password" 
                    value={adminForm.password} 
                    onChange={(e) => setAdminForm(p => ({ ...p, password: e.target.value }))} 
                    placeholder="••••••••" 
                    className="input-elegant"
                  />
                  <p className="text-xs text-[#969088] mt-1">{language === 'de' ? 'Mindestens 6 Zeichen' : 'At least 6 characters'}</p>
                </div>
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowAdminForm(false)} className="btn-secondary">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                <button onClick={handleCreateAdmin} className="btn-primary flex items-center gap-2">
                  <UserPlus size={18} />{language === 'de' ? 'Erstellen' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Notes Modal */}
      <AnimatePresence>
        {selectedCustomerForNotes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">
                  {language === 'de' ? 'Notiz zu Kunde' : 'Customer Note'}
                </h2>
                <button onClick={() => setSelectedCustomerForNotes(null)} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-[#F9F8F6] border border-[#E5E0D8]">
                  <p className="font-medium text-[#2D2A26]">{selectedCustomerForNotes.first_name} {selectedCustomerForNotes.last_name}</p>
                  <p className="text-sm text-[#969088]">{selectedCustomerForNotes.email}</p>
                </div>
                <label className="text-xs text-[#969088] uppercase">{language === 'de' ? 'Interne Notiz' : 'Internal Note'}</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={language === 'de' ? 'Notizen zu diesem Kunden...' : 'Notes about this customer...'}
                  className="w-full mt-1 p-3 border border-[#E5E0D8] focus:outline-none focus:border-[#8B2E2E] resize-none"
                  rows={4}
                />
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setSelectedCustomerForNotes(null)} className="px-4 py-2 border border-[#E5E0D8] hover:bg-[#F2EFE9]">
                  {language === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      await axios.put(`${API}/admin/customers/${selectedCustomerForNotes.id}/notes`, { notes: customerNotes }, { headers });
                      toast.success(language === 'de' ? 'Notiz gespeichert' : 'Note saved');
                      setSelectedCustomerForNotes(null);
                      fetchData();
                    } catch (e) {
                      toast.error('Fehler');
                    }
                  }}
                  className="px-4 py-2 bg-[#8B2E2E] text-white hover:bg-[#7a2828]"
                >
                  <Save size={16} className="inline mr-2" />
                  {language === 'de' ? 'Speichern' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shipping Rate Modal */}
      <AnimatePresence>
        {showShippingForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white w-full max-w-md">
              <div className="border-b border-[#E5E0D8] px-6 py-4 flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2D2A26]">
                  {editingShipping 
                    ? (language === 'de' ? 'Versandkosten bearbeiten' : 'Edit Shipping Rate')
                    : (language === 'de' ? 'Neues Land hinzufügen' : 'Add New Country')
                  }
                </h2>
                <button onClick={() => { setShowShippingForm(false); setEditingShipping(null); }} className="p-2 hover:bg-[#F2EFE9] rounded"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">{language === 'de' ? 'Land' : 'Country'}</label>
                  <Input 
                    value={shippingForm.country} 
                    onChange={(e) => setShippingForm(p => ({ ...p, country: e.target.value }))} 
                    placeholder={language === 'de' ? 'z.B. Österreich' : 'e.g. Austria'}
                    className="input-elegant"
                    disabled={!!editingShipping}
                  />
                  {editingShipping && (
                    <p className="text-xs text-[#969088] mt-1">{language === 'de' ? 'Land kann nicht geändert werden' : 'Country cannot be changed'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">{language === 'de' ? 'Versandkosten (€)' : 'Shipping Rate (€)'}</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={shippingForm.rate} 
                    onChange={(e) => setShippingForm(p => ({ ...p, rate: e.target.value }))} 
                    placeholder="9.90"
                    className="input-elegant"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#969088] uppercase tracking-wider mb-2 block">{language === 'de' ? 'Gratis-Versand ab (€)' : 'Free Shipping From (€)'}</label>
                  <Input 
                    type="number" 
                    step="1"
                    value={shippingForm.free_shipping_threshold} 
                    onChange={(e) => setShippingForm(p => ({ ...p, free_shipping_threshold: e.target.value }))} 
                    placeholder="50"
                    className="input-elegant"
                  />
                  <p className="text-xs text-[#969088] mt-1">{language === 'de' ? '0 = kein Gratis-Versand' : '0 = no free shipping'}</p>
                </div>
              </div>
              <div className="border-t border-[#E5E0D8] px-6 py-4 flex justify-end gap-3">
                <button onClick={() => { setShowShippingForm(false); setEditingShipping(null); }} className="btn-secondary">{language === 'de' ? 'Abbrechen' : 'Cancel'}</button>
                <button onClick={handleSaveShippingRate} className="btn-primary flex items-center gap-2">
                  <Save size={18} />{language === 'de' ? 'Speichern' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
