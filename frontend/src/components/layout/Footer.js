import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer = () => {
  const { t, language } = useLanguage();

  return (
    <footer className="footer-elegant" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-20">
        {/* Top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-5">
            <h3 className="font-serif text-2xl md:text-3xl text-[#2D2A26] mb-2">Hermann Böhmer</h3>
            <p className="text-xs tracking-[0.2em] uppercase text-[#969088] mb-4 md:mb-6">Weingut Dürnstein</p>
            <p className="text-[#5C5852] text-sm md:text-base leading-relaxed max-w-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2">
            <h4 className="overline mb-4 md:mb-6">{t('footer.links')}</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/shop" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{t('nav.shop')}</Link>
              <Link to="/about" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{t('nav.about')}</Link>
              <Link to="/contact" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{language === 'de' ? 'Kontakt' : 'Contact'}</Link>
              <Link to="/tracking" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{t('nav.tracking')}</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h4 className="overline mb-4 md:mb-6">{t('footer.contact')}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-[#5C5852]">
                <MapPin size={16} className="text-[#8B2E2E] flex-shrink-0 mt-1" />
                <span>Dürnstein 244<br />3601 Dürnstein, Austria</span>
              </div>
              <a href="mailto:info@hermann-boehmer.com" className="flex items-center gap-3 text-sm text-[#5C5852] hover:text-[#8B2E2E] transition-colors">
                <Mail size={16} className="text-[#8B2E2E]" />
                info@hermann-boehmer.com
              </a>
              <a href="tel:+436502711237" className="flex items-center gap-3 text-sm text-[#5C5852] hover:text-[#8B2E2E] transition-colors">
                <Phone size={16} className="text-[#8B2E2E]" />
                +43 650 2711237
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h4 className="overline mb-4 md:mb-6">{t('footer.legal')}</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/privacy" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{t('footer.privacy')}</Link>
              <Link to="/terms" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{t('footer.terms')}</Link>
              <Link to="/imprint" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors text-sm">{t('footer.imprint')}</Link>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-elegant mb-6 md:mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-center md:text-left">
          <p className="text-xs text-[#969088]">
            © {new Date().getFullYear()} Weingut Hermann Böhmer. {language === 'de' ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-[#969088]">
            {language === 'de' ? 'Alkoholische Getränke. Ab 18 Jahren.' : 'Alcoholic beverages. 18+ only.'}
          </p>
        </div>
      </div>
    </footer>
  );
};
