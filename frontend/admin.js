/*
CONFIGURACIÓN Y ESTADO GLOBAL
*/
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";
const STOCK_THRESHOLD = 5; 

const AppState = {
    editingProductId: null,
    editingOrderId: null,
    editingOrderCreatedAt: null, 
    currentView: 'dashboard-view',
    categories: [],
    sizes: [],
    products: [], 
};

let toastTimer; 
let monthlySalesChart = null; 

/*
MAPEO DE ELEMENTOS DOM
*/
const DOMElements = {
    // Layout y Login
    loginSection: document.getElementById('login-section'),
    adminDashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    togglePasswordBtn: document.getElementById('toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),
    logoutBtn: document.getElementById('logout-btn'),

    // Navegación
    adminSidebar: document.getElementById('admin-sidebar'),
    mainContent: document.getElementById('main-content'),
    toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
    toggleSidebarIcon: document.getElementById('toggle-sidebar-icon'),
    sidebarTexts: document.querySelectorAll('.sidebar-text'),
    viewButtons: document.querySelectorAll('.view-btn'),
    allViews: document.querySelectorAll('.view-content'),

    // Dashboard
    currentDateElement: document.getElementById('current-date'),
    currentTimeElement: document.getElementById('current-time'),
    kpiTotalSales: document.getElementById('kpi-total-sales'),
    kpiTotalSalesSub: document.getElementById('kpi-total-sales-sub'),
    kpiPendingOrders: document.getElementById('kpi-pending-orders'),
    kpiCriticalStock: document.getElementById('kpi-critical-stock'),
    kpiCancellationRate: document.getElementById('kpi-cancellation-rate'),
    kpiCancellationRateSub: document.getElementById('kpi-cancellation-rate-sub'),
    recentActivityList: document.getElementById('recent-activity-list'),

    // IA Predictiva
    iaPredictionBtn: document.getElementById('ia-predicion'),
    iaProductImage: document.getElementById('ia-product-image'),
    iaPlaceholder: document.getElementById('ia-placeholder'),
    iaProductName: document.getElementById('ia-product-name'),
    iaProductPrice: document.getElementById('ia-product-price'),
    iaProductUnits: document.getElementById('ia-product-units'),
    iaText: document.getElementById('ia-text'),
    iaMonto: document.getElementById('ia-monto'),
    iaVariacion: document.getElementById('ia-variacion'),
    iaContainer: document.getElementById('ia-product-highlight'),

    // Reportes
    kpiTotalOrdersMonth: document.getElementById('kpi-total-orders-month'),
    kpiTotalOrdersMonthSub: document.getElementById('kpi-total-orders-month-sub'),
    kpiAvgTicket: document.getElementById('kpi-avg-ticket'),
    kpiReturnRate: document.getElementById('kpi-return-rate'),
    kpiReturnRateSub: document.getElementById('kpi-return-rate-sub'), 
    topProductsList: document.getElementById('top-products-list'),
    monthlySalesChartCanvas: document.getElementById('monthly-sales-chart'), 
    
    // IA Reportes (Categorías)
    iaCats: [
        { icon: document.getElementById('ia-cat-1-icon'), name: document.getElementById('ia-cat-1-name'), status: document.getElementById('ia-cat-1-status') },
        { icon: document.getElementById('ia-cat-2-icon'), name: document.getElementById('ia-cat-2-name'), status: document.getElementById('ia-cat-2-status') },
        { icon: document.getElementById('ia-cat-3-icon'), name: document.getElementById('ia-cat-3-name'), status: document.getElementById('ia-cat-3-status') },
        { icon: document.getElementById('ia-cat-4-icon'), name: document.getElementById('ia-cat-4-name'), status: document.getElementById('ia-cat-4-status') }
    ],

    // Gestión de Productos
    productList: document.getElementById('product-list'),
    productForm: document.getElementById('product-form'),
    formTitle: document.getElementById('form-title'),
    productSearchInput: document.getElementById('product-search-input'),
    productIdInput: document.getElementById('product-id'),
    productNameInput: document.getElementById('product-name'),
    productDescriptionInput: document.getElementById('product-description'),
    productCategoryInput: document.getElementById('product-category-select'),
    productPriceInput: document.getElementById('product-price'),
    productOfferPriceInput: document.getElementById('product-offer-price'), 
    productStockInput: document.getElementById('product-stock'),
    productMinStockInput: document.getElementById('product-min-stock'), 
    productSizesContainer: document.getElementById('product-sizes-container'),
    productImagesInput: document.getElementById('product-images'),
    saveBtn: document.getElementById('save-btn'),
    cancelBtn: document.getElementById('cancel-btn'),

    // Gestión de Pedidos
    orderList: document.getElementById('order-list'),
    orderSearchTracking: document.getElementById('order-search-tracking'),
    orderFilterStatus: document.getElementById('order-filter-status'),
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

    // Modales
    toastPopup: document.getElementById('toast-popup'),
    toastIcon: document.getElementById('toast-icon'),
    toastMessage: document.getElementById('toast-message'),
    confirmationModal: document.getElementById('confirmation-modal'),
    confirmationMessage: document.getElementById('confirmation-message'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
};

/*
UTILIDADES Y UI
*/

function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let formattedDate = now.toLocaleDateString('es-ES', dateOptions);
    formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const formattedTime = now.toLocaleTimeString('es-ES', timeOptions);

    if (DOMElements.currentDateElement) DOMElements.currentDateElement.textContent = formattedDate;
    if (DOMElements.currentTimeElement) DOMElements.currentTimeElement.textContent = formattedTime;
}

function showPopup(message, type = 'success') {
    const { toastPopup, toastIcon, toastMessage } = DOMElements;
    if (!toastPopup) return alert(message);

    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    
    toastPopup.className = `fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white max-w-sm z-[100] transition-all duration-300 ease-in-out transform translate-x-0 opacity-100`;
    
    if (type === 'error') {
        toastPopup.classList.add('bg-red-600');
        toastIcon.className = 'fas fa-exclamation-triangle mr-3 text-2xl';
    } else if (type === 'info') {
        toastPopup.classList.add('bg-blue-600');
        toastIcon.className = 'fas fa-info-circle mr-3 text-2xl';
    } else {
        toastPopup.classList.add('bg-green-600');
        toastIcon.className = 'fas fa-check-circle mr-3 text-2xl';
    }

    toastTimer = setTimeout(() => {
        toastPopup.classList.add('opacity-0', 'translate-x-full'); 
        setTimeout(() => toastPopup.classList.add('invisible'), 300);
    }, 3000);
}

function showConfirmationModal(message, onConfirm) {
    const { confirmationModal, confirmationMessage, confirmDeleteBtn, confirmCancelBtn } = DOMElements;
    if (!confirmationModal) return confirm(message) && onConfirm();

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
    DOMElements.confirmCancelBtn.addEventListener('click', () => confirmationModal.classList.add('hidden'));
}

/*
NAVEGACIÓN Y LOGIN
*/

function toggleSidebar() {
    const { adminSidebar, mainContent, toggleSidebarIcon, sidebarTexts, viewButtons } = DOMElements;
    
    // Verificamos si actualmente está colapsado (usando la clase w-20 que es 5rem/80px)
    const isCollapsed = adminSidebar.classList.contains('w-20');
    
    // 1. Cambiar ancho del Sidebar
    adminSidebar.classList.toggle('w-64'); // Quita/Pone ancho grande
    adminSidebar.classList.toggle('w-20'); // Pone/Quita ancho pequeño
    
    // 2. Ajustar margen del contenido principal
    mainContent.classList.toggle('ml-64');
    mainContent.classList.toggle('ml-20');
    
    // 3. Rotar la flecha
    toggleSidebarIcon.classList.toggle('fa-chevron-left', !isCollapsed);
    toggleSidebarIcon.classList.toggle('fa-chevron-right', isCollapsed);
    
    // 4. Ocultar/Mostrar los textos de los botones
    sidebarTexts.forEach(el => el.classList.toggle('hidden'));
    
    // 5. Centrar los iconos cuando está colapsado (para que se vean bien)
    viewButtons.forEach(btn => btn.classList.toggle('justify-center', !isCollapsed));
    
    // Centrar también el botón de logout y el propio botón de colapsar
    if(DOMElements.logoutBtn) DOMElements.logoutBtn.classList.toggle('justify-center', !isCollapsed);
    if(DOMElements.toggleSidebarBtn) DOMElements.toggleSidebarBtn.classList.toggle('justify-center', !isCollapsed);
}

async function switchView(viewId) {
    AppState.currentView = viewId;
    
    DOMElements.allViews.forEach(v => v.style.display = 'none');
    const selectedView = document.getElementById(viewId);
    if (selectedView) selectedView.style.display = 'block';

    DOMElements.viewButtons.forEach(btn => {
        const isActive = btn.getAttribute('data-view') === viewId;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-yellow-400', isActive);
        btn.classList.toggle('text-black', isActive);
        btn.classList.toggle('text-white', !isActive);
    });
    
    // Cargar datos específicos de la vista
    switch (viewId) {
        case 'dashboard-view': 
            await loadDashboardData(); 
            // Opcional: Cargar la predicción grande también aquí si quieres refrescarla
            // loadRealAIPrediction(); 
            break;
            
        case 'products-view': 
            DOMElements.productSearchInput.value = '';
            await renderProductList();
            resetForm();
            break;
            
        case 'orders-view': 
            await renderOrderList();
            resetOrderForm();
            break;
            
        case 'reports-view': 
            await loadReportsData(); 
            // AQUI ESTÁ EL CAMBIO IMPORTANTE:
            console.log("🔄 Recargando predicciones de IA en Reportes...");
            loadCategoryPrediction(); // <--- Forzamos la carga al entrar aquí
            break;
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
    } else {
        DOMElements.loginError.textContent = 'Credenciales incorrectas.';
    }
}

function handleLogout() {
    sessionStorage.removeItem('isAdminAuthenticated');
    DOMElements.loginForm.reset();
    DOMElements.loginSection.style.display = 'flex';
    DOMElements.adminDashboard.style.display = 'none';
}

function showDashboard() {
    DOMElements.loginSection.style.display = 'none';
    DOMElements.adminDashboard.style.display = 'flex';
    switchView(AppState.currentView);
}

/*
API CLIENT
*/

async function apiRequest(url, method = 'GET', body = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(url, options);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Error ${res.status}`);
        }
        return method === 'DELETE' ? true : await res.json();
    } catch (error) {
        console.error(`API Error (${url}):`, error);
        showPopup(error.message, 'error');
        return null;
    }
}

const getProducts = async () => (await apiRequest(`/api/products?t=${Date.now()}`)) || [];
const saveProduct = (data) => apiRequest('/api/products', 'POST', data);
const deleteProduct = (id) => apiRequest(`/api/products/${id}`, 'DELETE');

const getOrders = async () => (await apiRequest('/api/orders')) || [];
const saveOrder = (data) => apiRequest('/api/orders', 'POST', data);
const deleteOrder = (id) => apiRequest(`/api/orders/${id}`, 'DELETE');

const getCategories = async () => (await apiRequest('/api/categories')) || [];
const getSizes = async () => (await apiRequest('/api/sizes')) || [];

/*
GESTIÓN DE PRODUCTOS (LÓGICA + EDICIÓN)
*/

async function renderProductList() {
    const searchTerm = DOMElements.productSearchInput.value.toLowerCase().trim();
    const products = await getProducts();
    AppState.products = products; 

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        getCategoryName(p.categoryId).toLowerCase().includes(searchTerm)
    );

    DOMElements.productList.innerHTML = '';
    
    if (filtered.length === 0) {
        DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-500">No se encontraron productos.</p>`;
        return;
    }

    filtered.forEach(p => {
        // --- 1. LÓGICA DE STOCK ---
        const umbral = p.minStock || 5; 
        let stockStatus = `<span class="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-bold border border-gray-600">Stock: ${p.stock}</span>`;

        if (p.stock === 0) {
            stockStatus = '<span class="bg-red-900/30 text-red-500 px-2 py-1 rounded text-xs font-bold border border-red-500/50"><i class="fas fa-times-circle"></i> Agotado</span>';
        } else if (p.stock <= umbral) {
            stockStatus = `<span class="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/50"><i class="fas fa-exclamation-triangle"></i> Bajo</span>`;
        }

        // --- 2. LÓGICA DE PRECIO Y OFERTA (NUEVO) ---
        // Convertimos a número para asegurar la comparación
        const price = parseFloat(p.price);
        const offerPrice = p.offerPrice ? parseFloat(p.offerPrice) : null;
        const hasOffer = offerPrice !== null && offerPrice > 0 && offerPrice < price;

        // Renderizado del bloque de precio
        const priceDisplay = hasOffer 
            ? `<div class="flex flex-col items-end">
                 <span class="text-xs text-gray-500 line-through decoration-red-500">$${price.toFixed(2)}</span>
                 <span class="text-xl font-bold text-green-400">$${offerPrice.toFixed(2)}</span>
               </div>`
            : `<span class="text-xl font-bold text-yellow-400">$${price.toFixed(2)}</span>`;

        // Badge de oferta sobre la imagen
        const offerBadge = hasOffer 
            ? `<span class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 shadow-md border border-red-400 animate-pulse">
                 <i class="fas fa-fire"></i> OFERTA
               </span>`
            : '';

        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition relative group border border-gray-700 hover:border-yellow-400/30';
        
        card.innerHTML = `
            <div class="relative">
                ${offerBadge}
                <img src="${p.images[0] || 'https://placehold.co/600x400?text=No+Image'}" class="w-full h-48 object-cover opacity-90 group-hover:opacity-100 transition-opacity">
            </div>
            
            <div class="p-4">
                <h3 class="font-bold text-lg truncate text-white">${p.name}</h3>
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">${getCategoryName(p.categoryId)}</p>
                
                <div class="flex justify-between items-center mb-4 border-t border-gray-700 pt-3">
                    ${stockStatus}
                    ${priceDisplay}
                </div>
                
                <div class="flex gap-2">
                    <button data-id="${p.id}" class="edit-btn flex-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white py-1.5 rounded text-sm font-bold transition">EDITAR</button>
                    <button data-id="${p.id}" class="delete-btn flex-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white py-1.5 rounded text-sm font-bold transition">ELIMINAR</button>
                </div>
            </div>`;
            
        DOMElements.productList.appendChild(card);
    });
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const sizeIds = Array.from(DOMElements.productSizesContainer.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
    
    const productData = {
        id: AppState.editingProductId,
        name: DOMElements.productNameInput.value,
        description: DOMElements.productDescriptionInput.value,
        categoryId: parseInt(DOMElements.productCategoryInput.value),
        
        // Precio Regular
        price: parseFloat(DOMElements.productPriceInput.value),
        
        // Si el input tiene valor, lo convertimos a número. Si no, enviamos null.
        offerPrice: DOMElements.productOfferPriceInput.value 
            ? parseFloat(DOMElements.productOfferPriceInput.value) 
            : null,
        // 

        // Stock
        stock: parseInt(DOMElements.productStockInput.value),
        
        // Min Stock (Alerta)
        minStock: parseInt(DOMElements.productMinStockInput.value) || 5, 

        sizeIds: sizeIds,
        images: DOMElements.productImagesInput.value.split('\n').map(u => u.trim()).filter(Boolean),
    };

    if (!productData.categoryId) return showPopup("Selecciona una categoría.", 'error');

    const result = await saveProduct(productData);
    if (result) {
        showPopup(AppState.editingProductId ? 'Producto actualizado.' : 'Producto creado.');
        resetForm();
        renderProductList();
    }
}

async function fillProductFormForEdit(productId) {
    const products = await getProducts();
    const product = products.find(p => p.id == productId);
    if (!product) return showPopup('Producto no encontrado', 'error');

    AppState.editingProductId = productId;
    
    // Carga de datos básicos
    DOMElements.productNameInput.value = product.name;
    DOMElements.productDescriptionInput.value = product.description;
    DOMElements.productCategoryInput.value = product.categoryId;
    DOMElements.productPriceInput.value = product.price;
    
    // --- AQUÍ ESTABA EL ERROR: FALTABA CARGAR LA OFERTA ---
    // Si tiene oferta la pone, si no, deja el campo vacío
    DOMElements.productOfferPriceInput.value = product.offerPrice || ''; 
    // -----------------------------------------------------

    DOMElements.productStockInput.value = product.stock;
    DOMElements.productMinStockInput.value = product.minStock || 5;

    DOMElements.productImagesInput.value = product.images.join('\n');

    // Marcar las tallas correspondientes
    const checkboxes = DOMElements.productSizesContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = product.sizeIds.includes(parseInt(cb.value));
    });

    // Cambiar textos de la interfaz para modo "Edición"
    DOMElements.formTitle.textContent = "Editando Producto";
    DOMElements.saveBtn.textContent = "Actualizar";
    DOMElements.cancelBtn.style.display = "inline-block";
    
    // Hacer scroll hacia el formulario
    document.getElementById('products-view').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    DOMElements.productForm.reset();
    AppState.editingProductId = null;
    DOMElements.formTitle.textContent = 'Añadir Nuevo Producto';
    DOMElements.saveBtn.textContent = 'Guardar Producto';
    DOMElements.cancelBtn.style.display = 'none';
    DOMElements.productSizesContainer.querySelectorAll('input').forEach(cb => cb.checked = false);
}

