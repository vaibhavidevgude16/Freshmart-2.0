function header() {
  const cartCount = FM.cart().reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = FM.get(FM.keys.wishlist).length;
  const accountHref = FM.get(FM.keys.customer, null)
    ? "profile.html"
    : "login.html";

  return `
    <a class="skip-link" href="#content">Skip to content</a>
    <nav class="nav">
      <a class="logo" href="index.html">
        <i class="fa-solid fa-leaf"></i> FreshMart
      </a>
      <button
        class="nav-toggle"
        id="navToggle"
        aria-label="Open menu"
        aria-controls="navLinks"
        aria-expanded="false"
      >
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="navlinks" id="navLinks">
        <a href="index.html">Home</a>
        <a href="products.html">Products</a>
        <a href="products.html">Categories</a>
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact</a>
        <a href="admin/login.html">Admin</a>
      </div>
      <input
        class="nav-search"
        id="globalSearch"
        aria-label="Search groceries"
        placeholder="Search groceries..."
      >
      <div class="nav-actions">
        <a href="wishlist.html" aria-label="Wishlist">
          <i class="fa-regular fa-heart"></i>
          <span class="count">${wishlistCount}</span>
        </a>
        <a href="cart.html" aria-label="Cart">
          <i class="fa-solid fa-bag-shopping"></i>
          <span class="count">${cartCount}</span>
        </a>
        <a href="${accountHref}" aria-label="Account">
          <i class="fa-regular fa-user"></i>
        </a>
      </div>
    </nav>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div>
        <h2>FreshMart Supermarket</h2>
        <p>Fresh food, fair prices and simple ordering for every home.</p>
      </div>
      <div>
        <h3>Quick links</h3>
        <a href="products.html">Products</a>
        <a href="my-orders.html">My Orders</a>
        <a href="about.html">About us</a>
      </div>
      <div>
        <h3>Support</h3>
        <a href="contact.html">Contact us</a>
        <a href="profile.html">My profile</a>
        <a href="admin/login.html">Admin panel</a>
      </div>
      <div>
        <h3>Visit us</h3>
        <p>21 Market Road, Mumbai<br>+91 98765 43210<br>Daily: 8 AM – 10 PM</p>
      </div>
    </footer>
  `;
}

