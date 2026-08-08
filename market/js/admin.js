const adminLinks = [
  ["dashboard", "Dashboard"],
  ["products", "Products"],
  ["add-product", "Add Product"],
  ["categories", "Categories"],
  ["orders", "Orders"],
  ["customers", "Customers"],
  ["inventory", "Inventory"],
  ["reports", "Reports"],
  ["settings", "Settings"],
];

const orderStatuses = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];
const adminSort = {
  products: { field: "name", direction: "asc" },
  inventory: { field: "stock", direction: "asc" },
  orders: { field: "orderDate", direction: "desc" },
};
const selectedProductIds = new Set();
const selectedInventoryIds = new Set();
let pendingAdminSync = Promise.resolve();

function adminSession() {
  return FM.get(FM.keys.admin, null);
}

function adminToken() {
  return adminSession()?.token || "";
}

async function adminRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (adminToken()) {
    headers.Authorization = "Bearer " + adminToken();
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Error(data.message || "Admin request failed");
  }

  return data;
}

function cacheAdminStore(store) {
  if (Array.isArray(store.products)) FM.set(FM.keys.products, store.products);
  if (Array.isArray(store.categories))
    FM.set(FM.keys.categories, store.categories);
  if (Array.isArray(store.customers))
    FM.set(FM.keys.customers, store.customers);
  if (Array.isArray(store.orders)) FM.set(FM.keys.orders, store.orders);
}

function queueAdminSync(task) {
  if (!adminToken()) return pendingAdminSync;

  pendingAdminSync = pendingAdminSync
    .catch(() => {})
    .then(task)
    .then(cacheAdminStore)
    .catch((error) => FM.toast(error.message));

  return pendingAdminSync;
}

function syncProductsToServer(products) {
  const snapshot = JSON.parse(JSON.stringify(products));

  return queueAdminSync(() =>
    adminRequest("/api/admin/products/sync", {
      method: "PUT",
      body: JSON.stringify({ products: snapshot }),
    }),
  );
}

function syncCategoriesToServer(categories) {
  const snapshot = JSON.parse(JSON.stringify(categories));

  return queueAdminSync(() =>
    adminRequest("/api/admin/categories/sync", {
      method: "PUT",
      body: JSON.stringify({ categories: snapshot }),
    }),
  );
}

async function flushAdminSync() {
  await pendingAdminSync.catch(() => {});
}

async function loadAdminStore() {
  await flushAdminSync();
  const store = await adminRequest("/api/admin/store");

  cacheAdminStore(store);
  return store;
}

function adminNav(currentPage) {
  const activePage =
    currentPage === "edit-product"
      ? "products"
      : currentPage === "order-details"
        ? "orders"
        : currentPage;
  const links = adminLinks
    .map(([href, label]) => {
      const active = activePage === href ? "active" : "";
      return `<a class="${active}" href="${href}.html">${label}</a>`;
    })
    .join("");

  return `
    <aside class="side">
      <a class="logo" href="dashboard.html">FreshMart Admin</a>
      ${links}
      <a href="../index.html">View Store</a>
      <a href="login.html" onclick="localStorage.removeItem('freshmart_admin_session')">
        Logout
      </a>
    </aside>
  `;
}

async function admin() {
  const isLoginPage = location.pathname.endsWith("login.html");

  if (!adminToken() && !isLoginPage) {
    return (location.href = "login.html");
  }

  const page = document.body.dataset.admin || "dashboard";
  document.body.innerHTML = `
    <div class="admin">
      ${adminNav(page)}
      <main class="admin-main">
        <div class="admin-top">
          <div>
            <p class="eyebrow">Store management</p>
            <h1>${titleCase(page)}</h1>
          </div>
          <a class="btn alt" href="../index.html">Open Store</a>
        </div>
        <div id="adminContent"></div>
      </main>
    </div>
  `;

  const root = document.querySelector("#adminContent");
  root.innerHTML =
    '<div class="panel empty">Loading shared store data...</div>';

  try {
    await loadAdminStore();
    renderPage(page);
  } catch (error) {
    if (error.message === "Please sign in first") {
      localStorage.removeItem(FM.keys.admin);
      location.href = "login.html";
      return;
    }

    root.innerHTML = `
      <div class="panel empty">
        Could not load shared store data. ${error.message}
      </div>
    `;
  }
}

function renderPage(page) {
  const root = document.querySelector("#adminContent");
  const products = FM.products();
  const orders = FM.get(FM.keys.orders);
  const customers = FM.get(FM.keys.customers);
  const categories = FM.get(FM.keys.categories);

  if (page === "dashboard") renderDashboard(root, products, orders, customers);
  else if (page === "products") renderProducts(root, products, categories);
  else if (page === "add-product") renderProductForm(root, products);
  else if (page === "edit-product") renderEditProduct(root, products);
  else if (page === "categories") renderCategories(root, categories, products);
  else if (page === "orders") renderOrders(root, orders);
  else if (page === "order-details") renderOrderDetails(root, orders);
  else if (page === "customers") renderCustomers(root, customers, orders);
  else if (page === "inventory") renderInventory(root, products);
  else if (page === "reports") renderReports(root, products, orders);
  else if (page === "settings") renderSettings(root);
}

function renderDashboard(root, products, orders, customers) {
  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "Delivered",
  );
  const revenue = deliveredOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );
  const lowStock = products.filter(
    (product) => product.stock <= product.minimumStock && product.stock > 0,
  );
  const outOfStock = products.filter((product) => !product.stock);
  const stockByCategory = Object.entries(
    products.reduce((totals, product) => {
      totals[product.category] =
        (totals[product.category] || 0) + product.stock;
      return totals;
    }, {}),
  )
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
  const metrics = [
    ["Products", products.length],
    ["Categories", FM.get(FM.keys.categories).length],
    ["Customers", customers.length],
    ["Orders", orders.length],
    ["Pending", orders.filter((o) => o.orderStatus === "Order Placed").length],
    ["Low Stock", lowStock.length],
    ["Out of Stock", outOfStock.length],
    ["Sales", FM.money(revenue)],
  ];

  root.innerHTML = `
    <div class="metrics">
      ${metrics.map(metricCard).join("")}
    </div>
    <div class="admin-actions dashboard-actions">
      <a class="btn" href="add-product.html">Add Product</a>
      <a class="btn alt" href="orders.html">Manage Orders</a>
      <a class="btn alt" href="inventory.html">Update Stock</a>
      <a class="btn alt" href="reports.html">View Reports</a>
    </div>
    <div class="admin-grid">
      <section class="panel chart-panel">
        <div class="panel-head">
          <h2>Sales by category</h2>
          <a href="reports.html">Reports</a>
        </div>
        ${reportBars(totalsByCategory(orders).slice(0, 6))}
      </section>
      <section class="panel chart-panel">
        <div class="panel-head">
          <h2>Inventory by category</h2>
          <a href="inventory.html">Stock</a>
        </div>
        ${reportBars(stockByCategory.slice(0, 6), "items")}
      </section>
    </div>
    <div class="admin-grid">
      <section class="panel">
        <div class="panel-head">
          <h2>Recent orders</h2>
          <a href="orders.html">Manage all</a>
        </div>
        ${orderTable(orders.slice(0, 6), false)}
      </section>
      <section class="panel">
        <div class="panel-head">
          <h2>Stock attention</h2>
          <a href="inventory.html">Open inventory</a>
        </div>
        ${stockList([...outOfStock, ...lowStock].slice(0, 8))}
      </section>
    </div>
  `;
}

