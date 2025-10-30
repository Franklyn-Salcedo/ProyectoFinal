// admin.js (Frontend - Usando Fetch)

// ==========================================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================================
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";
const AppState = {
    editingProductId: null,
    editingOrderId: null,
    currentView: 'dashboard-view',
    categories: [],
    sizes: [],
    products: [], // Caché de productos para el formulario de pedidos
};

const STOCK_THRESHOLD = 5; 
let toastTimer; 

// --- DOMElements ---
const DOMElements = {
    // Layout
    loginSection: document.getElementById('login-section'),
    adminDashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('login-form'),
    productSearchInput: document.getElementById('product-search-input'),
    
    // Dashboard KPIs
    kpiTotalSales: document.getElementById('kpi-total-sales'),
    kpiPendingOrders: document.getElementById('kpi-pending-orders'),
    kpiCriticalStock: document.getElementById('kpi-critical-stock'),
    kpiConversion: document.getElementById('kpi-conversion'),
    recentActivityList: document.getElementById('recent-activity-list'),
    
    // Login
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    togglePasswordBtn: document.getElementById('toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),
    logoutBtn: document.getElementById('logout-btn'),

    // Navegación
    viewButtons: document.querySelectorAll('.view-btn'),
    allViews: document.querySelectorAll('.view-content'),

    // Fecha y Hora
    currentDateElement: document.getElementById('current-date'),
    currentTimeElement: document.getElementById('current-time'),

    // CRUD Productos
    productList: document.getElementById('product-list'),
    productForm: document.getElementById('product-form'),
    formTitle: document.getElementById('form-title'),
    productIdInput: document.getElementById('product-id'),
    productNameInput: document.getElementById('product-name'),
    productDescriptionInput: document.getElementById('product-description'),
    productCategoryInput: document.getElementById('product-category-select'),
    productPriceInput: document.getElementById('product-price'),
    productStockInput: document.getElementById('product-stock'),
    productSizesContainer: document.getElementById('product-sizes-container'),
    productImagesInput: document.getElementById('product-images'),
    saveBtn: document.getElementById('save-btn'),
    cancelBtn: document.getElementById('cancel-btn'),

    // CRUD Pedidos
    orderList: document.getElementById('order-list'),
    orderForm: document.getElementById('order-form'),
    orderFormTitle: document.getElementById('order-form-title'),
    orderIdInput: document.getElementById('order-id'),
    customerNameInput: document.getElementById('customer-name'),
    customerEmailInput: document.getElementById('customer-email'),
    customerAddressInput: document.getElementById('customer-address'),
    orderStatusInput: document.getElementById('order-status'),
    orderTotalInput: document.getElementById('order-total'),
    trackingNumberInput: document.getElementById('tracking-number'),
    addOrderItemBtn: document.getElementById('add-order-item-btn'),
    orderItemsSelectionContainer: document.getElementById('order-items-container'),
    saveOrderBtn: document.getElementById('save-order-btn'),
    cancelOrderBtn: document.getElementById('cancel-order-btn'),

    // Pop-ups
    toastPopup: document.getElementById('toast-popup'),
    toastIcon: document.getElementById('toast-icon'),
    toastMessage: document.getElementById('toast-message'),
    confirmationModal: document.getElementById('confirmation-modal'),
    confirmationMessage: document.getElementById('confirmation-message'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),

    // Sidebar Colapsable
    adminSidebar: document.getElementById('admin-sidebar'),
    mainContent: document.getElementById('main-content'),
    toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
    toggleSidebarIcon: document.getElementById('toggle-sidebar-icon'),
    sidebarTexts: document.querySelectorAll('.sidebar-text'),
};


// ----------------------------------------------------
// 1. FUNCIONES UTILITARIAS (FECHA/HORA y POP-UP)
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

function showPopup(message, type = 'success') {
    const { toastPopup, toastIcon, toastMessage } = DOMElements;
    if (!toastPopup || !toastIcon || !toastMessage) {
        alert(message);
        return;
    }
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toastPopup.classList.remove('bg-green-600', 'bg-red-600', 'bg-blue-600');
    toastIcon.classList.remove('fa-check-circle', 'fa-exclamation-triangle', 'fa-info-circle');
    if (type === 'success') {
        toastPopup.classList.add('bg-green-600');
        toastIcon.classList.add('fa-check-circle');
    } else if (type === 'error') {
        toastPopup.classList.add('bg-red-600');
        toastIcon.classList.add('fa-exclamation-triangle');
    } else {
        toastPopup.classList.add('bg-blue-600');
        toastIcon.classList.add('fa-info-circle');
    }
    
    // Mostrar
    toastPopup.classList.remove('opacity-0', 'translate-x-full', 'invisible');
    toastPopup.classList.add('opacity-100', 'translate-x-0');

    // Ocultar después de 3 segundos
    toastTimer = setTimeout(() => {
        toastPopup.classList.remove('opacity-100', 'translate-x-0');
        //  Usar 'translate-x-full' para ocultar
        toastPopup.classList.add('opacity-0', 'translate-x-full'); 
        setTimeout(() => {
            toastPopup.classList.add('invisible');
        }, 300); // Coincide con duration-300
    }, 3000);
}

function showConfirmationModal(message, onConfirm) {
    const { confirmationModal, confirmationMessage, confirmDeleteBtn, confirmCancelBtn } = DOMElements;
    if (!confirmationModal) {
        // Fallback si el HTML del modal no existe
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    confirmationMessage.textContent = message;
    confirmationModal.classList.remove('hidden');
    
    // Clonar botones para limpiar listeners viejos
    // Esto es crucial para que el botón no ejecute acciones antiguas
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
    DOMElements.confirmDeleteBtn = newConfirmBtn; // Actualizar la referencia en DOMElements

    const newCancelBtn = confirmCancelBtn.cloneNode(true);
    confirmCancelBtn.parentNode.replaceChild(newCancelBtn, confirmCancelBtn);
    DOMElements.confirmCancelBtn = newCancelBtn; // Actualizar la referencia

    // Añadir nuevos listeners
    DOMElements.confirmDeleteBtn.addEventListener('click', () => {
        onConfirm(); // Ejecuta la acción (ej. deleteProduct)
        confirmationModal.classList.add('hidden');
    });
    DOMElements.confirmCancelBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
    });
}


