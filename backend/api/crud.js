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

// NUEVA FUNCIÓN: Obtener pedido por ID numérico
export async function getOrderById(orderId) {
    // Usamos el id numérico, no el _id de MongoDB
    return await Order.findOne({ id: orderId }).exec();
}

// *** LÓGICA DE STOCK MEJORADA DENTRO DE saveOrder ***
export async function saveOrder(orderData) {

    // --- 1. Definir estados de stock ---
    const stockDeductedStates = ['pendiente', 'procesando', 'enviado', 'entregado'];
    const stockRestoredStates = ['cancelado', 'devuelto'];

    // Función de ayuda para ajustar el stock
    const adjustStock = async (items, operation) => {
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
        const originalOrder = await Order.findOne({ id: orderData.id });
        if (!originalOrder) throw new Error("No se encontró el pedido original para editar.");

        const originalStatus = originalOrder.status;
        const newStatus = orderData.status;

        const wasDeducted = stockDeductedStates.includes(originalStatus);
        const isNowRestored = stockRestoredStates.includes(newStatus);
        const wasRestored = stockRestoredStates.includes(originalStatus);
        const isNowDeducted = stockDeductedStates.includes(newStatus);

        if (wasDeducted && isNowRestored) {
            console.log(`Pedido #${orderData.id} movido a ${newStatus}. Reponiendo stock...`);
            await adjustStock(originalOrder.items, 'inc');
        } else if (wasRestored && isNowDeducted) {
            console.log(`Pedido #${orderData.id} movido a ${newStatus}. Descontando stock...`);
            for (const item of originalOrder.items) {
                const product = await Product.findOne({ id: item.productId });
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name} al reactivar el pedido.`);
                }
            }
            await adjustStock(originalOrder.items, 'dec');
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { id: orderData.id },
            { $set: orderData },
            { new: true, runValidators: true }
        );
        return updatedOrder;

    } else {
        // --- CREAR Pedido Nuevo ---
        for (const item of orderData.items) {
            const product = await Product.findOne({ id: item.productId });
            if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado.`);
            if (product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.`);
            }
        }

        // 3. Generar ID y Número de Seguimiento
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
        // 4. Preparar items con precios reales y calcular total
let orderTotal = 0;
const processedItems = [];

for (const item of orderData.items) {
    const product = await Product.findOne({ id: item.productId });

    if (!product) throw new Error(`Producto con ID ${item.productId} no encontrado.`);

    const price = Number(product.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const itemTotal = price * quantity;

    orderTotal += itemTotal;

    processedItems.push({
        productId: product.id,
        name: product.name,
        price,
        quantity,
        size: item.size || '',
    });
}

// 5. Crear pedido con datos consistentes
const newOrder = new Order({
    id: newId,
    customerName: orderData.customerName,
    customerEmail: orderData.customerEmail,
    customerAddress: orderData.customerAddress,
    status: orderData.status || 'pendiente',
    total: orderTotal,
    trackingNumber: newTrackingNumber,
    items: processedItems,
});

await newOrder.save();
return newOrder;

    }
}

export async function deleteOrder(orderId) {
    const order = await Order.findOne({ id: orderId });
    if (order) {
        const stockDeductedStates = ['pendiente', 'procesando', 'enviado', 'entregado'];
        if (stockDeductedStates.includes(order.status)) {
            console.log(`Eliminando pedido #${orderId}. Reponiendo stock...`);
            await Promise.all(order.items.map(item => 
                Product.updateOne(
                    { id: item.productId },
                    { $inc: { stock: item.quantity } }
                )
            ));
        }
    }

    const result = await Order.deleteOne({ id: orderId });
    return result.deletedCount > 0;
}