function updateCounts() {
  const counts = document.querySelectorAll(".count");

  if (counts[0]) {
    counts[0].textContent = FM.get(FM.keys.wishlist).length;
  }

  if (counts[1]) {
    counts[1].textContent = FM.cart().reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }
}

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function jsString(value = "") {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function productDiscount(product) {
  if (Number.isFinite(Number(product.discount))) return Number(product.discount);

  return Math.max(
    0,
    Math.round(
      ((Number(product.originalPrice) - Number(product.sellingPrice)) /
        Number(product.originalPrice)) *
        100,
    ),
  );
}

function productCard(product) {
  const stockLabel = product.stock
    ? product.stock <= product.minimumStock
      ? "Low stock: " + product.stock
      : "In stock: " + product.stock
    : "Out of stock";
  const stockClass = product.stock
    ? product.stock <= product.minimumStock
      ? "badge warn"
      : "badge green"
    : "badge red";
  const disabled = product.stock ? "" : "disabled";
  const isWished = FM.get(FM.keys.wishlist).includes(product.id);
  const heartClass = isWished ? "fa-solid" : "fa-regular";
  const heartLabel = isWished ? "Remove from wishlist" : "Add to wishlist";
  const imageFit = product.imageFit || "contain";
  const imagePosition = product.imagePosition || "center";
  const description =
    product.description ||
    `${product.brand} ${product.name} for everyday FreshMart shopping.`;
  const productId = jsString(product.id);
  const actionProductId = escapeHtml(productId);
  const escapedProductId = escapeHtml(product.id);
  const detailsHref = `product-details.html?id=${encodeURIComponent(
    product.id,
  )}`;

  return `
    <article class="card">
      <span class="badge">${productDiscount(product)}% OFF</span>
      <button class="icon-btn wish-btn" aria-label="${escapeHtml(heartLabel)}" onclick="wish('${actionProductId}')">
        <i class="${heartClass} fa-heart"></i>
      </button>
      <a
        class="card-detail-trigger"
        href="${escapeHtml(detailsHref)}"
        onclick="openProductWindow('${actionProductId}', event)"
        aria-label="View details for ${escapeHtml(product.name)}"
      >
        <img
          src="${escapeHtml(FM.imageUrl(product.image))}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          style="object-fit:${escapeHtml(imageFit)};object-position:${escapeHtml(imagePosition)}"
          onerror="FM.imageError(event)"
        >
        <h3>${escapeHtml(product.name)}</h3>
        <div class="brand">${escapeHtml(product.brand)} · ${escapeHtml(product.weight)}</div>
        <p class="card-description">${escapeHtml(description)}</p>
        <div class="card-meta">
          <span aria-label="Rating">★ ${escapeHtml(product.rating)}</span>
          <span class="${stockClass}">${escapeHtml(stockLabel)}</span>
        </div>
        <div class="price">
          ${FM.money(product.sellingPrice)}
          <span class="old">${FM.money(product.originalPrice)}</span>
        </div>
      </a>
      <div class="qty-control" aria-label="Quantity for ${escapeHtml(product.name)}">
        <button
          class="icon-btn"
          ${disabled}
          aria-label="Decrease quantity"
          onclick="cardQty('${actionProductId}', -1)"
        >
          −
        </button>
        <input
          id="cardQty-${escapedProductId}"
          value="1"
          readonly
          aria-label="Selected quantity"
        >
        <button
          class="icon-btn"
          ${disabled}
          aria-label="Increase quantity"
          onclick="cardQty('${actionProductId}', 1)"
        >
          +
        </button>
      </div>
      <div class="card-foot">
        <button
          class="btn"
          ${disabled}
          onclick="addCart('${actionProductId}', cardQtyValue('${actionProductId}'))"
        >
          Add to cart
        </button>
        <button
          class="icon-btn"
          type="button"
          onclick="openProductWindow('${actionProductId}', event)"
          aria-label="View ${escapeHtml(product.name)} details"
        >
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </article>
  `;
}

function ensureProductModal() {
  let modal = document.querySelector("#productModal");

  if (modal) return modal;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog class="product-modal" id="productModal">
        <button
          class="icon-btn product-modal-close"
          type="button"
          aria-label="Close product details"
          onclick="document.querySelector('#productModal').close()"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="product-modal-body"></div>
      </dialog>
    `,
  );

  modal = document.querySelector("#productModal");
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  return modal;
}

function openProductWindow(id, event) {
  event?.preventDefault();
  event?.stopPropagation();

  const product = FM.products().find((item) => item.id === id);

  if (!product) return FM.toast("Product not found");

  const modal = ensureProductModal();
  const stockLabel = product.stock ? `${product.stock} available` : "Out of stock";
  const disabled = product.stock ? "" : "disabled";
  const imageFit = product.imageFit || "contain";
  const imagePosition = product.imagePosition || "center";
  const description =
    product.description ||
    `${product.brand} ${product.name} for everyday FreshMart shopping.`;
  const rows = [
    ["Brand", product.brand],
    ["Category", product.category],
    ["Pack size", product.weight],
    ["Rating", product.rating ? `★ ${Number(product.rating).toFixed(1)}` : ""],
    ["Stock", stockLabel],
    ["Ingredients", product.ingredients],
    ["Storage", product.storageInstructions],
  ].filter(([, value]) => value);
  const productId = jsString(product.id);
  const actionProductId = escapeHtml(productId);

  modal.querySelector(".product-modal-body").innerHTML = `
    <div class="product-modal-grid">
      <div class="product-modal-image">
        <img
          src="${escapeHtml(FM.imageUrl(product.image))}"
          alt="${escapeHtml(product.name)}"
          style="object-fit:${escapeHtml(imageFit)};object-position:${escapeHtml(imagePosition)}"
          onerror="FM.imageError(event)"
        >
      </div>
      <div class="product-modal-copy">
        <span class="badge">${productDiscount(product)}% OFF</span>
        <h2>${escapeHtml(product.name)}</h2>
        <p class="sub">${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</p>
        <p>${escapeHtml(description)}</p>
        <div class="price">
          ${FM.money(product.sellingPrice)}
          <span class="old">${FM.money(product.originalPrice)}</span>
        </div>
        <dl class="product-modal-list">
          ${rows
            .map(
              ([label, value]) => `
                <div>
                  <dt>${escapeHtml(label)}</dt>
                  <dd>${escapeHtml(value)}</dd>
                </div>
              `,
            )
            .join("")}
        </dl>
        <button
          class="btn"
          ${disabled}
          onclick="addCart('${actionProductId}', 1)"
        >
          Add to cart
        </button>
      </div>
    </div>
  `;

  if (!modal.open) modal.showModal();
}

function addCart(id, quantity = 1) {
  const product = FM.products().find((item) => item.id === id);
  const cartItems = FM.cart();
  const existingItem = cartItems.find((item) => item.productId === id);
  const nextQuantity = Math.max(1, Number(quantity) || 1);

  if (!product || !product.stock) {
    return FM.toast("This product is out of stock");
  }

  if ((existingItem?.quantity || 0) + nextQuantity > product.stock) {
    return FM.toast("Insufficient stock");
  }

  if (existingItem) {
    existingItem.quantity += nextQuantity;
  } else {
    cartItems.push({ productId: id, quantity: nextQuantity });
  }

  FM.saveCart(cartItems);
  FM.toast("Added to cart");
}

function cardQty(id, amount) {
  const product = FM.products().find((item) => item.id === id);
  const input = document.getElementById("cardQty-" + id);

  if (!product || !input) return;

  input.value = Math.max(
    1,
    Math.min(product.stock, Number(input.value || 1) + amount),
  );
}

function cardQtyValue(id) {
  return Number(document.getElementById("cardQty-" + id)?.value || 1);
}

function wish(id) {
  const wishlist = FM.get(FM.keys.wishlist);

  if (wishlist.includes(id)) {
    FM.set(
      FM.keys.wishlist,
      wishlist.filter((productId) => productId !== id),
    );
    updateCounts();
    FM.toast("Removed from wishlist");
    if (document.body.dataset.page === "wishlist") location.reload();
    return;
  }

  if (!wishlist.includes(id)) {
    wishlist.push(id);
  }

  FM.set(FM.keys.wishlist, wishlist);
  updateCounts();
  FM.toast("Added to wishlist");
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("afterbegin", header());
  document.body.insertAdjacentHTML("beforeend", footer());

  document.querySelector("#globalSearch")?.addEventListener("keydown", (e) => {
    const searchTerm = e.target.value.trim();
    if (e.key === "Enter" && searchTerm) {
      location.href = "products.html?q=" + encodeURIComponent(e.target.value);
    }
  });

  const navToggle = document.querySelector("#navToggle");
  const navLinks = document.querySelector("#navLinks");

  navToggle?.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navLinks?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      navLinks.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navLinks?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});
