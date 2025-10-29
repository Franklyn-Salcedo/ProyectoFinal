// backend/api/crud.js (La nueva lógica de base de datos)

import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js'; // Nuevo
import Size from '../models/Size.js';         // Nuevo

// --- Lógica de IDs para compatibilidad y simplicidad ---
// Aunque Mongo usa _id, mantenemos el 'id' numérico para facilitar la transición del frontend

const getNextId = async (Model) => {
    const lastDoc = await Model.findOne().sort({ id: -1 }).exec();
    return lastDoc ? lastDoc.id + 1 : (Model.modelName === 'Product' ? 1 : 1001);
};


/**
 * FUNCIONES CRUD DE PRODUCTOS
 */
export async function getProducts() {
    // Buscar todos los documentos
    return await Product.find({}).sort({ id: 1 }).exec();
}

export const getCategories = async () => {
    // Ordenar por nombre para el SELECT del frontend
    return await Category.find().sort({ name: 1 }).exec();
};

export const getSizes = async () => {
    return await Size.find().sort({ name: 1 }).exec();
};

export async function saveProduct(productData) {
    if (productData.id) {
        // Editar
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productData.id },
            { $set: productData },
            { new: true, runValidators: true }
        );
        return updatedProduct;
    } else {
        // Añadir nuevo
        const newId = await getNextId(Product);
        const newProduct = new Product({
            ...productData,
            id: newId
        });
        await newProduct.save();
        return newProduct;
    }
}

export async function deleteProduct(productId) {
    // Usamos deleteOne para eliminar un documento por el campo 'id'
    const result = await Product.deleteOne({ id: productId });
    return result.deletedCount > 0;
}


/**
 * FUNCIONES CRUD DE PEDIDOS
 */
export async function getOrders() {
    // Buscar todos los documentos
    return await Order.find({}).sort({ id: -1 }).exec();
}

export async function saveOrder(orderData) {
    if (orderData.id) {
        // Editar
        const updatedOrder = await Order.findOneAndUpdate(
            { id: orderData.id },
            { $set: orderData },
            { new: true, runValidators: true }
        );
        return updatedOrder;
    } else {
        // Añadir nuevo
        const newId = await getNextId(Order);
        const newOrder = new Order({
            ...orderData,
            id: newId
        });
        await newOrder.save();
        return newOrder;
    }
}

export async function deleteOrder(orderId) {
    const result = await Order.deleteOne({ id: orderId });
    return result.deletedCount > 0;
}