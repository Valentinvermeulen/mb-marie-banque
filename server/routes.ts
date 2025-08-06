import { Router } from "express";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import bcrypt from "bcrypt";
import { 
  users, 
  categories, 
  brands, 
  sizes, 
  colors, 
  products, 
  productImages, 
  favorites,
  orders,
  messages,
  reviews,
  notifications,
  tags,
  productTags,
  loginSchema,
  registerSchema,
  createProductSchema,
  updateProductSchema,
  createOrderSchema,
  sendMessageSchema,
  createReviewSchema
} from "../shared/schema.js";
import { eq, and, or, desc, asc, like, inArray } from "drizzle-orm";

const sqlite = new Database("local.db");
const db = drizzle(sqlite);

const router = Router();

// Middleware d'authentification
const authenticateUser = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  next();
};

// Routes d'authentification
router.post("/auth/register", async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.select().from(users).where(
      or(eq(users.email, validatedData.email), eq(users.username, validatedData.username))
    ).limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email ou nom d'utilisateur déjà utilisé" });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Créer l'utilisateur
    const newUser = await db.insert(users).values({
      ...validatedData,
      password: hashedPassword,
    }).returning();
    
    // Créer la session
    req.session.userId = newUser[0].id;
    
    res.status(201).json({
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        name: newUser[0].name,
        email: newUser[0].email,
        avatar: newUser[0].avatar,
        bio: newUser[0].bio,
        location: newUser[0].location,
        isVerified: newUser[0].isVerified,
        rating: newUser[0].rating,
        totalSales: newUser[0].totalSales,
        totalPurchases: newUser[0].totalPurchases,
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Trouver l'utilisateur
    const user = await db.select().from(users).where(eq(users.username, validatedData.username)).limit(1);
    
    if (user.length === 0) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
    }
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(validatedData.password, user[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
    }
    
    // Créer la session
    req.session.userId = user[0].id;
    
    // Mettre à jour lastSeen
    await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, user[0].id));
    
    res.json({
      user: {
        id: user[0].id,
        username: user[0].username,
        name: user[0].name,
        email: user[0].email,
        avatar: user[0].avatar,
        bio: user[0].bio,
        location: user[0].location,
        isVerified: user[0].isVerified,
        rating: user[0].rating,
        totalSales: user[0].totalSales,
        totalPurchases: user[0].totalPurchases,
      }
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Erreur lors de la déconnexion" });
    }
    res.json({ message: "Déconnexion réussie" });
  });
});

