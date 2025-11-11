import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// import axios from 'axios'; // o fetch

export async function getAiPrediction(req, res) {

    try {
        // 1️⃣ Ventas del último mes
        const lastMonthOrders = await Order.find({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // 2️⃣ Calcular métricas básicas
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

        // 3️⃣ Crear resumen de métricas
        const summary = {
            totalVentas: totalSales,
            cantidadOrdenes: lastMonthOrders.length,
            productoMasVendido: bestSeller ? bestSeller.name : "Sin ventas recientes",
            cantidadVendida: bestProductQty
        };

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        // const models = await genAI.listModels();
   

        // 4️⃣ Armar prompt para IA (usando las variables correctas)
        const prompt = `
        Analiza estas ventas de una tienda online:
        - Total de ventas: ${summary.totalVentas}
        - Órdenes registradas: ${summary.cantidadOrdenes}
        - Producto más vendido: ${summary.productoMasVendido} (${summary.cantidadVendida} unidades)

        Genera una proyección de ventas y una recomendación.
        Responde en formato JSON con:
        {
        "ventasProyectadas": number,
        "variacionPorcentual": number,
        "productoAltaDemanda": string,
        "recomendacion": string
        }`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const match = response.match(/\{[\s\S]*\}/);
    
        // 2️⃣ Si hay bloque JSON, parsearlo; si no, devolver texto original
        const prediction = match ? JSON.parse(match[0]) : { raw: response };

        // console.log(JSON.parse(response));
        return res.status(200).json({ prediction });



    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el análisis predictivo." });
    }
}

