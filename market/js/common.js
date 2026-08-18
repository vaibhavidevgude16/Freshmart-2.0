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

  return `
    <article class="card">
      <span class="badge">${product.discount}% OFF</span>
      <button class="icon-btn wish-btn" aria-label="${heartLabel}" onclick="wish('${product.id}')">
        <i class="${heartClass} fa-heart"></i>
      </button>
      <img
        src="${FM.imageUrl(product.image)}"
        alt="${product.name}"
        loading="lazy"
        style="object-fit:${imageFit};object-position:${imagePosition}"
        onerror="FM.imageError(event)"
      >
      <h3>${product.name}</h3>
      <div class="brand">${product.brand} · ${product.weight}</div>
      <p class="card-description">${description}</p>
      <div class="card-meta">
        <span aria-label="Rating">★ ${product.rating}</span>
        <span class="${stockClass}">${stockLabel}</span>
      </div>
      <div class="price">
        ${FM.money(product.sellingPrice)}
        <span class="old">${FM.money(product.originalPrice)}</span>
      </div>
      <div class="qty-control" aria-label="Quantity for ${product.name}">
        <button
          class="icon-btn"
          ${disabled}
          aria-label="Decrease quantity"
          onclick="cardQty('${product.id}', -1)"
        >
          −
        </button>
        <input
          id="cardQty-${product.id}"
          value="1"
          readonly
          aria-label="Selected quantity"
        >
        <button
          class="icon-btn"
          ${disabled}
          aria-label="Increase quantity"
          onclick="cardQty('${product.id}', 1)"
        >
          +
        </button>
      </div>
      <div class="card-foot">
        <button
          class="btn"
          ${disabled}
          onclick="addCart('${product.id}', Number(document.querySelector('#cardQty-${product.id}').value))"
        >
          Add to cart
        </button>
        <a
          class="icon-btn"
          href="product-details.html?id=${product.id}"
          aria-label="View ${product.name} details"
        >
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </article>
  `;
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
  const input = document.querySelector("#cardQty-" + id);

  if (!product || !input) return;

  input.value = Math.max(
    1,
    Math.min(product.stock, Number(input.value || 1) + amount),
  );
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
