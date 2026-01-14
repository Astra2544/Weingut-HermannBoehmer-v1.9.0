import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function TermsPage() {
  const { language } = useLanguage();

  return (
    <main className="bg-[#F9F8F6] min-h-screen pt-28 md:pt-32" data-testid="terms-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="overline">{language === 'de' ? 'RECHTLICHES' : 'LEGAL'}</span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2D2A26] mt-3 md:mt-4">
            {language === 'de' ? 'AGB' : 'Terms & Conditions'}
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
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">1. Geltungsbereich</h2>
                <p className="leading-relaxed mb-4">
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen, die über unseren 
                  Online-Shop getätigt werden. Mit der Bestellung akzeptieren Sie diese Bedingungen.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">2. Vertragspartner</h2>
                <div className="bg-[#F2EFE9] p-6 my-6">
                  <p className="font-medium text-[#2D2A26]">Weingut Hermann Böhmer</p>
                  <p>Dürnstein 244</p>
                  <p>3601 Dürnstein, Österreich</p>
                  <p className="mt-3">UID-Nr: ATU12345678</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">3. Vertragsabschluss</h2>
                <p className="leading-relaxed mb-4">
                  Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot dar. 
                  Durch das Absenden der Bestellung geben Sie ein verbindliches Angebot ab. Der Kaufvertrag 
                  kommt zustande, wenn wir Ihre Bestellung durch eine Auftragsbestätigung annehmen.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">4. Preise und Versandkosten</h2>
                <p className="leading-relaxed mb-4">
                  Alle angegebenen Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                </p>
                <div className="bg-[#F2EFE9] p-6 my-6">
                  <p className="font-medium text-[#2D2A26] mb-2">Versandkosten:</p>
                  <ul className="space-y-2">
                    <li>• Österreich: €5,90 (ab €50 Bestellwert kostenlos)</li>
                    <li>• Deutschland: €9,90 (ab €75 Bestellwert kostenlos)</li>
                    <li>• EU: €14,90</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">5. Zahlung</h2>
                <p className="leading-relaxed mb-4">
                  Wir akzeptieren folgende Zahlungsmethoden:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Kreditkarte (Visa, Mastercard)</li>
                  <li>Sofortüberweisung</li>
                  <li>Vorkasse</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">6. Lieferung</h2>
                <p className="leading-relaxed mb-4">
                  Die Lieferzeit beträgt in der Regel 3-5 Werktage innerhalb Österreichs und 5-7 Werktage 
                  für andere EU-Länder. Wir versenden nur an Personen über 18 Jahren.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">7. Widerrufsrecht</h2>
                <p className="leading-relaxed mb-4">
                  Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. 
                  Die Widerrufsfrist beträgt 14 Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter 
                  die Waren in Besitz genommen haben.
                </p>
                <p className="leading-relaxed mb-4">
                  Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung 
                  (z.B. per E-Mail oder Post) über Ihren Entschluss informieren.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">8. Altersbeschränkung</h2>
                <p className="leading-relaxed mb-4 font-medium text-[#8B2E2E]">
                  Der Verkauf von alkoholischen Getränken erfolgt ausschließlich an Personen, die das 
                  18. Lebensjahr vollendet haben. Mit Ihrer Bestellung bestätigen Sie, dass Sie mindestens 
                  18 Jahre alt sind.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">9. Gewährleistung</h2>
                <p className="leading-relaxed mb-4">
                  Es gelten die gesetzlichen Gewährleistungsrechte. Bei Mängeln wenden Sie sich bitte 
                  an unseren Kundenservice.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">10. Schlussbestimmungen</h2>
                <p className="leading-relaxed mb-4">
                  Es gilt österreichisches Recht. Gerichtsstand ist Krems an der Donau, Österreich.
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
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">1. Scope</h2>
                <p className="leading-relaxed mb-4">
                  These General Terms and Conditions apply to all orders placed through our online shop. 
                  By placing an order, you accept these conditions.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">2. Contracting Party</h2>
                <div className="bg-[#F2EFE9] p-6 my-6">
                  <p className="font-medium text-[#2D2A26]">Weingut Hermann Böhmer</p>
                  <p>Dürnstein 244</p>
                  <p>3601 Dürnstein, Austria</p>
                  <p className="mt-3">VAT ID: ATU12345678</p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">3. Contract Conclusion</h2>
                <p className="leading-relaxed mb-4">
                  The presentation of products in the online shop does not constitute a legally binding offer. 
                  By submitting your order, you make a binding offer. The purchase contract is concluded when 
                  we accept your order with an order confirmation.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">4. Prices and Shipping</h2>
                <p className="leading-relaxed mb-4">
                  All prices include statutory VAT.
                </p>
                <div className="bg-[#F2EFE9] p-6 my-6">
                  <p className="font-medium text-[#2D2A26] mb-2">Shipping costs:</p>
                  <ul className="space-y-2">
                    <li>• Austria: €5.90 (free over €50)</li>
                    <li>• Germany: €9.90 (free over €75)</li>
                    <li>• EU: €14.90</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">5. Payment</h2>
                <p className="leading-relaxed mb-4">
                  We accept the following payment methods:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Credit card (Visa, Mastercard)</li>
                  <li>Instant bank transfer</li>
                  <li>Bank transfer in advance</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">6. Delivery</h2>
                <p className="leading-relaxed mb-4">
                  Delivery time is usually 3-5 business days within Austria and 5-7 business days 
                  for other EU countries. We only ship to persons over 18 years of age.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">7. Right of Withdrawal</h2>
                <p className="leading-relaxed mb-4">
                  You have the right to withdraw from this contract within 14 days without giving reasons. 
                  The withdrawal period is 14 days from the day on which you or a third party designated 
                  by you took possession of the goods.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">8. Age Restriction</h2>
                <p className="leading-relaxed mb-4 font-medium text-[#8B2E2E]">
                  Alcoholic beverages are sold exclusively to persons who have reached the age of 18. 
                  By placing your order, you confirm that you are at least 18 years old.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">9. Warranty</h2>
                <p className="leading-relaxed mb-4">
                  Statutory warranty rights apply. For defects, please contact our customer service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-serif text-2xl text-[#2D2A26] mb-4">10. Final Provisions</h2>
                <p className="leading-relaxed mb-4">
                  Austrian law applies. Place of jurisdiction is Krems an der Donau, Austria.
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
