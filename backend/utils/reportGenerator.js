import PDFDocument from 'pdfkit-table';

export const generateInventoryReport = (products, res) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Headers de respuesta para descargar
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Inventario.pdf');
    doc.pipe(res);

    // Título
    doc.fontSize(18).text('Reporte de Inventario - Key Option', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Configuración de la Tabla
    const table = {
        title: "Estado Actual del Stock",
        headers: [
            { label: "Producto", property: 'name', width: 180 },
            { label: "Categoría", property: 'category', width: 100 },
            { label: "Precio", property: 'price', width: 60, renderer: (value) => `$${value}` },
            { label: "Stock", property: 'stock', width: 50 },
            { label: "Valor Total", property: 'totalValue', width: 80, renderer: (value) => `$${value}` }
        ],
        datas: products.map(p => ({
            name: p.name,
            category: p.categoryName || 'General',
            price: p.price.toFixed(2),
            stock: p.stock,
            totalValue: (p.price * p.stock).toFixed(2)
        }))
    };

    // Dibujar tabla
    doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, i) => doc.font("Helvetica").fontSize(10)
    });

    // Resumen Final
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const totalAssetValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

    doc.moveDown(2);
    doc.font("Helvetica-Bold").text('RESUMEN DE ACTIVOS:', { underline: true });
    doc.font("Helvetica").text(`Total de Unidades: ${totalStock}`);
    doc.text(`Valor Total del Inventario: $${totalAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

    doc.end();
};

export const generateSalesReport = (orders, res) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Ventas.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Reporte de Ventas (Entregadas)', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generado el: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    const table = {
        title: "Desglose de Pedidos",
        headers: [
            { label: "ID Pedido", property: 'id', width: 60 },
            { label: "Fecha", property: 'date', width: 80 },
            { label: "Cliente", property: 'client', width: 120 },
            { label: "Items", property: 'items', width: 50 },
            { label: "Total", property: 'total', width: 80, renderer: (value) => `$${value}` }
        ],
        datas: orders.map(o => ({
            id: `#${o.id}`,
            date: new Date(o.createdAt).toLocaleDateString(),
            client: o.customerName,
            items: o.items.length,
            total: o.total.toFixed(2)
        }))
    };

    doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, i) => doc.font("Helvetica").fontSize(10)
    });

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

    doc.moveDown(2);
    doc.font("Helvetica-Bold").text('RESUMEN FINANCIERO:', { underline: true });
    doc.text(`Pedidos Procesados: ${orders.length}`);
    doc.fontSize(14).text(`Ingresos Totales: $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, { align: 'right' });

    doc.end();
};