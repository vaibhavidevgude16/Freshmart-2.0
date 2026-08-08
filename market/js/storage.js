const FM = {
  keys: {
    products: "freshmart_products",
    categories: "freshmart_categories",
    customers: "freshmart_customers",
    customer: "freshmart_current_customer",
    admin: "freshmart_admin_session",
    cart: "freshmart_cart",
    wishlist: "freshmart_wishlist",
    orders: "freshmart_orders",
  },
  get(k, f = []) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? f;
    } catch {
      return f;
    }
  },
  set(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },
  id(p, list) {
    return p + String(list.length + 1).padStart(3, "0");
  },
  fallbackImage: "assets/products/apple.webp",
  money: (n) => "₹" + Number(n || 0).toLocaleString("en-IN"),
  date: (d) =>
    new Date(d || Date.now()).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  toast(m) {
    let x = document.createElement("div");
    x.className = "toast";
    x.setAttribute("role", "status");
    x.textContent = m;
    document.body.append(x);
    setTimeout(() => x.remove(), 2600);
  },
  imageUrl(image, prefix = "") {
    if (!image) return prefix + this.fallbackImage;
    if (String(image).startsWith("assets/")) return prefix + image;
    return image;
  },
  imageError(event, prefix = "") {
    event.currentTarget.onerror = null;
    event.currentTarget.src = prefix + this.fallbackImage;
  },
  cart() {
    return this.get(this.keys.cart);
  },
  saveCart(x) {
    this.set(this.keys.cart, x);
    updateCounts();
  },
  products() {
    return this.get(this.keys.products);
  },
  saveProducts(x) {
    this.set(this.keys.products, x);
  },
};
