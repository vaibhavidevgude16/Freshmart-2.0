import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const secret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "change-this-freshmart-local-secret");
const adminEmail = process.env.ADMIN_EMAIL || "admin@freshmart.com";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const frontendOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Use your Supabase Postgres URL.");
}
if (!secret) {
  throw new Error("JWT_SECRET is required when NODE_ENV=production.");
}

const useSsl =
  process.env.PGSSLMODE === "require" ||
  process.env.NODE_ENV === "production" ||
  /supabase|sslmode=require/i.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});
const deliveryFees = {
  "Standard Delivery": 40,
  "Same-Day Delivery": 80,
  "Express 2-Hour Delivery": 120,
  "Scheduled Morning Slot": 60,
  "Store Pickup": 0,
};
const paymentStatuses = {
  "Cash on Delivery": "Pending",
  "UPI Payment": "Pending",
  "UPI Payment (Demo)": "Pending",
  "Debit / Credit Card": "Paid",
  "Debit / Credit Card (Demo)": "Paid",
  "Net Banking": "Paid",
  "Net Banking (Demo)": "Paid",
  Wallet: "Paid",
  "Wallet (Demo)": "Paid",
};
const catalogue = [
  ["Amul Taaza Milk", "Amul", "Dairy & Bakery", 66, 70, 25, "amul milk.jpg"],
  ["Amul Butter", "Amul", "Dairy & Bakery", 270, 300, 18, "amul butter.jpg"],
  [
    "Britannia Bread",
    "Britannia",
    "Dairy & Bakery",
    42,
    48,
    20,
    "britannia bread.webp",
  ],
  ["Aashirvaad Atta", "ITC", "Grocery", 245, 270, 14, "ashirvaad atta.webp"],
  [
    "India Gate Basmati Rice",
    "India Gate",
    "Grocery",
    499,
    550,
    16,
    "india gate basmati rice.webp",
  ],
  ["Tata Salt", "Tata", "Grocery", 28, 32, 32, "salt salt.webp"],
  [
    "Fortune Sunflower Oil",
    "Fortune",
    "Grocery",
    155,
    175,
    13,
    "sunflower oil.jpg",
  ],
  ["Maggi Noodles", "Nestle", "Snacks", 56, 64, 28, "maggie noodles.jpg"],
  ["Parle-G Biscuits", "Parle", "Snacks", 30, 35, 25, "parle g buscuits.jpg"],
  ["Oreo Biscuits", "Oreo", "Snacks", 42, 50, 22, "oreo buscuits.webp"],
  ["Coca-Cola", "Coca-Cola", "Beverages", 40, 45, 31, "coca cola.webp"],
  ["Pepsi", "Pepsi", "Beverages", 40, 45, 21, "pepsi.webp"],
  [
    "Tropicana Juice",
    "Tropicana",
    "Beverages",
    110,
    125,
    15,
    "tropicana juice.webp",
  ],
  ["Surf Excel", "Surf Excel", "Household", 180, 210, 10, "surf excel.webp"],
  ["Vim Dishwashing Liquid", "Vim", "Household", 95, 110, 12, "vim liquid.jpg"],
  [
    "Colgate Toothpaste",
    "Colgate",
    "Personal Care",
    105,
    120,
    18,
    "colgate.webp",
  ],
  [
    "Dettol Handwash",
    "Dettol",
    "Personal Care",
    90,
    105,
    19,
    "dettol handwash.webp",
  ],
  ["Dove Soap", "Dove", "Personal Care", 65, 75, 22, "dove.webp"],
  [
    "Clinic Plus Shampoo",
    "Clinic Plus",
    "Personal Care",
    130,
    150,
    17,
    "clinic plus.webp",
  ],
  [
    "Fresh Tomatoes",
    "FreshMart",
    "Fruits & Vegetables",
    35,
    40,
    30,
    "tomatto.jpg",
  ],
  ["Potatoes", "FreshMart", "Fruits & Vegetables", 32, 38, 29, "potato.jpg"],
  ["Onions", "FreshMart", "Fruits & Vegetables", 38, 45, 25, "onions.jpg"],
  ["Bananas", "FreshMart", "Fruits & Vegetables", 55, 65, 20, "bananas.jpg"],
  ["Apples", "FreshMart", "Fruits & Vegetables", 155, 180, 14, "apple.webp"],
  ["Oranges", "FreshMart", "Fruits & Vegetables", 90, 105, 16, "oranges.jpg"],
  ["Green Peas", "FreshMart", "Frozen", 90, 105, 8, "green peas.jpg"],
  ["Eggs", "Farm Fresh", "Dairy & Bakery", 85, 95, 24, "eggs.jpg"],
  ["Paneer", "Heritage", "Dairy & Bakery", 90, 105, 13, "paneer pack.jpg"],
  ["Curd", "Purabi", "Dairy & Bakery", 58, 65, 17, "curd.webp"],
  ["Cheese", "FreshMart", "Dairy & Bakery", 125, 145, 10, "cheese.jpg"],
  [
    "Fresh Apple Combo",
    "FreshMart",
    "Fruits & Vegetables",
    175,
    200,
    24,
    "apple.webp",
  ],
  [
    "Tomato Family Pack",
    "FreshMart",
    "Fruits & Vegetables",
    65,
    80,
    30,
    "tomatto.jpg",
  ],
  [
    "Brown Eggs 12 Pack",
    "Farm Fresh",
    "Dairy & Bakery",
    150,
    170,
    18,
    "eggs.jpg",
  ],
  ["Amul Cheese Slices", "Amul", "Dairy & Bakery", 140, 160, 20, "cheese.jpg"],
  [
    "Royal Basmati Rice 5 kg",
    "India Gate",
    "Grocery",
    620,
    700,
    16,
    "india gate basmati rice.webp",
  ],
  [
    "Fortune Sunflower Oil 1 L",
    "Fortune",
    "Grocery",
    165,
    190,
    22,
    "sunflower oil.jpg",
  ],
  [
    "Masala Noodles Family Pack",
    "Nestle",
    "Snacks",
    112,
    128,
    32,
    "maggie noodles.jpg",
  ],
  [
    "Chocolate Cream Biscuits",
    "Oreo",
    "Snacks",
    80,
    95,
    28,
    "oreo buscuits.webp",
  ],
  [
    "Mixed Fruit Juice 1 L",
    "Tropicana",
    "Beverages",
    125,
    145,
    21,
    "tropicana juice.webp",
  ],
  [
    "Dettol Handwash Refill",
    "Dettol",
    "Personal Care",
    135,
    155,
    19,
    "dettol handwash.webp",
  ],
  [
    "Vim Dishwash Gel Refill",
    "Vim",
    "Household",
    130,
    150,
    18,
    "vim liquid.jpg",
  ],
  [
    "Frozen Green Peas 1 kg",
    "FreshMart",
    "Frozen",
    165,
    190,
    26,
    "green peas.jpg",
  ],
];
const categorySeeds = [
  [
    "CAT001",
    "Fruits & Vegetables",
    "Fresh fruits and vegetables for daily cooking.",
    "/assets/categories/fruits-vegetables.webp",
  ],
  [
    "CAT002",
    "Dairy & Bakery",
    "Milk, butter, bread and bakery essentials.",
    "/assets/categories/dairy-bakery.webp",
  ],
  [
    "CAT003",
    "Grocery",
    "Everyday pantry staples and cooking basics.",
    "/assets/categories/grocery.webp",
  ],
  [
    "CAT004",
    "Snacks",
    "Biscuits, noodles and quick bites.",
    "/assets/categories/snacks-biscuits.webp",
  ],
  [
    "CAT005",
    "Beverages",
    "Juices, soft drinks and refreshing drinks.",
    "/assets/categories/beverages.webp",
  ],
  [
    "CAT006",
    "Personal Care",
    "Personal care products for the whole family.",
    "/assets/categories/personal-care.webp",
  ],
  [
    "CAT007",
    "Household",
    "Cleaning and household essentials.",
    "/assets/categories/household-products.webp",
  ],
  [
    "CAT008",
    "Frozen",
    "Frozen foods and ready-to-cook basics.",
    "/assets/categories/frozen-foods.webp",
  ],
];
const productDescriptions = {
  "Amul Taaza Milk":
    "Fresh toned milk for tea, coffee, cereal and everyday cooking.",
  "Amul Butter":
    "Creamy salted butter for toast, parathas, baking and quick snacks.",
  "Britannia Bread":
    "Soft sandwich bread for breakfast, tiffins and evening bites.",
  "Aashirvaad Atta":
    "Fine whole wheat flour for soft rotis and daily home meals.",
  "India Gate Basmati Rice":
    "Long-grain basmati rice with a fragrant aroma for pulao and biryani.",
  "Tata Salt": "Iodized salt for everyday cooking and balanced seasoning.",
  "Fortune Sunflower Oil":
    "Light sunflower oil for frying, sauteing and daily cooking.",
  "Maggi Noodles": "Quick masala noodles for a warm snack in minutes.",
  "Parle-G Biscuits":
    "Classic glucose biscuits for tea-time and lunchbox treats.",
  "Oreo Biscuits":
    "Chocolate sandwich biscuits with creamy filling for sweet cravings.",
  "Coca-Cola": "Chilled cola drink for parties, meals and quick refreshment.",
  Pepsi: "Refreshing cola drink for quick sips and meal combos.",
  "Tropicana Juice":
    "Ready-to-serve fruit juice for breakfast and anytime refreshment.",
  "Surf Excel":
    "Laundry detergent for removing tough stains from daily clothes.",
  "Vim Dishwashing Liquid":
    "Dishwashing liquid that cuts grease and leaves utensils clean.",
  "Colgate Toothpaste":
    "Daily toothpaste for fresh breath and strong teeth care.",
  "Dettol Handwash": "Gentle handwash for everyday hygiene at home and work.",
  "Dove Soap": "Moisturizing bathing bar for soft, fresh-feeling skin.",
  "Clinic Plus Shampoo":
    "Family shampoo for clean, manageable hair after every wash.",
  "Fresh Tomatoes":
    "Juicy tomatoes for curries, salads, sauces and everyday cooking.",
  Potatoes: "Versatile potatoes for sabzis, snacks, fries and quick meals.",
  Onions: "Fresh onions for gravies, tadka, salads and daily cooking.",
  Bananas: "Naturally sweet bananas for breakfast, smoothies and snacks.",
  Apples: "Crisp apples for healthy snacking, lunchboxes and fruit bowls.",
  Oranges: "Juicy oranges packed for refreshing citrus flavor.",
  "Green Peas": "Tender green peas for pulao, curries and frozen meal prep.",
  Eggs: "Farm-fresh eggs for breakfast, baking and protein-rich meals.",
  Paneer: "Soft paneer cubes for curries, starters and quick protein dishes.",
  Curd: "Smooth curd for meals, raita, marinades and refreshing snacks.",
  Cheese: "Creamy cheese for sandwiches, pizzas, rolls and toppings.",
  "Fresh Apple Combo": "A value pack of crisp apples for the whole family.",
  "Tomato Family Pack":
    "A larger tomato pack for curries, soups and weekly cooking.",
  "Brown Eggs 12 Pack":
    "A dozen brown eggs for protein-rich breakfasts and baking.",
  "Amul Cheese Slices":
    "Ready cheese slices for burgers, sandwiches and quick snacks.",
  "Royal Basmati Rice 5 kg":
    "Aromatic basmati rice in a family-size pack for special meals.",
  "Fortune Sunflower Oil 1 L":
    "One-litre sunflower oil bottle for light everyday cooking.",
  "Masala Noodles Family Pack":
    "Family pack of masala noodles for fast, tasty snacks.",
  "Chocolate Cream Biscuits":
    "Crunchy chocolate cream biscuits for dessert-like tea breaks.",
  "Mixed Fruit Juice 1 L":
    "One-litre mixed fruit juice for breakfast and family refreshment.",
  "Dettol Handwash Refill":
    "Handwash refill pack for keeping dispensers ready at home.",
  "Vim Dishwash Gel Refill":
    "Dishwash gel refill for grease-cutting kitchen cleanup.",
  "Frozen Green Peas 1 kg":
    "One-kilo frozen peas pack for easy cooking through the week.",
};
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

