
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table des utilisateurs
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar"), // URL de l'avatar
  bio: text("bio"), // Description de l'utilisateur
  location: text("location"), // Ville/Pays
  phone: text("phone"),
  isVerified: integer("is_verified", { mode: 'boolean' }).default(false),
  rating: real("rating").default(0),
  totalSales: integer("total_sales").default(0),
  totalPurchases: integer("total_purchases").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastSeen: integer("last_seen", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des catégories
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  parentId: text("parent_id"), // Pour les sous-catégories
  icon: text("icon"), // Nom de l'icône
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des marques
export const brands = sqliteTable("brands", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"), // URL du logo
  isVerified: integer("is_verified", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des tailles
export const sizes = sqliteTable("sizes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // XS, S, M, L, XL, etc.
  categoryId: text("category_id"), // Pour les tailles spécifiques à certaines catégories
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des couleurs
export const colors = sqliteTable("colors", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // Rouge, Bleu, Noir, etc.
  hexCode: text("hex_code"), // Code hexadécimal de la couleur
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des produits
export const products = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull(),
  categoryId: text("category_id").notNull(),
  brandId: text("brand_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  originalPrice: real("original_price"), // Prix original si applicable
  condition: text("condition").notNull(), // "new", "like_new", "good", "fair", "poor"
  sizeId: text("size_id"),
  colorId: text("color_id"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  isSold: integer("is_sold", { mode: 'boolean' }).default(false),
  isReserved: integer("is_reserved", { mode: 'boolean' }).default(false),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des images de produits
export const productImages = sqliteTable("product_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull(),
  imageUrl: text("image_url").notNull(),
  isPrimary: integer("is_primary", { mode: 'boolean' }).default(false),
  order: integer("order").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des favoris
export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des commandes
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  productId: text("product_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, shipped, delivered, cancelled
  totalAmount: real("total_amount").notNull(),
  shippingCost: real("shipping_cost").default(0),
  shippingAddress: text("shipping_address").notNull(),
  paymentMethod: text("payment_method").notNull(), // "card", "paypal", "apple_pay"
  trackingNumber: text("tracking_number"),
  estimatedDelivery: integer("estimated_delivery", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des messages entre utilisateurs
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  productId: text("product_id"), // Optionnel, pour les messages liés à un produit
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des avis et évaluations
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reviewerId: text("reviewer_id").notNull(),
  reviewedUserId: text("reviewed_user_id").notNull(),
  orderId: text("order_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 étoiles
  comment: text("comment"),
  isPublic: integer("is_public", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // "message", "order", "favorite", "sale", etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: text("related_id"), // ID du produit, commande, etc.
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table des tags pour les produits
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  color: text("color").default("#3B82F6"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table de liaison produits-tags
export const productTags = sqliteTable("product_tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull(),
  tagId: text("tag_id").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export des types
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Size = typeof sizes.$inferSelect;
export type Color = typeof colors.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ProductTag = typeof productTags.$inferSelect;

// Export des schemas d'insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastSeen: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true, createdAt: true });
export const insertSizeSchema = createInsertSchema(sizes).omit({ id: true, createdAt: true });
export const insertColorSchema = createInsertSchema(colors).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductImageSchema = createInsertSchema(productImages).omit({ id: true, createdAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertProductTagSchema = createInsertSchema(productTags).omit({ id: true, createdAt: true });

// Export des types d'insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type InsertSize = z.infer<typeof insertSizeSchema>;
export type InsertColor = z.infer<typeof insertColorSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertProductTag = z.infer<typeof insertProductTagSchema>;

// Schemas de validation
export const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  username: z.string().min(3, "Le nom d'utilisateur doit faire au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  location: z.string().optional(),
  bio: z.string().optional(),
});

export const createProductSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  description: z.string().min(10, "La description doit faire au moins 10 caractères"),
  price: z.number().positive("Le prix doit être positif"),
  originalPrice: z.number().positive().optional(),
  categoryId: z.string().min(1, "La catégorie est requise"),
  brandId: z.string().optional(),
  sizeId: z.string().optional(),
  colorId: z.string().optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]),
  images: z.array(z.string().url()).min(1, "Au moins une image est requise"),
  tags: z.array(z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Le produit est requis"),
  shippingAddress: z.string().min(10, "L'adresse de livraison est requise"),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Le destinataire est requis"),
  productId: z.string().optional(),
  message: z.string().min(1, "Le message ne peut pas être vide"),
});

export const createReviewSchema = z.object({
  orderId: z.string().min(1, "La commande est requise"),
  rating: z.number().min(1).max(5, "La note doit être entre 1 et 5"),
  comment: z.string().optional(),
  isPublic: z.boolean().default(true),
});

// Types pour les réponses API
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type CreateReviewRequest = z.infer<typeof createReviewSchema>;