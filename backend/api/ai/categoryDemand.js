import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// --- CACHÉ ---
let lastRunCat = null;
let lastResponseCat = null;
const CAT_CACHE_MINUTES = 30;
// -------------

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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

function cleanAndParseJSON(text) {
    try { return JSON.parse(text); } 
    catch (e) {
        const match = text.match(/\[[\s\S]*\]/);
        return match ? JSON.parse(match[0]) : null;
    }
}

export async function getCategoryDemandPrediction(req, res) {
    // 1. CHEQUEO DE CACHÉ
    const now = Date.now();
    if (lastRunCat && (now - lastRunCat) < CAT_CACHE_MINUTES * 60 * 1000) {
        console.log("⚡ Usando demanda (caché).");
        return res.json(lastResponseCat);
    }

    // Declaramos esto fuera para que el CATCH lo pueda usar
    let analysisData = []; 

    try {
        // 2. RECOLECCIÓN DE DATOS
        const date60DaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const date30DaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const orders = await Order.find({
            status: 'entregado',
            createdAt: { $gte: date60DaysAgo }
        });

        // Si no hay ventas, array vacío
        if (orders.length === 0) return res.json([]);

        const products = await Product.find();
        const categories = await Category.find();

        const productCategoryMap = {};
        products.forEach(p => productCategoryMap[p.id] = p.categoryId);
        const categoryNameMap = {};
        categories.forEach(c => categoryNameMap[c.id] = c.name);

        const stats = {};
        orders.forEach(order => {
            const isRecent = new Date(order.createdAt) >= date30DaysAgo;
            if (order.items) {
                order.items.forEach(item => {
                    const catId = productCategoryMap[item.productId];
                    const catName = catId ? (categoryNameMap[catId] || "Otros") : "Otros";
                    if (!stats[catName]) stats[catName] = { recent: 0, previous: 0 };
                    const qty = parseInt(item.quantity) || 0;
                    if (isRecent) stats[catName].recent += qty;
                    else stats[catName].previous += qty;
                });
            }
        });

        // Convertir a Array para análisis
        analysisData = Object.keys(stats).map(name => ({
            name: name,
            recent: stats[name].recent,
            previous: stats[name].previous,
            total: stats[name].recent + stats[name].previous
        }));
        
        // Ordenar por importancia (más ventas totales primero)
        analysisData.sort((a, b) => b.total - a.total);

        // 3. INTENTO IA
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Analiza: ${JSON.stringify(analysisData.slice(0,4))}.
            JSON Array exacto: [{ "name": "Categoria", "demand": "alta" }]
            Values demand: "alta", "baja", "estable".
        `;

        const result = await model.generateContent(prompt);
        let finalData = cleanAndParseJSON(result.response.text());

        if (!finalData || !Array.isArray(finalData)) throw new Error("IA inválida");

        // Formatear para Frontend (name, demand, icon)
        const responseData = finalData.map(item => ({
            name: item.name,        // IMPORTANTE: Frontend espera 'name'
            demand: item.demand,    // IMPORTANTE: Frontend espera 'demand' (alta/baja/estable)
            icon: getCategoryIcon(item.name)
        }));

        // Guardar Caché
        lastRunCat = Date.now();
        lastResponseCat = responseData;
        res.json(responseData);

    } catch (error) {
        console.warn("⚠️ Fallo IA (Quota/Error). Usando cálculo manual.", error.message);

        // 4. PLAN B: CÁLCULO MANUAL (FALLBACK)
        if (analysisData.length === 0) {
             return res.json([{ name: "Sin datos", demand: "estable", icon: "fa-box" }]);
        }

        const fallbackData = analysisData.slice(0, 4).map(d => {
            let demand = 'estable';
            // Lógica: Si subió 10% es alta, si bajó 10% es baja
            if (d.previous === 0) {
                demand = d.recent > 0 ? 'alta' : 'estable';
            } else {
                const ratio = d.recent / d.previous;
                if (ratio >= 1.1) demand = 'alta';
                else if (ratio <= 0.9) demand = 'baja';
            }

            return {
                name: d.name,       
                demand: demand,     
                icon: getCategoryIcon(d.name)
            };
        });

        // Guardar Caché del Fallback
        lastRunCat = Date.now();
        lastResponseCat = fallbackData;

        res.json(fallbackData);
    }
}