app.use(express.json({ limit: "12mb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowOrigin =
    frontendOrigins.includes("*") ||
    (origin && frontendOrigins.includes(origin))
      ? origin
      : "";

  if (allowOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use("/assets", express.static(path.join(root, "assets")));
app.use("/admin", express.static(path.join(root, "admin")));
app.use("/css", express.static(path.join(root, "css")));
app.use("/js", express.static(path.join(root, "js")));
app.use(express.static(path.join(root, "public")));

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      original_price NUMERIC(10,2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT NOT NULL,
      description TEXT,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      minimum_stock INTEGER NOT NULL DEFAULT 5,
      weight TEXT NOT NULL DEFAULT '1 Pack',
      unit TEXT NOT NULL DEFAULT 'Pack',
      rating NUMERIC(3,2) NOT NULL DEFAULT 4.5,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      image_fit TEXT NOT NULL DEFAULT 'contain',
      image_position TEXT NOT NULL DEFAULT 'center'
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
      items JSONB NOT NULL,
      total NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'Order Placed',
      address TEXT NOT NULL,
      delivery_method TEXT NOT NULL DEFAULT 'Standard Delivery',
      delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 40,
      payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      stock_restored BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_products_category_name
    ON products(category, name);

    CREATE INDEX IF NOT EXISTS idx_orders_customer_created
    ON orders(customer_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status);
  `);

  await seedCategories();
  await seedProducts();
  await refreshSeedProductDescriptions();
  await seedAdmin();
}

async function seedCategories() {
  const text = `
    INSERT INTO categories (id, name, description, image, active)
    VALUES ($1, $2, $3, $4, TRUE)
    ON CONFLICT (id) DO NOTHING
  `;

  for (const category of categorySeeds) {
    await query(text, category);
  }
}

async function seedProducts() {
  const text = `
    INSERT INTO products (
      id, name, brand, category, price, original_price, stock, image,
      description, featured
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (id) DO NOTHING
  `;

  for (const [index, product] of catalogue.entries()) {
    await query(text, [
      `PROD${String(index + 1).padStart(3, "0")}`,
      product[0],
      product[1],
      product[2],
      product[3],
      product[4],
      product[5],
      `/assets/products/${product[6]}`,
      descriptionFor(product[0], product[2]),
      index < 8 || index % 10 === 0,
    ]);
  }
}

async function refreshSeedProductDescriptions() {
  for (const [index, product] of catalogue.entries()) {
    await query(
      `UPDATE products
       SET description=$1
       WHERE id=$2
         AND (
           description IS NULL
           OR description = ''
           OR description LIKE 'Quality % for your everyday needs.'
         )`,
      [
        descriptionFor(product[0], product[2]),
        `PROD${String(index + 1).padStart(3, "0")}`,
      ],
    );
  }
}

function descriptionFor(name, category) {
  return (
    productDescriptions[name] ||
    `FreshMart selected ${name.toLowerCase()} from ${category.toLowerCase()} for reliable everyday shopping.`
  );
}

async function seedAdmin() {
  const existing = await query(
    "SELECT id FROM customers WHERE role='admin' LIMIT 1",
  );

  if (existing.rowCount) return;

  await query(
    `INSERT INTO customers (name, email, password, role, created_at)
     VALUES ($1, $2, $3, 'admin', NOW())`,
    [
      "FreshMart Admin",
      adminEmail.toLowerCase(),
      bcrypt.hashSync(adminPassword, 10),
    ],
  );
}

function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      const user = jwt.verify(token, secret);

      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ message: "Not authorized" });
      }

      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: "Please sign in first" });
    }
  };
}

function tokenFor(user) {
  return jwt.sign(
    { id: String(user.id), name: user.name, role: user.role },
    secret,
    {
      expiresIn: "7d",
    },
  );
}

function normalizeStatus(status = "Order Placed") {
  const match = {
    "order placed": "Order Placed",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    "out for delivery": "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }[String(status).trim().toLowerCase()];

  return match || "Order Placed";
}

function publicProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    stock: Number(row.stock),
    image: row.image,
    description: row.description || "",
    featured: Boolean(row.featured),
  };
}

function adminProduct(row) {
  const price = Number(row.price);
  const originalPrice = Number(row.original_price);
  const discount = Math.max(0, Math.round((1 - price / originalPrice) * 100));

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    description: row.description || "",
    originalPrice,
    sellingPrice: price,
    price,
    discount,
    stock: Number(row.stock),
    minimumStock: Number(row.minimum_stock ?? 5),
    weight: row.weight || "1 Pack",
    unit: row.unit || "Pack",
    image: row.image,
    imageFit: row.image_fit || "contain",
    imagePosition: row.image_position || "center",
    rating: Number(row.rating || 4.5),
    featured: Boolean(row.featured),
    active: Boolean(row.active),
  };
}

function productInput(payload, fallbackId) {
  const product = {
    id: String(payload.id || fallbackId || "").trim(),
    name: String(payload.name || "").trim(),
    brand: String(payload.brand || "").trim(),
    category: String(payload.category || "").trim(),
    price: Number(payload.sellingPrice ?? payload.price),
    originalPrice: Number(payload.originalPrice),
    stock: Math.max(0, Number(payload.stock ?? 0)),
    image: String(payload.image || "").trim(),
    description: String(payload.description || "").trim(),
    featured: Boolean(payload.featured),
    minimumStock: Math.max(0, Number(payload.minimumStock ?? 5)),
    weight: String(payload.weight || "1 Pack").trim(),
    unit: String(payload.unit || "Pack").trim(),
    rating: Number(payload.rating || 4.5),
    active: payload.active !== false,
    imageFit: ["contain", "cover"].includes(payload.imageFit)
      ? payload.imageFit
      : "contain",
    imagePosition: ["center", "top", "bottom", "left", "right"].includes(
      payload.imagePosition,
    )
      ? payload.imagePosition
      : "center",
  };

  if (!product.id || !product.name || !product.brand || !product.category) {
    throw Error("Product name, brand, category and id are required");
  }
  if (!Number.isFinite(product.price) || product.price < 1) {
    throw Error(product.name + " needs a valid selling price");
  }
  if (!Number.isFinite(product.originalPrice) || product.originalPrice < 1) {
    throw Error(product.name + " needs a valid original price");
  }
  if (!product.image) {
    throw Error(product.name + " needs an image");
  }

  return product;
}

function adminCategory(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    image: row.image || "/assets/categories/grocery.webp",
    active: Boolean(row.active),
  };
}

function categoryInput(payload, fallbackId) {
  const category = {
    id: String(payload.id || fallbackId || "").trim(),
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    image: String(payload.image || "/assets/categories/grocery.webp").trim(),
    active: payload.active !== false,
  };

  if (!category.id || !category.name) {
    throw Error("Category id and name are required");
  }

  return category;
}

function adminCustomer(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    mobile: "",
    city: "",
    pin: "",
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

function parseOrderItems(items) {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || "[]");
  } catch {
    return [];
  }
}

function publicOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    items: parseOrderItems(row.items),
    total: Number(row.total),
    status: normalizeStatus(row.status),
    address: row.address,
    deliveryMethod: row.delivery_method,
    deliveryCharge: Number(row.delivery_charge),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}

function adminOrder(row) {
  const items = parseOrderItems(row.items).map((item) => ({
    productId: item.id || item.productId,
    id: item.id || item.productId,
    name: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity),
    image: item.image,
    subtotal: Number(item.price) * Number(item.quantity),
  }));
  const deliveryCharge = Number(row.delivery_charge || 0);
  const totalAmount = Number(row.total);

  return {
    id: String(row.id),
    customerId: String(row.customer_id || ""),
    customerName: row.customer || "Deleted customer",
    customerMobile: row.customer_email || "",
    customerEmail: row.customer_email || "",
    orderDate: new Date(row.created_at).toLocaleDateString("en-IN"),
    createdAt: row.created_at,
    items,
    subtotal: Math.max(0, totalAmount - deliveryCharge),
    deliveryCharge,
    totalAmount,
    orderStatus: normalizeStatus(row.status),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    deliveryMethod: row.delivery_method,
    deliveryAddress: {
      address: row.address,
      city: "",
      pin: "",
    },
  };
}

async function adminStore() {
  const [products, categories, customers, orders] = await Promise.all([
    query("SELECT * FROM products ORDER BY name"),
    query("SELECT * FROM categories ORDER BY name"),
    query(
      "SELECT id,name,email,role,active,created_at FROM customers WHERE role='customer' ORDER BY id DESC",
    ),
    query(
      `SELECT orders.*, customers.name AS customer, customers.email AS customer_email
       FROM orders
       LEFT JOIN customers ON customers.id=orders.customer_id
       ORDER BY orders.id DESC`,
    ),
  ]);

  return {
    products: products.rows.map(adminProduct),
    categories: categories.rows.map(adminCategory),
    customers: customers.rows.map(adminCustomer),
    orders: orders.rows.map(adminOrder),
  };
}

async function restoreOrderStock(client, order) {
  if (order.stock_restored) return true;

  for (const item of parseOrderItems(order.items)) {
    const productId = item.id || item.productId;
    const quantity = Number(item.quantity);

    if (productId && Number.isFinite(quantity) && quantity > 0) {
      await client.query("UPDATE products SET stock=stock+$1 WHERE id=$2", [
        quantity,
        productId,
      ]);
    }
  }

  return true;
}

app.get(
  "/api/health",
  asyncHandler(async (_, res) => {
    const [products, customers, orders] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM products"),
      query("SELECT COUNT(*)::int AS count FROM customers"),
      query("SELECT COUNT(*)::int AS count FROM orders"),
    ]);

    res.json({
      ok: true,
      service: "FreshMart",
      database: "supabase",
      counts: {
        products: products.rows[0].count,
        customers: customers.rows[0].count,
        orders: orders.rows[0].count,
      },
    });
  }),
);

app.get(
  "/api/products",
  asyncHandler(async (req, res) => {
    const search = `%${req.query.search || ""}%`;
    const category = req.query.category || "";
    const result = await query(
      `SELECT *
       FROM products
       WHERE active=TRUE
         AND (name ILIKE $1 OR brand ILIKE $1 OR category ILIKE $1)
         AND ($2 = '' OR category = $2)
       ORDER BY name`,
      [search, category],
    );

    res.json(result.rows.map(publicProduct));
  }),
);

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({
        message: "Name, email, and a 6-character password are required",
      });
    }

    try {
      const result = await query(
        `INSERT INTO customers (name,email,password,role,created_at)
         VALUES ($1,$2,$3,'customer',NOW())
         RETURNING id,name,email,role`,
        [name, email.toLowerCase(), await bcrypt.hash(password, 10)],
      );
      const user = result.rows[0];

      res.status(201).json({ token: tokenFor(user), user });
    } catch (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ message: "An account already exists with this email" });
      }

      throw error;
    }
  }),
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const result = await query("SELECT * FROM customers WHERE email=$1", [
      (req.body.email || "").toLowerCase(),
    ]);
    const user = result.rows[0];

    if (
      !user ||
      !(await bcrypt.compare(req.body.password || "", user.password))
    ) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.active) {
      return res.status(403).json({ message: "This account is blocked" });
    }

    res.json({
      token: tokenFor(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/orders",
  auth(),
  asyncHandler(async (req, res) => {
    const {
      items,
      address,
      deliveryMethod = "Standard Delivery",
      paymentMethod = "Cash on Delivery",
    } = req.body;

    if (!Array.isArray(items) || !items.length || !address) {
      return res
        .status(400)
        .json({ message: "Cart and delivery address are required" });
    }
    if (!Object.hasOwn(deliveryFees, deliveryMethod)) {
      return res.status(400).json({ message: "Invalid delivery option" });
    }
    if (!Object.hasOwn(paymentStatuses, paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment option" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      let total = 0;
      const saved = [];
      const deliveryCharge = deliveryFees[deliveryMethod];

      for (const item of items) {
        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw Error("Cart item quantities must be positive whole numbers");
        }

        const productResult = await client.query(
          "SELECT * FROM products WHERE id=$1 FOR UPDATE",
          [item.id],
        );
        const product = productResult.rows[0];

        if (!product || Number(product.stock) < quantity) {
          throw Error(
            product
              ? `${product.name} has insufficient stock`
              : "A product is no longer available",
          );
        }

        await client.query("UPDATE products SET stock=stock-$1 WHERE id=$2", [
          quantity,
          item.id,
        ]);

        const line = {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
          image: product.image,
        };
        total += line.price * line.quantity;
        saved.push(line);
      }

      total += deliveryCharge;
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_id, items, total, address, delivery_method, delivery_charge,
          payment_method, payment_status, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
        RETURNING id`,
        [
          req.user.id,
          JSON.stringify(saved),
          total,
          address,
          deliveryMethod,
          deliveryCharge,
          paymentMethod,
          paymentStatuses[paymentMethod],
        ],
      );

      await client.query("COMMIT");
      res.status(201).json({
        id: orderResult.rows[0].id,
        message: "Order placed successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ message: error.message });
    } finally {
      client.release();
    }
  }),
);

app.get(
  "/api/orders/me",
  auth(),
  asyncHandler(async (req, res) => {
    const result = await query(
      "SELECT * FROM orders WHERE customer_id=$1 ORDER BY id DESC",
      [req.user.id],
    );

    res.json(result.rows.map(publicOrder));
  }),
);

app.get(
  "/api/admin/store",
  auth("admin"),
  asyncHandler(async (_, res) => res.json(await adminStore())),
);

app.put(
  "/api/admin/products/sync",
  auth("admin"),
  asyncHandler(async (req, res) => {
    const products = req.body.products;

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Products must be an array" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM products");

      for (const [index, payload] of products.entries()) {
        const product = productInput(
          payload,
          `PROD${String(index + 1).padStart(3, "0")}`,
        );

        await client.query(
          `INSERT INTO products (
            id, name, brand, category, price, original_price, stock, image,
            description, featured, minimum_stock, weight, unit, rating, active,
            image_fit, image_position
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            product.id,
            product.name,
            product.brand,
            product.category,
            product.price,
            product.originalPrice,
            product.stock,
            product.image,
            product.description,
            product.featured,
            product.minimumStock,
            product.weight,
            product.unit,
            product.rating,
            product.active,
            product.imageFit,
            product.imagePosition,
          ],
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Products synced", ...(await adminStore()) });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ message: error.message });
    } finally {
      client.release();
    }
  }),
);

app.put(
  "/api/admin/categories/sync",
  auth("admin"),
  asyncHandler(async (req, res) => {
    const categories = req.body.categories;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: "Categories must be an array" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM categories");

      for (const [index, payload] of categories.entries()) {
        const category = categoryInput(
          payload,
          `CAT${String(index + 1).padStart(3, "0")}`,
        );

        await client.query(
          "INSERT INTO categories (id,name,description,image,active) VALUES ($1,$2,$3,$4,$5)",
          [
            category.id,
            category.name,
            category.description,
            category.image,
            category.active,
          ],
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Categories synced", ...(await adminStore()) });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ message: error.message });
    } finally {
      client.release();
    }
  }),
);

app.patch(
  "/api/admin/customers/:id",
  auth("admin"),
  asyncHandler(async (req, res) => {
    const active = req.body.active !== false;
    const result = await query(
      "UPDATE customers SET active=$1 WHERE id=$2 AND role='customer'",
      [active, req.params.id],
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer updated", ...(await adminStore()) });
  }),
);

app.delete(
  "/api/admin/customers/:id",
  auth("admin"),
  asyncHandler(async (req, res) => {
    const result = await query(
      "DELETE FROM customers WHERE id=$1 AND role='customer'",
      [req.params.id],
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted", ...(await adminStore()) });
  }),
);

app.get(
  "/api/admin/orders",
  auth("admin"),
  asyncHandler(async (_, res) => res.json((await adminStore()).orders)),
);

app.patch(
  "/api/admin/orders/:id",
  auth("admin"),
  asyncHandler(async (req, res) => {
    const valid = [
      "Order Placed",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];
    const nextStatus = normalizeStatus(req.body.status);

    if (!valid.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query(
        "SELECT * FROM orders WHERE id=$1 FOR UPDATE",
        [req.params.id],
      );
      const order = result.rows[0];

      if (!order) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Order not found" });
      }

      let stockRestored = order.stock_restored;

      if (nextStatus === "Cancelled" && !stockRestored) {
        stockRestored = await restoreOrderStock(client, order);
      }

      const paymentStatus =
        nextStatus === "Delivered" &&
        order.payment_method === "Cash on Delivery"
          ? "Paid"
          : order.payment_status;

      await client.query(
        `UPDATE orders
         SET status=$1, payment_status=$2, stock_restored=$3
         WHERE id=$4`,
        [nextStatus, paymentStatus, stockRestored, req.params.id],
      );
      await client.query("COMMIT");

      res.json({ message: "Order status updated", ...(await adminStore()) });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ message: error.message });
    } finally {
      client.release();
    }
  }),
);

app.delete(
  "/api/admin/orders/:id",
  auth("admin"),
  asyncHandler(async (req, res) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query(
        "SELECT * FROM orders WHERE id=$1 FOR UPDATE",
        [req.params.id],
      );
      const order = result.rows[0];

      if (!order) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Order not found" });
      }

      if (normalizeStatus(order.status) !== "Delivered") {
        await restoreOrderStock(client, order);
      }

      await client.query("DELETE FROM orders WHERE id=$1", [req.params.id]);
      await client.query("COMMIT");

      res.json({ message: "Order deleted", ...(await adminStore()) });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ message: error.message });
    } finally {
      client.release();
    }
  }),
);

app.get("*", (_, res) => res.sendFile(path.join(root, "public", "index.html")));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Server error" });
});

await initDatabase();

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`FreshMart running at http://localhost:${port}`),
);