function getCategoryName(id) {
    const cat = AppState.categories.find(c => c.id === id);
    return cat ? cat.name : 'Desconocida';
}

/*
GESTIÓN DE PEDIDOS (LÓGICA + EDICIÓN CORREGIDA)
*/

function getStatusColor(status) {
    const colors = {
        pendiente: { bg: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-400' },
        procesando: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-500' },
        enviado: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500' },
        entregado: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500' },
        cancelado: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' },
        devuelto: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' },
    };
    return colors[status] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' };
}

async function renderOrderList() {
    // 1. Obtener pedidos (idealmente deberíamos guardar esto en AppState para no llamar a la API cada vez que escribimos)
    // Para simplificar, asumimos que getOrders es rápido o modificamos para usar una caché local si es necesario.
    let orders = await getOrders(); 
    
    // --- NUEVA LÓGICA DE FILTRADO ---
    const searchVal = DOMElements.orderSearchTracking.value.toLowerCase().trim();
    const statusVal = DOMElements.orderFilterStatus.value;

    orders = orders.filter(order => {
        // Filtro de Texto (Busca en Tracking Number O en el ID del pedido)
        const tracking = (order.trackingNumber || '').toLowerCase();
        const id = order.id.toString();
        const matchesSearch = tracking.includes(searchVal) || id.includes(searchVal);

        // Filtro de Estado
        const matchesStatus = statusVal === "" || order.status === statusVal;

        return matchesSearch && matchesStatus;
    });
    // --------------------------------

    DOMElements.orderList.innerHTML = '';

    if (orders.length === 0) {
        DOMElements.orderList.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10 bg-gray-800 rounded-lg">No se encontraron pedidos con esos criterios.</p>`;
        return;
    }

    orders.sort((a, b) => b.id - a.id).forEach(order => {
        // ... (El resto del código dentro del forEach se mantiene IGUAL a como lo tenías) ...
        const style = getStatusColor(order.status);
        const date = new Date(order.createdAt).toLocaleDateString('es-ES');
        
        // Renderizado del Tracking Number en la tarjeta (Mejora visual opcional)
        const trackingDisplay = order.trackingNumber 
    ? `<div class="mt-2 text-xs text-gray-400 bg-gray-900 p-1 rounded text-center border border-gray-700">${order.trackingNumber}</div>` 
    : '';

        const card = document.createElement('div');
        card.className = `bg-card-bg p-4 rounded-lg shadow border-l-4 ${style.border} hover:bg-gray-800 transition flex flex-col justify-between`;
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg">#${order.id} <span class="text-sm font-normal text-gray-400">(${date})</span></h3>
                        <p class="text-sm text-gray-300 truncate max-w-[150px]" title="${order.customerName}">${order.customerName}</p>
                        <p class="text-xs text-gray-500 mt-1">${order.items.length} artículos</p>
                    </div>
                    <div class="text-right">
                        <span class="${style.bg} ${style.text} px-2 py-1 rounded text-xs font-bold uppercase block w-max ml-auto">${order.status}</span>
                        <p class="text-xl font-bold text-yellow-400 mt-2">$${order.total.toFixed(2)}</p>
                    </div>
                </div>
                ${trackingDisplay} 
            </div>
            <div class="mt-4 flex justify-end gap-2 border-t border-gray-700 pt-3">
                <button data-id="${order.id}" class="invoice-btn text-green-400 text-sm hover:text-green-300"><i class="fas fa-file-invoice"></i> Factura</button>
                <button data-id="${order.id}" class="edit-order-btn text-blue-400 text-sm hover:text-blue-300"><i class="fas fa-edit"></i> Editar</button>
                <button data-id="${order.id}" class="delete-order-btn text-red-400 text-sm hover:text-red-300"><i class="fas fa-trash"></i></button>
            </div>`;
        
        DOMElements.orderList.appendChild(card);
    });
}

// 1. Crear fila de producto (Con Talla Dinámica y Límite de Stock)
function createOrderItemRow(item = {}) {
    const row = document.createElement('div');
    row.className = 'order-item-row flex gap-2 items-center bg-gray-700 p-2 rounded mb-2 border border-gray-600';

    // Detectar si es un ítem existente (ya guardado en BD)
    const isExistingItem = item.productId ? true : false;

    // Estilos para inputs bloqueados
    const disabledClass = 'opacity-60 cursor-not-allowed bg-gray-800 text-gray-400';

    // A. Select de Producto
    const prodSelect = document.createElement('select');
    prodSelect.className = `flex-grow rounded p-2 text-sm border border-gray-600 outline-none ${isExistingItem ? disabledClass : 'bg-gray-900 text-white focus:border-yellow-400'}`;
    prodSelect.name = 'product-id';
    
    // Si existe, lo deshabilitamos
    if (isExistingItem) prodSelect.disabled = true;

    let defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.textContent = "Seleccionar Producto...";
    prodSelect.appendChild(defaultOpt);

    // Llenamos el select (necesario aunque esté deshabilitado para mostrar el nombre correcto)
    AppState.products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} (Stock: ${p.stock}) - $${p.price}`;
        if (item.productId && p.id == item.productId) option.selected = true;
        prodSelect.appendChild(option);
    });

    // B. Select de Talla
    const sizeSelect = document.createElement('select');
    sizeSelect.className = `w-24 rounded p-2 text-sm border border-gray-600 outline-none ${isExistingItem ? disabledClass : 'bg-gray-900 text-white focus:border-yellow-400'}`;
    sizeSelect.name = 'product-size';
    
    if (isExistingItem) sizeSelect.disabled = true;

    // C. Input de Cantidad
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = `w-20 rounded p-2 text-sm text-center border border-gray-600 outline-none ${isExistingItem ? disabledClass : 'bg-gray-900 text-white focus:border-yellow-400'}`;
    qtyInput.name = 'product-quantity';
    qtyInput.value = item.quantity || 1;
    qtyInput.min = 1;
    
    if (isExistingItem) {
        qtyInput.disabled = true;
        qtyInput.title = "Cantidad original facturada (No editable)";
    }

    // D. Botón Eliminar Fila
    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.className = 'text-red-400 hover:text-red-500 ml-2 p-2 transition-transform hover:scale-110';
    delBtn.type = 'button';
    delBtn.title = isExistingItem ? "Eliminar este producto del pedido" : "Eliminar fila";
    
    // La eliminación SIEMPRE está permitida
    delBtn.onclick = () => { 
        if(isExistingItem) {
            if(!confirm("¿Estás seguro de eliminar este producto ya facturado?")) return;
        }
        row.remove(); 
        calculateOrderTotal(); 
    };

    // --- LÓGICA INTERNA DE LA FILA ---
    function updateRowDetails(selectedProductId) {
        // Solo ejecutamos lógica de carga si NO es un ítem existente bloqueado
        // O si necesitamos llenar el select de tallas inicial
        const product = AppState.products.find(p => p.id == selectedProductId);
        sizeSelect.innerHTML = ''; // Limpiar

        if (product) {
            // Cargar Tallas
            const productSizes = AppState.sizes.filter(s => product.sizeIds.includes(s.id));
            if (productSizes.length > 0) {
                productSizes.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.name;
                    opt.textContent = s.name;
                    if (item.size && s.name === item.size) opt.selected = true;
                    sizeSelect.appendChild(opt);
                });
            } else {
                const opt = document.createElement('option');
                opt.value = "Única";
                opt.textContent = "Única";
                opt.selected = true;
                sizeSelect.appendChild(opt);
            }

            // Validar stock solo si es NUEVO ítem (Editable)
            if (!isExistingItem) {
                qtyInput.max = product.stock;
                if (parseInt(qtyInput.value) > product.stock) qtyInput.value = product.stock;
            }
        }
    }

    // Listeners (Solo activos si no está bloqueado)
    if (!isExistingItem) {
        prodSelect.addEventListener('change', (e) => {
            updateRowDetails(e.target.value);
            calculateOrderTotal();
        });

        qtyInput.addEventListener('input', (e) => {
            const max = parseInt(e.target.max);
            if (parseInt(e.target.value) > max) {
                alert(`Solo hay ${max} unidades disponibles.`);
                e.target.value = max;
            }
            calculateOrderTotal();
        });
    }

    // Inicialización
    if (item.productId) {
        updateRowDetails(item.productId);
    }

    // Indicador visual de "Facturado"
    if (isExistingItem) {
        const lockIcon = document.createElement('i');
        lockIcon.className = "fas fa-lock text-gray-500 text-xs mr-1";
        lockIcon.title = "Producto Original";
        row.prepend(lockIcon);
    }

    row.append(prodSelect, sizeSelect, qtyInput, delBtn);
    return row;
}

