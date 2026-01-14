import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, User, Settings, LogOut, ChevronDown, ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [dropdownJustOpened, setDropdownJustOpened] = useState(false);
  const dropdownRef = useRef(null);
  const { language, setLanguage, t } = useLanguage();
  const { itemCount } = useCart();
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside - simplified version
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Skip if dropdown was just opened (prevents immediate close on mobile)
      if (dropdownJustOpened) return;
      
      // Check if click is inside the dropdown
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return; // Click inside dropdown, don't close
      }
      
      // Check if click is on any user button (has data-user-toggle attribute)
      if (event.target.closest('[data-user-toggle]')) {
        return; // Click on toggle button, let onClick handle it
      }
      
      setShowUserDropdown(false);
    };
    
    if (showUserDropdown) {
      // Add listener only when dropdown is open
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserDropdown, dropdownJustOpened]);

  // Reset the "just opened" flag after a short delay
  useEffect(() => {
    if (dropdownJustOpened) {
      const timer = setTimeout(() => setDropdownJustOpened(false), 100);
      return () => clearTimeout(timer);
    }
  }, [dropdownJustOpened]);

  const toggleDropdown = useCallback(() => {
    if (!showUserDropdown) {
      setDropdownJustOpened(true);
    }
    setShowUserDropdown(prev => !prev);
  }, [showUserDropdown]);

  const closeMobileMenu = () => setIsMobileOpen(false);

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    closeMobileMenu();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/shop', label: t('nav.shop') },
    { to: '/locations', label: language === 'de' ? 'Standorte' : 'Locations' },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: language === 'de' ? 'Kontakt' : 'Contact' },
    { to: '/tracking', label: t('nav.tracking') },
  ];

  const isActive = (path) => location.pathname === path;

  // All main nav links on the LEFT side of logo: Startseite, Shop, Standorte, Über uns, Kontakt
  const leftNavLinks = [navLinks[0], navLinks[1], navLinks[2], navLinks[3], navLinks[4]]; // Home, Shop, Standorte, Über uns, Kontakt
  const rightNavLinks = [navLinks[5]]; // Only Tracking on right (with cart/user icons)

  // User display name
  const displayName = user?.first_name || 'User';

  // Status indicator component - single dot, static red or animated green
  // Positioned directly on the icon corner
  const StatusIndicator = ({ size = 'normal' }) => (
    <span 
      className={`absolute ${size === 'small' ? 'bottom-1 right-1 w-2 h-2' : 'bottom-0 right-0 w-2.5 h-2.5'} rounded-full ${
        isLoggedIn 
          ? 'bg-green-500 animate-pulse' 
          : 'bg-red-400'
      }`}
    />
  );

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'nav-glass py-4' : 'bg-transparent py-6'
        }`}
        data-testid="navbar"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Mobile - Left (Menu + Home) - fixed width for centering */}
            <div className="flex md:hidden items-center gap-1" style={{ width: '80px' }}>
              <button
                onClick={() => setIsMobileOpen(true)}
                className="text-[#2D2A26] p-1"
                data-testid="mobile-menu-toggle"
              >
                <Menu size={24} />
              </button>
              <Link
                to="/"
                className="text-[#2D2A26] p-1"
                data-testid="mobile-home-link"
              >
                <Home size={22} />
              </Link>
            </div>

            {/* Desktop - Left Nav Links - positioned more to the left */}
            <nav className="hidden md:flex items-center gap-6 mr-auto" data-testid="desktop-nav">
              {leftNavLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link-elegant ${isActive(link.to) ? 'active' : ''}`}
                  data-testid={`nav-link-${link.to.replace('/', '') || 'home'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Center - Logo */}
            <Link 
              to="/" 
              className="md:absolute md:left-1/2 md:-translate-x-1/2"
              data-testid="logo-link"
            >
              <div className="text-center">
                <h1 className="font-serif text-xl md:text-2xl text-[#2D2A26] tracking-tight">
                  Hermann Böhmer
                </h1>
                <p className="text-[0.6rem] tracking-[0.3em] uppercase text-[#969088] mt-0.5">
                  Weingut Dürnstein
                </p>
              </div>
            </Link>

            {/* Mobile - Right (User & Cart) - fixed width for centering */}
            <div className="flex md:hidden items-center gap-1 justify-end relative" style={{ width: '80px' }}>
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    toggleDropdown();
                  } else {
                    navigate('/login');
                  }
                }}
                className="relative text-[#2D2A26] p-1.5 flex items-center justify-center touch-manipulation"
                data-testid="mobile-account-link"
                data-user-toggle="true"
                aria-label="User menu"
                style={{ minWidth: '40px', minHeight: '40px' }}
              >
                <User size={22} />
                <StatusIndicator size="small" />
              </button>
              <Link to="/cart" className="relative text-[#2D2A26] p-1.5 flex items-center justify-center" data-testid="cart-link-mobile" style={{ minWidth: '40px', minHeight: '40px' }}>
                <ShoppingBag size={22} />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              
              {/* Mobile User Dropdown - Rendered via Portal to escape z-index stacking context */}
              {showUserDropdown && isLoggedIn && createPortal(
                <AnimatePresence>
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="md:hidden fixed bg-white border border-[#E5E0D8] shadow-2xl"
                    style={{ 
                      top: '70px',
                      right: '16px',
                      width: '220px',
                      zIndex: 2147483647 // Maximum z-index value
                    }}
                  >
                    <div className="px-4 py-3 border-b border-[#E5E0D8] bg-[#F9F8F6]">
                      <p className="font-medium text-[#2D2A26] text-sm">{displayName}</p>
                      <p className="text-xs text-[#969088] truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] bg-[#8B2E2E] text-white px-2 py-0.5 uppercase">Admin</span>
                      )}
                    </div>
                    <div className="py-2">
                      {isAdmin ? (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#5C5852] hover:bg-[#F2EFE9] active:bg-[#E5E0D8]"
                        >
                          <Settings size={16} />
                          Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          to="/account"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[#5C5852] hover:bg-[#F2EFE9] active:bg-[#E5E0D8]"
                        >
                          <Settings size={16} />
                          {language === 'de' ? 'Einstellungen' : 'Settings'}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#8B2E2E] hover:bg-red-50 active:bg-red-100"
                      >
                        <LogOut size={16} />
                        {language === 'de' ? 'Abmelden' : 'Logout'}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>,
                document.body
              )}
            </div>

            {/* Desktop - Right Nav Links & Actions */}
            <div className="hidden md:flex items-center gap-8">
              {rightNavLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link-elegant ${isActive(link.to) ? 'active' : ''}`}
                  data-testid={`nav-link-${link.to.replace('/', '') || 'home'}`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Language */}
              <div className="lang-switch" data-testid="language-switcher">
                <button
                  onClick={() => setLanguage('de')}
                  className={`lang-btn ${language === 'de' ? 'active' : ''}`}
                  data-testid="lang-de-btn"
                >
                  DE
                </button>
                <span className="text-[#D6D0C4]">/</span>
                <button
                  onClick={() => setLanguage('en')}
                  className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                  data-testid="lang-en-btn"
                >
                  EN
                </button>
              </div>

              {/* User Account with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => isLoggedIn ? toggleDropdown() : navigate('/login')}
                  className="relative text-[#969088] hover:text-[#8B2E2E] transition-colors p-1"
                  data-testid="account-link"
                  data-user-toggle="true"
                  title={isLoggedIn ? displayName : (language === 'de' ? 'Anmelden' : 'Sign In')}
                >
                  <User size={20} />
                  <StatusIndicator />
                </button>

                {/* Desktop Dropdown Menu */}
                <AnimatePresence>
                  {showUserDropdown && isLoggedIn && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E5E0D8] shadow-lg"
                      style={{ zIndex: 999999 }}
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-[#E5E0D8] bg-[#F9F8F6]">
                        <p className="font-medium text-[#2D2A26] text-sm">{displayName}</p>
                        <p className="text-xs text-[#969088] truncate">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 text-[10px] bg-[#8B2E2E] text-white px-2 py-0.5 uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {isAdmin ? (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5C5852] hover:bg-[#F2EFE9] transition-colors"
                          >
                            <Settings size={16} />
                            {language === 'de' ? 'Admin Dashboard' : 'Admin Dashboard'}
                          </Link>
                        ) : (
                          <Link
                            to="/account"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5C5852] hover:bg-[#F2EFE9] transition-colors"
                          >
                            <Settings size={16} />
                            {language === 'de' ? 'Einstellungen' : 'Settings'}
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#8B2E2E] hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          {language === 'de' ? 'Abmelden' : 'Logout'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative text-[#969088] hover:text-[#8B2E2E] transition-colors"
                data-testid="cart-link"
              >
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="cart-badge"
                    data-testid="cart-count"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-menu-elegant"
            data-testid="mobile-menu"
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="font-serif text-2xl text-[#2D2A26]">Hermann Böhmer</h2>
                  <p className="text-xs tracking-widest uppercase text-[#969088]">Weingut</p>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 text-[#2D2A26]"
                  data-testid="mobile-menu-close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* User Status in Mobile Menu - Clickable to go to Dashboard */}
              {isLoggedIn && (
                <Link 
                  to={isAdmin ? "/admin/dashboard" : "/account"}
                  onClick={closeMobileMenu}
                  className="mb-8 pb-6 border-b border-[#E5E0D8] block hover:bg-[#F2EFE9] -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-[#F2EFE9] flex items-center justify-center">
                        <User size={24} className="text-[#8B2E2E]" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#2D2A26]">{displayName}</p>
                      <p className="text-xs text-[#969088]">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] bg-[#8B2E2E] text-white px-2 py-0.5 uppercase">Admin</span>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-[#969088]" />
                  </div>
                </Link>
              )}

              <nav className="flex flex-col gap-5 flex-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={link.to}
                      onClick={closeMobileMenu}
                      className={`font-serif text-3xl ${
                        isActive(link.to) ? 'text-[#8B2E2E]' : 'text-[#2D2A26]'
                      }`}
                      data-testid={`mobile-nav-${link.to.replace('/', '') || 'home'}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Account/Login Link in Mobile Menu */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.08 }}
                >
                  {isLoggedIn ? (
                    <Link
                      to={isAdmin ? "/admin/dashboard" : "/account"}
                      onClick={closeMobileMenu}
                      className={`font-serif text-3xl ${
                        location.pathname.startsWith('/account') || location.pathname.startsWith('/admin')
                          ? 'text-[#8B2E2E]' 
                          : 'text-[#2D2A26]'
                      }`}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="font-serif text-3xl text-[#2D2A26]"
                    >
                      {language === 'de' ? 'Anmelden' : 'Sign In'}
                    </Link>
                  )}
                </motion.div>
              </nav>

              <div className="pt-6 border-t border-[#E5E0D8]">
                <div className="flex items-center justify-between">
                  {/* Language switcher */}
                  <div className="lang-switch">
                    <button onClick={() => setLanguage('de')} className={`lang-btn ${language === 'de' ? 'active' : ''}`}>DE</button>
                    <span className="text-[#D6D0C4] mx-2">/</span>
                    <button onClick={() => setLanguage('en')} className={`lang-btn ${language === 'en' ? 'active' : ''}`}>EN</button>
                  </div>
                  
                  {/* Logout button if logged in */}
                  {isLoggedIn && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-[#8B2E2E] text-sm"
                    >
                      <LogOut size={18} />
                      {language === 'de' ? 'Abmelden' : 'Logout'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
