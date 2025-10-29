// admin.js (Frontend - Usando Fetch)

// Ya no importamos db.js porque las funciones están en el servidor

// ==========================================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================================
const ADMIN_USERNAME = "admin"; // Usuario fijo para la autenticación
const ADMIN_PASSWORD = "1234";
const AppState = {
    editingProductId: null,
    editingOrderId: null,
    currentView: 'dashboard-view',
    categories: [],
    sizes: [],
};

const STOCK_THRESHOLD = 5; // Define el nivel bajo de stock para la alerta

// --- DOMElements (Permanece igual) ---
const DOMElements = {
    // Elementos del Layout/Contenedores
    loginSection: document.getElementById('login-section'),
    adminDashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('login-form'),

// Elementos de la lista de productos
    productList: document.getElementById('product-list-container'), 
    
    // 🛑 NUEVO: Campo de búsqueda
    productSearchInput: document.getElementById('product-search-input'),
//------------------------------------- Estadisticas inicio
// 🛑 NUEVOS ELEMENTOS DEL DASHBOARD
    kpiTotalSales: document.getElementById('kpi-total-sales'),
    kpiPendingOrders: document.getElementById('kpi-pending-orders'),
    kpiCriticalStock: document.getElementById('kpi-critical-stock'),
    kpiConversion: document.getElementById('kpi-conversion'),
    recentActivityList: document.getElementById('recent-activity-list'),
//------------------------------------- Estadisticas inicio
    // Elementos de Login/Autenticación
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    togglePasswordBtn: document.getElementById('toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),
    logoutBtn: document.getElementById('logout-btn'),

    // Elementos de Navegación del Dashboard
    viewButtons: document.querySelectorAll('.view-btn'),
    allViews: document.querySelectorAll('.view-content'),

    // Elementos: Fecha y Hora
    currentDateElement: document.getElementById('current-date'),
    currentTimeElement: document.getElementById('current-time'),

    // Elementos del CRUD de Productos
    productList: document.getElementById('product-list'),
    productForm: document.getElementById('product-form'),
    formTitle: document.getElementById('form-title'),
    productIdInput: document.getElementById('product-id'),
    productNameInput: document.getElementById('product-name'),
    productDescriptionInput: document.getElementById('product-description'),
    // 🛑 CAMBIO: productCategoryInput será un <select>
    productCategoryInput: document.getElementById('product-category-select'), // 🛑 CAMBIAR ID
    productPriceInput: document.getElementById('product-price'),
    productStockInput: document.getElementById('product-stock'),
    // 🛑 CAMBIO: Ahora es un contenedor de checkboxes
    productSizesContainer: document.getElementById('product-sizes-container'), // 🛑 CAMBIAR ID
    productImagesInput: document.getElementById('product-images'),
    saveBtn: document.getElementById('save-btn'),
    cancelBtn: document.getElementById('cancel-btn'),

    // Elementos del CRUD de Pedidos
    orderList: document.getElementById('order-list'),
    orderForm: document.getElementById('order-form'),
    orderFormTitle: document.getElementById('order-form-title'),
    orderIdInput: document.getElementById('order-id'),

    // Campos del Formulario de Pedidos
    customerNameInput: document.getElementById('customer-name'),
    customerEmailInput: document.getElementById('customer-email'),
    customerAddressInput: document.getElementById('customer-address'),
    orderStatusInput: document.getElementById('order-status'),
    orderTotalInput: document.getElementById('order-total'),
    trackingNumberInput: document.getElementById('tracking-number'),

    // Elementos para la Selección de Artículos 
    addOrderItemBtn: document.getElementById('add-order-item-btn'),
    orderItemsSelectionContainer: document.getElementById('order-items-container'),

    saveOrderBtn: document.getElementById('save-order-btn'),
    cancelOrderBtn: document.getElementById('cancel-order-btn'),
};


// ----------------------------------------------------
// 1. FUNCIÓN UTILITARIA (FECHA/HORA)
// ----------------------------------------------------

function updateDateTime() {
    const now = new Date();

    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = now.toLocaleDateString('es-ES', optionsDate);
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1).toLowerCase();

    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const formattedTime = now.toLocaleTimeString('es-ES', optionsTime);

    if (DOMElements.currentDateElement) { DOMElements.currentDateElement.textContent = formattedDate; }
    if (DOMElements.currentTimeElement) { DOMElements.currentTimeElement.textContent = formattedTime; }
}