function calculateOrderTotal() {
    let total = 0;
    const rows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    rows.forEach(row => {
        const pid = row.querySelector('[name="product-id"]').value;
        const qty = row.querySelector('[name="product-quantity"]').value;
        const product = AppState.products.find(p => p.id == pid);
        if (product && qty > 0) total += product.price * qty;
    });
    DOMElements.orderTotalInput.value = total.toFixed(2);
}

// 3. Rellenar formulario para EDITAR PEDIDO
async function fillFormForEditOrder(orderId) {
    const orders = await getOrders();
    const order = orders.find(o => o.id == orderId);
    if (!order) return;

    AppState.editingOrderId = orderId;
    AppState.editingOrderCreatedAt = order.createdAt;

    DOMElements.orderIdInput.value = order.id;
    DOMElements.customerNameInput.value = order.customerName;
    DOMElements.customerEmailInput.value = order.customerEmail;
    DOMElements.customerAddressInput.value = order.customerAddress;
    DOMElements.orderStatusInput.value = order.status;
    
    // --- LÓGICA DE BLOQUEO DE TRACKING ---
    DOMElements.trackingNumberInput.value = order.trackingNumber || '';

    if (order.trackingNumber) {
        // Si YA TIENE número, lo bloqueamos visual y funcionalmente
        DOMElements.trackingNumberInput.disabled = true;
        DOMElements.trackingNumberInput.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-800');
        DOMElements.trackingNumberInput.title = "El número de seguimiento generado no se puede modificar";
    } else {
        // Si NO tiene, permitimos escribir (o dejar vacío para autogenerar)
        DOMElements.trackingNumberInput.disabled = false;
        DOMElements.trackingNumberInput.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-800');
        DOMElements.trackingNumberInput.title = "";
    }
    // -------------------------------------
    
    DOMElements.orderFormTitle.textContent = `Editando Pedido #${order.id}`;
    DOMElements.saveOrderBtn.textContent = 'Actualizar Pedido';
    DOMElements.cancelOrderBtn.style.display = 'inline-block';
    
    DOMElements.orderItemsSelectionContainer.innerHTML = '';

    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const row = createOrderItemRow({
                productId: item.productId,
                quantity: item.quantity,
                size: item.size 
            });
            DOMElements.orderItemsSelectionContainer.appendChild(row);
        });
    } else {
        DOMElements.orderItemsSelectionContainer.innerHTML = '<p class="text-sm text-gray-400 text-center" id="empty-order-placeholder">Usa el botón "Añadir Artículo" para empezar.</p>';
    }

    calculateOrderTotal();
    document.getElementById('orders-view').scrollIntoView({ behavior: 'smooth' });
}

