import { sql } from "drizzle-orm";
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("client"), // "client" or "advisor"
  pin: text("pin"), // 6-digit PIN for transactions
  advisorId: text("advisor_id"),
  isApproved: integer("is_approved", { mode: 'boolean' }).default(false), // Account approval status
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // "courant", "epargne", "pel"
  name: text("name").notNull(),
  balance: real("balance").notNull().default(0.00),
  overdraftLimit: real("overdraft_limit").default(0.00),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table séparée pour les RIB (1 RIB par client, création manuelle uniquement)
// Les RIB ne sont PAS créés automatiquement avec les comptes
// Maximum 2 comptes courants par client, aucun RIB pour les livrets A
export const userRibs = sqliteTable("user_ribs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(), // 1 RIB par client (pour tous ses comptes)
  iban: text("iban").notNull().unique(),
  bankName: text("bank_name").notNull().default("CIC - Crédit Industriel et Commercial"),
  bankCode: text("bank_code").notNull().default("30027"),
  branchCode: text("branch_code").notNull().default("10000"),
  accountNumber: text("account_number").notNull(),
  ribKey: text("rib_key").notNull().default("76"),
  bic: text("bic").notNull().default("CMCIFR2A"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text("account_id").notNull(),
  cardNumber: text("card_number").notNull().unique(),
  holderName: text("holder_name").notNull(),
  expiryDate: text("expiry_date").notNull(),
  cvv: text("cvv").notNull(),
  pin: text("pin").notNull(),
  isVirtual: integer("is_virtual", { mode: 'boolean' }).default(true),
  isBlocked: integer("is_blocked", { mode: 'boolean' }).default(false),
  createdBy: text("created_by"), // advisor who created the card
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromAccountId: text("from_account_id"),
  toAccountId: text("to_account_id"),
  amount: real("amount").notNull(),
  description: text("description"), // Description optionnelle
  recipientName: text("recipient_name"),
  recipientIban: text("recipient_iban"),
  senderName: text("sender_name"), // Nom de l'expéditeur pour affichage côté destinataire
  type: text("type").notNull(), // "transfer", "deposit", "withdrawal"
  status: text("status").notNull().default("completed"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table pour les bénéficiaires enregistrés par les clients
export const beneficiaries = sqliteTable("beneficiaries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  iban: text("iban").notNull(),
  bankName: text("bank_name"),
  isInternal: integer("is_internal", { mode: 'boolean' }).default(false), // true si c'est un client de la banque
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table pour les frais de découvert
export const overdraftFees = sqliteTable("overdraft_fees", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  accountId: text("account_id").notNull(),
  userId: text("user_id").notNull(),
  amount: real("amount").notNull(),
  reason: text("reason").notNull().default("Frais de découvert"),
  negativeBalanceDays: integer("negative_balance_days").notNull(), // Nombre de jours en négatif
  chargedAt: integer("charged_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table pour les informations de la banque modifiables par le conseiller
export const bankInfo = sqliteTable("bank_info", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  advisorId: text("advisor_id").notNull(),
  bankName: text("bank_name").notNull().default("CIC - Crédit Industriel et Commercial"),
  advisorName: text("advisor_name").notNull(),
  advisorEmail: text("advisor_email").notNull(), // Email personnel du conseiller
  agencyEmail: text("agency_email").notNull().default("contact@cic-lille.fr"), // Email de l'agence
  phone: text("phone").notNull().default("03 20 12 34 56"),
  address: text("address").notNull().default("Agence CIC Lille Centre\n15 Place Rihour\n59000 Lille"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Table pour les crédits bancaires
export const credits = sqliteTable("credits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  accountId: text("account_id").notNull(), // Compte sur lequel débiter
  creditName: text("credit_name").notNull(), // Nom du crédit (ex: "Crédit Auto", "Prêt Personnel")
  totalAmount: real("total_amount").notNull(), // Montant total du crédit
  monthlyAmount: real("monthly_amount").notNull(), // Montant mensuel
  remainingAmount: real("remaining_amount").notNull(), // Montant restant
  interestRate: real("interest_rate").notNull(), // Taux d'intérêt
  duration: integer("duration").notNull(), // Durée en mois
  remainingMonths: integer("remaining_months").notNull(), // Mois restants
  nextPaymentDate: integer("next_payment_date", { mode: 'timestamp' }).notNull(), // Prochaine échéance
  paymentDay: integer("payment_day").notNull(), // Jour de prélèvement (1-31)
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdBy: text("created_by").notNull(), // ID du conseiller qui a créé le crédit
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export des types
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type UserRib = typeof userRibs.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type BankInfo = typeof bankInfo.$inferSelect;
export type Credit = typeof credits.$inferSelect;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type OverdraftFee = typeof overdraftFees.$inferSelect;

// Export des schemas d'insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true });
export const insertUserRibSchema = createInsertSchema(userRibs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCardSchema = createInsertSchema(cards).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertBankInfoSchema = createInsertSchema(bankInfo).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditSchema = createInsertSchema(credits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBeneficiarySchema = createInsertSchema(beneficiaries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOverdraftFeeSchema = createInsertSchema(overdraftFees).omit({ id: true, chargedAt: true });

// Export des types d'insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type InsertUserRib = z.infer<typeof insertUserRibSchema>;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBankInfo = z.infer<typeof insertBankInfoSchema>;
export type InsertCredit = z.infer<typeof insertCreditSchema>;
export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;
export type InsertOverdraftFee = z.infer<typeof insertOverdraftFeeSchema>;

// Schema pour l'enregistrement
export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  username: z.string().min(3, "Le nom d'utilisateur doit faire au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

// Schema pour définir le PIN
export const setPinSchema = z.object({
  userId: z.string(),
  pin: z.string().length(6, "Le PIN doit faire exactement 6 chiffres").regex(/^\d+$/, "Le PIN ne doit contenir que des chiffres"),
});

export const verifyPinSchema = z.object({
  userId: z.string(),
  pin: z.string().length(6, "Le PIN doit faire exactement 6 chiffres"),
});

// Schema pour la mise à jour des informations bancaires
export const updateBankInfoSchema = z.object({
  bankName: z.string().optional(),
  advisorName: z.string().min(2, "Le nom du conseiller doit faire au moins 2 caractères"),
  advisorEmail: z.string().email("Email conseiller invalide"),
  agencyEmail: z.string().email("Email agence invalide"),
  phone: z.string().min(10, "Le numéro de téléphone doit être valide"),
  address: z.string().min(10, "L'adresse doit être complète"),
});

export type UpdateBankInfo = z.infer<typeof updateBankInfoSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const transferSchema = z.object({
  fromAccountId: z.string(),
  toAccountId: z.string().optional(),
  amount: z.string().refine((val) => parseFloat(val) > 0, "Amount must be positive"),
  description: z.string().optional(), // Description optionnelle
  recipientName: z.string().optional(),
  recipientIban: z.string().optional(),
  type: z.string().default("transfer"),
  pin: z.string().length(6, "Le PIN doit faire exactement 6 chiffres"),
  userId: z.string(),
});

// Schema pour les alertes conseillers
export const advisorAlertSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string().default("overdraft_alert"),
  amount: z.string().optional(),
});

// Notifications table
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, success, warning, error
  isRead: integer("is_read", { mode: 'boolean' }).notNull().default(false),
  amount: text("amount"), // For transaction notifications
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Messages table for advisor-client chat
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: 'boolean' }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Additional schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type Message = typeof messages.$inferSelect;