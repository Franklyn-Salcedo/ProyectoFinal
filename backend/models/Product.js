import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, default: null }, 
    stock: { type: Number, required: true, min: 0 },
    minStock: { type: Number, default: 5 },
    categoryId: { type: Number, required: true },
    sizeIds: [{ type: Number, required: true }],
    images: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;