async function handleOrderFormSubmit(e) {
    e.preventDefault();
    const rows = DOMElements.orderItemsSelectionContainer.querySelectorAll('.order-item-row');
    const items = [];
    let hasError = false;
    
    rows.forEach(row => {
        const pid = parseInt(row.querySelector('[name="product-id"]').value);
        const size = row.querySelector('[name="product-size"]').value;
        const qty = parseInt(row.querySelector('[name="product-quantity"]').value);
        const product = AppState.products.find(p => p.id === pid);
        
        if (!pid) { showPopup("Selecciona un producto.", 'error'); hasError = true; return; }
        if (!size) { showPopup(`Selecciona una talla para ${product.name}.`, 'error'); hasError = true; return; }
        
        // Validación de Stock (Solo si es nuevo o si aumentó la cantidad)
        if (qty > product.stock && !AppState.editingOrderId) { 
            showPopup(`Stock insuficiente para ${product.name}.`, 'error');
            hasError = true;
            return;
        }

        items.push({ productId: pid, name: product.name, price: product.price, quantity: qty, size: size });
    });

    if (hasError) return;
    if (items.length === 0) return showPopup("Añade al menos un producto.", 'error');

    const orderData = {
        id: AppState.editingOrderId,
        customerName: DOMElements.customerNameInput.value,
        customerEmail: DOMElements.customerEmailInput.value,
        customerAddress: DOMElements.customerAddressInput.value,
        status: DOMElements.orderStatusInput.value,
        total: parseFloat(DOMElements.orderTotalInput.value),
        items: items,
        trackingNumber: DOMElements.trackingNumberInput.value,
        createdAt: AppState.editingOrderCreatedAt || new Date().toISOString()
    };

    const result = await saveOrder(orderData);
    if (result) {
        showPopup(AppState.editingOrderId ? 'Pedido actualizado.' : 'Pedido creado.');
        resetOrderForm();
        renderOrderList();
        await getProducts(); 
    }
}

