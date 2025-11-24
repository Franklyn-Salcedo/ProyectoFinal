// ==========================================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ==========================================================
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";
const AppState = {
    editingProductId: null,
    editingOrderId: null,
    editingOrderCreatedAt: null, // Para preservar la fecha al editar
    currentView: 'dashboard-view',
    categories: [],
    sizes: [],
    products: [], // Caché de productos para el formulario de pedidos
};

const STOCK_THRESHOLD = 5; 
let toastTimer; 
let monthlySalesChart = null; // Instancia del gráfico

// --- DOMElements ---
const DOMElements = {
    // Layout
    loginSection: document.getElementById('login-section'),
    adminDashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('login-form'),
    productSearchInput: document.getElementById('product-search-input'),
    
    // Dashboard KPIs
    kpiTotalSales: document.getElementById('kpi-total-sales'),
    kpiTotalSalesSub: document.getElementById('kpi-total-sales-sub'), // ¡NUEVO!
    kpiPendingOrders: document.getElementById('kpi-pending-orders'),
    kpiCriticalStock: document.getElementById('kpi-critical-stock'),
    kpiCancellationRate: document.getElementById('kpi-cancellation-rate'), // ¡NUEVO! (reemplaza conversion)
    kpiCancellationRateSub: document.getElementById('kpi-cancellation-rate-sub'), // ¡NUEVO!
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

    // IA Predictivo (Dashboard)
    iaPredictionBtn: document.getElementById('ia-predicion'),
    iaProducto: document.getElementById('ia-producto'),
    iaText: document.getElementById('ia-text'),
    iaMonto: document.getElementById('ia-monto'),
    idVariacion: document.getElementById('ia-variacion'),

    // ELEMENTOS DE REPORTES
    kpiTotalOrdersMonth: document.getElementById('kpi-total-orders-month'), // ¡NUEVO! (reemplaza new-customers)
    kpiTotalOrdersMonthSub: document.getElementById('kpi-total-orders-month-sub'), // ¡NUEVO!
    kpiAvgTicket: document.getElementById('kpi-avg-ticket'),
    kpiReturnRate: document.getElementById('kpi-return-rate'),
    kpiReturnRateSub: document.getElementById('kpi-return-rate-sub'), 
    topProductsList: document.getElementById('top-products-list'),
    monthlySalesChartCanvas: document.getElementById('monthly-sales-chart'), 

    // IA Predictivo (Reportes - Categorías)
    iaCat1: {
        icon: document.getElementById('ia-cat-1-icon'),
        name: document.getElementById('ia-cat-1-name'),
        status: document.getElementById('ia-cat-1-status'),
    },
    iaCat2: {
        icon: document.getElementById('ia-cat-2-icon'),
        name: document.getElementById('ia-cat-2-name'),
        status: document.getElementById('ia-cat-2-status'),
    },
    iaCat3: {
        icon: document.getElementById('ia-cat-3-icon'),
        name: document.getElementById('ia-cat-3-name'),
        status: document.getElementById('ia-cat-3-status'),
    },
    iaCat4: {
        icon: document.getElementById('ia-cat-4-icon'),
        name: document.getElementById('ia-cat-4-name'),
        status: document.getElementById('ia-cat-4-status'),
    },
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
        toastPopup.classList.add('opacity-0', 'translate-x-full'); 
        setTimeout(() => {
            toastPopup.classList.add('invisible');
        }, 300); // Coincide con duration-300
    }, 3000);
}

