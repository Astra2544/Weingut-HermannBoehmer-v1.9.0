import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ==================== WISSENSDATENBANK (DEUTSCH & ENGLISCH) ====================
const KNOWLEDGE_BASE = {
  de: {
    // ===== ÜBER UNS / UNTERNEHMEN =====
    about: {
      keywords: ['über', 'wer', 'firma', 'unternehmen', 'geschichte', 'family', 'familie', 'hermann', 'böhmer', 'boehmer', 'weingut', 'who', 'about'],
      response: `🍑 **Über Hermann Böhmer**

Wir sind ein traditionelles Familienunternehmen aus Dürnstein in der Wachau. Seit Generationen stellen wir handgemachte Spezialitäten aus den besten Wachauer Marillen her.

Unsere Produkte werden mit Liebe und nach traditionellen Rezepten hergestellt - 100% handgemacht in Dürnstein!

Besuchen Sie uns gerne vor Ort oder stöbern Sie in unserem Online-Shop. 🛒`
    },

    // ===== STANDORT DÜRNSTEIN =====
    location: {
      keywords: ['dürnstein', 'durnstein', 'standort', 'adresse', 'wo', 'finden', 'besuchen', 'laden', 'geschäft', 'shop', 'location', 'where', 'visit', 'wachau', 'österreich', 'austria', 'malerwinkel', 'öffnungszeiten'],
      response: `📍 **Unser Standort in Dürnstein**

**Adresse:**
Hermann Böhmer
Dürnstein 244
3601 Dürnstein, Österreich

**Zweiter Standort:**
Malerwinkel Dürnstein
(Automat mit unseren Produkten 24/7)

🏰 **Über Dürnstein:**
Dürnstein liegt im Herzen der Wachau, einem UNESCO-Weltkulturerbe. Bekannt für die blaue Stiftskirche, die Burgruine (wo Richard Löwenherz gefangen war) und natürlich die weltberühmten Wachauer Marillen!

📞 Kontakt: +43 650 2711237
📧 E-Mail: info@hermann-boehmer.com`
    },

    // ===== MARILLEN ALLGEMEIN =====
    apricots: {
      keywords: ['marille', 'marillen', 'aprikose', 'aprikosen', 'apricot', 'frucht', 'obst', 'wachauer marille', 'original'],
      response: `🍑 **Die Wachauer Marille**

Die Wachauer Marille ist weltberühmt und eine geschützte Ursprungsbezeichnung (g.U.). 

**Was macht sie besonders?**
• Intensives, süß-säuerliches Aroma
• Sonnengereift in der Wachau
• Perfektes Mikroklima zwischen Donau und Weinbergen
• Ernte: Juli bis August

**Unsere Produkte:**
Wir verarbeiten nur echte Wachauer Marillen zu:
• Marillenlikör & Edelbränden
• Marillenmarmelade
• Marillenschokolade
• Marillenpralinen
• Chutneys & mehr

Alle 100% handgemacht in Dürnstein! 🌟`
    },

    // ===== MARILLENMARMELADE =====
    jam: {
      keywords: ['marmelade', 'konfitüre', 'aufstrich', 'frühstück', 'brot', 'jam', 'preserve', 'fruchtaufstrich'],
      response: `🍯 **Unsere Marillenmarmelade**

Handgemachte Marillenmarmelade aus 100% Wachauer Marillen!

**Besonderheiten:**
• Hoher Fruchtanteil (mind. 60%)
• Ohne künstliche Zusätze
• Nach traditionellem Familienrezept
• Stückige Früchte für echten Geschmack

**Perfekt zu:**
• Frischem Gebäck & Croissants
• Palatschinken
• Käse (besonders Camembert!)
• Joghurt & Müsli

**Haltbarkeit:** Ungeöffnet 24 Monate, geöffnet im Kühlschrank 4 Wochen.

👉 Jetzt im Shop entdecken!`
    },

    // ===== SCHOKOLADE =====
    chocolate: {
      keywords: ['schokolade', 'schoko', 'chocolate', 'praline', 'pralinen', 'süß', 'süßigkeit', 'naschen', 'kakao', 'confiserie'],
      response: `🍫 **Marillenschokolade & Pralinen**

Edle Schokoladenkreationen mit echten Wachauer Marillen!

**Unser Sortiment:**
• **Marillenpralinen** - Zartschmelzend mit Marillenfüllung
• **Marillen-Edelbitter** - Dunkle Schokolade mit Marillenstücken
• **Marillen-Vollmilch** - Cremig & fruchtig

**Qualität:**
• Belgische Schokolade
• Echte Marillenstücke
• Handgefertigt
• Ohne Palmöl

**Ideal als Geschenk!** 🎁
Alle Schokoladen sind hübsch verpackt.

**Lagerung:** Kühl und trocken, 15-18°C ideal.`
    },

    // ===== LIKÖRE =====
    liqueur: {
      keywords: ['likör', 'likoer', 'liqueur', 'alkohol', 'schnaps', 'trinken', 'drink', 'aperitif', 'digestif', 'süßer'],
      response: `🥃 **Wachauer Marillenlikör**

Unser Klassiker - der original Wachauer Marillenlikör!

**Details:**
• Alkoholgehalt: ca. 25% vol.
• Aus 100% Wachauer Marillen
• Natürliche Süße der Frucht
• Seidig-weicher Geschmack

**Genuss-Tipps:**
• Pur als Digestif (gekühlt)
• Im Cocktail (Prosecco + Marillenlikör = Hugo Marille!)
• Über Vanilleeis
• Im Dessert

**Hinweis:** 🔞 Verkauf nur an Personen ab 18 Jahren.

**Flaschengrößen:** 0,35l, 0,5l, 0,7l

👉 Im Shop entdecken!`
    },

    // ===== EDELBRÄNDE =====
    brandy: {
      keywords: ['edelbrand', 'brand', 'schnaps', 'destillat', 'gebrannt', 'brennerei', 'obstbrand', 'marillenbrand', 'brandy', 'spirit', 'destillerie', 'hochprozentig'],
      response: `🥃 **Wachauer Edelbrände**

Premium-Destillate aus der Wachau - für Kenner!

**Unser Sortiment:**
• **Marillenbrand** - Der Klassiker, 40% vol.
• **Marille im Eichenfass** - Fassgelagert, mild & komplex
• **Williams** - Birne, fruchtig & elegant
• **Zwetschke** - Würzig & vollmundig

**Qualität:**
• Doppelt destilliert
• Nur reife Früchte
• Traditionelle Kupferbrennblasen
• Ohne Zusätze

**Genuss:**
Am besten bei 16-18°C im tulpenförmigen Glas. Langsam schwenken, riechen, genießen!

🔞 Ab 18 Jahren.`
    },

    // ===== CHUTNEY =====
    chutney: {
      keywords: ['chutney', 'sauce', 'soße', 'würzig', 'grillen', 'käse', 'pikant', 'süß-sauer'],
      response: `🥄 **Marillenchutney**

Die perfekte süß-pikante Begleitung!

**Geschmack:**
• Süß-säuerlich mit leichter Schärfe
• Fruchtig durch echte Marillen
• Würzig abgerundet

**Passt perfekt zu:**
• Käseplatte (Brie, Camembert, Hartkäse)
• Gegrilltem Fleisch
• Wildgerichten
• Curry-Gerichten
• Als Dip zu Nachos

**Zutaten:**
Wachauer Marillen, Essig, Zucker, Zwiebeln, Gewürze - ohne Konservierungsstoffe!

**Haltbarkeit:** Ungeöffnet 18 Monate.`
    },

    // ===== GESCHENKE =====
    gifts: {
      keywords: ['geschenk', 'gift', 'present', 'geburtstag', 'weihnachten', 'mitbringsel', 'präsent', 'geschenkset', 'set', 'box', 'paket', 'schenken'],
      response: `🎁 **Geschenkideen**

Das perfekte Mitbringsel aus der Wachau!

**Geschenksets:**
• **Marillen-Genussbox** - Likör + Marmelade + Pralinen
• **Verkostungsset** - 3 verschiedene Edelbrände
• **Süße Versuchung** - Schokolade & Pralinen

**Für jeden Anlass:**
• 🎄 Weihnachten
• 🎂 Geburtstage  
• 💝 Muttertag/Vatertag
• 🏠 Gastgeschenk
• 💼 Firmengeschenke

**Service:**
• Schöne Geschenkverpackung
• Persönliche Grußkarte möglich
• Versand direkt an Beschenkte

Fragen zu Geschenken? Schreiben Sie uns! 📧`
    },

    // ===== VERSAND =====
    shipping: {
      keywords: ['versand', 'lieferung', 'shipping', 'delivery', 'liefern', 'schicken', 'dauer', 'kosten', 'porto', 'paket', 'post', 'dhl', 'zustellung', 'deutschland', 'schweiz'],
      response: `📦 **Versand & Lieferung**

**Lieferzeiten:**
• Österreich: 2-3 Werktage
• Deutschland: 3-5 Werktage
• EU: 5-7 Werktage

**Versandkosten:**
• Österreich: €5,90 (ab €60 GRATIS!)
• Deutschland: €9,90 (ab €80 GRATIS!)
• Andere Länder: Im Checkout angezeigt

**Versandpartner:**
Wir versenden mit Österreichischer Post / DHL.

**Tracking:**
Nach Versand erhalten Sie eine E-Mail mit Tracking-Nummer.

**Fragen zur Lieferung?**
📧 info@hermann-boehmer.com
📞 +43 650 2711237`
    },

    // ===== BESTELLUNG =====
    order: {
      keywords: ['bestellen', 'bestellung', 'order', 'kaufen', 'buy', 'warenkorb', 'cart', 'checkout', 'zahlung', 'bezahlen', 'payment', 'kauf'],
      response: `🛒 **So bestellen Sie:**

**1. Produkte wählen**
Stöbern Sie im Shop und legen Sie Produkte in den Warenkorb.

**2. Warenkorb prüfen**
Klicken Sie auf das Warenkorb-Symbol oben rechts.

**3. Zur Kasse**
Geben Sie Ihre Daten ein und wählen Sie die Versandart.

**4. Bezahlen**
Sichere Zahlung mit Kreditkarte, Klarna, SEPA oder Apple Pay.

**5. Bestätigung**
Sie erhalten eine E-Mail mit Rechnung (PDF).

**Gutscheincode?**
Im Warenkorb können Sie einen Rabattcode eingeben! 🎁

**Fragen?** Wir helfen gerne!`
    },

    // ===== BEZAHLUNG =====
    payment: {
      keywords: ['bezahlung', 'zahlung', 'payment', 'kreditkarte', 'visa', 'mastercard', 'paypal', 'klarna', 'rechnung', 'überweisung', 'sepa', 'apple pay', 'google pay'],
      response: `💳 **Zahlungsmöglichkeiten**

Wir akzeptieren:
• **Kreditkarte** - Visa, Mastercard, Amex
• **SEPA-Lastschrift** - Direkt vom Konto
• **Apple Pay / Google Pay**
• **Klarna** - Sofort oder später zahlen
• **Bancontact, iDEAL, etc.**

**Sicherheit:**
🔒 Alle Zahlungen werden verschlüsselt über Stripe abgewickelt - 100% sicher!

**Rechnung:**
Nach erfolgreicher Bestellung erhalten Sie automatisch eine PDF-Rechnung per E-Mail.`
    },

    // ===== KONTAKT =====
    contact: {
      keywords: ['kontakt', 'contact', 'erreichen', 'telefon', 'anrufen', 'email', 'mail', 'frage', 'hilfe', 'support', 'help'],
      response: `📞 **Kontakt**

**Hermann Böhmer**
Dürnstein 244
3601 Dürnstein, Österreich

📞 **Telefon:** +43 650 2711237
📧 **E-Mail:** info@hermann-boehmer.com

**Kontaktformular:**
Nutzen Sie unser Kontaktformular auf der Website - wir antworten innerhalb von 24 Stunden!

**Social Media:**
Folgen Sie uns für News und Rezepte!

Wir freuen uns auf Ihre Nachricht! 😊`
    },

    // ===== ALKOHOL / 18+ =====
    alcohol: {
      keywords: ['alkohol', 'alcohol', '18', 'alter', 'jugendschutz', 'volljährig', 'mindestalter', 'promille', 'betrunken'],
      response: `🔞 **Hinweis zu Alkohol**

Der Verkauf von alkoholischen Produkten (Liköre, Edelbrände) ist nur an Personen ab 18 Jahren gestattet.

**Bei der Bestellung:**
Sie müssen bestätigen, dass Sie mindestens 18 Jahre alt sind.

**Bei der Lieferung:**
Der Zusteller kann einen Altersnachweis verlangen.

**Alkoholgehalt unserer Produkte:**
• Liköre: ca. 25% vol.
• Edelbrände: ca. 40% vol.

Bitte genießen Sie Alkohol verantwortungsvoll! 🍷`
    },

    // ===== GUTSCHEIN =====
    coupon: {
      keywords: ['gutschein', 'rabatt', 'code', 'coupon', 'discount', 'sparen', 'aktion', 'angebot', 'prozent', '%'],
      response: `🎁 **Gutscheine & Rabatte**

**Gutschein einlösen:**
1. Produkte in den Warenkorb legen
2. Im Warenkorb das Gutscheinfeld finden
3. Code eingeben und "Anwenden" klicken
4. Rabatt wird sofort abgezogen!

**Aktueller Gutschein:**
🏷️ **WILLKOMMEN10** - 10% Rabatt für Neukunden!

**Newsletter:**
Melden Sie sich für unseren Newsletter an und erhalten Sie exklusive Angebote!

**Tipp:** Ab €60 Bestellwert ist der Versand nach Österreich GRATIS! 📦`
    },

    // ===== QUALITÄT =====
    quality: {
      keywords: ['qualität', 'quality', 'bio', 'natürlich', 'natural', 'zusätze', 'konservierung', 'handgemacht', 'handmade', 'traditional', 'traditionell', 'zutaten', 'inhalt'],
      response: `✨ **Unsere Qualität**

**100% Handgemacht:**
Jedes Produkt wird von Hand in unserer Manufaktur in Dürnstein hergestellt.

**Natürliche Zutaten:**
• Echte Wachauer Marillen
• Keine künstlichen Aromen
• Keine Konservierungsstoffe
• Keine Farbstoffe

**Tradition:**
Unsere Rezepte werden seit Generationen weitergegeben.

**Regional:**
Kurze Wege - wir verarbeiten Früchte aus der Wachau.

**Auszeichnungen:**
Unsere Produkte wurden mehrfach prämiert! 🏆`
    },

    // ===== LAGERUNG =====
    storage: {
      keywords: ['lagerung', 'lagern', 'aufbewahren', 'haltbar', 'haltbarkeit', 'storage', 'kühlschrank', 'temperatur', 'mindesthaltbarkeit', 'mhd'],
      response: `📦 **Lagerung & Haltbarkeit**

**Marmelade:**
• Ungeöffnet: 24 Monate (kühl & dunkel)
• Geöffnet: 4 Wochen im Kühlschrank

**Schokolade & Pralinen:**
• 15-18°C, trocken lagern
• Nicht im Kühlschrank!
• Haltbarkeit: 6-12 Monate

**Liköre & Edelbrände:**
• Stehend lagern
• Vor Sonnenlicht schützen
• Zimmertemperatur OK
• Nach Öffnung: unbegrenzt haltbar

**Chutney:**
• Ungeöffnet: 18 Monate
• Geöffnet: 4 Wochen gekühlt

Das MHD finden Sie auf jedem Produkt.`
    },

    // ===== REZEPTE =====
    recipes: {
      keywords: ['rezept', 'recipe', 'kochen', 'backen', 'verwendung', 'verwenden', 'cocktail', 'dessert', 'kuchen', 'tipp'],
      response: `👨‍🍳 **Rezepte & Tipps**

**Mit Marillenlikör:**
🍹 **Marillen-Spritz:** Likör + Prosecco + Soda + Eis
🍨 **Dessert:** Über Vanilleeis gießen
🎂 **Kuchen:** Zum Tränken von Biskuit

**Mit Marmelade:**
🥐 Klassisch auf Croissant
🧀 Zu Käse (Brie!)
🥞 In Palatschinken

**Mit Chutney:**
🧀 Käseplatte
🍖 Zu gegrilltem Fleisch
🍛 Zu Curry

**Mehr Rezepte?**
Folgen Sie uns auf Social Media für regelmäßige Rezeptideen! 📱`
    },
  },

  // ==================== ENGLISH VERSION ====================
  en: {
    // ===== ABOUT US / COMPANY =====
    about: {
      keywords: ['about', 'who', 'company', 'business', 'history', 'family', 'hermann', 'böhmer', 'boehmer', 'winery', 'estate'],
      response: `🍑 **About Hermann Böhmer**

We are a traditional family business from Dürnstein in the Wachau Valley. For generations, we have been crafting handmade specialties from the finest Wachau apricots.

Our products are made with love and according to traditional recipes - 100% handmade in Dürnstein!

Visit us in person or browse our online shop. 🛒`
    },

    // ===== LOCATION DÜRNSTEIN =====
    location: {
      keywords: ['dürnstein', 'durnstein', 'location', 'address', 'where', 'find', 'visit', 'store', 'shop', 'wachau', 'austria', 'malerwinkel', 'hours'],
      response: `📍 **Our Location in Dürnstein**

**Address:**
Hermann Böhmer
Dürnstein 244
3601 Dürnstein, Austria

**Second Location:**
Malerwinkel Dürnstein
(Vending machine with our products 24/7)

🏰 **About Dürnstein:**
Dürnstein is located in the heart of the Wachau, a UNESCO World Heritage Site. Known for the blue abbey church, the castle ruins (where Richard the Lionheart was imprisoned) and of course the world-famous Wachau apricots!

📞 Phone: +43 650 2711237
📧 Email: info@hermann-boehmer.com`
    },

    // ===== APRICOTS GENERAL =====
    apricots: {
      keywords: ['apricot', 'apricots', 'fruit', 'wachau apricot', 'original', 'marille'],
      response: `🍑 **The Wachau Apricot**

The Wachau apricot is world-famous and has a Protected Designation of Origin (PDO).

**What makes it special?**
• Intense, sweet-tart aroma
• Sun-ripened in the Wachau
• Perfect microclimate between the Danube and vineyards
• Harvest: July to August

**Our Products:**
We only process authentic Wachau apricots into:
• Apricot liqueur & fine brandies
• Apricot jam
• Apricot chocolate
• Apricot pralines
• Chutneys & more

All 100% handmade in Dürnstein! 🌟`
    },

    // ===== JAM =====
    jam: {
      keywords: ['jam', 'preserve', 'spread', 'breakfast', 'bread', 'marmalade', 'fruit spread'],
      response: `🍯 **Our Apricot Jam**

Handmade apricot jam from 100% Wachau apricots!

**Features:**
• High fruit content (min. 60%)
• No artificial additives
• Traditional family recipe
• Chunky fruit pieces for authentic taste

**Perfect with:**
• Fresh pastries & croissants
• Pancakes
• Cheese (especially Camembert!)
• Yogurt & muesli

**Shelf life:** Unopened 24 months, opened in refrigerator 4 weeks.

👉 Discover in our shop!`
    },

    // ===== CHOCOLATE =====
    chocolate: {
      keywords: ['chocolate', 'praline', 'pralines', 'sweet', 'candy', 'treats', 'cocoa', 'confectionery'],
      response: `🍫 **Apricot Chocolate & Pralines**

Exquisite chocolate creations with real Wachau apricots!

**Our Selection:**
• **Apricot Pralines** - Melt-in-your-mouth with apricot filling
• **Apricot Dark Chocolate** - Dark chocolate with apricot pieces
• **Apricot Milk Chocolate** - Creamy & fruity

**Quality:**
• Belgian chocolate
• Real apricot pieces
• Handcrafted
• Palm oil free

**Perfect as a gift!** 🎁
All chocolates are beautifully packaged.

**Storage:** Cool and dry, 15-18°C ideal.`
    },

    // ===== LIQUEURS =====
    liqueur: {
      keywords: ['liqueur', 'liquor', 'alcohol', 'drink', 'aperitif', 'digestif', 'sweet'],
      response: `🥃 **Wachau Apricot Liqueur**

Our classic - the original Wachau apricot liqueur!

**Details:**
• Alcohol content: approx. 25% vol.
• Made from 100% Wachau apricots
• Natural sweetness of the fruit
• Silky smooth taste

**Serving suggestions:**
• Neat as a digestif (chilled)
• In cocktails (Prosecco + Apricot Liqueur = Apricot Hugo!)
• Over vanilla ice cream
• In desserts

**Note:** 🔞 Sale only to persons 18 years and older.

**Bottle sizes:** 0.35l, 0.5l, 0.7l

👉 Discover in our shop!`
    },

    // ===== BRANDIES =====
    brandy: {
      keywords: ['brandy', 'spirit', 'distillate', 'distillery', 'fruit brandy', 'apricot brandy', 'high proof'],
      response: `🥃 **Wachau Fine Brandies**

Premium distillates from the Wachau - for connoisseurs!

**Our Selection:**
• **Apricot Brandy** - The classic, 40% vol.
• **Oak-aged Apricot** - Barrel-aged, mild & complex
• **Williams Pear** - Fruity & elegant
• **Plum** - Spicy & full-bodied

**Quality:**
• Double distilled
• Only ripe fruits
• Traditional copper stills
• No additives

**Enjoyment:**
Best served at 16-18°C in a tulip-shaped glass. Slowly swirl, smell, enjoy!

🔞 Age 18 and over.`
    },

    // ===== CHUTNEY =====
    chutney: {
      keywords: ['chutney', 'sauce', 'spicy', 'grilling', 'cheese', 'savory', 'sweet-sour'],
      response: `🥄 **Apricot Chutney**

The perfect sweet and savory accompaniment!

**Taste:**
• Sweet-sour with a light kick
• Fruity from real apricots
• Rounded with spices

**Perfect with:**
• Cheese board (Brie, Camembert, hard cheese)
• Grilled meat
• Game dishes
• Curry dishes
• As a dip for nachos

**Ingredients:**
Wachau apricots, vinegar, sugar, onions, spices - no preservatives!

**Shelf life:** Unopened 18 months.`
    },

    // ===== GIFTS =====
    gifts: {
      keywords: ['gift', 'present', 'birthday', 'christmas', 'souvenir', 'gift set', 'set', 'box', 'package'],
      response: `🎁 **Gift Ideas**

The perfect souvenir from the Wachau!

**Gift Sets:**
• **Apricot Gourmet Box** - Liqueur + Jam + Pralines
• **Tasting Set** - 3 different fine brandies
• **Sweet Temptation** - Chocolate & Pralines

**For every occasion:**
• 🎄 Christmas
• 🎂 Birthdays
• 💝 Mother's/Father's Day
• 🏠 Host gift
• 💼 Corporate gifts

**Service:**
• Beautiful gift packaging
• Personal greeting card available
• Direct shipping to recipients

Questions about gifts? Contact us! 📧`
    },

    // ===== SHIPPING =====
    shipping: {
      keywords: ['shipping', 'delivery', 'ship', 'send', 'duration', 'cost', 'postage', 'package', 'post', 'dhl', 'germany', 'switzerland'],
      response: `📦 **Shipping & Delivery**

**Delivery Times:**
• Austria: 2-3 business days
• Germany: 3-5 business days
• EU: 5-7 business days

**Shipping Costs:**
• Austria: €5.90 (FREE from €60!)
• Germany: €9.90 (FREE from €80!)
• Other countries: Shown at checkout

**Shipping Partner:**
We ship with Austrian Post / DHL.

**Tracking:**
After shipping, you will receive an email with tracking number.

**Questions about delivery?**
📧 info@hermann-boehmer.com
📞 +43 650 2711237`
    },

    // ===== ORDER =====
    order: {
      keywords: ['order', 'buy', 'purchase', 'cart', 'checkout', 'payment', 'pay'],
      response: `🛒 **How to Order:**

**1. Choose products**
Browse the shop and add products to your cart.

**2. Review cart**
Click on the cart icon in the top right corner.

**3. Checkout**
Enter your details and select shipping method.

**4. Pay**
Secure payment with credit card, Klarna, SEPA or Apple Pay.

**5. Confirmation**
You will receive an email with invoice (PDF).

**Discount code?**
You can enter a promo code in the cart! 🎁

**Questions?** We're happy to help!`
    },

    // ===== PAYMENT =====
    payment: {
      keywords: ['payment', 'pay', 'credit card', 'visa', 'mastercard', 'paypal', 'klarna', 'invoice', 'transfer', 'sepa', 'apple pay', 'google pay'],
      response: `💳 **Payment Options**

We accept:
• **Credit Card** - Visa, Mastercard, Amex
• **SEPA Direct Debit** - Direct from account
• **Apple Pay / Google Pay**
• **Klarna** - Pay now or later
• **Bancontact, iDEAL, etc.**

**Security:**
🔒 All payments are encrypted via Stripe - 100% secure!

**Invoice:**
After successful order, you will automatically receive a PDF invoice by email.`
    },

    // ===== CONTACT =====
    contact: {
      keywords: ['contact', 'reach', 'phone', 'call', 'email', 'mail', 'question', 'help', 'support'],
      response: `📞 **Contact**

**Hermann Böhmer**
Dürnstein 244
3601 Dürnstein, Austria

📞 **Phone:** +43 650 2711237
📧 **Email:** info@hermann-boehmer.com

**Contact Form:**
Use our contact form on the website - we respond within 24 hours!

**Social Media:**
Follow us for news and recipes!

We look forward to your message! 😊`
    },

    // ===== ALCOHOL / 18+ =====
    alcohol: {
      keywords: ['alcohol', '18', 'age', 'legal age', 'minimum age', 'drunk'],
      response: `🔞 **Alcohol Notice**

The sale of alcoholic products (liqueurs, brandies) is only permitted to persons 18 years of age and older.

**When ordering:**
You must confirm that you are at least 18 years old.

**Upon delivery:**
The delivery person may request proof of age.

**Alcohol content of our products:**
• Liqueurs: approx. 25% vol.
• Brandies: approx. 40% vol.

Please enjoy alcohol responsibly! 🍷`
    },

    // ===== COUPON =====
    coupon: {
      keywords: ['coupon', 'discount', 'code', 'promo', 'save', 'offer', 'percent', '%'],
      response: `🎁 **Coupons & Discounts**

**Redeem coupon:**
1. Add products to cart
2. Find the coupon field in cart
3. Enter code and click "Apply"
4. Discount is applied immediately!

**Current coupon:**
🏷️ **WILLKOMMEN10** - 10% discount for new customers!

**Newsletter:**
Sign up for our newsletter and receive exclusive offers!

**Tip:** Free shipping to Austria on orders over €60! 📦`
    },

    // ===== QUALITY =====
    quality: {
      keywords: ['quality', 'organic', 'natural', 'additives', 'preservatives', 'handmade', 'traditional', 'ingredients'],
      response: `✨ **Our Quality**

**100% Handmade:**
Every product is made by hand in our manufactory in Dürnstein.

**Natural Ingredients:**
• Real Wachau apricots
• No artificial flavors
• No preservatives
• No colorings

**Tradition:**
Our recipes have been passed down for generations.

**Regional:**
Short distances - we process fruits from the Wachau.

**Awards:**
Our products have won multiple awards! 🏆`
    },

    // ===== STORAGE =====
    storage: {
      keywords: ['storage', 'store', 'keep', 'shelf life', 'expiry', 'refrigerator', 'temperature', 'best before'],
      response: `📦 **Storage & Shelf Life**

**Jam:**
• Unopened: 24 months (cool & dark)
• Opened: 4 weeks in refrigerator

**Chocolate & Pralines:**
• 15-18°C, store dry
• Not in refrigerator!
• Shelf life: 6-12 months

**Liqueurs & Brandies:**
• Store upright
• Protect from sunlight
• Room temperature OK
• After opening: unlimited shelf life

**Chutney:**
• Unopened: 18 months
• Opened: 4 weeks refrigerated

Best before date is on every product.`
    },

    // ===== RECIPES =====
    recipes: {
      keywords: ['recipe', 'cook', 'bake', 'use', 'cocktail', 'dessert', 'cake', 'tip'],
      response: `👨‍🍳 **Recipes & Tips**

**With Apricot Liqueur:**
🍹 **Apricot Spritz:** Liqueur + Prosecco + Soda + Ice
🍨 **Dessert:** Pour over vanilla ice cream
🎂 **Cake:** For soaking sponge cake

**With Jam:**
🥐 Classic on croissant
🧀 With cheese (Brie!)
🥞 In pancakes

**With Chutney:**
🧀 Cheese board
🍖 With grilled meat
🍛 With curry

**More recipes?**
Follow us on social media for regular recipe ideas! 📱`
    },
  }
};