// ----------------------------------------------------
// 2. VISTAS Y NAVEGACIÓN
// ----------------------------------------------------

async function switchView(viewId) {
    AppState.currentView = viewId;

    DOMElements.allViews.forEach(view => {
        view.style.display = 'none';
    });

    const selectedView = document.getElementById(viewId);
    if (selectedView) {
        selectedView.style.display = 'block';
    }

    DOMElements.viewButtons.forEach(btn => {
        const btnViewId = btn.getAttribute('data-view');
        btn.classList.remove('bg-yellow-400', 'text-black', 'font-bold');
        btn.classList.add('hover:bg-gray-800', 'text-white');

        if (btnViewId === viewId) {
            btn.classList.add('bg-yellow-400', 'text-black', 'font-bold');
            btn.classList.remove('hover:bg-gray-800', 'text-white');
        }
    });

    // Cargar datos al cambiar de vista (Ahora son ASÍNCRONOS)
    if (viewId === 'products-view') {
        await renderProductList();
        resetForm();
    }
    if (viewId === 'orders-view') {
        await renderOrderList();
        resetOrderForm();
    }
}

function handleViewButtonClick(e) {
    const viewId = e.currentTarget.getAttribute('data-view');
    switchView(viewId);
}

function showLogin() {
    DOMElements.loginSection.style.display = 'flex';
    DOMElements.adminDashboard.style.display = 'none';
    DOMElements.loginForm.reset();
    DOMElements.loginError.textContent = '';
}

function showDashboard() {
    DOMElements.loginSection.style.display = 'none';
    DOMElements.adminDashboard.style.display = 'flex';
    switchView(AppState.currentView);
}


// ----------------------------------------------------
// 3. LOGIN / LOGOUT (Sin cambios)
// ----------------------------------------------------

function togglePasswordVisibility() {
    const passwordInput = DOMElements.passwordInput;
    const eyeIcon = DOMElements.eyeIcon;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = DOMElements.usernameInput.value;
    const password = DOMElements.passwordInput.value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        AppState.currentView = 'dashboard-view';
        showDashboard();
    } else if (username !== ADMIN_USERNAME) {
        DOMElements.loginError.textContent = 'Usuario incorrecto.';
    } else {
        DOMElements.loginError.textContent = 'Contraseña incorrecta.';
    }
}

function handleLogout() {
    sessionStorage.removeItem('isAdminAuthenticated');
    DOMElements.loginForm.reset();
    showLogin();
}

// ----------------------------------------------------
// 4. NUEVAS FUNCIONES DE API (ASÍNCRONAS - fetch)
// ----------------------------------------------------


async function getProducts() {
    try {
        // ✅ CAMBIO CLAVE: Añadir un timestamp como parámetro de consulta
        const timestamp = new Date().getTime();
        const url = `/api/products?t=${timestamp}`;

        const response = await fetch(url);

        if (!response.ok) throw new Error('Error al obtener productos');

        return await response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

async function saveProduct(productData) {
    try {
        // En nuestro esquema simplificado, POST maneja tanto creación como actualización
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Error al guardar producto');

        // Devuelve el objeto JSON si es exitoso
        return await response.json();

    } catch (error) {
        console.error("Error saving product:", error);
        alert('Error al guardar el producto. Revisa la consola.');

        // 🚀 CAMBIO CLAVE: Devuelve null en caso de error.
        return null;
    }
}

async function deleteProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar producto');
        return await response.json();
    } catch (error) {
        console.error("Error deleting product:", error);
        alert('Error al eliminar el producto. Revisa la consola.');
    }
}

