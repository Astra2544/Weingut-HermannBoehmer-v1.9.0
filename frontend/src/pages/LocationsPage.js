import { motion } from 'framer-motion';
import { MapPin, Clock, Sparkles, Wine, Star, ChevronRight, Phone, Mail, Heart, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

export default function LocationsPage() {
  const { language } = useLanguage();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <>
      <SEO 
        title={language === 'de' ? 'Standorte | Hermann Böhmer' : 'Locations | Hermann Böhmer'}
        description={language === 'de' 
          ? 'Besuchen Sie unseren neuen Automaten am Malerwinkel in Dürnstein oder unsere Manufaktur. Wachauer Spezialitäten rund um die Uhr.' 
          : 'Visit our new vending machine at Malerwinkel in Dürnstein or our manufactory. Wachau specialties around the clock.'}
      />
      
      <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-20">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-[#8B2E2E] text-xs tracking-[0.3em] uppercase mb-4">
                {language === 'de' ? 'Unsere Standorte' : 'Our Locations'}
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#2D2A26] leading-tight">
                {language === 'de' ? 'Genuss erleben' : 'Experience Pleasure'}
              </h1>
              <p className="text-[#5C5852] text-lg mt-6 leading-relaxed">
                {language === 'de' 
                  ? 'Entdecken Sie unsere handgemachten Wachauer Spezialitäten an zwei besonderen Orten – dort, wo Tradition auf Innovation trifft.' 
                  : 'Discover our handmade Wachau specialties at two special locations – where tradition meets innovation.'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* NEW: Automat Section - Main Feature */}
        <section className="py-12 md:py-20 bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            
            {/* "Jetzt Neu" Badge */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-[#8B2E2E] text-white px-6 py-2 text-sm tracking-wider uppercase">
                <Sparkles size={16} />
                {language === 'de' ? 'Jetzt Neu' : 'Now New'}
                <Sparkles size={16} />
              </span>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Left: Image/Visual */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative aspect-[4/5] bg-[#2D2A26] overflow-hidden">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8B2E2E]/20 to-transparent" />
                  
                  {/* Main visual representation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-32 h-32 md:w-40 md:h-40 border-2 border-[#C9A96E] mx-auto mb-6 flex items-center justify-center">
                        <Leaf size={64} className="text-[#C9A96E]" />
                      </div>
                      <p className="text-[#C9A96E] font-serif text-2xl md:text-3xl">24/7</p>
                      <p className="text-white/60 text-sm mt-2 tracking-widest uppercase">
                        {language === 'de' ? 'Wachauer Genuss' : 'Wachau Delights'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Corner accents */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#C9A96E]/50" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#C9A96E]/50" />
                </div>
                
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 md:-right-8 bg-[#8B2E2E] text-white p-4 md:p-6">
                  <p className="font-serif text-3xl md:text-4xl">365</p>
                  <p className="text-xs tracking-wider uppercase opacity-80">
                    {language === 'de' ? 'Tage im Jahr' : 'Days a Year'}
                  </p>
                </div>
              </motion.div>

              {/* Right: Content */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div>
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#2D2A26] leading-tight">
                    {language === 'de' ? 'Der Wachau-Automat' : 'The Wachau Vending Machine'}
                  </h2>
                  <p className="text-[#8B2E2E] text-lg mt-2 font-medium">
                    {language === 'de' ? 'Handgemachte Spezialitäten, wann immer Sie möchten' : 'Handmade specialties, whenever you desire'}
                  </p>
                </div>

                <div className="w-16 h-0.5 bg-[#C9A96E]" />

                <p className="text-[#5C5852] text-lg leading-relaxed">
                  {language === 'de' 
                    ? 'Stellen Sie sich vor: Ein Spaziergang durch die malerischen Gassen von Dürnstein, die Donau glitzert in der Sonne – und plötzlich der Wunsch nach einem Stück Wachau für zu Hause. Unser einzigartiger Automat macht es möglich.' 
                    : 'Imagine: A walk through the picturesque alleys of Dürnstein, the Danube glittering in the sun – and suddenly the desire for a piece of Wachau to take home. Our unique vending machine makes it possible.'}
                </p>

                <p className="text-[#5C5852] leading-relaxed">
                  {language === 'de' 
                    ? 'Hier finden Sie unsere handgemachten Wachauer Spezialitäten – von der sonnengereiften Marillenmarmelade über fruchtige Chutneys bis hin zu edlen Likören. Alles, was die Wachauer Marille zu bieten hat, rund um die Uhr verfügbar.' 
                    : 'Here you will find our handmade Wachau specialties – from sun-ripened apricot jam to fruity chutneys and fine liqueurs. Everything the Wachau apricot has to offer, available around the clock.'}
                </p>

                {/* Products in Automat */}
                <div className="bg-white/70 p-5 border border-[#E5E0D8]">
                  <p className="text-sm text-[#8B2E2E] tracking-wider uppercase mb-3">
                    {language === 'de' ? 'Im Automaten erhältlich' : 'Available in the machine'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#F2EFE9] text-sm text-[#5C5852]">
                      {language === 'de' ? 'Marillenmarmelade' : 'Apricot Jam'}
                    </span>
                    <span className="px-3 py-1 bg-[#F2EFE9] text-sm text-[#5C5852]">
                      {language === 'de' ? 'Marillenlikör' : 'Apricot Liqueur'}
                    </span>
                    <span className="px-3 py-1 bg-[#F2EFE9] text-sm text-[#5C5852]">
                      {language === 'de' ? 'Fruchtaufstriche' : 'Fruit Spreads'}
                    </span>
                    <span className="px-3 py-1 bg-[#F2EFE9] text-sm text-[#5C5852]">
                      {language === 'de' ? 'Chutneys' : 'Chutneys'}
                    </span>
                    <span className="px-3 py-1 bg-[#F2EFE9] text-sm text-[#5C5852]">
                      {language === 'de' ? 'Edelbrand' : 'Fine Brandy'}
                    </span>
                    <span className="px-3 py-1 bg-[#F2EFE9] text-sm text-[#5C5852]">
                      {language === 'de' ? '& mehr' : '& more'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/70 p-4 border border-[#E5E0D8]">
                    <Clock size={24} className="text-[#8B2E2E] mb-2" />
                    <p className="font-medium text-[#2D2A26]">24/7</p>
                    <p className="text-sm text-[#5C5852]">
                      {language === 'de' ? 'Immer verfügbar' : 'Always available'}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 border border-[#E5E0D8]">
                    <Heart size={24} className="text-[#8B2E2E] mb-2" />
                    <p className="font-medium text-[#2D2A26]">
                      {language === 'de' ? 'Handgemacht' : 'Handmade'}
                    </p>
                    <p className="text-sm text-[#5C5852]">
                      {language === 'de' ? 'Mit Liebe' : 'With love'}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-[#2D2A26] p-6 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#8B2E2E] flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[#C9A96E] text-sm tracking-wider uppercase mb-1">
                        {language === 'de' ? 'Standort' : 'Location'}
                      </p>
                      <p className="text-white font-serif text-xl">Malerwinkel</p>
                      <p className="text-white/70 mt-1">Dürnstein, Wachau</p>
                      <p className="text-white/50 text-sm mt-2">
                        {language === 'de' 
                          ? 'Direkt am berühmten Malerwinkel – dem schönsten Fotomotiv der Wachau' 
                          : 'Right at the famous Malerwinkel – the most beautiful photo spot in the Wachau'}
                      </p>
                    </div>
                  </div>
                </div>

                <Link 
                  to="/shop" 
                  className="inline-flex items-center gap-2 text-[#8B2E2E] font-medium hover:gap-4 transition-all"
                >
                  {language === 'de' ? 'Alle Produkte ansehen' : 'View all products'}
                  <ChevronRight size={18} />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex items-center gap-4 py-8">
            <div className="flex-1 h-px bg-[#E5E0D8]" />
            <Leaf size={24} className="text-[#C9A96E]" />
            <div className="flex-1 h-px bg-[#E5E0D8]" />
          </div>
        </div>

        {/* Manufaktur Section */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Left: Content */}
              <motion.div 
                className="space-y-6 order-2 md:order-1"
                {...fadeInUp}
              >
                <div>
                  <span className="text-[#8B2E2E] text-xs tracking-[0.3em] uppercase">
                    {language === 'de' ? 'Hauptstandort' : 'Main Location'}
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl text-[#2D2A26] mt-2">
                    {language === 'de' ? 'Die Manufaktur' : 'The Manufactory'}
                  </h2>
                  <p className="text-[#8B2E2E] text-lg mt-2">
                    {language === 'de' ? 'Wo alles mit der Hand entsteht' : 'Where everything is made by hand'}
                  </p>
                </div>

                <div className="w-16 h-0.5 bg-[#C9A96E]" />

                <p className="text-[#5C5852] text-lg leading-relaxed">
                  {language === 'de' 
                    ? 'In unserer Manufaktur im Herzen von Dürnstein entstehen alle unsere Produkte mit Hingabe und Sorgfalt – von Hand, wie seit Generationen. Hier werden die sonnengereiften Wachauer Marillen zu köstlichen Marmeladen, fruchtigen Aufstrichen und edlen Likören verarbeitet.' 
                    : 'In our manufactory in the heart of Dürnstein, all our products are created with dedication and care – by hand, as they have been for generations. Here, sun-ripened Wachau apricots are transformed into delicious jams, fruity spreads and fine liqueurs.'}
                </p>

                <p className="text-[#5C5852] leading-relaxed">
                  {language === 'de' 
                    ? 'Besuchen Sie uns und erleben Sie die Kunst der Verarbeitung hautnah. Gerne zeigen wir Ihnen unsere Räumlichkeiten und lassen Sie die Aromen der Wachau verkosten.' 
                    : 'Visit us and experience the art of processing up close. We would be happy to show you around our premises and let you taste the aromas of the Wachau.'}
                </p>

                {/* Services */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#8B2E2E]/10 flex items-center justify-center">
                      <Star size={16} className="text-[#8B2E2E]" />
                    </div>
                    <span className="text-[#2D2A26]">
                      {language === 'de' ? 'Verkostungen nach Vereinbarung' : 'Tastings by appointment'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#8B2E2E]/10 flex items-center justify-center">
                      <Star size={16} className="text-[#8B2E2E]" />
                    </div>
                    <span className="text-[#2D2A26]">
                      {language === 'de' ? 'Direktverkauf vor Ort' : 'Direct sales on site'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#8B2E2E]/10 flex items-center justify-center">
                      <Star size={16} className="text-[#8B2E2E]" />
                    </div>
                    <span className="text-[#2D2A26]">
                      {language === 'de' ? 'Alles handgemacht vor Ort' : 'Everything handmade on site'}
                    </span>
                  </div>
                </div>

                {/* Address Card */}
                <div className="bg-white border border-[#E5E0D8] p-6 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#F2EFE9] flex items-center justify-center flex-shrink-0">
                      <MapPin size={24} className="text-[#8B2E2E]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[#8B2E2E] text-sm tracking-wider uppercase mb-1">
                        {language === 'de' ? 'Adresse' : 'Address'}
                      </p>
                      <p className="font-serif text-xl text-[#2D2A26]">Weingut Hermann Böhmer</p>
                      <p className="text-[#5C5852] mt-1">Dürnstein 244</p>
                      <p className="text-[#5C5852]">3601 Dürnstein, Österreich</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-[#E5E0D8]">
                        <a href="tel:+432711234567" className="flex items-center gap-2 text-[#5C5852] hover:text-[#8B2E2E] transition-colors">
                          <Phone size={16} />
                          <span>+43 2711 234 5678</span>
                        </a>
                        <a href="mailto:info@weingut-boehmer.at" className="flex items-center gap-2 text-[#5C5852] hover:text-[#8B2E2E] transition-colors">
                          <Mail size={16} />
                          <span>info@weingut-boehmer.at</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right: Visual */}
              <motion.div 
                className="relative order-1 md:order-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative aspect-[4/5] bg-[#F2EFE9] overflow-hidden border border-[#E5E0D8]">
                  {/* Visual representation of manufactory */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-[#8B2E2E] mx-auto mb-6 flex items-center justify-center transform rotate-45">
                          <div className="transform -rotate-45">
                            <Heart size={48} className="text-[#8B2E2E]" />
                          </div>
                        </div>
                      </div>
                      <p className="font-serif text-2xl md:text-3xl text-[#2D2A26]">
                        {language === 'de' ? 'Handgemacht' : 'Handmade'}
                      </p>
                      <p className="text-[#5C5852] text-sm mt-2 tracking-widest uppercase">
                        {language === 'de' ? 'Mit Liebe & Tradition' : 'With Love & Tradition'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-6 left-6 text-6xl font-serif text-[#E5E0D8]">"</div>
                  <div className="absolute bottom-6 right-6 text-6xl font-serif text-[#E5E0D8]">"</div>
                </div>
                
                {/* Quote overlay */}
                <div className="absolute -bottom-4 -left-4 md:-left-8 bg-white border border-[#E5E0D8] p-4 md:p-6 max-w-xs">
                  <p className="text-[#5C5852] italic text-sm">
                    {language === 'de' 
                      ? '"Jedes Glas erzählt die Geschichte unserer Wachau."' 
                      : '"Every jar tells the story of our Wachau."'}
                  </p>
                  <p className="text-[#8B2E2E] text-sm mt-2 font-medium">— Hermann Böhmer</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-12 md:py-20 bg-[#2D2A26]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl text-white">
                {language === 'de' ? 'Finden Sie uns' : 'Find Us'}
              </h2>
              <p className="text-white/60 mt-4 max-w-2xl mx-auto">
                {language === 'de' 
                  ? 'Beide Standorte befinden sich im malerischen Dürnstein – dem Juwel der Wachau, nur eine Stunde von Wien entfernt.' 
                  : 'Both locations are in picturesque Dürnstein – the jewel of the Wachau, just one hour from Vienna.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Automat Location Card */}
              <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[#C9A96E] text-xs tracking-wider uppercase">
                      {language === 'de' ? 'Automat' : 'Vending Machine'}
                    </p>
                    <p className="text-white font-serif text-lg">Malerwinkel</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm">Dürnstein, Wachau</p>
                <p className="text-white/40 text-sm mt-1">
                  {language === 'de' ? '24 Stunden, 365 Tage' : '24 hours, 365 days'}
                </p>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a 
                    href="https://maps.google.com/?q=Malerwinkel+Dürnstein" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#C9A96E] text-sm hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    {language === 'de' ? 'Route planen' : 'Get directions'}
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>

              {/* Manufaktur Location Card */}
              <div className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#8B2E2E] flex items-center justify-center">
                    <Heart size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[#C9A96E] text-xs tracking-wider uppercase">
                      {language === 'de' ? 'Manufaktur' : 'Manufactory'}
                    </p>
                    <p className="text-white font-serif text-lg">Dürnstein 244</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm">3601 Dürnstein, Österreich</p>
                <p className="text-white/40 text-sm mt-1">
                  {language === 'de' ? 'Mo-Sa: 10:00 - 18:00' : 'Mon-Sat: 10:00 - 18:00'}
                </p>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a 
                    href="https://maps.google.com/?q=Dürnstein+244+3601+Dürnstein" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#C9A96E] text-sm hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    {language === 'de' ? 'Route planen' : 'Get directions'}
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
            <motion.div {...fadeInUp}>
              <h2 className="font-serif text-3xl md:text-4xl text-[#2D2A26]">
                {language === 'de' ? 'Sie können nicht warten?' : "Can't wait?"}
              </h2>
              <p className="text-[#5C5852] text-lg mt-4 max-w-2xl mx-auto">
                {language === 'de' 
                  ? 'Bestellen Sie online und lassen Sie sich den Geschmack der Wachau direkt nach Hause liefern.' 
                  : 'Order online and have the taste of the Wachau delivered directly to your home.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link to="/shop" className="btn-primary inline-flex items-center justify-center gap-2">
                  {language === 'de' ? 'Jetzt bestellen' : 'Order Now'}
                  <ChevronRight size={18} />
                </Link>
                <Link to="/about" className="btn-secondary inline-flex items-center justify-center gap-2">
                  {language === 'de' ? 'Mehr über uns' : 'More About Us'}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