// ==================== STANDARD-ANTWORTEN (ZWEISPRACHIG) ====================
const GREETINGS = {
  de: [
    'Hallo! 👋 Wie kann ich Ihnen helfen?',
    'Grüß Gott! 🍑 Was möchten Sie wissen?',
    'Servus! Schön, dass Sie da sind! Wie kann ich helfen?',
    'Willkommen bei Hermann Böhmer! 🍑 Was darf ich für Sie tun?'
  ],
  en: [
    'Hello! 👋 How can I help you?',
    'Welcome! 🍑 What would you like to know?',
    'Hi there! Great to have you here! How can I help?',
    'Welcome to Hermann Böhmer! 🍑 What can I do for you?'
  ]
};

const FALLBACK_RESPONSES = {
  de: [
    `Hmm, das habe ich nicht ganz verstanden. 🤔

Ich kann Ihnen helfen bei Fragen zu:
• 🍑 Unseren Produkten (Likör, Marmelade, Schokolade...)
• 📍 Unserem Standort in Dürnstein
• 📦 Versand & Lieferung
• 💳 Bestellung & Bezahlung
• 🎁 Geschenkideen

Oder schreiben Sie uns: info@hermann-boehmer.com`,

    `Das kann ich leider nicht beantworten. 😊

Fragen Sie mich gerne zu:
• Wachauer Marillen & unsere Produkte
• Versand nach Deutschland/Österreich
• Geschenksets
• Öffnungszeiten & Standort

Für komplexe Anfragen: 📧 info@hermann-boehmer.com`,
  ],
  en: [
    `Hmm, I didn't quite understand that. 🤔

I can help you with questions about:
• 🍑 Our products (liqueur, jam, chocolate...)
• 📍 Our location in Dürnstein
• 📦 Shipping & delivery
• 💳 Ordering & payment
• 🎁 Gift ideas

Or email us: info@hermann-boehmer.com`,

    `I'm afraid I can't answer that. 😊

Feel free to ask me about:
• Wachau apricots & our products
• Shipping to Germany/Austria
• Gift sets
• Opening hours & location

For complex inquiries: 📧 info@hermann-boehmer.com`,
  ]
};

