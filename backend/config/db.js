// backend/config/db.js (¡Ahora es el CONECTOR de la base de datos!)

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env
dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        process.exit(1); // Salir del proceso con error
    }
};

export default connectDB;