async function getOrders() {
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Error al obtener pedidos');
        return await response.json();
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

async function saveOrder(orderData) {
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error('Error al guardar pedido');
        return await response.json();
    } catch (error) {
        console.error("Error saving order:", error);
        alert('Error al guardar el pedido. Revisa la consola.');
    }
}

async function deleteOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar pedido');
        return await response.json();
    } catch (error) {
        console.error("Error deleting order:", error);
        alert('Error al eliminar el pedido. Revisa la consola.');
    }
}

async function getCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Error al obtener categorías');
        return await response.json();
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}
/**
* Busca el nombre de una categoría dado su ID.
 * @param {number} categoryId El ID numérico de la categoría.
 * @returns {string} El nombre de la categoría o 'Desconocida'.
 */
function getCategoryName(categoryId) {
    // Aseguramos que la lista de categorías esté disponible
    if (!AppState.categories || AppState.categories.length === 0) {
        return 'Cargando...';
    }

    // Convertimos a número para asegurar la comparación estricta (==)
    const category = AppState.categories.find(cat => cat.id === parseInt(categoryId, 10));

    // Si la encuentra, devuelve el nombre; si no, 'Desconocida'
    return category ? category.name : 'Desconocida';
}


async function getSizes() {
    try {
        const response = await fetch('/api/sizes');
        if (!response.ok) throw new Error('Error al obtener tallas');
        return await response.json();
    } catch (error) {
        console.error("Error fetching sizes:", error);
        return [];
    }
}

// ----------------------------------------------------
// 5. CRUD DE PRODUCTOS (Modificado con async/await)
// ----------------------------------------------------

async function renderProductList() {
    const products = await getProducts();
    DOMElements.productList.innerHTML = '';

    if (products.length === 0) {
        DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-500">No hay productos en el inventario. Añade uno nuevo.</p>`;
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg';
        productCard.innerHTML = `
                    <img src="${product.images[0] || 'https://placehold.co/600x800/111827/FFFFFF?text=No+Image'}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-bold text-lg truncate">${product.name}</h3>

                    <p class="text-gray-400 text-sm">${getCategoryName(product.categoryId)}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xl font-bold text-yellow-400">$${product.price.toFixed(2)}</span>
                    <span class="text-sm text-gray-500">Stock: ${product.stock}</span>
                </div>
                <div class="flex gap-2 mt-4">
                    <button data-id="${product.id}" class="edit-btn w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm">Editar</button>
                    <button data-id="${product.id}" class="delete-btn w-full bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm">Eliminar</button>
                </div>
            </div>
        `;
        DOMElements.productList.appendChild(productCard);
    });
}

function resetForm() {
    // 1. Resetear el formulario (si existe)
    if (DOMElements.productForm) {
        DOMElements.productForm.reset();
    }

    AppState.editingProductId = null;

    // 2. 🛑 CORRECCIÓN: Agregar chequeo para evitar el error 'null' (Línea ~363)
    if (DOMElements.formTitle) { // <--- ¡Esto evita el error!
        DOMElements.formTitle.textContent = 'Añadir Nuevo Producto';
    }

    // 3. Chequeos de otros elementos UI (recomendado)
    if (DOMElements.saveBtn) {
        DOMElements.saveBtn.textContent = 'Guardar Producto';
    }
    if (DOMElements.cancelBtn) {
        DOMElements.cancelBtn.style.display = 'none';
    }

    // Limpieza de imágenes si existe el campo
    if (DOMElements.productImagesInput) {
        DOMElements.productImagesInput.value = '';
    }
}


