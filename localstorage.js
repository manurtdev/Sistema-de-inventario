// ============================================
// SISTEMA DE PERSISTENCIA - localStorage.js
// ============================================

class InventarioStorage {
  constructor() {
    this.initializeStorage();
  }

  // Inicializar datos si no existen
  initializeStorage() {
    if (!localStorage.getItem("inventarioApp")) {
      const initialData = {
        users: [
          {
            id: 1,
            nombre: "Administrador",
            email: "admin@empresa.com",
            password: "admin123",
            rol: "admin",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          },
          {
            id: 2,
            nombre: "Empleado Demo",
            email: "empleado@empresa.com",
            password: "emp123",
            rol: "empleado",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          },
        ],
        categories: [
          {
            id: 1,
            nombre: "Electrónica",
            descripcion: "Productos electrónicos",
          },
          { id: 2, nombre: "Ropa", descripcion: "Prendas de vestir" },
          { id: 3, nombre: "Alimentos", descripcion: "Productos alimenticios" },
        ],
        products: [
          {
            id: 1,
            codigo: "PROD001",
            nombre: "Laptop",
            categoriaId: 1,
            stock: 15,
            precio: 899.99,
            minStock: 5,
            descripcion: "Laptop de 15 pulgadas",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          },
          {
            id: 2,
            codigo: "PROD002",
            nombre: "Mouse",
            categoriaId: 1,
            stock: 50,
            precio: 29.99,
            minStock: 20,
            descripcion: "Mouse inalámbrico",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          },
          {
            id: 3,
            codigo: "PROD003",
            nombre: "Camiseta",
            categoriaId: 2,
            stock: 8,
            precio: 19.99,
            minStock: 15,
            descripcion: "Camiseta de algodón",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          },
        ],
        movements: [
          {
            id: 1,
            productId: 1,
            tipo: "entrada",
            cantidad: 10,
            usuarioId: 1,
            descripcion: "Compra inicial",
            fecha: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 2,
            productId: 2,
            tipo: "entrada",
            cantidad: 50,
            usuarioId: 1,
            descripcion: "Compra proveedor",
            fecha: new Date(Date.now() - 43200000).toISOString(),
          },
        ],
        currentUser: null,
        nextProductId: 4,
        nextMovementId: 3,
        nextCategoryId: 4,
        nextUserId: 3,
      };
      localStorage.setItem("inventarioApp", JSON.stringify(initialData));
    }
  }

  // Obtener todos los datos
  getData() {
    const data = localStorage.getItem("inventarioApp");
    return data ? JSON.parse(data) : null;
  }

  // Guardar todos los datos
  saveData(data) {
    localStorage.setItem("inventarioApp", JSON.stringify(data));
  }

