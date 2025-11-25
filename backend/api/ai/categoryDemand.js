// backend/api/ai/categoryDemand.js

import Order from '../../models/Order.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry } from './aiUtils.js';
import { safeJsonParse } from './safeJson.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Íconos por categoría
function getCategoryIcon(categoryName) {
    if (!categoryName) return 'fa-box-open';
    const name = categoryName.toLowerCase();
    if (name.includes('t-shirt') || name.includes('camiseta')) return 'fa-tshirt';
    if (name.includes('jacket') || name.includes('chaqueta')) return 'fa-user-secret';
    if (name.includes('accesorio')) return 'fa-redhat';
    if (name.includes('footwear') || name.includes('zapato')) return 'fa-running';
    if (name.includes('gorra')) return 'fa-hat-cowboy';
    if (name.includes('jean')) return 'fa-grip-lines';
    return 'fa-box-open';
}

export const getCategoryDemandPrediction = async (req, res) => {
    try {
        // 1. Fechas
        const now = new Date();
        const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const date90DaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // 2. Pipeline MongoDB
        const aggregationResult = await Order.aggregate([
            { $match: { status: 'entregado', createdAt: { $gte: date90DaysAgo } } },
            { $unwind: '$items' },
            { $addFields: { convertedProductId: { $toInt: '$items.productId' } } },

            // Join con products
            {
                $lookup: {
                    from: 'products',
                    localField: 'convertedProductId',
                    foreignField: 'id',
                    as: 'productInfo'
                }
            },
            { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },

            // Join con categories
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.categoryId',
                    foreignField: 'id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },

            // Filtrar items sin categoría
            { $match: { 'categoryInfo.name': { $exists: true, $ne: null } } },

            // Proyección y periodo
            {
                $project: {
                    _id: 0,
                    categoryName: '$categoryInfo.name',
                    quantity: '$items.quantity',
                    period: {
                        $cond: [
                            { $gte: ['$createdAt', date30DaysAgo] },
                            'recent',
                            'previous'
                        ]
                    }
                }
            },

            // Agrupar cantidades por periodo
            {
                $group: {
                    _id: { category: '$categoryName', period: '$period' },
                    totalQuantity: { $sum: '$quantity' }
                }
            },

            // Consolidar
            {
                $group: {
                    _id: '$_id.category',
                    sales: {
                        $push: {
                            period: '$_id.period',
                            quantity: '$totalQuantity'
                        }
                    }
                }
            }
        ]);

        // 3. Preparar datos para IA
        const trendData = aggregationResult.map(item => ({
            category: item._id,
            recentSales: item.sales.find(s => s.period === 'recent')?.quantity || 0,
            previousSales: item.sales.find(s => s.period === 'previous')?.quantity || 0
        }));

        if (trendData.length === 0) {
            console.warn("⚠️ No hay datos de ventas para análisis de demanda.");
            return res.json([]);
        }

        // 4. Modelo con fallback
        const createModel = (modelName) =>
            genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

        let model = createModel("gemini-2.5-flash");

        // 5. Prompt
        const prompt = `
        Eres un analista de demanda. Analiza cada categoría comparando:
        - "recentSales" (últimos 30 días)
        - "previousSales" (30-90 días)

        Datos de ventas:
        ${JSON.stringify(trendData)}

        Devuelve SOLO un array JSON así:
        [
            {
                "name": string,
                "demand": "alta" | "baja" | "estable"
            }
        ]
        `;

        // 6. Llamada a IA con retry + fallback
        const result = await callGeminiWithRetry(() => model.generateContent(prompt))
            .catch(async (err) => {
                console.warn("⚠️ Gemini 2.5 falló, cambiando a gemini-2.0-flash:", err.message);
                model = createModel("gemini-2.0-flash");
                return callGeminiWithRetry(() => model.generateContent(prompt));
            });

        const textResponse = result.response.text();

        // 7. Parse seguro
        const aiAnalysis = safeJsonParse(textResponse);

        // 8. Añadir iconos + ordenar
        const finalDemand = aiAnalysis
            .map(item => ({
                ...item,
                icon: getCategoryIcon(item.name)
            }))
            .sort((a, b) => {
                const score = (d) => d === "alta" ? 3 : d === "baja" ? 2 : 1;
                return score(b.demand) - score(a.demand);
            })
            .slice(0, 4);

        res.json(finalDemand);

    } catch (error) {
        console.error("❌ Error en getCategoryDemandPrediction:", error);
        res.status(500).json({
            message: "Error al procesar la predicción de demanda",
            error: error.message
        });
    }
};
