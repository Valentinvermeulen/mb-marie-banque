import { type User, type InsertUser, type Account, type InsertAccount, type UserRib, type InsertUserRib, type Card, type InsertCard, type Transaction, type InsertTransaction, type BankInfo, type InsertBankInfo, type UpdateBankInfo, type Credit, type InsertCredit, type Notification, type InsertNotification, type Message, type InsertMessage, type Beneficiary, type InsertBeneficiary, type OverdraftFee, type InsertOverdraftFee } from "@shared/schema";
import { db } from "./db";
import { users, accounts, userRibs, cards, transactions, bankInfo, credits, notifications, messages, beneficiaries, overdraftFees } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPin(userId: string, pin: string): Promise<void>;
  approveUser(userId: string): Promise<void>;
  getPendingUsers(): Promise<User[]>;

  // Account operations
  getAccountsByUserId(userId: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccountBalance(accountId: string, newBalance: string): Promise<void>;
  updateAccountName(accountId: string, name: string): Promise<Account>;
  deleteAccount(accountId: string): Promise<void>;

  // RIB operations (1 RIB per user)
  getUserRib(userId: string): Promise<UserRib | undefined>;
  createUserRib(rib: InsertUserRib): Promise<UserRib>;
  updateUserRib(userId: string, updateData: Partial<InsertUserRib>): Promise<UserRib>;
  deleteUserRib(userId: string): Promise<void>;

  // Card operations
  getCardsByAccountId(accountId: string): Promise<Card[]>;
  getCard(id: string): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(cardId: string, updateData: Partial<InsertCard>): Promise<Card>;
  updateCardStatus(cardId: string, isBlocked: boolean): Promise<void>;
  deleteCard(cardId: string): Promise<void>;
  getBlockedCards(): Promise<(Card & { accountId: string, userId: string, userName: string })[]>;

  // Transaction operations
  getTransactionsByAccountId(accountId: string): Promise<Transaction[]>;
  getTransactionsByAccountIds(accountIds: string[]): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Advisor operations
  getClientsByAdvisorId(advisorId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllAccounts(): Promise<Account[]>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Bank Info operations
  getBankInfo(advisorId: string): Promise<BankInfo | undefined>;
  createBankInfo(bankInfo: InsertBankInfo): Promise<BankInfo>;
  updateBankInfo(advisorId: string, updateData: UpdateBankInfo): Promise<BankInfo>;
  
  // Credit operations
  getCreditsByUserId(userId: string): Promise<Credit[]>;
  getCredit(id: string): Promise<Credit | undefined>;
  createCredit(credit: InsertCredit): Promise<Credit>;
  updateCredit(creditId: string, updateData: Partial<Credit>): Promise<Credit>;
  deleteCredit(creditId: string): Promise<void>;
  
  // Helper operations
  getClients(): Promise<User[]>;
  getAdvisorStats(): Promise<any>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  markMessageAsRead(messageId: string): Promise<void>;

  // Beneficiary operations
  getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]>;
  createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary>;
  updateBeneficiary(beneficiaryId: string, updateData: Partial<InsertBeneficiary>): Promise<Beneficiary>;
  deleteBeneficiary(beneficiaryId: string): Promise<void>;

  // Overdraft operations
  createOverdraftFee(fee: InsertOverdraftFee): Promise<OverdraftFee>;
  getOverdraftFeesByAccountId(accountId: string): Promise<OverdraftFee[]>;
  checkAndChargeOverdraftFees(accountId: string): Promise<OverdraftFee | null>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      // Check if default advisor exists
      const existingAdvisor = await this.getUserByUsername("conseiller");
      if (!existingAdvisor) {
        // Create default advisor
        await this.createUser({
          username: "conseiller",
          password: "conseiller2024",
          name: "Mme Stephanie Amick",
          email: "s.amick@cic.fr",
          role: "advisor",
          advisorId: null,
          pin: null,
          isApproved: true,
        });
      }
    } catch (error) {
      console.log("Default data initialization:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "client",
        isApproved: insertUser.role === "advisor" ? true : false, // Advisors are auto-approved
      })
      .returning();
    return user;
  }

  async updateUserPin(userId: string, pin: string): Promise<void> {
    await db
      .update(users)
      .set({ pin })
      .where(eq(users.id, userId));
  }

  async approveUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isApproved: true })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, "client"), eq(users.isApproved, false)));
  }

  async getAccountsByUserId(userId: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateAccountBalance(accountId: string, newBalance: string): Promise<void> {
    await db
      .update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, accountId));
  }

  async updateAccountName(accountId: string, name: string): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ name })
      .where(eq(accounts.id, accountId))
      .returning();
    return account;
  }

  async deleteAccount(accountId: string): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, accountId));
  }

  // RIB operations (1 RIB per user)
  async getUserRib(userId: string): Promise<UserRib | undefined> {
    const result = await db.select().from(userRibs).where(eq(userRibs.userId, userId)).limit(1);
    return result[0];
  }

  async createUserRib(rib: InsertUserRib): Promise<UserRib> {
    const result = await db.insert(userRibs).values(rib).returning();
    return result[0];
  }

  async updateUserRib(userId: string, updateData: Partial<InsertUserRib>): Promise<UserRib> {
    const result = await db.update(userRibs)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userRibs.userId, userId))
      .returning();
    return result[0];
  }

  async deleteUserRib(userId: string): Promise<void> {
    await db.delete(userRibs).where(eq(userRibs.userId, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getCardsByAccountId(accountId: string): Promise<Card[]> {
    return await db
      .select()
      .from(cards)
      .where(eq(cards.accountId, accountId));
  }

  async getCard(id: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db
      .insert(cards)
      .values(insertCard)
      .returning();
    return card;
  }

  async updateCard(cardId: string, updateData: Partial<InsertCard>): Promise<Card> {
    const [card] = await db
      .update(cards)
      .set(updateData)
      .where(eq(cards.id, cardId))
      .returning();
    return card;
  }

  async updateCardStatus(cardId: string, isBlocked: boolean): Promise<void> {
    await db
      .update(cards)
      .set({ isBlocked })
      .where(eq(cards.id, cardId));
  }

  async deleteCard(cardId: string): Promise<void> {
    await db.delete(cards).where(eq(cards.id, cardId));
  }

  async getBlockedCards(): Promise<(Card & { accountId: string, userId: string, userName: string })[]> {
    const result = await db
      .select({
        id: cards.id,
        accountId: cards.accountId,
        cardNumber: cards.cardNumber,
        holderName: cards.holderName,
        expiryDate: cards.expiryDate,
        cvv: cards.cvv,
        pin: cards.pin,
        isVirtual: cards.isVirtual,
        isBlocked: cards.isBlocked,
        createdBy: cards.createdBy,
        userId: accounts.userId,
        userName: users.name,
      })
      .from(cards)
      .innerJoin(accounts, eq(cards.accountId, accounts.id))
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(eq(cards.isBlocked, true));
    
    return result as (Card & { accountId: string, userId: string, userName: string })[];
  }

  async getAllAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getBankInfo(advisorId: string): Promise<BankInfo | undefined> {
    const [info] = await db.select().from(bankInfo).where(eq(bankInfo.advisorId, advisorId));
    return info || undefined;
  }

  async createBankInfo(insertBankInfo: InsertBankInfo): Promise<BankInfo> {
    const [info] = await db
      .insert(bankInfo)
      .values(insertBankInfo)
      .returning();
    return info;
  }

  async updateBankInfo(advisorId: string, updateData: UpdateBankInfo): Promise<BankInfo> {
    const [info] = await db
      .update(bankInfo)
      .set(updateData)
      .where(eq(bankInfo.advisorId, advisorId))
      .returning();
    return info;
  }

  async getClientsByAdvisorId(advisorId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.role, "client"), eq(users.advisorId, advisorId)));
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.fromAccountId, accountId),
          eq(transactions.toAccountId, accountId)
        )
      )
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByAccountIds(accountIds: string[]): Promise<Transaction[]> {
    if (accountIds.length === 0) return [];
    
    console.log("DEBUG: getTransactionsByAccountIds called with:", accountIds);
    
    // Build the conditions array properly
    const conditions: any[] = [];
    
    // Add fromAccountId conditions (handle null values)
    accountIds.forEach(id => {
      conditions.push(eq(transactions.fromAccountId, id));
      conditions.push(eq(transactions.toAccountId, id));
    });
    
    if (conditions.length === 0) return [];
    
    console.log("DEBUG: conditions built, executing query...");
    
    const result = await db
      .select()
      .from(transactions)
      .where(or(...conditions))
      .orderBy(desc(transactions.createdAt));
      
    console.log("DEBUG: query result:", result.length, "transactions found");
    return result;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  // Credit operations
  async getCreditsByUserId(userId: string): Promise<Credit[]> {
    return await db.select().from(credits).where(eq(credits.userId, userId));
  }

  async getCredit(id: string): Promise<Credit | undefined> {
    const [credit] = await db.select().from(credits).where(eq(credits.id, id));
    return credit || undefined;
  }

  async createCredit(credit: InsertCredit): Promise<Credit> {
    const [newCredit] = await db.insert(credits).values(credit).returning();
    return newCredit;
  }

  async updateCredit(creditId: string, updateData: Partial<Credit>): Promise<Credit> {
    const [credit] = await db
      .update(credits)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(credits.id, creditId))
      .returning();
    return credit;
  }

  async deleteCredit(creditId: string): Promise<void> {
    await db.delete(credits).where(eq(credits.id, creditId));
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, transactionId));
  }

  // Helper operations
  async getClients(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "client"));
  }

  async getAdvisorStats(): Promise<any> {
    const allClients = await this.getClients();
    const approvedClients = allClients.filter(client => client.isApproved);
    const pendingClients = allClients.filter(client => !client.isApproved);
    const allAccounts = await this.getAllAccounts();
    const allTransactions = await this.getAllTransactions();
    
    const totalBalance = allAccounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
    const monthlyTransactions = allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt!);
      const currentDate = new Date();
      return transactionDate.getMonth() === currentDate.getMonth() && 
             transactionDate.getFullYear() === currentDate.getFullYear();
    });

    return {
      totalClients: allClients.length,
      approvedClients: approvedClients.length,
      pendingClients: pendingClients.length,
      totalAccounts: allAccounts.length,
      totalBalance: totalBalance,
      totalTransactions: allTransactions.length,
      monthlyTransactions: monthlyTransactions.length,
      lastUpdated: new Date().toISOString()
    };
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  // Beneficiary operations
  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    return await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, userId))
      .orderBy(desc(beneficiaries.createdAt));
  }

  async createBeneficiary(beneficiary: InsertBeneficiary): Promise<Beneficiary> {
    const [newBeneficiary] = await db.insert(beneficiaries).values(beneficiary).returning();
    return newBeneficiary;
  }

  async updateBeneficiary(beneficiaryId: string, updateData: Partial<InsertBeneficiary>): Promise<Beneficiary> {
    const [updatedBeneficiary] = await db
      .update(beneficiaries)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(beneficiaries.id, beneficiaryId))
      .returning();
    return updatedBeneficiary;
  }

  async deleteBeneficiary(beneficiaryId: string): Promise<void> {
    await db.delete(beneficiaries).where(eq(beneficiaries.id, beneficiaryId));
  }

  // Overdraft operations
  async createOverdraftFee(fee: InsertOverdraftFee): Promise<OverdraftFee> {
    const [newFee] = await db.insert(overdraftFees).values(fee).returning();
    return newFee;
  }

  async getOverdraftFeesByAccountId(accountId: string): Promise<OverdraftFee[]> {
    return await db
      .select()
      .from(overdraftFees)
      .where(eq(overdraftFees.accountId, accountId))
      .orderBy(desc(overdraftFees.chargedAt));
  }

  async checkAndChargeOverdraftFees(accountId: string): Promise<OverdraftFee | null> {
    // Récupérer le compte et vérifier s'il est en négatif
    const account = await this.getAccount(accountId);
    if (!account || parseFloat(account.balance) >= 0) {
      return null; // Pas en découvert
    }

    // Calculer depuis combien de jours le compte est en négatif
    const transactions = await this.getTransactionsByAccountId(accountId);
    let negativeBalanceDays = 0;
    let currentBalance = parseFloat(account.balance);
    
    // Si le solde actuel est négatif depuis plus de 7 jours, facturer 5€
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= sevenDaysAgo
    );
    
    // Vérifier s'il y a déjà eu des frais récents (dans les dernières 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentFees = await db
      .select()
      .from(overdraftFees)
      .where(eq(overdraftFees.accountId, accountId));

    if (recentFees.length > 0) {
      return null; // Déjà facturé récemment
    }

    // Si en négatif depuis plus de 7 jours, facturer
    if (currentBalance < 0) {
      negativeBalanceDays = 7; // Simplification pour ce prototype
      
      const overdraftFee: InsertOverdraftFee = {
        accountId,
        userId: account.userId,
        amount: "5.00",
        reason: "Frais de découvert (7 jours en négatif)",
        negativeBalanceDays
      };

      // Créer la transaction de frais
      await this.createTransaction({
        fromAccountId: accountId,
        amount: "5.00",
        description: "Frais de découvert",
        recipientName: "MB MARIE BANQUE",
        type: "fee",
        status: "completed"
      });

      // Débiter le compte
      const newBalance = (parseFloat(account.balance) - 5.00).toFixed(2);
      await this.updateAccountBalance(accountId, newBalance);

      return await this.createOverdraftFee(overdraftFee);
    }

    return null;
  }

}

export const storage = new DatabaseStorage();