function renderProducts(root, products, categories) {
  const categoryOptions = categories
    .map((category) => `<option>${category.name}</option>`)
    .join("");

  root.innerHTML = `
    <div class="admin-actions">
      <a class="btn" href="add-product.html">Add Product</a>
      <input class="input" id="adminSearch" placeholder="Search products">
      <select id="adminCategory">
        <option value="">All categories</option>
        ${categoryOptions}
      </select>
      <select id="adminStatus">
        <option value="">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="out">Out of stock</option>
      </select>
    </div>
    <div class="bulk-bar">
      <label class="check">
        <input type="checkbox" id="selectVisibleProducts">
        Select visible
      </label>
      <span id="selectedProductCount">0 selected</span>
      <button class="icon-btn" onclick="bulkSetProducts('active', true)">Activate</button>
      <button class="icon-btn" onclick="bulkSetProducts('active', false)">Hide</button>
      <button class="icon-btn" onclick="bulkSetProducts('featured', true)">Feature</button>
      <button class="icon-btn danger-text" onclick="bulkDeleteProducts()">Remove selected</button>
    </div>
    <div class="panel table-wrap">
      <div id="productTable"></div>
    </div>
  `;

  const render = () => {
    const search = document.querySelector("#adminSearch").value.toLowerCase();
    const category = document.querySelector("#adminCategory").value;
    const status = document.querySelector("#adminStatus").value;
    const filtered = products
      .filter(
        (product) =>
          !category ||
          product.category === category ||
          product.category === category.replaceAll(" and ", " & "),
      )
      .filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      )
      .filter((product) => {
        if (status === "active") return product.active;
        if (status === "inactive") return !product.active;
        if (status === "out") return !product.stock;
        return true;
      });

    document.querySelector("#productTable").innerHTML = productTable(
      sortAdminRows(filtered, "products"),
    );
    updateProductSelectionCount();
  };

  ["adminSearch", "adminCategory", "adminStatus"].forEach((id) =>
    document.querySelector("#" + id).addEventListener("input", render),
  );
  document.querySelector("#selectVisibleProducts").onchange = (event) =>
    toggleVisibleProducts(event.target.checked);
  render();
}

function renderProductForm(root, products, product = null) {
  const categories = FM.get(FM.keys.categories);
  const categoryOptions = categories
    .map(
      (category) =>
        `<option ${product?.category === category.name ? "selected" : ""}>${category.name}</option>`,
    )
    .join("");
  const actionTitle = product ? "Edit product" : "New product";
  const imagePreview = product?.image
    ? `<img id="productImagePreview" src="${adminImage(product.image)}" alt="${product.name}" style="${adminImageStyle(product)}" onerror="FM.imageError(event, '../')">`
    : `<div id="productImagePreview" class="image-placeholder">No image selected</div>`;

  root.innerHTML = `
    <form class="panel form admin-form" id="productForm">
      <h2 class="wide">${actionTitle}</h2>
      <label>Product name
        <input class="input" name="name" value="${product?.name || ""}" required>
      </label>
      <label>Brand
        <input class="input" name="brand" value="${product?.brand || ""}" required>
      </label>
      <label>Category
        <select name="category" required>${categoryOptions}</select>
      </label>
      <label>Selling price
        <input class="input" name="sellingPrice" type="number" min="1" value="${product?.sellingPrice || ""}" required>
      </label>
      <label>Original price
        <input class="input" name="originalPrice" type="number" min="1" value="${product?.originalPrice || ""}" required>
      </label>
      <label>Stock quantity
        <input class="input" name="stock" type="number" min="0" value="${product?.stock ?? ""}" required>
      </label>
      <label>Minimum stock
        <input class="input" name="minimumStock" type="number" min="0" value="${product?.minimumStock ?? 5}" required>
      </label>
      <label>Weight
        <input class="input" name="weight" value="${product?.weight || "1 Pack"}" required>
      </label>
      <label class="wide">Product image file
        <input
          class="input"
          name="imageFile"
          type="file"
          accept="image/*"
          ${product ? "" : "required"}
        >
      </label>
      <label>Image fit
        <select name="imageFit" id="imageFit">
          ${imageFitOptions(product?.imageFit)}
        </select>
      </label>
      <label>Crop focus
        <select name="imagePosition" id="imagePosition">
          ${imagePositionOptions(product?.imagePosition)}
        </select>
      </label>
      <div class="wide image-preview">${imagePreview}</div>
      <label class="wide">Description
        <textarea name="description">${product?.description || ""}</textarea>
      </label>
      <label class="check"><input type="checkbox" name="featured" ${product?.featured ? "checked" : ""}> Featured product</label>
      <label class="check"><input type="checkbox" name="active" ${product?.active !== false ? "checked" : ""}> Active product</label>
      <button class="btn wide">${product ? "Save Changes" : "Save Product"}</button>
    </form>
  `;

  const productForm = document.querySelector("#productForm");
  const updatePreviewStyle = () => {
    const previewImage = document.querySelector("#productImagePreview");

    if (!previewImage || previewImage.tagName !== "IMG") return;

    previewImage.style.objectFit = productForm.elements.imageFit.value;
    previewImage.style.objectPosition =
      productForm.elements.imagePosition.value;
  };
  productForm.elements.imageFile.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const image = await fileToDataUrl(file);
      document.querySelector(".image-preview").innerHTML =
        `<img id="productImagePreview" src="${image}" alt="Selected product image">`;
      updatePreviewStyle();
    } catch {
      event.target.value = "";
      FM.toast("Could not read that image file");
    }
  };
  productForm.elements.imageFit.onchange = updatePreviewStyle;
  productForm.elements.imagePosition.onchange = updatePreviewStyle;
  updatePreviewStyle();
  productForm.onsubmit = async (event) => {
    event.preventDefault();

    const values = Object.fromEntries(new FormData(event.target));
    const imageFile = event.target.elements.imageFile.files[0];
    let image = product?.image;

    if (imageFile) {
      try {
        image = await fileToDataUrl(imageFile);
      } catch {
        return FM.toast("Could not read that image file");
      }
    }

    if (!image) return FM.toast("Please choose a product image file");

    const nextProduct = {
      id: product?.id || nextId("PROD", products),
      name: values.name.trim(),
      brand: values.brand.trim(),
      category: values.category,
      description:
        values.description.trim() ||
        "Fresh, carefully selected " +
          values.name.trim().toLowerCase() +
          " delivered with care.",
      originalPrice: Number(values.originalPrice),
      sellingPrice: Number(values.sellingPrice),
      discount: Math.max(
        0,
        Math.round(
          ((Number(values.originalPrice) - Number(values.sellingPrice)) /
            Number(values.originalPrice)) *
            100,
        ),
      ),
      stock: Number(values.stock),
      minimumStock: Number(values.minimumStock),
      weight: values.weight.trim(),
      unit: product?.unit || "Pack",
      image,
      imageFit: values.imageFit,
      imagePosition: values.imagePosition,
      rating: product?.rating || 4.5,
      ingredients: product?.ingredients || "Quality ingredients",
      storageInstructions:
        product?.storageInstructions || "Store in a cool, dry place.",
      featured: values.featured === "on",
      active: values.active === "on",
    };

    if (product) {
      const index = products.findIndex((item) => item.id === product.id);
      products[index] = nextProduct;
    } else {
      products.push(nextProduct);
    }

    if (!saveProducts(products)) return;
    await flushAdminSync();

    FM.toast(product ? "Product updated" : "Product added");
    location.href = "products.html";
  };
}

