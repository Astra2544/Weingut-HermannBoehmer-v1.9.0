import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export const ProductCard = ({ product, index = 0 }) => {
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  const name = language === 'de' ? product.name_de : product.name_en;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      addItem(product, 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className="product-card-luxury group"
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.slug}`}>
        {/* Image */}
        <div className="product-image relative">
          <img
            src={product.image_url}
            alt={name}
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.is_limited && (
              <span className="badge-gold" data-testid="badge-limited">
                {t('products.limited')}
              </span>
            )}
          </div>

          {/* Quick Add */}
          <motion.button
            initial={{ opacity: 0 }}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 w-12 h-12 bg-[#8B2E2E] text-white flex items-center justify-center hover:bg-[#7A2828]"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            data-testid={`quick-add-${product.id}`}
          >
            <ShoppingBag size={18} />
          </motion.button>
        </div>

        {/* Content */}
        <div className="pt-3 sm:pt-4 md:pt-6">
          {/* Category */}
          <span className="overline text-[#969088] text-[10px] sm:text-xs">
            {product.category}
          </span>

          {/* Name */}
          <h3 className="font-serif text-base sm:text-lg md:text-xl text-[#2D2A26] mt-1 sm:mt-2 group-hover:text-[#8B2E2E] transition-colors line-clamp-2">
            {name}
          </h3>

          {/* Details */}
          <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 text-[10px] sm:text-xs text-[#969088]">
            {product.alcohol_content && (
              <span>{product.alcohol_content}% Vol</span>
            )}
            <span>•</span>
            <span>{product.volume_ml}ml</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 sm:gap-3 mt-2 sm:mt-4">
            <span className="font-serif text-lg sm:text-xl md:text-2xl text-[#2D2A26]">
              €{product.price.toFixed(2)}
            </span>
            {product.original_price && (
              <span className="text-xs sm:text-sm text-[#969088] line-through">
                €{product.original_price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Social Proof */}
          {product.sold_count > 50 && (
            <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 text-[10px] sm:text-xs text-[#969088]">
              <Star size={12} className="fill-[#D4AF37] text-[#D4AF37]" />
              <span>{product.sold_count} {language === 'de' ? 'verkauft' : 'sold'}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
