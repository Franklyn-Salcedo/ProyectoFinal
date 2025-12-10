// backend/checkModels.js
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

async function listMyModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    console.log("Contactando a Google AI para ver los modelos de tu API key...");

    const result = await genAI.listModels();

    console.log("--- Modelos Disponibles para 'generateContent' ---");

    for (const model of result.models) {
        if (model.supportedGenerationMethods.includes('generateContent')) {
            console.log(`\nModelo: ${model.displayName}`);
            console.log(`  ➡️  Nombre para la API: ${model.name}`);
        }
    }

    console.log("\n---");
    console.log("Copia el 'Nombre para la API' (ej. 'models/gemini-1.5-flash-latest') del modelo que quieras usar.");
    console.log("Pégalo en el campo 'model:' en 'predict.js' y 'categoryDemand.js'.");

  } catch (err) {
    console.error("Error al obtener la lista de modelos:", err);
  }
}

listMyModels();