import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateOrdersPdf(restaurantId: string, from: Date, to: Date): Promise<Buffer> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: from, lte: to } },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true },
    });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Rapport de commandes', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(restaurant?.name ?? restaurantId, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#71717a')
        .text(`Période : ${from.toLocaleDateString('fr-FR')} → ${to.toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown(1);

      // Summary
      const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
      const delivered = orders.filter((o) => o.status === 'delivered').length;

      doc.fontSize(11).fillColor('#000000').font('Helvetica-Bold').text('Résumé');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e4e4e7');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10).fillColor('#18181b');
      doc.text(`Total commandes : ${orders.length}`);
      doc.text(`Commandes livrées : ${delivered}`);
      doc.text(`Chiffre d'affaires total : ${totalRevenue.toFixed(2)} €`);
      doc.text(`Panier moyen : ${orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'} €`);
      doc.moveDown(1.5);

      // Table header
      doc.font('Helvetica-Bold').fontSize(11).text('Détail des commandes');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e4e4e7');
      doc.moveDown(0.5);

      const col = { num: 40, date: 100, customer: 220, status: 360, total: 480 };

      const headerY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#71717a');
      doc.text('#', col.num, headerY, { width: 55 });
      doc.text('Date', col.date, headerY, { width: 115 });
      doc.text('Client', col.customer, headerY, { width: 135 });
      doc.text('Statut', col.status, headerY, { width: 115 });
      doc.text('Total', col.total, headerY, { width: 70, align: 'right' });
      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e4e4e7');
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(9).fillColor('#18181b');

      for (const order of orders.slice(0, 200)) {
        if (doc.y > 750) doc.addPage();
        const y = doc.y;
        const customerName = order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`
          : '—';
        doc.text(order.orderNumber.slice(-8), col.num, y, { width: 55 });
        doc.text(order.createdAt.toLocaleDateString('fr-FR'), col.date, y, { width: 115 });
        doc.text(customerName, col.customer, y, { width: 135 });
        doc.text(order.status, col.status, y, { width: 115 });
        doc.text(`${order.total.toFixed(2)} €`, col.total, y, { width: 70, align: 'right' });
        doc.moveDown(0.6);
      }

      if (orders.length > 200) {
        doc.moveDown(0.5).fontSize(8).fillColor('#a1a1aa')
          .text(`… et ${orders.length - 200} autres commandes. Utilisez l'export Excel pour le fichier complet.`);
      }

      // Footer on each page
      const pageRange = doc.bufferedPageRange();
      for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#a1a1aa')
          .text(
            `FoodStack · Généré le ${new Date().toLocaleDateString('fr-FR')} · Page ${i + 1}/${pageRange.count}`,
            40, doc.page.height - 40, { align: 'center' },
          );
      }

      doc.end();
    });
  }

  async generateOrdersExcel(restaurantId: string, from: Date, to: Date): Promise<Buffer> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId, createdAt: { gte: from, lte: to } },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FoodStack';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Commandes');
    sheet.columns = [
      { header: 'N° Commande', key: 'num', width: 20 },
      { header: 'Date', key: 'date', width: 16 },
      { header: 'Client', key: 'customer', width: 24 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Statut', key: 'status', width: 14 },
      { header: 'Sous-total', key: 'subtotal', width: 14 },
      { header: 'Livraison', key: 'delivery', width: 12 },
      { header: 'TVA', key: 'tax', width: 10 },
      { header: 'Remise', key: 'discount', width: 10 },
      { header: 'Total', key: 'total', width: 12 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
    });

    for (const order of orders) {
      const row = sheet.addRow({
        num: order.orderNumber,
        date: order.createdAt.toLocaleDateString('fr-FR'),
        customer: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '—',
        email: order.customer?.email ?? '—',
        type: order.type,
        status: order.status,
        subtotal: order.subtotal,
        delivery: order.deliveryFee,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
      });
      row.eachCell((cell, colNum) => {
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: sheet.rowCount % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF' },
        };
      });
    }

    // Summary sheet
    const summary = workbook.addWorksheet('Résumé');
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    summary.addRows([
      ['Indicateur', 'Valeur'],
      ['Période', `${from.toLocaleDateString('fr-FR')} → ${to.toLocaleDateString('fr-FR')}`],
      ['Total commandes', orders.length],
      ['Commandes livrées', orders.filter((o) => o.status === 'delivered').length],
      ["Chiffre d'affaires", `${totalRevenue.toFixed(2)} €`],
      ['Panier moyen', `${(orders.length > 0 ? totalRevenue / orders.length : 0).toFixed(2)} €`],
    ]);
    summary.getRow(1).font = { bold: true };

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async generateInventoryExcel(restaurantId: string): Promise<Buffer> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { restaurantId },
      include: { supplier: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FoodStack';

    const sheet = workbook.addWorksheet('Inventaire');
    sheet.columns = [
      { header: 'Article', key: 'name', width: 28 },
      { header: 'Catégorie', key: 'category', width: 18 },
      { header: 'Unité', key: 'unit', width: 10 },
      { header: 'Stock actuel', key: 'qty', width: 14 },
      { header: 'Stock min', key: 'minQty', width: 12 },
      { header: 'Coût unitaire', key: 'price', width: 14 },
      { header: 'Valeur stock', key: 'value', width: 14 },
      { header: 'Fournisseur', key: 'supplier', width: 22 },
      { header: 'Statut', key: 'status', width: 14 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF18181B' } };
    });

    for (const item of items) {
      const status =
        item.currentStock <= 0 ? 'Rupture'
        : item.currentStock <= item.minStock ? 'Bas'
        : 'OK';

      const row = sheet.addRow({
        name: item.name,
        category: item.category,
        unit: item.unit,
        qty: item.currentStock,
        minQty: item.minStock,
        price: item.costPerUnit,
        value: (item.currentStock * item.costPerUnit).toFixed(2),
        supplier: item.supplier?.name ?? '—',
        status,
      });

      const statusCell = row.getCell('status');
      if (status === 'Rupture') statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      else if (status === 'Bas') statusCell.font = { color: { argb: 'FFCA8A04' }, bold: true };
    }

    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
