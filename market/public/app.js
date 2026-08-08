const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem("freshmart_cart") || "[]"),
  token: localStorage.getItem("freshmart_token") || "",
  user: JSON.parse(localStorage.getItem("freshmart_user") || "null"),
  register: false,
};
const upiPaymentValue = "UPI Payment";
const deliveryFees = {
  "Standard Delivery": 40,
  "Same-Day Delivery": 80,
  "Express 2-Hour Delivery": 120,
  "Scheduled Morning Slot": 60,
  "Store Pickup": 0,
};
const paymentStatuses = {
  "Cash on Delivery": "Pending",
  [upiPaymentValue]: "Pending",
  "UPI Payment (Demo)": "Pending",
  "Debit / Credit Card": "Paid",
  "Debit / Credit Card (Demo)": "Paid",
  "Net Banking": "Paid",
  "Net Banking (Demo)": "Paid",
  Wallet: "Paid",
  "Wallet (Demo)": "Paid",
};

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") =>
  String(value).replace(
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
const money = (amount) => "₹" + Number(amount).toLocaleString("en-IN");

function toast(message) {
  const toastEl = $("#toast");

  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2800);
}

async function request(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = "Bearer " + state.token;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw Error(data.message || "Something went wrong");
  }

  return data;
}

function saveCart() {
  localStorage.setItem("freshmart_cart", JSON.stringify(state.cart));
  renderCart();
}

function deliveryChargeFor(method) {
  return deliveryFees[method] ?? deliveryFees["Standard Delivery"];
}

function paymentStatusFor(method) {
  return paymentStatuses[method] || "Pending";
}