function showConfirmationModal(message, onConfirm) {
    const { confirmationModal, confirmationMessage, confirmDeleteBtn, confirmCancelBtn } = DOMElements;
    if (!confirmationModal) {
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    confirmationMessage.textContent = message;
    confirmationModal.classList.remove('hidden');
    
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
    DOMElements.confirmDeleteBtn = newConfirmBtn; 

    const newCancelBtn = confirmCancelBtn.cloneNode(true);
    confirmCancelBtn.parentNode.replaceChild(newCancelBtn, confirmCancelBtn);
    DOMElements.confirmCancelBtn = newCancelBtn; 

    DOMElements.confirmDeleteBtn.addEventListener('click', () => {
        onConfirm();
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
    
    // Cargar datos para la vista seleccionada
    // (Ahora las funciones de carga de datos obtienen los datos ellas mismas)
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
    if (viewId === 'reports-view') {
        await loadReportsData();
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
        AppState.products = products; 
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
                <h3 class="font-bold text-lg truncate"> ${product.name}</h3>
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
        case 'devuelto': return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500', label: 'Devuelto' };
        case 'cancelado': return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500', label: 'Cancelado' };
        default: return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500', label: 'Desconocido' };
    }
}

async function calculateOrderTotal() {
    const itemRows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    const products = AppState.products; 
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
    orders.sort((a, b) => b.id - a.id); 
orders.forEach(order => {
    const { bg, text, border, label } = getStatusColor(order.status);
    const itemDetails = order.items && order.items.length > 0
        ? order.items.map(item => `${item.quantity}x ${item.name} (${item.size || 'N/A'})`).join(' | ')
        : 'Sin Artículos Registrados';
    
    let orderDate = '';
    if (order.createdAt) {
        try {
            orderDate = new Date(order.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        } catch (e) { /* ignorar fecha inválida */ }
    }

    const orderCard = document.createElement('div');
    orderCard.className = `bg-card-bg p-4 rounded-lg shadow flex justify-between items-start transition hover:bg-gray-800 border-l-4 ${border}`;
    orderCard.innerHTML = `
        <div>
            <p class="font-bold text-lg">Pedido #${order.id}</p>
            <p class="text-sm text-gray-400 mb-1">Cliente: ${order.customerName}</p>
            <p class="text-xs text-gray-500 truncate w-64">Artículos: ${itemDetails}</p>
            <p class="text-xs text-gray-400 mt-2">${orderDate}</p> 
        </div>
        <div class="text-right flex flex-col items-end">
            <span class="${bg} ${text} text-xs font-bold py-1 px-3 rounded-full uppercase">${label}</span>
            <p class="text-xl font-extrabold mt-1 text-yellow-400">$${order.total.toFixed(2)}</p>
            <div class="flex gap-2 mt-2">
                <button data-id="${order.id}" class="edit-order-btn text-blue-400 hover:text-blue-500 text-sm">Editar</button>
                <button data-id="${order.id}" class="delete-order-btn text-red-400 hover:text-red-500 text-sm">Eliminar</button>

                <!-- 📄 NUEVO BOTÓN FACTURA -->
                <button class="invoice-btn text-green-400 hover:text-green-500 text-sm" data-id="${order.id}">
                    Factura
                </button>
            </div>
        </div>
    `;

    DOMElements.orderList.appendChild(orderCard);
});

// Evento para abrir factura PDF
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("invoice-btn")) {
        const id = e.target.getAttribute("data-id");
        window.open(`http://localhost:4000/api/orders/invoice/${id}`, "_blank");
    }
});

}

function createOrderItemRow(productItem = {}) {
    const products = AppState.products; 
    const row = document.createElement('div');
    row.className = 'order-item-row flex gap-3 items-center bg-gray-700 p-2 rounded-lg'; 
    
    const productSelect = document.createElement('select');
    productSelect.className = 'flex-1 bg-gray-600 p-2 rounded text-sm';
    productSelect.name = 'product-id';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona Producto';
    productSelect.appendChild(defaultOption);
    
    const availableProducts = products.filter(p => p.stock > 0 || (productItem.productId && p.id == productItem.productId));
    availableProducts.forEach(p => {
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
    AppState.editingOrderCreatedAt = null; // Limpiar fecha guardada
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
    
    AppState.editingOrderCreatedAt = order.createdAt || null;

    if (order.items && order.items.length > 0) {
        for (const item of order.items) {
            const product = AppState.products.find(p => p.name === item.name);
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
    const products = AppState.products; 
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
                if (!AppState.editingOrderId && quantity > product.stock) {
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
        items: items,
        createdAt: AppState.editingOrderId ? AppState.editingOrderCreatedAt : new Date().toISOString()
    };
    
    const savedOrder = await saveOrder(orderData); 
    
    if (savedOrder) {
        const message = AppState.editingOrderId ? 'Pedido actualizado' : 'Pedido añadido';
        showPopup(`${message} con éxito: #${savedOrder.id}`, 'success');
        
        // ¡Importante! Recargar la lista de productos para ver el stock actualizado
        await getProducts(); 
        
        // Si estamos en la vista de productos, actualizarla
        if (AppState.currentView === 'products-view') {
            await renderProductList();
        }
        
        resetOrderForm(); 
        await renderOrderList(); 
    }
}

async function handleOrderListClick(e) {
    const target = e.target;
    const deleteButton = target.closest('.delete-order-btn');
    const editButton = target.closest('.edit-order-btn');

    if (editButton) {
        const orderId = parseInt(editButton.dataset.id, 10);
        await fillFormForEditOrder(orderId);
    }
    
    if (deleteButton) {
        const orderId = parseInt(deleteButton.dataset.id, 10);
        showConfirmationModal(
            `¿Estás seguro de que quieres eliminar este pedido #${orderId}? Esto repondrá el stock.`, 
            async () => {
                const result = await deleteOrder(orderId);
                if (result) {
                    showPopup('Pedido eliminado y stock repuesto.', 'success');
                    await renderOrderList();
                    resetOrderForm();
                    // Actualizar el stock en la vista de productos si estamos ahí
                    if (AppState.currentView === 'products-view') {
                        await renderProductList();
                    }
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
    getPredicion(); // Carga la predicción del Dashboard
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
        DOMElements.productSizesContainer.innerHTML = `<p class="text-sm text-gray-500 col-span-3">No hay tallas definidas.</p>`;
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
// 7. LÓGICA DEL DASHBOARD (KPIs) - ¡ACTUALIZADA!
// ----------------------------------------------------


function renderRecentActivity(orders) {
    const container = DOMElements.recentActivityList;
    container.innerHTML = "";

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">No hay actividad reciente.</p>';
        return;
    }

    orders.slice(0, 6).forEach(order => {
        const { bg, text } = getStatusColor(order.status);
        const icon = order.status === 'entregado'
            ? '<i class="fas fa-check-circle text-green-400 mr-2"></i>'
            : order.status === 'cancelado'
                ? '<i class="fas fa-times-circle text-red-400 mr-2"></i>'
                : '<i class="fas fa-hourglass-half text-yellow-400 mr-2"></i>';

        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';

        container.innerHTML += `
            <li class="relative pl-6 border-l-4 border-yellow-400 hover:bg-gray-800 transition-all rounded-lg py-3 px-2">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        ${icon}
                        <p class="font-semibold text-white">Pedido #${order.id}</p>
                    </div>
                    <span class="text-xs text-gray-400">${date}</span>
                </div>
                <p class="text-sm text-gray-400 mt-1 flex justify-between">
                    <span>${order.customerName}</span>
                    <span class="text-yellow-400 font-bold">$${order.total.toFixed(2)}</span>
                </p>
                <span class="${bg} ${text} text-xs font-bold py-1 px-2 rounded-full uppercase mt-2 inline-block">${order.status}</span>
            </li>`;
    });
}

async function loadDashboardData() {
    // Obtener todos los pedidos y productos
    const orders = await getOrders();
    const products = await getProducts(); 
    
    // --- 1. Ventas Totales y Comparación (¡NUEVO!) ---
    const now = new Date();
    const date30DaysAgo = new Date(new Date().setDate(now.getDate() - 30));
    const date60DaysAgo = new Date(new Date().setDate(now.getDate() - 60));

    // Ventas de los últimos 30 días
    const recentSales = orders
        .filter(o => o.status === 'entregado' && new Date(o.createdAt) >= date30DaysAgo)
        .reduce((sum, o) => sum + o.total, 0);

    // Ventas de los 30 días anteriores (días 30-60)
    const previousSales = orders
        .filter(o => o.status === 'entregado' && new Date(o.createdAt) < date30DaysAgo && new Date(o.createdAt) >= date60DaysAgo)
        .reduce((sum, o) => sum + o.total, 0);

    DOMElements.kpiTotalSales.textContent = `$${recentSales.toFixed(2)}`;

    // Calcular porcentaje de cambio
    if (previousSales > 0) {
        const percentChange = ((recentSales - previousSales) / previousSales) * 100;
        if (percentChange > 0) {
            DOMElements.kpiTotalSalesSub.textContent = `▲ ${percentChange.toFixed(0)}% vs. mes anterior`;
            DOMElements.kpiTotalSalesSub.className = 'text-sm text-green-400 mt-1';
        } else {
            DOMElements.kpiTotalSalesSub.textContent = `▼ ${percentChange.toFixed(0)}% vs. mes anterior`;
            DOMElements.kpiTotalSalesSub.className = 'text-sm text-red-400 mt-1';
        }
    } else if (recentSales > 0) {
        DOMElements.kpiTotalSalesSub.textContent = `▲ vs. mes anterior`;
        DOMElements.kpiTotalSalesSub.className = 'text-sm text-green-400 mt-1';
    } else {
        DOMElements.kpiTotalSalesSub.textContent = `Sin ventas vs. mes anterior`;
        DOMElements.kpiTotalSalesSub.className = 'text-sm text-gray-400 mt-1';
    }

    // --- 2. Pedidos Pendientes ---
    const pendingOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'procesando').length;
    DOMElements.kpiPendingOrders.textContent = pendingOrders;

    // --- 3. Stock Crítico ---
    const criticalStock = products.filter(p => p.stock > 0 && p.stock <= STOCK_THRESHOLD).length;
    DOMElements.kpiCriticalStock.textContent = criticalStock;

    // --- 4. Tasa de Cancelación (¡NUEVO!) ---
    const cancelledOrders = orders.filter(o => o.status === 'cancelado').length;
    const finalizedOrders = orders.filter(o => ['entregado', 'devuelto', 'cancelado'].includes(o.status)).length;
    
    let cancellationRate = 0;
    if (finalizedOrders > 0) {
        cancellationRate = (cancelledOrders / finalizedOrders) * 100;
    }
    DOMElements.kpiCancellationRate.textContent = `${cancellationRate.toFixed(1)}%`;
    const plural = finalizedOrders === 1 ? 'pedido' : 'pedidos';
    DOMElements.kpiCancellationRateSub.textContent = `${cancelledOrders} de ${finalizedOrders} ${plural} finalizados`;

    // --- 5. Actividad Reciente ---
    DOMElements.recentActivityList.innerHTML = '';
    const recentOrders = orders.slice(0, 5); // Ya vienen ordenados por ID desc. desde la API

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
}

// --- FUNCIÓN DE REPORTES (¡ACTUALIZADA!) ---
async function loadReportsData() {
    const orders = await getOrders();
    const now = new Date();
    const date30DaysAgo = new Date(new Date().setDate(now.getDate() - 30));

    // 1. Total Pedidos (Mes) (¡NUEVO!)
    const totalOrdersMonth = orders.filter(o => new Date(o.createdAt) >= date30DaysAgo).length;
    DOMElements.kpiTotalOrdersMonth.textContent = totalOrdersMonth;
    const pluralOrders = totalOrdersMonth === 1 ? 'pedido' : 'pedidos';
    DOMElements.kpiTotalOrdersMonthSub.textContent = `${pluralOrders} en los últimos 30 días`;


    // 2. Calcular Ticket Promedio
    const deliveredOrders = orders.filter(o => o.status === 'entregado');
    let avgTicket = 0;
    if (deliveredOrders.length > 0) {
        const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
        avgTicket = totalRevenue / deliveredOrders.length;
    }
    DOMElements.kpiAvgTicket.textContent = `$${avgTicket.toFixed(2)}`;

    // 3. Calcular Tasa de Devolución
    const returnedOrdersCount = orders.filter(o => o.status === 'devuelto').length;
    const finalizedOrdersCount = deliveredOrders.length + returnedOrdersCount; 
    let returnRate = 0;
    if (finalizedOrdersCount > 0) {
        returnRate = (returnedOrdersCount / finalizedOrdersCount) * 100;
    }
    DOMElements.kpiReturnRate.textContent = `${returnRate.toFixed(1)}%`;
    
    const label = returnedOrdersCount === 1 ? 'pedido devuelto' : 'pedidos devueltos';
    const label2 = finalizedOrdersCount === 1 ? 'pedido finalizado' : 'pedidos finalizados';
    DOMElements.kpiReturnRateSub.textContent = `${returnedOrdersCount} ${label} de ${finalizedOrdersCount} ${label2}`;

    // 4. Calcular Top Productos
    const productSales = {}; 
    deliveredOrders.forEach(order => { 
        if (order.items) {
            order.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
            });
        }
    });
    
    const sortedTopProducts = Object.entries(productSales)
        .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
        .slice(0, 3); 

    // 5. Renderizar Top Productos
    DOMElements.topProductsList.innerHTML = '';
    if (sortedTopProducts.length === 0) {
        DOMElements.topProductsList.innerHTML = `<li class="p-3 bg-gray-800 rounded-lg text-gray-500 text-center">No hay datos de ventas.</li>`;
    } else {
        sortedTopProducts.forEach(([name, quantity], index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center p-3 bg-gray-800 rounded-lg';
            li.innerHTML = `
                <span class="font-semibold">${index + 1}. ${name}</span>
                <span class="font-bold text-lg">${quantity} <span class="text-sm text-gray-400">unid.</span></span>
            `;
            DOMElements.topProductsList.appendChild(li);
        });
    }

    // 6. Lógica del Gráfico de Ventas Mensuales
    if (monthlySalesChart) {
        monthlySalesChart.destroy();
        monthlySalesChart = null;
    }

    const salesByMonth = {};
    const monthLabels = [];

    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthLabels.push(d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
        salesByMonth[monthYear] = 0;
    }

    deliveredOrders.forEach(order => {
        if (!order.createdAt) return; 
        try {
            const orderDate = new Date(order.createdAt);
            const monthYear = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            if (salesByMonth.hasOwnProperty(monthYear)) {
                salesByMonth[monthYear] += order.total;
            }
        } catch (e) { /* Ignorar fecha inválida */ }
    });

    const salesData = Object.values(salesByMonth);
    const ctx = DOMElements.monthlySalesChartCanvas.getContext('2d');
    if (!ctx) return;

    monthlySalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Ventas ($)',
                data: salesData,
                backgroundColor: 'rgba(255, 255, 0, 0.6)', 
                borderColor: 'rgba(255, 255, 0, 1)', 
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#9CA3AF' },
                    grid: { color: '#374151' }
                },
                x: {
                    ticks: { color: '#9CA3AF' },
                    // *** ESTA ES LA LÍNEA CORREGIDA ***
                    grid: { color: '#374151' } 
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#F3F4F6' }
                }
            }
        }
    });

    // 7. Lógica de IA (Categorías)
    try {
        const response = await fetch('/api/ai/category-demand');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error de red al cargar predicción');
        }
        const categoryDemand = await response.json();
        renderCategoryDemand(categoryDemand); 
    } catch (error) {
        console.error("Error al cargar predicción de demanda IA:", error);
        showPopup(`Error IA: ${error.message}`, 'error');
        renderCategoryDemand([]); 
    }
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

    // 🧠 Conectar botón IA real con la función del análisis de Gemini
    const iaBtn = document.getElementById("ia-predicion");
    if (iaBtn) {
        iaBtn.addEventListener("click", loadRealAIPrediction);
    }

    // Comprobar la sesión al cargar la página
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

document.addEventListener('DOMContentLoaded', init);

// ----------------------------------------------------
// 9. LÓGICA DE IA (Dashboard y Reportes)
// ----------------------------------------------------

// --- IA Dashboard (Ventas Totales) ---
document.getElementById('ia-predicion').addEventListener('click', loadAIPredictions);

async function loadAIPredictions() {
  try {
    const res = await fetch('/api/ai/predict');
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error de red');
    }
    const data = await res.json(); 
    localStorage.setItem('aiPrediction', JSON.stringify(data));
    getPredicion();
  } catch (error) {
    console.error("Error al cargar predicción IA:", error);
    showPopup(`Error IA: ${error.message}`, "error");
  }
}
async function getPredicion() {
    const products = await getProducts();
    const orders = await getOrders();

    if (!products || products.length === 0) {
        DOMElements.iaProducto.textContent = "--";
        DOMElements.iaText.textContent = "No hay datos suficientes para generar una predicción.";
        DOMElements.iaMonto.textContent = "$0";
        DOMElements.idVariacion.textContent = "";
        document.getElementById('ia-predicted-products-container').innerHTML = "";
        return;
    }

    // Contar unidades vendidas por producto
    const salesCount = {};
    for (const order of orders) {
        if (order.status === 'entregado' && Array.isArray(order.items)) {
            for (const item of order.items) {
                salesCount[item.productId] = (salesCount[item.productId] || 0) + item.quantity;
            }
        }
    }

    // Identificar el producto más vendido
    let topProductId = null;
    let maxSales = 0;
    for (const [id, count] of Object.entries(salesCount)) {
        if (count > maxSales) {
            maxSales = count;
            topProductId = parseInt(id, 10);
        }
    }

    const topProduct = products.find(p => p.id === topProductId) || products[0];
    const projectedSales = (topProduct.price * maxSales * 1.2).toFixed(2);
    const variation = "+20% de crecimiento estimado";

    

    // Actualizar textos principales
    DOMElements.iaProducto.textContent = topProduct.name;
    DOMElements.iaText.textContent = consejoIA;
    DOMElements.iaMonto.textContent = `$${projectedSales}`;
    DOMElements.idVariacion.textContent = variation;

    // Imagen o placeholder
    const imageUrl = topProduct.images && topProduct.images.length > 0 ? topProduct.images[0] : "https://via.placeholder.com/150?text=Sin+imagen";

    // 🎨 Bloque visual estético
   document.getElementById('ia-predicted-products-container').innerHTML = `
    <div class="bg-gray-800 border-2 border-yellow-400 rounded-2xl shadow-md shadow-yellow-400/30 p-5 flex items-center gap-6 transition-transform transform hover:scale-[1.01]">
        <img src="${imageUrl}" alt="${topProduct.name}" class="w-36 h-36 object-cover rounded-xl">
        <div class="flex flex-col justify-center">
            <h3 class="text-2xl font-bold text-white mb-2">${topProduct.name}</h3>
            <p class="text-yellow-400 font-semibold text-lg mb-1">$${topProduct.price.toFixed(2)}</p>
            <p class="text-gray-300 text-sm">Unidades vendidas este mes: 
                <span class="font-bold text-white">${maxSales}</span>
            </p>
        </div>
    </div>
`;

  
}
// 🔮 Cargar análisis real de IA desde backend con Gemini
async function loadRealAIPrediction() {
    try {
        // Mostrar estado de carga en el panel IA
        document.getElementById("ia-monto").textContent = "Cargando...";
        document.getElementById("ia-variacion").textContent = "Analizando tendencia...";
        document.getElementById("ia-product-name").textContent = "Analizando producto...";
        document.getElementById("ia-product-price").textContent = "Precio: --";
        document.getElementById("ia-product-units").textContent = "Unidades vendidas este mes: --";
        document.getElementById("ia-text").textContent = "Analizando datos con IA...";

        // Petición al backend para obtener la predicción real de Gemini
        const response = await fetch("/api/ai/predict");
        if (!response.ok) throw new Error("Error en respuesta del servidor IA");
        const data = await response.json();

        if (!data.prediction) throw new Error("La IA no devolvió datos válidos");
        const { ventasProyectadas, variacionPorcentual, productoAltaDemanda, recomendacion } = data.prediction;

        // 🧮 Animación contador para ventas proyectadas
        const montoEl = document.getElementById("ia-monto");
        const targetValue = Number(ventasProyectadas);
        let currentValue = 0;
        const steps = 50;
        const stepValue = targetValue / steps;
        const interval = setInterval(() => {
            currentValue += stepValue;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(interval);
            }
            montoEl.textContent = `$${currentValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
        }, 20);

        // Mostrar variación
        document.getElementById("ia-variacion").textContent =
            `Variación estimada: ${variacionPorcentual > 0 ? "+" : ""}${variacionPorcentual}%`;

        // 🧠 Mostrar producto destacado
        const productName = productoAltaDemanda || "Sin datos";
        document.getElementById("ia-product-name").textContent = productName;

        // 📝 Mostrar recomendación / texto predictivo (con animación)
        const iaTextEl = document.getElementById("ia-text");
        const fullText = recomendacion || "Sin recomendación generada por la IA.";
        typeTextAnimation(iaTextEl, fullText);

        // Buscar producto en base de datos (imagen, precio, unidades)
        try {
            const res = await fetch(`/api/products/name/${encodeURIComponent(productName)}`);
            if (res.ok) {
                const product = await res.json();
                if (product) {
                    const imgEl = document.getElementById("ia-product-image");
                    const priceEl = document.getElementById("ia-product-price");
                    const unitsEl = document.getElementById("ia-product-units");

                    imgEl.src = product.images?.[0] || "/imagenes/no-image.png";
                    imgEl.classList.remove("hidden");
                    priceEl.textContent = `Precio: $${Number(product.price).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
                    unitsEl.textContent = `Unidades vendidas este mes: ${product.unitsSold || 0}`;

                    // ✨ Efecto visual en el contenedor
                    const container = document.getElementById("ia-product-highlight");
                    if (container) {
                        container.classList.remove("glow-animate");
                        void container.offsetWidth;
                        container.classList.add("glow-animate");
                    }
                }
            }
        } catch (err) {
            console.warn("⚠️ No se pudo cargar el producto de alta demanda:", err.message);
        }

    } catch (error) {
        console.error("❌ Error cargando análisis IA real:", error);
        document.getElementById("ia-monto").textContent = "--";
        document.getElementById("ia-variacion").textContent = "--";
        document.getElementById("ia-product-name").textContent = "Error de conexión con la IA";
        document.getElementById("ia-text").textContent = "No se pudo obtener la recomendación.";
    }
}