async function fillFormForEdit(productId) {
    const products = await getProducts(); // Obtener productos actualizados
    const product = products.find(p => p.id == productId);
    if (!product) return;

    AppState.editingProductId = productId;
    DOMElements.productIdInput.value = product.id;
    DOMElements.productNameInput.value = product.name;
    DOMElements.productDescriptionInput.value = product.description;

    // 🛑 CAMBIO CLAVE 1: Categoría (Usar el ID numérico para llenar el <select>)
    // Usamos el ID del producto (product.categoryId) para seleccionar la opción correcta
    // La función fillCategorySelect debe ser re-ejecutada con el ID para la edición
    fillCategorySelect(product.categoryId);

    DOMElements.productPriceInput.value = product.price;
    DOMElements.productStockInput.value = product.stock;

    // 🛑 CAMBIO CLAVE 2: Tallas (Marcar Checkboxes usando sizeIds)
    const sizeCheckboxes = DOMElements.productSizesContainer.querySelectorAll('input[name="product-size-id"]');

    sizeCheckboxes.forEach(cb => {
        const sizeId = parseInt(cb.value, 10);
        // Marcamos si el ID del checkbox está incluido en el array sizeIds del producto
        // Aseguramos que product.sizeIds sea un array antes de usar includes
        cb.checked = Array.isArray(product.sizeIds) && product.sizeIds.includes(sizeId);
    });

    // 🛑 CAMBIO CLAVE 3: Imágenes (Se mantiene el formato para URL)
    // Asumimos que product.images es un array de URLs
    DOMElements.productImagesInput.value = Array.isArray(product.images) ? product.images.join('\n') : '';


    DOMElements.formTitle.textContent = 'Editando Producto';
    DOMElements.saveBtn.textContent = 'Actualizar Producto';
    DOMElements.cancelBtn.style.display = 'inline-block';
    window.scrollTo(0, 0);
}

async function handleProductFormSubmit(e) {
    e.preventDefault();

    // Capturamos los IDs de las tallas marcadas (SIN CAMBIOS)
    const selectedSizeIds = Array.from(
        DOMElements.productSizesContainer.querySelectorAll('input[name="product-size-id"]:checked')
    ).map(cb => parseInt(cb.value, 10));

    const productData = {
        id: AppState.editingProductId,
        name: DOMElements.productNameInput.value,
        description: DOMElements.productDescriptionInput.value,
        categoryId: parseInt(DOMElements.productCategoryInput.value, 10),
        price: parseFloat(DOMElements.productPriceInput.value),
        stock: parseInt(DOMElements.productStockInput.value, 10),
        sizeIds: selectedSizeIds,
        images: DOMElements.productImagesInput.value.split('\n').map(url => url.trim()).filter(Boolean),
    };

    // Validación básica (SIN CAMBIOS)
    if (isNaN(productData.categoryId)) {
        alert("Por favor, selecciona una categoría válida.");
        return;
    }

    // 🚀 CAMBIO CLAVE 1: Capturamos el resultado de la promesa
    const savedProduct = await saveProduct(productData);

    // 🚀 CAMBIO CLAVE 2: Solo si el guardado fue exitoso (savedProduct no es null/undefined)
    if (savedProduct) {
        resetForm();
        // Recargamos la lista con el producto recién creado/editado
        await renderProductList();
        // Opcional: Desplazarse para ver el nuevo producto
        window.scrollTo(0, document.body.scrollHeight);
    }
    // Si no fue exitoso, saveProduct ya mostró un alert, y el código se detiene aquí.
}
async function handleProductListClick(e) {
    const target = e.target;
    // Convierte a número ya que los IDs ahora son números en el servidor
    const productId = parseInt(target.dataset.id, 10);

    if (target.classList.contains('edit-btn')) {
        await fillFormForEdit(productId);
    }

    if (target.classList.contains('delete-btn')) {
        if (confirm(`¿Estás seguro de que quieres eliminar este producto?`)) {
            await deleteProduct(productId);
            await renderProductList();
            resetForm();
        }
    }
}

