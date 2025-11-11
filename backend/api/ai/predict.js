// backend/api/ai/predict.js
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function getAiPrediction(req, res) {

    try {
        // Ventas del último mes
        const lastMonthOrders = await Order.find({
            status: 'entregado', // Solo contar ventas completadas
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Calcular métricas básicas
        const totalSales = lastMonthOrders.reduce((acc, order) => acc + order.total, 0);
        const allItems = lastMonthOrders.flatMap(order => order.items);

        // Contar ventas totales por producto
        const productSales = {};
        for (const item of allItems) {
            productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        }

        // Obtener el ID y cantidad del producto más vendido
        const sortedProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]);
        const bestProductId = sortedProducts[0]?.[0];
        const bestProductQty = sortedProducts[0]?.[1] || 0;

        // Buscar su información
        let bestSeller = null;
        if (bestProductId) {
            bestSeller = await Product.findOne({ id: bestProductId });
        }

        // Crear resumen de métricas
        const summary = {
            totalVentas: totalSales.toFixed(2),
            cantidadOrdenes: lastMonthOrders.length,
            productoMasVendido: bestSeller ? bestSeller.name : "Sin ventas recientes",
            cantidadVendida: bestProductQty
        };

        // Configurar el modelo para salida JSON
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            generationConfig: { 
                responseMimeType: "application/json"
            }
        });

        // Armar prompt para IA
        const prompt = `
        Eres un analista de ventas senior para una tienda de ropa urbana.
        Analiza estos datos de ventas del último mes:
        - Total de ventas: $${summary.totalVentas}
        - Órdenes registradas: ${summary.cantidadOrdenes}
        - Producto más vendido: "${summary.productoMasVendido}" (${summary.cantidadVendida} unidades)

        Genera una proyección de ventas realista y una recomendación breve (máximo 2 frases).
        
        Responde únicamente con el JSON.
        El JSON debe tener la siguiente estructura exacta:
        {
            "ventasProyectadas": number,
            "variacionPorcentual": number,
            "productoAltaDemanda": string,
            "recomendacion": string
        }
        
        - "ventasProyectadas": Una proyección numérica (ej. ${Math.round(summary.totalVentas * 1.15)})
        - "variacionPorcentual": Un número de 1 a 20 (ej. 15)
        - "productoAltaDemanda": El nombre del producto más vendido.
        - "recomendacion": Una recomendación de 1-2 frases basada en los datos.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        
        // Parsear la respuesta JSON de forma segura
        const prediction = JSON.parse(response.text());

        return res.status(200).json({ prediction });

    } catch (err) {
        console.error("Error en getAiPrediction:", err); // Log de error más genérico
        res.status(500).json({ error: "Error en el análisis predictivo." });
    }
}