const THANKS_RESPONSES = {
  de: 'Sehr gerne! 😊 Wenn Sie weitere Fragen haben, bin ich hier. Viel Freude mit unseren Produkten! 🍑',
  en: 'You\'re welcome! 😊 If you have any more questions, I\'m here to help. Enjoy our products! 🍑'
};

const BYE_RESPONSES = {
  de: 'Auf Wiedersehen! 👋 Besuchen Sie uns bald wieder - online oder in Dürnstein! 🍑',
  en: 'Goodbye! 👋 Visit us again soon - online or in Dürnstein! 🍑'
};

const INITIAL_MESSAGE = {
  de: 'Grüß Gott! 🍑 Ich bin der virtuelle Assistent von Hermann Böhmer. Fragen Sie mich alles über unsere Wachauer Spezialitäten, Dürnstein oder Ihre Bestellung!',
  en: 'Hello! 🍑 I\'m the virtual assistant of Hermann Böhmer. Ask me anything about our Wachau specialties, Dürnstein or your order!'
};

const QUICK_QUESTIONS = {
  de: [
    '🍑 Was verkauft ihr?',
    '📍 Wo seid ihr?',
    '📦 Wie lange dauert Versand?',
    '🎁 Habt ihr Geschenksets?'
  ],
  en: [
    '🍑 What do you sell?',
    '📍 Where are you located?',
    '📦 How long is shipping?',
    '🎁 Do you have gift sets?'
  ]
};

