import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { 
  users, 
  categories, 
  brands, 
  sizes, 
  colors, 
  products, 
  productImages, 
  tags,
  productTags
} from "../shared/schema.js";

const sqlite = new Database("local.db");
const db = drizzle(sqlite);

async function initDb() {
  console.log("🚀 Initialisation de la base de données Vinted-like...");

  try {
    // Suppression des tables existantes
    console.log("🗑️  Suppression des tables existantes...");
    sqlite.exec(`
      DROP TABLE IF EXISTS product_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS favorites;
      DROP TABLE IF EXISTS product_images;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS colors;
      DROP TABLE IF EXISTS sizes;
      DROP TABLE IF EXISTS brands;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS users;
    `);

    // Création des tables
    console.log("📋 Création des tables...");
    sqlite.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        avatar TEXT,
        bio TEXT,
        location TEXT,
        phone TEXT,
        is_verified INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        total_sales INTEGER DEFAULT 0,
        total_purchases INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        parent_id TEXT,
        icon TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE sizes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category_id TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE colors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        hex_code TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        brand_id TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        condition TEXT NOT NULL,
        size_id TEXT,
        color_id TEXT,
        is_active INTEGER DEFAULT 1,
        is_sold INTEGER DEFAULT 0,
        is_reserved INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE product_images (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        "order" INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        buyer_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount REAL NOT NULL,
        shipping_cost REAL DEFAULT 0,
        shipping_address TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        tracking_number TEXT,
        estimated_delivery INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        product_id TEXT,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE reviews (
        id TEXT PRIMARY KEY,
        reviewer_id TEXT NOT NULL,
        reviewed_user_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        is_public INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id TEXT,
        is_read INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#3B82F6',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE product_tags (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // Insertion des données de test
    console.log("📝 Insertion des données de test...");

    // Utilisateurs
    const testUsers = [
      {
        id: "user-1",
        username: "sarah_fashion",
        password: "$2b$10$rQZ8K9mN2pL1vX3yJ6hG8t", // "password123"
        name: "Sarah Martin",
        email: "sarah@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        bio: "Passionnée de mode et de vintage",
        location: "Paris, France",
        phone: "+33 6 12 34 56 78",
        isVerified: true,
        rating: 4.8,
        totalSales: 45,
        totalPurchases: 23,
        createdAt: new Date(),
        lastSeen: new Date(),
      },
      {
        id: "user-2",
        username: "marc_style",
        password: "$2b$10$rQZ8K9mN2pL1vX3yJ6hG8t",
        name: "Marc Dubois",
        email: "marc@example.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        bio: "Collectionneur de sneakers",
        location: "Lyon, France",
        phone: "+33 6 98 76 54 32",
        isVerified: true,
        rating: 4.9,
        totalSales: 67,
        totalPurchases: 34,
        createdAt: new Date(),
        lastSeen: new Date(),
      },
      {
        id: "user-3",
        username: "emma_vintage",
        password: "$2b$10$rQZ8K9mN2pL1vX3yJ6hG8t",
        name: "Emma Rousseau",
        email: "emma@example.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        bio: "Spécialiste du vintage et des pièces uniques",
        location: "Bordeaux, France",
        phone: "+33 6 45 67 89 01",
        isVerified: true,
        rating: 4.7,
        totalSales: 89,
        totalPurchases: 56,
        createdAt: new Date(),
        lastSeen: new Date(),
      },
    ];

    for (const user of testUsers) {
      await db.insert(users).values(user);
    }

    // Catégories
    const testCategories = [
      { id: "cat-1", name: "Femmes", slug: "femmes", icon: "👗" },
      { id: "cat-2", name: "Hommes", slug: "hommes", icon: "👔" },
      { id: "cat-3", name: "Enfants", slug: "enfants", icon: "👶" },
      { id: "cat-4", name: "Accessoires", slug: "accessoires", icon: "👜" },
      { id: "cat-5", name: "Chaussures", slug: "chaussures", icon: "👠" },
      { id: "cat-6", name: "Vêtements", slug: "vetements", parentId: "cat-1", icon: "👕" },
      { id: "cat-7", name: "Robes", slug: "robes", parentId: "cat-1", icon: "👗" },
      { id: "cat-8", name: "Pantalons", slug: "pantalons", parentId: "cat-1", icon: "👖" },
      { id: "cat-9", name: "Manteaux", slug: "manteaux", parentId: "cat-1", icon: "🧥" },
    ];

    for (const category of testCategories) {
      await db.insert(categories).values({
        ...category,
        createdAt: new Date(),
      });
    }

    // Marques
    const testBrands = [
      { id: "brand-1", name: "Zara", slug: "zara", logo: "https://logo.clearbit.com/zara.com", isVerified: true },
      { id: "brand-2", name: "H&M", slug: "h-m", logo: "https://logo.clearbit.com/hm.com", isVerified: true },
      { id: "brand-3", name: "Nike", slug: "nike", logo: "https://logo.clearbit.com/nike.com", isVerified: true },
      { id: "brand-4", name: "Adidas", slug: "adidas", logo: "https://logo.clearbit.com/adidas.com", isVerified: true },
      { id: "brand-5", name: "Mango", slug: "mango", logo: "https://logo.clearbit.com/mango.com", isVerified: true },
      { id: "brand-6", name: "Uniqlo", slug: "uniqlo", logo: "https://logo.clearbit.com/uniqlo.com", isVerified: true },
      { id: "brand-7", name: "New Look", slug: "new-look", logo: "https://logo.clearbit.com/newlook.com", isVerified: true },
      { id: "brand-8", name: "Lacoste", slug: "lacoste", logo: "https://logo.clearbit.com/lacoste.com", isVerified: true },
    ];

    for (const brand of testBrands) {
      await db.insert(brands).values({
        ...brand,
        createdAt: new Date(),
      });
    }

    // Tailles
    const testSizes = [
      { id: "size-1", name: "XS" },
      { id: "size-2", name: "S" },
      { id: "size-3", name: "M" },
      { id: "size-4", name: "L" },
      { id: "size-5", name: "XL" },
      { id: "size-6", name: "XXL" },
      { id: "size-7", name: "34" },
      { id: "size-8", name: "36" },
      { id: "size-9", name: "38" },
      { id: "size-10", name: "40" },
      { id: "size-11", name: "42" },
      { id: "size-12", name: "44" },
      { id: "size-13", name: "46" },
    ];

    for (const size of testSizes) {
      await db.insert(sizes).values({
        ...size,
        createdAt: new Date(),
      });
    }

    // Couleurs
    const testColors = [
      { id: "color-1", name: "Noir", hexCode: "#000000" },
      { id: "color-2", name: "Blanc", hexCode: "#FFFFFF" },
      { id: "color-3", name: "Rouge", hexCode: "#FF0000" },
      { id: "color-4", name: "Bleu", hexCode: "#0000FF" },
      { id: "color-5", name: "Vert", hexCode: "#00FF00" },
      { id: "color-6", name: "Jaune", hexCode: "#FFFF00" },
      { id: "color-7", name: "Rose", hexCode: "#FFC0CB" },
      { id: "color-8", name: "Gris", hexCode: "#808080" },
      { id: "color-9", name: "Marron", hexCode: "#A52A2A" },
      { id: "color-10", name: "Orange", hexCode: "#FFA500" },
      { id: "color-11", name: "Violet", hexCode: "#800080" },
      { id: "color-12", name: "Turquoise", hexCode: "#40E0D0" },
    ];

    for (const color of testColors) {
      await db.insert(colors).values({
        ...color,
        createdAt: new Date(),
      });
    }

    // Tags
    const testTags = [
      { id: "tag-1", name: "Vintage", color: "#8B4513" },
      { id: "tag-2", name: "Écologique", color: "#228B22" },
      { id: "tag-3", name: "Tendance", color: "#FF69B4" },
      { id: "tag-4", name: "Casual", color: "#4169E1" },
      { id: "tag-5", name: "Élégant", color: "#000000" },
      { id: "tag-6", name: "Sport", color: "#FF4500" },
      { id: "tag-7", name: "Bohème", color: "#DDA0DD" },
      { id: "tag-8", name: "Minimaliste", color: "#F5F5DC" },
      { id: "tag-9", name: "Streetwear", color: "#2F4F4F" },
      { id: "tag-10", name: "Luxe", color: "#FFD700" },
    ];

    for (const tag of testTags) {
      await db.insert(tags).values({
        ...tag,
        createdAt: new Date(),
      });
    }

    // Produits
    const testProducts = [
      {
        id: "prod-1",
        sellerId: "user-1",
        categoryId: "cat-7",
        brandId: "brand-1",
        title: "Robe d'été Zara en coton",
        description: "Magnifique robe d'été en coton de chez Zara. Coupe fluide et confortable, parfaite pour les journées ensoleillées. État excellent, portée seulement 2 fois.",
        price: 25.00,
        originalPrice: 45.00,
        condition: "like_new",
        sizeId: "size-3",
        colorId: "color-7",
        views: 156,
        likes: 23,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-2",
        sellerId: "user-2",
        categoryId: "cat-5",
        brandId: "brand-3",
        title: "Sneakers Nike Air Max vintage",
        description: "Sneakers Nike Air Max en parfait état. Modèle vintage des années 90, très recherché par les collectionneurs. Semelle en bon état, pas de décollement.",
        price: 120.00,
        originalPrice: 180.00,
        condition: "good",
        sizeId: "size-15",
        colorId: "color-4",
        views: 89,
        likes: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-3",
        sellerId: "user-3",
        categoryId: "cat-9",
        brandId: "brand-5",
        title: "Manteau Mango en laine",
        description: "Superbe manteau en laine de chez Mango. Coupe classique et élégante, parfait pour l'automne et l'hiver. Doublure en soie, très chaud et confortable.",
        price: 65.00,
        originalPrice: 120.00,
        condition: "good",
        sizeId: "size-4",
        colorId: "color-8",
        views: 234,
        likes: 67,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-4",
        sellerId: "user-1",
        categoryId: "cat-4",
        brandId: "brand-8",
        title: "Sac à main Lacoste en cuir",
        description: "Sac à main Lacoste en cuir véritable. Coupe classique, parfait pour le quotidien. Compartiments multiples, très pratique. État excellent.",
        price: 45.00,
        originalPrice: 85.00,
        condition: "like_new",
        sizeId: null,
        colorId: "color-1",
        views: 78,
        likes: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-5",
        sellerId: "user-2",
        categoryId: "cat-6",
        brandId: "brand-4",
        title: "T-shirt Adidas vintage",
        description: "T-shirt Adidas vintage des années 80. Logo brodé, coupe oversize très tendance. État correct avec quelques signes d'usure normaux pour l'âge.",
        price: 35.00,
        originalPrice: 55.00,
        condition: "fair",
        sizeId: "size-4",
        colorId: "color-2",
        views: 145,
        likes: 34,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "prod-6",
        sellerId: "user-3",
        categoryId: "cat-8",
        brandId: "brand-2",
        title: "Jeans H&M mom fit",
        description: "Jeans H&M mom fit très tendance. Coupe haute et ajustée, parfaite pour un look rétro. État excellent, porté seulement quelques fois.",
        price: 28.00,
        originalPrice: 49.00,
        condition: "like_new",
        sizeId: "size-9",
        colorId: "color-4",
        views: 167,
        likes: 29,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const product of testProducts) {
      await db.insert(products).values(product);
    }

    // Images de produits
    const testProductImages = [
      // Produit 1 - Robe Zara
      {
        id: "img-1",
        productId: "prod-1",
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
        isPrimary: true,
        order: 0,
        createdAt: new Date(),
      },
      {
        id: "img-2",
        productId: "prod-1",
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop&crop=face",
        isPrimary: false,
        order: 1,
        createdAt: new Date(),
      },
      // Produit 2 - Sneakers Nike
      {
        id: "img-3",
        productId: "prod-2",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
        isPrimary: true,
        order: 0,
        createdAt: new Date(),
      },
      // Produit 3 - Manteau Mango
      {
        id: "img-4",
        productId: "prod-3",
        imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
        isPrimary: true,
        order: 0,
        createdAt: new Date(),
      },
      // Produit 4 - Sac Lacoste
      {
        id: "img-5",
        productId: "prod-4",
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop",
        isPrimary: true,
        order: 0,
        createdAt: new Date(),
      },
      // Produit 5 - T-shirt Adidas
      {
        id: "img-6",
        productId: "prod-5",
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
        isPrimary: true,
        order: 0,
        createdAt: new Date(),
      },
      // Produit 6 - Jeans H&M
      {
        id: "img-7",
        productId: "prod-6",
        imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop",
        isPrimary: true,
        order: 0,
        createdAt: new Date(),
      },
    ];

    for (const image of testProductImages) {
      await db.insert(productImages).values(image);
    }

    // Tags de produits
    const testProductTags = [
      { id: "pt-1", productId: "prod-1", tagId: "tag-3", createdAt: new Date() }, // Robe Zara - Tendance
      { id: "pt-2", productId: "prod-1", tagId: "tag-5", createdAt: new Date() }, // Robe Zara - Élégant
      { id: "pt-3", productId: "prod-2", tagId: "tag-1", createdAt: new Date() }, // Sneakers Nike - Vintage
      { id: "pt-4", productId: "prod-2", tagId: "tag-6", createdAt: new Date() }, // Sneakers Nike - Sport
      { id: "pt-5", productId: "prod-3", tagId: "tag-5", createdAt: new Date() }, // Manteau Mango - Élégant
      { id: "pt-6", productId: "prod-4", tagId: "tag-5", createdAt: new Date() }, // Sac Lacoste - Élégant
      { id: "pt-7", productId: "prod-4", tagId: "tag-10", createdAt: new Date() }, // Sac Lacoste - Luxe
      { id: "pt-8", productId: "prod-5", tagId: "tag-1", createdAt: new Date() }, // T-shirt Adidas - Vintage
      { id: "pt-9", productId: "prod-5", tagId: "tag-9", createdAt: new Date() }, // T-shirt Adidas - Streetwear
      { id: "pt-10", productId: "prod-6", tagId: "tag-3", createdAt: new Date() }, // Jeans H&M - Tendance
      { id: "pt-11", productId: "prod-6", tagId: "tag-4", createdAt: new Date() }, // Jeans H&M - Casual
    ];

    for (const productTag of testProductTags) {
      await db.insert(productTags).values(productTag);
    }

    console.log("✅ Base de données initialisée avec succès !");
    console.log("📊 Données insérées :");
    console.log(`   - ${testUsers.length} utilisateurs`);
    console.log(`   - ${testCategories.length} catégories`);
    console.log(`   - ${testBrands.length} marques`);
    console.log(`   - ${testSizes.length} tailles`);
    console.log(`   - ${testColors.length} couleurs`);
    console.log(`   - ${testProducts.length} produits`);
    console.log(`   - ${testProductImages.length} images`);
    console.log(`   - ${testTags.length} tags`);
    console.log(`   - ${testProductTags.length} associations produits-tags`);

  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation :", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

initDb().catch(console.error); 