function handleProductSearch() {
    // 1. Obtener el término de búsqueda y normalizarlo
    const searchTerm = DOMElements.productSearchInput.value.toLowerCase().trim();
    
    // 2. Obtener todas las tarjetas de producto ya renderizadas
    // Asumimos que productList es el contenedor de todas las tarjetas de producto (los <div>).
    const productCards = DOMElements.productList.children; 

    // 3. Iterar y filtrar los elementos del DOM
    Array.from(productCards).forEach(card => {
        
        // 4. Extraer el nombre del producto y la categoría de la tarjeta
        // Asumo que el nombre está en <h3> y la categoría en <p class="text-gray-400">
        const nameElement = card.querySelector('h3');
        // Usa el selector CSS que identifica a la categoría
        const categoryElement = card.querySelector('p.text-gray-400'); 
        
        // Si no se encuentran los elementos por algún error en el HTML, se ignora la tarjeta
        if (!nameElement || !categoryElement) return;

        const nameText = nameElement.textContent.toLowerCase();
        const categoryText = categoryElement.textContent.toLowerCase();
        
        // 5. Lógica de coincidencia (busca en Nombre O Categoría)
        const isMatch = nameText.includes(searchTerm) || categoryText.includes(searchTerm);

        // 6. Mostrar u ocultar la tarjeta
        // Usamos la propiedad 'display' para hacer la tarjeta invisible/visible.
        if (isMatch) {
            // Asumo que las tarjetas usan 'grid' o 'block' para mostrarse.
            card.style.display = ''; // Vacío para restaurar el display por defecto de Tailwind/CSS
        } else {
            card.style.display = 'none';
        }
    });

    // NOTA: Esta lógica requiere que 'renderProductList' ya haya ejecutado y dibujado todos los productos.
}


// ----------------------------------------------------
// 6. CRUD DE PEDIDOS (Modificado con async/await)
// ----------------------------------------------------

