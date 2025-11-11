// backend/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json()); 

// Servir archivos estáticos
const frontendPath = path.join(__dirname, '../frontend');
const rootPath = path.join(__dirname, '..'); 

app.use(express.static(frontendPath));
app.use(express.static(rootPath));


// -------------------------------------------------------------------
// RUTAS DE LA API
// -------------------------------------------------------------------

// PRODUCTOS
app.get('/api/products', async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos', error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const product = await saveProduct(req.body);
        res.status(201).json(product); 
    } catch (error) {
        res.status(400).json({ message: 'Error al guardar producto', error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const success = await deleteProduct(productId);
        if (success) {
            res.status(200).json({ message: `Producto ID ${productId} eliminado.` });
        } else {
            res.status(404).json({ message: `Producto ID ${productId} no encontrado.` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
    }
});


// PEDIDOS
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
        res.status(400).json({ message: 'Error al guardar pedido', error: error.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        const success = await deleteOrder(orderId);
        if (success) {
            res.status(200).json({ message: `Pedido ID ${orderId} eliminado.` });
        } else {
            res.status(404).json({ message: `Pedido ID ${orderId} no encontrado.` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar pedido', error: error.message });
    }
});

// CATEGORIAS
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await getCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
    }
});

// TALLAS
app.get('/api/sizes', async (req, res) => {
    try {
        const sizes = await getSizes();
        res.json(sizes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tallas', error: error.message });
    }
});

// -------------------------------------------------------------------
// RUTAS DE IA (CONECTADAS A MONGODB)
// -------------------------------------------------------------------

// IA Para el Dashboard (Ventas Totales)
app.get('/api/ai/predict', getAiPrediction);

// IA Para Reportes (Demanda por Categoría)
app.get('/api/ai/category-demand', getCategoryDemandPrediction); // <-- ¡RUTA AÑADIDA!


// -------------------------------------------------------------------
// RUTAS DE VISTA (Front-end serving)
// -------------------------------------------------------------------

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor en funcionamiento en http://localhost:${PORT}`);
    console.log(`Panel de Administración: http://localhost:${PORT}/admin`);
});