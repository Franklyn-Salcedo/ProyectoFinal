// ✅ SERVER.JS COMPLETAMENTE OPTIMIZADO CON TODOS LOS TRY/CATCH RESTAURADOS

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
<<<<<<< HEAD
import dotenv from 'dotenv';

// Conexión BD
import connectDB from './config/db.js';

// CRUD
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getOrders,
  saveOrder,
  deleteOrder,
  getCategories,
  getSizes,
} from './api/crud.js';

// IA
import { getAiPrediction } from './api/ai/predict.js';
import { getCategoryDemandPrediction } from './api/ai/categoryDemand.js';

dotenv.config();
connectDB();

const app = express();
=======
import connectDB from './config/db.js'; 
import { 
    getProducts, saveProduct, deleteProduct, 
    getOrders, saveOrder, deleteOrder,
    getCategories, getSizes
} from './api/crud.js'; 
import dotenv from 'dotenv';

// --- IMPORTAR AMBAS RUTAS DE IA ---
import { getAiPrediction } from './api/ai/predict.js';
import { getCategoryDemandPrediction } from './api/ai/categoryDemand.js'; // <-- ¡ESTA ES LA NUEVA LÍNEA!

// --- Conexión a la Base de Datos ---
connectDB(); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
dotenv.config();
>>>>>>> bf0fd7e25e6271c8cc9ff550b38b26467d56dd86
const PORT = process.env.PORT || 4000;

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../frontend');
const rootPath = path.join(__dirname, '..');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));
app.use(express.static(rootPath));

// -------------------------------------------------------------------
<<<<<<< HEAD
// ✅ RUTAS CRUD con try/catch restaurados
=======
// RUTAS DE LA API
>>>>>>> bf0fd7e25e6271c8cc9ff550b38b26467d56dd86
// -------------------------------------------------------------------

// ✅ PRODUCTOS
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
<<<<<<< HEAD
  try {
    const product = await saveProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error al guardar producto', error: error.message });
  }
=======
    try {
        const product = await saveProduct(req.body);
        res.status(201).json(product); 
    } catch (error) {
        res.status(400).json({ message: 'Error al guardar producto', error: error.message });
    }
>>>>>>> bf0fd7e25e6271c8cc9ff550b38b26467d56dd86
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const success = await deleteProduct(productId);

    if (!success) {
      return res.status(404).json({ message: `Producto ID ${productId} no encontrado.` });
    }

    res.status(200).json({ message: `Producto ID ${productId} eliminado.` });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});



// ✅ Obtener producto + unidades vendidas totales
// ✅ Buscar producto + unidades vendidas del mes (versión final)
app.get('/api/products/name/:name', async (req, res) => {
  try {
    const Product = (await import('./models/Product.js')).default;
    const Order = (await import('./models/Order.js')).default;

    const searchName = decodeURIComponent(req.params.name).trim();

    // Buscar producto sin importar mayúsculas o tildes
    const product = await Product.findOne({
      name: { $regex: new RegExp(searchName, 'i') },
    });

    if (!product) {
      console.warn(`⚠️ Producto no encontrado para búsqueda: ${searchName}`);
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Determinar fecha de inicio del mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Buscar todos los pedidos entregados del mes
    const orders = await Order.find({
      status: 'entregado',
      createdAt: { $gte: startOfMonth }
    });

    let unitsSold = 0;

    for (const order of orders) {
      for (const item of order.items) {
        const orderProductId = Number(item.productId);
        const dbProductId = Number(product.id);

        console.log(`🧩 Comparando orderProductId=${orderProductId} con dbProductId=${dbProductId}`);

        if (orderProductId === dbProductId) {
          unitsSold += Number(item.quantity) || 0;
        }
      }
    }

    console.log(`✅ Total vendidas del mes para ${product.name}: ${unitsSold}`);

    return res.json({
      ...product.toObject(),
      unitsSold,
    });

  } catch (error) {
    console.error("❌ Error en ruta /api/products/name/:name:", error);
    return res.status(500).json({
      message: 'Error al obtener producto por nombre',
      error: error.message,
    });
  }
});





// ✅ PEDIDOS
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener pedidos', error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const order = await saveOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message }); // mantiene “Stock insuficiente”
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const success = await deleteOrder(orderId);

    if (!success) {
      return res.status(404).json({ message: `Pedido ID ${orderId} no encontrado.` });
    }

    res.status(200).json({ message: `Pedido ID ${orderId} eliminado.` });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar pedido', error: error.message });
  }
});

// ✅ CATEGORÍAS
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
  }
});

// ✅ TALLAS
app.get('/api/sizes', async (req, res) => {
  try {
    const sizes = await getSizes();
    res.json(sizes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tallas', error: error.message });
  }
});

// -------------------------------------------------------------------
<<<<<<< HEAD
// ✅ IA con try/catch garantizado
// -------------------------------------------------------------------

app.get('/api/ai/predict', async (req, res) => {
  try {
    await getAiPrediction(req, res);
  } catch (error) {
    console.error('Error en IA /predict:', error.message);
    res.status(503).json({ message: 'IA no disponible, intenta luego', error: error.message });
  }
});

app.get('/api/ai/category-demand', async (req, res) => {
  try {
    await getCategoryDemandPrediction(req, res);
  } catch (error) {
    console.error('Error en IA /category-demand:', error.message);
    res.status(503).json({ message: 'IA no disponible, intenta luego', error: error.message });
  }
});

// -------------------------------------------------------------------
// ✅ FRONTEND
// -------------------------------------------------------------------
=======
// RUTAS DE IA (CONECTADAS A MONGODB)
// -------------------------------------------------------------------

// IA Para el Dashboard (Ventas Totales)
app.get('/api/ai/predict', getAiPrediction);

// IA Para Reportes (Demanda por Categoría)
app.get('/api/ai/category-demand', getCategoryDemandPrediction); // <-- ¡RUTA AÑADIDA!


// -------------------------------------------------------------------
// RUTAS DE VISTA (Front-end serving)
// -------------------------------------------------------------------

>>>>>>> bf0fd7e25e6271c8cc9ff550b38b26467d56dd86
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

<<<<<<< HEAD
// -------------------------------------------------------------------
// ✅ INICIAR SERVIDOR
// -------------------------------------------------------------------
=======

// Iniciar el servidor
>>>>>>> bf0fd7e25e6271c8cc9ff550b38b26467d56dd86
app.listen(PORT, () => {
  console.log(`🚀 Servidor en funcionamiento en http://localhost:${PORT}`);
  console.log(`Panel de Administración: http://localhost:${PORT}/admin`);
});
