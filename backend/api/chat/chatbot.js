import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import Product from '../../models/Product.js'; 

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function chatWithGPT(userMessage) {
    try {
        // 1. Obtener productos de la BD
        const products = await Product.find();
        
        // 2. Crear contexto resumido
        const inventoryText = products.map(p => `ID:${p.id} | ${p.name} | $${p.price}`).join('\n');

        // 3. Configurar IA
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" } 
        });

        // 4. Prompt Estricto
        const systemPrompt = `
        Eres KeyBot. Inventario:
        ${inventoryText}

        Usuario: "${userMessage}"

        SI EL USUARIO PIDE VER PRODUCTOS:
        - Tu "reply" debe ser corto: "Claro, aquí tienes:".
        - NO escribas la lista de productos en "reply".
        - LLENA el array "products" con los IDs encontrados.

        JSON:
        { "reply": "texto", "products": [{ "id": 123, "name": "x" }] }
        `;

        // 5. Generar
        const result = await model.generateContent(systemPrompt);
        const jsonResponse = JSON.parse(result.response.text());

        // 6. LÓGICA DE SEGURIDAD (Aquí está la solución)
        // Detectamos si el usuario quiere ver productos
        const userText = userMessage.toLowerCase();
        const keywords = ['producto', 'disponible', 'ver', 'tienes', 'catálogo', 'catalogo', 'lista', 'comprar', 'precio'];
        const userWantsProducts = keywords.some(w => userText.includes(w));

        let finalProducts = [];

        // A. Si la IA devolvió productos, los buscamos
        if (jsonResponse.products && jsonResponse.products.length > 0) {
            for (const aiProd of jsonResponse.products) {
                const found = products.find(p => p.id == aiProd.id || p.name.toLowerCase().includes(aiProd.name?.toLowerCase()));
                if (found) finalProducts.push(found);
            }
        }

        // B. FALLBACK AGRESIVO: Si el usuario quiere productos pero la IA no mandó el array o falló al cruzar datos
        if (finalProducts.length === 0 && userWantsProducts) {
            console.log("⚠️ Forzando envío de productos...");
            // Enviamos los primeros 5 productos de la base de datos
            finalProducts = products.slice(0, 5); 
            jsonResponse.reply = "Aquí tienes nuestros productos destacados:";
        }

        // 7. Asignar la lista real con imágenes al JSON final
        jsonResponse.products = finalProducts;

        return jsonResponse;

    } catch (error) {
        console.error("Error Chatbot:", error);
        return { reply: "Error técnico. Intenta de nuevo." };
    }
}