function getStatusColor(status) {
    switch (status) {
        case 'pendiente': return { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-400', label: 'Pendiente' };
        case 'procesando': return { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-500', label: 'Procesando' };
        case 'enviado': return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500', label: 'Enviado' };
        case 'entregado': return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500', label: 'Entregado' };
        case 'cancelado': return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500', label: 'Cancelado' };
        default: return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500', label: 'Desconocido' };
    }
}

/**
 * Función CLAVE: Calcula el total del pedido sumando los precios de los artículos.
 */
async function calculateOrderTotal() {
    const itemRows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    const products = await getProducts(); // Obtener productos de la API
    let total = 0;
    let validItems = 0;

    itemRows.forEach(row => {
        const productId = parseInt(row.querySelector('[name="product-id"]').value, 10);
        const quantity = parseInt(row.querySelector('[name="product-quantity"]').value, 10);

        const product = products.find(p => p.id === productId);

        if (product && quantity > 0) {
            total += product.price * quantity;
            validItems++;
        }
    });

    DOMElements.orderTotalInput.value = total.toFixed(2);
    if (validItems === 0 && itemRows.length > 0) {
        DOMElements.orderTotalInput.value = '0.00';
    }
}


async function renderOrderList() {
    const orders = await getOrders();
    DOMElements.orderList.innerHTML = '';

    if (orders.length === 0) {
        DOMElements.orderList.innerHTML = `<p class="col-span-full text-center text-gray-500">No hay pedidos registrados.</p>`;
        return;
    }

    orders.forEach(order => {
        const { bg, text, border, label } = getStatusColor(order.status);

        const itemDetails = order.items && order.items.length > 0
            ? order.items.map(item => `${item.quantity}x ${item.name} (${item.size || 'N/A'})`).join(' | ')
            : 'Sin Artículos Registrados';

        const orderCard = document.createElement('div');
        orderCard.className = `bg-card-bg p-4 rounded-lg shadow flex justify-between items-start transition hover:bg-gray-800 border-l-4 ${border}`;
        orderCard.innerHTML = `
            <div>
                <p class="font-bold text-lg">Pedido #${order.id}</p>
                <p class="text-sm text-gray-400 mb-1">Cliente: ${order.customerName}</p>
                <p class="text-xs text-gray-500 truncate w-64">Artículos: ${itemDetails}</p>
            </div>
            <div class="text-right flex flex-col items-end">
                <span class="${bg} ${text} text-xs font-bold py-1 px-3 rounded-full uppercase">${label}</span>
                <p class="text-xl font-extrabold mt-1 text-yellow-400">$${order.total.toFixed(2)}</p>
                <div class="flex gap-2 mt-2">
                    <button data-id="${order.id}" class="edit-order-btn text-blue-400 hover:text-blue-500 text-sm">Editar</button>
                    <button data-id="${order.id}" class="delete-order-btn text-red-400 hover:text-red-500 text-sm">Eliminar</button>
                </div>
            </div>
        `;
        DOMElements.orderList.appendChild(orderCard);
    });
}

async function createOrderItemRow(productItem = {}) {
    const products = await getProducts(); // Obtener productos de la API
    const row = document.createElement('div');
    row.className = 'order-item-row flex gap-3 items-center bg-gray-700 p-2 rounded-lg';

    // 1. Selector de Producto
    const productSelect = document.createElement('select');
    productSelect.className = 'flex-1 bg-gray-600 p-2 rounded text-sm';
    productSelect.name = 'product-id';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona Producto';
    productSelect.appendChild(defaultOption);

    products.forEach(p => {
        const option = document.createElement('option');
        option.value = String(p.id);
        option.textContent = `${p.name} ($${p.price.toFixed(2)})`;
        if (p.id == productItem.productId) {
            option.selected = true;
        }
        productSelect.appendChild(option);
    });

    // 2. Selector de Talla
    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'w-24 bg-gray-600 p-2 rounded text-sm';
    sizeSelect.name = 'product-size';

    // 3. Input de Cantidad
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'w-16 bg-gray-600 p-2 rounded text-sm text-center';
    quantityInput.name = 'product-quantity';
    quantityInput.min = '1';
    quantityInput.value = productItem.quantity || '1';

    // 4. Botón de Eliminar Fila
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'text-red-400 hover:text-red-500 transition ml-2';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener('click', () => {
        row.remove();
        calculateOrderTotal();
        const container = DOMElements.orderItemsSelectionContainer;
        if (container.children.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-400 text-center" id="empty-order-placeholder">Usa el botón "Añadir Artículo" para empezar.</p>';
        }
    });

    // Función para actualizar las tallas disponibles
    function updateSizes(selectedId, selectedSize = null) {
        const id = parseInt(selectedId, 10);
        const selectedProduct = products.find(p => p.id === id);
        sizeSelect.innerHTML = '<option value="">Talla</option>';
        if (selectedProduct && Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0) {
            selectedProduct.sizes.forEach(size => {
                const option = document.createElement('option');
                option.value = size;
                option.textContent = size;
                if (size === selectedSize) {
                    option.selected = true;
                }
                sizeSelect.appendChild(option);
            });
            sizeSelect.disabled = false;
        } else {
            const option = document.createElement('option');
            option.value = 'N/A';
            option.textContent = 'N/A';
            sizeSelect.appendChild(option);
            sizeSelect.disabled = true;
        }
    }

    // Eventos
    productSelect.addEventListener('change', (e) => {
        updateSizes(e.target.value);
        calculateOrderTotal();
    });

    quantityInput.addEventListener('input', calculateOrderTotal);

    // Inicializar tallas (para carga o edición)
    if (productItem.productId) {
        updateSizes(productItem.productId, productItem.size);
    } else {
        updateSizes(null);
    }

    row.appendChild(productSelect);
    row.appendChild(sizeSelect);
    row.appendChild(quantityInput);
    row.appendChild(removeBtn);

    return row;
}

async function addOrderItem() {
    const container = DOMElements.orderItemsSelectionContainer;

    const placeholder = document.getElementById('empty-order-placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    const newRow = await createOrderItemRow(); // Esperamos a que la fila esté lista
    container.appendChild(newRow);
    calculateOrderTotal();
}

function resetOrderForm() {
    DOMElements.orderForm.reset();
    DOMElements.orderIdInput.value = '';
    AppState.editingOrderId = null;
    DOMElements.orderFormTitle.textContent = 'Añadir Nuevo Pedido (Manual)';
    DOMElements.saveOrderBtn.textContent = 'Guardar Pedido';
    DOMElements.cancelOrderBtn.style.display = 'none';

    DOMElements.orderItemsSelectionContainer.innerHTML = '<p class="text-sm text-gray-400 text-center" id="empty-order-placeholder">Usa el botón "Añadir Artículo" para empezar.</p>';
    DOMElements.orderTotalInput.value = '0.00';
}

async function fillFormForEditOrder(orderId) {
    const orders = await getOrders();
    const order = orders.find(o => o.id == orderId);
    if (!order) return;

    AppState.editingOrderId = orderId;
    DOMElements.orderIdInput.value = order.id;
    DOMElements.customerNameInput.value = order.customerName;
    DOMElements.customerEmailInput.value = order.customerEmail;
    DOMElements.customerAddressInput.value = order.customerAddress;
    DOMElements.orderStatusInput.value = order.status;
    DOMElements.orderTotalInput.value = order.total.toFixed(2);
    DOMElements.trackingNumberInput.value = order.trackingNumber;

    DOMElements.orderFormTitle.textContent = `Editando Pedido #${order.id}`;
    DOMElements.saveOrderBtn.textContent = 'Actualizar Pedido';
    DOMElements.cancelOrderBtn.style.display = 'inline-block';

    DOMElements.orderItemsSelectionContainer.innerHTML = '';
    if (order.items && order.items.length > 0) {
        // Usamos un loop for...of con await ya que createOrderItemRow es async
        for (const item of order.items) {
            DOMElements.orderItemsSelectionContainer.appendChild(await createOrderItemRow(item));
        }
    } else {
        DOMElements.orderItemsSelectionContainer.innerHTML = '<p class="text-sm text-gray-400 text-center" id="empty-order-placeholder">Usa el botón "Añadir Artículo" para empezar.</p>';
    }

    await calculateOrderTotal();

    window.scrollTo(0, 0);
}

async function handleOrderFormSubmit(e) {
    e.preventDefault();

    await calculateOrderTotal();

    const itemRows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    const items = [];
    const products = await getProducts();
    const finalTotal = parseFloat(DOMElements.orderTotalInput.value);

    if (itemRows.length === 0 || finalTotal === 0) {
        alert("Por favor, añade al menos un artículo válido al pedido.");
        return;
    }

    itemRows.forEach(row => {
        const productId = parseInt(row.querySelector('[name="product-id"]').value, 10);
        const size = row.querySelector('[name="product-size"]').value;
        const quantity = parseInt(row.querySelector('[name="product-quantity"]').value, 10);

        if (!isNaN(productId) && quantity > 0 && productId > 0) {
            const product = products.find(p => p.id === productId);
            if (product) {
                items.push({
                    productId: productId,
                    name: product.name,
                    size: size || 'N/A',
                    quantity: quantity
                });
            }
        }
    });

    if (items.length === 0) {
        alert("Por favor, selecciona un producto, talla y cantidad válidos en al menos una fila.");
        return;
    }

    const orderData = {
        id: AppState.editingOrderId,
        customerName: DOMElements.customerNameInput.value,
        customerEmail: DOMElements.customerEmailInput.value,
        customerAddress: DOMElements.customerAddressInput.value,
        status: DOMElements.orderStatusInput.value,
        total: finalTotal,
        trackingNumber: DOMElements.trackingNumberInput.value,
        items: items
    };

    await saveOrder(orderData);
    resetOrderForm();
    await renderOrderList();
}


async function handleOrderListClick(e) {
    const target = e.target;
    const orderId = parseInt(target.dataset.id, 10);

    if (target.classList.contains('edit-order-btn')) {
        await fillFormForEditOrder(orderId);
    }

    if (target.classList.contains('delete-order-btn')) {
        if (confirm(`¿Estás seguro de que quieres eliminar el pedido #${orderId}?`)) {
            await deleteOrder(orderId);
            await renderOrderList();
            resetOrderForm();
        }
    }
}

// ----------------------------------------------------
// 2.5. GESTIÓN DE DATOS DE REFERENCIA (CATEGORÍAS/TALLAS)
// ----------------------------------------------------

async function loadReferenceData() {
    // 1. Obtener datos
    AppState.categories = await getCategories();
    AppState.sizes = await getSizes();

    // 2. Llenar el <select> de Categorías
    fillCategorySelect();

    // 3. Crear los Checkboxes de Tallas
    createSizeCheckboxes();
}

function fillCategorySelect(selectedCategoryId = null) {
    DOMElements.productCategoryInput.innerHTML = '';

    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona una Categoría';
    DOMElements.productCategoryInput.appendChild(defaultOption);

    AppState.categories.forEach(cat => {
        const option = document.createElement('option');
        // El valor DEBE ser el ID numérico
        option.value = String(cat.id);
        option.textContent = cat.name;

        // Para la edición
        if (selectedCategoryId === cat.id) {
            option.selected = true;
        }

        DOMElements.productCategoryInput.appendChild(option);
    });
}

function createSizeCheckboxes() {
    DOMElements.productSizesContainer.innerHTML = '';

    AppState.sizes.forEach(size => {
        const div = document.createElement('div');
        div.className = 'flex items-center';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `size-${size.id}`;
        checkbox.name = 'product-size-id';
        // El valor DEBE ser el ID numérico
        checkbox.value = String(size.id);
        checkbox.className = 'form-checkbox h-4 w-4 text-yellow-400 bg-gray-600 border-gray-500 rounded focus:ring-yellow-400';

        const label = document.createElement('label');
        label.htmlFor = `size-${size.id}`;
        label.className = 'ml-2 text-sm text-gray-300';
        label.textContent = size.name;

        div.appendChild(checkbox);
        div.appendChild(label);
        DOMElements.productSizesContainer.appendChild(div);
    });
}

// ----------------------------------------------------
// 7. INICIALIZACIÓN (Ajuste)
// ----------------------------------------------------

function initialize() {
    // 🛑 NUEVO: Cargar datos de referencia antes de los eventos
    loadReferenceData();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Eventos de Login/Logout
    DOMElements.loginForm.addEventListener('submit', handleLogin);
    DOMElements.logoutBtn.addEventListener('click', handleLogout);
    if (DOMElements.togglePasswordBtn) {
        DOMElements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Eventos de Navegación del Dashboard
    if (DOMElements.viewButtons) {
        DOMElements.viewButtons.forEach(btn => {
            btn.addEventListener('click', handleViewButtonClick);
        });
    }

    // Eventos de CRUD de Productos
    DOMElements.productForm.addEventListener('submit', handleProductFormSubmit);
    DOMElements.productList.addEventListener('click', handleProductListClick);
    DOMElements.cancelBtn.addEventListener('click', resetForm);

if (DOMElements.productSearchInput) {
    // Usamos 'input' para que la búsqueda se realice en tiempo real, al escribir
    DOMElements.productSearchInput.addEventListener('input', handleProductSearch);
}


    // Eventos de CRUD de Pedidos
    if (DOMElements.orderForm) {
        DOMElements.orderForm.addEventListener('submit', handleOrderFormSubmit);
    }
    if (DOMElements.orderList) {
        DOMElements.orderList.addEventListener('click', handleOrderListClick);
    }
    if (DOMElements.cancelOrderBtn) {
        DOMElements.cancelOrderBtn.addEventListener('click', resetOrderForm);
    }
    // Listener para añadir nuevo artículo (ahora llama a una función async)
    if (DOMElements.addOrderItemBtn) {
        DOMElements.addOrderItemBtn.addEventListener('click', addOrderItem);
    }

    // Comprobar la sesión al cargar la página
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

document.addEventListener('DOMContentLoaded', initialize);