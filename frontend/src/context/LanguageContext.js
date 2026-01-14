import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  de: {
    // Navigation
    nav: {
      home: 'Startseite',
      shop: 'Shop',
      about: 'Über Uns',
      tracking: 'Sendungsverfolgung',
      cart: 'Warenkorb',
      admin: 'Admin'
    },
    // Hero
    hero: {
      badge: 'Handgemacht in Dürnstein',
      title: 'Wachauer Marillen',
      titleAccent: 'Genuss',
      subtitle: 'Erleben Sie den authentischen Geschmack der Wachau. Unsere Liköre werden aus handverlesenen Marillen nach traditionellen Familienrezepten hergestellt.',
      cta: 'Jetzt entdecken',
      secondary: 'Unsere Geschichte'
    },
    // Products
    products: {
      featured: 'Unsere Auswahl',
      all: 'Alle Produkte',
      limited: 'Limitierte Edition',
      addToCart: 'In den Warenkorb',
      outOfStock: 'Ausverkauft',
      stock: 'Nur noch {count} auf Lager',
      sold: '{count} verkauft',
      alcohol: 'Vol.',
      volume: 'ml'
    },
    // Cart
    cart: {
      title: 'Warenkorb',
      empty: 'Ihr Warenkorb ist leer',
      emptyDesc: 'Entdecken Sie unsere handgemachten Liköre',
      subtotal: 'Zwischensumme',
      shipping: 'Versand',
      shippingNote: 'Kostenloser Versand ab €50',
      total: 'Gesamt',
      checkout: 'Zur Kasse',
      continue: 'Weiter einkaufen',
      remove: 'Entfernen'
    },
    // Checkout
    checkout: {
      title: 'Bestellung aufgeben',
      customer: 'Kundendaten',
      shipping: 'Lieferadresse',
      name: 'Vollständiger Name',
      email: 'E-Mail',
      phone: 'Telefon',
      address: 'Adresse',
      city: 'Stadt',
      postal: 'Postleitzahl',
      country: 'Land',
      notes: 'Anmerkungen (optional)',
      submit: 'Bestellung abschicken',
      success: 'Bestellung erfolgreich!',
      successDesc: 'Ihre Tracking-Nummer: {tracking}'
    },
    // About
    about: {
      badge: 'Seit 1952',
      title: 'Tradition trifft',
      titleAccent: 'Leidenschaft',
      story: 'Unser Weingut liegt im Herzen von Dürnstein, eingebettet in die malerische Landschaft der Wachau. Seit drei Generationen widmen wir uns der Kunst der Likörherstellung.',
      quote: 'Jeder Tropfen erzählt die Geschichte unserer Marillen – von der sonnenverwöhnten Blüte bis zum vollreifen Genuss.',
      family: 'Hermann Böhmer',
      values: {
        title: 'Unsere Werte',
        quality: 'Höchste Qualität',
        qualityDesc: 'Nur die besten Wachauer Marillen finden den Weg in unsere Liköre.',
        tradition: 'Tradition',
        traditionDesc: 'Rezepte, die seit Generationen weitergegeben werden.',
        sustainability: 'Nachhaltigkeit',
        sustainabilityDesc: 'Respekt vor der Natur in allem was wir tun.'
      }
    },
    // Tracking
    tracking: {
      title: 'Sendungsverfolgung',
      subtitle: 'Verfolgen Sie den Status Ihrer Bestellung',
      placeholder: 'Tracking-Nummer eingeben',
      search: 'Suchen',
      notFound: 'Sendung nicht gefunden',
      status: {
        pending: 'In Bearbeitung',
        processing: 'Wird vorbereitet',
        shipped: 'Versendet',
        delivered: 'Zugestellt'
      }
    },
    // Testimonials
    testimonials: {
      title: 'Kundenstimmen',
      subtitle: 'Was unsere Kunden sagen'
    },
    // Footer
    footer: {
      tagline: 'Handgemachte Liköre aus dem Herzen der Wachau',
      links: 'Links',
      contact: 'Kontakt',
      legal: 'Rechtliches',
      privacy: 'Datenschutz',
      terms: 'AGB',
      imprint: 'Impressum',
      copyright: '© 2024 Weingut Hermann Böhmer. Alle Rechte vorbehalten.'
    },
    // General
    general: {
      loading: 'Laden...',
      error: 'Ein Fehler ist aufgetreten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      back: 'Zurück',
      viewAll: 'Alle ansehen'
    }
  },
  en: {
    // Navigation
    nav: {
      home: 'Home',
      shop: 'Shop',
      about: 'About Us',
      tracking: 'Track Order',
      cart: 'Cart',
      admin: 'Admin'
    },
    // Hero
    hero: {
      badge: 'Handcrafted in Dürnstein',
      title: 'Wachau Apricot',
      titleAccent: 'Indulgence',
      subtitle: 'Experience the authentic taste of Wachau. Our liqueurs are crafted from hand-picked apricots following traditional family recipes.',
      cta: 'Discover Now',
      secondary: 'Our Story'
    },
    // Products
    products: {
      featured: 'Our Selection',
      all: 'All Products',
      limited: 'Limited Edition',
      addToCart: 'Add to Cart',
      outOfStock: 'Out of Stock',
      stock: 'Only {count} left in stock',
      sold: '{count} sold',
      alcohol: 'Vol.',
      volume: 'ml'
    },
    // Cart
    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      emptyDesc: 'Discover our handcrafted liqueurs',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      shippingNote: 'Free shipping on orders over €50',
      total: 'Total',
      checkout: 'Checkout',
      continue: 'Continue Shopping',
      remove: 'Remove'
    },
    // Checkout
    checkout: {
      title: 'Place Order',
      customer: 'Customer Details',
      shipping: 'Shipping Address',
      name: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      postal: 'Postal Code',
      country: 'Country',
      notes: 'Notes (optional)',
      submit: 'Place Order',
      success: 'Order Successful!',
      successDesc: 'Your tracking number: {tracking}'
    },
    // About
    about: {
      badge: 'Since 1952',
      title: 'Tradition meets',
      titleAccent: 'Passion',
      story: 'Our winery is nestled in the heart of Dürnstein, surrounded by the picturesque landscape of Wachau. For three generations, we have dedicated ourselves to the art of liqueur making.',
      quote: 'Every drop tells the story of our apricots – from sun-kissed blossom to perfectly ripe indulgence.',
      family: 'Hermann Böhmer',
      values: {
        title: 'Our Values',
        quality: 'Highest Quality',
        qualityDesc: 'Only the finest Wachau apricots make it into our liqueurs.',
        tradition: 'Tradition',
        traditionDesc: 'Recipes passed down through generations.',
        sustainability: 'Sustainability',
        sustainabilityDesc: 'Respect for nature in everything we do.'
      }
    },
    // Tracking
    tracking: {
      title: 'Order Tracking',
      subtitle: 'Track the status of your order',
      placeholder: 'Enter tracking number',
      search: 'Search',
      notFound: 'Shipment not found',
      status: {
        pending: 'Processing',
        processing: 'Preparing',
        shipped: 'Shipped',
        delivered: 'Delivered'
      }
    },
    // Testimonials
    testimonials: {
      title: 'Customer Reviews',
      subtitle: 'What our customers say'
    },
    // Footer
    footer: {
      tagline: 'Handcrafted liqueurs from the heart of Wachau',
      links: 'Links',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      imprint: 'Imprint',
      copyright: '© 2024 Weingut Hermann Böhmer. All rights reserved.'
    },
    // General
    general: {
      loading: 'Loading...',
      error: 'An error occurred',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      viewAll: 'View All'
    }
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wachau-lang') || 'de';
    }
    return 'de';
  });

  useEffect(() => {
    localStorage.setItem('wachau-lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'de' ? 'en' : 'de');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
