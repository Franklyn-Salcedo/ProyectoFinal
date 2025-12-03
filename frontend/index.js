/* ==========================================================
   1. CONFIGURACIÓN DE TAILWIND (CDN)
   ========================================================== */
// Esto configura los colores personalizados sin necesidad de build steps
if (window.tailwind) {
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    'neon-accent': '#FFDE4D',
                    'dark-bg': '#0D0D0D',
                    'card-bg': '#1A1A1A',
                },
                fontFamily: {
                    'title': ['Carter One', 'cursive'],
                    'body': ['Inter', 'sans-serif']
                }
            }
        }
    };
}

/* ==========================================================
   2. ESTADO GLOBAL Y SELECTORES DOM
   ========================================================== */
const AppState = {
    cart: [],
    activeCategory: 'all',
    searchTerm: ''
};

// Referencias globales (se llenarán al cargar el DOM)
let DOMElements = {};

// Caché y Constantes
let productsCache = [];
const storePhoneNumber = "18099881192"; 

// Variables para Partículas (Hero Section)
let ctx = null;
let particles = [];
const particleColors = ["#000000", "#F5F5F5", "#FFDE4D"];

/* ==========================================================
   3. SERVICIOS API (Backend)
   ========================================================== */
async function getProducts() {
    if (productsCache.length > 0) return productsCache;
    try {
        const response = await fetch('/api/products'); 
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const products = await response.json();
        productsCache = products; 
        return products;
    } catch (error) {
        console.error("Error API Productos:", error);
        if(DOMElements.productList) 
            DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-red-500">Error de conexión con el servidor.</p>`;
        return []; 
    }
}

async function getCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error API Categorías:", error);
        return [];
    }
}

async function getSizes() {
    try {
        const response = await fetch('/api/sizes');
        if (!response.ok) throw new Error('Error al obtener tallas');
        return await response.json();
    } catch (error) {
        console.error("Error API Tallas:", error);
        return [];
    }
}

/* ==========================================================
   4. SISTEMA DE PARTÍCULAS (EFECTO HERO)
   ========================================================== */
function initParticles() {
    if (!DOMElements.shatterCanvas) return;
    ctx = DOMElements.shatterCanvas.getContext('2d');
    
    // Ajustar canvas al tamaño de ventana
    function resizeCanvas() { 
        if (DOMElements.shatterCanvas) {
            DOMElements.shatterCanvas.width = window.innerWidth; 
            DOMElements.shatterCanvas.height = window.innerHeight; 
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Llamada inicial
}

class Particle { 
    constructor(x, y) { 
        this.x = x; this.y = y; 
        this.size = Math.random() * 5 + 1; 
        this.speedX = Math.random() * 6 - 3; 
        this.speedY = Math.random() * 6 - 3; 
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)]; 
        this.life = 100; 
    }
    update() { 
        this.x += this.speedX; 
        this.y += this.speedY; 
        this.life -= 1.5; 
        if (this.size > 0.2) this.size -= 0.1; 
    }
    draw() { 
        if(!ctx) return;
        ctx.fillStyle = this.color; 
        ctx.globalAlpha = Math.max(0, this.life / 100); 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
        ctx.fill(); 
    }
}

function handleParticles() { 
    for (let i = particles.length - 1; i >= 0; i--) { 
        particles[i].update(); 
        particles[i].draw(); 
        if (particles[i].life < 1 || particles[i].size < 0.2) { 
            particles.splice(i, 1); 
        } 
    } 
}

function animateParticles() { 
    if(!ctx || !DOMElements.shatterCanvas) return;
    ctx.clearRect(0, 0, DOMElements.shatterCanvas.width, DOMElements.shatterCanvas.height); 
    handleParticles(); 
    if (particles.length > 0) { 
        requestAnimationFrame(animateParticles); 
    } 
}

function triggerShatter() {
    if (!DOMElements.shatterCanvas || document.body.classList.contains('has-shattered')) return;
    
    document.body.classList.add('has-shattered');
    if(DOMElements.heroContent) DOMElements.heroContent.classList.add('is-shattering');
    
    // Centro de la explosión
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    
    if(DOMElements.heroContent) {
        const contentRect = DOMElements.heroContent.getBoundingClientRect();
        centerX = contentRect.left + contentRect.width / 2;
        centerY = contentRect.top + contentRect.height / 2;
    }

    for (let i = 0; i < 250; i++) { 
        particles.push(new Particle(centerX, centerY)); 
    }
    if (particles.length > 0) animateParticles();
}

/* ==========================================================
   5. NUEVA LÓGICA DE CARRITO (EDITABLE)
   ========================================================== */

