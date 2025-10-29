// backend/models/Size.js
import mongoose from 'mongoose';

const SizeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    id: { type: Number, required: true, unique: true }
});

SizeSchema.index({ id: 1 }, { unique: true }); 
const Size = mongoose.model('Size', SizeSchema);
export default Size;