// Manejo de Clics en la Lista de Pedidos
async function handleOrderListClick(e) {
    const target = e.target;
    const editBtn = target.closest('.edit-order-btn');
    const deleteBtn = target.closest('.delete-order-btn');
    const invoiceBtn = target.closest('.invoice-btn');

    if (editBtn) {
        await fillFormForEditOrder(editBtn.dataset.id);
    }
    if (deleteBtn) {
        showConfirmationModal("¿Eliminar este pedido?", async () => {
            await deleteOrder(deleteBtn.dataset.id);
            renderOrderList();
            await getProducts(); 
        });
    }
    if (invoiceBtn) {
        window.open(`/api/orders/invoice/${invoiceBtn.dataset.id}`, '_blank');
    }
}

/*
loadRealAIPrediction (MUESTRA VENTAS REALES)
*/
async function loadRealAIPrediction() {
    try {
        // 1. UI de carga
        DOMElements.iaMonto.textContent = "Cargando...";
        DOMElements.iaVariacion.textContent = "...";
        DOMElements.iaProductName.textContent = "Analizando...";
        DOMElements.iaText.textContent = "Consultando a Gemini AI...";
        DOMElements.iaProductUnits.textContent = "Calculando..."; // Feedback inmediato
        DOMElements.iaContainer.classList.add("animate-pulse");

        // 2. Llamada al Backend
        // Aquí el backend lee la BD y calcula las ventas exactas
        const data = await apiRequest("/api/ai/predict");
        if (!data) throw new Error("Error al conectar con servidor");

        const { prediction, realStats } = data; 

        if (!prediction) throw new Error("La IA no devolvió predicción");

        const { ventasProyectadas, variacionPorcentual, productoAltaDemanda, recomendacion } = prediction;

        // 3. Renderizar Datos de la IA
        DOMElements.iaMonto.textContent = `$${Number(ventasProyectadas).toLocaleString()}`;
        DOMElements.iaVariacion.textContent = `${variacionPorcentual > 0 ? '+' : ''}${variacionPorcentual}%`;
        DOMElements.iaProductName.textContent = productoAltaDemanda || "Desconocido";
        typeTextAnimation(DOMElements.iaText, recomendacion || "Sin recomendación.");

        // 4. Renderizar UNIDADES VENDIDAS (Dato Crítico)
        // Usamos 'realStats' que viene directo de tu backend
        if (realStats && typeof realStats.unitsSold !== 'undefined') {
             DOMElements.iaProductUnits.textContent = `Unidades vendidas este mes: ${realStats.unitsSold}`;
        } else {
             DOMElements.iaProductUnits.textContent = "Unidades vendidas este mes: 0";
        }

        // 5. Buscar imagen y precio (Cosmético)
        // Buscamos el producto en la lista local solo para obtener la foto y el precio actual
        const product = AppState.products.find(p => p.name === productoAltaDemanda);
        
        if (product) {
            DOMElements.iaProductImage.src = product.images[0] || '';
            DOMElements.iaProductImage.classList.remove('hidden');
            DOMElements.iaPlaceholder.classList.add('hidden');
            DOMElements.iaProductPrice.textContent = `Precio: $${product.price.toFixed(2)}`;
        } else {
            // Si el producto no está en la lista local (raro), ocultamos la imagen
            DOMElements.iaProductImage.classList.add('hidden');
            DOMElements.iaPlaceholder.classList.remove('hidden');
            DOMElements.iaProductPrice.textContent = "Precio: --";
        }

    } catch (error) {
        console.error("Error IA:", error);
        DOMElements.iaText.textContent = "No se pudo generar el análisis en este momento.";
        DOMElements.iaProductUnits.textContent = "Unidades vendidas: --";
    } finally {
        DOMElements.iaContainer.classList.remove("animate-pulse");
    }
}