  // ==================== USUARIOS ====================
  checkLogin(email, password) {
    const data = this.getData();
    const user = data.users.find(
      (u) => u.email === email && u.password === password && u.activo,
    );
    return user
      ? { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
      : null;
  }

  setCurrentUser(user) {
    const data = this.getData();
    data.currentUser = user;
    this.saveData(data);
  }

  getCurrentUser() {
    const data = this.getData();
    return data.currentUser;
  }

  logout() {
    const data = this.getData();
    data.currentUser = null;
    this.saveData(data);
  }

  // ==================== CATEGORÍAS ====================
  getCategories() {
    const data = this.getData();
    return data.categories || [];
  }

  addCategory(nombre, descripcion) {
    const data = this.getData();
    const newCategory = {
      id: data.nextCategoryId++,
      nombre,
      descripcion,
    };
    data.categories.push(newCategory);
    this.saveData(data);
    return newCategory;
  }

  updateCategory(id, nombre, descripcion) {
    const data = this.getData();
    const category = data.categories.find((c) => c.id === id);
    if (category) {
      category.nombre = nombre;
      category.descripcion = descripcion;
      this.saveData(data);
      return true;
    }
    return false;
  }

  deleteCategory(id) {
    const data = this.getData();
    const index = data.categories.findIndex((c) => c.id === id);
    if (index > -1) {
      // Verificar si hay productos en esta categoría
      const productsInCategory = data.products.filter(
        (p) => p.categoriaId === id,
      );
      if (productsInCategory.length === 0) {
        data.categories.splice(index, 1);
        this.saveData(data);
        return true;
      }
    }
    return false;
  }

  getCategoryById(id) {
    const data = this.getData();
    return data.categories.find((c) => c.id === id);
  }

  // ==================== PRODUCTOS ====================
  getProducts(active = true) {
    const data = this.getData();
    return active ? data.products.filter((p) => p.activo) : data.products;
  }

  addProduct(
    codigo,
    nombre,
    categoriaId,
    stock,
    precio,
    minStock,
    descripcion,
  ) {
    const data = this.getData();

    // Validar que el código sea único
    if (data.products.find((p) => p.codigo === codigo)) {
      throw new Error("El código del producto ya existe");
    }

    const newProduct = {
      id: data.nextProductId++,
      codigo,
      nombre,
      categoriaId,
      stock: parseInt(stock),
      precio: parseFloat(precio),
      minStock: parseInt(minStock),
      descripcion,
      activo: true,
      fechaCreacion: new Date().toISOString(),
    };
    data.products.push(newProduct);
    this.saveData(data);
    return newProduct;
  }

  updateProduct(
    id,
    codigo,
    nombre,
    categoriaId,
    precio,
    minStock,
    descripcion,
  ) {
    const data = this.getData();
    const product = data.products.find((p) => p.id === id);

    if (product) {
      // Validar que el código sea único (excepto para el mismo producto)
      if (data.products.find((p) => p.codigo === codigo && p.id !== id)) {
        throw new Error("El código del producto ya existe");
      }

      product.codigo = codigo;
      product.nombre = nombre;
      product.categoriaId = categoriaId;
      product.precio = parseFloat(precio);
      product.minStock = parseInt(minStock);
      product.descripcion = descripcion;
      this.saveData(data);
      return true;
    }
    return false;
  }

  deleteProduct(id) {
    const data = this.getData();
    const product = data.products.find((p) => p.id === id);
    if (product) {
      product.activo = false; // Soft delete
      this.saveData(data);
      return true;
    }
    return false;
  }

  getProductById(id) {
    const data = this.getData();
    return data.products.find((p) => p.id === id);
  }

  getProductByCodigo(codigo) {
    const data = this.getData();
    return data.products.find((p) => p.codigo === codigo && p.activo);
  }

  // ==================== MOVIMIENTOS ====================
  addMovement(productId, tipo, cantidad, usuarioId, descripcion = "") {
    const data = this.getData();
    const product = data.products.find((p) => p.id === productId);

    if (!product) {
      throw new Error("Producto no encontrado");
    }

    // Validaciones
    if (tipo === "salida" && product.stock < cantidad) {
      throw new Error(`Stock insuficiente. Stock disponible: ${product.stock}`);
    }

    if (cantidad <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    // Actualizar stock
    if (tipo === "entrada") {
      product.stock += parseInt(cantidad);
    } else if (tipo === "salida") {
      product.stock -= parseInt(cantidad);
    } else if (tipo === "ajuste") {
      // Para ajuste, cantidad puede ser positiva o negativa
      product.stock += parseInt(cantidad);
      if (product.stock < 0) product.stock = 0;
    }

    // Registrar movimiento
    const newMovement = {
      id: data.nextMovementId++,
      productId,
      tipo,
      cantidad: parseInt(cantidad),
      usuarioId,
      descripcion,
      fecha: new Date().toISOString(),
    };

    data.movements.push(newMovement);
    this.saveData(data);
    return newMovement;
  }

  getMovements(limit = null) {
    const data = this.getData();
    let movements = [...data.movements].reverse(); // Más recientes primero

    if (limit) {
      movements = movements.slice(0, limit);
    }

    return movements;
  }

  getMovementsByProduct(productId) {
    const data = this.getData();
    return data.movements.filter((m) => m.productId === productId).reverse();
  }

  getMovementsByType(tipo) {
    const data = this.getData();
    return data.movements.filter((m) => m.tipo === tipo).reverse();
  }

  // ==================== REPORTES ====================
  getProductsWithLowStock() {
    const data = this.getData();
    return data.products.filter((p) => p.activo && p.stock <= p.minStock);
  }

  getTotalInventoryValue() {
    const data = this.getData();
    return data.products
      .filter((p) => p.activo)
      .reduce((total, p) => total + p.stock * p.precio, 0);
  }

  getMostMovedProducts(limit = 5) {
    const data = this.getData();
    const movementsByProduct = {};

    data.movements.forEach((m) => {
      movementsByProduct[m.productId] =
        (movementsByProduct[m.productId] || 0) + m.cantidad;
    });

    return Object.entries(movementsByProduct)
      .map(([productId, totalMovements]) => ({
        product: data.products.find((p) => p.id === parseInt(productId)),
        totalMovements,
      }))
      .filter((item) => item.product && item.product.activo)
      .sort((a, b) => b.totalMovements - a.totalMovements)
      .slice(0, limit);
  }

  getStatisticsByCategory() {
    const data = this.getData();
    const stats = {};

    data.categories.forEach((cat) => {
      const products = data.products.filter(
        (p) => p.categoriaId === cat.id && p.activo,
      );
      stats[cat.id] = {
        id: cat.id,
        nombre: cat.nombre,
        totalProductos: products.length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        valorTotal: products.reduce((sum, p) => sum + p.stock * p.precio, 0),
      };
    });

    return stats;
  }

  // ==================== UTILIDADES ====================
  getUserById(id) {
    const data = this.getData();
    return data.users.find((u) => u.id === id);
  }

  getMovementStats() {
    const data = this.getData();
    const entries = data.movements.filter((m) => m.tipo === "entrada").length;
    const exits = data.movements.filter((m) => m.tipo === "salida").length;

    return {
      totalMovements: data.movements.length,
      entries,
      exits,
      adjustments: data.movements.filter((m) => m.tipo === "ajuste").length,
    };
  }

  searchProducts(query) {
    const data = this.getData();
    return data.products.filter(
      (p) =>
        p.activo &&
        (p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          p.codigo.toLowerCase().includes(query.toLowerCase()) ||
          p.descripcion.toLowerCase().includes(query.toLowerCase())),
    );
  }

  searchMovements(query) {
    const data = this.getData();
    return data.movements
      .filter((m) => {
        const product = data.products.find((p) => p.id === m.productId);
        const user = data.users.find((u) => u.id === m.usuarioId);
        return (
          (product &&
            product.nombre.toLowerCase().includes(query.toLowerCase())) ||
          (user && user.nombre.toLowerCase().includes(query.toLowerCase())) ||
          m.descripcion.toLowerCase().includes(query.toLowerCase())
        );
      })
      .reverse();
  }

  exportMovementsCSV() {
    const data = this.getData();
    let csv = "Fecha,Producto,Tipo,Cantidad,Usuario,Descripción\n";

    data.movements.forEach((m) => {
      const product = data.products.find((p) => p.id === m.productId);
      const user = data.users.find((u) => u.id === m.usuarioId);
      const fecha = new Date(m.fecha).toLocaleString("es-ES");

      csv += `"${fecha}","${product?.nombre || "N/A"}","${m.tipo}","${m.cantidad}","${user?.nombre || "N/A"}","${m.descripcion}"\n`;
    });

    return csv;
  }
}

// Crear instancia global
const storage = new InventarioStorage();
