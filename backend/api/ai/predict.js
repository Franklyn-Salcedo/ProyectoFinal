// backend/api/ai/predict.js
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry } from './aiUtils.js';
import { safeJsonParse } from './safeJson.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function getAiPrediction(req, res) {
    try {
        // 1. Obtener ventas del último mes
        const lastMonthOrders = await Order.find({
            status: 'entregado',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        const totalSales = lastMonthOrders.reduce((acc, order) => acc + order.total, 0);
        const allItems = lastMonthOrders.flatMap(order => order.items);

        // Ventas por producto
        const productSales = {};
        for (const item of allItems) {
            productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        }

        const sortedProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
        const bestProductId = sortedProducts[0]?.[0];
        const bestProductQty = sortedProducts[0]?.[1] || 0;

        let bestSeller = null;
        if (bestProductId) {
            bestSeller = await Product.findOne({ id: bestProductId });
        }

        const summary = {
            totalVentas: totalSales.toFixed(2),
            cantidadOrdenes: lastMonthOrders.length,
            productoMasVendido: bestSeller ? bestSeller.name : "Sin ventas recientes",
            cantidadVendida: bestProductQty
        };

        // 2. Configurar modelo con fallback
        const createModel = (modelName) => genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        });

        let model = createModel("gemini-2.5-flash");

        const prompt = `
        Eres un analista de ventas. Analiza estos datos:
        - Ventas: $${summary.totalVentas}
        - Órdenes: ${summary.cantidadOrdenes}
        - Producto más vendido: ${summary.productoMasVendido} (${summary.cantidadVendida})

        Responde solo con JSON:
        {
            "ventasProyectadas": number,
            "variacionPorcentual": number,
            "productoAltaDemanda": string,
            "recomendacion": string
        }
        `;

        // 3. Llamada con retry automático
        const result = await callGeminiWithRetry(() => model.generateContent(prompt))
            .catch(async (err) => {
                // Intentar fallback solo si 503 o fallo de servicio
                console.warn("⚠️ Pasando a gemini-1.5-flash por error:", err.message);
                model = createModel("gemini-1.5-flash");
                return callGeminiWithRetry(() => model.generateContent(prompt));
            });

        const textResponse = result.response.text();

        // 4. Parse seguro
        const prediction = safeJsonParse(textResponse);

        res.json({ prediction });

    } catch (err) {
        console.error("Error en getAiPrediction:", err);
        res.status(500).json({ error: "Error en el análisis predictivo", details: err.message });
    }
}