router.get("/auth/me", authenticateUser, async (req, res) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    
    res.json({
      user: {
        id: user[0].id,
        username: user[0].username,
        name: user[0].name,
        email: user[0].email,
        avatar: user[0].avatar,
        bio: user[0].bio,
        location: user[0].location,
        isVerified: user[0].isVerified,
        rating: user[0].rating,
        totalSales: user[0].totalSales,
        totalPurchases: user[0].totalPurchases,
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des catégories
router.get("/categories", async (req, res) => {
  try {
    const categoriesList = await db.select().from(categories).orderBy(asc(categories.name));
    res.json(categoriesList);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des marques
router.get("/brands", async (req, res) => {
  try {
    const brandsList = await db.select().from(brands).orderBy(asc(brands.name));
    res.json(brandsList);
  } catch (error) {
    console.error("Erreur lors de la récupération des marques:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des tailles
router.get("/sizes", async (req, res) => {
  try {
    const sizesList = await db.select().from(sizes).orderBy(asc(sizes.name));
    res.json(sizesList);
  } catch (error) {
    console.error("Erreur lors de la récupération des tailles:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des couleurs
router.get("/colors", async (req, res) => {
  try {
    const colorsList = await db.select().from(colors).orderBy(asc(colors.name));
    res.json(colorsList);
  } catch (error) {
    console.error("Erreur lors de la récupération des couleurs:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des tags
router.get("/tags", async (req, res) => {
  try {
    const tagsList = await db.select().from(tags).orderBy(asc(tags.name));
    res.json(tagsList);
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des produits
router.get("/products", async (req, res) => {
  try {
    const { 
      category, 
      brand, 
      size, 
      color, 
      minPrice, 
      maxPrice, 
      condition, 
      search,
      sort = "newest",
      page = 1,
      limit = 20
    } = req.query;
    
    let query = db.select({
      id: products.id,
      title: products.title,
      price: products.price,
      originalPrice: products.originalPrice,
      condition: products.condition,
      views: products.views,
      likes: products.likes,
      createdAt: products.createdAt,
      sellerId: products.sellerId,
      categoryId: products.categoryId,
      brandId: products.brandId,
      sizeId: products.sizeId,
      colorId: products.colorId,
      sellerName: users.name,
      sellerAvatar: users.avatar,
      sellerRating: users.rating,
      categoryName: categories.name,
      brandName: brands.name,
      sizeName: sizes.name,
      colorName: colors.name,
      primaryImage: productImages.imageUrl,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(sizes, eq(products.sizeId, sizes.id))
    .leftJoin(colors, eq(products.colorId, colors.id))
    .leftJoin(productImages, and(
      eq(products.id, productImages.productId),
      eq(productImages.isPrimary, true)
    ))
    .where(eq(products.isActive, true));
    
    // Filtres
    if (category) {
      query = query.where(eq(products.categoryId, category as string));
    }
    if (brand) {
      query = query.where(eq(products.brandId, brand as string));
    }
    if (size) {
      query = query.where(eq(products.sizeId, size as string));
    }
    if (color) {
      query = query.where(eq(products.colorId, color as string));
    }
    if (minPrice) {
      query = query.where(products.price >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.where(products.price <= parseFloat(maxPrice as string));
    }
    if (condition) {
      query = query.where(eq(products.condition, condition as string));
    }
    if (search) {
      query = query.where(like(products.title, `%${search}%`));
    }
    
    // Tri
    switch (sort) {
      case "price_asc":
        query = query.orderBy(asc(products.price));
        break;
      case "price_desc":
        query = query.orderBy(desc(products.price));
        break;
      case "popular":
        query = query.orderBy(desc(products.views));
        break;
      case "likes":
        query = query.orderBy(desc(products.likes));
        break;
      default:
        query = query.orderBy(desc(products.createdAt));
    }
    
    // Pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.limit(parseInt(limit as string)).offset(offset);
    
    const productsList = await query;
    
    res.json({
      products: productsList,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: productsList.length, // Pour une vraie pagination, il faudrait compter le total
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Récupérer le produit avec toutes les informations
    const product = await db.select({
      id: products.id,
      title: products.title,
      description: products.description,
      price: products.price,
      originalPrice: products.originalPrice,
      condition: products.condition,
      views: products.views,
      likes: products.likes,
      createdAt: products.createdAt,
      sellerId: products.sellerId,
      categoryId: products.categoryId,
      brandId: products.brandId,
      sizeId: products.sizeId,
      colorId: products.colorId,
      sellerName: users.name,
      sellerAvatar: users.avatar,
      sellerBio: users.bio,
      sellerLocation: users.location,
      sellerRating: users.rating,
      sellerTotalSales: users.totalSales,
      sellerTotalPurchases: users.totalPurchases,
      sellerIsVerified: users.isVerified,
      categoryName: categories.name,
      brandName: brands.name,
      sizeName: sizes.name,
      colorName: colors.name,
    })
    .from(products)
    .leftJoin(users, eq(products.sellerId, users.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(sizes, eq(products.sizeId, sizes.id))
    .leftJoin(colors, eq(products.colorId, colors.id))
    .where(eq(products.id, productId))
    .limit(1);
    
    if (product.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }
    
    // Récupérer les images du produit
    const images = await db.select().from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.order));
    
    // Récupérer les tags du produit
    const productTagsList = await db.select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(productTags)
    .leftJoin(tags, eq(productTags.tagId, tags.id))
    .where(eq(productTags.productId, productId));
    
    // Incrémenter les vues
    await db.update(products)
      .set({ views: product[0].views + 1 })
      .where(eq(products.id, productId));
    
    res.json({
      ...product[0],
      images,
      tags: productTagsList,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du produit:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/products", authenticateUser, async (req, res) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    
    // Créer le produit
    const newProduct = await db.insert(products).values({
      sellerId: req.session.userId,
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price,
      originalPrice: validatedData.originalPrice,
      categoryId: validatedData.categoryId,
      brandId: validatedData.brandId,
      sizeId: validatedData.sizeId,
      colorId: validatedData.colorId,
      condition: validatedData.condition,
    }).returning();
    
    // Ajouter les images
    for (let i = 0; i < validatedData.images.length; i++) {
      await db.insert(productImages).values({
        productId: newProduct[0].id,
        imageUrl: validatedData.images[i],
        isPrimary: i === 0,
        order: i,
      });
    }
    
    // Ajouter les tags
    if (validatedData.tags && validatedData.tags.length > 0) {
      for (const tagName of validatedData.tags) {
        // Vérifier si le tag existe, sinon le créer
        let tag = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
        
        if (tag.length === 0) {
          tag = await db.insert(tags).values({
            name: tagName,
            color: "#3B82F6",
          }).returning();
        }
        
        // Associer le tag au produit
        await db.insert(productTags).values({
          productId: newProduct[0].id,
          tagId: tag[0].id,
        });
      }
    }
    
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error("Erreur lors de la création du produit:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

router.put("/products/:id", authenticateUser, async (req, res) => {
  try {
    const productId = req.params.id;
    const validatedData = updateProductSchema.parse(req.body);
    
    // Vérifier que l'utilisateur est le vendeur
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (product.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }
    
    if (product[0].sellerId !== req.session.userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }
    
    // Mettre à jour le produit
    await db.update(products)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
    
    res.json({ message: "Produit mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

// Routes des favoris
router.post("/products/:id/favorite", authenticateUser, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Vérifier si le favori existe déjà
    const existingFavorite = await db.select().from(favorites)
      .where(and(eq(favorites.userId, req.session.userId), eq(favorites.productId, productId)))
      .limit(1);
    
    if (existingFavorite.length > 0) {
      // Supprimer le favori
      await db.delete(favorites)
        .where(and(eq(favorites.userId, req.session.userId), eq(favorites.productId, productId)));
      
      // Décrémenter les likes
      await db.update(products)
        .set({ likes: products.likes - 1 })
        .where(eq(products.id, productId));
      
      res.json({ message: "Favori supprimé" });
    } else {
      // Ajouter le favori
      await db.insert(favorites).values({
        userId: req.session.userId,
        productId,
      });
      
      // Incrémenter les likes
      await db.update(products)
        .set({ likes: products.likes + 1 })
        .where(eq(products.id, productId));
      
      res.json({ message: "Favori ajouté" });
    }
  } catch (error) {
    console.error("Erreur lors de la gestion du favori:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/favorites", authenticateUser, async (req, res) => {
  try {
    const userFavorites = await db.select({
      id: products.id,
      title: products.title,
      price: products.price,
      originalPrice: products.originalPrice,
      condition: products.condition,
      views: products.views,
      likes: products.likes,
      createdAt: products.createdAt,
      sellerName: users.name,
      sellerAvatar: users.avatar,
      categoryName: categories.name,
      brandName: brands.name,
      primaryImage: productImages.imageUrl,
    })
    .from(favorites)
    .leftJoin(products, eq(favorites.productId, products.id))
    .leftJoin(users, eq(products.sellerId, users.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(productImages, and(
      eq(products.id, productImages.productId),
      eq(productImages.isPrimary, true)
    ))
    .where(eq(favorites.userId, req.session.userId))
    .orderBy(desc(favorites.createdAt));
    
    res.json(userFavorites);
  } catch (error) {
    console.error("Erreur lors de la récupération des favoris:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des commandes
router.post("/orders", authenticateUser, async (req, res) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    
    // Récupérer le produit
    const product = await db.select().from(products).where(eq(products.id, validatedData.productId)).limit(1);
    
    if (product.length === 0) {
      return res.status(404).json({ error: "Produit non trouvé" });
    }
    
    if (product[0].sellerId === req.session.userId) {
      return res.status(400).json({ error: "Vous ne pouvez pas acheter votre propre produit" });
    }
    
    // Créer la commande
    const newOrder = await db.insert(orders).values({
      buyerId: req.session.userId,
      sellerId: product[0].sellerId,
      productId: validatedData.productId,
      totalAmount: product[0].price,
      shippingAddress: validatedData.shippingAddress,
      paymentMethod: validatedData.paymentMethod,
    }).returning();
    
    // Marquer le produit comme vendu
    await db.update(products)
      .set({ isSold: true })
      .where(eq(products.id, validatedData.productId));
    
    res.status(201).json(newOrder[0]);
  } catch (error) {
    console.error("Erreur lors de la création de la commande:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

router.get("/orders", authenticateUser, async (req, res) => {
  try {
    const userOrders = await db.select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      shippingCost: orders.shippingCost,
      shippingAddress: orders.shippingAddress,
      paymentMethod: orders.paymentMethod,
      trackingNumber: orders.trackingNumber,
      estimatedDelivery: orders.estimatedDelivery,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      productTitle: products.title,
      productPrice: products.price,
      productImage: productImages.imageUrl,
      sellerName: users.name,
      sellerAvatar: users.avatar,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .leftJoin(users, eq(orders.sellerId, users.id))
    .leftJoin(productImages, and(
      eq(products.id, productImages.productId),
      eq(productImages.isPrimary, true)
    ))
    .where(eq(orders.buyerId, req.session.userId))
    .orderBy(desc(orders.createdAt));
    
    res.json(userOrders);
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des messages
router.post("/messages", authenticateUser, async (req, res) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    
    const newMessage = await db.insert(messages).values({
      senderId: req.session.userId,
      receiverId: validatedData.receiverId,
      productId: validatedData.productId,
      message: validatedData.message,
    }).returning();
    
    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

router.get("/messages", authenticateUser, async (req, res) => {
  try {
    const userMessages = await db.select({
      id: messages.id,
      message: messages.message,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
      productId: messages.productId,
      senderName: users.name,
      senderAvatar: users.avatar,
      productTitle: products.title,
      productImage: productImages.imageUrl,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .leftJoin(products, eq(messages.productId, products.id))
    .leftJoin(productImages, and(
      eq(products.id, productImages.productId),
      eq(productImages.isPrimary, true)
    ))
    .where(or(eq(messages.senderId, req.session.userId), eq(messages.receiverId, req.session.userId)))
    .orderBy(desc(messages.createdAt));
    
    res.json(userMessages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Routes des avis
router.post("/reviews", authenticateUser, async (req, res) => {
  try {
    const validatedData = createReviewSchema.parse(req.body);
    
    // Vérifier que l'utilisateur a bien acheté le produit
    const order = await db.select().from(orders).where(eq(orders.id, validatedData.orderId)).limit(1);
    
    if (order.length === 0) {
      return res.status(404).json({ error: "Commande non trouvée" });
    }
    
    if (order[0].buyerId !== req.session.userId) {
      return res.status(403).json({ error: "Non autorisé" });
    }
    
    const newReview = await db.insert(reviews).values({
      reviewerId: req.session.userId,
      reviewedUserId: order[0].sellerId,
      orderId: validatedData.orderId,
      rating: validatedData.rating,
      comment: validatedData.comment,
      isPublic: validatedData.isPublic,
    }).returning();
    
    res.status(201).json(newReview[0]);
  } catch (error) {
    console.error("Erreur lors de la création de l'avis:", error);
    res.status(400).json({ error: "Données invalides" });
  }
});

// Routes des notifications
router.get("/notifications", authenticateUser, async (req, res) => {
  try {
    const userNotifications = await db.select().from(notifications)
      .where(eq(notifications.userId, req.session.userId))
      .orderBy(desc(notifications.createdAt));
    
    res.json(userNotifications);
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/notifications/:id/read", authenticateUser, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, req.session.userId)));
    
    res.json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