function renderEditProduct(root, products) {
  const productId = new URLSearchParams(location.search).get("id");
  const product = products.find((item) => item.id === productId);

  if (!product) {
    root.innerHTML = `
      <div class="empty">
        <h2>Product not found</h2>
        <a class="btn" href="products.html">Back to products</a>
      </div>
    `;
    return;
  }

  renderProductForm(root, products, product);
}

function renderCategories(root, categories, products) {
  const rows = categories
    .map((category) => {
      const count = products.filter(
        (product) =>
          product.category === category.name ||
          product.category === category.name.replaceAll(" and ", " & "),
      ).length;

      return `
        <tr>
          <td>
            <img
              src="${adminImage(category.image)}"
              alt="${category.name}"
              onerror="FM.imageError(event, '../')"
            >
            ${category.name}
          </td>
          <td>${category.description || ""}</td>
          <td>${count}</td>
          <td><span class="status">${category.active ? "Active" : "Hidden"}</span></td>
          <td>
            <button class="icon-btn" onclick="editCategory('${category.id}')">
              Edit
            </button>
            <label class="icon-btn file-action">
              Image
              <input
                type="file"
                accept="image/*"
                onchange="updateCategoryImage('${category.id}',this.files[0])"
              >
            </label>
            <button class="icon-btn" onclick="toggleCategory('${category.id}')">
              ${category.active ? "Hide" : "Show"}
            </button>
            <button class="icon-btn" onclick="deleteCategory('${category.id}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="admin-grid">
      <form class="panel form admin-form" id="categoryForm">
        <h2 class="wide">Add category</h2>
        <label>Name<input class="input" name="name" required></label>
        <label>Image file<input class="input" name="imageFile" type="file" accept="image/*" required></label>
        <div class="wide image-preview">
          <div id="categoryImagePreview" class="image-placeholder">No image selected</div>
        </div>
        <label class="wide">Description<textarea name="description"></textarea></label>
        <button class="btn wide">Save Category</button>
      </form>
      <div class="panel table-wrap">
        <table class="table">
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Products</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
          ${rows}
        </table>
      </div>
    </div>
  `;

  const categoryForm = document.querySelector("#categoryForm");
  categoryForm.elements.imageFile.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const image = await fileToDataUrl(file);
      document.querySelector(".image-preview").innerHTML =
        `<img id="categoryImagePreview" src="${image}" alt="Selected category image">`;
    } catch {
      event.target.value = "";
      FM.toast("Could not read that image file");
    }
  };
  categoryForm.onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    const imageFile = event.target.elements.imageFile.files[0];
    if (!imageFile) return FM.toast("Please choose a category image file");

    let image;
    try {
      image = await fileToDataUrl(imageFile);
    } catch {
      return FM.toast("Could not read that image file");
    }

    categories.push({
      id: nextId("CAT", categories),
      name: values.name.trim(),
      description: values.description.trim(),
      image,
      active: true,
    });

    if (!saveCategories(categories)) return;

    FM.toast("Category added");
    admin();
  };
}

function renderOrders(root, orders) {
  root.innerHTML = `
    <div class="admin-actions">
      <input class="input" id="orderSearch" placeholder="Search order or customer">
      <select id="orderStatus">
        <option value="">All statuses</option>
        ${orderStatuses.map((status) => `<option>${status}</option>`).join("")}
      </select>
    </div>
    <div class="panel table-wrap">
      <div id="ordersTable"></div>
    </div>
  `;

  const render = () => {
    const search = document.querySelector("#orderSearch").value.toLowerCase();
    const nextStatus = document.querySelector("#orderStatus").value;
    const filtered = orders
      .filter((order) => !nextStatus || order.orderStatus === nextStatus)
      .filter((order) =>
        `${order.id} ${order.customerName} ${order.customerMobile}`
          .toLowerCase()
          .includes(search),
      );

    document.querySelector("#ordersTable").innerHTML = orderTable(
      sortAdminRows(filtered, "orders"),
      true,
    );
  };

  document.querySelector("#orderSearch").addEventListener("input", render);
  document.querySelector("#orderStatus").addEventListener("input", render);
  render();
}