async function updateCartView() { 
    // Referencias a los contenedores nuevos (asegúrate de que tu HTML tenga esta estructura básica o la inyectaremos)
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.getElementById('cart-count');
    
    if(!cartItemsContainer) return;
    
    // 1. Actualizar contador
    const count = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
    if(cartCountElement) cartCountElement.textContent = count;

    // 2. Limpiar y Preparar
    cartItemsContainer.innerHTML = ''; 
    let total = 0;
    
    // 3. Estado Vacío
    if (AppState.cart.length === 0) { 
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-state animate-fadeIn">
                <i class="fas fa-shopping-bag"></i>
                <p class="text-gray-400 font-bold mb-2">Tu carrito está vacío</p>
                <p class="text-gray-600 text-sm">¡Explora nuestra colección y define tu estilo!</p>
                <button onclick="document.getElementById('close-cart-btn').click()" class="mt-6 text-neon-accent hover:underline text-sm cursor-pointer">Seguir Comprando</button>
            </div>`; 
    } else {
        // 4. Renderizar Productos
        const products = await getProducts();
        const allSizes = await getSizes();

        AppState.cart.forEach((item) => { 
            const product = products.find(p => p.id === item.id);
            if (!product) return; 
            
            total += product.price * item.quantity;

            // Generar Opciones de Talla
            const availableSizes = allSizes.filter(s => product.sizeIds.includes(s.id));
            const sizeOptions = availableSizes.map(s => `
                <option value="${s.name}" ${s.name === item.size ? 'selected' : ''}>${s.name}</option>
            `).join('');
            
            // Generar Opciones de Cantidad (Stock)
            let quantityOptions = '';
            for (let i = 1; i <= product.stock; i++) {
                quantityOptions += `<option value="${i}" ${i === item.quantity ? 'selected' : ''}>${i}</option>`;
            }

            // HTML PREMIUM DE LA TARJETA
            cartItemsContainer.innerHTML += `
                <div class="cart-item-card animate-fadeIn">
                    <img src="${product.images && product.images[0] ? product.images[0] : 'https://placehold.co/100'}" class="cart-item-img">
                    
                    <div class="flex-grow flex flex-col justify-between">
                        <div class="flex justify-between items-start">
                            <h4 class="text-white font-bold text-sm leading-tight pr-2">${product.name}</h4>
                            <button class="remove-item-btn text-gray-600 hover:text-red-500 transition px-1" 
                                    data-id="${item.id}" data-size="${item.size}" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>

                        <div class="cart-controls">
                            <div class="cart-select-wrapper w-20">
                                <span class="cart-label-mini">Talla</span>
                                <select class="cart-dropdown change-size-input" data-id="${item.id}" data-old-size="${item.size}">
                                    ${sizeOptions}
                                </select>
                            </div>

                            <div class="cart-select-wrapper w-16">
                                <span class="cart-label-mini">Cant</span>
                                <select class="cart-dropdown change-qty-input" data-id="${item.id}" data-size="${item.size}">
                                    ${quantityOptions}
                                </select>
                            </div>
                        </div>

                        <div class="text-right mt-2">
                            <span class="text-neon-accent font-bold font-title tracking-wide">$${(product.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>`; 
        });
    }
    
    // 5. Actualizar Total en el Footer
    if(cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// 2. Función para cambiar cantidad
function updateCartItemQuantity(productId, size, newQty) {
    const item = AppState.cart.find(i => i.id === productId && i.size === size);
    if (item) {
        const qty = parseInt(newQty);
        if (qty <= 0) {
            // Si pone 0, preguntamos si quiere borrar
            if(confirm("¿Deseas eliminar este producto?")) removeFromCart(productId, size);
            else updateCartView(); // Restaurar vista si cancela
        } else {
            item.quantity = qty;
            updateCartView();
        }
    }
}

// 3. Función para cambiar talla (Fusión Inteligente)
function updateCartItemSize(productId, oldSize, newSize) {
    if (oldSize === newSize) return; // No hubo cambio

    const itemIndex = AppState.cart.findIndex(i => i.id === productId && i.size === oldSize);
    if (itemIndex === -1) return;

    // Verificar si ya existe el producto con la NUEVA talla en el carrito
    const existingTargetItem = AppState.cart.find(i => i.id === productId && i.size === newSize);

    if (existingTargetItem) {
        // FUSIÓN: Si ya tengo una 'L' y cambio mi 'M' a 'L', sumo las cantidades
        existingTargetItem.quantity += AppState.cart[itemIndex].quantity;
        // Elimino la linea vieja
        AppState.cart.splice(itemIndex, 1);
    } else {
        // CAMBIO SIMPLE: Solo actualizo la propiedad size
        AppState.cart[itemIndex].size = newSize;
    }
    
    updateCartView();
}

async function addToCart(productId, size, quantity = 1) { 
    const existingItem = AppState.cart.find(item => item.id === productId && item.size === size); 
    
    if (existingItem) { 
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity > product.stock) {
            alert(`Solo quedan ${product.stock - existingItem.quantity} unidades más.`);
            existingItem.quantity = product.stock; 
        } else {
            existingItem.quantity = newQuantity;
        }
    } else { 
        AppState.cart.push({ id: productId, size, quantity }); 
    } 
    
    updateCartView(); 
    toggleCartPanel(true); 
}

function removeFromCart(productId, size) {
    const itemIndex = AppState.cart.findIndex(item => item.id === productId && item.size === size);
    if (itemIndex > -1) {
        AppState.cart.splice(itemIndex, 1); 
        updateCartView(); 
    }
}

function toggleCartPanel(show) { 
    if(DOMElements.cartPanel) {
        DOMElements.cartPanel.classList.toggle('translate-x-full', !show); 
    }
}

/* ==========================================================
   6. RENDERIZADO DE PRODUCTOS (TIENDA)
   ========================================================== */
async function renderProducts() {
    const allProducts = await getProducts(); 
    if (!DOMElements.productList) return; 
    
    const categoryFiltered = allProducts.filter(product => {
        if (AppState.activeCategory === 'all') return true;
        return String(product.categoryId) === AppState.activeCategory;
    });

    const searchFiltered = categoryFiltered.filter(product => {
        return product.name.toLowerCase().includes(AppState.searchTerm);
    });

    DOMElements.productList.innerHTML = '';
    if (searchFiltered.length === 0) {
        DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-400 text-lg py-10">No se encontraron productos.</p>`;
        return;
    }

    searchFiltered.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card-store group [perspective:1000px] opacity-0 translate-y-10';
        card.dataset.id = product.id; 
        card.style.transitionDelay = `${index * 50}ms`;

        const imageUrl = product.images?.[0] || 'https://placehold.co/600x800/111827/FFFFFF?text=No+Image';
        
        // --- LÓGICA DE OFERTA ---
        const hasOffer = product.offerPrice && product.offerPrice < product.price;
        const finalPrice = hasOffer ? product.offerPrice : product.price;
        
        // HTML del Precio (Si hay oferta mostramos el viejo tachado)
        const priceHTML = hasOffer 
            ? `<div class="flex flex-col items-end">
                 <span class="text-xs text-gray-400 line-through">$${product.price.toFixed(2)}</span>
                 <span class="text-neon-accent font-title font-bold text-lg">$${product.offerPrice.toFixed(2)}</span>
               </div>`
            : `<p class="text-neon-accent font-title font-bold text-lg">$${product.price.toFixed(2)}</p>`;

        // Badge de Oferta
        const offerBadge = hasOffer 
            ? `<span class="absolute top-3 right-3 bg-neon-accent text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-md z-20">OFERTA</span>` 
            : '';
        // ------------------------

        const umbral = product.minStock || 5;
        let stockBadge = '';
        if (product.stock === 0) {
            stockBadge = `<span class="absolute top-3 left-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-md border border-red-500 z-20">Agotado</span>`;
        } else if (product.stock <= umbral) {
            stockBadge = `<span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-md animate-pulse z-20">¡Quedan ${product.stock}!</span>`;
        }

        const thumbnails = (product.images || []).slice(0, 4).map((img, i) => `
            <img src="${img}" 
                 class="thumbnail w-10 h-10 rounded-full border border-gray-900 cursor-pointer transition-transform duration-300 hover:scale-110 object-contain bg-white p-[2px] ${i === 0 ? 'selected-thumb border-neon-accent shadow-neon-accent' : 'border-gray-900'}" 
                 data-full-img="${img}" 
                 alt="Thumb ${i}">
        `).join('');

        card.innerHTML = `
            <div class="relative w-full group">
                <div class="relative w-full aspect-[4/5] bg-white rounded-xl overflow-hidden cursor-pointer shadow-sm">
                    <img src="${imageUrl}" alt="${product.name}" class="main-image w-full h-full object-contain p-4 transition-transform duration-700 ease-in-out group-hover:scale-110">
                    <div class="absolute inset-0 shadow-inner opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    <button class="add-to-cart-btn absolute bottom-4 right-4 w-12 h-12 bg-neon-accent text-black rounded-full shadow-lg flex items-center justify-center transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10" data-id="${product.id}" title="Añadir al carrito">
                        <i class="fas fa-plus text-lg"></i>
                    </button>
                    
                    ${stockBadge}
                    ${offerBadge} </div>

                <div class="mt-4 pl-1">
                    <div class="flex justify-between items-start">
                        <h3 class="text-white font-body font-medium text-lg leading-tight truncate pr-4 w-3/4" title="${product.name}">${product.name}</h3>
                        ${priceHTML}
                    </div>
                    
                    <div class="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                        ${thumbnails}
                    </div>
                </div>
            </div>
        `;
        DOMElements.productList.appendChild(card);
    });

    observeProductCards();
    initCardInteractions();
}

