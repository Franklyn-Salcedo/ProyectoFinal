// backend/api/ai/categoryDemand.js

import Order from '../../models/Order.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callGeminiWithRetry } from './aiUtils.js';
import { safeJsonParse } from './safeJson.js';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Función de ayuda para asignar íconos
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
        // 1. Definir rangos de fechas
        const now = new Date();
        const date30DaysAgo = new Date(new Date().setDate(now.getDate() - 30));
        const date90DaysAgo = new Date(new Date().setDate(now.getDate() - 90));

        // 2. Pipeline de Agregación de MongoDB
        const aggregationResult = await Order.aggregate([
            { $match: { status: 'entregado', createdAt: { $gte: date90DaysAgo } } },
            { $unwind: '$items' },
            {
                $addFields: {
                    convertedProductId: { $toInt: '$items.productId' }
                }
            },
            {
                $lookup: {
                    from: 'products', 
                    localField: 'convertedProductId', 
                    foreignField: 'id',             
                    as: 'productInfo'
                }
            },
            { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } }, 
            {
                $lookup: {
                    from: 'categories', 
                    localField: 'productInfo.categoryId', 
                    foreignField: 'id',                   
                    as: 'categoryInfo'
                }
            },
            { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    'categoryInfo.name': { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    _id: 0,
                    categoryName: '$categoryInfo.name',
                    quantity: '$items.quantity',
                    period: {
                        $cond: {
                            if: { $gte: ['$createdAt', date30DaysAgo] },
                            then: 'recent',
                            else: 'previous'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        category: '$categoryName',
                        period: '$period'
                    },
                    totalQuantity: { $sum: '$quantity' }
                }
            },
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

        // 3. Formatear los datos para la IA
        const trendData = aggregationResult.map(item => {
            const categoryName = item._id;
            const recentSales = item.sales.find(s => s.period === 'recent')?.quantity || 0;
            const prevSales = item.sales.find(s => s.period === 'previous')?.quantity || 0;
            return {
                category: categoryName,
                recentSales: recentSales, 
                previousSales: prevSales 
            };
        });

        if (trendData.length === 0) {
             console.warn("Agregación de demanda de categoría no devolvió datos.");
             return res.json([]);
        }

        // 4. Configurar el modelo para salida JSON
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", // *** CORRECCIÓN FINAL ***
            generationConfig: { 
                responseMimeType: "application/json" 
            }
        });

        // 5. Crear el prompt para el análisis de tendencias
        const prompt = `
        Eres un analista de demanda. Analiza esta lista de ventas por categoría.
        Compara "recentSales" (últimos 30 días) con "previousSales" (30-90 días atrás) para cada categoría.
        
        Datos: ${JSON.stringify(trendData)}

        Responde únicamente con un array JSON.
        Cada objeto en el array debe tener esta estructura:
        {
            "name": string, (el nombre de la categoría)
            "demand": string (solo puede ser "alta", "estable", o "baja")
        }

        - "alta": si "recentSales" es significativamente mayor que "previousSales" O si "previousSales" era 0 y "recentSales" es > 0.
        - "baja": si "recentSales" es significativamente menor que "previousSales".
        - "estable": en todos los demás casos.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;

        // 6. Parsear la respuesta (será un array)
        const aiAnalysis = JSON.parse(response.text());

        // 7. Añadir íconos y ordenar
        const finalDemand = aiAnalysis
            .map(item => ({
                ...item,
                icon: getCategoryIcon(item.name)
            }))
            .sort((a, b) => {
                const demandScore = (d) => (d === 'alta' ? 3 : d === 'baja' ? 2 : 1);
                return demandScore(b.demand) - demandScore(a.demand);
            })
            .slice(0, 4); 

        res.json(finalDemand);

    } catch (error) {
        console.error("Error en getCategoryDemandPrediction (MongoDB/IA):", error);
        res.status(500).json({ message: 'Error al procesar la predicción de demanda', error: error.message });
    }
};
