import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchData(endpoint) {
  const res = await fetch(`http://localhost:4000${endpoint}`);
  return res.json();
}

export async function chatWithGPT(userMessage) {
  try {
    const [products, categories, sizes] = await Promise.all([
      fetchData("/api/products"),
      fetchData("/api/categories"),
      fetchData("/api/sizes")
    ]);

    const normalized = userMessage.toLowerCase();

    const findCategoryByName = (text) =>
      categories.find(c => text.includes(c.name.toLowerCase()));

    const findMatchingProducts = (text) =>
      products.filter(p =>
        p.name.toLowerCase().includes(text) ||
        p.description.toLowerCase().includes(text)
      );

    const findSizeByName = (text) =>
      sizes.find(s => new RegExp(`\\b${s.name.toLowerCase()}\\b`).test(text));

    // 📌 Nueva intención: Mostrar todos los productos
    if (
      normalized.includes("todos los productos") ||
      normalized.includes("productos disponibles") ||
      normalized.includes("todo lo disponible") ||
      normalized.includes("muéstrame todo") ||
      normalized.includes("mostrar todos")
    ) {

      if (!products.length) {
        return "No hay productos disponibles en este momento.";
      }

      const productCards = products.map(p =>
        `
        <div class="chat-product-card">
          <img src="${p.images?.[0] || '/img/no-image.png'}" class="chat-product-img">
          <div class="chat-product-info">
            <strong>${p.name}</strong><br>
            💲${p.price}<br>
            📦 Stock: ${p.stock}
          </div>
          <button class="chat-view-btn" onclick="openProductModal(${p.id})">Ver más</button>
        </div>
        `
      ).join("");

      return {
  reply: "Aquí tienes todos los productos disponibles:",
  products: products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    images: p.images || []
  })),
  isProduct: true
};

    }

    // 1️⃣ Productos por categoría
    const category = findCategoryByName(normalized);
    if (category) {
      let filtered = products.filter(p => p.categoryId === category.id);

      const size = findSizeByName(normalized);
      if (size) {
        filtered = filtered.filter(p => p.sizeIds.includes(size.id));
      }

      if (!filtered.length) {
        return `No encontré productos en esa categoría${size ? " con esa talla" : ""}.`;
      }

      const list = filtered.map(
        p => `• ${p.name} - $${p.price} (Stock: ${p.stock})`
      ).join("\n");

      return `Aquí tienes los ${category.name}${size ? " talla " + size.name : ""}:\n\n${list}`;
    }


    // 2️⃣ Productos por nombre con tarjetas visuales
// 2️⃣ Productos por nombre → enviar datos para tarjetas reales
const matches = findMatchingProducts(normalized);
if (matches.length) {
  return {
    reply: "Esto es lo que encontré:",
    products: matches,
    isProduct: true
  };
}



    // 3️⃣ GPT fallback
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Eres el asistente virtual de Key Option Store.
Si el usuario pide productos, usa siempre los datos reales de la BD primero.
Respuesta amigable, breve y clara.
`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.5
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("❌ Error en chatWithGPT:", error);
    return "Hubo un error al obtener los datos. Intenta nuevamente. 🙏";
  }
}