function productCard(product) {
  const discount = Math.round(
    (1 - product.price / product.originalPrice) * 100,
  );

  return `
    <article class="product">
      <span class="pill">${discount}% OFF</span>
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <h3>${product.name}</h3>
      <p>${product.brand} · ${product.category}</p>
      <div class="product-foot">
        <span class="price">
          ${money(product.price)}
          <span class="old">${money(product.originalPrice)}</span>
        </span>
        <button class="add" data-add="${product.id}" aria-label="Add ${product.name}">
          +
        </button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const term = $("#search").value.trim().toLowerCase();
  const category = $("#category").value;
  const items = state.products.filter(
    (product) =>
      (!category || product.category === category) &&
      `${product.name} ${product.brand} ${product.category}`
        .toLowerCase()
        .includes(term),
  );

  $("#products").innerHTML = items.length
    ? items.map(productCard).join("")
    : '<p class="empty">No items match that search.</p>';

  document.querySelectorAll("[data-add]").forEach((button) => {
    button.onclick = () => addToCart(button.dataset.add);
  });
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  const cartLine = state.cart.find((item) => item.id === id);

  if (!product.stock) return toast("This item is currently out of stock");

  if (cartLine) {
    if (cartLine.quantity >= product.stock) {
      return toast("Only " + product.stock + " are available");
    }

    cartLine.quantity++;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart();
  toast(product.name + " added to your bag");
}

function renderCart() {
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartRows = state.cart
    .map(
      (item) => `
        <div class="cart-line">
          <img src="${item.image}" alt="">
          <div>
            <b>${item.name}</b>
            <p>${money(item.price)}</p>
          </div>
          <div class="qty">
            <button data-change="${item.id}|-1">−</button>
            <span>${item.quantity}</span>
            <button data-change="${item.id}|1">+</button>
          </div>
        </div>
      `,
    )
    .join("");

  $("#cartCount").textContent = itemCount;
  $("#cartTotal").textContent = money(total);
  $("#cartItems").innerHTML = state.cart.length
    ? cartRows
    : '<p class="empty">Your bag is empty.</p>';

  document.querySelectorAll("[data-change]").forEach((button) => {
    button.onclick = () => changeQuantity(...button.dataset.change.split("|"));
  });
}

function updateCheckoutSummary() {
  const deliveryMethod = $("#deliveryMethod")?.value || "Standard Delivery";
  const paymentMethod = $("#paymentMethod")?.value || "Cash on Delivery";
  const subtotal = state.cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryCharge = deliveryChargeFor(deliveryMethod);
  const summary = $("#checkoutChoiceSummary");
  const upiQrCard = $("#upiQrCard");
  const upiQrAmount = $("#upiQrAmount");

  if (!summary) return;

  if (upiQrCard) {
    upiQrCard.hidden = paymentMethod !== upiPaymentValue;
  }
  if (upiQrAmount) {
    upiQrAmount.textContent = money(subtotal + deliveryCharge);
  }

  summary.innerHTML = `
    <div><span>Items</span><b>${money(subtotal)}</b></div>
    <div><span>Delivery</span><b>${deliveryCharge ? money(deliveryCharge) : "Free"}</b></div>
    <div><span>Payment</span><b>${paymentMethod}</b></div>
    <div><span>Status</span><b>${paymentStatusFor(paymentMethod)}</b></div>
    <div class="total"><span>Total</span><b>${money(subtotal + deliveryCharge)}</b></div>
  `;
}

function changeQuantity(id, amount) {
  const cartLine = state.cart.find((item) => item.id === id);

  cartLine.quantity += Number(amount);
  if (cartLine.quantity < 1) {
    state.cart = state.cart.filter((item) => item.id !== id);
  }

  saveCart();
}

function setDrawer(open) {
  $("#cartDrawer").classList.toggle("open", open);
  $("#overlay").classList.toggle("show", open);
  $("#cartDrawer").setAttribute("aria-hidden", String(!open));
}

function openCart() {
  $("#cartDrawer").querySelector("h2").textContent = "Your bag";
  $(".checkout").style.display = "";
  renderCart();
  setDrawer(true);
}

function updateAccount() {
  $("#accountButton").textContent = state.user
    ? `Hi, ${state.user.name.split(" ")[0]}`
    : "Sign in";
}

function openAuth() {
  state.register = false;
  renderAuth();
  $("#authDialog").showModal();
}

function renderAuth() {
  $("#authKicker").textContent = state.register
    ? "JOIN FRESHMART"
    : "WELCOME BACK";
  $("#authTitle").textContent = state.register
    ? "Create your account"
    : "Sign in to FreshMart";
  $("#nameInput").parentElement.style.display = state.register
    ? "grid"
    : "none";
  $("#nameInput").required = state.register;
  $("#switchAuth").textContent = state.register
    ? "Already have an account? Sign in"
    : "New here? Create an account";
}

function togglePasswordVisibility() {
  const passwordInput = $("#passwordInput");
  const passwordToggle = $("#passwordToggle");
  const isVisible = passwordInput.type === "text";

  passwordInput.type = isVisible ? "password" : "text";
  passwordToggle.textContent = isVisible ? "Show" : "Hide";
  passwordToggle.setAttribute(
    "aria-label",
    isVisible ? "Show password" : "Hide password",
  );
  passwordToggle.setAttribute("aria-pressed", String(!isVisible));
}

async function submitAuth(event) {
  event.preventDefault();

  const form = Object.fromEntries(new FormData(event.target));

  try {
    const data = await request(
      state.register ? "/api/auth/register" : "/api/auth/login",
      { method: "POST", body: JSON.stringify(form) },
    );

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("freshmart_token", data.token);
    localStorage.setItem("freshmart_user", JSON.stringify(data.user));
    updateAccount();
    $("#authDialog").close();
    toast("Welcome to FreshMart, " + data.user.name);
  } catch (error) {
    toast(error.message);
  }
}

async function checkout() {
  if (!state.cart.length) return toast("Your bag is empty");
  if (!state.user) return openAuth();

  setDrawer(false);
  updateCheckoutSummary();
  $("#checkoutDialog").showModal();
}

async function submitOrder(event) {
  event.preventDefault();

  try {
    const form = Object.fromEntries(new FormData(event.target));
    const data = await request("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: state.cart,
        address: form.address,
        deliveryMethod: form.deliveryMethod,
        paymentMethod: form.paymentMethod,
      }),
    });

    state.cart = [];
    saveCart();
    $("#checkoutDialog").close();
    toast(`Order #${data.id} placed successfully`);
  } catch (error) {
    toast(error.message);
  }
}

