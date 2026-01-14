import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: 'all', de: 'Alle', en: 'All' },
  { id: 'likoer', de: 'Liköre', en: 'Liqueurs' },
  { id: 'edelbrand', de: 'Edelbrände', en: 'Brandies' },
  { id: 'chutney', de: 'Chutney', en: 'Chutney' },
  { id: 'marmelade', de: 'Marmelade', en: 'Jam' },
  { id: 'pralinen', de: 'Pralinen', en: 'Pralines' },
  { id: 'schokolade', de: 'Schokolade', en: 'Chocolate' },
  { id: 'geschenk', de: 'Geschenke', en: 'Gifts' }
];

export default function ShopPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const fetchAttempts = useRef(0);
  const maxRetries = 3;

  const fetchProducts = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = activeCategory === 'all' 
        ? `${API}/products` 
        : `${API}/products?category=${activeCategory}`;
      
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (Array.isArray(response.data)) {
        setProducts(response.data);
        fetchAttempts.current = 0; // Reset on success
        setLoading(false);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`Retrying... attempt ${retryCount + 1}/${maxRetries}`);
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, 500 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(language === 'de' 
        ? 'Produkte konnten nicht geladen werden. Bitte laden Sie die Seite neu.'
        : 'Could not load products. Please refresh the page.');
      setLoading(false);
    }
  }, [activeCategory, language]);

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Refetch when category changes
  useEffect(() => {
    fetchAttempts.current = 0;
    fetchProducts();
  }, [activeCategory, fetchProducts]);

  const handleRetry = () => {
    fetchAttempts.current = 0;
    fetchProducts();
  };

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="shop-page">
      <SEO 
        title={language === 'de' ? 'Shop - Alle Produkte' : 'Shop - All Products'}
        description={language === 'de' 
          ? 'Entdecken Sie unsere handgemachten Marillenprodukte aus der Wachau - Liköre, Edelbrände, Marmeladen, Pralinen und mehr.'
          : 'Discover our handcrafted apricot products from Wachau - liqueurs, brandies, jams, pralines and more.'}
      />
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mb-8 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="overline">
            {language === 'de' ? 'KOLLEKTION' : 'COLLECTION'}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#2D2A26] mt-3 md:mt-4">
            {t('products.all')}
          </h1>
          <p className="text-[#5C5852] mt-4 text-base md:text-lg max-w-2xl">
            {language === 'de'
              ? '100% Handgemacht in Dürnstein - Liköre, Edelbrände, Marmeladen, Chutneys, Pralinen und mehr.'
              : '100% Handmade in Dürnstein - Liqueurs, brandies, jams, chutneys, pralines and more.'}
          </p>
        </motion.div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 md:top-24 z-30 bg-[#F9F8F6]/90 backdrop-blur-xl border-y border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 md:py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-[#8B2E2E] text-white'
                    : 'bg-transparent text-[#5C5852] hover:text-[#2D2A26] border border-[#E5E0D8]'
                }`}
                data-testid={`category-${cat.id}`}
              >
                {language === 'de' ? cat.de : cat.en}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="product-card-luxury">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="pt-4 md:pt-6 space-y-2 md:space-y-3">
                    <div className="h-3 w-16 skeleton" />
                    <div className="h-5 w-full skeleton" />
                    <div className="h-6 md:h-8 w-20 skeleton mt-2 md:mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 md:py-24"
            >
              <p className="text-red-600 text-base md:text-lg mb-4">{error}</p>
              <button 
                onClick={handleRetry}
                className="btn-primary"
              >
                {language === 'de' ? 'Erneut versuchen' : 'Try Again'}
              </button>
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 md:py-24"
            >
              <p className="text-[#5C5852] text-base md:text-lg">
                {language === 'de' 
                  ? 'Keine Produkte in dieser Kategorie gefunden.'
                  : 'No products found in this category.'}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key={activeCategory} // Force re-render on category change
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8"
            >
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