function renderOrderDetails(root, orders) {
  const orderId = new URLSearchParams(location.search).get("id");
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    root.innerHTML = `
      <div class="empty">
        <h2>Order not found</h2>
        <a class="btn" href="orders.html">Back to orders</a>
      </div>
    `;
    return;
  }

  const itemRows = order.items
    .map(
      (item) => `
        <div class="row">
          <img
            src="${adminImage(item.image)}"
            alt="${item.name}"
            onerror="FM.imageError(event, '../')"
          >
          <div class="grow">
            <b>${item.name}</b><br>
            ${item.quantity} x ${FM.money(item.price)}
          </div>
          <b>${FM.money(item.subtotal)}</b>
        </div>
      `,
    )
    .join("");

  root.innerHTML = `
    <div class="panel">
      <div class="panel-head">
        <h2>${order.id}</h2>
        <select onchange="status('${order.id}',this.value)">
          ${statusOptions(order.orderStatus)}
        </select>
      </div>
      <p class="sub">
        ${order.customerName} · ${order.customerMobile} · ${order.orderDate}
      </p>
      <p>
        <b>Payment:</b> ${order.paymentMethod} (${order.paymentStatus})<br>
        <b>Delivery option:</b> ${order.deliveryMethod || "Standard Delivery"}<br>
        <b>Delivery address:</b> ${order.deliveryAddress.address || ""},
        ${order.deliveryAddress.city || ""}, ${order.deliveryAddress.pin || ""}
      </p>
      <h3>Items</h3>
      ${itemRows}
      <div class="summary">
        <div><span>Subtotal</span><b>${FM.money(order.subtotal)}</b></div>
        <div><span>Delivery</span><b>${FM.money(order.deliveryCharge)}</b></div>
        <div class="total"><span>Total</span><span>${FM.money(order.totalAmount)}</span></div>
      </div>
      <button class="btn danger" onclick="deleteOrder('${order.id}')">
        Delete Order
      </button>
    </div>
  `;
}

function renderCustomers(root, customers, orders) {
  const rows = customers
    .map((customer) => {
      const customerOrders = orders.filter(
        (order) => order.customerId === customer.id,
      );
      const spend = customerOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );

      return `
        <tr>
          <td>${customer.id}</td>
          <td>${customer.name}</td>
          <td>${customer.email}<br>${customer.mobile}</td>
          <td>${customer.city || ""}<br>${customer.pin || ""}</td>
          <td>${customerOrders.length}</td>
          <td>${FM.money(spend)}</td>
          <td>
            <button class="icon-btn" onclick="toggleCustomer('${customer.id}')">
              ${customer.active === false ? "Activate" : "Block"}
            </button>
            <button class="icon-btn danger-text" onclick="deleteCustomer('${customer.id}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="panel table-wrap">
      <table class="table">
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Contact</th>
          <th>Location</th>
          <th>Orders</th>
          <th>Spend</th>
          <th>Action</th>
        </tr>
        ${rows}
      </table>
    </div>
  `;
}

function renderInventory(root, products) {
  root.innerHTML = `
    <div class="admin-actions">
      <input class="input" id="inventorySearch" placeholder="Search inventory">
      <select id="inventoryFilter">
        <option value="">All inventory</option>
        <option value="low">Low stock</option>
        <option value="out">Out of stock</option>
      </select>
    </div>
    <div class="bulk-bar">
      <label class="check">
        <input type="checkbox" id="selectVisibleInventory">
        Select visible
      </label>
      <span id="selectedInventoryCount">0 selected</span>
      <input class="table-input" id="bulkStockAmount" type="number" min="0" value="5" aria-label="Bulk stock amount">
      <button class="icon-btn" onclick="bulkStock('add')">Add stock</button>
      <button class="icon-btn" onclick="bulkStock('subtract')">Subtract</button>
      <button class="icon-btn" onclick="bulkStock('set')">Set stock</button>
    </div>
    <div class="panel table-wrap">
      <div id="inventoryTable"></div>
    </div>
  `;

  const render = () => {
    const search = document
      .querySelector("#inventorySearch")
      .value.toLowerCase();
    const filter = document.querySelector("#inventoryFilter").value;
    const filtered = products
      .filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      )
      .filter((product) => {
        if (filter === "low")
          return product.stock <= product.minimumStock && product.stock > 0;
        if (filter === "out") return !product.stock;
        return true;
      });

    document.querySelector("#inventoryTable").innerHTML = inventoryTable(
      sortAdminRows(filtered, "inventory"),
    );
    updateInventorySelectionCount();
  };

  document.querySelector("#inventorySearch").addEventListener("input", render);
  document.querySelector("#inventoryFilter").addEventListener("input", render);
  document.querySelector("#selectVisibleInventory").onchange = (event) =>
    toggleVisibleInventory(event.target.checked);
  render();
}

function renderReports(root, products, orders) {
  const delivered = orders.filter((order) => order.orderStatus === "Delivered");
  const revenue = delivered.reduce((sum, order) => sum + order.totalAmount, 0);
  const categorySales = totalsByCategory(orders);
  const topProducts = productSales(orders).slice(0, 8);
  const stockValue = products.reduce(
    (sum, product) => sum + product.stock * product.sellingPrice,
    0,
  );

  root.innerHTML = `
    <div class="metrics">
      ${[
        ["Delivered Sales", FM.money(revenue)],
        [
          "Average Order",
          FM.money(orders.length ? revenue / orders.length : 0),
        ],
        ["Inventory Value", FM.money(stockValue)],
        [
          "Active Products",
          products.filter((product) => product.active).length,
        ],
      ]
        .map(metricCard)
        .join("")}
    </div>
    <div class="admin-grid">
      <section class="panel">
        <h2>Sales by category</h2>
        ${reportBars(categorySales)}
      </section>
      <section class="panel">
        <h2>Top products</h2>
        ${topProducts.length ? topProducts.map(reportLine).join("") : '<p class="empty">No sales yet.</p>'}
      </section>
    </div>
  `;
}

function renderSettings(root) {
  root.innerHTML = `
    <div class="admin-grid">
      <section class="panel">
        <h2>Admin login</h2>
        <p class="sub">Demo credentials for this college-project store.</p>
        <p><b>Email:</b> admin@freshmart.com<br><b>Password:</b> admin123</p>
      </section>
      <section class="panel">
        <h2>Store data</h2>
        <p class="sub">
          Products, categories, customers and orders sync with the shared backend database.
        </p>
        <p><b>Products:</b> ${FM.products().length}<br><b>Orders:</b> ${FM.get(FM.keys.orders).length}</p>
        <div class="settings-actions">
          <button class="btn" onclick="exportStoreData()">Export Store Data</button>
          <button class="btn alt" onclick="clearSessions()">Clear Login Sessions</button>
          <button class="btn danger" onclick="resetStoreData()">Reset Demo Data</button>
        </div>
      </section>
      <section class="panel">
        <h2>Import backup</h2>
        <p class="sub">Paste a FreshMart admin export to restore products, categories, customers and orders.</p>
        <form id="importForm">
          <textarea class="input" name="backup" placeholder="Paste exported JSON here"></textarea>
          <button class="btn">Import Data</button>
        </form>
      </section>
    </div>
  `;

  document.querySelector("#importForm").onsubmit = (event) => {
    event.preventDefault();
    importStoreData(new FormData(event.target).get("backup"));
  };
}

