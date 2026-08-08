const page = document.body.dataset.page;
const upiPaymentValue = "UPI Payment";
const upiQrImage = "assets/payment/upi-qr.jpeg";
const deliveryOptions = [
  {
    label: "Standard Delivery",
    value: "Standard Delivery",
    charge: 40,
    eta: "Tomorrow or next available slot",
  },
  {
    label: "Same-Day Delivery",
    value: "Same-Day Delivery",
    charge: 80,
    eta: "Delivered today",
  },
  {
    label: "Express 2-Hour Delivery",
    value: "Express 2-Hour Delivery",
    charge: 120,
    eta: "Fastest local delivery",
  },
  {
    label: "Scheduled Morning Slot",
    value: "Scheduled Morning Slot",
    charge: 60,
    eta: "8 AM to 11 AM",
  },
  {
    label: "Store Pickup",
    value: "Store Pickup",
    charge: 0,
    eta: "Collect from store",
  },
];
const paymentOptions = [
  {
    label: "Cash on Delivery",
    value: "Cash on Delivery",
    note: "Pay when the order arrives",
    status: "Pending",
  },
  {
    label: "UPI Payment",
    value: upiPaymentValue,
    note: "Scan and pay with any UPI app",
    status: "Pending",
  },
  {
    label: "Debit / Credit Card",
    value: "Debit / Credit Card",
    note: "Visa, Mastercard and RuPay supported",
    status: "Paid",
  },
  {
    label: "Net Banking",
    value: "Net Banking",
    note: "Pay securely from your bank account",
    status: "Paid",
  },
  {
    label: "Wallet",
    value: "Wallet",
    note: "Use Paytm, Amazon Pay or FreshMart wallet",
    status: "Paid",
  },
];

function sameCategory(a, b) {
  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .replaceAll("&", "and")
      .replace(/\s+/g, " ")
      .trim();

  return normalize(a) === normalize(b);
}

