"""
Hermann Böhmer - PDF Invoice Generator
Erstellt professionelle Rechnungen im PDF-Format
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime


def generate_invoice_pdf(order: dict) -> bytes:
    """Generiert eine PDF-Rechnung für eine Bestellung"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='CompanyName',
        fontSize=24,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#8B2E2E'),
        alignment=TA_LEFT
    ))
    
    styles.add(ParagraphStyle(
        name='InvoiceTitle',
        fontSize=18,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#2D2A26'),
        alignment=TA_RIGHT
    ))
    
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontSize=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#2D2A26'),
        spaceAfter=3*mm
    ))
    
    styles.add(ParagraphStyle(
        name='NormalText',
        fontSize=10,
        fontName='Helvetica',
        textColor=colors.HexColor('#5C5852'),
        leading=14
    ))
    
    styles.add(ParagraphStyle(
        name='SmallText',
        fontSize=8,
        fontName='Helvetica',
        textColor=colors.HexColor('#969088'),
        alignment=TA_CENTER
    ))
    
    elements = []
    
    invoice_number = order.get('invoice_number', order.get('tracking_number', ''))

    # Header with Company Info and Invoice Title
    header_data = [
        [
            Paragraph('Hermann Böhmer', styles['CompanyName']),
            Paragraph('RECHNUNG', styles['InvoiceTitle'])
        ],
        [
            Paragraph('Wachauer Gold<br/>Weingut Dürnstein', styles['NormalText']),
            Paragraph(f'Rechnungsnr.: {invoice_number}<br/>Datum: {datetime.now().strftime("%d.%m.%Y")}', styles['NormalText'])
        ]
    ]
    
    header_table = Table(header_data, colWidths=[100*mm, 70*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15*mm))
    
    # Customer Address
    elements.append(Paragraph('Rechnungsadresse:', styles['SectionHeader']))
    customer_info = f"""
    {order.get('customer_name', '')}<br/>
    {order.get('shipping_address', '')}<br/>
    {order.get('shipping_postal', '')} {order.get('shipping_city', '')}<br/>
    {order.get('shipping_country', 'Österreich')}
    """
    elements.append(Paragraph(customer_info, styles['NormalText']))
    elements.append(Spacer(1, 10*mm))
    
    # Order Info
    order_date = order.get('created_at', '')
    if order_date and isinstance(order_date, str):
        try:
            order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00')).strftime('%d.%m.%Y')
        except:
            order_date = datetime.now().strftime('%d.%m.%Y')
    else:
        order_date = datetime.now().strftime('%d.%m.%Y')
    
    elements.append(Paragraph(f'Bestelldatum: {order_date}', styles['NormalText']))
    elements.append(Paragraph(f'Bestellnummer: {order.get("tracking_number", order.get("id", "")[:8])}', styles['NormalText']))
    elements.append(Spacer(1, 10*mm))
    
    # Items Table Header
    items_header = ['Artikel', 'Menge', 'Einzelpreis', 'Gesamt']
    items_data = [items_header]
    
    # Items
    item_details = order.get('item_details', [])
    for item in item_details:
        name = item.get('product_name_de', item.get('name_de', item.get('name', 'Produkt')))
        qty = item.get('quantity', 1)
        price = item.get('product_price', item.get('price', 0))
        total = item.get('subtotal', qty * price)
        items_data.append([
            name,
            str(qty),
            f'€{price:.2f}',
            f'€{total:.2f}'
        ])
    
    # Subtotal
    subtotal = order.get('subtotal', 0)
    shipping = order.get('shipping_cost', 0)
    discount = order.get('discount_amount', 0)
    total = order.get('total_amount', 0)
    
    items_data.append(['', '', 'Zwischensumme:', f'€{subtotal:.2f}'])
    
    if discount > 0:
        coupon_code = order.get('coupon_code', 'Rabatt')
        items_data.append(['', '', f'Rabatt ({coupon_code}):', f'-€{discount:.2f}'])
    
    items_data.append(['', '', 'Versandkosten:', f'€{shipping:.2f}' if shipping > 0 else 'Kostenlos'])
    items_data.append(['', '', 'Gesamtbetrag:', f'€{total:.2f}'])
    
    items_table = Table(items_data, colWidths=[85*mm, 20*mm, 35*mm, 30*mm])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F9F8F6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2D2A26')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        
        # Body
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#5C5852')),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        
        # Alignment
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        
        # Grid
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#E5E0D8')),
        ('LINEBELOW', (0, 1), (-1, -5), 0.5, colors.HexColor('#E5E0D8')),
        
        # Total row styling
        ('FONTNAME', (2, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2, -1), (-1, -1), colors.HexColor('#8B2E2E')),
        ('FONTSIZE', (-1, -1), (-1, -1), 11),
        ('LINEABOVE', (2, -1), (-1, -1), 1, colors.HexColor('#8B2E2E')),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 15*mm))
    
    # Payment Status
    payment_status = order.get('payment_status', 'unpaid')
    if payment_status == 'paid':
        elements.append(Paragraph('✓ Bezahlt via Stripe', styles['NormalText']))
    
    elements.append(Spacer(1, 20*mm))
    
    # Footer
    footer_text = """
    Hermann Böhmer Wachauer Gold | Weingut Dürnstein, Wachau, Österreich<br/>
    E-Mail: info@hermann-boehmer.com | Tel: +43 650 2711237<br/>
    UID-Nr: ATU12345678 | Firmenbuchnummer: FN 123456a
    """
    elements.append(Paragraph(footer_text, styles['SmallText']))
    
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph(
        'Vielen Dank für Ihren Einkauf bei Hermann Böhmer!',
        ParagraphStyle(
            name='ThankYou',
            fontSize=10,
            fontName='Helvetica-Oblique',
            textColor=colors.HexColor('#8B2E2E'),
            alignment=TA_CENTER
        )
    ))
    
    # Build PDF
    doc.build(elements)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes


def generate_invoice_filename(order: dict) -> str:
    """Generiert einen Dateinamen für die Rechnung"""
    invoice_num = order.get('invoice_number', order.get('tracking_number', order.get('id', 'order')[:8]))
    return f"Rechnung_{invoice_num}.pdf"
