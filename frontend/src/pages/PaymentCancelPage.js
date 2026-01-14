import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PaymentCancelPage() {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="payment-cancel-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-20 h-20 bg-[#5C5852] flex items-center justify-center mx-auto mb-8"
          >
            <XCircle size={40} className="text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">
              {language === 'de' ? 'Zahlung abgebrochen' : 'Payment Cancelled'}
            </h1>
            <p className="text-[#5C5852] mt-4 text-lg max-w-md mx-auto">
              {language === 'de' 
                ? 'Die Zahlung wurde abgebrochen. Ihr Warenkorb wurde nicht geleert - Sie können es jederzeit erneut versuchen.' 
                : 'The payment was cancelled. Your cart has not been cleared - you can try again at any time.'}
            </p>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 border border-amber-200 p-6 mt-8"
        >
          <div className="flex items-start gap-4">
            <RefreshCw size={24} className="text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-lg text-[#2D2A26]">
                {language === 'de' ? 'Keine Sorge!' : 'Don\'t worry!'}
              </h3>
              <p className="text-sm text-amber-800 mt-2">
                {language === 'de' 
                  ? 'Es wurde keine Zahlung abgebucht. Ihre Artikel sind noch im Warenkorb gespeichert.' 
                  : 'No payment has been charged. Your items are still saved in your cart.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <Link to="/cart" className="btn-primary inline-flex items-center justify-center gap-2">
            <RefreshCw size={18} />
            {language === 'de' ? 'Erneut versuchen' : 'Try Again'}
          </Link>
          <Link to="/shop" className="btn-secondary inline-flex items-center justify-center gap-2">
            <ArrowLeft size={18} />
            {language === 'de' ? 'Weiter einkaufen' : 'Continue Shopping'}
          </Link>
        </motion.div>

        {/* Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-sm text-[#969088]"
        >
          <p>
            {language === 'de' 
              ? 'Probleme mit der Zahlung? Kontaktieren Sie uns:' 
              : 'Having trouble with payment? Contact us:'}
          </p>
          <a href="mailto:info@weingut-boehmer.at" className="text-[#8B2E2E] hover:underline mt-1 inline-block">
            info@weingut-boehmer.at
          </a>
        </motion.div>
      </div>
    </main>
  );
}