// Inicializar interacciones dentro de las tarjetas
function initCardInteractions() {
    document.querySelectorAll('.product-card-store').forEach(card => {
        const mainImage = card.querySelector('.main-image');
        const thumbnails = card.querySelectorAll('.thumbnail');
        const addToCartButton = card.querySelector('.add-to-cart-btn');

        // Click en miniatura
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                mainImage.src = thumb.dataset.fullImg;
                thumbnails.forEach(t => t.classList.remove('selected-thumb', 'border-neon-accent'));
                thumb.classList.add('selected-thumb', 'border-neon-accent');
            });
        });
        
        // Botón Añadir Rápido
        if (addToCartButton) {
            addToCartButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = parseInt(addToCartButton.dataset.id, 10);
                // Añadir talla por defecto "M" (o abrir modal si se prefiere lógica compleja)
                addToCart(productId, "M", 1); 
                
                // Feedback visual en el botón
                const originalContent = addToCartButton.innerHTML;
                addToCartButton.textContent = '¡Añadido!';
                addToCartButton.classList.remove('bg-neon-accent');
                addToCartButton.classList.add('bg-green-500');
                
                setTimeout(() => {
                    addToCartButton.innerHTML = originalContent;
                    addToCartButton.classList.remove('bg-green-500');
                    addToCartButton.classList.add('bg-neon-accent');
                }, 1500);
            });
        }
        
        // Click general en la tarjeta (Abrir Modal Detallado)
        card.addEventListener('click', () => {
            const productId = parseInt(card.dataset.id, 10);
            openProductModal(productId);
        });
    });
}