// ✍️ Función para animar texto tipo “máquina de escribir”
function typeTextAnimation(element, text) {
    element.textContent = "";
    let index = 0;
    const speed = 35; // milisegundos entre letras
    const interval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
        }
    }, speed);
}

// ⚡ Ejecutar automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    loadRealAIPrediction();
});

// 🔘 Permitir al usuario pedir una nueva predicción manualmente
const refreshButton = document.getElementById("ia-refresh-btn");
if (refreshButton) {
    refreshButton.addEventListener("click", () => {
        refreshButton.disabled = true;
        refreshButton.textContent = "Generando...";
        loadRealAIPrediction().then(() => {
            setTimeout(() => {
                refreshButton.disabled = false;
                refreshButton.textContent = "🔁 Nueva Predicción";
            }, 1000);
        });
    });
}





// --- IA Reportes (Demanda por Categoría) ---

/**
 * Renderiza los datos de demanda de categoría en la UI.
 */
function renderCategoryDemand(demandData) {
    const domMap = [DOMElements.iaCat1, DOMElements.iaCat2, DOMElements.iaCat3, DOMElements.iaCat4];

    // Llenar con los datos recibidos
    demandData.forEach((item, index) => {
        if (domMap[index]) {
            const { name, demand, icon } = item;
            const { text, textClass, iconClass } = getDemandStyling(demand);
            
            domMap[index].name.textContent = name;
            domMap[index].status.textContent = text;
            domMap[index].status.className = `text-sm font-bold ${textClass}`;
            domMap[index].icon.className = `fas ${icon} text-4xl mb-2 ${iconClass}`;
        }
    });

    // Limpiar los slots restantes si la API devuelve menos de 4
    for (let i = demandData.length; i < domMap.length; i++) {
        domMap[i].name.textContent = 'N/A';
        domMap[i].status.textContent = '...';
        domMap[i].status.className = 'text-sm font-bold text-gray-500';
        // *** ESTA ES LA LÍNEA CORREGIDA ***
        domMap[i].icon.className = 'fas fa-box-open text-4xl mb-2 text-gray-600'; 
    }
}

/**
 * Ayudante para obtener las clases CSS correctas según el nivel de demanda.
 */
function getDemandStyling(demand) {
    switch (demand) {
        case 'alta':
            return {
                text: '▲ Alta Demanda',
                textClass: 'text-green-400',
                iconClass: 'text-indigo-400', // Color para íconos de alta demanda
            };
        case 'estable':
            return {
                text: '▬ Estable',
                textClass: 'text-gray-400',
                iconClass: 'text-gray-500', // Color para íconos de demanda estable
            };
        case 'baja':
            return {
                text: '▼ Baja Demanda',
                textClass: 'text-red-400',
                iconClass: 'text-red-500', // Color para íconos de baja demanda
            };
        default:
            return {
                text: '...',
                textClass: 'text-gray-500',
                iconClass: 'text-gray-600',
            };
    }
}
