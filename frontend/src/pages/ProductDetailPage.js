import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus, ArrowLeft, Star, Truck, Shield, Leaf } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { SEO } from '../components/SEO';
import { Breadcrumbs } from '../components/Breadcrumbs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/products/${slug}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      addItem(product, quantity);
      toast.success(language === 'de' ? 'Hinzugefügt' : 'Added to cart', {
        description: `${quantity}x ${language === 'de' ? product.name_de : product.name_en}`
      });
    }
  };

  if (loading) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
            <div className="aspect-square skeleton" />
            <div className="space-y-4 md:space-y-6">
              <div className="h-4 md:h-6 w-24 skeleton" />
              <div className="h-12 md:h-16 w-3/4 skeleton" />
              <div className="h-24 md:h-32 w-full skeleton" />
              <div className="h-10 md:h-12 w-32 skeleton" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16 text-center">
          <h1 className="font-serif text-xl md:text-2xl text-[#2D2A26]">
            {language === 'de' ? 'Produkt nicht gefunden' : 'Product not found'}
          </h1>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2 mt-6 md:mt-8">
            <ArrowLeft size={18} />
            {t('general.back')}
          </Link>
        </div>
      </main>
    );
  }

  const name = language === 'de' ? product.name_de : product.name_en;
  const description = language === 'de' ? product.description_de : product.description_en;

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="product-detail-page">
      <SEO 
        title={name}
        description={description}
        image={product.image_url}
        type="product"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4 md:py-8 lg:py-16">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: language === 'de' ? 'Shop' : 'Shop', href: '/shop' },
            { label: name }
          ]} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden bg-[#F2EFE9]">
              <img
                src={product.image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 md:top-6 left-4 md:left-6 flex flex-col gap-2">
              {product.is_limited && (
                <span className="badge-gold" data-testid="product-badge-limited">
                  {t('products.limited')}
                </span>
              )}
              {product.original_price && (
                <span className="badge-gold">
                  -{Math.round((1 - product.price / product.original_price) * 100)}%
                </span>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col"
          >
            {/* Category */}
            <span className="overline text-[#969088]">
              {product.category.toUpperCase()}
            </span>

            {/* Name */}
            <h1 
              className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2D2A26] mt-2 md:mt-3"
              data-testid="product-name"
            >
              {name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 md:gap-4 mt-4 md:mt-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>
              {product.sold_count > 0 && (
                <span className="text-xs md:text-sm text-[#969088]">
                  {product.sold_count} {language === 'de' ? 'verkauft' : 'sold'}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[#5C5852] text-base md:text-lg mt-6 md:mt-8 leading-relaxed">
              {description}
            </p>

            {/* Specs */}
            <div className="flex flex-wrap gap-6 md:gap-8 mt-6 md:mt-8 py-4 md:py-6 border-y border-[#E5E0D8]">
              {product.alcohol_content && (
                <div>
                  <span className="text-[#969088] text-xs uppercase tracking-wider">{language === 'de' ? 'Alkohol' : 'Alcohol'}</span>
                  <p className="font-serif text-lg md:text-xl text-[#2D2A26] mt-1">{product.alcohol_content}%</p>
                </div>
              )}
              <div>
                <span className="text-[#969088] text-xs uppercase tracking-wider">{language === 'de' ? 'Inhalt' : 'Volume'}</span>
                <p className="font-serif text-lg md:text-xl text-[#2D2A26] mt-1">{product.volume_ml}ml</p>
              </div>
              <div>
                <span className="text-[#969088] text-xs uppercase tracking-wider">{language === 'de' ? 'Verfügbar' : 'Available'}</span>
                <p className={`font-serif text-lg md:text-xl mt-1 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? product.stock : '0'}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mt-6 md:mt-8">
              <div className="flex items-baseline gap-3 md:gap-4">
                <span 
                  className="font-serif text-4xl md:text-5xl text-[#8B2E2E]"
                  data-testid="product-price"
                >
                  €{product.price.toFixed(0)}
                </span>
                {product.original_price && (
                  <span className="text-lg md:text-xl text-[#969088] line-through">
                    €{product.original_price.toFixed(0)}
                  </span>
                )}
              </div>
              <p className="text-[#969088] text-xs md:text-sm mt-1">
                {language === 'de' ? 'inkl. MwSt.' : 'incl. VAT'}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8 md:mt-10">
              <div className="flex items-center border border-[#E5E0D8] self-start">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="qty-btn"
                  disabled={quantity <= 1}
                  data-testid="quantity-minus"
                >
                  <Minus size={16} />
                </button>
                <span 
                  className="w-12 md:w-16 text-center font-medium text-[#2D2A26]"
                  data-testid="quantity-value"
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="qty-btn"
                  disabled={quantity >= product.stock}
                  data-testid="quantity-plus"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag size={18} />
                {t('products.addToCart')}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#E5E0D8]">
              {[
                { icon: Truck, label: language === 'de' ? 'Gratis ab €50' : 'Free over €50' },
                { icon: Shield, label: language === 'de' ? 'Sicher' : 'Secure' },
                { icon: Leaf, label: language === 'de' ? 'Natürlich' : 'Natural' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center text-center">
                  <item.icon size={20} className="text-[#8B2E2E]" />
                  <span className="text-[#969088] text-[10px] md:text-xs mt-2">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