// Observer para animaciones de entrada
function observeProductCards() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if(entry.isIntersecting){
                // Retraso para que no entren todas de golpe
                setTimeout(() => {
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                }, 100); 
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.product-card-store').forEach(card => observer.observe(card));
}

/* ==========================================================
   7. MODAL DE PRODUCTO (VISTA RÁPIDA)
   ========================================================== */

/* ==========================================================
   FUNCIÓN ACTUALIZADA: openProductModal (PREMIUM GLASS + OFERTAS)
   ========================================================== */
async function openProductModal(productId) { 
    if(!DOMElements.productModal) return;

    const products = await getProducts();
    const product = products.find(p => p.id === productId); 
    if (!product) return;

    const allSizes = await getSizes(); 
    const productSizes = allSizes.filter(s => product.sizeIds.includes(s.id));
    
    const isDisabled = product.stock === 0;
    
    let quantityOptions = '';
    if (isDisabled) {
        quantityOptions = `<option value="0" disabled selected>Sin Stock</option>`;
    } else {
        for (let i = 1; i <= product.stock; i++) {
            quantityOptions += `<option value="${i}">${i}</option>`;
        }
    }

    // --- LÓGICA DE OFERTA ---
    const hasOffer = product.offerPrice && product.offerPrice < product.price;
    const priceDisplay = hasOffer 
        ? `<div class="flex flex-col items-start">
             <span class="text-gray-400 line-through text-lg md:text-xl decoration-red-500 decoration-2 mb-1">$${product.price.toFixed(2)}</span>
             <span class="text-4xl md:text-5xl neon-accent-text font-bold font-title tracking-wide drop-shadow-lg">$${product.offerPrice.toFixed(2)}</span>
           </div>`
        : `<p class="text-4xl md:text-5xl neon-accent-text font-bold font-title tracking-wide drop-shadow-lg">$${product.price.toFixed(2)}</p>`;
    // ------------------------

    // HTML ACTUALIZADO
    DOMElements.productModal.innerHTML = `
        <div id="modal-content-box" class="modal-glass-panel animate-fadeInUp relative w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            
            <button id="close-modal-btn" class="absolute top-4 right-4 z-50 bg-black/40 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/10 group">
                <i class="fas fa-times text-lg group-hover:rotate-90 transition-transform"></i>
            </button>

            <div class="w-full md:w-1/2 bg-white h-full flex flex-col relative">
                <div class="flex-grow relative overflow-hidden p-8 flex items-center justify-center">
                    <img src="${product.images[0]}" alt="${product.name}" class="max-h-full w-full h-full object-contain transition-transform duration-500 hover:scale-105" id="main-modal-image">
                </div>
                
                <div class="p-4 flex gap-3 overflow-x-auto scrollbar-hide bg-gray-100 border-t border-gray-200">
                    ${product.images.map((img, index) => `
                        <img src="${img}" class="thumbnail-image w-16 h-16 object-contain bg-white rounded-lg cursor-pointer border-2 ${index === 0 ? 'border-black' : 'border-transparent'} hover:border-black/50 transition-all p-1 shadow-sm">
                    `).join('')}
                </div>
            </div>

            <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full overflow-y-auto custom-scrollbar bg-gradient-to-b from-black/80 to-black/95">
                
                <div class="mb-6 border-b border-white/10 pb-6">
                    <h2 class="font-title text-3xl md:text-4xl text-white mb-3 leading-tight">${product.name}</h2>
                    <div class="flex items-center gap-4">
                        ${priceDisplay}

                        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 text-xs font-bold uppercase tracking-wider ${isDisabled ? 'text-red-500' : 'text-green-400'} ml-auto md:ml-4">
                            <span class="w-2 h-2 rounded-full ${isDisabled ? 'bg-red-500' : 'bg-green-400'} animate-pulse"></span>
                            ${isDisabled ? 'Agotado' : `Stock: ${product.stock}`}
                        </div>
                    </div>
                </div>

                <div class="mb-8">
                    <h4 class="text-sm text-gray-400 uppercase tracking-widest mb-3 font-bold">Detalles</h4>
                    <p class="text-gray-300 leading-relaxed text-sm md:text-base font-light bg-white/5 p-4 rounded-xl border border-white/5">
                        ${product.description}
                    </p>
                </div>
                
                <div class="mt-auto">
                    <div class="flex flex-col md:flex-row gap-6 mb-6">
                        <div class="flex-grow">
                            <h4 class="text-sm text-gray-400 uppercase tracking-widest mb-3 font-bold">1. Elige Talla</h4>
                            <div class="flex gap-2 flex-wrap" id="size-selector-container">
                                ${productSizes.map(s => `<button class="size-btn-premium">${s.name}</button>`).join('')}
                            </div>
                            <p id="size-error" class="text-red-500 text-sm mt-2 hidden font-bold animate-pulse">⚠ Por favor, selecciona una talla.</p>
                        </div>
                        
                        <div>
                            <h4 class="text-sm text-gray-400 uppercase tracking-widest mb-3 font-bold">2. Cantidad</h4>
                            <div class="relative">
                                <select id="quantity-select-modal" class="custom-qty-select-modal" ${isDisabled ? 'disabled' : ''}>
                                    ${quantityOptions}
                                </select>
                                <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                            </div>
                        </div>
                    </div>
                    
                    <button id="add-to-cart-modal-btn" class="w-full py-5 rounded-xl font-bold text-lg uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center justify-center gap-3
                        ${isDisabled ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-neon-accent text-black hover:bg-white hover:shadow-neon-accent/50 hover:-translate-y-1'}">
                        <i class="fas fa-shopping-bag"></i>
                        ${isDisabled ? 'AGOTADO' : 'AÑADIR AL CARRITO'}
                    </button>
                </div>
            </div>
        </div>`;

    // 3. Mostrar Modal
    DOMElements.productModal.classList.remove('hidden');
    DOMElements.productModal.style.display = 'flex'; 

    // Listeners
    const closeBtn = document.getElementById('close-modal-btn');
    if(closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            DOMElements.productModal.classList.add('hidden');
            DOMElements.productModal.style.display = 'none';
        };
    }

    const contentBox = document.getElementById('modal-content-box');
    if(contentBox) {
        contentBox.onclick = (e) => { e.stopPropagation(); };
    }

    const mainImg = document.getElementById('main-modal-image');
    const thumbs = document.querySelectorAll('.thumbnail-image');
    
    thumbs.forEach(thumb => { 
        thumb.addEventListener('click', () => { 
            if(mainImg) mainImg.src = thumb.src; 
            thumbs.forEach(t => t.classList.remove('border-black'));
            thumb.classList.add('border-black');
        }); 
    });
    
    let selectedSize = null;
    const sizeBtns = document.querySelectorAll('.size-btn-premium');
    sizeBtns.forEach(btn => { 
        btn.addEventListener('click', () => { 
            sizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = btn.textContent; 
            document.getElementById('size-error').classList.add('hidden'); 
        }); 
    });
    
    const addBtn = document.getElementById('add-to-cart-modal-btn');
    if(addBtn && !isDisabled) {
        addBtn.addEventListener('click', () => { 
            if (!selectedSize) { 
                document.getElementById('size-error').classList.remove('hidden'); 
                const sizeContainer = document.getElementById('size-selector-container');
                sizeContainer.classList.add('animate-shake');
                setTimeout(() => sizeContainer.classList.remove('animate-shake'), 500);
                return; 
            }
            const qty = parseInt(document.getElementById('quantity-select-modal').value, 10);
            
            // Usamos el precio de oferta si existe para el carrito
            const priceToUse = hasOffer ? product.offerPrice : product.price;
            
            // MODIFICACIÓN: Llamada a addToCart (asegúrate que addToCart soporte el precio o lo busque de nuevo)
            // Como addToCart busca el producto por ID en la lista global, ya tendrá el precio actualizado si getProducts lo trajo bien.
            addToCart(product.id, selectedSize, qty); 
            
            DOMElements.productModal.classList.add('hidden');
            DOMElements.productModal.style.display = 'none';
            toggleCartPanel(true);
        });
    }
}
/* ==========================================================
   8. LLENADO DE FILTROS (CATEGORÍAS)
   ========================================================== */
