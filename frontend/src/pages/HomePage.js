import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Leaf, Clock, Star, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from '../components/ProductCard';
import { SEO } from '../components/SEO';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { TestimonialsCarousel } from '../components/TestimonialsCarousel';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, testimonialsRes] = await Promise.all([
          axios.get(`${API}/products?featured=true`),
          axios.get(`${API}/testimonials`)
        ]);
        setProducts(productsRes.data);
        setTestimonials(testimonialsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="bg-[#F9F8F6]" data-testid="home-page">
      <SEO 
        title={language === 'de' ? 'Startseite' : 'Home'}
        description={language === 'de' 
          ? 'Handgemachte Marillenliköre und Edelbrände aus dem Herzen der Wachau. Seit 1952 Tradition und Qualität.'
          : 'Handcrafted apricot liqueurs and fine brandies from the heart of Wachau. Tradition and quality since 1952.'}
      />
      {/* Hero Section - Editorial Split */}
      <section className="hero-elegant" data-testid="hero-section">
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32 lg:py-0 lg:min-h-screen flex items-center">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overline mb-6"
            >
              {t('hero.badge')}
            </motion.p>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#2D2A26] leading-[0.95]"
            >
              {language === 'de' ? 'Wachauer' : 'Wachau'}<br />
              <span className="italic text-[#8B2E2E]">{language === 'de' ? 'Marillen' : 'Apricot'}</span><br />
              {t('hero.titleAccent')}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-[#5C5852] text-lg mt-8 leading-relaxed max-w-md"
            >
              {t('hero.subtitle')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-wrap gap-4 mt-10"
            >
              <Link to="/shop" className="btn-primary flex items-center gap-3" data-testid="hero-cta">
                {t('hero.cta')}
                <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-secondary" data-testid="hero-secondary">
                {t('hero.secondary')}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="hero-image-editorial">
          <img
            src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?crop=entropy&cs=srgb&fm=jpg&q=85"
            alt="Vineyard"
          />
        </div>
      </section>

      {/* Feature Strip */}
      <section className="feature-strip bg-[#F9F8F6]" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Award, label: language === 'de' ? 'Premium Qualität' : 'Premium Quality' },
              { icon: Leaf, label: language === 'de' ? '100% Natürlich' : '100% Natural' },
              { icon: Clock, label: language === 'de' ? 'Seit 1952' : 'Since 1952' },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <feature.icon size={20} className="text-[#8B2E2E]" />
                <span className="text-[#5C5852] text-sm tracking-wide">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 md:py-32" data-testid="products-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
            <div>
              <span className="overline">{language === 'de' ? 'Kollektion' : 'Collection'}</span>
              <h2 className="font-serif text-4xl md:text-5xl text-[#2D2A26] mt-3">
                {t('products.featured')}
              </h2>
            </div>
            <Link to="/shop" className="btn-ghost flex items-center gap-2 mt-6 md:mt-0" data-testid="view-all-products">
              {t('general.viewAll')}
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="aspect-[3/4] skeleton" />
                  <div className="pt-6 space-y-3">
                    <div className="h-3 w-16 skeleton" />
                    <div className="h-6 w-full skeleton" />
                    <div className="h-8 w-24 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Story Section - Bento Style */}
      <section className="section-warm py-24 md:py-32" data-testid="story-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Image - Large */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7 img-hover-zoom"
            >
              <div className="aspect-[4/3]">
                <img
                  src="https://images.unsplash.com/photo-1664591080599-a33d227613d7?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Fresh apricots"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <span className="overline">{t('about.badge')}</span>
              <h2 className="font-serif text-4xl md:text-5xl text-[#2D2A26] mt-4 leading-tight">
                {t('about.title')}{' '}
                <span className="italic text-[#8B2E2E]">{t('about.titleAccent')}</span>
              </h2>
              <p className="text-[#5C5852] text-lg mt-8 leading-relaxed">
                {t('about.story')}
              </p>
              
              {/* Quote */}
              <blockquote className="mt-10 pt-8 border-t border-[#E5E0D8]">
                <p className="font-quote text-xl text-[#5C5852] leading-relaxed">
                  &ldquo;{t('about.quote')}&rdquo;
                </p>
                <cite className="block mt-4 overline not-italic">— {t('about.family')}</cite>
              </blockquote>
              
              <Link to="/about" className="btn-ghost flex items-center gap-2 mt-10" data-testid="story-link">
                {language === 'de' ? 'Mehr erfahren' : 'Learn more'}
                <ArrowUpRight size={14} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-3 gap-8">
            {[
              { number: '70+', label: language === 'de' ? 'Jahre Tradition' : 'Years of Tradition' },
              { number: '100%', label: language === 'de' ? 'Handgemacht' : 'Handcrafted' },
              { number: '5.0', label: language === 'de' ? 'Kundenbewertung' : 'Customer Rating' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="stat-elegant"
              >
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <span className="overline">{t('testimonials.subtitle')}</span>
            <h2 className="font-serif text-4xl md:text-5xl text-[#2D2A26] mt-3">
              {t('testimonials.title')}
            </h2>
          </div>

          {/* Mobile: Carousel */}
          <div className="md:hidden">
            <TestimonialsCarousel testimonials={testimonials} />
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="testimonial-elegant"
                data-testid={`testimonial-${testimonial.id}`}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
                <p className="font-quote text-xl text-[#5C5852] leading-relaxed">
                  &ldquo;{language === 'de' ? testimonial.text_de : testimonial.text_en}&rdquo;
                </p>
                <div className="mt-8 pt-6 border-t border-[#E5E0D8]">
                  <p className="font-medium text-[#2D2A26]">{testimonial.name}</p>
                  <p className="text-sm text-[#969088]">{testimonial.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-white" data-testid="newsletter-section">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <NewsletterSignup />
        </div>
      </section>

      {/* CTA */}
      <section className="section-warm py-24 md:py-32" data-testid="cta-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#2D2A26]">
              {language === 'de' ? 'Bereit für echten' : 'Ready for real'}{' '}
              <span className="italic text-[#8B2E2E]">{language === 'de' ? 'Genuss' : 'indulgence'}</span>?
            </h2>
            <p className="text-[#5C5852] text-lg mt-6 max-w-md mx-auto">
              {language === 'de'
                ? 'Entdecken Sie den authentischen Geschmack der Wachau.'
                : 'Discover the authentic taste of Wachau.'}
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-3 mt-10" data-testid="cta-shop-link">
              {language === 'de' ? 'Zum Shop' : 'Visit Shop'}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