// ----------------------------------------------------
// 2. VISTAS Y NAVEGACIÓN
// ----------------------------------------------------

function toggleSidebar() {
    const { adminSidebar, mainContent, toggleSidebarIcon, sidebarTexts, viewButtons } = DOMElements;
    const isCollapsed = adminSidebar.classList.contains('w-20');
    adminSidebar.classList.toggle('w-64', isCollapsed); 
    adminSidebar.classList.toggle('w-20', !isCollapsed); 
    adminSidebar.classList.toggle('p-4', isCollapsed);  
    adminSidebar.classList.toggle('p-2', !isCollapsed); 
    mainContent.classList.toggle('ml-64', isCollapsed);
    mainContent.classList.toggle('ml-20', !isCollapsed);
    toggleSidebarIcon.classList.toggle('fa-chevron-left', isCollapsed);
    toggleSidebarIcon.classList.toggle('fa-chevron-right', !isCollapsed);
    sidebarTexts.forEach(textElement => {
        textElement.classList.toggle('hidden');
    });
    viewButtons.forEach(btn => {
        btn.classList.toggle('justify-center', !isCollapsed);
    });
    DOMElements.logoutBtn.classList.toggle('justify-center', !isCollapsed);
    DOMElements.toggleSidebarBtn.classList.toggle('justify-center', !isCollapsed);
}

