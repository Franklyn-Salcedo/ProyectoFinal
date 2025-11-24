export function safeJsonParse(text) {
    try {
        // Intento directo
        return JSON.parse(text);
    } catch {}

    // Intento: detectar JSON dentro de texto
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch {}
    }

    throw new Error("No se pudo parsear JSON seguro desde la IA.");
}
