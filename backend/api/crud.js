// backend/api/crud.js

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
    return await Order.find({}).sort({ id: -1 }).exec();
}

// *** LÓGICA DE STOCK MEJORADA DENTRO DE saveOrder ***
export async function saveOrder(orderData) {
    
    // --- 1. Definir estados de stock ---
    const stockDeductedStates = ['pendiente', 'procesando', 'enviado', 'entregado'];
    const stockRestoredStates = ['cancelado', 'devuelto'];

    // Función de ayuda para ajustar el stock
    const adjustStock = async (items, operation) => {
        // operation es 'inc' (reponer) o 'dec' (descontar)
        const factor = operation === 'inc' ? 1 : -1;
        await Promise.all(items.map(item => 
            Product.updateOne(
                { id: item.productId },
                { $inc: { stock: item.quantity * factor } }
            )
        ));
    };

    // --- 2. Guardar/Actualizar Pedido ---
    if (orderData.id) {
        // --- EDITAR Pedido Existente ---
        
        // 1. Obtener el pedido original ANTES de actualizarlo
        const originalOrder = await Order.findOne({ id: orderData.id });
        if (!originalOrder) throw new Error("No se encontró el pedido original para editar.");

        const originalStatus = originalOrder.status;
        const newStatus = orderData.status;

        // 2. Comprobar si los estados de stock han cambiado
        const wasDeducted = stockDeductedStates.includes(originalStatus);
        const isNowRestored = stockRestoredStates.includes(newStatus);
        
        const wasRestored = stockRestoredStates.includes(originalStatus);
        const isNowDeducted = stockDeductedStates.includes(newStatus);

        // --- LÓGICA DE STOCK ---
        // CASO A: Se movió de un estado DEDUCIDO a un estado REPUESTO (ej. 'entregado' -> 'devuelto')
        if (wasDeducted && isNowRestored) {
            console.log(`Pedido #${orderData.id} movido a ${newStatus}. Reponiendo stock...`);
            await adjustStock(originalOrder.items, 'inc'); // Reponer stock
        }
        
        // CASO B: Se movió de un estado REPUESTO a un estado DEDUCIDO (ej. 'devuelto' -> 'entregado')
        else if (wasRestored && isNowDeducted) {
            console.log(`Pedido #${orderData.id} movido a ${newStatus}. Descontando stock...`);
            // Re-validar stock antes de descontar
            for (const item of originalOrder.items) {
                const product = await Product.findOne({ id: item.productId });
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name} al reactivar el pedido.`);
                }
            }
            await adjustStock(originalOrder.items, 'dec'); // Descontar stock
        }
        // CASO C: (ej. 'pendiente' -> 'enviado') No se hace nada, el stock ya estaba descontado.
        // CASO D: (ej. 'devuelto' -> 'cancelado') No se hace nada, el stock ya estaba repuesto.

        // 3. Actualizar el pedido en la DB (Ahora que el enum está corregido, esto funcionará)
        const updatedOrder = await Order.findOneAndUpdate(
            { id: orderData.id },
            { $set: orderData }, 
            { new: true, runValidators: true }
        );
        return updatedOrder;

    } else {
        // --- CREAR Pedido Nuevo ---
        
        // 1. Validar Stock (solo en creación)
        for (const item of orderData.items) {
            const product = await Product.findOne({ id: item.productId });
            if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado.`);
            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.`);
            }
        }

        // 2. Descontar Stock (SOLO si el estado inicial es de "stock deducido")
        if (stockDeductedStates.includes(orderData.status)) {
            console.log(`Nuevo pedido #${orderData.id} creado con estado ${orderData.status}. Descontando stock...`);
            await adjustStock(orderData.items, 'dec');
        } else {
            // (ej. si se crea un pedido directamente como 'cancelado', no se descuenta stock)
            console.log(`Nuevo pedido #${orderData.id} creado con estado ${orderData.status}. No se descuenta stock.`);
        }

        // 3. Generar ID y N de Seguimiento Automático
        const newId = await getNextId(Order);
        const newTrackingNumber = orderData.trackingNumber || `TRK-${newId}`; 

        // ✅ Ahora sí podemos loguear con un ID real
        if (stockDeductedStates.includes(orderData.status)) {
            console.log(`Nuevo pedido #${newId} creado con estado ${orderData.status}. Descontando stock...`);
        } else {
            console.log(`Nuevo pedido #${newId} creado con estado ${orderData.status}. No se descuenta stock.`);
        }

        // 2. Ajustar stock SOLO después de saber el ID
        if (stockDeductedStates.includes(orderData.status)) {
            await adjustStock(orderData.items, 'dec');
        }

        // 4. Crear pedido
        const newOrder = new Order({
            ...orderData,
            id: newId,
            trackingNumber: newTrackingNumber
        });

        await newOrder.save();
        return newOrder;
    }
}

export async function deleteOrder(orderId) {
    // --- LÓGICA DE DEVOLUCIÓN DE STOCK AL ELIMINAR ---
    const order = await Order.findOne({ id: orderId });
    if (order) {
        // Solo reponer stock si el pedido estaba en un estado "activo" (stock deducido)
        const stockDeductedStates = ['pendiente', 'procesando', 'enviado', 'entregado'];
        if (stockDeductedStates.includes(order.status)) {
            console.log(`Eliminando pedido #${orderId}. Reponiendo stock...`);
            await Promise.all(order.items.map(item => 
                Product.updateOne(
                    { id: item.productId },
                    { $inc: { stock: item.quantity } } // Incrementa el stock
                )
            ));
        }
    }
    
    // Eliminar el pedido
    const result = await Order.deleteOne({ id: orderId });
    return result.deletedCount > 0;
}