function products() {
  const allProducts = FM.products().filter((product) => product.active);
  const params = new URLSearchParams(location.search);
  const initialSearch = params.get("q") || "";
  const initialCategory = params.get("cat") || "";
  const initialSort = params.get("sort") || "";
  const maxProductPrice = Math.max(
    ...allProducts.map((product) => product.sellingPrice),
    1000,
  );
  const activeCategories = FM.get(FM.keys.categories).filter(
    (category) => category.active,
  );
  const categoryOptions = activeCategories
    .map(
      (category) =>
        `<label class="filter-check">
          <input
            type="checkbox"
            name="category"
            value="${category.name}"
            ${sameCategory(category.name, initialCategory) ? "checked" : ""}
          >
          <span>${category.name}</span>
        </label>`,
    )
    .join("");
  const brandList = [
    ...new Set(allProducts.map((product) => product.brand)),
  ].sort((a, b) => a.localeCompare(b));
  const brandOptions = brandList
    .map(
      (brand) => `
        <label class="filter-check">
          <input type="checkbox" name="brand" value="${brand}">
          <span>${brand}</span>
        </label>
      `,
    )
    .join("");

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <div class="section-head">
        <div>
          <h1>Shop groceries</h1>
          <p class="sub">Filter by category, price, brand, rating and stock.</p>
        </div>
        <button class="btn alt filter-toggle" id="filterToggle">
          <i class="fa-solid fa-sliders"></i> Filters
        </button>
      </div>
      <div class="product-shell">
        <aside class="filter-panel" id="filterPanel" aria-label="Product filters">
          <form id="productFilters">
            <div class="filter-head">
              <h2>Filters</h2>
              <span id="filterCount" class="badge green">No active filters</span>
            </div>
            <label>Search
              <input
                class="input"
                id="q"
                value="${initialSearch}"
                placeholder="Search products, brands or categories"
              >
            </label>
            <label>Sort by
              <select id="sort">
                <option value="">Recommended</option>
                <option value="low" ${initialSort === "low" ? "selected" : ""}>Price: Low to High</option>
                <option value="high" ${initialSort === "high" ? "selected" : ""}>Price: High to Low</option>
                <option value="rating" ${initialSort === "rating" ? "selected" : ""}>Highest Rating</option>
                <option value="discount" ${initialSort === "discount" ? "selected" : ""}>Highest Discount</option>
                <option value="az" ${initialSort === "az" ? "selected" : ""}>Name A to Z</option>
              </select>
            </label>
            <fieldset>
              <legend>Categories</legend>
              <label class="filter-check filter-select-all">
                <input type="checkbox" data-select-all="category">
                <span>Select all categories</span>
              </label>
              <div class="filter-options">${categoryOptions}</div>
            </fieldset>
            <fieldset>
              <legend>Brands</legend>
              <label class="filter-check filter-select-all">
                <input type="checkbox" data-select-all="brand">
                <span>Select all brands</span>
              </label>
              <div class="filter-options">${brandOptions}</div>
            </fieldset>
            <fieldset>
              <legend>Price range</legend>
              <div class="range-row">
                <label>Min
                  <input class="input" id="minPrice" type="number" min="0" value="0">
                </label>
                <label>Max
                  <input class="input" id="maxPrice" type="number" min="0" value="${maxProductPrice}">
                </label>
              </div>
            </fieldset>
            <label>Minimum rating
              <select id="rating">
                <option value="0">Any rating</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
            </label>
            <label>Stock status
              <select id="stockStatus">
                <option value="">All stock</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </label>
            <label>Minimum discount
              <input class="input" id="discount" type="number" min="0" max="90" value="0">
            </label>
            <button class="btn alt" id="clearFilters" type="button">Clear filters</button>
          </form>
        </aside>
        <section class="product-results" aria-live="polite">
          <div class="result-head">
            <p class="sub" id="found"></p>
          </div>
          <div class="grid skeleton-grid" id="productSkeleton">
            ${Array.from({ length: 8 }, () => '<div class="skeleton-card"></div>').join("")}
          </div>
          <div class="grid" id="products" hidden></div>
        </section>
      </div>
    </div>
  `;

  const selectedValues = (name) =>
    [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(
      (input) => input.value,
    );
  const sortResults = (results, sort) => {
    results.sort((a, b) =>
      sort === "low"
        ? a.sellingPrice - b.sellingPrice
        : sort === "high"
          ? b.sellingPrice - a.sellingPrice
          : sort === "rating"
            ? b.rating - a.rating
            : sort === "discount"
              ? b.discount - a.discount
              : sort === "az"
                ? a.name.localeCompare(b.name)
                : Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
    );
  };
  const render = () => {
    const searchTerm = document.querySelector("#q").value.toLowerCase();
    const categories = selectedValues("category");
    const brands = selectedValues("brand");
    const sort = document.querySelector("#sort").value;
    const minPrice = Number(document.querySelector("#minPrice").value) || 0;
    const maxPrice =
      Number(document.querySelector("#maxPrice").value) || maxProductPrice;
    const rating = Number(document.querySelector("#rating").value) || 0;
    const stockStatus = document.querySelector("#stockStatus").value;
    const discount = Number(document.querySelector("#discount").value) || 0;
    const activeCategoryCount =
      categories.length && categories.length < activeCategories.length
        ? categories.length
        : 0;
    const activeBrandCount =
      brands.length && brands.length < brandList.length ? brands.length : 0;

    const results = allProducts
      .filter((product) =>
        categories.length
          ? categories.some((category) =>
              sameCategory(product.category, category),
            )
          : true,
      )
      .filter((product) =>
        brands.length ? brands.includes(product.brand) : true,
      )
      .filter(
        (product) =>
          product.sellingPrice >= minPrice && product.sellingPrice <= maxPrice,
      )
      .filter((product) => product.rating >= rating)
      .filter((product) => product.discount >= discount)
      .filter((product) => {
        if (stockStatus === "in") return product.stock > 0;
        if (stockStatus === "low")
          return product.stock > 0 && product.stock <= product.minimumStock;
        if (stockStatus === "out") return !product.stock;
        return true;
      })
      .filter((product) =>
        JSON.stringify(product).toLowerCase().includes(searchTerm),
      );

    sortResults(results, sort);

    document.querySelector("#found").textContent =
      `${results.length} products found${searchTerm ? ` for "${searchTerm}"` : ""}`;
    const activeFilters = [
      activeCategoryCount,
      activeBrandCount,
      minPrice > 0,
      maxPrice < maxProductPrice,
      rating,
      stockStatus,
      discount,
      searchTerm,
    ].filter(Boolean).length;
    document.querySelector("#filterCount").textContent = activeFilters
      ? activeFilters + " active"
      : "No active filters";
    updateSelectAllState("category");
    updateSelectAllState("brand");
    document.querySelector("#products").innerHTML = results.length
      ? results.map(productCard).join("")
      : `<div class="empty">
          <h2>No products found</h2>
          <p>Try changing the filters or search term.</p>
          <a class="btn" href="products.html">Clear all filters</a>
        </div>`;
  };

  const filters = document.querySelector("#productFilters");
  const productsGrid = document.querySelector("#products");
  const skeleton = document.querySelector("#productSkeleton");
  const updateSelectAllState = (name) => {
    const group = [...document.querySelectorAll(`input[name="${name}"]`)];
    const selectAll = document.querySelector(`[data-select-all="${name}"]`);

    if (!selectAll || !group.length) return;

    const checked = group.filter((input) => input.checked).length;
    selectAll.checked = checked === group.length;
    selectAll.indeterminate = checked > 0 && checked < group.length;
  };

  filters.addEventListener("input", (event) => {
    if (event.target.dataset.selectAll) return;
    render();
  });
  filters.addEventListener("change", (event) => {
    const groupName = event.target.dataset.selectAll;

    if (!groupName) return;

    document
      .querySelectorAll(`input[name="${groupName}"]`)
      .forEach((input) => (input.checked = event.target.checked));
    render();
  });
  document.querySelector("#clearFilters").onclick = () => {
    filters.reset();
    document
      .querySelectorAll('input[name="category"], input[name="brand"]')
      .forEach((input) => (input.checked = false));
    document.querySelectorAll("[data-select-all]").forEach((input) => {
      input.checked = false;
      input.indeterminate = false;
    });
    document.querySelector("#q").value = "";
    document.querySelector("#sort").value = "";
    document.querySelector("#minPrice").value = 0;
    document.querySelector("#maxPrice").value = maxProductPrice;
    document.querySelector("#rating").value = "0";
    document.querySelector("#stockStatus").value = "";
    document.querySelector("#discount").value = 0;
    render();
  };
  document.querySelector("#filterToggle").onclick = () => {
    document.querySelector("#filterPanel").classList.toggle("open");
  };
  requestAnimationFrame(() => {
    render();
    skeleton.hidden = true;
    productsGrid.hidden = false;
  });
}

function home() {
  const categories = FM.get(FM.keys.categories).filter(
    (category) => category.active,
  );
  const products = FM.products().filter((product) => product.active);
  const categoryCards = categories
    .map(
      (category) => `
        <div class="category">
          <img
            src="${FM.imageUrl(category.image)}"
            alt="${category.name}"
            loading="lazy"
            onerror="FM.imageError(event)"
          >
          <h3>${category.name}</h3>
          <a class="btn" href="products.html?cat=${encodeURIComponent(category.name)}">View Products</a>
        </div>
      `,
    )
    .join("");
  const featuredCards = products
    .filter((product) => product.featured)
    .slice(0, 8)
    .map(productCard)
    .join("");
  const benefitCards = [
    "Fresh Products",
    "Affordable Prices",
    "Fast Delivery",
    "Easy Ordering",
  ]
    .map(
      (benefit) => `
        <div class="panel">
          <h3>✓ ${benefit}</h3>
          <p class="sub">A better way to shop for your everyday essentials.</p>
        </div>
      `,
    )
    .join("");

  document.querySelector("#content").innerHTML = `
    <section class="hero">
      <div class="container">
        <h1>Fresh Groceries Delivered to Your Door</h1>
        <p>Everyday essentials, handpicked fresh and delivered when you need them.</p>
        <a class="btn" href="products.html">Shop Now</a>
        <a class="btn alt" href="products.html?sort=discount">View Offers</a>
      </div>
    </section>

    <div class="container section">
      <h2>Shop by category</h2>
      <p class="sub">Everything your home needs, in one place.</p>
      <div class="grid">${categoryCards}</div>
    </div>

    <div class="container section">
      <h2>Featured products</h2>
      <div class="grid">${featuredCards}</div>
    </div>

    <div class="container section">
      <h2>Why FreshMart?</h2>
      <div class="grid">${benefitCards}</div>
    </div>
  `;
}

function details() {
  const product = FM.products().find(
    (item) => item.id === new URLSearchParams(location.search).get("id"),
  );
  if (!product) return (location.href = "products.html");
  const disabled = product.stock ? "" : "disabled";

  document.querySelector("#content").innerHTML = `
    <div class="container section layout">
      <div class="panel">
        <img
          style="width:100%;height:350px;object-fit:contain"
          src="${FM.imageUrl(product.image)}"
          alt="${product.name}"
          loading="lazy"
          onerror="FM.imageError(event)"
        >
      </div>
      <div class="panel">
        <span class="badge">${product.discount}% OFF</span>
        <h1>${product.name}</h1>
        <p class="sub">${product.brand} · ${product.category}</p>
        <p>${product.description}</p>
        <div class="price">
          ${FM.money(product.sellingPrice)}
          <span class="old">${FM.money(product.originalPrice)}</span>
        </div>
        <p>★ ${product.rating} · ${product.stock} available · ${product.weight}</p>
        <div class="row">
          <button
            class="icon-btn"
            ${disabled}
            onclick="qty.value=Math.max(1,+qty.value-1)"
          >
            −
          </button>
          <input
            id="qty"
            class="input"
            style="width:60px"
            value="1"
            type="number"
            min="1"
            max="${product.stock}"
            ${disabled}
          >
          <button
            class="icon-btn"
            ${disabled}
            onclick="qty.value=Math.min(${product.stock},+qty.value+1)"
          >
            +
          </button>
        </div>
        <button class="btn" ${disabled} onclick="addCart('${product.id}',+qty.value)">Add to Cart</button>
        <button
          class="btn alt"
          ${disabled}
          onclick="addCart('${product.id}',+qty.value);location.href='checkout.html'"
        >
          Buy Now
        </button>
        <h3>Product information</h3>
        <p>
          <b>Ingredients:</b> ${product.ingredients}<br>
          <b>Storage:</b> ${product.storageInstructions}
        </p>
      </div>
    </div>
  `;
}

function cart() {
  const products = FM.products();
  const items = FM.cart()
    .map((item) => ({
      ...products.find((product) => product.id === item.productId),
      quantity: item.quantity,
    }))
    .filter((item) => item.id);

  if (!items.length) {
    document.querySelector("#content").innerHTML = `
      <div class="container section">
        <div class="empty">
          <h2>Your cart is empty</h2>
          <a class="btn" href="products.html">Start shopping</a>
        </div>
      </div>
    `;
    return;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  );
  const delivery = subtotal ? 40 : 0;
  const cartRows = items
    .map(
      (item) => `
        <div class="row">
          <img
            src="${FM.imageUrl(item.image)}"
            alt="${item.name}"
            loading="lazy"
            onerror="FM.imageError(event)"
          >
          <div class="grow">
            <b>${item.name}</b>
            <div>${FM.money(item.sellingPrice)}</div>
          </div>
          <button class="icon-btn" onclick="change('${item.id}',-1)">−</button>
          <b>${item.quantity}</b>
          <button class="icon-btn" onclick="change('${item.id}',1)">+</button>
          <button class="icon-btn" onclick="removeCart('${item.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `,
    )
    .join("");

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <h1>Your cart</h1>
      <div class="layout">
        <div class="panel">
          ${
            items.length
              ? cartRows
              : `<div class="empty">
                  <h2>Your cart is empty</h2>
                  <a class="btn" href="products.html">Start shopping</a>
                </div>`
          }
        </div>
        <div class="panel summary">
          <h2>Order summary</h2>
          <div><span>Items (${items.length})</span><b>${FM.money(subtotal)}</b></div>
          <div><span>Delivery</span><b>${FM.money(delivery)}</b></div>
          <div class="total">
            <span>Total</span>
            <span>${FM.money(subtotal + delivery)}</span>
          </div>
          ${
            items.length
              ? '<a class="btn" href="checkout.html">Proceed to Checkout</a>'
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function change(id, amount) {
  const cartItems = FM.cart();
  const cartItem = cartItems.find((item) => item.productId === id);
  const product = FM.products().find((item) => item.id === id);

  if (!cartItem || !product) {
    FM.saveCart(cartItems.filter((item) => item.productId !== id));
    return cart();
  }

  cartItem.quantity = Math.max(
    1,
    Math.min(product.stock, cartItem.quantity + amount),
  );
  FM.saveCart(cartItems);
  cart();
}

function removeCart(id) {
  FM.saveCart(FM.cart().filter((item) => item.productId !== id));
  cart();
}

function auth(register = false) {
  const registerFields = `
    <div class="form">
      <label>Full name<input class="input" name="name" required></label>
      <label>Mobile number<input class="input" name="mobile" pattern="[0-9]{10}" required></label>
      <label class="wide">Address<input class="input" name="address" required></label>
      <label>City<input class="input" name="city" required></label>
      <label>PIN code<input class="input" name="pin" pattern="[0-9]{6}" required></label>
    </div>
  `;

  document.querySelector("#content").innerHTML = `
    <div class="auth">
      <form class="panel" id="auth">
        <h1>${register ? "Create account" : "Welcome back"}</h1>
        ${register ? registerFields : ""}
        <label>Email address<input class="input" name="email" type="email" required></label>
        <br>
        <label>Password<input class="input" name="password" type="password" minlength="6" required></label>
        <button class="btn">${register ? "Register" : "Log in"}</button>
        <p class="sub">
          ${
            register
              ? 'Already have an account? <a href="login.html">Log in</a>'
              : 'New to FreshMart? <a href="register.html">Create an account</a>'
          }
        </p>
      </form>
    </div>
  `;

  const authForm = document.querySelector("#auth");
  authForm.onsubmit = (event) => {
    event.preventDefault();

    const formValues = Object.fromEntries(new FormData(authForm));
    const customers = FM.get(FM.keys.customers);

    if (register) {
      if (
        customers.some(
          (customer) =>
            customer.email === formValues.email ||
            customer.mobile === formValues.mobile,
        )
      ) {
        return FM.toast("Email or mobile already registered");
      }

      customers.push({
        ...formValues,
        id: FM.id("CUST", customers),
        registeredDate: FM.date(),
        active: true,
      });
      FM.set(FM.keys.customers, customers);
      FM.toast("Registration successful");
      location.href = "login.html";
      return;
    }

    const customer = customers.find(
      (item) =>
        item.email === formValues.email &&
        item.password === formValues.password &&
        item.active,
    );
    if (!customer) return FM.toast("Invalid login details");

    FM.set(FM.keys.customer, customer);
    FM.toast("Login successful");
    location.href = "index.html";
  };
}

function checkout() {
  const user = FM.get(FM.keys.customer, null);
  if (!user) return (location.href = "login.html");

  const products = FM.products();
  const items = FM.cart()
    .map((item) => ({
      ...products.find((product) => product.id === item.productId),
      quantity: item.quantity,
    }))
    .filter((item) => item.id);

  if (!items.length) {
    document.querySelector("#content").innerHTML = `
      <div class="container section">
        <div class="empty">
          Your cart is empty. Add a few groceries before checkout.
          <br><br>
          <a class="btn" href="products.html">Shop products</a>
        </div>
      </div>
    `;
    return;
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  );
  const checkoutState = {
    step: 1,
    values: {
      name: user.name || "",
      mobile: user.mobile || "",
      address: user.address || "",
      city: user.city || "",
      pin: user.pin || "",
      delivery: "Standard Delivery",
      payment: "Cash on Delivery",
    },
  };
  const steps = ["Cart", "Address", "Delivery", "Review"];
  const summaryRows = () =>
    items
      .map(
        (item) => `
          <div>
            <span>${item.name} × ${item.quantity}</span>
            <b>${FM.money(item.sellingPrice * item.quantity)}</b>
          </div>
        `,
      )
      .join("");
  const stepMarkup = () =>
    steps
      .map(
        (step, index) => `
          <span class="checkout-step ${index + 1 <= checkoutState.step ? "active" : ""}" ${index + 1 === checkoutState.step ? 'aria-current="step"' : ""}>
            <b>${index + 1}</b>${step}
          </span>
        `,
      )
      .join("");
  const currentTotal = () =>
    subtotal + deliveryChargeFor(checkoutState.values.delivery);
  const saveStepValues = (form) => {
    Object.assign(checkoutState.values, Object.fromEntries(new FormData(form)));
  };
  const itemRows = () =>
    items
      .map(
        (item) => `
          <div class="row">
            <img
              src="${FM.imageUrl(item.image)}"
              alt="${item.name}"
              loading="lazy"
              onerror="FM.imageError(event)"
            >
            <div class="grow">
              <b>${item.name}</b>
              <div class="sub">${item.quantity} × ${FM.money(item.sellingPrice)}</div>
            </div>
            <b>${FM.money(item.quantity * item.sellingPrice)}</b>
          </div>
        `,
      )
      .join("");
  const upiQrCard = () =>
    checkoutState.values.payment === upiPaymentValue
      ? `
        <div class="upi-qr-card" role="note">
          <div>
            <span class="payment-status">Secure UPI payment</span>
            <b>Scan and pay</b>
            <p>Open any UPI app, scan this QR, and pay <strong>${FM.money(currentTotal())}</strong>.</p>
            <div class="payment-apps">
              <span>Google Pay</span>
              <span>PhonePe</span>
              <span>Paytm</span>
              <span>BHIM</span>
            </div>
            <small>You can also place the order now and keep payment pending.</small>
          </div>
          <img src="${upiQrImage}" alt="UPI QR code for FreshMart payment">
        </div>
      `
      : "";
  const renderStepBody = () => {
    if (checkoutState.step === 1) {
      return `
        <h2>Review cart</h2>
        ${itemRows()}
        <div class="checkout-actions">
          <a class="btn alt" href="cart.html">Edit cart</a>
          <button class="btn" data-next>Continue</button>
        </div>
      `;
    }

    if (checkoutState.step === 2) {
      return `
        <h2>Delivery address</h2>
        <div class="form">
          <label>Full name<input class="input" name="name" value="${checkoutState.values.name}" required></label>
          <label>Mobile<input class="input" name="mobile" value="${checkoutState.values.mobile}" pattern="[0-9]{10}" required></label>
          <label class="wide">Address<input class="input" name="address" value="${checkoutState.values.address}" required></label>
          <label>City<input class="input" name="city" value="${checkoutState.values.city}" required></label>
          <label>PIN code<input class="input" name="pin" value="${checkoutState.values.pin}" pattern="[0-9]{6}" required></label>
        </div>
        <div class="checkout-actions">
          <button class="btn alt" type="button" data-back>Back</button>
          <button class="btn" data-next>Continue</button>
        </div>
      `;
    }

    if (checkoutState.step === 3) {
      return `
        <h2>Delivery and payment</h2>
        <div class="checkout-options">
          <fieldset>
            <legend>Delivery option</legend>
            <div class="option-grid">
              ${deliveryOptions
                .map(
                  (option) => `
                    <label class="option-card">
                      <input
                        type="radio"
                        name="delivery"
                        value="${option.value}"
                        ${option.value === checkoutState.values.delivery ? "checked" : ""}
                      >
                      <span>
                        <b>${option.label}</b>
                        <small>${option.eta}</small>
                      </span>
                      <strong>${option.charge ? FM.money(option.charge) : "Free"}</strong>
                    </label>
                  `,
                )
                .join("")}
            </div>
          </fieldset>
          <fieldset>
            <legend>Payment option</legend>
            <div class="option-grid">
              ${paymentOptions
                .map(
                  (option) => `
                    <label class="option-card">
                      <input
                        type="radio"
                        name="payment"
                        value="${option.value}"
                        ${option.value === checkoutState.values.payment ? "checked" : ""}
                      >
                      <span>
                        <b>${option.label}</b>
                        <small>${option.note}</small>
                      </span>
                    </label>
                  `,
                )
                .join("")}
            </div>
            ${upiQrCard()}
          </fieldset>
          <p class="payment-note wide">
            Online payments are recorded after confirmation. Orders can still be placed while payment is pending.
          </p>
        </div>
        <div class="checkout-actions">
          <button class="btn alt" type="button" data-back>Back</button>
          <button class="btn" data-next>Review order</button>
        </div>
      `;
    }

    return `
      <h2>Confirm order</h2>
      <div class="review-box">
        <p>
          <b>${checkoutState.values.name}</b><br>
          ${checkoutState.values.mobile}<br>
          ${checkoutState.values.address}, ${checkoutState.values.city} ${checkoutState.values.pin}
        </p>
        <p>
          <b>Delivery:</b> ${deliveryLabelFor(checkoutState.values.delivery)}<br>
          <b>Payment:</b> ${checkoutState.values.payment}<br>
          <b>Status:</b> ${paymentStatusFor(checkoutState.values.payment)}
        </p>
      </div>
      ${itemRows()}
      <div class="checkout-actions">
        <button class="btn alt" type="button" data-back>Back</button>
        <button class="btn" data-place>Place order</button>
      </div>
    `;
  };

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <h1>Checkout</h1>
      <div class="layout">
        <form class="panel checkout-panel" id="checkout">
          <div class="checkout-steps" aria-label="Checkout progress"></div>
          <div id="checkoutStep"></div>
        </form>
        <div class="panel summary">
          <h2>Order summary</h2>
          <div id="checkoutSummaryRows"></div>
          <div><span>Delivery</span><b id="deliveryAmount"></b></div>
          <div class="total">
            <span>Total</span>
            <span id="checkoutTotal"></span>
          </div>
        </div>
      </div>
    </div>
  `;

  const updateSummary = () => {
    document.querySelector("#checkoutSummaryRows").innerHTML = summaryRows();
    document.querySelector("#deliveryAmount").textContent = FM.money(
      deliveryChargeFor(checkoutState.values.delivery),
    );
    document.querySelector("#checkoutTotal").textContent =
      FM.money(currentTotal());
  };
  const renderCheckout = () => {
    document.querySelector(".checkout-steps").innerHTML = stepMarkup();
    document.querySelector("#checkoutStep").innerHTML = renderStepBody();
    updateSummary();
  };
  const placeOrder = () => {
    const orders = FM.get(FM.keys.orders);
    const latestProducts = FM.products();

    for (const item of items) {
      const product = latestProducts.find((entry) => entry.id === item.id);
      if (product.stock < item.quantity) {
        return FM.toast("Insufficient stock for " + product.name);
      }
      product.stock -= item.quantity;
    }

    FM.saveProducts(latestProducts);
    const deliveryCharge = deliveryChargeFor(checkoutState.values.delivery);
    const total = subtotal + deliveryCharge;
    const order = {
      id: "FM" + Date.now(),
      customerId: user.id,
      customerName: checkoutState.values.name,
      customerEmail: user.email,
      customerMobile: checkoutState.values.mobile,
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.sellingPrice,
        quantity: item.quantity,
        subtotal: item.sellingPrice * item.quantity,
        image: item.image,
      })),
      deliveryAddress: {
        name: checkoutState.values.name,
        mobile: checkoutState.values.mobile,
        address: checkoutState.values.address,
        city: checkoutState.values.city,
        pin: checkoutState.values.pin,
      },
      deliveryMethod: deliveryLabelFor(checkoutState.values.delivery),
      subtotal,
      discount: 0,
      deliveryCharge,
      totalAmount: total,
      paymentMethod: checkoutState.values.payment,
      paymentStatus: paymentStatusFor(checkoutState.values.payment),
      orderStatus: "Order Placed",
      orderDate: FM.date(),
      estimatedDeliveryDate: FM.date(Date.now() + 172800000),
    };

    orders.unshift(order);
    FM.set(FM.keys.orders, orders);
    FM.saveCart([]);
    FM.set("freshmart_latest_order", order.id);
    location.href = "order-success.html";
  };

  document.querySelector("#checkout").addEventListener("input", (event) => {
    if (event.target.name) {
      checkoutState.values[event.target.name] = event.target.value;
      if (event.target.name === "payment" && checkoutState.step === 3) {
        renderCheckout();
        return;
      }
      updateSummary();
    }
  });
  document.querySelector("#checkout").onsubmit = (event) => {
    event.preventDefault();
  };
  document.querySelector("#checkout").addEventListener("click", (event) => {
    const form = document.querySelector("#checkout");

    if (event.target.closest("[data-back]")) {
      checkoutState.step = Math.max(1, checkoutState.step - 1);
      renderCheckout();
      return;
    }

    if (event.target.closest("[data-next]")) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      saveStepValues(form);
      checkoutState.step = Math.min(4, checkoutState.step + 1);
      renderCheckout();
      return;
    }

    if (event.target.closest("[data-place]")) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      saveStepValues(form);
      placeOrder();
    }
  });
  renderCheckout();
}

function deliveryChargeFor(method) {
  return (
    deliveryOptions.find((option) => option.value === method)?.charge ??
    deliveryOptions[0].charge
  );
}

function deliveryLabelFor(method) {
  const option = deliveryOptions.find((entry) => entry.value === method);

  if (!option) return method;

  return (
    option.label +
    " - " +
    (option.charge ? FM.money(option.charge) : "Free") +
    " (" +
    option.eta +
    ")"
  );
}

function paymentStatusFor(method) {
  return (
    paymentOptions.find((option) => option.value === method)?.status ||
    "Pending"
  );
}

function orders() {
  const user = FM.get(FM.keys.customer, null);
  const userOrders = FM.get(FM.keys.orders).filter(
    (order) => user && order.customerId === user.id,
  );
  const orderCards = userOrders
    .map(
      (order) => `
        <div class="panel" style="margin:12px 0">
          <div class="row">
            <div class="grow">
              <b>${order.id}</b>
              <div class="sub">
                ${order.orderDate} · ${order.items.length} items · ${FM.money(order.totalAmount)}
              </div>
            </div>
            <span class="status ${order.orderStatus}">${order.orderStatus}</span>
            <a class="btn" href="order-details.html?id=${order.id}">View details</a>
            ${
              ["Order Placed", "Confirmed"].includes(order.orderStatus)
                ? `<button class="icon-btn" onclick="cancelOrder('${order.id}')">Cancel</button>`
                : ""
            }
          </div>
        </div>
      `,
    )
    .join("");

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <h1>My orders</h1>
      ${userOrders.length ? orderCards : '<div class="empty">No orders yet.</div>'}
    </div>
  `;
}

function orderDetails(success = false) {
  const orderId =
    new URLSearchParams(location.search).get("id") ||
    FM.get("freshmart_latest_order", "");
  const order = FM.get(FM.keys.orders).find((item) => item.id === orderId);

  if (!order) return orders();

  const steps = [
    "Order Placed",
    "Confirmed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  const currentStep = steps.indexOf(order.orderStatus);
  const progressSteps = steps
    .map(
      (step, index) => `
        <div
          class="grow"
          style="color:${index <= currentStep ? "#16803a" : "#879089"}"
        >
          <b>${index <= currentStep ? "✓ " : ""}${step}</b>
        </div>
      `,
    )
    .join("");
  const itemRows = order.items
    .map(
      (item) => `
        <div class="row">
          <img
            src="${FM.imageUrl(item.image)}"
            alt="${item.name}"
            loading="lazy"
            onerror="FM.imageError(event)"
          >
          <div class="grow">
            <b>${item.name}</b><br>
            ${item.quantity} × ${FM.money(item.price)}
          </div>
          <b>${FM.money(item.subtotal)}</b>
        </div>
      `,
    )
    .join("");

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <div class="panel">
        <h1>${success ? "✓ Order Successfully Placed" : "Order " + order.id}</h1>
        <p class="sub">${order.id} · ${order.orderDate}</p>
        <div class="row">${progressSteps}</div>
        <h2>
          ${FM.money(order.totalAmount)}
          <span class="status ${order.orderStatus}">${order.orderStatus}</span>
        </h2>
        <p>
          <b>Payment:</b> ${order.paymentMethod} (${order.paymentStatus})<br>
          <b>Delivery option:</b> ${order.deliveryMethod || "Standard Delivery"}<br>
          <b>Delivery address:</b> ${order.deliveryAddress.address || ""},
          ${order.deliveryAddress.city || ""} · ${order.estimatedDeliveryDate}
        </p>
        <h3>Items</h3>
        ${itemRows}
        <br>
        <a class="btn" href="my-orders.html">View all orders</a>
        <a class="btn alt" href="products.html">Continue shopping</a>
      </div>
    </div>
  `;
}

function cancelOrder(id) {
  const orderList = FM.get(FM.keys.orders);
  const order = orderList.find((item) => item.id === id);
  if (!order || order.stockRestored) return;

  order.orderStatus = "Cancelled";
  order.stockRestored = true;

  const products = FM.products();
  order.items.forEach((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (product) product.stock += item.quantity;
  });

  FM.saveProducts(products);
  FM.set(FM.keys.orders, orderList);
  FM.toast("Order cancelled successfully");
  orders();
}

function wishlist() {
  const wishlistIds = FM.get(FM.keys.wishlist);
  const items = FM.products().filter((product) =>
    wishlistIds.includes(product.id),
  );

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <h1>My wishlist</h1>
      <div class="grid">
        ${
          items.length
            ? items.map(productCard).join("")
            : '<div class="empty">Your wishlist is waiting for favourites.</div>'
        }
      </div>
    </div>
  `;
}

function profile() {
  const user = FM.get(FM.keys.customer, null);
  if (!user) return (location.href = "login.html");

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <form class="panel form" id="profileForm">
        <h1>My profile</h1>
        <label>Full name<input class="input" name="name" value="${user.name}" required></label>
        <label>Email<input class="input" name="email" type="email" value="${user.email}" required></label>
        <label>Mobile<input class="input" name="mobile" value="${user.mobile}" pattern="[0-9]{10}" required></label>
        <label>Password<input class="input" name="password" type="password" value="${user.password}" minlength="6" required></label>
        <label class="wide">Address<input class="input" name="address" value="${user.address || ""}" required></label>
        <label>City<input class="input" name="city" value="${user.city || ""}" required></label>
        <label>PIN code<input class="input" name="pin" value="${user.pin || ""}" pattern="[0-9]{6}" required></label>
        <div class="wide">
          <button class="btn">Save profile</button>
          <a class="btn alt" href="my-orders.html">View orders</a>
          <button type="button" class="btn alt" id="logout">Log out</button>
        </div>
      </form>
    </div>
  `;

  document.querySelector("#profileForm").onsubmit = (event) => {
    event.preventDefault();

    const values = Object.fromEntries(new FormData(event.target));
    const customers = FM.get(FM.keys.customers);
    let current = customers.find((customer) => customer.id === user.id);

    if (
      customers.some(
        (customer) =>
          customer.id !== user.id &&
          (customer.email === values.email ||
            customer.mobile === values.mobile),
      )
    ) {
      return FM.toast("Email or mobile already registered");
    }

    if (!current) {
      current = { ...user, id: user.id || FM.id("CUST", customers) };
      customers.push(current);
    }

    Object.assign(current, values);
    FM.set(FM.keys.customers, customers);
    FM.set(FM.keys.customer, current);
    FM.toast("Profile updated");
  };

  document.querySelector("#logout").onclick = () => {
    localStorage.removeItem("freshmart_current_customer");
    location.href = "index.html";
  };
}

function simple() {
  const name = page.replace(".html", "").replaceAll("-", " ");
  const title = name[0].toUpperCase() + name.slice(1);
  const content = {
    about: `
      <p>
        FreshMart is a neighbourhood grocery store built for everyday shopping:
        fresh produce, pantry staples, dairy, snacks, household care and quick delivery.
      </p>
      <div class="grid">
        <div class="panel"><h3>Fresh stock</h3><p class="sub">Daily essentials are checked for quality and availability.</p></div>
        <div class="panel"><h3>Fair prices</h3><p class="sub">Clear offers, practical packs and no hidden checkout surprises.</p></div>
        <div class="panel"><h3>Simple service</h3><p class="sub">Easy ordering, order tracking and local support for every customer.</p></div>
        <div class="panel"><h3>Admin ready</h3><p class="sub">Store managers can update products, images, inventory and orders.</p></div>
      </div>
    `,
    contact: `
      <p>
        Need help with an order, delivery, return, or product availability?
        Reach the FreshMart team below.
      </p>
      <div class="grid">
        <div class="panel"><h3>Phone</h3><p class="sub">+91 98765 43210</p></div>
        <div class="panel"><h3>Email</h3><p class="sub">hello@freshmart.example</p></div>
        <div class="panel"><h3>Store</h3><p class="sub">21 Market Road, Mumbai</p></div>
        <div class="panel"><h3>Hours</h3><p class="sub">Daily, 8 AM to 10 PM</p></div>
      </div>
    `,
  };

  document.querySelector("#content").innerHTML = `
    <div class="container section">
      <h1>${title}</h1>
      ${content[page] || "<p>FreshMart is your neighbourhood supermarket online.</p>"}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  if (page === "index") home();
  else if (page === "products") products();
  else if (page === "details") details();
  else if (page === "cart") cart();
  else if (page === "login") auth();
  else if (page === "register") auth(true);
  else if (page === "checkout") checkout();
  else if (page === "orders") orders();
  else if (page === "order-details") orderDetails();
  else if (page === "order-success") orderDetails(true);
  else if (page === "wishlist") wishlist();
  else if (page === "profile") profile();
  else simple();
});
