// Retries automáticos cuando Google devuelve 503
export async function callGeminiWithRetry(callback, retries = 3, delay = 1200) {
    for (let i = 0; i < retries; i++) {
        try {
            return await callback();
        } catch (err) {
            if (err.status === 503 && i < retries - 1) {
                console.warn(`⚠️ Gemini saturado (503). Reintentando en ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw err;
            }
        }
    }
}
