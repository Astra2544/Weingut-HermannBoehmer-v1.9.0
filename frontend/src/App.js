import "@/App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "./components/ui/sonner";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { CookieBanner } from "./components/CookieBanner";
import { LoadingScreen } from "./components/LoadingScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LogoutScreen } from "./components/LogoutScreen";
import { ScrollToTop } from "./components/ScrollToTop";
import ChatWidget from "./components/ChatWidget";

// Pages
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import TrackingPage from "./pages/TrackingPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ImprintPage from "./pages/ImprintPage";
import NotFoundPage from "./pages/NotFoundPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import CheckoutDemoPage from "./pages/CheckoutDemoPage";
import LocationsPage from "./pages/LocationsPage";
import UnderConstructionPage from "./pages/UnderConstructionPage";
import NewsletterUnsubscribePage from "./pages/NewsletterUnsubscribePage";

// Check if site is under construction
const isUnderConstruction = process.env.REACT_APP_UNDER_CONSTRUCTION === 'true';

// Welcome handler component
const WelcomeHandler = () => {
  const { showWelcome, welcomeName, hideWelcome, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleWelcomeComplete = () => {
    hideWelcome();
    // Navigate based on user type
    if (isAdmin) {
      navigate('/admin/dashboard');
    }
    // Customers stay on current page or go home
  };

  return (
    <WelcomeScreen 
      name={welcomeName} 
      isVisible={showWelcome} 
      onComplete={handleWelcomeComplete} 
    />
  );
};

// Logout handler component
const LogoutHandler = () => {
  const { showLogout, logoutName, hideLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutComplete = () => {
    hideLogout();
    navigate('/');
  };

  return (
    <LogoutScreen 
      name={logoutName} 
      isVisible={showLogout} 
      onComplete={handleLogoutComplete} 
    />
  );
};

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // If under construction, show only the under construction page
  if (isUnderConstruction) {
    return <UnderConstructionPage />;
  }

  return (
    <>
      {/* Initial Loading Screen */}
      {isLoading ? (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      ) : (
        <BrowserRouter>
          <ScrollToTop />
          <WelcomeHandler />
          <LogoutHandler />
          <div className="min-h-screen flex flex-col">
            <Routes>
              {/* Admin dashboard - no navbar/footer */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              
              {/* All other routes - with navbar/footer */}
              <Route
                path="*"
                element={
                  <>
                    <Navbar />
                    <div className="flex-1">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/product/:slug" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/locations" element={<LocationsPage />} />
                        <Route path="/tracking" element={<TrackingPage />} />
                        <Route path="/account" element={<CustomerDashboardPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        {/* Legacy routes - redirect to new unified login */}
                        <Route path="/admin" element={<LoginPage />} />
                        <Route path="/account/login" element={<LoginPage />} />
                        <Route path="/account/register" element={<RegisterPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/imprint" element={<ImprintPage />} />
                        <Route path="/payment/success" element={<PaymentSuccessPage />} />
                        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                        <Route path="/checkout/demo" element={<CheckoutDemoPage />} />
                        <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </div>
                    <Footer />
                  </>
                }
              />
            </Routes>
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#2D2A26',
                border: '1px solid #E5E0D8',
                fontFamily: 'Manrope, sans-serif',
              },
            }}
          />
          <CookieBanner />
          <ChatWidget />
        </BrowserRouter>
      )}
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
