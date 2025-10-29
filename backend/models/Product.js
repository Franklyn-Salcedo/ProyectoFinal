// backend/models/Product.js

import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    // MongoDB genera automáticamente el _id (ObjectId)
    id: { type: Number, required: true }, // Mantenemos tu ID numérico original para compatibilidad con el frontend si es necesario, pero _id será el principal de Mongo.
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    // 🛑 RELACIÓN: Guardamos el ID de la categoría (Number)
    categoryId: { type: Number, required: true }, 
    
    // 🛑 Tallas: Guardamos un array de IDs de las tallas aplicables (Array of Numbers)
    sizeIds: [ { type: Number, required: true } ],
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

// Índice para asegurar la unicidad del ID manual
ProductSchema.index({ id: 1 }, { unique: true });

const Product = mongoose.model('Product', ProductSchema);

export default Product;