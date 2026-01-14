import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ImprintPage() {
  const { language } = useLanguage();

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="imprint-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="overline">{language === 'de' ? 'RECHTLICHES' : 'LEGAL'}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2D2A26] mt-3 md:mt-4">
            {language === 'de' ? 'Impressum' : 'Imprint'}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12"
        >
          {/* Main Info Card */}
          <div className="bg-white border border-[#E5E0D8] p-8 md:p-12">
            <h2 className="font-serif text-3xl text-[#2D2A26] mb-8">
              Weingut Hermann Böhmer
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="text-[#8B2E2E] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#2D2A26]">{language === 'de' ? 'Adresse' : 'Address'}</p>
                    <p className="text-[#5C5852] mt-1">
                      Dürnstein 244<br />
                      3601 Dürnstein<br />
                      {language === 'de' ? 'Österreich' : 'Austria'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="text-[#8B2E2E] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#2D2A26]">{language === 'de' ? 'Telefon' : 'Phone'}</p>
                    <a href="tel:+4327112345678" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors mt-1 block">
                      +43 2711 234 5678
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="text-[#8B2E2E] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#2D2A26]">E-Mail</p>
                    <a href="mailto:info@weingut-boehmer.at" className="text-[#5C5852] hover:text-[#8B2E2E] transition-colors mt-1 block">
                      info@weingut-boehmer.at
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Globe className="text-[#8B2E2E] mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-[#2D2A26]">Website</p>
                    <p className="text-[#5C5852] mt-1">www.weingut-boehmer.at</p>
                  </div>
                </div>
              </div>

              {/* Legal Info */}
              <div className="space-y-6">
                <div>
                  <p className="font-medium text-[#2D2A26]">{language === 'de' ? 'Inhaber' : 'Owner'}</p>
                  <p className="text-[#5C5852] mt-1">Hermann Böhmer</p>
                </div>

                <div>
                  <p className="font-medium text-[#2D2A26]">{language === 'de' ? 'Rechtsform' : 'Legal Form'}</p>
                  <p className="text-[#5C5852] mt-1">{language === 'de' ? 'Einzelunternehmen' : 'Sole Proprietorship'}</p>
                </div>

                <div>
                  <p className="font-medium text-[#2D2A26]">UID-Nr.</p>
                  <p className="text-[#5C5852] mt-1">ATU12345678</p>
                </div>

                <div>
                  <p className="font-medium text-[#2D2A26]">{language === 'de' ? 'Firmenbuchnummer' : 'Company Register No.'}</p>
                  <p className="text-[#5C5852] mt-1">FN 123456a</p>
                </div>

                <div>
                  <p className="font-medium text-[#2D2A26]">{language === 'de' ? 'Firmenbuchgericht' : 'Commercial Court'}</p>
                  <p className="text-[#5C5852] mt-1">Landesgericht Krems an der Donau</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="mt-8 space-y-8 text-[#5C5852]">
            <section>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Aufsichtsbehörde' : 'Supervisory Authority'}
              </h3>
              <p className="leading-relaxed">
                Bezirkshauptmannschaft Krems<br />
                Drinkweldergasse 15<br />
                3500 Krems an der Donau
              </p>
            </section>

            <section>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Berufsbezeichnung' : 'Professional Title'}
              </h3>
              <p className="leading-relaxed">
                {language === 'de' 
                  ? 'Winzer, verliehen in Österreich' 
                  : 'Winemaker, awarded in Austria'}
              </p>
            </section>

            <section>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Mitgliedschaften' : 'Memberships'}
              </h3>
              <ul className="space-y-2">
                <li>• Wirtschaftskammer Niederösterreich</li>
                <li>• Österreichischer Weinbauverband</li>
                <li>• Vinea Wachau</li>
              </ul>
            </section>

            <section>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Haftungsausschluss' : 'Disclaimer'}
              </h3>
              <p className="leading-relaxed">
                {language === 'de' 
                  ? 'Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.' 
                  : 'Despite careful content control, we assume no liability for the content of external links. The operators of the linked pages are solely responsible for their content.'}
              </p>
            </section>

            <section>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Urheberrecht' : 'Copyright'}
              </h3>
              <p className="leading-relaxed">
                {language === 'de' 
                  ? 'Die Inhalte dieser Website sind urheberrechtlich geschützt. Jede Verwertung außerhalb der Grenzen des Urheberrechts bedarf der Zustimmung des Betreibers.' 
                  : 'The content of this website is protected by copyright. Any use beyond the limits of copyright law requires the consent of the operator.'}
              </p>
            </section>

            <section>
              <h3 className="font-serif text-xl text-[#2D2A26] mb-4">
                {language === 'de' ? 'Online-Streitbeilegung' : 'Online Dispute Resolution'}
              </h3>
              <p className="leading-relaxed">
                {language === 'de' 
                  ? 'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:' 
                  : 'The European Commission provides a platform for online dispute resolution (OS):'}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#8B2E2E] hover:underline ml-1"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
            </section>
          </div>

          <div className="border-t border-[#E5E0D8] pt-8 mt-12">
            <p className="text-sm text-[#969088]">
              {language === 'de' ? 'Stand: Januar 2025' : 'Last updated: January 2025'}
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
