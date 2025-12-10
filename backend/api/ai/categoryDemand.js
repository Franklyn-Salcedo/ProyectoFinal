import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Helper para iconos
function getCategoryIcon(categoryName) {
    if (!categoryName) return 'fa-box';
    const name = categoryName.toLowerCase();
    if (name.includes('t-shirt') || name.includes('camisa') || name.includes('top')) return 'fa-tshirt';
    if (name.includes('pant') || name.includes('jean') || name.includes('short')) return 'fa-user';
    if (name.includes('shoe') || name.includes('zapat') || name.includes('tenis')) return 'fa-shoe-prints';
    if (name.includes('hat') || name.includes('cap') || name.includes('gorra')) return 'fa-redhat';
    if (name.includes('hoodie') || name.includes('sueter') || name.includes('jacket')) return 'fa-user-secret';
    if (name.includes('accesor')) return 'fa-gem';
    return 'fa-box-open';
}

// Helper de limpieza JSON
function cleanAndParseJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e2) {
                console.error("Fallo al parsear JSON extraído:", e2);
            }
        }
        return null;
    }
}

export async function getCategoryDemandPrediction(req, res) {
    try {
        // 1. FECHAS
        const now = new Date();
        const date60DaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 2. DATOS DE BD
        const orders = await Order.find({
            status: 'entregado',
            createdAt: { $gte: date60DaysAgo }
        });

        if (orders.length === 0) {
            return res.json([]);
        }

        const products = await Product.find();
        const categories = await Category.find();

        // 3. MAPEOS
        const productCategoryMap = {};
        products.forEach(p => productCategoryMap[p.id] = p.categoryId);

        const categoryNameMap = {};
        categories.forEach(c => categoryNameMap[c.id] = c.name);

        // 4. CÁLCULOS
        const stats = {};

        orders.forEach(order => {
            const isRecent = new Date(order.createdAt) >= date30DaysAgo;
            if (order.items) {
                order.items.forEach(item => {
                    const catId = productCategoryMap[item.productId];
                    const catName = catId ? (categoryNameMap[catId] || "General") : "General";
                    
                    if (!stats[catName]) stats[catName] = { recent: 0, previous: 0 };
                    
                    const qty = item.quantity || 0;
                    if (isRecent) stats[catName].recent += qty;
                    else stats[catName].previous += qty;
                });
            }
        });

        const analysisData = Object.keys(stats).map(name => ({
            category: name,
            last30Days: stats[name].recent,
            previous30Days: stats[name].previous
        }));

        // 5. LLAMADA A GEMINI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const prompt = `
            Analiza la demanda de estas categorías basado en ventas recientes vs anteriores:
            ${JSON.stringify(analysisData)}

            Responde SOLO con un JSON Array válido (sin markdown):
            [
                { "name": "NombreExactoDeLaCategoria", "demand": "alta" },
                { "name": "OtraCategoria", "demand": "estable" }
            ]
            Usa solo: "alta", "baja", "estable". Máximo 4 items.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // 6. LIMPIEZA
        let finalData = cleanAndParseJSON(text);

        // Fallback si la IA falla
        if (!finalData || !Array.isArray(finalData)) {
            finalData = analysisData.map(d => {
                let demand = 'estable';
                if (d.last30Days > d.previous30Days * 1.2) demand = 'alta';
                if (d.last30Days < d.previous30Days * 0.8) demand = 'baja';
                return { name: d.category, demand };
            }).slice(0, 4);
        }

        // 7. AGREGAR ICONOS
        const responseWithIcons = finalData.map(cat => ({
            ...cat,
            icon: getCategoryIcon(cat.name)
        }));

        res.json(responseWithIcons);

    } catch (error) {
        console.error(" Error en Category Demand:", error.message);
        res.json([
            { name: "Error de conexión", demand: "baja", icon: "fa-exclamation-triangle" }
        ]);
    }
}