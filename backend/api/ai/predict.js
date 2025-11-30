import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { safeJsonParse } from './safeJson.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function getAiPrediction(req, res) {
    try {
        // 1. RANGO DE FECHAS (Últimos 30 días)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // 2. OBTENER SOLO PEDIDOS "ENTREGADOS"
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'entregado' 
        });

        // 3. CALCULAR MÉTRICAS
        const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
        
        // 4. CONTAR PRODUCTOS Y RASTREAR EL TOP
        const productCounts = {};

        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const name = item.name.trim(); 
                    const qty = parseInt(item.quantity, 10) || 0;
                    
                    // Filtro de seguridad para anomalías extremas (opcional)
                    // if (qty > 50) return; 

                    productCounts[name] = (productCounts[name] || 0) + qty;
                });
            }
        });

        // Ordenar para sacar el Top 1
        const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
        const topProductEntry = sortedProducts.length > 0 ? sortedProducts[0] : ["Ninguno", 0];
        
        const topProductName = topProductEntry[0];
        const topProductQty = topProductEntry[1];

        // 5. PREPARAR EL PROMPT
        const prompt = `
            Actúa como un experto analista. Datos reales (últimos 30 días, ventas entregadas):
            - Ventas Totales: $${totalSales.toFixed(2)}
            - Cantidad de Pedidos: ${orders.length}
            - Producto Estrella: "${topProductName}" con ${topProductQty} unidades vendidas.
            
            Genera un JSON exacto:
            {
                "ventasProyectadas": (número, estimación mes siguiente),
                "variacionPorcentual": (número, ej: 15),
                "productoAltaDemanda": "${topProductName}", 
                "recomendacion": (frase estratégica muy breve, max 12 palabras)
            }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let predictionData;
        try {
            predictionData = JSON.parse(jsonString);
        } catch (e) {
            predictionData = {
                ventasProyectadas: totalSales * 1.1,
                variacionPorcentual: 10,
                productoAltaDemanda: topProductName,
                recomendacion: "Mantener inventario óptimo."
            };
        }

        // 6. ENVIAR AL FRONTEND
        res.json({ 
            prediction: predictionData,
            realStats: {
                unitsSold: topProductQty, 
                totalSales: totalSales
            }
        });

    } catch (error) {
        console.error("Error en AI Prediction:", error.message);
        res.status(500).json({ message: "Error interno IA" });
    }
}