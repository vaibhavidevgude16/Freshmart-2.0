(() => {
  const C = FM.keys;
  const cats = [
    "Fruits and Vegetables",
    "Dairy and Bakery",
    "Grocery",
    "Snacks and Biscuits",
    "Beverages",
    "Personal Care",
    "Household Products",
    "Frozen Foods",
  ];
  const categoryImages = {
    "Fruits and Vegetables": "assets/categories/fruits-vegetables.webp",
    "Dairy and Bakery": "assets/categories/dairy-bakery.webp",
    Grocery: "assets/categories/grocery.webp",
    "Snacks and Biscuits": "assets/categories/snacks-biscuits.webp",
    Beverages: "assets/categories/beverages.webp",
    "Personal Care": "assets/categories/personal-care.webp",
    "Household Products": "assets/categories/household-products.webp",
    "Frozen Foods": "assets/categories/frozen-foods.webp",
  };
  const fallbackImages = Object.values(categoryImages);
  if (!localStorage.getItem(C.categories))
    FM.set(
      C.categories,
      cats.map((name, i) => ({
        id: "CAT" + String(i + 1).padStart(3, "0"),
        name,
        description: "Quality " + name.toLowerCase() + " for everyday needs.",
        image: categoryImages[name],
        active: true,
      })),
    );
  if (!localStorage.getItem(C.products)) {
    const d = [
      ["Amul Taaza Milk", "Amul", 1, 66, 70],
      ["Amul Butter", "Amul", 2, 270, 300],
      ["Britannia Bread", "Britannia", 2, 42, 48],
      ["Aashirvaad Atta", "ITC", 3, 245, 270],
      ["India Gate Basmati Rice", "India Gate", 3, 499, 550],
      ["Tata Salt", "Tata", 3, 28, 32],
      ["Fortune Sunflower Oil", "Fortune", 3, 155, 175],
      ["Maggi Noodles", "Nestle", 4, 56, 64],
      ["Parle-G Biscuits", "Parle", 4, 30, 35],
      ["Oreo Biscuits", "Oreo", 4, 42, 50],
      ["Coca-Cola", "Coca-Cola", 5, 40, 45],
      ["Pepsi", "Pepsi", 5, 40, 45],
      ["Tropicana Juice", "Tropicana", 5, 110, 125],
      ["Surf Excel", "Surf Excel", 7, 180, 210],
      ["Vim Dishwashing Liquid", "Vim", 7, 95, 110],
      ["Colgate Toothpaste", "Colgate", 6, 105, 120],
      ["Dettol Handwash", "Dettol", 6, 90, 105],
      ["Dove Soap", "Dove", 6, 65, 75],
      ["Clinic Plus Shampoo", "Clinic Plus", 6, 130, 150],
      ["Fresh Tomatoes", "FreshMart", 0, 35, 40],
      ["Potatoes", "FreshMart", 0, 32, 38],
      ["Onions", "FreshMart", 0, 38, 45],
      ["Bananas", "FreshMart", 0, 55, 65],
      ["Apples", "FreshMart", 0, 155, 180],
      ["Oranges", "FreshMart", 0, 90, 105],
      ["Green Peas", "FreshMart", 7, 90, 105],
      ["Eggs", "Farm Fresh", 2, 85, 95],
      ["Paneer", "Amul", 2, 90, 105],
      ["Curd", "Amul", 2, 58, 65],
      ["Cheese", "Amul", 2, 125, 145],
    ];
    FM.saveProducts(
      d.map((x, i) => ({
        id: "PROD" + String(i + 1).padStart(3, "0"),
        name: x[0],
        brand: x[1],
        category: cats[x[2]],
        description:
          "Fresh, carefully selected " +
          x[0].toLowerCase() +
          " delivered with care.",
        originalPrice: x[4],
        sellingPrice: x[3],
        discount: Math.round(((x[4] - x[3]) / x[4]) * 100),
        stock: i === 25 ? 0 : 8 + ((i * 7) % 37),
        minimumStock: 5,
        weight: i < 20 ? "1 Pack" : "1 kg",
        unit: "Pack",
        image: fallbackImages[i % fallbackImages.length],
        rating: 4 + (i % 9) / 10,
        ingredients: "Quality ingredients",
        storageInstructions: "Store in a cool, dry place.",
        featured: i % 3 === 0,
        active: true,
      })),
    );
  }
})();
(() => {
  const categoryImageMap = {
    "Fruits and Vegetables": "assets/categories/fruits-vegetables.webp",
    "Dairy and Bakery": "assets/categories/dairy-bakery.webp",
    Grocery: "assets/categories/grocery.webp",
    "Snacks and Biscuits": "assets/categories/snacks-biscuits.webp",
    Beverages: "assets/categories/beverages.webp",
    "Personal Care": "assets/categories/personal-care.webp",
    "Household Products": "assets/categories/household-products.webp",
    "Frozen Foods": "assets/categories/frozen-foods.webp",
  };
  const imageMap = {
    "Amul Taaza Milk": "amul milk.jpg",
    "Amul Butter": "amul butter.jpg",
    "Britannia Bread": "britannia bread.webp",
    "Aashirvaad Atta": "ashirvaad atta.webp",
    "India Gate Basmati Rice": "india gate basmati rice.webp",
    "Tata Salt": "salt salt.webp",
    "Fortune Sunflower Oil": "sunflower oil.jpg",
    "Maggi Noodles": "maggie noodles.jpg",
    "Parle-G Biscuits": "parle g buscuits.jpg",
    "Oreo Biscuits": "oreo buscuits.webp",
    "Coca-Cola": "coca cola.webp",
    Pepsi: "pepsi.webp",
    "Tropicana Juice": "tropicana juice.webp",
    "Surf Excel": "surf excel.webp",
    "Vim Dishwashing Liquid": "vim liquid.jpg",
    "Colgate Toothpaste": "colgate.webp",
    "Dettol Handwash": "dettol handwash.webp",
    "Dove Soap": "dove.webp",
    "Clinic Plus Shampoo": "clinic plus.webp",
    "Fresh Tomatoes": "tomatto.jpg",
    Potatoes: "potato.jpg",
    Onions: "onions.jpg",
    Bananas: "bananas.jpg",
    Apples: "apple.webp",
    Oranges: "oranges.jpg",
    "Green Peas": "green peas.jpg",
    Eggs: "eggs.jpg",
    Paneer: "paneer pack.jpg",
    Curd: "curd.webp",
    Cheese: "cheese.jpg",
    "Fresh Apple Combo": "apple.webp",
    "Tomato Family Pack": "tomatto.jpg",
    "Brown Eggs 12 Pack": "eggs.jpg",
    "Amul Cheese Slices": "cheese.jpg",
    "Royal Basmati Rice 5 kg": "india gate basmati rice.webp",
    "Fortune Sunflower Oil 1 L": "sunflower oil.jpg",
    "Masala Noodles Family Pack": "maggie noodles.jpg",
    "Chocolate Cream Biscuits": "oreo buscuits.webp",
    "Mixed Fruit Juice 1 L": "tropicana juice.webp",
    "Dettol Handwash Refill": "dettol handwash.webp",
    "Vim Dishwash Gel Refill": "vim liquid.jpg",
    "Frozen Green Peas 1 kg": "green peas.jpg",
  };
  const newProducts = [
    {
      name: "Fresh Apple Combo",
      brand: "FreshMart",
      category: "Fruits and Vegetables",
      sellingPrice: 175,
      originalPrice: 200,
      stock: 24,
      weight: "1 kg",
      image: "assets/products/apple.webp",
      featured: true,
    },
    {
      name: "Tomato Family Pack",
      brand: "FreshMart",
      category: "Fruits and Vegetables",
      sellingPrice: 65,
      originalPrice: 80,
      stock: 30,
      weight: "2 kg",
      image: "assets/products/tomatto.jpg",
    },
    {
      name: "Brown Eggs 12 Pack",
      brand: "Farm Fresh",
      category: "Dairy and Bakery",
      sellingPrice: 150,
      originalPrice: 170,
      stock: 18,
      weight: "12 pcs",
      image: "assets/products/eggs.jpg",
      featured: true,
    },
    {
      name: "Amul Cheese Slices",
      brand: "Amul",
      category: "Dairy and Bakery",
      sellingPrice: 140,
      originalPrice: 160,
      stock: 20,
      weight: "200 g",
      image: "assets/products/cheese.jpg",
    },
    {
      name: "Royal Basmati Rice 5 kg",
      brand: "India Gate",
      category: "Grocery",
      sellingPrice: 620,
      originalPrice: 700,
      stock: 16,
      weight: "5 kg",
      image: "assets/products/india gate basmati rice.webp",
    },
    {
      name: "Fortune Sunflower Oil 1 L",
      brand: "Fortune",
      category: "Grocery",
      sellingPrice: 165,
      originalPrice: 190,
      stock: 22,
      weight: "1 L",
      image: "assets/products/sunflower oil.jpg",
      featured: true,
    },
    {
      name: "Masala Noodles Family Pack",
      brand: "Nestle",
      category: "Snacks and Biscuits",
      sellingPrice: 112,
      originalPrice: 128,
      stock: 32,
      weight: "4 Pack",
      image: "assets/products/maggie noodles.jpg",
    },
    {
      name: "Chocolate Cream Biscuits",
      brand: "Oreo",
      category: "Snacks and Biscuits",
      sellingPrice: 80,
      originalPrice: 95,
      stock: 28,
      weight: "300 g",
      image: "assets/products/oreo buscuits.webp",
    },
    {
      name: "Mixed Fruit Juice 1 L",
      brand: "Tropicana",
      category: "Beverages",
      sellingPrice: 125,
      originalPrice: 145,
      stock: 21,
      weight: "1 L",
      image: "assets/products/tropicana juice.webp",
      featured: true,
    },
    {
      name: "Dettol Handwash Refill",
      brand: "Dettol",
      category: "Personal Care",
      sellingPrice: 135,
      originalPrice: 155,
      stock: 19,
      weight: "750 ml",
      image: "assets/products/dettol handwash.webp",
    },
    {
      name: "Vim Dishwash Gel Refill",
      brand: "Vim",
      category: "Household Products",
      sellingPrice: 130,
      originalPrice: 150,
      stock: 18,
      weight: "750 ml",
      image: "assets/products/vim liquid.jpg",
    },
    {
      name: "Frozen Green Peas 1 kg",
      brand: "FreshMart",
      category: "Frozen Foods",
      sellingPrice: 165,
      originalPrice: 190,
      stock: 26,
      weight: "1 kg",
      image: "assets/products/green peas.jpg",
    },
  ];
  let categories = FM.get(FM.keys.categories),
    products = FM.products(),
    changedCategories = false,
    changedProducts = false;
  const nextProductId = () => {
    const maxId = products.reduce((max, product) => {
      const match = String(product.id || "").match(/^PROD(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    return "PROD" + String(maxId + 1).padStart(3, "0");
  };
  categories.forEach((category) => {
    let image = categoryImageMap[category.name];
    if (
      image &&
      !String(category.image || "").startsWith("data:") &&
      category.image !== image
    ) {
      category.image = image;
      changedCategories = true;
    }
  });
  products.forEach((p) => {
    let image = imageMap[p.name];
    if (
      image &&
      !String(p.image || "").startsWith("data:") &&
      p.image !== "assets/products/" + image
    ) {
      p.image = "assets/products/" + image;
      changedProducts = true;
    }
  });
  newProducts.forEach((product) => {
    if (products.some((existing) => existing.name === product.name)) return;

    products.push({
      id: nextProductId(),
      ...product,
      description:
        "Fresh, carefully selected " +
        product.name.toLowerCase() +
        " delivered with care.",
      discount: Math.round(
        ((product.originalPrice - product.sellingPrice) /
          product.originalPrice) *
          100,
      ),
      minimumStock: 5,
      unit: "Pack",
      rating: 4.6,
      ingredients: "Quality ingredients",
      storageInstructions: "Store in a cool, dry place.",
      featured: Boolean(product.featured),
      active: true,
    });
    changedProducts = true;
  });
  if (changedCategories) FM.set(FM.keys.categories, categories);
  if (changedProducts) FM.saveProducts(products);
})();