async function switchView(viewId) {
    AppState.currentView = viewId;
    
    DOMElements.allViews.forEach(view => { view.style.display = 'none'; });
    const selectedView = document.getElementById(viewId);
    if (selectedView) { selectedView.style.display = 'block'; }

    DOMElements.viewButtons.forEach(btn => {
        const btnViewId = btn.getAttribute('data-view');
        const textSpan = btn.querySelector('.sidebar-text');
        if (textSpan && textSpan.classList.contains('hidden')) {
             btn.classList.add('justify-center'); 
        } else {
             btn.classList.remove('justify-center');
        }
        btn.classList.remove('bg-yellow-400', 'text-black', 'font-bold');
        btn.classList.add('hover:bg-gray-800', 'text-white');
        if (btnViewId === viewId) {
            btn.classList.add('bg-yellow-400', 'text-black', 'font-bold');
            btn.classList.remove('hover:bg-gray-800', 'text-white');
        }
    });
    
    if (viewId === 'dashboard-view') {
        await loadDashboardData(); 
    }
    if (viewId === 'products-view') {
        DOMElements.productSearchInput.value = '';
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
// 3. LOGIN / LOGOUT
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
// 4. FUNCIONES DE API (ASÍNCRONAS - fetch)
// ----------------------------------------------------
async function getProducts() {
    try {
        const timestamp = new Date().getTime();
        const url = `/api/products?t=${timestamp}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener productos');
        const products = await response.json();
        AppState.products = products; // Actualizar caché
        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}
async function saveProduct(productData) {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Error al guardar producto');
        return await response.json();
    } catch (error) {
        console.error("Error saving product:", error);
        showPopup('Error al guardar el producto.', 'error');
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
        showPopup('Error al eliminar el producto.', 'error');
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
        
        if (response.status === 400) { 
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar pedido');
        }
        if (!response.ok) {
            throw new Error('Error de red al guardar pedido');
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error saving order:", error);
        showPopup(error.message, 'error'); 
        return null;
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
        showPopup('Error al eliminar el pedido.', 'error');
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
function getCategoryName(categoryId) {
    if (!AppState.categories || AppState.categories.length === 0) {
        return 'Cargando...';
    }
    const category = AppState.categories.find(cat => cat.id === parseInt(categoryId, 10));
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
// 5. CRUD DE PRODUCTOS
// ----------------------------------------------------

async function renderProductList() {
    const searchTerm = DOMElements.productSearchInput.value.toLowerCase().trim();
    const products = await getProducts();
    const filteredProducts = products.filter(product => {
        const name = product.name.toLowerCase();
        const category = getCategoryName(product.categoryId).toLowerCase();
        return name.includes(searchTerm) || category.includes(searchTerm);
    });
    DOMElements.productList.innerHTML = '';
    if (filteredProducts.length === 0) {
        if (products.length === 0) {
            DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-500">No hay productos en el inventario. Añade uno nuevo.</p>`;
        } else {
            DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-500">No se encontraron productos que coincidan con "${DOMElements.productSearchInput.value}".</p>`;
        }
        return;
    }
    filteredProducts.forEach(product => {
        let stockClass = "text-gray-500"; 
        let stockIcon = ""; 
        if (product.stock === 0) {
            stockClass = "text-red-500 font-bold"; 
            stockIcon = `<i class="fas fa-times-circle mr-1" title="Agotado"></i>`;
        } else if (product.stock <= STOCK_THRESHOLD) {
            stockClass = "text-yellow-400"; 
            stockIcon = `<i class="fas fa-exclamation-triangle mr-1" title="Stock bajo"></i>`;
        }
        const productCard = document.createElement('div');
        productCard.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg';
        productCard.innerHTML = `
            <img src="${product.images[0] || 'https://placehold.co/600x800/111827/FFFFFF?text=No+Image'}" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg truncate">${product.name}</h3>
                <p class="text-gray-400 text-sm">${getCategoryName(product.categoryId)}</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xl font-bold text-yellow-400">$${product.price.toFixed(2)}</span>
                    <span class="text-sm ${stockClass} flex items-center">
                        ${stockIcon}
                        Stock: ${product.stock}
                    </span>
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
    if (DOMElements.productForm) {
        DOMElements.productForm.reset();
    }
    AppState.editingProductId = null;
    if (DOMElements.formTitle) {
        DOMElements.formTitle.textContent = 'Añadir Nuevo Producto';
    }
    if (DOMElements.saveBtn) {
        DOMElements.saveBtn.textContent = 'Guardar Producto';
    }
    if (DOMElements.cancelBtn) {
        DOMElements.cancelBtn.style.display = 'none';
    }
    if (DOMElements.productImagesInput) {
        DOMElements.productImagesInput.value = '';
    }
    if (DOMElements.productSizesContainer) {
        DOMElements.productSizesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
    if (DOMElements.productCategoryInput) {
        DOMElements.productCategoryInput.value = '';
    }
}
async function fillFormForEdit(productId) {
    const products = await getProducts(); 
    const product = products.find(p => p.id == productId);
    if (!product) return;
    AppState.editingProductId = productId;
    DOMElements.productIdInput.value = product.id;
    DOMElements.productNameInput.value = product.name;
    DOMElements.productDescriptionInput.value = product.description;
    fillCategorySelect(product.categoryId);
    DOMElements.productPriceInput.value = product.price;
    DOMElements.productStockInput.value = product.stock;
    const sizeCheckboxes = DOMElements.productSizesContainer.querySelectorAll('input[name="product-size-id"]');
    sizeCheckboxes.forEach(cb => {
        const sizeId = parseInt(cb.value, 10);
        cb.checked = Array.isArray(product.sizeIds) && product.sizeIds.includes(sizeId);
    });
    DOMElements.productImagesInput.value = Array.isArray(product.images) ? product.images.join('\n') : '';
    DOMElements.formTitle.textContent = 'Editando Producto';
    DOMElements.saveBtn.textContent = 'Actualizar Producto';
    DOMElements.cancelBtn.style.display = 'inline-block';
    window.scrollTo(0, 0);
}
async function handleProductFormSubmit(e) {
    e.preventDefault();
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
    if (isNaN(productData.categoryId) || !productData.categoryId) {
        showPopup("Por favor, selecciona una categoría válida.", 'error');
        return;
    }
    const savedProduct = await saveProduct(productData);
    if (savedProduct) {
        const message = AppState.editingProductId ? 'Producto actualizado' : 'Producto añadido';
        showPopup(`${message} con éxito.`, 'success');
        resetForm();
        await renderProductList();
        window.scrollTo(0, document.body.scrollHeight);
    }
}
async function handleProductListClick(e) {
    const target = e.target;
    const productId = parseInt(target.dataset.id, 10);
    if (target.classList.contains('edit-btn')) {
        await fillFormForEdit(productId);
    }
    if (target.classList.contains('delete-btn')) {
        showConfirmationModal(
            `¿Estás seguro de que quieres eliminar este producto?`, 
            async () => {
                const result = await deleteProduct(productId);
                if (result) {
                    showPopup('Producto eliminado.', 'success');
                    await renderProductList();
                    resetForm();
                }
            }
        );
    }
}
function handleProductSearch() {
    renderProductList(); 
}

// ----------------------------------------------------
// 6. CRUD DE PEDIDOS
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

async function calculateOrderTotal() {
    const itemRows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    const products = AppState.products; // Usar caché
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

function createOrderItemRow(productItem = {}) {
    const products = AppState.products; // Usar caché
    const row = document.createElement('div');
    row.className = 'order-item-row flex gap-3 items-center bg-gray-700 p-2 rounded-lg'; 
    
    const productSelect = document.createElement('select');
    productSelect.className = 'flex-1 bg-gray-600 p-2 rounded text-sm';
    productSelect.name = 'product-id';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona Producto';
    productSelect.appendChild(defaultOption);
    
    products.filter(p => p.stock > 0).forEach(p => {
        const option = document.createElement('option');
        option.value = String(p.id); 
        option.textContent = `${p.name} (Stock: ${p.stock}) ($${p.price.toFixed(2)})`;
        if (p.id == productItem.productId) {
            option.selected = true;
        }
        productSelect.appendChild(option);
    });

    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'w-24 bg-gray-600 p-2 rounded text-sm';
    sizeSelect.name = 'product-size';
    
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'w-16 bg-gray-600 p-2 rounded text-sm text-center';
    quantityInput.name = 'product-quantity';
    quantityInput.min = '1';
    quantityInput.value = productItem.quantity || '1';
    
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

    function updateSizes(selectedId, selectedSize = null) {
        const id = parseInt(selectedId, 10);
        const selectedProduct = AppState.products.find(p => p.id === id);
        const allSizes = AppState.sizes; 
        
        sizeSelect.innerHTML = '<option value="">Talla</option>';
        
        if (selectedProduct && Array.isArray(selectedProduct.sizeIds) && selectedProduct.sizeIds.length > 0) {
            const productSizes = allSizes.filter(s => selectedProduct.sizeIds.includes(s.id));

            if (productSizes.length === 0) {
                const option = document.createElement('option');
                option.value = 'N/A';
                option.textContent = 'N/A';
                sizeSelect.appendChild(option);
                sizeSelect.disabled = true;
            } else {
                productSizes.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size.name; 
                    option.textContent = size.name;
                    if (size.name === selectedSize) { 
                        option.selected = true;
                    }
                    sizeSelect.appendChild(option);
                });
                sizeSelect.disabled = false;
            }
        } else {
            const option = document.createElement('option');
            option.value = 'N/A';
            option.textContent = 'N/A';
            sizeSelect.appendChild(option);
            sizeSelect.disabled = true;
        }
    }
    
    productSelect.addEventListener('change', (e) => {
        updateSizes(e.target.value);
        calculateOrderTotal(); 
        const product = AppState.products.find(p => p.id == e.target.value);
        if(product) {
            quantityInput.max = product.stock;
        }
    });
    quantityInput.addEventListener('input', calculateOrderTotal); 
    
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

function addOrderItem() { 
    const container = DOMElements.orderItemsSelectionContainer;
    const placeholder = document.getElementById('empty-order-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    const newRow = createOrderItemRow(); 
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
    DOMElements.trackingNumberInput.value = order.trackingNumber || ''; 
    DOMElements.orderFormTitle.textContent = `Editando Pedido #${order.id}`;
    DOMElements.saveOrderBtn.textContent = 'Actualizar Pedido';
    DOMElements.cancelOrderBtn.style.display = 'inline-block';
    DOMElements.orderItemsSelectionContainer.innerHTML = '';
    
    if (order.items && order.items.length > 0) {
        for (const item of order.items) {
             const product = AppState.products.find(p => p.name === item.name); // Usar caché
             const itemForEdit = {
                 productId: product ? product.id : null,
                 size: item.size,
                 quantity: item.quantity
             };
             DOMElements.orderItemsSelectionContainer.appendChild(createOrderItemRow(itemForEdit));
        }
    } else {
        DOMElements.orderItemsSelectionContainer.innerHTML = '<p class="text-sm text-gray-400 text-center" id="empty-order-placeholder">Usa el botón "Añadir Artículo" para empezar.</p>';
    }
    calculateOrderTotal(); 
    window.scrollTo(0, 0); 
}

async function handleOrderFormSubmit(e) {
    e.preventDefault();
    calculateOrderTotal(); 
    const itemRows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    const items = [];
    const products = AppState.products; // Usar caché
    const finalTotal = parseFloat(DOMElements.orderTotalInput.value);

    if (itemRows.length === 0 || finalTotal === 0) {
        showPopup("Por favor, añade al menos un artículo válido.", 'error');
        return;
    }

    let stockError = false; 

    itemRows.forEach(row => {
        const productId = parseInt(row.querySelector('[name="product-id"]').value, 10);
        const size = row.querySelector('[name="product-size"]').value;
        const quantity = parseInt(row.querySelector('[name="product-quantity"]').value, 10);
        
        if (!isNaN(productId) && quantity > 0 && productId > 0) {
            const product = products.find(p => p.id === productId);
            if (product) {
                // Validación de Stock (Frontend)
                if (!AppState.editingOrderId && quantity > product.stock) { // Solo validar stock en pedidos NUEVOS
                    showPopup(`Stock insuficiente para ${product.name}. Solo quedan ${product.stock}.`, 'error');
                    stockError = true;
                    return; 
                }
                
                items.push({
                    productId: productId,
                    name: product.name,
                    price: product.price, 
                    size: size || 'N/A', 
                    quantity: quantity
                });
            }
        }
    });

    if (stockError) return; 
    if (items.length === 0) {
        showPopup("Selecciona un producto, talla y cantidad válidos.", 'error');
        return;
    }
    
    const orderData = {
        id: AppState.editingOrderId,
        customerName: DOMElements.customerNameInput.value,
        customerEmail: DOMElements.customerEmailInput.value,
        customerAddress: DOMElements.customerAddressInput.value,
        status: DOMElements.orderStatusInput.value,
        total: finalTotal, 
        trackingNumber: AppState.editingOrderId ? DOMElements.trackingNumberInput.value : undefined,
        items: items 
    };
    
    const savedOrder = await saveOrder(orderData); 
    
    if (savedOrder) {
        const message = AppState.editingOrderId ? 'Pedido actualizado' : 'Pedido añadido';
        showPopup(`${message} con éxito: #${savedOrder.id}`, 'success');
        
        await getProducts(); 
        await renderProductList();
        
        resetOrderForm(); 
        await renderOrderList(); 
    }
}


// Esta función AHORA usa el modal personalizado
async function handleOrderListClick(e) {
    const target = e.target;
    // Asegurarse de que el target sea el botón (a veces se hace clic en el ícono)
    const deleteButton = target.closest('.delete-order-btn');
    const editButton = target.closest('.edit-order-btn');

    if (editButton) {
        const orderId = parseInt(editButton.dataset.id, 10);
        await fillFormForEditOrder(orderId);
    }
    
    if (deleteButton) {
        const orderId = parseInt(deleteButton.dataset.id, 10);
        // Usar el modal personalizado en lugar de confirm()
        showConfirmationModal(
            `¿Estás seguro de que quieres eliminar el pedido #${orderId}?`, 
            async () => {
                const result = await deleteOrder(orderId);
                if (result) {
                    showPopup('Pedido eliminado.', 'success');
                    await renderOrderList();
                    resetOrderForm();
                }
            }
        );
    }
}

// ----------------------------------------------------
// 2.5. GESTIÓN DE DATOS DE REFERENCIA (CATEGORÍAS/TALLAS)
// ----------------------------------------------------

async function loadReferenceData() {
    AppState.categories = await getCategories();
    AppState.sizes = await getSizes();
    fillCategorySelect();
    createSizeCheckboxes();
}

function fillCategorySelect(selectedCategoryId = null) {
    DOMElements.productCategoryInput.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona una Categoría';
    DOMElements.productCategoryInput.appendChild(defaultOption);
    AppState.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = String(cat.id);
        option.textContent = cat.name;
        if (selectedCategoryId === cat.id) {
            option.selected = true;
        }
        DOMElements.productCategoryInput.appendChild(option);
    });
}

function createSizeCheckboxes() {
    DOMElements.productSizesContainer.innerHTML = '';
    if (AppState.sizes.length === 0) {
        DOMElements.productSizesContainer.innerHTML = `<p class="text-sm text-gray-500 col-span-3">No hay tallas definidas en la base de datos.</p>`;
        return;
    }
    AppState.sizes.forEach(size => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `size-${size.id}`;
        checkbox.name = 'product-size-id';
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
// 7. LÓGICA DEL DASHBOARD (KPIs)
// ----------------------------------------------------

async function loadDashboardData() {
    const orders = await getOrders();
    const products = await getProducts(); 

    const totalSales = orders
        .filter(o => o.status === 'entregado')
        .reduce((sum, o) => sum + o.total, 0);
    DOMElements.kpiTotalSales.textContent = `$${totalSales.toFixed(2)}`;

    const pendingOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'procesando').length;
    DOMElements.kpiPendingOrders.textContent = pendingOrders;

    const criticalStock = products.filter(p => p.stock > 0 && p.stock <= STOCK_THRESHOLD).length;
    DOMElements.kpiCriticalStock.textContent = criticalStock;

    DOMElements.recentActivityList.innerHTML = '';
    const recentOrders = orders.slice(0, 5); 
    if (recentOrders.length === 0) {
        DOMElements.recentActivityList.innerHTML = `<p class="text-sm text-gray-500">No hay actividad reciente.</p>`;
    } else {
        recentOrders.forEach(order => {
            const { bg, text } = getStatusColor(order.status);
            DOMElements.recentActivityList.innerHTML += `
                <li class="border-b border-gray-800 pb-3">
                    <p class="font-semibold flex justify-between">
                        <span>Pedido #${order.id}</span>
                        <span class="${bg} ${text} text-xs font-bold py-1 px-2 rounded-full uppercase">${order.status}</span>
                    </p>
                    <p class="text-sm text-gray-400 flex justify-between">
                        <span>${order.customerName}</span>
                        <span class="text-yellow-400 font-bold">$${order.total.toFixed(2)}</span>
                    </p>
                </li>
            `;
        });
    }
    
    DOMElements.kpiConversion.textContent = "3.4%"; 
}


// ----------------------------------------------------
// 8. INICIALIZACIÓN
// ----------------------------------------------------

async function init() { 
    
    await loadReferenceData();
    
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Eventos de Login/Logout
    DOMElements.loginForm.addEventListener('submit', handleLogin);
    DOMElements.logoutBtn.addEventListener('click', handleLogout);
    if (DOMElements.togglePasswordBtn) {
        DOMElements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }

    // Eventos de Navegación
    if (DOMElements.viewButtons) {
        DOMElements.viewButtons.forEach(btn => {
            btn.addEventListener('click', handleViewButtonClick);
        });
    }
    
    if (DOMElements.toggleSidebarBtn) {
        DOMElements.toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Eventos de CRUD Productos
    DOMElements.productForm.addEventListener('submit', handleProductFormSubmit);
    DOMElements.productList.addEventListener('click', handleProductListClick);
    DOMElements.cancelBtn.addEventListener('click', resetForm);
    if (DOMElements.productSearchInput) {
        DOMElements.productSearchInput.addEventListener('input', handleProductSearch);
    }

    // Eventos de CRUD Pedidos
    if (DOMElements.orderForm) {
        DOMElements.orderForm.addEventListener('submit', handleOrderFormSubmit);
    }
    if (DOMElements.orderList) {
        DOMElements.orderList.addEventListener('click', handleOrderListClick);
    }
    if (DOMElements.cancelOrderBtn) {
        DOMElements.cancelOrderBtn.addEventListener('click', resetOrderForm);
    }
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

document.addEventListener('DOMContentLoaded', init);