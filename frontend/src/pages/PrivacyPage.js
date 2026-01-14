import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function PrivacyPage() {
  const { language } = useLanguage();

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="privacy-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="overline">{language === 'de' ? 'RECHTLICHES' : 'LEGAL'}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2D2A26] mt-3 md:mt-4">
            {language === 'de' ? 'Datenschutz' : 'Privacy Policy'}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-lg max-w-none mt-12 text-[#5C5852]"
        >
          {language === 'de' ? (
            <>
              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">1. Datenschutz auf einen Blick</h2>
                <h3 className="font-serif text-xl text-[#2D2A26] mt-6 mb-3">Allgemeine Hinweise</h3>
                <p className="leading-relaxed mb-4">
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
                  wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert 
                  werden können.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">2. Verantwortlicher</h2>
                <p className="leading-relaxed mb-4">
                  Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="bg-[#F2EFE9] p-6 my-6">
                  <p className="font-medium text-[#2D2A26]">Weingut Hermann Böhmer</p>
                  <p>Dürnstein 244</p>
                  <p>3601 Dürnstein, Österreich</p>
                  <p className="mt-3">Telefon: +43 2711 234 5678</p>
                  <p>E-Mail: info@weingut-boehmer.at</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">3. Datenerfassung auf dieser Website</h2>
                
                <h3 className="font-serif text-xl text-[#2D2A26] mt-6 mb-3">Cookies</h3>
                <p className="leading-relaxed mb-4">
                  Unsere Website verwendet Cookies. Diese sind kleine Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert. 
                  Cookies helfen uns dabei, unser Angebot nutzerfreundlicher zu machen.
                </p>
                <p className="leading-relaxed mb-4">
                  Wir verwenden ausschließlich technisch notwendige Cookies für den Warenkorb und Ihre Spracheinstellungen. 
                  Diese Daten werden nur lokal in Ihrem Browser gespeichert.
                </p>

                <h3 className="font-serif text-xl text-[#2D2A26] mt-6 mb-3">Bestelldaten</h3>
                <p className="leading-relaxed mb-4">
                  Bei einer Bestellung erfassen wir folgende Daten:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Name und Anschrift</li>
                  <li>E-Mail-Adresse</li>
                  <li>Telefonnummer</li>
                  <li>Bestelldetails und Tracking-Informationen</li>
                </ul>
                <p className="leading-relaxed mb-4">
                  Diese Daten werden zur Vertragserfüllung und gesetzlicher Aufbewahrungspflichten gespeichert.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">4. Ihre Rechte</h2>
                <p className="leading-relaxed mb-4">Sie haben jederzeit das Recht:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Auskunft über Ihre gespeicherten Daten zu erhalten</li>
                  <li>Berichtigung unrichtiger Daten zu verlangen</li>
                  <li>Löschung Ihrer Daten zu verlangen</li>
                  <li>Der Datenverarbeitung zu widersprechen</li>
                  <li>Ihre Daten in einem übertragbaren Format zu erhalten</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">5. SSL-Verschlüsselung</h2>
                <p className="leading-relaxed mb-4">
                  Diese Seite nutzt aus Sicherheitsgründen eine SSL-Verschlüsselung. Eine verschlüsselte Verbindung 
                  erkennen Sie daran, dass die Adresszeile des Browsers von &ldquo;http://&rdquo; auf &ldquo;https://&rdquo; wechselt.
                </p>
              </section>

              <div className="border-t border-[#E5E0D8] pt-8 mt-12">
                <p className="text-sm text-[#969088]">
                  Stand: Januar 2025
                </p>
              </div>
            </>
          ) : (
            <>
              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">1. Privacy at a Glance</h2>
                <h3 className="font-serif text-xl text-[#2D2A26] mt-6 mb-3">General Information</h3>
                <p className="leading-relaxed mb-4">
                  The following information provides a simple overview of what happens to your personal data when you visit 
                  this website. Personal data is any data that can be used to personally identify you.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">2. Data Controller</h2>
                <p className="leading-relaxed mb-4">
                  The data controller for this website is:
                </p>
                <div className="bg-[#F2EFE9] p-6 my-6">
                  <p className="font-medium text-[#2D2A26]">Weingut Hermann Böhmer</p>
                  <p>Dürnstein 244</p>
                  <p>3601 Dürnstein, Austria</p>
                  <p className="mt-3">Phone: +43 2711 234 5678</p>
                  <p>Email: info@weingut-boehmer.at</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">3. Data Collection on This Website</h2>
                
                <h3 className="font-serif text-xl text-[#2D2A26] mt-6 mb-3">Cookies</h3>
                <p className="leading-relaxed mb-4">
                  Our website uses cookies. These are small text files that your web browser stores on your device. 
                  Cookies help us make our website more user-friendly.
                </p>
                <p className="leading-relaxed mb-4">
                  We only use technically necessary cookies for the shopping cart and your language settings. 
                  This data is only stored locally in your browser.
                </p>

                <h3 className="font-serif text-xl text-[#2D2A26] mt-6 mb-3">Order Data</h3>
                <p className="leading-relaxed mb-4">
                  When placing an order, we collect the following data:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Name and address</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Order details and tracking information</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">4. Your Rights</h2>
                <p className="leading-relaxed mb-4">You have the right at any time to:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Receive information about your stored data</li>
                  <li>Request correction of incorrect data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to data processing</li>
                  <li>Receive your data in a portable format</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">5. SSL Encryption</h2>
                <p className="leading-relaxed mb-4">
                  This site uses SSL encryption for security reasons. You can recognize an encrypted connection 
                  by the address bar changing from &ldquo;http://&rdquo; to &ldquo;https://&rdquo;.
                </p>
              </section>

              <div className="border-t border-[#E5E0D8] pt-8 mt-12">
                <p className="text-sm text-[#969088]">
                  Last updated: January 2025
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