async function populateCategoryFilter() {
    if (!DOMElements.categorySelect) return;
    
    const categories = await getCategories();
    const select = DOMElements.categorySelect;
    select.innerHTML = '<option value="all">Todas las Categorías</option>';
    
    const groups = {};
    
    // Agrupación lógica
    categories.forEach(cat => {
        let g = 'Otros';
        if (['T-Shirts', 'Hoodies', 'Jackets', 'Shirts', 'Sweaters'].includes(cat.name)) g = 'Ropa Superior';
        else if (['Pants', 'Jeans', 'Shorts', 'Joggers'].includes(cat.name)) g = 'Ropa Inferior';
        else if (['Accessories', 'Caps', 'Bags', 'Socks'].includes(cat.name)) g = 'Accesorios';
        else if (['Footwear', 'Shoes', 'Sneakers'].includes(cat.name)) g = 'Calzado';
        
        if (!groups[g]) groups[g] = [];
        groups[g].push(cat);
    });

    for (const gName in groups) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = gName;
        groups[gName].forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id; 
            opt.textContent = cat.name;
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    }
}

/* ==========================================================
   9. CHECKOUT Y FACTURACIÓN
   ========================================================== */
function initCheckoutLogic() {
    if (!DOMElements.checkoutBtn) return;

    // Abrir Modal Checkout
    DOMElements.checkoutBtn.addEventListener('click', () => {
        if (!AppState.cart || AppState.cart.length === 0) { 
            alert("Tu carrito está vacío. Agrega productos antes de pagar."); 
            return; 
        }
        DOMElements.checkoutModal.classList.remove('hidden');
    });

    // Cerrar Modal
    if(DOMElements.closeCheckoutModal) DOMElements.closeCheckoutModal.addEventListener('click', () => DOMElements.checkoutModal.classList.add('hidden'));
    if(DOMElements.cancelCheckout) DOMElements.cancelCheckout.addEventListener('click', () => DOMElements.checkoutModal.classList.add('hidden'));

    // Enviar Formulario
    if(DOMElements.checkoutForm) {
        DOMElements.checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!DOMElements.checkoutForm.checkValidity()) return;

            // Recoger datos
            const name = document.getElementById("clientName").value.trim();
            const email = document.getElementById("clientEmail").value.trim();
            const address = document.getElementById("clientAddress").value.trim();
            const pagoInput = document.querySelector('input[name="pago"]:checked');
            const pago = pagoInput ? pagoInput.value : 'Acordar';

            // Preparar items para backend
            const products = await getProducts();
            const items = AppState.cart.map(ci => {
                const prod = products.find(p => p.id === ci.id) || {};
                return {
                    productId: ci.id,
                    name: prod.name || 'Producto Desconocido',
                    price: Number(prod.price || 0),
                    quantity: Number(ci.quantity || 1),
                    size: ci.size || 'N/A'
                };
            });

            const orderData = { 
                customerName: name, 
                customerEmail: email, 
                customerAddress: address, 
                status: "pendiente", 
                items: items 
            };

            try {
                // 1. Guardar en Base de Datos
                const res = await fetch('/api/orders', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(orderData) 
                });
                
                if (!res.ok) throw new Error('Error guardando pedido en servidor.');
                const newOrder = await res.json();
                
                // 2. Descargar Factura PDF
                const a = document.createElement('a');
                a.href = `/api/orders/invoice/${newOrder.id}`;
                a.download = `Factura_TRK-${newOrder.id}.pdf`;
                document.body.appendChild(a); 
                a.click(); 
                document.body.removeChild(a);

                // 3. Redirigir a WhatsApp
                const itemsList = items.map(i => `- ${i.quantity}x ${i.name} (${i.size})`).join('\n');
                const message = `*NUEVO PEDIDO: TRK-${newOrder.id}*\n\n*Cliente:* ${name}\n*Dirección:* ${address}\n*Pago:* ${pago}\n\n*Productos:*\n${itemsList}\n\n_He descargado la factura._`;
                
                window.open(`https://wa.me/${storePhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');

                // 4. Limpieza final
                DOMElements.checkoutModal.classList.add('hidden');
                AppState.cart = [];
                updateCartView();
                toggleCartPanel(false);
                DOMElements.checkoutForm.reset();
                
            } catch (error) {
                console.error("Checkout Error:", error);
                alert("Hubo un error al procesar tu pedido. Intenta de nuevo.");
            }
        });
    }
}


/* ==========================================================
   SECCIÓN 10: CHATBOT FINAL (MINIMIZAR + REINICIAR)
   ========================================================== */
function initChatbot() {
    if(!DOMElements.chatBtn) return;

    // Referencias a los nuevos botones
    const minimizeBtn = document.getElementById('minimize-chatbot');
    // Nota: closeChat ya está mapeado en DOMElements pero lo usamos aquí directo para claridad
    
    // 1. Renderizar Mensajes
    function addMessage(text, type = 'bot', opts = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = `msg ${type}`;
        
        if (opts.isProduct && opts.product) {
            const img = opts.product.images && opts.product.images.length > 0 
                ? opts.product.images[0] 
                : 'https://placehold.co/200?text=No+Img';

            // Detectar si es PNG para ajustar estilo
            const isPNG = img.toLowerCase().includes('.png');
            const imgStyle = isPNG ? 'object-contain bg-white p-1' : 'object-cover';

            wrapper.innerHTML = `
              <div class="product-mini cursor-pointer hover:bg-white/10 transition p-2 rounded border border-gray-600 flex items-center gap-3" onclick="openProductModal(${opts.product.id})">
                <img src="${img}" alt="${opts.product.name}" class="${imgStyle}" style="width:60px; height:60px; border-radius:8px;">
                <div class="pinfo flex-grow" style="overflow:hidden;">
                  <div class="font-bold text-white text-sm truncate">${opts.product.name}</div>
                  <div class="price text-neon-accent font-bold text-sm mt-1">$${Number(opts.product.price).toFixed(2)}</div>
                  <div class="text-xs text-gray-400">Stock: ${opts.product.stock}</div>
                </div>
                <i class="fas fa-chevron-right text-gray-500"></i>
              </div>`;
        } else {
            wrapper.innerHTML = text.replace(/\n/g, '<br>');
        }
        DOMElements.chatMessages.appendChild(wrapper);
        DOMElements.chatMessages.scrollTop = DOMElements.chatMessages.scrollHeight;
    }

    function addTyping() {
        const t = document.createElement('div');
        t.className = 'msg bot typing'; t.id = 'typing-indicator';
        t.innerHTML = `<div class="flex gap-1 p-1"><span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span><span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span><span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span></div>`;
        DOMElements.chatMessages.appendChild(t);
        DOMElements.chatMessages.scrollTop = DOMElements.chatMessages.scrollHeight;
    }

    async function handleSend() {
        const text = DOMElements.chatInput.value.trim();
        if (!text) return;
        
        const quickActions = document.querySelector('.chat-quick-actions');
        if (quickActions) quickActions.remove();

        addMessage(text, 'user');
        DOMElements.chatInput.value = '';
        
        // Rastreo Local
        if (/^\d+$/.test(text)) {
            addTyping();
            try {
                const res = await fetch('/api/orders');
                const orders = await res.json();
                const order = orders.find(o => o.id == text);
                document.getElementById('typing-indicator')?.remove();

                if (order) {
                    let emoji = order.status === 'entregado' ? '✅' : '🚚';
                    addMessage(`📦 **Pedido #${order.id}**\nEstado: ${emoji} ${order.status.toUpperCase()}\nTotal: $${order.total.toFixed(2)}`, 'bot');
                } else {
                    addMessage(`❌ No encontré el pedido #${text}.`, 'bot');
                }
            } catch (e) {
                document.getElementById('typing-indicator')?.remove();
                addMessage('Error al buscar pedido.', 'bot');
            }
            return;
        }

        // Consulta IA
        addTyping();
        try {
            const res = await fetch('/api/chat', { 
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) 
            });
            
            const data = await res.json();
            document.getElementById('typing-indicator')?.remove();
            
            if (data.reply) {
                addMessage(data.reply, 'bot');
            }

            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                data.products.forEach(p => {
                    if (p && p.name && p.price) {
                        addMessage('', 'bot', { isProduct: true, product: p });
                    }
                });
            }
        } catch (err) {
            console.error("Error Chatbot Front:", err);
            document.getElementById('typing-indicator')?.remove();
            addMessage('El servidor está ocupado. Intenta de nuevo.', 'bot');
        }
    }

    function addQuickActions() {
        if (document.querySelector('.chat-quick-actions')) return;
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-quick-actions flex gap-2 p-2 mb-2 justify-center';
        
        const actions = [
            { text: '🛍️ Productos', val: 'productos disponibles' },
            { text: '📦 Rastrear', val: 'Rastrear pedido' }
        ];

        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = 'chat-chip bg-gray-800 hover:bg-neon-accent hover:text-black text-white text-xs py-2 px-4 rounded-full transition-colors border border-gray-600 whitespace-nowrap shadow-sm';
            btn.textContent = act.text;
            btn.onclick = () => {
                DOMElements.chatInput.value = act.val;
                handleSend();
            };
            actionsDiv.appendChild(btn);
        });
        DOMElements.chatMessages.appendChild(actionsDiv);
        DOMElements.chatMessages.scrollTop = DOMElements.chatMessages.scrollHeight;
    }

    // --- LISTENERS DE APERTURA Y CIERRE ---

    // 1. Botón Flotante (Abrir)
    DOMElements.chatBtn.addEventListener('click', () => { 
        DOMElements.chatModal.style.display = 'flex';
        DOMElements.chatInput.focus();
        
        // Si está vacío (porque se reinició), mostramos el saludo
        if(DOMElements.chatMessages.children.length === 0) {
            addMessage('¡Hola! 👋 Soy KeyBot.', 'bot');
            setTimeout(addQuickActions, 500);
        }
    });
    
    // 2. Botón MINIMIZAR (-)
    if(minimizeBtn) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita conflictos de arrastre
            // Solo ocultamos el modal, NO borramos el contenido
            DOMElements.chatModal.style.display = 'none';
        });
    }

    // 3. Botón CERRAR / REINICIAR (X)
    DOMElements.closeChat.addEventListener('click', (e) => { 
        e.stopPropagation();
        // Ocultamos el modal
        DOMElements.chatModal.style.display = 'none';
        // BORRAMOS el historial para reiniciar la conversación
        DOMElements.chatMessages.innerHTML = '';
    });

    DOMElements.chatSend.addEventListener('click', handleSend);
    DOMElements.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); }});

    // Lógica de Arrastre
    const header = DOMElements.chatModal.querySelector('.chat-header');
    if (header) {
        let isDragging = false, startX, startY, initialLeft, initialTop;
        header.addEventListener('mousedown', (e) => {
            // Evitar arrastrar si se hace clic en los botones de control
            if (e.target.closest('button')) return;
            
            if (window.innerWidth <= 480) return;
            isDragging = true; startX = e.clientX; startY = e.clientY;
            const rect = DOMElements.chatModal.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
            header.style.cursor = 'grabbing'; document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX; const dy = e.clientY - startY;
            DOMElements.chatModal.style.right = 'auto'; DOMElements.chatModal.style.bottom = 'auto';
            DOMElements.chatModal.style.left = `${initialLeft + dx}px`; DOMElements.chatModal.style.top = `${initialTop + dy}px`;
        });
        document.addEventListener('mouseup', () => {
            if(isDragging) { isDragging = false; header.style.cursor = 'move'; document.body.style.userSelect = ''; }
        });
    }
}