function adminDialog({ title, body, confirmText, danger = false, onConfirm }) {
  document.querySelector(".dialog-backdrop")?.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div class="dialog-backdrop" role="presentation">
        <form class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">
          <div class="panel-head">
            <h2 id="dialogTitle">${title}</h2>
            <button class="icon-btn" type="button" data-dialog-close aria-label="Close dialog">x</button>
          </div>
          <div class="dialog-body">${body}</div>
          <div class="dialog-actions">
            <button class="btn alt" type="button" data-dialog-close>Cancel</button>
            <button class="btn ${danger ? "danger" : ""}">${confirmText}</button>
          </div>
        </form>
      </div>
    `,
  );

  const backdrop = document.querySelector(".dialog-backdrop");
  const form = backdrop.querySelector("form");
  const close = () => backdrop.remove();

  backdrop.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.onclick = close;
  });
  backdrop.onclick = (event) => {
    if (event.target === backdrop) close();
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    const result = onConfirm?.(new FormData(form), close);
    if (result !== false) close();
  };
  form.querySelector("input, textarea, select, button")?.focus();
}

function confirmAdmin({
  title,
  message,
  confirmText,
  danger = false,
  onConfirm,
}) {
  adminDialog({
    title,
    body: `<p class="sub">${message}</p>`,
    confirmText,
    danger,
    onConfirm,
  });
}

function sortAdminRows(rows, table) {
  const { field, direction } = adminSort[table];
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const aValue = field === "stockStatus" ? stockStatus(a) : a[field];
    const bValue = field === "stockStatus" ? stockStatus(b) : b[field];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * multiplier;
    }

    return (
      String(aValue || "").localeCompare(String(bValue || "")) * multiplier
    );
  });
}

function sortButton(table, field, label) {
  const sort = adminSort[table];
  const icon =
    sort.field === field ? (sort.direction === "asc" ? "Asc" : "Desc") : "Sort";

  return `
    <button class="sort-btn" onclick="setAdminSort('${table}', '${field}')">
      ${label} <span aria-hidden="true">${icon}</span>
    </button>
  `;
}

function setAdminSort(table, field) {
  const sort = adminSort[table];

  if (sort.field === field) {
    sort.direction = sort.direction === "asc" ? "desc" : "asc";
  } else {
    sort.field = field;
    sort.direction = "asc";
  }

  admin();
}

function toggleSelectedProduct(id, checked) {
  if (checked) selectedProductIds.add(id);
  else selectedProductIds.delete(id);
  updateProductSelectionCount();
}

function toggleVisibleProducts(checked) {
  document.querySelectorAll("[data-product-select]").forEach((input) => {
    input.checked = checked;
    toggleSelectedProduct(input.value, checked);
  });
}

function updateProductSelectionCount() {
  const count = selectedProductIds.size;
  const label = document.querySelector("#selectedProductCount");

  if (label) label.textContent = count + " selected";
}

function bulkSetProducts(field, value) {
  if (!selectedProductIds.size) return FM.toast("Select products first");

  const products = FM.products();
  products.forEach((product) => {
    if (selectedProductIds.has(product.id)) product[field] = value;
  });

  if (!saveProducts(products)) return;
  FM.toast("Selected products updated");
  admin();
}

function bulkDeleteProducts() {
  if (!selectedProductIds.size) return FM.toast("Select products first");

  confirmAdmin({
    title: "Remove selected products?",
    message:
      selectedProductIds.size + " products will be removed from the store.",
    confirmText: "Remove products",
    danger: true,
    onConfirm() {
      const ids = [...selectedProductIds];
      const products = FM.products().filter(
        (product) => !selectedProductIds.has(product.id),
      );

      if (!saveProducts(products)) return;
      FM.set(
        FM.keys.cart,
        FM.cart().filter((item) => !selectedProductIds.has(item.productId)),
      );
      FM.set(
        FM.keys.wishlist,
        FM.get(FM.keys.wishlist).filter(
          (productId) => !selectedProductIds.has(productId),
        ),
      );
      ids.forEach((id) => selectedInventoryIds.delete(id));
      selectedProductIds.clear();
      FM.toast("Selected products removed");
      admin();
    },
  });
}

function toggleSelectedInventory(id, checked) {
  if (checked) selectedInventoryIds.add(id);
  else selectedInventoryIds.delete(id);
  updateInventorySelectionCount();
}

function toggleVisibleInventory(checked) {
  document.querySelectorAll("[data-inventory-select]").forEach((input) => {
    input.checked = checked;
    toggleSelectedInventory(input.value, checked);
  });
}

function updateInventorySelectionCount() {
  const label = document.querySelector("#selectedInventoryCount");

  if (label) label.textContent = selectedInventoryIds.size + " selected";
}

function bulkStock(mode) {
  if (!selectedInventoryIds.size) return FM.toast("Select inventory first");

  const amount = Math.max(
    0,
    Number(document.querySelector("#bulkStockAmount")?.value) || 0,
  );
  const products = FM.products();

  products.forEach((product) => {
    if (!selectedInventoryIds.has(product.id)) return;

    if (mode === "add") product.stock += amount;
    else if (mode === "subtract")
      product.stock = Math.max(0, product.stock - amount);
    else product.stock = amount;
  });

  if (!saveProducts(products)) return;
  FM.toast("Inventory updated");
  admin();
}

function metricCard([label, value]) {
  return `
    <div class="metric">
      ${label}
      <b>${value}</b>
    </div>
  `;
}

function productTable(products) {
  if (!products.length) return '<div class="empty">No products found.</div>';

  const rows = products
    .map(
      (product) => `
        <tr>
          <td>
            <input
              type="checkbox"
              value="${product.id}"
              data-product-select
              ${selectedProductIds.has(product.id) ? "checked" : ""}
              onchange="toggleSelectedProduct('${product.id}', this.checked)"
              aria-label="Select ${product.name}"
            >
          </td>
          <td>
            <img
              src="${adminImage(product.image)}"
              alt="${product.name}"
              style="${adminImageStyle(product)}"
              onerror="FM.imageError(event, '../')"
            >
            ${product.name}
          </td>
          <td>${product.brand}<br><span class="muted">${product.category}</span></td>
          <td>${FM.money(product.sellingPrice)}<br><span class="muted">${product.discount}% off</span></td>
          <td>${product.stock}<br><span class="muted">Min ${product.minimumStock}</span></td>
          <td><span class="status">${product.featured ? "Featured" : "Regular"}</span></td>
          <td><span class="status">${product.active ? "Active" : "Inactive"}</span></td>
          <td>
            <a class="icon-btn" href="edit-product.html?id=${product.id}">Edit</a>
            <button class="icon-btn" onclick="toggleFeatured('${product.id}')">
              ${product.featured ? "Unfeature" : "Feature"}
            </button>
            <button class="icon-btn" onclick="duplicateProduct('${product.id}')">
              Duplicate
            </button>
            <button class="icon-btn" onclick="toggleProduct('${product.id}')">
              ${product.active ? "Hide" : "Show"}
            </button>
            <button class="icon-btn danger-text" onclick="del('${product.id}')">Remove</button>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table class="table">
      <tr>
        <th>Select</th>
        <th>${sortButton("products", "name", "Product")}</th>
        <th>${sortButton("products", "brand", "Brand / Category")}</th>
        <th>${sortButton("products", "sellingPrice", "Price")}</th>
        <th>${sortButton("products", "stock", "Stock")}</th>
        <th>${sortButton("products", "featured", "Featured")}</th>
        <th>${sortButton("products", "active", "Status")}</th>
        <th>Action</th>
      </tr>
      ${rows}
    </table>
  `;
}

function inventoryTable(products) {
  if (!products.length)
    return '<div class="empty">No inventory items found.</div>';

  const rows = products
    .map(
      (product) => `
        <tr>
          <td>
            <input
              type="checkbox"
              value="${product.id}"
              data-inventory-select
              ${selectedInventoryIds.has(product.id) ? "checked" : ""}
              onchange="toggleSelectedInventory('${product.id}', this.checked)"
              aria-label="Select ${product.name}"
            >
          </td>
          <td>
            <img
              src="${adminImage(product.image)}"
              alt="${product.name}"
              style="${adminImageStyle(product)}"
              onerror="FM.imageError(event, '../')"
            >
            ${product.name}
          </td>
          <td>${product.category}</td>
          <td>
            <input
              class="table-input"
              type="number"
              min="0"
              value="${product.stock}"
              onchange="setInventory('${product.id}','stock',this.value)"
            >
          </td>
          <td>
            <input
              class="table-input"
              type="number"
              min="0"
              value="${product.minimumStock}"
              onchange="setInventory('${product.id}','minimumStock',this.value)"
            >
          </td>
          <td><span class="status">${stockStatus(product)}</span></td>
          <td>
            <button class="icon-btn" onclick="stock('${product.id}',-1)">-</button>
            <button class="icon-btn" onclick="stock('${product.id}',1)">+</button>
            <button class="icon-btn" onclick="stock('${product.id}',10)">+10</button>
            <button class="icon-btn danger-text" onclick="del('${product.id}')">Remove</button>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table class="table">
      <tr>
        <th>Select</th>
        <th>${sortButton("inventory", "name", "Product")}</th>
        <th>${sortButton("inventory", "category", "Category")}</th>
        <th>${sortButton("inventory", "stock", "Stock")}</th>
        <th>${sortButton("inventory", "minimumStock", "Minimum")}</th>
        <th>${sortButton("inventory", "stockStatus", "Status")}</th>
        <th>Adjust</th>
      </tr>
      ${rows}
    </table>
  `;
}

function orderTable(orders, manage = false) {
  if (!orders.length) return '<div class="empty">No orders yet.</div>';

  const rows = orders
    .map(
      (order) => `
        <tr>
          <td><a href="order-details.html?id=${order.id}">${order.id}</a></td>
          <td>${order.customerName}<br><span class="muted">${order.customerMobile}</span></td>
          <td>${order.orderDate}</td>
          <td>${FM.money(order.totalAmount)}</td>
          <td>${order.paymentMethod}<br><span class="muted">${order.paymentStatus}</span></td>
          <td><span class="status">${order.orderStatus}</span></td>
          ${
            manage
              ? `
                <td>
                  <select onchange="status('${order.id}',this.value)">
                    ${statusOptions(order.orderStatus)}
                  </select>
                </td>
                <td>
                  <button class="icon-btn danger-text" onclick="deleteOrder('${order.id}')">Delete</button>
                </td>
              `
              : ""
          }
        </tr>
      `,
    )
    .join("");

  return `
    <table class="table">
      <tr>
        <th>${sortButton("orders", "id", "Order")}</th>
        <th>${sortButton("orders", "customerName", "Customer")}</th>
        <th>${sortButton("orders", "orderDate", "Date")}</th>
        <th>${sortButton("orders", "totalAmount", "Amount")}</th>
        <th>Payment</th>
        <th>${sortButton("orders", "orderStatus", "Status")}</th>
        ${manage ? "<th>Update</th>" : ""}
        ${manage ? "<th>Action</th>" : ""}
      </tr>
      ${rows}
    </table>
  `;
}

function stockList(products) {
  if (!products.length) return '<p class="empty">Inventory looks healthy.</p>';

  return products
    .map(
      (product) => `
        <div class="stock-line">
          <span>${product.name}</span>
          <b>${stockStatus(product)} · ${product.stock}</b>
        </div>
      `,
    )
    .join("");
}

function reportBars(items, unit = "money") {
  if (!items.length) return '<p class="empty">No report data yet.</p>';

  const max = Math.max(...items.map((item) => item.total), 1);
  return items
    .map(
      (item) => `
        <div class="report-row">
          <div>
            <b>${item.label}</b>
            <span>${unit === "money" ? FM.money(item.total) : item.total + " " + unit}</span>
          </div>
          <div class="chart-track">
            <span style="width:${Math.max(6, (item.total / max) * 100)}%"></span>
          </div>
        </div>
      `,
    )
    .join("");
}

function reportLine(item) {
  return `
    <div class="stock-line">
      <span>${item.label}</span>
      <b>${item.quantity} sold · ${FM.money(item.total)}</b>
    </div>
  `;
}

function statusOptions(currentStatus) {
  return orderStatuses
    .map(
      (status) =>
        `<option ${status === currentStatus ? "selected" : ""}>${status}</option>`,
    )
    .join("");
}

function totalsByCategory(orders) {
  const totals = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = FM.products().find(
        (entry) => entry.id === item.productId,
      );
      const label = product?.category || "Other";
      totals[label] = (totals[label] || 0) + item.subtotal;
    });
  });

  return Object.entries(totals)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

function productSales(orders) {
  const totals = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!totals[item.name]) totals[item.name] = { quantity: 0, total: 0 };
      totals[item.name].quantity += item.quantity;
      totals[item.name].total += item.subtotal;
    });
  });

  return Object.entries(totals)
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.total - a.total);
}

function stockStatus(product) {
  if (!product.stock) return "Out";
  if (product.stock <= product.minimumStock) return "Low";
  return "In stock";
}

function adminImage(image) {
  return FM.imageUrl(image, "../");
}

function adminImageStyle(item = {}) {
  return `object-fit:${item.imageFit || "contain"};object-position:${item.imagePosition || "center"}`;
}

function imageFitOptions(current = "contain") {
  return ["contain", "cover"]
    .map(
      (value) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${value === "cover" ? "Fill crop" : "Contain"}</option>`,
    )
    .join("");
}

