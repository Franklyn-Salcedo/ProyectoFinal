
// backend/utils/invoiceGenerator.js

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// DATOS DEL NEGOCIO

const COMPANY = {
  name: 'Key Optión Store',
  legal: 'Key Optión Store',
  rnc: '',
  address: 'Es online',
  phone: '1 849 340 6047',
  email: 'KeyOptionStore@gmail.com',
  instagram: 'KeyOptionStore',
  colors: {
    primary: '#0D0D0D',
    accent: '#E8C547',
    softGray: '#F4F4F4',
    textGray: '#555555'
  }
};

function findLogoPath() {
  const candidates = [
    path.join(__dirname, './imagenes/logo.png'),
    path.join(process.cwd(), './imagenes/logo.png')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {}
  }
  return null;
}


// FUNCIÓN PRINCIPAL

export default async function buildInvoice(orderData, stream) {
  const doc = new PDFDocument({ size: 'A4', margin: 30 });
  doc.pipe(stream);

  const order = { ...orderData };
  order.items = Array.isArray(order.items) ? order.items : [];

  if (!order.createdAt) order.createdAt = new Date();
  if (!order.total) {
    order.total = order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  }

  const logoPath = findLogoPath();
  const { primary, accent, softGray, textGray } = COMPANY.colors;


  // CABECERA MODERNA


  // Header background
  doc.rect(0, 0, doc.page.width, 110)
    .fill(softGray);

  if (logoPath) {
    doc.image(logoPath, 40, 20, { width: 90 });
  }

  doc.fillColor(primary)
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('FACTURA', 0, 30, { align: 'right' });

  doc.fontSize(11)
    .fillColor(textGray)
    .font('Helvetica')
    .text(`TRACK: ${order.id}`, { align: 'right' });

  
  // CLIENTE Y NEGOCIO

  doc.fillColor(primary)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('Datos del Cliente', 40, 140);

  doc.fontSize(10).fillColor(textGray)
    .font('Helvetica')
    .text(order.customerName || 'Cliente', 40, 160)
    .text(`Dirección: ${order.customerAddress || 'No proporcionada'}`, 40)
    .text(order.customerEmail ? `Email: ${order.customerEmail}` : '', 40);

  const dateStr = new Date(order.createdAt).toLocaleDateString('es-ES');

  doc.fillColor(primary).font('Helvetica-Bold').fontSize(14)
    .text('Detalles', 320, 140);

  doc.fontSize(10).font('Helvetica').fillColor(textGray)
    .text(`Fecha: ${dateStr}`, 320, 160);


  // TABLA MODERNA DE PRODUCTOS

  const tableTop = 230;

  const columns = [
    { label: 'Artículo', x: 40 },
    { label: 'Talla', x: 250 },
    { label: 'Cant.', x: 320 },
    { label: 'Precio', x: 390 },
    { label: 'Total', x: 470 }
  ];

  doc.fillColor(primary).font('Helvetica-Bold').fontSize(11);
  columns.forEach(col => doc.text(col.label, col.x, tableTop));

  doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15)
    .strokeColor(accent).lineWidth(1).stroke();

  let y = tableTop + 28;
  doc.font('Helvetica').fontSize(10).fillColor(textGray);

  order.items.forEach(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    const total = price * qty;

    doc.text(item.name || 'Producto', 40, y, { width: 195 });
    doc.text(item.size || '-', 250, y);
    doc.text(String(qty), 320, y);
    doc.text(`$${price.toFixed(2)}`, 390, y);
    doc.text(`$${total.toFixed(2)}`, 470, y);
    y += 16;
  });


  // TOTAL DESTACADO
 
  doc.moveTo(330, y + 10).lineTo(555, y + 10)
    .strokeColor(accent).stroke();

  doc.font('Helvetica-Bold').fontSize(13).fillColor(primary)
    .text('TOTAL:', 330, y + 20);

  doc.fontSize(15).fillColor(accent)
    .text(`$${order.total.toFixed(2)}`, 420, y + 20);


  // ESTADO DEL PEDIDO
  const status = (order.status || 'pendiente').toUpperCase();
  const statusY = y + 40;

  const statusColor = status === 'ENTREGADO' ? '#DFF6DD' : '#FFF4CC';
  const statusText = status === 'ENTREGADO' ? '#246B36' : '#B78A00';

  doc.roundedRect(330, statusY, 150, 26, 6)
    .fill(statusColor);

  doc.fillColor(statusText)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(status, 360, statusY + 7);

  
  //  PIE DE PÁGINA MODERNO
  doc.rect(0, 760, doc.page.width, 60)
    .fill(softGray);

  doc.fillColor(textGray)
    .fontSize(9)
    .font('Helvetica')
    .text(`${COMPANY.name} — ${COMPANY.address}`, 40, 778)
    .text(`Tel: ${COMPANY.phone} — ${COMPANY.email}`)
    .fillColor(accent)
    .text(`Instagram: @${COMPANY.instagram}`);

  doc.end();
}