/* ==========================================================
   11. INICIALIZACIÓN GLOBAL (MAIN)
   ========================================================== */

function initialize() {
    console.log("Iniciando Key Option Store...");
    
    // 1. Mapeo de elementos DOM
    DOMElements = {
        heroSection: document.getElementById('hero-section'),
        heroContent: document.getElementById('hero-content'),
        store: document.getElementById('store'),
        productList: document.getElementById('store-product-list'),
        
        scrollIndicator: document.getElementById('scroll-indicator'),
        scrollArrow: document.getElementById('scroll-arrow'),
        shatterCanvas: document.getElementById('shatter-canvas'),
        whatsappButton: document.getElementById('whatsapp-button'),
        verColeccionBtn: document.getElementById('ver-coleccion-btn'),

        cartButton: document.getElementById('cart-button'),
        cartPanel: document.getElementById('cart-panel'),
        closeCartBtn: document.getElementById('close-cart-btn'),
        cartCount: document.getElementById('cart-count'),
        cartItems: document.getElementById('cart-items'),
        cartTotal: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn'),

        searchInput: document.getElementById('search-input'),
        categorySelect: document.getElementById('category-select'),
        productModal: document.getElementById('product-modal'),

        checkoutModal: document.getElementById('checkoutModal'),
        closeCheckoutModal: document.getElementById('closeCheckoutModal'),
        cancelCheckout: document.getElementById('cancelCheckout'),
        checkoutForm: document.getElementById('checkoutForm'),
        
        chatBtn: document.getElementById('chatbot-button'),
        chatModal: document.getElementById('chatbot-modal'),
        closeChat: document.getElementById('close-chatbot'),
        chatMessages: document.getElementById('chatbot-messages'),
        chatInput: document.getElementById('chatbot-input'),
        chatSend: document.getElementById('chatbot-send')
    };

    // 2. Inicializar Módulos
    initParticles();
    populateCategoryFilter();
    renderProducts(); 
    updateCartView();
    initCheckoutLogic();
    initChatbot();
    
    // 3. LISTENERS GLOBALES UI

    // --- Cierre Global del Modal de Producto ---
    if (DOMElements.productModal) {
        DOMElements.productModal.addEventListener('click', (e) => {
            // Detectar clic en el botón de cerrar (o su ícono)
            const closeBtn = e.target.closest('#close-modal-btn');
            // Detectar clic en el fondo oscuro (fuera de la tarjeta)
            const isBackground = e.target === DOMElements.productModal;

            if (closeBtn || isBackground) {
                DOMElements.productModal.classList.add('hidden');
                DOMElements.productModal.style.display = 'none';
            }
        });
    }

    // --- Panel del Carrito ---
    if(DOMElements.cartButton) DOMElements.cartButton.addEventListener('click', () => toggleCartPanel(true));
    if(DOMElements.closeCartBtn) DOMElements.closeCartBtn.addEventListener('click', () => toggleCartPanel(false));
    
    // --- Lógica Interna del Carrito (Eliminar, Cantidad, Talla) ---
    if(DOMElements.cartItems) {
        
        // 1. Eliminar Producto
        DOMElements.cartItems.addEventListener('click', (e) => {
            const btn = e.target.closest('.remove-item-btn');
            if (btn) removeFromCart(parseInt(btn.dataset.id), btn.dataset.size);
        });

        // 2. Cambiar Cantidad (Input numérico)
        DOMElements.cartItems.addEventListener('change', (e) => {
            if (e.target.classList.contains('change-qty-input')) {
                const id = parseInt(e.target.dataset.id);
                const size = e.target.dataset.size;
                const qty = e.target.value;
                updateCartItemQuantity(id, size, qty);
            }
        });

        // 3. Cambiar Talla (Select)
        DOMElements.cartItems.addEventListener('change', (e) => {
            if (e.target.classList.contains('change-size-input')) {
                const id = parseInt(e.target.dataset.id);
                const oldSize = e.target.dataset.oldSize;
                const newSize = e.target.value;
                updateCartItemSize(id, oldSize, newSize);
            }
        });
    }

    // --- Navegación y Scroll ---
    if(DOMElements.scrollIndicator) {
        DOMElements.scrollIndicator.addEventListener('click', () => {
            if (window.scrollY > 100) window.scrollTo({ top: 0, behavior: 'smooth' });
            else if(DOMElements.store) DOMElements.store.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    if(DOMElements.verColeccionBtn) {
        DOMElements.verColeccionBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            if(DOMElements.store) DOMElements.store.scrollIntoView({ behavior: 'smooth' }); 
        });
    }

    // --- Botón WhatsApp ---
    if(DOMElements.whatsappButton) {
        const whatsappMessage = encodeURIComponent("Hola Key Option, vi su página web y tengo una consulta.");
        DOMElements.whatsappButton.href = `https://wa.me/${storePhoneNumber}?text=${whatsappMessage}`;
    }

    // --- Búsqueda y Filtros ---
    if(DOMElements.searchInput) {
        DOMElements.searchInput.addEventListener('input', (e) => {
            AppState.searchTerm = e.target.value.toLowerCase();
            renderProducts(); 
        });
    }
    
    if(DOMElements.categorySelect) {
        DOMElements.categorySelect.addEventListener('change', (e) => {
            AppState.activeCategory = e.target.value; 
            renderProducts(); 
        });
    }

    // --- Efectos Visuales de Scroll ---
    let hasShattered = false;
    window.addEventListener('scroll', () => {
        if (!DOMElements.heroSection) return; 
        const scrollY = window.scrollY;
        const heroHeight = DOMElements.heroSection.offsetHeight;
        
        // Rotar flecha
        if(DOMElements.scrollArrow) DOMElements.scrollArrow.classList.toggle('rotate-180', scrollY > heroHeight * 0.5);

        // Efecto Shatter (Explosión de partículas)
        if (scrollY > heroHeight * 0.7 && !hasShattered) {
            triggerShatter();
            hasShattered = true;
        } else if (scrollY < 100 && hasShattered) {
            hasShattered = false;
            document.body.classList.remove('has-shattered');
            if (DOMElements.heroContent) DOMElements.heroContent.classList.remove('is-shattering');
        }
    });
}

// Hacemos la función global para que el HTML inyectado en el chat pueda llamarla
window.openProductModal = openProductModal;

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initialize);