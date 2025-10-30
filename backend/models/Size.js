import mongoose from 'mongoose';

const SizeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    id: { type: Number, required: true, unique: true }
});

const Size = mongoose.model('Size', SizeSchema);
export default Size;