function imagePositionOptions(current = "center") {
  return ["center", "top", "bottom", "left", "right"]
    .map(
      (value) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${titleCase(value)}</option>`,
    )
    .join("");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(Error("Please choose an image file"));
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const maxSize = 520;
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.68));
      } catch {
        URL.revokeObjectURL(objectUrl);
        readOriginalImage(file).then(resolve).catch(reject);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      readOriginalImage(file).then(resolve).catch(reject);
    };
    image.src = objectUrl;
  });
}

function readOriginalImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function saveProducts(products) {
  try {
    FM.saveProducts(products);
    syncProductsToServer(products);
    return true;
  } catch {
    FM.toast("Image is too large. Try a smaller JPG or PNG file.");
    return false;
  }
}

function saveCategories(categories) {
  try {
    FM.set(FM.keys.categories, categories);
    syncCategoriesToServer(categories);
    return true;
  } catch {
    FM.toast("Image is too large. Try a smaller JPG or PNG file.");
    return false;
  }
}

async function updateCategoryImage(id, file) {
  if (!file) return;

  const categories = FM.get(FM.keys.categories);
  const category = categories.find((item) => item.id === id);

  if (!category) return;

  try {
    category.image = await fileToDataUrl(file);
  } catch {
    return FM.toast("Could not read that image file");
  }

  if (!saveCategories(categories)) return;

  FM.toast("Category image updated");
  admin();
}

function titleCase(value) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nextId(prefix, list) {
  const maxId = list.reduce((max, item) => {
    const match = String(item.id || "").match(
      new RegExp("^" + prefix + "(\\d+)$"),
    );
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return prefix + String(maxId + 1).padStart(3, "0");
}

function stock(id, amount) {
  const products = FM.products();
  const product = products.find((item) => item.id === id);

  if (!product) return;

  product.stock = Math.max(0, product.stock + amount);
  if (!saveProducts(products)) return;
  admin();
}

function setInventory(id, field, value) {
  const products = FM.products();
  const product = products.find((item) => item.id === id);

  if (!product || !["stock", "minimumStock"].includes(field)) return;

  product[field] = Math.max(0, Number(value) || 0);
  if (!saveProducts(products)) return;
  admin();
}

function toggleProduct(id) {
  const products = FM.products();
  const product = products.find((item) => item.id === id);

  if (!product) return;

  product.active = !product.active;
  if (!saveProducts(products)) return;
  admin();
}

function toggleFeatured(id) {
  const products = FM.products();
  const product = products.find((item) => item.id === id);

  if (!product) return;

  product.featured = !product.featured;
  if (!saveProducts(products)) return;
  admin();
}

function duplicateProduct(id) {
  const products = FM.products();
  const product = products.find((item) => item.id === id);

  if (!product) return;

  products.push({
    ...product,
    id: nextId("PROD", products),
    name: product.name + " Copy",
    active: false,
    featured: false,
  });
  if (!saveProducts(products)) return;
  FM.toast("Product duplicated");
  admin();
}

function del(id) {
  const products = FM.products();
  const product = products.find((item) => item.id === id);

  if (!product) return;

  confirmAdmin({
    title: "Remove product?",
    message:
      product.name + " will be removed from products, carts and wishlists.",
    confirmText: "Remove product",
    danger: true,
    onConfirm() {
      if (!saveProducts(products.filter((item) => item.id !== id))) return;
      FM.set(
        FM.keys.cart,
        FM.cart().filter((item) => item.productId !== id),
      );
      FM.set(
        FM.keys.wishlist,
        FM.get(FM.keys.wishlist).filter((productId) => productId !== id),
      );

      FM.toast("Product removed");
      admin();
    },
  });
}

function toggleCategory(id) {
  const categories = FM.get(FM.keys.categories);
  const category = categories.find((item) => item.id === id);

  if (!category) return;

  category.active = !category.active;
  if (!saveCategories(categories)) return;
  admin();
}

function editCategory(id) {
  const categories = FM.get(FM.keys.categories);
  const products = FM.products();
  const category = categories.find((item) => item.id === id);

  if (!category) return;

  adminDialog({
    title: "Edit category",
    body: `
      <label>Category name
        <input class="input" name="name" value="${category.name}" required>
      </label>
      <label>Description
        <textarea class="input" name="description">${category.description || ""}</textarea>
      </label>
    `,
    confirmText: "Save category",
    onConfirm(formData) {
      const oldName = category.name;

      category.name = String(formData.get("name")).trim();
      category.description = String(formData.get("description") || "").trim();

      products.forEach((product) => {
        if (
          product.category === oldName ||
          product.category === oldName.replaceAll(" and ", " & ")
        ) {
          product.category = category.name;
        }
      });

      if (!saveCategories(categories)) return false;
      if (!saveProducts(products)) return false;
      FM.toast("Category updated");
      admin();
    },
  });
}

function deleteCategory(id) {
  const categories = FM.get(FM.keys.categories);
  const category = categories.find((item) => item.id === id);

  if (!category) return;

  const hasProducts = FM.products().some(
    (product) =>
      product.category === category.name ||
      product.category === category.name.replaceAll(" and ", " & "),
  );

  if (hasProducts) {
    return FM.toast("Move products before deleting this category");
  }

  confirmAdmin({
    title: "Delete category?",
    message: category.name + " will be removed from the category list.",
    confirmText: "Delete category",
    danger: true,
    onConfirm() {
      FM.set(
        FM.keys.categories,
        categories.filter((item) => item.id !== id),
      );
      admin();
    },
  });
}

async function toggleCustomer(id) {
  const customers = FM.get(FM.keys.customers);
  const customer = customers.find((item) => item.id === id);

  if (!customer) return;

  if (adminToken()) {
    try {
      const data = await adminRequest(
        "/api/admin/customers/" + encodeURIComponent(id),
        {
          method: "PATCH",
          body: JSON.stringify({ active: customer.active === false }),
        },
      );

      cacheAdminStore(data);
      FM.toast("Customer updated");
      admin();
    } catch (error) {
      FM.toast(error.message);
    }
    return;
  }

  customer.active = customer.active === false;
  FM.set(FM.keys.customers, customers);
  admin();
}

function deleteCustomer(id) {
  const customers = FM.get(FM.keys.customers);
  const customer = customers.find((item) => item.id === id);
  const orderCount = FM.get(FM.keys.orders).filter(
    (order) => order.customerId === id,
  ).length;

  if (!customer) return;
  confirmAdmin({
    title: "Delete customer?",
    message:
      customer.name +
      " will be removed. Existing order history stays for reports. Orders: " +
      orderCount,
    confirmText: "Delete customer",
    danger: true,
    async onConfirm() {
      if (adminToken()) {
        try {
          const data = await adminRequest(
            "/api/admin/customers/" + encodeURIComponent(id),
            { method: "DELETE" },
          );

          cacheAdminStore(data);
          FM.toast("Customer deleted");
          admin();
        } catch (error) {
          FM.toast(error.message);
        }
        return;
      }

      FM.set(
        FM.keys.customers,
        customers.filter((item) => item.id !== id),
      );

      const currentCustomer = FM.get(FM.keys.customer, null);
      if (currentCustomer?.id === id) {
        localStorage.removeItem(FM.keys.customer);
      }

      FM.toast("Customer deleted");
      admin();
    },
  });
}

async function status(id, nextStatus) {
  if (adminToken()) {
    try {
      const data = await adminRequest(
        "/api/admin/orders/" + encodeURIComponent(id),
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      cacheAdminStore(data);
      FM.toast("Order status updated");
      admin();
    } catch (error) {
      FM.toast(error.message);
    }
    return;
  }

  const orders = FM.get(FM.keys.orders);
  const order = orders.find((item) => item.id === id);

  if (!order) return;

  if (nextStatus === "Cancelled" && order.orderStatus !== "Cancelled") {
    restoreOrderStock(order);
  }

  order.orderStatus = nextStatus;
  if (
    nextStatus === "Delivered" &&
    order.paymentMethod === "Cash on Delivery"
  ) {
    order.paymentStatus = "Paid";
  }

  FM.set(FM.keys.orders, orders);
  FM.toast("Order status updated");
  admin();
}

function deleteOrder(id) {
  const orders = FM.get(FM.keys.orders);
  const order = orders.find((item) => item.id === id);

  if (!order) return;

  confirmAdmin({
    title: "Delete order?",
    message:
      order.id +
      " will be removed. Stock is restored when the order is not delivered.",
    confirmText: "Delete order",
    danger: true,
    async onConfirm() {
      if (adminToken()) {
        try {
          const data = await adminRequest(
            "/api/admin/orders/" + encodeURIComponent(id),
            { method: "DELETE" },
          );

          cacheAdminStore(data);
          FM.toast("Order deleted");

          if (document.body.dataset.admin === "order-details") {
            location.href = "orders.html";
            return;
          }

          admin();
        } catch (error) {
          FM.toast(error.message);
        }
        return;
      }

      if (order.orderStatus !== "Delivered") {
        restoreOrderStock(order);
      }

      FM.set(
        FM.keys.orders,
        orders.filter((item) => item.id !== id),
      );
      FM.toast("Order deleted");

      if (document.body.dataset.admin === "order-details") {
        location.href = "orders.html";
        return;
      }

      admin();
    },
  });
}

function restoreOrderStock(order) {
  if (order.stockRestored) return;

  const products = FM.products();
  order.items.forEach((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (product) product.stock += item.quantity;
  });

  order.stockRestored = true;
  saveProducts(products);
}

function storeSnapshot() {
  return {
    exportedAt: new Date().toISOString(),
    products: FM.products(),
    categories: FM.get(FM.keys.categories),
    customers: FM.get(FM.keys.customers),
    orders: FM.get(FM.keys.orders),
    cart: FM.cart(),
    wishlist: FM.get(FM.keys.wishlist),
  };
}

function exportStoreData() {
  const blob = new Blob([JSON.stringify(storeSnapshot(), null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "freshmart-admin-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
  FM.toast("Store data exported");
}

function importStoreData(rawBackup) {
  let backup;

  try {
    backup = JSON.parse(rawBackup);
  } catch {
    return FM.toast("Invalid backup JSON");
  }

  if (
    !Array.isArray(backup.products) ||
    !Array.isArray(backup.categories) ||
    !Array.isArray(backup.customers) ||
    !Array.isArray(backup.orders)
  ) {
    return FM.toast("Backup is missing store data");
  }

  if (!saveProducts(backup.products)) return;
  if (!saveCategories(backup.categories)) return;
  FM.set(FM.keys.customers, backup.customers);
  FM.set(FM.keys.orders, backup.orders);
  FM.set(FM.keys.cart, Array.isArray(backup.cart) ? backup.cart : []);
  FM.set(
    FM.keys.wishlist,
    Array.isArray(backup.wishlist) ? backup.wishlist : [],
  );
  FM.toast("Backup imported");
  admin();
}

function clearSessions() {
  localStorage.removeItem(FM.keys.customer);
  localStorage.removeItem(FM.keys.admin);
  FM.toast("Login sessions cleared");
  location.href = "login.html";
}

function resetStoreData() {
  confirmAdmin({
    title: "Reset demo data?",
    message:
      "Products, categories, customers, carts, wishlists and orders will reset on this browser.",
    confirmText: "Reset data",
    danger: true,
    onConfirm() {
      [
        FM.keys.products,
        FM.keys.categories,
        FM.keys.customers,
        FM.keys.customer,
        FM.keys.cart,
        FM.keys.wishlist,
        FM.keys.orders,
      ].forEach((key) => localStorage.removeItem(key));

      FM.toast("Demo data reset");
      location.reload();
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (location.pathname.endsWith("login.html")) {
    document.querySelector("#login").onsubmit = async (event) => {
      event.preventDefault();

      const values = Object.fromEntries(new FormData(event.target));
      const button = event.target.querySelector("button");
      button.disabled = true;

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) throw Error(data.message || "Invalid admin login");
        if (data.user?.role !== "admin") throw Error("Admin access required");

        FM.set(FM.keys.admin, {
          token: data.token,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          loggedInAt: FM.date(),
        });
        location.href = "dashboard.html";
        return;
      } catch (error) {
        FM.toast(error.message);
      } finally {
        button.disabled = false;
      }
    };
    return;
  }

  admin();
});
