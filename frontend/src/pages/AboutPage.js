import { motion } from 'framer-motion';
import { Award, Leaf, Heart, MapPin, ArrowUpRight, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function AboutPage() {
  const { t, language } = useLanguage();

  const values = [
    { icon: Award, title: t('about.values.quality'), desc: t('about.values.qualityDesc') },
    { icon: Heart, title: t('about.values.tradition'), desc: t('about.values.traditionDesc') },
    { icon: Leaf, title: t('about.values.sustainability'), desc: t('about.values.sustainabilityDesc') }
  ];

  const teamMembers = [
    {
      name: 'Hermann Böhmer',
      role: language === 'de' ? 'Gründer & Inhaber' : 'Founder & Owner',
      shortBio: language === 'de' 
        ? 'Der Visionär, der 1952 die Kunst der Marillenverarbeitung in Dürnstein begründete.'
        : 'The visionary who founded the art of apricot processing in Dürnstein in 1952.',
      fullBio: language === 'de' 
        ? 'Hermann Böhmer wurde in Dürnstein geboren und wuchs zwischen den Marillenhainen der Wachau auf. Schon als Kind war er fasziniert von der goldenen Frucht, die seine Heimat weltberühmt machte. 1952, mit nur 22 Jahren, begann er in der kleinen Scheune seines Elternhauses mit den ersten Experimenten zur Likörherstellung. Was als Leidenschaftsprojekt begann, entwickelte sich über die Jahrzehnte zu einem der renommiertesten Familienbetriebe der Region. Hermanns Philosophie war stets einfach: Nur die besten Marillen, traditionelle Methoden und unendliche Geduld führen zu Produkten, die den Namen Böhmer verdienen.'
        : 'Hermann Böhmer was born in Dürnstein and grew up among the apricot orchards of Wachau. Even as a child, he was fascinated by the golden fruit that made his homeland world-famous. In 1952, at just 22 years old, he began his first experiments in liqueur production in the small barn of his parents\' house. What started as a passion project developed over decades into one of the most renowned family businesses in the region. Hermann\'s philosophy has always been simple: only the finest apricots, traditional methods, and infinite patience lead to products worthy of the Böhmer name.',
      imageUrl: null
    },
    {
      name: 'Nicholas Böhmer',
      role: language === 'de' ? 'Nachfolger & Geschäftsführer' : 'Successor & Managing Director',
      shortBio: language === 'de'
        ? 'Der Sohn, der Tradition mit Innovation verbindet und das Erbe in die Zukunft führt.'
        : 'The son who combines tradition with innovation and carries the legacy into the future.',
      fullBio: language === 'de'
        ? 'Nicholas wuchs im Rhythmus der Marillenernten auf und lernte das Handwerk von seinem Vater von Grund auf. Nach seinem Studium der Lebensmitteltechnologie in Wien kehrte er 2015 nach Dürnstein zurück, um gemeinsam mit seinem Vater den Betrieb weiterzuführen. Nicholas brachte frische Ideen mit: neue Produktlinien wie Marillen-Pralinen und Schokoladen, moderne Vermarktungsstrategien und ein starkes Engagement für Nachhaltigkeit. Dabei bleibt er den Wurzeln treu – jedes Produkt wird nach wie vor in Handarbeit hergestellt, mit den gleichen Qualitätsstandards, die sein Vater vor über 70 Jahren etablierte.'
        : 'Nicholas grew up with the rhythm of the apricot harvests and learned the craft from his father from the ground up. After studying food technology in Vienna, he returned to Dürnstein in 2015 to continue running the business together with his father. Nicholas brought fresh ideas: new product lines such as apricot pralines and chocolates, modern marketing strategies, and a strong commitment to sustainability. He remains true to his roots – every product is still handmade, with the same quality standards that his father established over 70 years ago.',
      imageUrl: null
    }
  ];

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="about-page">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pb-12 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <span className="overline">{t('about.badge')}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#2D2A26] mt-3 md:mt-4 leading-none">
            {t('about.title')}{' '}
            <span className="italic text-[#8B2E2E]">{t('about.titleAccent')}</span>
          </h1>
        </motion.div>
      </section>

      {/* Story Grid */}
      <section className="section-warm py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1598866971869-22782ffd918e?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Wine bottles"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#2D2A26]">
                {language === 'de' ? 'Die Geschichte beginnt in den Hängen der Wachau' : 'The story begins on the slopes of Wachau'}
              </h2>
              <p className="text-[#5C5852] text-base md:text-lg mt-6 md:mt-8 leading-relaxed">
                {t('about.story')}
              </p>
              <p className="text-[#5C5852] text-base md:text-lg mt-4 leading-relaxed">
                {language === 'de'
                  ? '1952 begann unser Großvater mit der Herstellung des ersten Likörs. Seitdem führen wir diese Tradition fort – nun in der dritten Generation.'
                  : 'In 1952, our grandfather began making the first liqueur. We have continued this tradition ever since – now in the third generation.'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section - Hermann & Nicholas */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12 md:mb-16">
            <span className="overline">{language === 'de' ? 'DIE MENSCHEN DAHINTER' : 'THE PEOPLE BEHIND'}</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2D2A26] mt-4">
              {language === 'de' ? 'Unsere Familie' : 'Our Family'}
            </h2>
            <p className="text-[#5C5852] mt-4 max-w-2xl mx-auto">
              {language === 'de' 
                ? 'Drei Generationen Leidenschaft für die Wachauer Marille.'
                : 'Three generations of passion for the Wachau apricot.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="bg-white"
              >
                {/* Image Placeholder with Frame */}
                <div className="aspect-[4/5] relative bg-[#F2EFE9] border-2 border-dashed border-[#E5E0D8] flex items-center justify-center overflow-hidden">
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <User size={80} className="mx-auto text-[#C5C0B8] mb-4" />
                      <p className="text-[#969088] text-sm">
                        {language === 'de' ? 'Bild folgt' : 'Image coming'}
                      </p>
                      <p className="text-[#C5C0B8] text-xs mt-1">
                        {member.name}
                      </p>
                    </div>
                  )}
                  {/* Decorative frame corners */}
                  <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-[#8B2E2E]"></div>
                  <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-[#8B2E2E]"></div>
                  <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-[#8B2E2E]"></div>
                  <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-[#8B2E2E]"></div>
                </div>
                
                <div className="p-6 md:p-8">
                  <h3 className="font-serif text-2xl md:text-3xl text-[#2D2A26]">{member.name}</h3>
                  <p className="text-[#8B2E2E] text-sm uppercase tracking-wider mt-1">{member.role}</p>
                  <p className="text-[#5C5852] mt-4 leading-relaxed text-sm md:text-base">{member.fullBio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section-warm py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <blockquote className="border-t-2 border-[#8B2E2E] pt-8 max-w-xl mx-auto text-left">
            <p className="font-quote text-xl sm:text-2xl md:text-3xl text-[#5C5852] leading-relaxed">
              &ldquo;{t('about.quote')}&rdquo;
            </p>
            <cite className="block mt-6 overline not-italic">— {t('about.family')}</cite>
          </blockquote>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2D2A26]">
              {t('about.values.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 md:p-8"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#F9F8F6] flex items-center justify-center mb-4 md:mb-6">
                  <value.icon size={24} className="text-[#8B2E2E] md:w-8 md:h-8" />
                </div>
                <h3 className="font-serif text-lg md:text-xl text-[#2D2A26]">{value.title}</h3>
                <p className="text-[#5C5852] text-sm md:text-base mt-2 md:mt-3 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline - Die Reise */}
      <section className="section-warm py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2D2A26]">
              {language === 'de' ? 'Unsere Reise' : 'Our Journey'}
            </h2>
          </div>

          <div className="space-y-8">
            {[
              { year: '1952', de: 'Hermann Böhmer beginnt mit der Likörherstellung in Dürnstein', en: 'Hermann Böhmer starts liqueur production in Dürnstein' },
              { year: '1968', de: 'Erste Auszeichnung für unseren Marillenlikör', en: 'First award for our apricot liqueur' },
              { year: '1985', de: 'Erweiterung um Edelbrände und Marmeladen', en: 'Expansion to include brandies and jams' },
              { year: '2015', de: 'Nicholas Böhmer übernimmt die Geschäftsführung', en: 'Nicholas Böhmer takes over management' },
              { year: '2020', de: 'Neue Produktlinien: Pralinen und Schokoladen', en: 'New product lines: pralines and chocolates' },
              { year: '2024', de: 'Online-Shop und weltweiter Versand', en: 'Online shop and worldwide shipping' }
            ].map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-6 items-start"
              >
                <div className="w-20 flex-shrink-0">
                  <span className="font-serif text-2xl text-[#8B2E2E]">{item.year}</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="h-px bg-[#E5E0D8] mb-4" />
                  <p className="text-[#5C5852]">{language === 'de' ? item.de : item.en}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <span className="overline">{language === 'de' ? 'STANDORT' : 'LOCATION'}</span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2D2A26] mt-3 md:mt-4">
                Weingut Hermann Böhmer
              </h2>
              
              <div className="flex items-start gap-3 md:gap-4 mt-6 md:mt-8 text-[#5C5852]">
                <MapPin size={20} className="text-[#8B2E2E] flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[#2D2A26] font-medium">Dürnstein 244</p>
                  <p className="text-sm md:text-base">3601 Dürnstein, Austria</p>
                </div>
              </div>

              <div className="flex gap-4 mt-8 md:mt-10">
                <Link to="/shop" className="btn-ghost inline-flex items-center gap-2">
                  {language === 'de' ? 'Zum Shop' : 'Visit Shop'}
                  <ArrowUpRight size={14} />
                </Link>
                <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
                  {language === 'de' ? 'Kontaktieren' : 'Contact Us'}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="aspect-video overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Wachau landscape"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-warm py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-[#2D2A26] mb-4">
            {language === 'de' ? 'Haben Sie Fragen?' : 'Have Questions?'}
          </h2>
          <p className="text-[#5C5852] mb-6">
            {language === 'de' 
              ? 'Wir freuen uns auf Ihre Nachricht. Kontaktieren Sie uns gerne!'
              : 'We look forward to your message. Feel free to contact us!'}
          </p>
          <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
            {language === 'de' ? 'Kontakt aufnehmen' : 'Get in Touch'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
