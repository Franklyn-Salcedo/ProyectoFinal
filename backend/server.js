// ==========================================================
// 1. IMPORTACIONES Y CONFIGURACIÓN
// ==========================================================
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Base de Datos
import connectDB from './config/db.js';
import Order from './models/Order.js'; 
import Product from './models/Product.js';
import Category from './models/Category.js';

// Funciones CRUD (Controladores)
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getOrders,
  saveOrder,
  deleteOrder,
  getCategories,
  getSizes,
  getOrderById,
} from './api/crud.js';

// Utilidades
import buildInvoice from './utils/invoiceGenerator.js'; 
import { generateInventoryReport, generateSalesReport } from './utils/reportGenerator.js';
import { chatWithGPT } from './api/chat/chatbot.js';

// Inteligencia Artificial
import { getAiPrediction } from './api/ai/predict.js';
import { getCategoryDemandPrediction } from './api/ai/categoryDemand.js';

// Configuración de Entorno
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../frontend');
const rootPath = path.join(__dirname, '..');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));
app.use(express.static(rootPath));


// ==========================================================
// 2. API: GESTIÓN DE PRODUCTOS
// ==========================================================

// Obtener todos
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error GET /products:", error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// Guardar/Actualizar
app.post('/api/products', async (req, res) => {
  try {
    const product = await saveProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error POST /products:", error);
    res.status(400).json({ message: 'Error al guardar producto', error: error.message });
  }
});

// Eliminar
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const success = await deleteProduct(productId);
    if (!success) return res.status(404).json({ message: `Producto ID ${productId} no encontrado.` });
    res.status(200).json({ message: `Producto ID ${productId} eliminado.` });
  } catch (error) {
    console.error("Error DELETE /products:", error);
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

// Buscar por nombre + Ventas del mes (Para IA)
app.get('/api/products/name/:name', async (req, res) => {
  try {
    const searchName = decodeURIComponent(req.params.name).trim();
    const product = await Product.findOne({ name: { $regex: new RegExp(searchName, 'i') } });

    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // Calcular ventas del mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const orders = await Order.find({ status: 'entregado', createdAt: { $gte: startOfMonth } });
    let unitsSold = 0;
    const dbProductId = Number(product.id);

    for (const order of orders) {
      for (const item of order.items) {
        if (Number(item.productId) === dbProductId) unitsSold += Number(item.quantity) || 0;
      }
    }

    return res.json({ ...product.toObject(), unitsSold });

  } catch (error) {
    console.error("Error GET /products/name:", error);
    return res.status(500).json({ message: 'Error interno', error: error.message });
  }
});


// ==========================================================
// 3. API: GESTIÓN DE PEDIDOS Y FACTURACIÓN
// ==========================================================

// Obtener pedidos
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error GET /orders:", error);
    res.status(500).json({ message: 'Error al obtener pedidos', error: error.message });
  }
});

// Guardar pedido
app.post('/api/orders', async (req, res) => {
  try {
    const order = await saveOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error("Error POST /orders:", error);
    res.status(400).json({ message: error.message });
  }
});

// Eliminar pedido
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const success = await deleteOrder(orderId);
    if (!success) return res.status(404).json({ message: `Pedido no encontrado.` });
    res.status(200).json({ message: `Pedido eliminado.` });
  } catch (error) {
    console.error("Error DELETE /orders:", error);
    res.status(500).json({ message: 'Error al eliminar pedido', error: error.message });
  }
});

// Generar Factura PDF (Por ID)
app.get('/api/orders/invoice/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ message: 'ID no válido.' });

    let order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });

    order = order.toObject();
    if (!order.createdAt) order.createdAt = new Date();

    // Recuperar precios si faltan
    if (order.items.some(item => !item.price || item.price === 0)) {
      for (const item of order.items) {
        const product = await Product.findOne({ id: item.productId }).exec();
        item.price = Number(product?.price || 0);
      }
      order.total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Factura_TRK-${order.id}.pdf`);
    buildInvoice(order, res);

  } catch (error) {
    console.error('Error generando factura:', error);
    res.status(500).json({ message: 'Error al generar factura.', error: error.message });
  }
});


// ==========================================================
// 4. API: REPORTES PDF (INVENTARIO Y VENTAS)
// ==========================================================

// Reporte de Inventario
app.get('/api/reports/inventory', async (req, res) => {
  try {
      const products = await Product.find().lean();
      const categories = await Category.find().lean();
      const categoryMap = {};
      categories.forEach(c => categoryMap[c.id] = c.name);

      const enrichedProducts = products.map(p => ({
          ...p,
          categoryName: categoryMap[p.categoryId] || 'Sin Categoría'
      }));

      generateInventoryReport(enrichedProducts, res);
  } catch (error) {
      console.error("Error reporte inventario:", error);
      res.status(500).send("Error generando reporte");
  }
});

// Reporte de Ventas (Entregadas)
app.get('/api/reports/sales', async (req, res) => {
  try {
      const orders = await Order.find({ status: 'entregado' }).lean();
      generateSalesReport(orders, res);
  } catch (error) {
      console.error("Error reporte ventas:", error);
      res.status(500).send("Error generando reporte");
  }
});


// ==========================================================
// 5. API: DATOS AUXILIARES
// ==========================================================

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error categorías', error: error.message });
  }
});

app.get('/api/sizes', async (req, res) => {
  try {
    const sizes = await getSizes();
    res.json(sizes);
  } catch (error) {
    res.status(500).json({ message: 'Error tallas', error: error.message });
  }
});


// ==========================================================
// 6. API: INTELIGENCIA ARTIFICIAL & CHATBOT
// ==========================================================

// Chatbot (Cliente)
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === "") return res.status(400).json({ reply: "Escribe un mensaje." });

    const reply = await chatWithGPT(message);
    return res.json(reply); // Enviamos el objeto completo (reply + products)

  } catch (error) {
    console.error("Error en Chatbot:", error);
    res.status(500).json({ reply: "Tuve un problema técnico. Intenta luego." });
  }
});

// Predicción General (Dashboard)
app.get('/api/ai/predict', async (req, res) => {
  try {
    await getAiPrediction(req, res);
  } catch (error) {
    console.error('Error AI Predict:', error.message);
    res.status(503).json({ message: 'IA no disponible', error: error.message });
  }
});

// Demanda por Categoría (Reportes)
app.get('/api/ai/category-demand', async (req, res) => {
  try {
    await getCategoryDemandPrediction(req, res);
  } catch (error) {
    console.error('Error AI Category:', error.message);
    res.status(503).json({ message: 'IA no disponible', error: error.message });
  }
});


// ==========================================================
// 7. SERVIDOR FRONTEND Y ARRANQUE
// ==========================================================

// Rutas HTML
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(frontendPath, 'admin.html')));

// Iniciar
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`📊 Panel Admin: http://localhost:${PORT}/admin`);
});