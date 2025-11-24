## Descripción del Proyecto

Key Option Store es una aplicación de comercio electrónico para gestión de inventario con una tienda para clientes y un panel de administración. El stack utiliza:
- **Backend**: Node.js con Express
- **Base de Datos**: MongoDB (Atlas o local) via Mongoose ODM
- **Frontend**: JavaScript vanilla con Tailwind CSS
- **Arquitectura**: Monolítica con carpetas separadas frontend/backend

## Comandos de Desarrollo

### Ejecutar la Aplicación
```bash
# Modo desarrollo con auto-recarga
npm run dev

# Modo producción
npm start
```

El servidor se ejecuta en el puerto 4000 por defecto (configurable mediante variable PORT en .env).

### Acceso a la Aplicación
- Tienda de clientes: http://localhost:4000/
- Panel de administración: http://localhost:4000/admin
  - Credenciales por defecto: usuario `admin`, contraseña `1234`

## Arquitectura

### Estructura del Backend (`backend/`)

**Punto de Entrada**: `backend/server.js`
- Inicializa la conexión a MongoDB mediante `connectDB()`
- Configura middleware de Express (CORS, parsing JSON)
- Sirve archivos estáticos desde directorios `frontend/` y raíz
- Define rutas de API REST para productos, pedidos, categorías y tallas

**Capa de Base de Datos**: `backend/config/db.js`
- Maneja la conexión a MongoDB usando Mongoose
- Usa `MONGO_URI` del archivo .env (soporta conexiones Atlas y locales)

**Lógica de Negocio**: `backend/api/crud.js`
- Contiene todas las operaciones CRUD para Productos, Pedidos, Categorías y Tallas
- Implementa sistema de IDs numéricos personalizados junto con ObjectId de MongoDB
- Auto-genera IDs secuenciales: Productos comienzan en 1, Pedidos comienzan en 1001
- **Gestión de Inventario**: Los nuevos pedidos decrementan automáticamente el stock de productos; valida disponibilidad de stock antes de crear el pedido
- **Seguimiento de Pedidos**: Auto-genera números de seguimiento en formato `TRK-{orderId}` si no se proporciona

**Modelos de Datos**: `backend/models/`
- `Product.js`: Incluye `id` numérico, `categoryId` (Number), `sizeIds` (Array de Numbers), seguimiento de stock
- `Order.js`: Contiene `OrderItemSchema` embebido, flujo de estados, número de seguimiento
- `Category.js`: Esquema simple id/name
- `Size.js`: Esquema simple id/name

### Estructura del Frontend (`frontend/`)

**Tienda de Clientes**: `index.html`
- Diseño de página única con sección hero sticky
- Tailwind CSS para estilos con tema personalizado neon-accent (#FFDE4D)
- Fuentes personalizadas: "Frijole" para logo, "Carter One" para títulos, "Inter" para texto
- Características: catálogo de productos, carrito de compras, integración con WhatsApp

**Panel de Administración**: `admin.html` + `admin.js`
- Dashboard con KPIs (ventas totales, pedidos pendientes, stock crítico)
- Gestión de productos (CRUD con soporte de imágenes, asignación de categoría/tallas)
- Gestión de pedidos (CRUD con seguimiento de estado, validación de stock)
- Autenticación mediante credenciales hardcodeadas en `admin.js`
- Gestión de estado del lado del cliente mediante objeto `AppState`

### Endpoints de la API

Todos los endpoints son asíncronos y retornan respuestas JSON.

**Productos**:
- `GET /api/products` - Obtener todos los productos (ordenados por id ascendente)
- `POST /api/products` - Crear o actualizar producto (determinado por presencia del campo `id`)
- `DELETE /api/products/:id` - Eliminar producto por id numérico

**Pedidos**:
- `GET /api/orders` - Obtener todos los pedidos (ordenados por id descendente, más nuevos primero)
- `POST /api/orders` - Crear o actualizar pedido
  - Nuevos pedidos: Valida stock, decrementa inventario, auto-genera número de seguimiento
  - Actualizaciones: Modifica pedido existente sin cambios de stock
  - Retorna error 400 si hay stock insuficiente
- `DELETE /api/orders/:id` - Eliminar pedido (NO restaura el stock)

**Categorías**: `GET /api/categories` - Obtener todas las categorías (ordenadas alfabéticamente)

**Tallas**: `GET /api/sizes` - Obtener todas las tallas (ordenadas alfabéticamente)

## Detalles Clave de Implementación

### Gestión de IDs
- Productos y Pedidos usan un sistema de ID dual: `_id` de MongoDB (ObjectId) y campo `id` numérico personalizado
- Los IDs personalizados se auto-incrementan encontrando el `id` más alto existente y sumando 1
- El frontend usa el `id` numérico para visualización y operaciones; el `_id` de MongoDB es transparente

### Validación de Stock
- La verificación de stock ocurre en la función `saveOrder()` en `crud.js` (backend/api/crud.js:67-88)
- Solo los nuevos pedidos activan la validación y decremento de stock
- Si algún artículo tiene stock insuficiente, todo el pedido falla con un error descriptivo
- El stock se decrementa usando el operador `$inc` de MongoDB para atomicidad

### Relaciones de Datos
- Los productos referencian Categorías y Tallas por IDs numéricos (no referencias ObjectId)
- Los pedidos embeben datos completos de items (productId, name, quantity, size) en lugar de referenciar Productos
- Esta desnormalización permite que los pedidos preserven info de productos incluso si los productos son modificados/eliminados después

## Configuración del Entorno

Variables requeridas en `.env`:
```
MONGO_URI=<cadena de conexión MongoDB>
PORT=4000  # Opcional, por defecto 4000
```

El archivo `.env` contiene credenciales de base de datos y nunca debe ser commiteado. MongoDB puede ser local (`mongodb://localhost:27017/...`) o instancia cloud de Atlas.
