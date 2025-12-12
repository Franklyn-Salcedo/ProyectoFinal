// backend/api/ai/predict.js
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// --- CONFIGURACIÓN DE CACHÉ ---
let lastRun = null;
let lastResponse = null;
const CACHE_MINUTES = 30;
// ------------------------------

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function getAiPrediction(req, res) {
    const now = Date.now();
    if (lastRun && (now - lastRun) < CACHE_MINUTES * 60 * 1000) {
        console.log("⚡ Usando predicción en caché.");
        return res.json(lastResponse);
    }

    let totalSales = 0;
    let topProductName = "N/A";
    let topProductQty = 0;

    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'entregado' 
        });

        totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        
        const productCounts = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const name = item.name.trim(); 
                    const qty = parseInt(item.quantity, 10) || 0;
                    productCounts[name] = (productCounts[name] || 0) + qty;
                });
            }
        });

        const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
        if (sortedProducts.length > 0) {
            topProductName = sortedProducts[0][0];
            topProductQty = sortedProducts[0][1];
        }

        // --- INTENTO DE LLAMADA A IA ---
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Datos reales (últimos 30 días): Ventas: $${totalSales}, Top: "${topProductName}" (${topProductQty}).
            JSON exacto: { "ventasProyectadas": (num), "variacionPorcentual": (num), "productoAltaDemanda": "${topProductName}", "recomendacion": (frase corta) }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const predictionData = JSON.parse(jsonString);

        lastRun = Date.now();
        lastResponse = { 
            prediction: predictionData,
            realStats: { unitsSold: topProductQty, totalSales: totalSales }
        };

        console.log("🤖 Predicción IA generada.");
        res.json(lastResponse);

    } catch (error) {
        console.warn("⚠️ Fallo en IA (Quota/Error). Usando cálculo manual.", error.message);
        
        // --- PLAN B: CÁLCULO MANUAL ---
        const fallbackData = {
            prediction: {
                ventasProyectadas: (totalSales * 1.1).toFixed(2), // Proyectar +10%
                variacionPorcentual: 10,
                productoAltaDemanda: topProductName,
                recomendacion: "Crecimiento estable proyectado basado en histórico."
            },
            realStats: {
                unitsSold: topProductQty, 
                totalSales: totalSales
            }
        };

        // Guardar fallback en caché
        lastRun = Date.now();
        lastResponse = fallbackData;

        res.json(fallbackData);
    }
}