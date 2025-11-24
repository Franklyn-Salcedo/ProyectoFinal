// backend/models/Order.js
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    size: { type: String },
});


const OrderSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerAddress: { type: String, required: true },
    status: {
        type: String,
        // *** CORRECCIÓN: 'devuelto' AÑADIDO AL ENUM ***
        enum: ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado', 'devuelto'],
        default: 'pendiente'
    },
    total: { type: Number, required: true, min: 0 },
    trackingNumber: { type: String, default: '' },
    items: [OrderItemSchema],
    createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;