const UI_TEXTS = {
  de: {
    headerTitle: 'Hermann Böhmer',
    headerSubtitle: 'Virtuelle Assistenz',
    placeholder: 'Ihre Frage...',
    frequentQuestions: 'Häufige Fragen:'
  },
  en: {
    headerTitle: 'Hermann Böhmer',
    headerSubtitle: 'Virtual Assistant',
    placeholder: 'Your question...',
    frequentQuestions: 'Frequent questions:'
  }
};

// ==================== CHAT LOGIK ====================
function findBestResponse(message, language) {
  const lowerMessage = message.toLowerCase();
  const kb = KNOWLEDGE_BASE[language] || KNOWLEDGE_BASE.de;
  const greetings = GREETINGS[language] || GREETINGS.de;
  const fallbacks = FALLBACK_RESPONSES[language] || FALLBACK_RESPONSES.de;
  
  // Begrüßung erkennen
  const greetingWords = language === 'en' 
    ? ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good day']
    : ['hallo', 'hi', 'hey', 'servus', 'grüß', 'guten tag', 'moin', 'hello', 'guten morgen', 'guten abend'];
  
  if (greetingWords.some(word => lowerMessage.includes(word))) {
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Danke erkennen
  const thankWords = language === 'en' ? ['thank', 'thanks'] : ['danke', 'thank'];
  if (thankWords.some(word => lowerMessage.includes(word))) {
    return THANKS_RESPONSES[language] || THANKS_RESPONSES.de;
  }
  
  // Tschüss erkennen
  const byeWords = language === 'en' 
    ? ['bye', 'goodbye', 'see you', 'farewell']
    : ['tschüss', 'bye', 'auf wiedersehen', 'ciao'];
  if (byeWords.some(word => lowerMessage.includes(word))) {
    return BYE_RESPONSES[language] || BYE_RESPONSES.de;
  }
  
  // Direkte Fragen erkennen (language-specific)
  if (language === 'en') {
    if (lowerMessage.includes('where are') || lowerMessage.includes('where is') || lowerMessage.includes('location') || lowerMessage.includes('address')) {
      return kb.location.response;
    }
    if (lowerMessage.includes('what do you sell') || lowerMessage.includes('what products') || lowerMessage.includes('products')) {
      return kb.apricots.response;
    }
    if ((lowerMessage.includes('how long') || lowerMessage.includes('shipping') || lowerMessage.includes('delivery'))) {
      return kb.shipping.response;
    }
    if (lowerMessage.includes('gift')) {
      return kb.gifts.response;
    }
  } else {
    if (lowerMessage.includes('wo seid') || lowerMessage.includes('wo bist') || lowerMessage.includes('wo ist') || lowerMessage.includes('wo findet') || lowerMessage.includes('wo finde')) {
      return kb.location.response;
    }
    if (lowerMessage.includes('was verkauf') || lowerMessage.includes('was gibt') || lowerMessage.includes('was habt') || lowerMessage.includes('was bietet') || lowerMessage.includes('produkte')) {
      return kb.apricots.response;
    }
    if (lowerMessage.includes('wie lange') && (lowerMessage.includes('versand') || lowerMessage.includes('liefer') || lowerMessage.includes('dauer'))) {
      return kb.shipping.response;
    }
    if (lowerMessage.includes('geschenk') || lowerMessage.includes('schenken') || lowerMessage.includes('mitbringsel')) {
      return kb.gifts.response;
    }
  }
  
  // Beste Übereinstimmung finden
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [key, data] of Object.entries(kb)) {
    let score = 0;
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        // Längere Keywords bekommen mehr Punkte, Mindestpunkte = 2
        score += Math.max(2, keyword.length);
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = data.response;
    }
  }
  
  if (bestMatch && bestScore >= 2) {
    return bestMatch;
  }
  
  // Fallback
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// ==================== KOMPONENTE ====================
export default function ChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize messages when language changes or on mount
  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        text: INITIAL_MESSAGE[language] || INITIAL_MESSAGE.de,
        time: new Date()
      }
    ]);
  }, [language]);

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus auf Input wenn Chat öffnet
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simuliere "Tippen" für natürlicheres Gefühl
    setTimeout(() => {
      const response = findBestResponse(userMessage.text, language);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response,
        time: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 500 + Math.random() * 1000); // 0.5-1.5 Sekunden Verzögerung
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick Questions basierend auf Sprache
  const quickQuestions = QUICK_QUESTIONS[language] || QUICK_QUESTIONS.de;
  const uiTexts = UI_TEXTS[language] || UI_TEXTS.de;

  const handleQuickQuestion = (question) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#8B2E2E] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#722525] transition-colors ${isOpen ? 'hidden' : ''}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        data-testid="chat-widget-button"
      >
        <MessageCircle size={24} />
        
        {/* Pulsing dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#E5E0D8]"
            style={{ maxHeight: 'calc(100vh - 100px)', maxWidth: 'calc(100vw - 48px)' }}
            data-testid="chat-widget-window"
          >
            {/* Header */}
            <div className="bg-[#8B2E2E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">{uiTexts.headerTitle}</h3>
                  <p className="text-xs text-white/80">{uiTexts.headerSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9F8F6]">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-[#8B2E2E] text-white rounded-br-md'
                        : 'bg-white border border-[#E5E0D8] text-[#2D2A26] rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className={`text-[10px] mt-1 ${message.type === 'user' ? 'text-white/60' : 'text-[#969088]'}`}>
                      {message.time.toLocaleTimeString(language === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E5E0D8] p-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#969088] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-[#969088] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-[#969088] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions (nur wenn wenige Nachrichten) */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-white border-t border-[#E5E0D8]">
                <p className="text-xs text-[#969088] mb-2">{uiTexts.frequentQuestions}</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q)}
                      className="text-xs px-3 py-1.5 bg-[#F2EFE9] text-[#5C5852] rounded-full hover:bg-[#E5E0D8] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-[#E5E0D8]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={uiTexts.placeholder}
                  className="flex-1 px-4 py-2 border border-[#E5E0D8] rounded-full text-sm focus:outline-none focus:border-[#8B2E2E] transition-colors"
                  data-testid="chat-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 bg-[#8B2E2E] text-white rounded-full flex items-center justify-center hover:bg-[#722525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="chat-send-button"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
