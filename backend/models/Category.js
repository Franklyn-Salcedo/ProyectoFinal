// backend/models/Category.js
import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    // Usamos 'id' para que la lógica de IDs secuenciales sea consistente con Product y Order
    id: { type: Number, required: true, unique: true } 
});

CategorySchema.index({ id: 1 }, { unique: true }); 
const Category = mongoose.model('Category', CategorySchema);
export default Category;