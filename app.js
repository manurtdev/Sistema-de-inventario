// ============================================
// LÓGICA PRINCIPAL - app.js
// ============================================

class InventarioApp {
  constructor() {
    this.currentUser = null;
    this.currentView = "dashboard";
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAuth();
  }

  setupEventListeners() {
    // Login
    document
      .getElementById("loginForm")
      .addEventListener("submit", (e) => this.handleLogin(e));
    document
      .getElementById("logoutBtn")
      .addEventListener("click", () => this.handleLogout());

    // Navigation
    document.querySelectorAll("[data-view]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const view = e.currentTarget.getAttribute("data-view");
        this.switchView(view);
        this.updateActiveNavLink(link);
      });
    });

    // Productos (Admin)
    document
      .getElementById("saveProductBtn")
      .addEventListener("click", () => this.saveProduct());
    document
      .getElementById("filtroProductos")
      .addEventListener("input", () => this.filtrarProductos());

    // Categorías (Admin)
    document
      .getElementById("saveCategoriaBtn")
      .addEventListener("click", () => this.saveCategory());

    // Movimientos
    document
      .getElementById("movimientoForm")
      .addEventListener("submit", (e) => this.handleMovement(e));

    // Filtros
    document
      .getElementById("filtroInventario")
      .addEventListener("input", () => this.updateInventarioView());
    document
      .getElementById("filtroCategoria")
      .addEventListener("change", () => this.updateInventarioView());
    document
      .getElementById("filtroHistorial")
      .addEventListener("input", () => this.filtrarHistorial());
    document
      .getElementById("filtroTipoMovimiento")
      .addEventListener("change", () => this.filtrarHistorial());

    // Exportar
    document
      .getElementById("btnExportarCSV")
      ?.addEventListener("click", () => this.exportarCSV());
  }

  // ==================== AUTENTICACIÓN ====================
  checkAuth() {
    const user = storage.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.showApp();
      this.updateDashboard();
    } else {
      this.showLogin();
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const user = storage.checkLogin(email, password);
    if (user) {
      this.currentUser = user;
      storage.setCurrentUser(user);
      this.showApp();
      this.updateDashboard();
      document.getElementById("loginForm").reset();
    } else {
      alert("Email o contraseña incorrectos");
    }
  }

  handleLogout() {
    storage.logout();
    this.currentUser = null;
    this.showLogin();
  }

  showLogin() {
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("appSection").style.display = "none";
  }

  showApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
    this.updateUserDisplay();
    this.updateMenuVisibility();
    this.switchView("dashboard");
  }

  updateUserDisplay() {
    document.getElementById("userDisplay").innerHTML =
      `<i class="bi bi-person-circle"></i> ${this.currentUser.nombre}`;
    document.getElementById("roleDisplay").innerHTML =
      `<span class="badge bg-info">${this.currentUser.rol === "admin" ? "Administrador" : "Empleado"}</span>`;
  }

  updateMenuVisibility() {
    const adminMenu = document.getElementById("adminMenu");
    if (this.currentUser.rol === "admin") {
      adminMenu.style.display = "block";
    } else {
      adminMenu.style.display = "none";
    }
  }

  // ==================== NAVEGACIÓN ====================
  switchView(viewName) {
    // Ocultar todas las vistas
    document.querySelectorAll(".view-section").forEach((view) => {
      view.style.display = "none";
    });

    // Validar permisos
    if (
      ["productos", "categorias", "reportes", "historial-completo"].includes(
        viewName,
      )
    ) {
      if (this.currentUser.rol !== "admin") {
        alert("No tienes permiso para acceder a esta sección");
        this.switchView("dashboard");
        return;
      }
    }

    // Mostrar vista solicitada
    this.currentView = viewName;

    switch (viewName) {
      case "dashboard":
        this.updateDashboard();
        document.getElementById("dashboardView").style.display = "block";
        break;
      case "productos":
        this.updateProductosView();
        document.getElementById("productosView").style.display = "block";
        break;
      case "categorias":
        this.updateCategoriasView();
        document.getElementById("categoriasView").style.display = "block";
        break;
      case "inventario":
        this.updateInventarioView();
        document.getElementById("inventarioView").style.display = "block";
        break;
      case "movimientos":
        this.updateMovimientosView();
        document.getElementById("movimientosView").style.display = "block";
        break;
      case "reportes":
        this.updateReportesView();
        document.getElementById("reportesView").style.display = "block";
        break;
      case "historial-completo":
        this.updateHistorialCompletoView();
        document.getElementById("historialCompletoView").style.display =
          "block";
        break;
    }
  }

  updateActiveNavLink(link) {
    document
      .querySelectorAll("[data-view]")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
  }

  // ==================== DASHBOARD ====================
  updateDashboard() {
    const products = storage.getProducts();
    const stats = storage.getMovementStats();
    const lowStockProducts = storage.getProductsWithLowStock();
    const movements = storage.getMovements(5);

    // Actualizar tarjetas
    document.getElementById("totalProductos").textContent = products.length;
    document.getElementById("totalEntradas").textContent = stats.entries;
    document.getElementById("totalSalidas").textContent = stats.exits;
    document.getElementById("bajoStock").textContent = lowStockProducts.length;

    // Últimos movimientos
    this.updateUltimosMovimientos(movements);

    // Productos con bajo stock
    this.updateBajoStockList(lowStockProducts);
  }

  updateUltimosMovimientos(movements) {
    const container = document.getElementById("ultimosMovimientos");
    container.innerHTML = "";

    if (movements.length === 0) {
      container.innerHTML = '<p class="text-muted">Sin movimientos</p>';
      return;
    }

    movements.forEach((m) => {
      const product = storage.getProductById(m.productId);
      const user = storage.getUserById(m.usuarioId);
      const fecha = new Date(m.fecha).toLocaleString("es-ES");
      const tipoLabel = this.getTipoLabel(m.tipo);
      const tipoColor = this.getTipoColor(m.tipo);

      container.innerHTML += `
                <div class="mb-2 pb-2 border-bottom">
                    <small class="text-muted">${fecha}</small>
                    <div>
                        <span class="badge bg-${tipoColor}">${tipoLabel}</span>
                        <strong>${product?.nombre || "N/A"}</strong>
                    </div>
                    <small class="text-muted">Cantidad: ${m.cantidad} | Usuario: ${user?.nombre || "N/A"}</small>
                </div>
            `;
    });
  }

  updateBajoStockList(products) {
    const container = document.getElementById("bajoStockList");
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML =
        '<p class="text-success">✓ Todos los productos tienen stock suficiente</p>';
      return;
    }

    products.forEach((p) => {
      const category = storage.getCategoryById(p.categoriaId);
      container.innerHTML += `
                <div class="alert alert-warning mb-2" role="alert">
                    <strong>${p.nombre}</strong><br>
                    <small>Stock: ${p.stock}/${p.minStock} | ${category?.nombre || "Sin categoría"}</small>
                </div>
            `;
    });
  }

  // ==================== PRODUCTOS ====================
  updateProductosView() {
    this.loadProductCategories();
    this.renderProductosTable(storage.getProducts());
  }

  loadProductCategories() {
    const select = document.getElementById("productCategoria");
    const categories = storage.getCategories();

    select.innerHTML = '<option value="">Seleccionar categoría...</option>';
    categories.forEach((cat) => {
      select.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
    });
  }

  renderProductosTable(products) {
    const tbody = document.getElementById("productosTableBody");
    tbody.innerHTML = "";

    products.forEach((p) => {
      const category = storage.getCategoryById(p.categoriaId);
      const badge =
        p.stock <= p.minStock
          ? '<span class="badge bg-danger">Bajo Stock</span>'
          : "";

      tbody.innerHTML += `
                <tr>
                    <td><strong>${p.codigo}</strong></td>
                    <td>${p.nombre} ${badge}</td>
                    <td>${category?.nombre || "Sin categoría"}</td>
                    <td>${p.stock}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${p.minStock}</td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="app.editProduct(${p.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteProduct(${p.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
    });
  }

  filtrarProductos() {
    const query = document.getElementById("filtroProductos").value;
    const filtered = storage.searchProducts(query);
    this.renderProductosTable(filtered);
  }

  saveProduct() {
    const productId = document.getElementById("productId").value;
    const codigo = document.getElementById("productCodigo").value;
    const nombre = document.getElementById("productNombre").value;
    const categoriaId = parseInt(
      document.getElementById("productCategoria").value,
    );
    const stock = document.getElementById("productStock").value;
    const precio = document.getElementById("productPrecio").value;
    const minStock = document.getElementById("productMinStock").value;
    const descripcion = document.getElementById("productDescripcion").value;

    try {
      if (productId) {
        // Editar
        storage.updateProduct(
          parseInt(productId),
          codigo,
          nombre,
          categoriaId,
          precio,
          minStock,
          descripcion,
        );
        alert("Producto actualizado exitosamente");
      } else {
        // Crear
        storage.addProduct(
          codigo,
          nombre,
          categoriaId,
          stock,
          precio,
          minStock,
          descripcion,
        );
        alert("Producto creado exitosamente");
      }

      this.clearProductForm();
      bootstrap.Modal.getInstance(
        document.getElementById("productModal"),
      ).hide();
      this.updateProductosView();
      this.updateMovimientosView();
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  editProduct(productId) {
    const product = storage.getProductById(productId);
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("productCodigo").value = product.codigo;
    document.getElementById("productNombre").value = product.nombre;
    document.getElementById("productCategoria").value = product.categoriaId;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productPrecio").value = product.precio;
    document.getElementById("productMinStock").value = product.minStock;
    document.getElementById("productDescripcion").value = product.descripcion;

    document.getElementById("productModalTitle").textContent =
      "Editar Producto";
    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();
  }

  deleteProduct(productId) {
    if (confirm("¿Está seguro de que desea eliminar este producto?")) {
      storage.deleteProduct(productId);
      alert("Producto eliminado exitosamente");
      this.updateProductosView();
    }
  }

  clearProductForm() {
    document.getElementById("productId").value = "";
    document.getElementById("productCodigo").value = "";
    document.getElementById("productNombre").value = "";
    document.getElementById("productCategoria").value = "";
    document.getElementById("productStock").value = "0";
    document.getElementById("productPrecio").value = "";
    document.getElementById("productMinStock").value = "10";
    document.getElementById("productDescripcion").value = "";
    document.getElementById("productModalTitle").textContent = "Nuevo Producto";
  }

  // ==================== CATEGORÍAS ====================
  updateCategoriasView() {
    const categories = storage.getCategories();
    const grid = document.getElementById("categoriasGrid");
    grid.innerHTML = "";

    categories.forEach((cat) => {
      const productCount = storage
        .getProducts()
        .filter((p) => p.categoriaId === cat.id).length;
      grid.innerHTML += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${cat.nombre}</h5>
                            <p class="card-text text-muted">${cat.descripcion}</p>
                            <small class="text-info">Productos: ${productCount}</small>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-warning" onclick="app.editCategory(${cat.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteCategory(${cat.id})">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    });
  }

  saveCategory() {
    const categoryId = document.getElementById("categoriaId").value;
    const nombre = document.getElementById("categoriaNombre").value;
    const descripcion = document.getElementById("categoriaDescripcion").value;

    try {
      if (categoryId) {
        storage.updateCategory(parseInt(categoryId), nombre, descripcion);
        alert("Categoría actualizada exitosamente");
      } else {
        storage.addCategory(nombre, descripcion);
        alert("Categoría creada exitosamente");
      }

      this.clearCategoryForm();
      bootstrap.Modal.getInstance(
        document.getElementById("categoriaModal"),
      ).hide();
      this.updateCategoriasView();
      this.loadProductCategories();
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  editCategory(categoryId) {
    const category = storage.getCategoryById(categoryId);
    if (!category) return;

    document.getElementById("categoriaId").value = category.id;
    document.getElementById("categoriaNombre").value = category.nombre;
    document.getElementById("categoriaDescripcion").value =
      category.descripcion;

    document.getElementById("categoriaModalTitle").textContent =
      "Editar Categoría";
    const modal = new bootstrap.Modal(
      document.getElementById("categoriaModal"),
    );
    modal.show();
  }

  deleteCategory(categoryId) {
    if (confirm("¿Está seguro de que desea eliminar esta categoría?")) {
      if (storage.deleteCategory(categoryId)) {
        alert("Categoría eliminada exitosamente");
        this.updateCategoriasView();
        this.loadProductCategories();
      } else {
        alert("No se puede eliminar - hay productos en esta categoría");
      }
    }
  }

  clearCategoryForm() {
    document.getElementById("categoriaId").value = "";
    document.getElementById("categoriaNombre").value = "";
    document.getElementById("categoriaDescripcion").value = "";
    document.getElementById("categoriaModalTitle").textContent =
      "Nueva Categoría";
  }

  // ==================== INVENTARIO ====================
  updateInventarioView() {
    const filtro = document.getElementById("filtroInventario").value;
    const categoria = document.getElementById("filtroCategoria").value;
    let products = storage.getProducts();

    // Listar categorías
    const categories = storage.getCategories();
    const categorySelect = document.getElementById("filtroCategoria");
    if (categorySelect.children.length === 1) {
      categories.forEach((cat) => {
        categorySelect.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
      });
    }

    // Filtrar
    if (filtro) {
      products = products.filter(
        (p) =>
          p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
          p.codigo.toLowerCase().includes(filtro.toLowerCase()),
      );
    }

    if (categoria) {
      products = products.filter((p) => p.categoriaId === parseInt(categoria));
    }

    this.renderInventarioTable(products);
  }

  renderInventarioTable(products) {
    const tbody = document.getElementById("inventarioTableBody");
    tbody.innerHTML = "";

    products.forEach((p) => {
      const category = storage.getCategoryById(p.categoriaId);
      const estado =
        p.stock > p.minStock
          ? '<span class="badge bg-success">Disponible</span>'
          : '<span class="badge bg-danger">Bajo Stock</span>';

      tbody.innerHTML += `
                <tr>
                    <td><strong>${p.codigo}</strong></td>
                    <td>${p.nombre}</td>
                    <td>${category?.nombre || "Sin categoría"}</td>
                    <td>${p.stock}</td>
                    <td>${p.minStock}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${estado}</td>
                </tr>
            `;
    });
  }

  // ==================== MOVIMIENTOS ====================
  updateMovimientosView() {
    const select = document.getElementById("movProducto");
    const products = storage.getProducts();

    select.innerHTML = '<option value="">Seleccionar producto...</option>';
    products.forEach((p) => {
      select.innerHTML += `<option value="${p.id}">${p.codigo} - ${p.nombre}</option>`;
    });

    this.updateMovimientosRecientes();
  }

  handleMovement(e) {
    e.preventDefault();

    const productId = parseInt(document.getElementById("movProducto").value);
    const tipo = document.getElementById("movTipo").value;
    const cantidad = parseInt(document.getElementById("movCantidad").value);
    const descripcion = document.getElementById("movDescripcion").value;

    try {
      storage.addMovement(
        productId,
        tipo,
        cantidad,
        this.currentUser.id,
        descripcion,
      );
      alert("Movimiento registrado exitosamente");
      document.getElementById("movimientoForm").reset();
      this.updateMovimientosRecientes();
      this.updateDashboard();
      this.updateInventarioView();
    } catch (error) {
      alert("Error: " + error.message);
    }
  }

  updateMovimientosRecientes() {
    const container = document.getElementById("movimientosRecientes");
    const movements = storage.getMovements(10);
    container.innerHTML = "";

    if (movements.length === 0) {
      container.innerHTML =
        '<p class="text-muted">Sin movimientos registrados</p>';
      return;
    }

    movements.forEach((m) => {
      const product = storage.getProductById(m.productId);
      const user = storage.getUserById(m.usuarioId);
      const fecha = new Date(m.fecha).toLocaleString("es-ES");
      const tipoLabel = this.getTipoLabel(m.tipo);
      const tipoColor = this.getTipoColor(m.tipo);
      const icono = this.getTipoIcono(m.tipo);

      container.innerHTML += `
                <div class="mb-3 pb-3 border-bottom">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <small class="text-muted">${fecha}</small><br>
                            <strong>${product?.nombre || "N/A"}</strong>
                        </div>
                        <span class="badge bg-${tipoColor}">${icono} ${tipoLabel}</span>
                    </div>
                    <small class="text-muted">Cantidad: ${m.cantidad} | Usuario: ${user?.nombre}</small>
                    ${m.descripcion ? `<div class="mt-1"><small>${m.descripcion}</small></div>` : ""}
                </div>
            `;
    });
  }

  // ==================== REPORTES ====================
  updateReportesView() {
    this.updateProductosMasMovidos();
    this.updateValorTotalInventario();
    this.updateResumenCategorias();
  }

  updateProductosMasMovidos() {
    const container = document.getElementById("productosMasMovidos");
    const products = storage.getMostMovedProducts(5);
    container.innerHTML = "";

    if (products.length === 0) {
      container.innerHTML = '<p class="text-muted">Sin movimientos</p>';
      return;
    }

    let html = '<table class="table table-sm"><tbody>';
    products.forEach((item, index) => {
      html += `
                <tr>
                    <td><strong>${index + 1}. ${item.product.nombre}</strong></td>
                    <td><span class="badge bg-primary">${item.totalMovements}</span></td>
                </tr>
            `;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  }

  updateValorTotalInventario() {
    const valor = storage.getTotalInventoryValue();
    document.getElementById("valorTotalInventario").textContent =
      `$${valor.toFixed(2)}`;
  }

  updateResumenCategorias() {
    const container = document.getElementById("resumenCategorias");
    const stats = storage.getStatisticsByCategory();
    container.innerHTML = "";

    let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Productos</th>
                        <th>Total Stock</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

    Object.values(stats).forEach((stat) => {
      html += `
                <tr>
                    <td><strong>${stat.nombre}</strong></td>
                    <td>${stat.totalProductos}</td>
                    <td>${stat.totalStock}</td>
                    <td>$${stat.valorTotal.toFixed(2)}</td>
                </tr>
            `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  }

  // ==================== HISTORIAL COMPLETO ====================
  updateHistorialCompletoView() {
    this.renderHistorialTable(storage.getMovements());
  }

  renderHistorialTable(movements) {
    const tbody = document.getElementById("historialTableBody");
    tbody.innerHTML = "";

    movements.forEach((m) => {
      const product = storage.getProductById(m.productId);
      const user = storage.getUserById(m.usuarioId);
      const fecha = new Date(m.fecha).toLocaleString("es-ES");
      const tipoLabel = this.getTipoLabel(m.tipo);

      tbody.innerHTML += `
                <tr>
                    <td>${fecha}</td>
                    <td>${product?.nombre || "N/A"}</td>
                    <td><span class="badge bg-${this.getTipoColor(m.tipo)}">${tipoLabel}</span></td>
                    <td>${m.cantidad}</td>
                    <td>${user?.nombre || "N/A"}</td>
                    <td>${m.descripcion || "-"}</td>
                </tr>
            `;
    });
  }

  filtrarHistorial() {
    let movements = storage.getMovements();
    const query = document.getElementById("filtroHistorial").value;
    const tipo = document.getElementById("filtroTipoMovimiento").value;

    if (query) {
      movements = storage.searchMovements(query);
    }

    if (tipo) {
      movements = movements.filter((m) => m.tipo === tipo);
    }

    this.renderHistorialTable(movements);
  }

  exportarCSV() {
    const csv = storage.exportMovementsCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventario_movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ==================== UTILIDADES ====================
  getTipoLabel(tipo) {
    const labels = {
      entrada: "Entrada",
      salida: "Salida",
      ajuste: "Ajuste",
    };
    return labels[tipo] || tipo;
  }

  getTipoColor(tipo) {
    const colors = {
      entrada: "success",
      salida: "danger",
      ajuste: "warning",
    };
    return colors[tipo] || "secondary";
  }

  getTipoIcono(tipo) {
    const iconos = {
      entrada: "📥",
      salida: "📤",
      ajuste: "⚙️",
    };
    return iconos[tipo] || "";
  }
}

// Inicializar la aplicación cuando el DOM esté listo
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new InventarioApp();
});