function showProfile() {
  if (!state.user) return openAuth();

  $("#cartDrawer").querySelector("h2").textContent = "Your profile";
  $("#cartItems").innerHTML = `
    <div class="profile-panel">
      <div>
        <span>Name</span>
        <b>${escapeHtml(state.user.name)}</b>
      </div>
      <div>
        <span>Email</span>
        <b>${escapeHtml(state.user.email)}</b>
      </div>
      <div>
        <span>Account type</span>
        <b>${escapeHtml(state.user.role || "Customer")}</b>
      </div>
      <button class="primary" id="profileOrdersButton" type="button">
        View orders <span>→</span>
      </button>
      <button class="text-btn profile-signout" id="signOutButton" type="button">
        Sign out
      </button>
    </div>
  `;
  $(".checkout").style.display = "none";
  setDrawer(true);

  $("#profileOrdersButton").onclick = showOrders;
  $("#signOutButton").onclick = () => {
    state.token = "";
    state.user = null;
    localStorage.removeItem("freshmart_token");
    localStorage.removeItem("freshmart_user");
    updateAccount();
    setDrawer(false);
    toast("Signed out");
  };
}

async function showOrders() {
  if (!state.user) return openAuth();

  try {
    const orders = await request("/api/orders/me");
    const orderRows = orders
      .map(
        (order) => `
          <div class="cart-line">
            <div>
              <b>Order #${order.id}</b>
              <p>
                ${new Date(order.createdAt).toLocaleDateString("en-IN")}
                · ${order.items.length} item(s)
                <br>${order.deliveryMethod || "Standard Delivery"} · ${order.paymentMethod || "Cash on Delivery"}
              </p>
            </div>
            <b>${money(order.total)}</b>
          </div>
        `,
      )
      .join("");

    $("#cartDrawer").querySelector("h2").textContent = "Your orders";
    $("#cartItems").innerHTML = orders.length
      ? orderRows
      : '<p class="empty">You have no orders yet.</p>';
    $(".checkout").style.display = "none";
    setDrawer(true);
  } catch (error) {
    toast(error.message);
  }
}

async function init() {
  try {
    state.products = await request("/api/products");
    const categories = [
      ...new Set(state.products.map((product) => product.category)),
    ];

    $("#category").insertAdjacentHTML(
      "beforeend",
      categories.map((category) => `<option>${category}</option>`).join(""),
    );
    renderProducts();
    renderCart();
    updateAccount();
  } catch (error) {
    $("#products").innerHTML =
      '<p class="empty">Could not load products. Start the FreshMart server and refresh.</p>';
    toast(error.message);
  }
}

$("#search").oninput = renderProducts;
$("#category").onchange = renderProducts;
$("#cartButton").onclick = openCart;
$("#overlay").onclick = () => setDrawer(false);
document.querySelectorAll("[data-close]").forEach((button) => {
  button.onclick = () => setDrawer(false);
});
$(".dialog-close").onclick = () => $("#authDialog").close();
$("#checkoutDialog").querySelector(".dialog-close").onclick = () =>
  $("#checkoutDialog").close();
$("#accountButton").onclick = () => (state.user ? showProfile() : openAuth());
$("#switchAuth").onclick = () => {
  state.register = !state.register;
  renderAuth();
};
$("#authForm").onsubmit = submitAuth;
$("#passwordToggle").onclick = togglePasswordVisibility;
$("#checkoutButton").onclick = checkout;
$("#checkoutForm").onsubmit = submitOrder;
$("#deliveryMethod").onchange = updateCheckoutSummary;
$("#paymentMethod").onchange = updateCheckoutSummary;
$("#profileLink").onclick = (event) => {
  event.preventDefault();
  showProfile();
};
$("#ordersLink").onclick = (event) => {
  event.preventDefault();
  showOrders();
};

init();
