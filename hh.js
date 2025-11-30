// Animación de entrada por scroll
const productCards = document.querySelectorAll('.product-card-store');
const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if(entry.isIntersecting){
          setTimeout(() => {
            entry.target.classList.add('opacity-100','translate-y-0');
          }, i * 120);
        }
      });
    }, { threshold: 0.15 });
    productCards.forEach(card => observer.observe(card));
 

<script type="module">
    
    // ==========================================================
    // 1. BASE DE DATOS (Conectada al Backend)
    // ==========================================================
    
    // Almacenamiento en caché de productos para no llamar a la API en cada render
    let productsCache = [];
    
    async function getProducts() {
        // Si ya tenemos los productos en caché, los usamos
        if (productsCache.length > 0) {
            return productsCache;
        }
        
        try {
            const response = await fetch('/api/products'); 
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const products = await response.json();
            productsCache = products; // Guardar en caché
            return products;
        } catch (error) {
            console.error("Error al cargar productos desde la API:", error);
            DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-red-500">Error al cargar productos. El servidor no responde.</p>`;
            return []; 
        }
    }

    // Función para obtener categorías de la API
    async function getCategories() {
         try {
            const response = await fetch('/api/categories'); // Ruta del backend
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error al cargar categorías desde la API:", error);
            return [];
        }
    }


    // ==========================================================
    // 2. ELEMENTOS DEL DOM, ESTADO Y CONFIGURACIÓN
    // ==========================================================
    const DOMElements = {
        productList: document.getElementById('store-product-list'),
        cartButton: document.getElementById('cart-button'),
        cartPanel: document.getElementById('cart-panel'),
        closeCartBtn: document.getElementById('close-cart-btn'),
        cartCount: document.getElementById('cart-count'),
        cartItems: document.getElementById('cart-items'),
        cartTotal: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn'),
        productModal: document.getElementById('product-modal'),
        scrollIndicator: document.getElementById('scroll-indicator'),
        scrollArrow: document.getElementById('scroll-arrow'),
        heroSection: document.getElementById('hero-section'),
        store: document.getElementById('store'),
        verColeccionBtn: document.getElementById('ver-coleccion-btn'),
        whatsappButton: document.getElementById('whatsapp-button'),
        heroContent: document.getElementById('hero-content'),
        shatterCanvas: document.getElementById('shatter-canvas'),
        searchInput: document.getElementById('search-input'),
        categorySelect: document.getElementById('category-select'),
    };
    
    const AppState = {
        cart: [],
        activeCategory: 'all', 
        searchTerm: '' 
    };

    const storePhoneNumber = "18099881192"; 
    const ctx = DOMElements.shatterCanvas ? DOMElements.shatterCanvas.getContext('2d') : null;
    let particles = [];
    const particleColors = ["#000000", "#F5F5F5", "#FFDE4D"];

    // --- Partículas (sin cambios) ---
    function resizeCanvas() { 
        if (DOMElements.shatterCanvas) {
            DOMElements.shatterCanvas.width = window.innerWidth; 
            DOMElements.shatterCanvas.height = window.innerHeight; 
        }
    }
    class Particle { 
        constructor(x, y) { this.x = x; this.y = y; this.size = Math.random() * 5 + 1; this.speedX = Math.random() * 6 - 3; this.speedY = Math.random() * 6 - 3; this.color = particleColors[Math.floor(Math.random() * particleColors.length)]; this.life = 100; }
        update() { this.x += this.speedX; this.y += this.speedY; this.life -= 1.5; if (this.size > 0.2) this.size -= 0.1; }
        draw() { ctx.fillStyle = this.color; ctx.globalAlpha = Math.max(0, this.life / 100); ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    function handleParticles() { for (let i = particles.length - 1; i >= 0; i--) { particles[i].update(); particles[i].draw(); if (particles[i].life < 1 || particles[i].size < 0.2) { particles.splice(i, 1); } } }
    function animateParticles() { ctx.clearRect(0, 0, DOMElements.shatterCanvas.width, DOMElements.shatterCanvas.height); handleParticles(); if (particles.length > 0) { requestAnimationFrame(animateParticles); } }
    function triggerShatter() {
        if (!DOMElements.shatterCanvas || document.body.classList.contains('has-shattered')) return;
        document.body.classList.add('has-shattered');
        DOMElements.heroContent.classList.add('is-shattering');
        const contentRect = DOMElements.heroContent.getBoundingClientRect();
        const centerX = contentRect.left + contentRect.width / 2;
        const centerY = contentRect.top + contentRect.height / 2;
        for (let i = 0; i < 250; i++) { particles.push(new Particle(centerX, centerY)); }
        if (particles.length > 0) animateParticles();
    }
    // --- Fin Partículas ---

    // ==========================================================
    // 3. FUNCIONES DE RENDERIZADO (MOSTRAR PRODUCTOS)
    // ==========================================================
    
    async function renderProducts() {
        const allProducts = await getProducts(); 
        if (!DOMElements.productList) return; 
        
        // 1. Filtrar por Categoría
        const categoryFiltered = allProducts.filter(product => {
            if (AppState.activeCategory === 'all') return true;
            // IMPORTANTE: El backend guarda categoryId (número), no el nombre.
            // Convertimos ambos a String para una comparación segura.
            return String(product.categoryId) === AppState.activeCategory;
        });

        // 2. Filtrar por Búsqueda
        const searchFiltered = categoryFiltered.filter(product => {
            return product.name.toLowerCase().includes(AppState.searchTerm);
        });

        DOMElements.productList.innerHTML = '';
        
        if (searchFiltered.length === 0) {
            DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-400 text-lg">No se encontraron productos que coincidan con tu búsqueda.</p>`;
            return;
        }

        searchFiltered.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card-store group relative overflow-hidden rounded-lg cursor-pointer';
            card.dataset.id = product.id; // Usar el ID numérico de la base de datos
            card.style.transitionDelay = `${index * 100}ms`;
            
            const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x800/111827/FFFFFF?text=No+Image';
            
            card.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover transform transition-transform duration-300">
                <div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                    <h3 class="font-title text-lg truncate">${product.name}</h3>
                    <p class="neon-accent-text font-bold">$${product.price.toFixed(2)}</p>
                </div>`;
            
            // Añadir el listener aquí
            card.addEventListener('click', () => openProductModal(product.id));

            DOMElements.productList.appendChild(card);
        });

        observeProductCards();
    }

    // ==========================================================
    // 4. FUNCIONES DE CARRITO (Añadir, Eliminar, Vista)
    // ==========================================================
    
    async function updateCartView() { 
        DOMElements.cartCount.textContent = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
        DOMElements.cartItems.innerHTML = ''; 
        let total = 0;
        
        if (AppState.cart.length === 0) { 
            DOMElements.cartItems.innerHTML = `<p class="text-gray-400 text-center my-8">Tu carrito está vacío.</p>`; 
        } else {
            const products = await getProducts();
            
            AppState.cart.forEach((item, index) => { 
                const product = products.find(p => p.id === item.id); // Comparar ID numérico
                if (!product) return; 
                
                total += product.price * item.quantity;
                
                DOMElements.cartItems.innerHTML += `
                    <div class="flex gap-4 items-center mb-4 border-b border-gray-800 pb-4">
                        <img src="${product.images[0]}" class="w-16 h-20 object-cover rounded-md">
                        <div class="flex-grow">
                            <p class="font-bold">${product.name}</p>
                            <p class="text-sm text-gray-400">
                                Talla: ${item.size} | Cantidad: ${item.quantity}
                            </p>
                        </div>
                        <div class="flex flex-col items-end">
                            <button class="remove-item-btn text-red-500 hover:text-red-400 text-xs mb-1 transition" 
                                data-id="${item.id}" data-size="${item.size}">
                                Eliminar
                            </button>
                            <p class="font-bold">$${(product.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                `; 
            });
        }
        DOMElements.cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    async function addToCart(productId, size, quantity = 1) { 
        const existingItem = AppState.cart.find(item => item.id === productId && item.size === size); 
        
        if (existingItem) { 
            const products = await getProducts();
            const product = products.find(p => p.id === productId);
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > product.stock) {
                 alert(`No se puede añadir. Solo quedan ${product.stock - existingItem.quantity} unidades más. El stock total es ${product.stock}.`);
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

    function toggleCartPanel(show) { DOMElements.cartPanel.classList.toggle('translate-x-full', !show); }
    
    async function openProductModal(productId) { 
        const products = await getProducts();
        const product = products.find(p => p.id === productId); 
        if (!product) return;

        // Cargar Tallas (asumimos que el backend envía 'sizeIds' como [1, 2, 3])
        const allSizes = await getSizes(); 
        // Filtrar las tallas que SÍ tiene este producto
        const productSizes = allSizes.filter(s => product.sizeIds.includes(s.id));
        
        let quantityOptions = '';
        const isDisabled = product.stock === 0;

        if (isDisabled) {
            quantityOptions = `<option value="0" disabled>AGOTADO</option>`;
        } else {
            for (let i = 1; i <= product.stock; i++) {
                quantityOptions += `<option value="${i}">${i}</option>`;
            }
        }

        DOMElements.productModal.innerHTML = `
            <div class="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-lg relative grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto p-6">
                <button class="absolute top-4 right-4 text-2xl" id="close-modal-btn">&times;</button>
                
                <div>
                    <img src="${product.images[0]}" alt="${product.name}" class="w-full h-auto object-cover rounded-lg mb-4" id="main-modal-image">
                    <div class="grid grid-cols-4 gap-2">
                        ${product.images.map(img => `<img src="${img}" class="w-full h-20 object-cover rounded-md cursor-pointer thumbnail-image">`).join('')}
                    </div>
                </div>

                <div>
                    <h2 class="font-title text-3xl mb-2">${product.name}</h2>
                    <p class="text-3xl neon-accent-text font-bold mb-4">$${product.price.toFixed(2)}</p>
                    <p class="text-gray-300 mb-6">${product.description}</p>
                    
                    <p class="text-sm text-gray-500 mb-3">Stock Disponible: ${product.stock}</p>
                    
                    <div class="mb-6">
                        <h4 class="font-title mb-2">Tallas Disponibles</h4>
                        <div class="flex gap-2 flex-wrap mb-4">
                            ${productSizes.map(s => `<button class="size-btn border border-gray-600 rounded-md py-2 px-4 hover:bg-yellow-400 hover:text-black transition">${s.name}</button>`).join('')}
                        </div>
                        
                        <h4 class="font-title mb-2">Cantidad</h4>
                        <select 
                            id="quantity-select" 
                            class="w-20 bg-gray-700 border border-gray-600 p-2 rounded text-center text-white focus:ring-yellow-400"
                            ${isDisabled ? 'disabled' : ''}
                        >
                            ${quantityOptions}
                        </select>
                        
                        <p id="size-error" class="text-red-500 text-sm mt-2 hidden">Por favor, selecciona una talla.</p>
                    </div>
                    
                    <button 
                        id="add-to-cart-modal-btn" 
                        data-id="${product.id}" 
                        class="w-full neon-accent-bg text-black font-bold py-3 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${isDisabled ? 'disabled' : ''}
                    >
                        Añadir al Carrito
                    </button>
                </div>
            </div>
        `;

        DOMElements.productModal.classList.remove('hidden');
        
        document.getElementById('close-modal-btn').addEventListener('click', () => DOMElements.productModal.classList.add('hidden'));
        document.querySelectorAll('.thumbnail-image').forEach(thumb => { thumb.addEventListener('click', () => { document.getElementById('main-modal-image').src = thumb.src; }); });
        
        let selectedSize = null;
        const quantitySelect = document.getElementById('quantity-select'); 

        document.querySelectorAll('.size-btn').forEach(btn => { 
            btn.addEventListener('click', () => { 
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('neon-accent-bg', 'text-black')); 
                btn.classList.add('neon-accent-bg', 'text-black'); 
                selectedSize = btn.textContent; 
                document.getElementById('size-error').classList.add('hidden'); 
            }); 
        });
        
        document.getElementById('add-to-cart-modal-btn').addEventListener('click', (e) => { 
            if (!selectedSize) { 
                document.getElementById('size-error').classList.remove('hidden'); 
                return; 
            }
            
            const quantity = parseInt(quantitySelect.value, 10);
            
            if (quantity < 1 || isNaN(quantity)) {
                alert(`La cantidad seleccionada no es válida.`);
                return;
            }

            addToCart(product.id, selectedSize, quantity); 
            DOMElements.productModal.classList.add('hidden'); 
        });
    }

    function observeProductCards() {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => { 
                entry.target.classList.toggle('is-visible', entry.isIntersecting); 
            });
        }, { threshold: 0.1 }); 
        
        const cards = document.querySelectorAll('.product-card-store');
        cards.forEach(card => cardObserver.observe(card));
    }
    
    // Función para obtener tallas (copiada de admin.js)
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
    
    // Llenar el <select> de categorías del cliente
    async function populateCategoryFilter() {
        const categories = await getCategories();
        
        const select = DOMElements.categorySelect;
        if (!select) return;

        // Limpiar (solo dejar "Todas")
        select.innerHTML = '<option value="all">Todas las Categorías</option>';
        
        // Agrupar (opcional, pero basado en tu HTML)
        const groups = {};
        
        // Agrupación simple (puedes mejorar esto si tu API de categorías tiene grupos)
        categories.forEach(cat => {
            let groupName = 'Otros';
            if (['T-Shirts', 'Hoodies', 'Jackets', 'Shirts'].includes(cat.name)) {
                groupName = 'Partes de Arriba';
            } else if (['Pants', 'Jeans', 'Shorts'].includes(cat.name)) {
                groupName = 'Partes de Abajo';
            } else if (['Accessories', 'Caps', 'Bags'].includes(cat.name)) {
                groupName = 'Accesorios';
            } else if (['Footwear'].includes(cat.name)) {
                groupName = 'Calzado';
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(cat);
        });

        // Llenar los optgroups
        for (const groupName in groups) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;
            groups[groupName].forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id; // Usar el ID numérico
                option.textContent = cat.name;
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        }
    }

    // ==========================================================
    // 5. INICIALIZACIÓN
    // ==========================================================
    
    async function initialize() {
        resizeCanvas(); 
        window.addEventListener('resize', resizeCanvas);
        
        // Cargar categorías y productos al inicio
        await populateCategoryFilter();
        await renderProducts(); 
        
        updateCartView();
        
        DOMElements.cartButton.addEventListener('click', () => toggleCartPanel(true));
        DOMElements.closeCartBtn.addEventListener('click', () => toggleCartPanel(false));
        
        DOMElements.cartItems.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.remove-item-btn');
            if (removeButton) {
                const id = parseInt(removeButton.dataset.id, 10); // Asegurar que el ID sea numérico
                const size = removeButton.dataset.size;
                removeFromCart(id, size);
            }
        });
// ==========================================================
// 6. FUNCIONES DE MICROINTERACCIÓN (Tarjetas)
// ==========================================================

// Inicializa los listeners de las miniaturas y del botón de carrito en las tarjetas
function initCardInteractions() {
    document.querySelectorAll('.product-card-store').forEach(card => {
        const mainImage = card.querySelector('.main-image');
        const thumbnails = card.querySelectorAll('.thumbnail');
        const addToCartButton = card.querySelector('.add-to-cart-btn');

        // 1. Selector de Miniaturas
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que abra el modal si hay un click-through
                const newSrc = thumb.dataset.fullImg;
                
                // Cambia la imagen principal
                mainImage.src = newSrc; 
                
                // Actualiza el estilo de selección
                thumbnails.forEach(t => t.classList.remove('selected-thumb'));
                thumb.classList.add('selected-thumb');
            });
            
            // Efecto Hover en Miniaturas: Scale (ya cubierto por Tailwind)
        });
        
        // 2. Botón Añadir al Carrito (Acción Rápida)
        if (addToCartButton) {
            addToCartButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que abra el modal
                
                // En la tarjeta rápida, asumimos un valor predeterminado (por ejemplo, "Única" o el primer tamaño disponible)
                const productId = parseInt(addToCartButton.dataset.id, 10);
                const defaultSize = "M"; // *Ajustar por un tamaño predeterminado real o forzar el modal*
                
                // Llamamos a la función principal del carrito
                addToCart(productId, defaultSize, 1);
                
                // Microinteracción visual de confirmación
                addToCartButton.textContent = '¡Añadido! 🎉';
                addToCartButton.classList.remove('pulse-on-hover');
                addToCartButton.classList.add('bg-green-500', 'hover:bg-green-500');
                
                setTimeout(() => {
                    addToCartButton.textContent = 'Añadir';
                    addToCartButton.classList.add('pulse-on-hover');
                    addToCartButton.classList.remove('bg-green-500', 'hover:bg-green-500');
                    addToCartButton.classList.add('bg-neon-accent', 'hover:bg-yellow-300');
                }, 1500);
            });
        }
        
        // 3. Click para abrir Modal (si no se hizo click en miniatura/botón)
        card.addEventListener('click', () => {
            const productId = parseInt(card.dataset.id, 10);
            openProductModal(productId);
        });

    });
}


// Sobreescribir la función renderProducts para incluir las nuevas interacciones
async function renderProducts() {
    const allProducts = await getProducts(); 
    if (!DOMElements.productList) return; 
    
    // ... (Lógica de filtrado existente, no cambiar) ...
    const categoryFiltered = allProducts.filter(product => {
        if (AppState.activeCategory === 'all') return true;
        return String(product.categoryId) === AppState.activeCategory;
    });

    const searchFiltered = categoryFiltered.filter(product => {
        return product.name.toLowerCase().includes(AppState.searchTerm);
    });

    DOMElements.productList.innerHTML = '';
    
    if (searchFiltered.length === 0) {
        DOMElements.productList.innerHTML = `<p class="col-span-full text-center text-gray-400 text-lg">No se encontraron productos que coincidan con tu búsqueda.</p>`;
        return;
    }

    searchFiltered.forEach((product, index) => {
        const card = document.createElement('div');
        // Clases de Tailwind para la tarjeta principal (incluye el scroll reveal)
        card.className = 'product-card-store group [perspective:1000px] opacity-0 translate-y-10';
        card.dataset.id = product.id; 
        card.style.transitionDelay = `${index * 100}ms`; // Efecto cascada

        const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x800/111827/FFFFFF?text=No+Image';
        const thumbnails = (product.images || []).slice(0, 4).map((img, i) => `
            <img src="${img}" 
                 class="thumbnail w-10 h-10 object-cover rounded-full border border-gray-900 cursor-pointer transition-transform duration-300 hover:scale-110 ${i === 0 ? 'selected-thumb border-neon-accent shadow-neon-accent' : 'border-gray-900'}" 
                 data-full-img="${img}" 
                 alt="Miniatura ${i + 1}"
            >
        `).join('');

        // NUEVO HTML DE TARJETA
        card.innerHTML = `
            <div class="card-inner bg-card-bg rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ease-out border border-gray-700 hover:shadow-2xl hover:shadow-neon-accent/30 relative transform-gpu group-hover:rotate-y-3 group-hover:translate-y-[-12px] group-hover:scale-[1.03]">
                
                <div class="neon-border absolute inset-0 z-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div class="relative z-10 p-2">
                    
                    <div class="relative w-full h-48 overflow-hidden rounded-lg cursor-pointer image-container">
                        <img src="${imageUrl}" alt="${product.name}" class="main-image w-full h-full object-cover transition-transform duration-700 ease-out transform-gpu group-hover:scale-110 group-hover:translate-x-1">
                        
                        <div class="absolute inset-0 flex flex-col justify-end p-4 text-center opacity-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                            <h3 class="font-title text-xl text-white drop-shadow-lg">${product.name}</h3>
                            <p class="text-3xl font-extrabold neon-accent-text drop-shadow-xl my-1">$${product.price.toFixed(2)}</p>
                            
                            <button class="add-to-cart-btn mt-3 w-full py-2 rounded-full text-black font-bold bg-neon-accent shadow-lg shadow-neon-accent/30 hover:bg-yellow-300 transition-all duration-300 pulse-on-hover" data-id="${product.id}">
                                <i class="fas fa-shopping-cart mr-2"></i> Añadir
                            </button>
                        </div>
                    </div>

                    <div class="flex justify-center gap-2 p-2 pt-3">
                        ${thumbnails}
                    </div>
                </div>

                <div class="p-4 pt-0 text-center transition-opacity duration-300 group-hover:opacity-0 group-hover:h-0 group-hover:p-0">
                    <h3 class="text-lg font-title text-gray-100 mb-1 truncate">${product.name}</h3>
                    <p class="text-xl font-bold neon-accent-text">$${product.price.toFixed(2)}</p>
                </div>
                
            </div>
        `;
        
        DOMElements.productList.appendChild(card);
    });

    observeProductCards();
    initCardInteractions(); // INICIALIZA LAS NUEVAS INTERACCIONES
}

        // (El listener de productList se mueve a renderProducts)
        


        DOMElements.scrollIndicator.addEventListener('click', () => {
            if (window.scrollY > 100) { window.scrollTo({ top: 0, behavior: 'smooth' }); } 
            else { DOMElements.store.scrollIntoView({ behavior: 'smooth' }); }
        });
        
        DOMElements.verColeccionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            DOMElements.store.scrollIntoView({ behavior: 'smooth' });
        });

        observeProductCards(); 

        const whatsappMessage = encodeURIComponent("Hola Key Option, tengo una consulta.");
        DOMElements.whatsappButton.href = `https://wa.me/${storePhoneNumber}?text=${whatsappMessage}`;

        // LISTENERS PARA FILTROS
        if(DOMElements.searchInput) {
            DOMElements.searchInput.addEventListener('input', (e) => {
                AppState.searchTerm = e.target.value.toLowerCase();
                renderProducts(); 
            });
        }
        
        if(DOMElements.categorySelect) {
            DOMElements.categorySelect.addEventListener('change', (e) => {
                AppState.activeCategory = e.target.value; // El valor del select (ID o 'all')
                renderProducts(); 
            });
        }

        // Scroll (Efecto Shatter y flecha)
        let hasShattered = false;
        window.addEventListener('scroll', () => {
            if (!DOMElements.heroSection) return; 
            const scrollPosition = window.scrollY;
            const heroHeight = DOMElements.heroSection.offsetHeight;
            
            DOMElements.scrollArrow.classList.toggle('rotate-180', scrollPosition > heroHeight * 0.5);

            const shatterPoint = heroHeight * 0.7;
            if (scrollPosition > shatterPoint && !hasShattered) {
                triggerShatter();
                hasShattered = true;
            }

            if (scrollPosition < 100 && hasShattered) {
                hasShattered = false;
                document.body.classList.remove('has-shattered');
                if (DOMElements.heroContent) DOMElements.heroContent.classList.remove('is-shattering');
            }
        });
    }
    // --- REFERENCIAS NUEVAS ---
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModal = document.getElementById('closeCheckoutModal');
const cancelCheckout = document.getElementById('cancelCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const confirmCheckout = document.getElementById('confirmCheckout');

// --- 1) Abrir modal desde el botón Finalizar pedido (mantener botón en carrito) ---
DOMElements.checkoutBtn.addEventListener('click', async () => {
    if (!AppState.cart || AppState.cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    // Mostrar modal
    checkoutModal.classList.remove('hidden');
});

// --- 2) Cerrar modal ---
closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.add('hidden'));
cancelCheckout.addEventListener('click', () => checkoutModal.classList.add('hidden'));

// --- 3) Manejar envío del formulario de checkout ---
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación HTML5 básica
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }

    const name = document.getElementById("clientName").value.trim();
    const email = document.getElementById("clientEmail").value.trim();
    const address = document.getElementById("clientAddress").value.trim();
    const pagoInput = document.querySelector('input[name="pago"]:checked');
    const pago = pagoInput ? pagoInput.value : 'No especificado';

    // Prevenir pedidos vacíos
    if (!AppState.cart || AppState.cart.length === 0) {
        alert("Tu carrito está vacío.");
        checkoutModal.classList.add('hidden');
        return;
    }

    // Construir items con la forma esperada por el backend
    // (usa id, name, price, quantity, size)
    // Si tu AppState.cart no tiene name/price, tratamos de obtener del catálogo
    const products = await getProducts();
    const items = AppState.cart.map(ci => {
        const prod = products.find(p => p.id === ci.id) || {};
        return {
            productId: ci.id,
            name: prod.name || ci.name || 'Producto',
            price: Number(prod.price || ci.price || 0),
            quantity: Number(ci.quantity || 1),
            size: ci.size || ''
        };
    });

    // Crear objeto orden — forzamos status = 'pendiente'
    const orderData = {
        customerName: name,
        customerEmail: email,
        customerAddress: address,
        status: "pendiente",
        items
    };

    try {
        // 1) Guardar pedido en BD
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) {
            const err = await res.json().catch(()=>({message:'Error desconocido'}));
            throw new Error(err.message || 'Error guardando pedido');
        }

        const newOrder = await res.json();
        const orderId = newOrder.id;

        // 2) Descargar automáticamente el PDF (endpoint ya existente)
        const pdfUrl = `/api/orders/invoice/${orderId}`;
        // Forzar descarga
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `Factura_TRK-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 3) Abrir WhatsApp con mensaje formal e incluir TRK y método de pago
        const whatsappNumber = "18099881192";
        const message = `Buen día, adjunto los datos de mi pedido.
Pedido: TRK-${orderId}
Método de pago: ${pago}
Nombre: ${name}
Email: ${email}
Dirección: ${address}
Factura descargada. Quedo atento a la confirmación.`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        // 4) Cerrar modal, limpiar carrito y actualizar UI
        checkoutModal.classList.add('hidden');
        AppState.cart = []; // limpiar carrito en memoria
        localStorage.removeItem('cart'); // si usas localStorage
        await updateCartView();
        toggleCartPanel(false);

        // Feedback visual
        alert(`Pedido creado: TRK-${orderId}. Se ha descargado la factura y se abrió WhatsApp.`);
    } catch (error) {
        console.error("Error en checkout:", error);
        alert(`No se pudo crear el pedido: ${error.message}`);
    }
});
document.addEventListener('DOMContentLoaded', initialize);
    </script>


<script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'neon-accent': '#FFDE4D',
                        'dark-bg': '#0D0D0D',
                        'card-bg': '#1A1A1A',
                    },
                }
            }
        }
    // ---------------- Chat UI Logic ----------------
const chatBtn = document.getElementById('chatbot-button');
const chatModal = document.getElementById('chatbot-modal');
const closeChat = document.getElementById('close-chatbot');
const chatMessages = document.getElementById('chatbot-messages');
const chatInput = document.getElementById('chatbot-input');
const chatSend = document.getElementById('chatbot-send');

function openChat() {
  chatModal.style.display = 'flex';
  chatModal.setAttribute('aria-hidden', 'false');
  chatInput.focus();
}
function closeChatModal() {
  chatModal.style.display = 'none';
  chatModal.setAttribute('aria-hidden', 'true');
}

// add message (type: 'user' | 'bot')
function addMessage(text, type = 'bot', opts = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = `msg ${type}`;

  if (opts.isProduct && opts.product) {
    wrapper.innerHTML = `
      <div class="product-mini">
        <img src="${
          opts.product.images?.[0] || 
          'https://placehold.co/200x300/111827/fff?text=No+Image'
        }" alt="${opts.product.name}">
        <div class="pinfo">
          <div>${opts.product.name}</div>
          <div class="price">$${Number(opts.product.price).toFixed(2)}</div>
          <div class="meta">Stock: ${opts.product.stock}</div>
        </div>
      </div>
    `;
  } else {
    wrapper.innerHTML = text;
    if (opts.meta) {
      const m = document.createElement('span');
      m.className = 'meta';
      m.textContent = opts.meta;
      wrapper.appendChild(m);
    }
  }

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight + 100;
}


// typing indicator
function addTyping() {
  const t = document.createElement('div');
  t.className = 'msg bot typing';
  t.id = 'typing-indicator';
  t.innerHTML = `<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  chatMessages.appendChild(t);
  chatMessages.scrollTop = chatMessages.scrollHeight + 100;
}
function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

// send to backend
async function sendToBackend(message) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Error en servidor');
    return await res.json();
  } catch (err) {
    console.error('Chat error', err);
    return { reply: 'Lo siento, hubo un problema con el servidor. Intenta más tarde.' };
  }
}

async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  chatInput.value = '';
  addTyping();

  const data = await sendToBackend(text);
  removeTyping();

  // Si tu backend devuelve un objeto con products (opcional),
  // dejamos que muestre tarjetas de producto automáticamente.
  // Ejemplo: { reply: "ok", products: [{name, price, stock, image}, ...] }
  if (data.products && Array.isArray(data.products) && data.products.length) {
    addMessage(data.reply || 'Encontré estos productos:', 'bot');
    data.products.forEach(p => addMessage('', 'bot', { isProduct: true, product: p }));
    return;
  }

  // Si la respuesta es texto simple:
  addMessage(data.reply ?? 'No obtuve respuesta.');
}

chatBtn.addEventListener('click', openChat);
closeChat.addEventListener('click', closeChatModal);
chatSend.addEventListener('click', handleSend);

// enviar con Enter
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSend();
  }
});

// cerrar modal con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatModal.style.display === 'flex') {
    closeChatModal();
  }
});

    </script>