// backend/api/crud.js (La nueva lógica de base de datos)

import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js'; 
import Size from '../models/Size.js'; 

// --- Lógica de IDs ---
const getNextId = async (Model) => {
    const lastDoc = await Model.findOne().sort({ id: -1 }).exec();
    return lastDoc ? lastDoc.id + 1 : (Model.modelName === 'Product' ? 1 : 1001);
};


/**
 * FUNCIONES CRUD DE PRODUCTOS
 */
export async function getProducts() {
    return await Product.find({}).sort({ id: 1 }).exec();
}

export const getCategories = async () => {
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
    const result = await Product.deleteOne({ id: productId });
    return result.deletedCount > 0;
}


/**
 * FUNCIONES CRUD DE PEDIDOS
 */
export async function getOrders() {
    return await Order.find({}).sort({ id: -1 }).exec(); // Ordenar por ID (más nuevos primero)
}

// FUNCIÓN 'saveOrder' TOTALMENTE ACTUALIZADA
export async function saveOrder(orderData) {
    
    // --- 1. Validar Stock (SOLO PARA PEDIDOS NUEVOS) ---
    // (Asumimos que la edición de un pedido no descuenta stock, solo la creación)
    if (!orderData.id) {
        let stockError = null;
        for (const item of orderData.items) {
            const product = await Product.findOne({ id: item.productId });
            
            if (!product) {
                throw new Error(`Producto con ID ${item.productId} no encontrado.`);
            }
            if (product.stock < item.quantity) {
                // Error si no hay suficiente stock
                stockError = `Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.`;
                break; // Detener el bucle
            }
        }
        
        // Si hubo un error de stock, detener todo y enviar el mensaje
        if (stockError) {
            // Esto será atrapado por el bloque .catch() en server.js
            throw new Error(stockError);
        }
    }

    // --- 2. Guardar/Actualizar Pedido ---
    if (orderData.id) {
        // --- EDITAR Pedido Existente ---
        const updatedOrder = await Order.findOneAndUpdate(
            { id: orderData.id },
            // Asegurarse de que el N° de seguimiento se actualice si se envía
            { $set: orderData }, 
            { new: true, runValidators: true }
        );
        return updatedOrder;

    } else {
        // --- CREAR Pedido Nuevo ---
        
        // 3. Descontar Stock
        await Promise.all(orderData.items.map(item => 
            Product.updateOne(
                { id: item.productId },
                // $inc decrementa el campo 'stock'
                { $inc: { stock: -item.quantity } } 
            )
        ));

        // 4. Generar ID y N de Seguimiento Automático
        const newId = await getNextId(Order);
        // Si el admin escribió algo, se usa; si no, se genera.
        const newTrackingNumber = orderData.trackingNumber || `TRK-${newId}`; 

        const newOrder = new Order({
            ...orderData,
            id: newId,
            trackingNumber: newTrackingNumber // Asignar el nuevo número
        });
        
        await newOrder.save();
        return newOrder;
    }
}


export async function deleteOrder(orderId) {
    // (Opcional: Faltaría lógica para reponer stock si se elimina un pedido)
    const result = await Order.deleteOne({ id: orderId });
    return result.deletedCount > 0;
}