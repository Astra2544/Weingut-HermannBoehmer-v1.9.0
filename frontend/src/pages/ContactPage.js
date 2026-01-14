import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle, User, MessageSquare, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ContactPage() {
  const { language } = useLanguage();
  const { isLoggedIn, user } = useAuth();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill form if logged in
  useState(() => {
    if (isLoggedIn && user) {
      setForm(prev => ({
        ...prev,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [isLoggedIn, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = language === 'de' ? 'Name ist erforderlich' : 'Name is required';
    }
    
    if (!form.email.trim()) {
      newErrors.email = language === 'de' ? 'E-Mail ist erforderlich' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = language === 'de' ? 'Ungültige E-Mail-Adresse' : 'Invalid email address';
    }
    
    if (!form.message.trim()) {
      newErrors.message = language === 'de' ? 'Nachricht ist erforderlich' : 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/contact`, form);
      setSubmitted(true);
      toast.success(language === 'de' ? 'Nachricht erfolgreich gesendet!' : 'Message sent successfully!');
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Senden. Bitte versuchen Sie es erneut.' : 'Error sending. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const teamMembers = [
    {
      name: 'Hermann Böhmer',
      role: language === 'de' ? 'Gründer & Inhaber' : 'Founder & Owner',
      description: language === 'de' 
        ? 'Hermann Böhmer gründete das Weingut 1952 mit einer Vision: Die besten Wachauer Marillen in einzigartige Liköre zu verwandeln. Mit über 70 Jahren Erfahrung und Leidenschaft steht er für die Tradition und Qualität, die unser Haus auszeichnet.'
        : 'Hermann Böhmer founded the winery in 1952 with a vision: to transform the finest Wachau apricots into unique liqueurs. With over 70 years of experience and passion, he represents the tradition and quality that distinguishes our house.',
      imageUrl: null // Placeholder
    },
    {
      name: 'Nicholas Böhmer',
      role: language === 'de' ? 'Nachfolger & Geschäftsführer' : 'Successor & Managing Director',
      description: language === 'de'
        ? 'Als Sohn von Hermann führt Nicholas die Familientradition in die Zukunft. Er verbindet das Erbe seines Vaters mit modernen Ideen und sorgt dafür, dass die Wachauer Marillenprodukte auch in der nächsten Generation höchste Qualität bewahren.'
        : 'As Hermann\'s son, Nicholas carries the family tradition into the future. He combines his father\'s legacy with modern ideas, ensuring that Wachau apricot products maintain the highest quality for the next generation.',
      imageUrl: null // Placeholder
    }
  ];

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="contact-page">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <span className="overline">{language === 'de' ? 'KONTAKT' : 'CONTACT'}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#2D2A26] mt-3 md:mt-4 leading-none">
            {language === 'de' ? 'Wir freuen uns' : 'We look forward'}{' '}
            <span className="italic text-[#8B2E2E]">{language === 'de' ? 'auf Sie' : 'to hearing from you'}</span>
          </h1>
          <p className="text-[#5C5852] mt-6 text-base md:text-lg leading-relaxed">
            {language === 'de' 
              ? 'Haben Sie Fragen zu unseren Produkten, Bestellungen oder möchten Sie mehr über unser Weingut erfahren? Wir sind gerne für Sie da.'
              : 'Do you have questions about our products, orders, or would you like to learn more about our winery? We are happy to help.'}
          </p>
        </motion.div>
      </section>

      {/* Team Section */}
      <section className="section-warm py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">
              {language === 'de' ? 'Unser Team' : 'Our Team'}
            </h2>
            <p className="text-[#5C5852] mt-4">
              {language === 'de' ? 'Die Menschen hinter Hermann Böhmer' : 'The people behind Hermann Böhmer'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="bg-white p-6 md:p-8"
              >
                {/* Image Placeholder with Frame */}
                <div className="aspect-[4/5] mb-6 relative bg-[#F2EFE9] border-2 border-dashed border-[#E5E0D8] flex items-center justify-center overflow-hidden">
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <User size={64} className="mx-auto text-[#C5C0B8] mb-4" />
                      <p className="text-[#969088] text-sm">
                        {language === 'de' ? 'Bild folgt' : 'Image coming'}
                      </p>
                      <p className="text-[#C5C0B8] text-xs mt-1">
                        {member.name}
                      </p>
                    </div>
                  )}
                  {/* Decorative frame corners */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#8B2E2E]"></div>
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#8B2E2E]"></div>
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#8B2E2E]"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#8B2E2E]"></div>
                </div>
                
                <h3 className="font-serif text-2xl text-[#2D2A26]">{member.name}</h3>
                <p className="text-[#8B2E2E] text-sm uppercase tracking-wider mt-1">{member.role}</p>
                <p className="text-[#5C5852] mt-4 leading-relaxed">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl text-[#2D2A26] mb-8">
                {language === 'de' ? 'Kontaktdaten' : 'Contact Information'}
              </h2>
              
              <div className="space-y-6">
                <a 
                  href="mailto:info@hermann-boehmer.com" 
                  className="flex items-start gap-4 p-4 bg-white border border-[#E5E0D8] hover:border-[#8B2E2E] transition-colors group"
                >
                  <div className="w-12 h-12 bg-[#F2EFE9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#8B2E2E] transition-colors">
                    <Mail size={20} className="text-[#8B2E2E] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#969088] mb-1">E-Mail</p>
                    <p className="text-[#2D2A26] font-medium group-hover:text-[#8B2E2E] transition-colors">
                      info@hermann-boehmer.com
                    </p>
                  </div>
                </a>
                
                <a 
                  href="tel:+436502711237" 
                  className="flex items-start gap-4 p-4 bg-white border border-[#E5E0D8] hover:border-[#8B2E2E] transition-colors group"
                >
                  <div className="w-12 h-12 bg-[#F2EFE9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#8B2E2E] transition-colors">
                    <Phone size={20} className="text-[#8B2E2E] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#969088] mb-1">{language === 'de' ? 'Telefon' : 'Phone'}</p>
                    <p className="text-[#2D2A26] font-medium group-hover:text-[#8B2E2E] transition-colors">
                      +43 650 2711237
                    </p>
                  </div>
                </a>
                
                <div className="flex items-start gap-4 p-4 bg-white border border-[#E5E0D8]">
                  <div className="w-12 h-12 bg-[#F2EFE9] flex items-center justify-center flex-shrink-0">
                    <MapPin size={20} className="text-[#8B2E2E]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#969088] mb-1">{language === 'de' ? 'Adresse' : 'Address'}</p>
                    <p className="text-[#2D2A26] font-medium">Dürnstein 244</p>
                    <p className="text-[#5C5852]">3601 Dürnstein, Austria</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder or Opening Hours */}
              <div className="mt-8 p-6 bg-[#F2EFE9] border border-[#E5E0D8]">
                <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                  {language === 'de' ? 'Öffnungszeiten' : 'Opening Hours'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#5C5852]">
                    <span>{language === 'de' ? 'Montag - Freitag' : 'Monday - Friday'}</span>
                    <span className="text-[#2D2A26]">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-[#5C5852]">
                    <span>{language === 'de' ? 'Samstag' : 'Saturday'}</span>
                    <span className="text-[#2D2A26]">10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between text-[#5C5852]">
                    <span>{language === 'de' ? 'Sonntag' : 'Sunday'}</span>
                    <span className="text-[#969088]">{language === 'de' ? 'Geschlossen' : 'Closed'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl text-[#2D2A26] mb-8">
                {language === 'de' ? 'Nachricht senden' : 'Send a Message'}
              </h2>

              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-[#E5E0D8] p-8 md:p-12 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-serif text-2xl text-[#2D2A26] mb-3">
                    {language === 'de' ? 'Vielen Dank!' : 'Thank You!'}
                  </h3>
                  <p className="text-[#5C5852] mb-6">
                    {language === 'de' 
                      ? 'Ihre Nachricht wurde erfolgreich gesendet. Wir werden uns so schnell wie möglich bei Ihnen melden.'
                      : 'Your message has been sent successfully. We will get back to you as soon as possible.'}
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
                    }}
                    className="text-[#8B2E2E] hover:underline text-sm"
                  >
                    {language === 'de' ? 'Weitere Nachricht senden' : 'Send another message'}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-[#E5E0D8] p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Name' : 'Name'} *
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={`input-elegant ${errors.name ? 'border-red-500' : ''}`}
                        placeholder={language === 'de' ? 'Ihr Name' : 'Your name'}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        E-Mail *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className={`input-elegant ${errors.email ? 'border-red-500' : ''}`}
                        placeholder={language === 'de' ? 'Ihre E-Mail' : 'Your email'}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Telefon' : 'Phone'}
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="input-elegant"
                        placeholder={language === 'de' ? 'Ihre Telefonnummer' : 'Your phone number'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                        {language === 'de' ? 'Betreff' : 'Subject'}
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-[#E5E0D8] bg-white focus:border-[#8B2E2E] focus:outline-none transition-colors"
                      >
                        <option value="">{language === 'de' ? 'Bitte wählen...' : 'Please select...'}</option>
                        <option value="products">{language === 'de' ? 'Produktanfrage' : 'Product Inquiry'}</option>
                        <option value="order">{language === 'de' ? 'Bestellung' : 'Order'}</option>
                        <option value="visit">{language === 'de' ? 'Besuch / Führung' : 'Visit / Tour'}</option>
                        <option value="wholesale">{language === 'de' ? 'Großhandel' : 'Wholesale'}</option>
                        <option value="other">{language === 'de' ? 'Sonstiges' : 'Other'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D2A26] mb-2">
                      {language === 'de' ? 'Nachricht' : 'Message'} *
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      className={`w-full px-4 py-3 border ${errors.message ? 'border-red-500' : 'border-[#E5E0D8]'} focus:border-[#8B2E2E] focus:outline-none resize-none transition-colors`}
                      placeholder={language === 'de' ? 'Ihre Nachricht...' : 'Your message...'}
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        {language === 'de' ? 'Nachricht senden' : 'Send Message'}
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA to About Page */}
      <section className="section-warm py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-[#2D2A26] mb-4">
            {language === 'de' ? 'Mehr über uns erfahren?' : 'Want to learn more about us?'}
          </h2>
          <p className="text-[#5C5852] mb-6">
            {language === 'de' 
              ? 'Entdecken Sie die Geschichte unseres Familienbetriebs und unsere Werte.'
              : 'Discover the story of our family business and our values.'}
          </p>
          <Link to="/about" className="btn-ghost inline-flex items-center gap-2">
            {language === 'de' ? 'Über uns' : 'About Us'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