function typeTextAnimation(element, text) {
    element.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
        element.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(interval);
    }, 20);
}

/*
LÓGICA DE REPORTES: VENTAS REALES Y TOP PRODUCTOS
*/
async function loadReportsData() {
    const orders = await getOrders();
    
    // Filtrar solo ventas reales (Entregados)
    const deliveredOrders = orders.filter(o => o.status === 'entregado');

    // --- KPI SUPERIORES ---
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = deliveredOrders.length ? (totalSales / deliveredOrders.length) : 0;
    
    DOMElements.kpiAvgTicket.textContent = `$${avgTicket.toFixed(2)}`;
    
    // Calculamos pedidos del mes actual para el KPI
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const ordersThisMonth = orders.filter(o => new Date(o.createdAt) >= startOfMonth).length;
    DOMElements.kpiTotalOrdersMonth.textContent = ordersThisMonth;
    DOMElements.kpiTotalOrdersMonthSub.textContent = "Pedidos creados este mes";

    // --- 1. TOP PRODUCTOS (Datos Reales) ---
    const productCounts = {};

    deliveredOrders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                const name = item.name.trim();
                const qty = parseInt(item.quantity) || 0;
                productCounts[name] = (productCounts[name] || 0) + qty;
            });
        }
    });

    // Convertir a array, ordenar por cantidad descendente y tomar los top 3
    const sortedProducts = Object.entries(productCounts)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3);

    // Renderizar la lista
    const topList = DOMElements.topProductsList;
    topList.innerHTML = '';
    
    if (sortedProducts.length === 0) {
        topList.innerHTML = '<li class="text-gray-500 text-center py-4">No hay ventas registradas aún.</li>';
    } else {
        sortedProducts.forEach((prod, index) => {
            let medalColor = index === 0 ? 'text-yellow-400' : (index === 1 ? 'text-gray-300' : 'text-orange-400');
            topList.innerHTML += `
                <li class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700 mb-2">
                    <div class="flex items-center gap-3">
                        <span class="font-bold ${medalColor} text-lg">#${index + 1}</span>
                        <span class="font-semibold text-white">${prod.name}</span>
                    </div>
                    <span class="font-bold text-white bg-white/10 px-2 py-1 rounded text-sm">
                        ${prod.qty} <span class="text-xs text-gray-400 font-normal">unid.</span>
                    </span>
                </li>
            `;
        });
    }

    // --- 2. GRÁFICO DE VENTAS MENSUALES (Datos Reales) ---
    // Preparamos los últimos 6 meses
    const months = [];
    const salesData = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();
        
        months.push(`${monthNames[monthIndex]}`);

        // Sumar ventas de ese mes específico
        const monthlyTotal = deliveredOrders
            .filter(o => {
                const oDate = new Date(o.createdAt);
                return oDate.getMonth() === monthIndex && oDate.getFullYear() === year;
            })
            .reduce((sum, o) => sum + o.total, 0);
            
        salesData.push(monthlyTotal);
    }

    // Destruir gráfico anterior si existe
    if (monthlySalesChart) monthlySalesChart.destroy();
    
    // Crear nuevo gráfico
    const ctx = DOMElements.monthlySalesChartCanvas.getContext('2d');
    
    // Gradiente para el gráfico (Efecto Neón)
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 222, 77, 0.5)'); // Amarillo fuerte arriba
    gradient.addColorStop(1, 'rgba(255, 222, 77, 0.0)'); // Transparente abajo

    monthlySalesChart = new Chart(ctx, {
        type: 'line', // Cambié a línea porque se ve más "financiero" y elegante para tendencias
        data: {
            labels: months,
            datasets: [{
                label: 'Ingresos ($)',
                data: salesData,
                backgroundColor: gradient,
                borderColor: '#FFDE4D',
                borderWidth: 2,
                pointBackgroundColor: '#000',
                pointBorderColor: '#FFDE4D',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4 // Curvas suaves
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#FFDE4D',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `$ ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#9ca3af',
                        callback: function(value) { return '$' + value; } 
                    },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

async function loadDashboardData() {
    try {
        const orders = await getOrders();
        const products = await getProducts();

        // 1. VENTAS TOTALES (Entregados)
        const deliveredOrders = orders.filter(o => o.status === 'entregado');
        const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
        DOMElements.kpiTotalSales.textContent = `$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // 2. PEDIDOS PENDIENTES
        const pendingCount = orders.filter(o => o.status === 'pendiente' || o.status === 'procesando').length;
        DOMElements.kpiPendingOrders.textContent = pendingCount;

        // 3. STOCK CRÍTICO (Dinámico)
        const criticalProducts = products.filter(p => {
            const currentStock = parseInt(p.stock, 10) || 0;
            const limit = (p.minStock !== undefined && p.minStock !== null) ? parseInt(p.minStock, 10) : 5;
            return currentStock <= limit;
        });
        DOMElements.kpiCriticalStock.textContent = criticalProducts.length;

        // 4. TASA DE CANCELACIÓN (NUEVO CÁLCULO)
        // Fórmula: (Cancelados / Total Pedidos) * 100
        const totalOrdersCount = orders.length;
        const cancelledCount = orders.filter(o => o.status === 'cancelado').length;
        
        let cancelRate = 0;
        if (totalOrdersCount > 0) {
            cancelRate = (cancelledCount / totalOrdersCount) * 100;
        }
        
        // Actualizar DOM
        if (DOMElements.kpiCancellationRate) {
            DOMElements.kpiCancellationRate.textContent = `${cancelRate.toFixed(1)}%`;
        }
        if (DOMElements.kpiCancellationRateSub) {
            DOMElements.kpiCancellationRateSub.textContent = `${cancelledCount} de ${totalOrdersCount} pedidos`;
        }

        // 5. TASA DE DEVOLUCIÓN (NUEVO CÁLCULO)
        // Fórmula: (Devueltos / Entregados + Devueltos) * 100
        // Opcional: Podrías usar (Devueltos / Total) según prefieras
        const returnedCount = orders.filter(o => o.status === 'devuelto').length;
        // Total de pedidos "finalizados" (entregados + devueltos)
        const finalizedCount = deliveredOrders.length + returnedCount;

        let returnRate = 0;
        if (finalizedCount > 0) {
            returnRate = (returnedCount / finalizedCount) * 100;
        }

        // Actualizar DOM (Estos elementos están en la pestaña Reportes, pero a veces se muestran en Dashboard)
        if (DOMElements.kpiReturnRate) {
            DOMElements.kpiReturnRate.textContent = `${returnRate.toFixed(1)}%`;
        }
        if (DOMElements.kpiReturnRateSub) {
            DOMElements.kpiReturnRateSub.textContent = `${returnedCount} de ${finalizedCount} entregas`;
        }

        // 6. ACTIVIDAD RECIENTE
        renderRecentActivity(orders.slice(0, 5));

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

function renderRecentActivity(orders) {
    const list = DOMElements.recentActivityList;
    list.innerHTML = '';
    orders.forEach(o => {
        list.innerHTML += `
            <li class="border-b border-gray-800 pb-2 mb-2">
                <div class="flex justify-between font-bold">
                    <span>#${o.id} - ${o.customerName}</span>
                    <span class="text-yellow-400">$${o.total.toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-400 uppercase">${o.status}</div>
            </li>`;
    });
}

async function loadCategoryPrediction() {
    console.log("🔄 Iniciando carga de Categorías IA...");

    // 1. Validar que los elementos del DOM existan
    const cards = DOMElements.iaCats;
    if (!cards || cards.length === 0) {
        console.error("Error Crítico: No se encontraron las tarjetas de IA en el DOM.");
        return;
    }

    // 2. Poner estado de carga visual
    cards.forEach((card, i) => {
        if (card.name) card.name.textContent = "Cargando...";
        if (card.status) card.status.textContent = "...";
        if (card.icon) card.icon.className = "fas fa-circle-notch fa-spin text-4xl mb-2 text-gray-500";
    });

    try {
        // 3. Llamada al Backend
        console.log("📡 Solicitando datos a /api/ai/category-demand...");
        const data = await apiRequest('/api/ai/category-demand');
        console.log("Datos recibidos:", data);

        // Si la API devuelve vacío o null, usamos un array vacío seguro
        const safeData = Array.isArray(data) ? data : [];

        // 4. Renderizar
        cards.forEach((card, index) => {
            // Verificación de seguridad para no romper el script si falta un elemento HTML
            if (!card.name || !card.status || !card.icon) {
                console.warn(`⚠️ Faltan elementos HTML para la tarjeta #${index + 1}`);
                return;
            }

            const item = safeData[index];

            if (item && item.name) {
                // --- A. SI HAY DATOS REALES ---
                card.name.textContent = item.name;
                
                // Icono
                const iconName = item.icon && item.icon.startsWith('fa-') ? item.icon : 'fa-box';
                card.icon.className = `fas ${iconName} text-4xl mb-2 transition-colors duration-300`;

                // Estado (Badge)
                let statusText = "Estable";
                let statusClass = "text-gray-400 border-gray-600 bg-gray-800";
                let iconColor = "text-gray-500";
                const demand = (item.demand || '').toLowerCase();

                if (demand === 'alta') {
                    statusText = "▲ Alta Demanda";
                    statusClass = "text-green-400 border-green-500 bg-green-900/20";
                    iconColor = "text-green-400";
                } else if (demand === 'baja') {
                    statusText = "▼ Baja Demanda";
                    statusClass = "text-red-400 border-red-500 bg-red-900/20";
                    iconColor = "text-red-500";
                }

                card.status.textContent = statusText;
                card.status.className = `text-xs font-bold px-3 py-1 rounded-full border ${statusClass} inline-block mt-1`;
                card.icon.classList.add(iconColor);

            } else {
                // --- B. SI NO HAY DATOS (Slot vacío) ---
                // Esto evita que se quede en "Cargando..."
                card.name.textContent = "Disponible";
                card.status.textContent = "Sin datos";
                card.status.className = "text-xs text-gray-600 font-bold border border-gray-700 px-2 py-1 rounded-full";
                card.icon.className = "fas fa-minus-circle text-4xl mb-2 text-gray-800";
            }
        });

    } catch (error) {
        console.error(" Error fatal en loadCategoryPrediction:", error);
        
        // --- C. FALLBACK VISUAL (Si la API falla, mostramos esto) ---
        cards.forEach(card => {
            if(card.name) card.name.textContent = "Sin Conexión";
            if(card.status) card.status.textContent = "Reintentar";
            if(card.status) card.status.className = "text-xs text-red-500 font-bold cursor-pointer border border-red-900 px-2 py-1 rounded-full";
            if(card.icon) card.icon.className = "fas fa-wifi text-4xl mb-2 text-red-900";
            
            // Click para reintentar
            if(card.status) card.status.onclick = () => {
                card.status.onclick = null; // Evitar doble clic
                loadCategoryPrediction();
            };
        });
    }
}
/*
INICIALIZACIÓN
*/

async function init() {
    // 1. Carga inicial de datos
    AppState.categories = await getCategories();
    AppState.sizes = await getSizes();
    AppState.products = await getProducts(); 

    // 2. Rellenar Select de Categorías
    const catSelect = DOMElements.productCategoryInput;
    catSelect.innerHTML = '<option value="">Seleccionar...</option>';
    AppState.categories.forEach(c => {
        catSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    // 3. Rellenar Checkboxes de Tallas
    const sizeContainer = DOMElements.productSizesContainer;
    sizeContainer.innerHTML = '';
    AppState.sizes.forEach(s => {
        sizeContainer.innerHTML += `
            <label class="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" value="${s.id}" class="form-checkbox text-yellow-400"> ${s.name}
            </label>`;
    });

    // 4. Listeners Generales (Login, Logout, Sidebar)
    DOMElements.loginForm.addEventListener('submit', handleLogin);
    DOMElements.logoutBtn.addEventListener('click', handleLogout);

    if (DOMElements.toggleSidebarBtn) {
        DOMElements.toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    DOMElements.togglePasswordBtn.addEventListener('click', () => {
        const input = DOMElements.passwordInput;
        input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Navegación
    DOMElements.viewButtons.forEach(btn => btn.addEventListener('click', (e) => {
        switchView(e.currentTarget.getAttribute('data-view'));
    }));

    // 5. Listeners de PRODUCTOS
    DOMElements.productForm.addEventListener('submit', handleProductFormSubmit);
    DOMElements.cancelBtn.addEventListener('click', resetForm);
    
    // Delegación de eventos para botones en la lista de productos
    DOMElements.productList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            showConfirmationModal("¿Eliminar producto?", async () => {
                await deleteProduct(e.target.dataset.id);
                renderProductList();
            });
        }
        if (e.target.classList.contains('edit-btn')) {
            await fillProductFormForEdit(e.target.dataset.id);
        }
    });
    
    // Buscador de productos
    DOMElements.productSearchInput.addEventListener('input', renderProductList);

    // 6. Listeners de PEDIDOS
    DOMElements.addOrderItemBtn.addEventListener('click', () => {
        DOMElements.orderItemsSelectionContainer.appendChild(createOrderItemRow());
    });
    DOMElements.orderForm.addEventListener('submit', handleOrderFormSubmit);
    DOMElements.cancelOrderBtn.addEventListener('click', resetOrderForm);
    DOMElements.orderList.addEventListener('click', handleOrderListClick);

    // --- NUEVO: Listeners para Filtros de Pedidos (Buscador y Estado) ---
    if (DOMElements.orderSearchTracking && DOMElements.orderFilterStatus) {
        // Al escribir en el buscador
        DOMElements.orderSearchTracking.addEventListener('input', renderOrderList);
        // Al cambiar el select de estado
        DOMElements.orderFilterStatus.addEventListener('change', renderOrderList);
    }
    // --------------------------------------------------------------------

    // 7. Listeners de IA
    if (DOMElements.iaPredictionBtn) {
        DOMElements.iaPredictionBtn.addEventListener('click', loadRealAIPrediction);
    }

    // 8. Reloj y Autenticación
    setInterval(updateDateTime, 1000);
    updateDateTime();

    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        showDashboard();
        loadRealAIPrediction();
        loadCategoryPrediction();
    } else {
        DOMElements.loginSection.style.display = 'flex';
    }
}

function resetOrderForm() {
    DOMElements.orderForm.reset();
    AppState.editingOrderId = null;
    
    // --- RESETEAR ESTADO DEL INPUT TRACKING ---
    // Reactivamos el campo para nuevos pedidos
    DOMElements.trackingNumberInput.disabled = false;
    DOMElements.trackingNumberInput.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-800');
    DOMElements.trackingNumberInput.placeholder = "Se generará al guardar (si es nuevo)";
    DOMElements.trackingNumberInput.title = "";
    // ------------------------------------------

    DOMElements.orderItemsSelectionContainer.innerHTML = '<p class="text-sm text-gray-400 text-center" id="empty-order-placeholder">Usa el botón "Añadir Artículo" para empezar.</p>';
    DOMElements.orderFormTitle.textContent = 'Crear Pedido';
    DOMElements.saveOrderBtn.textContent = 'Guardar';
    DOMElements.cancelOrderBtn.style.display = 'none';
    DOMElements.orderTotalInput.value = '0.00';
}

document.addEventListener('DOMContentLoaded', init);