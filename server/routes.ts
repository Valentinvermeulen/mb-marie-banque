import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, transferSchema, insertCardSchema, insertAccountSchema, registerSchema, setPinSchema, verifyPinSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, biometric } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Handle biometric authentication
      if (biometric && password === "biometric_auth") {
        // In a real app, you'd validate the biometric credential here
        // For demo purposes, we'll trust the client-side biometric validation
        res.json({ user: { ...user, password: undefined } });
        return;
      }

      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Allow login for all clients, but note approval status
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get user by ID
  app.get("/api/user/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Assign a default advisor (get the first available advisor)
      const advisors = await storage.getAllUsers();
      const defaultAdvisor = advisors.find(u => u.role === "advisor");
      
      const user = await storage.createUser({
        ...userData,
        role: "client",
        advisorId: defaultAdvisor?.id || null,
        pin: null,
        isApproved: false,
      });

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Get user accounts
  app.get("/api/accounts/:userId", async (req, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.params.userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get account cards
  app.get("/api/cards/:accountId", async (req, res) => {
    try {
      const cards = await storage.getCardsByAccountId(req.params.accountId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  // Get account transactions
  app.get("/api/transactions/:accountId", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByAccountId(req.params.accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Real-time statistics endpoint for advisor (MOVED UP TO AVOID ROUTE CONFLICTS)
  app.get("/api/advisor/stats", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const clients = allUsers.filter(u => u.role === "client");
      const approvedClients = clients.filter(c => c.isApproved);
      const pendingClients = clients.filter(c => !c.isApproved);
      
      const accounts = await storage.getAllAccounts();
      const transactions = await storage.getAllTransactions();
      
      const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      const thisMonthTransactions = transactions.filter(t => {
        if (!t.createdAt) return false;
        const transactionDate = new Date(t.createdAt);
        const now = new Date();
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      });

      res.json({
        totalClients: clients.length,
        approvedClients: approvedClients.length,
        pendingClients: pendingClients.length,
        totalAccounts: accounts.length,
        totalBalance,
        totalTransactions: transactions.length,
        monthlyTransactions: thisMonthTransactions.length,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/advisor/accounts", async (req, res) => {
    try {
      const allAccounts = await storage.getAllAccounts();
      const totalBalance = allAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      
      res.json({
        totalBalance,
        accountCount: allAccounts.length,
        accounts: allAccounts
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts data" });
    }
  });

  app.get("/api/advisor/transactions", async (req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      const currentMonth = new Date().getMonth();
      const monthlyTransactions = allTransactions.filter(t => 
        t.createdAt && new Date(t.createdAt).getMonth() === currentMonth
      ).length;
      
      res.json({
        monthlyTransactions,
        recentTransactions: allTransactions.slice(0, 10)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions data" });
    }
  });

  // GET /api/advisor/bank-info/:advisorId - Get bank info for advisor
  app.get("/api/advisor/bank-info/:advisorId", async (req, res) => {
    try {
      const { advisorId } = req.params;
      
      const bankInfo = await storage.getBankInfo(advisorId);
      if (!bankInfo) {
        // Return default advisor info if not found
        const defaultInfo = {
          advisorName: 'Conseiller CIC',
          advisorEmail: 'conseiller@cic.fr',
          agencyEmail: 'contact@cic.fr',
          phone: '03 20 12 34 56',
          address: 'Agence CIC\n15 Place Rihour\n59000 Lille',
          bankName: 'CIC - Crédit Industriel et Commercial'
        };
        return res.json(defaultInfo);
      }

      res.json(bankInfo);
    } catch (error) {
      console.error("Error getting advisor bank info:", error);
      res.status(500).json({ error: "Failed to get bank info" });
    }
  });

  // GET /api/advisor/blocked-cards - Get all blocked cards for advisor (MUST BE BEFORE PARAMETERIZED ROUTES)
  app.get("/api/advisor/blocked-cards", async (req, res) => {
    try {
      const blockedCards = await storage.getBlockedCards();
      res.json(blockedCards);
    } catch (error) {
      console.error("Error getting blocked cards:", error);
      res.status(500).json({ error: "Failed to get blocked cards" });
    }
  });

  // Get user's advisor (MUST BE AFTER SPECIFIC ROUTES TO AVOID CONFLICTS)
  app.get("/api/advisor/:userId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user || !user.advisorId) {
        // Return default advisor if no specific advisor assigned
        const defaultAdvisor = {
          id: "default-advisor",
          name: "Mme Stephanie Amick",
          email: "s.amick@cic.fr",
          phone: "03 20 12 34 56",
          address: "Agence CIC Lille Centre\n15 Place Rihour\n59000 Lille"
        };
        return res.json(defaultAdvisor);
      }
      
      const advisor = await storage.getUser(user.advisorId);
      if (!advisor) {
        return res.status(404).json({ message: "Advisor not found" });
      }
      
      res.json({
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        phone: "03 20 12 34 56",
        address: "Agence CIC Lille Centre\n15 Place Rihour\n59000 Lille"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advisor" });
    }
  });

  // Verify PIN
  app.post("/api/auth/verify-pin", async (req, res) => {
    try {
      const { userId, pin } = verifyPinSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user || user.pin !== pin) {
        console.log(`PIN verification failed for user ${userId}. Expected: ${user?.pin}, Got: ${pin}`);
        return res.status(401).json({ message: "Invalid PIN" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("PIN verification error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Process transfer
  app.post("/api/transfer", async (req, res) => {
    try {
      console.log("Transfer request body:", req.body);
      const transferData = transferSchema.parse(req.body);
      console.log("Parsed transfer data:", transferData);
      
      // Verify PIN
      const user = await storage.getUser(req.body.userId);
      if (!user || user.pin !== transferData.pin) {
        return res.status(401).json({ message: "Invalid PIN" });
      }
      
      const fromUser = user;

      const fromAccount = await storage.getAccount(transferData.fromAccountId);
      if (!fromAccount) {
        return res.status(404).json({ message: "Source account not found" });
      }

      const amount = parseFloat(transferData.amount);
      const currentBalance = parseFloat(fromAccount.balance);
      const overdraftLimit = parseFloat(fromAccount.overdraftLimit || "0");

      // NOUVELLE RESTRICTION : Si en solde négatif, ne peut virer que ce qui est disponible
      if (currentBalance < 0) {
        return res.status(400).json({ 
          message: "Virement impossible : Votre compte est en découvert. Veuillez régulariser votre situation avant d'effectuer un virement.",
          overdraftAlert: true
        });
      }

      // NOUVELLE RESTRICTION : Ne peut pas virer plus que le solde disponible (pas de découvert autorisé)
      if (currentBalance < amount) {
        return res.status(400).json({ 
          message: `Fonds insuffisants. Solde disponible : ${currentBalance.toFixed(2)}€`,
          availableAmount: currentBalance.toFixed(2)
        });
      }

      // Update source account balance
      const newBalance = (currentBalance - amount).toFixed(2);
      await storage.updateAccountBalance(transferData.fromAccountId, newBalance);

      // Check if external transfer is actually internal (same bank IBAN)
      let isInternalTransfer = !!transferData.toAccountId;
      let actualToAccountId = transferData.toAccountId;
      let actualRecipientName = transferData.recipientName;
      
      if (!isInternalTransfer && transferData.recipientIban) {
        // Check if the IBAN belongs to our bank (internal client)
        const internalAccount = await db.execute(sql`
          SELECT a.id, a.user_id, u.name
          FROM user_ribs ur 
          JOIN accounts a ON ur.user_id = a.user_id 
          JOIN users u ON a.user_id = u.id
          WHERE ur.iban = ${transferData.recipientIban}
          AND a.type = 'courant'
          LIMIT 1
        `);
        
        if (internalAccount.rows && internalAccount.rows.length > 0) {
          console.log(`IBAN ${transferData.recipientIban} detected as internal transfer to ${internalAccount.rows[0].name}`);
          isInternalTransfer = true;
          actualToAccountId = internalAccount.rows[0].id as string;
          // Automatically get the recipient's name from the database
          actualRecipientName = internalAccount.rows[0].name as string;
        } else {
          console.log(`IBAN ${transferData.recipientIban} detected as external transfer`);
          actualRecipientName = "vers externe";
        }
      }

      // Update destination account balance for internal transfers
      if (isInternalTransfer && actualToAccountId) {
        const toAccount = await storage.getAccount(actualToAccountId);
        if (toAccount) {
          const toBalance = parseFloat(toAccount.balance);
          const newToBalance = (toBalance + amount).toFixed(2);
          await storage.updateAccountBalance(actualToAccountId, newToBalance);
        }
      }

      // Create transaction record with the automatically retrieved recipient name
      const transaction = await storage.createTransaction({
        fromAccountId: transferData.fromAccountId,
        toAccountId: actualToAccountId || null,
        amount: transferData.amount,
        description: transferData.description || null,
        recipientName: actualRecipientName || null,
        recipientIban: transferData.recipientIban || null,
        senderName: fromUser.name, // Add sender name for recipient's transaction view
        type: "transfer",
        status: "completed",
      });

      // Create notification for recipient if internal transfer
      if (isInternalTransfer && actualToAccountId) {
        const toAccount = await storage.getAccount(actualToAccountId);
        const fromUser = await storage.getUser(user.id);
        if (toAccount && fromUser) {
          await storage.createNotification({
            userId: toAccount.userId,
            title: "Virement reçu",
            message: `Vous avez reçu ${transferData.amount}€ de ${fromUser.name} - ${transferData.description}`,
            type: "success",
            amount: transferData.amount,
          });
        }
      }

      // Vérifier et facturer les frais de découvert automatiquement pour TOUS les comptes
      try {
        // Vérifier le compte source
        await storage.checkAndChargeOverdraftFees(transferData.fromAccountId);
        
        // Si virement interne, vérifier aussi le compte destinataire
        if (isInternalTransfer && actualToAccountId) {
          await storage.checkAndChargeOverdraftFees(actualToAccountId);
        }
      } catch (feeError) {
        console.error("Error checking overdraft fees:", feeError);
        // Ne pas faire échouer le virement pour un problème de frais
      }

      res.json({ transaction, newBalance });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(400).json({ message: "Transfer failed", error: (error as Error).message });
    }
  });

  // Create virtual card (advisor only)
  app.post("/api/cards", async (req, res) => {
    try {
      const cardData = insertCardSchema.parse(req.body);
      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      res.status(400).json({ message: "Failed to create card" });
    }
  });

  // Update card status
  app.patch("/api/cards/:cardId/status", async (req, res) => {
    try {
      const { isBlocked } = req.body;
      await storage.updateCardStatus(req.params.cardId, isBlocked);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to update card status" });
    }
  });

  // Update card details (advisor only)
  app.put("/api/cards/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const { holderName, expiryDate, pin, isVirtual } = req.body;
      
      const updatedCard = await storage.updateCard(cardId, {
        holderName,
        expiryDate,
        pin,
        isVirtual,
      });
      
      res.json(updatedCard);
    } catch (error) {
      res.status(400).json({ message: "Failed to update card" });
    }
  });

  // Create new account (advisor only)
  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to create account" });
    }
  });

  // Get advisor clients
  app.get("/api/advisor/:advisorId/clients", async (req, res) => {
    try {
      const clients = await storage.getClientsByAdvisorId(req.params.advisorId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Set user PIN
  app.post("/api/auth/set-pin", async (req, res) => {
    try {
      const { userId, pin } = setPinSchema.parse(req.body);
      
      await storage.updateUserPin(userId, pin);
      
      // Auto-create a default checking account when PIN is set for the first time (NO CARD)
      const user = await storage.getUser(userId);
      const existingAccounts = await storage.getAccountsByUserId(userId);
      
      if (user && existingAccounts.length === 0) {
        // Create default checking account only - no card
        await storage.createAccount({
          userId,
          type: "courant",
          name: "Compte Courant",
          balance: "0.00",
          overdraftLimit: "500.00",
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to set PIN" });
    }
  });

  // Get pending users (advisor only)
  app.get("/api/admin/pending-users", async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Approve user (advisor only)
  app.post("/api/admin/approve-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { advisorId } = req.body; // Get advisor ID from request body
      
      // Approve user and assign to advisor
      await storage.approveUser(userId);
      
      // If advisorId is provided, assign the user to that advisor
      if (advisorId) {
        await storage.updateUser(userId, { advisorId });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(400).json({ message: "Failed to approve user" });
    }
  });

  // Advisor APIs (REMOVED DUPLICATES)

  // Get bank info for advisor
  app.get("/api/advisor/bank-info/:advisorId", async (req, res) => {
    try {
      const { advisorId } = req.params;
      let bankInfo = await storage.getBankInfo(advisorId);
      
      // Create default bank info if doesn't exist
      if (!bankInfo) {
        const advisor = await storage.getUser(advisorId);
        if (advisor) {
          bankInfo = await storage.createBankInfo({
            advisorId,
            advisorName: advisor.name,
            advisorEmail: advisor.email,
          });
        }
      }
      
      res.json(bankInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bank info" });
    }
  });

  // Get bank info for client (based on their advisor)
  app.get("/api/client/bank-info/:clientId", async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getUser(clientId);
      
      if (!client || !client.advisorId) {
        return res.status(404).json({ message: "Client advisor not found" });
      }
      
      let bankInfo = await storage.getBankInfo(client.advisorId);
      
      // Create default bank info if doesn't exist
      if (!bankInfo) {
        const advisor = await storage.getUser(client.advisorId);
        if (advisor) {
          bankInfo = await storage.createBankInfo({
            advisorId: client.advisorId,
            advisorName: advisor.name,
            advisorEmail: advisor.email,
          });
        }
      }
      
      res.json(bankInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client bank info" });
    }
  });

  // Update bank info
  app.put("/api/advisor/bank-info/:advisorId", async (req, res) => {
    try {
      const { advisorId } = req.params;
      const updateData = req.body;
      
      // Get existing bank info first
      let existingBankInfo = await storage.getBankInfo(advisorId);
      
      // If no existing info, create it first
      if (!existingBankInfo) {
        const advisor = await storage.getUser(advisorId);
        if (advisor) {
          existingBankInfo = await storage.createBankInfo({
            advisorId,
            advisorName: advisor.name,
            advisorEmail: advisor.email,
            phone: "03 20 12 34 56",
            address: "Agence CIC Lille Centre\n15 Place Rihour\n59000 Lille",
            bankName: "CIC - Crédit Industriel et Commercial",
          });
        }
      }
      
      // Now update with the new data
      const updatedBankInfo = await storage.updateBankInfo(advisorId, updateData);
      
      res.json(updatedBankInfo);
    } catch (error) {
      console.error("Update bank info error:", error);
      res.status(500).json({ message: "Failed to update bank info" });
    }
  });

  // POST /api/advisor/add-money - Add money to client account
  app.post("/api/advisor/add-money", async (req, res) => {
    try {
      const { userId, amount, description } = req.body;
      
      if (!userId || !amount || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }

      // Get client's primary account (first account)
      const accounts = await storage.getAccountsByUserId(userId);
      if (accounts.length === 0) {
        return res.status(404).json({ error: "No accounts found for client" });
      }

      const primaryAccount = accounts[0];
      const currentBalance = parseFloat(primaryAccount.balance);
      const newBalance = currentBalance + amount;

      // Update account balance
      await storage.updateAccountBalance(primaryAccount.id, newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        toAccountId: primaryAccount.id,
        amount: amount.toString(),
        description: `💰 ${description}`,
        type: "deposit",
        status: "completed"
      });

      res.json({ success: true, newBalance: newBalance.toString() });
    } catch (error) {
      console.error("Error adding money:", error);
      res.status(500).json({ error: "Failed to add money" });
    }
  });

  // POST /api/advisor/remove-money - Remove money from client account
  app.post("/api/advisor/remove-money", async (req, res) => {
    try {
      const { userId, amount, description } = req.body;
      
      if (!userId || !amount || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (amount <= 0) {
        return res.status(400).json({ error: "Amount must be positive" });
      }

      // Get client's primary account
      const accounts = await storage.getAccountsByUserId(userId);
      if (accounts.length === 0) {
        return res.status(404).json({ error: "No accounts found for client" });
      }

      const primaryAccount = accounts[0];
      const currentBalance = parseFloat(primaryAccount.balance);
      const newBalance = currentBalance - amount;

      if (newBalance < 0) {
        return res.status(400).json({ error: "Insufficient funds" });
      }

      // Update account balance
      await storage.updateAccountBalance(primaryAccount.id, newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        fromAccountId: primaryAccount.id,
        amount: amount.toString(),
        description: `💳 ${description}`,
        type: "withdrawal",
        status: "completed"
      });

      res.json({ success: true, newBalance: newBalance.toString() });
    } catch (error) {
      console.error("Error removing money:", error);
      res.status(500).json({ error: "Failed to remove money" });
    }
  });

  // Create account with IBAN generation (advisor only) - UPDATED
  app.post("/api/advisor/create-account", async (req, res) => {
    try {
      const { userId, name, type } = req.body;
      
      if (!userId || !name || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const account = await storage.createAccount({
        userId,
        type,
        name,
        balance: "0.00",
        overdraftLimit: type === "courant" ? "500.00" : "0.00",
      });

      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // POST /api/advisor/create-card - Create new card for client
  app.post("/api/advisor/create-card", async (req, res) => {
    try {
      const { userId, accountId, isVirtual, holderName } = req.body;
      
      if (!userId || !accountId || !holderName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate card details
      const cardNumber = `4532 ${Math.random().toString().substr(2, 4)} ${Math.random().toString().substr(2, 4)} ${Math.random().toString().substr(2, 4)}`;
      const cvv = Math.random().toString().substr(2, 3);
      const pin = Math.random().toString().substr(2, 4);
      const expiryDate = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear() + 5}`;

      const card = await storage.createCard({
        accountId,
        cardNumber,
        holderName,
        expiryDate,
        cvv,
        pin,
        isVirtual: isVirtual ?? true,
        isBlocked: false,
        createdBy: userId
      });

      res.json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  // POST /api/advisor/create-credit - Create new credit for client
  app.post("/api/advisor/create-credit", async (req, res) => {
    try {
      const { userId, accountId, creditName, totalAmount, monthlyAmount, remainingAmount, interestRate, duration, remainingMonths, paymentDay, nextPaymentDate, createdBy } = req.body;
      
      if (!userId || !accountId || !creditName || !totalAmount || !monthlyAmount || !interestRate || !duration || !paymentDay || !createdBy) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const credit = await storage.createCredit({
        userId,
        accountId,
        creditName,
        totalAmount: totalAmount.toString(),
        monthlyAmount: monthlyAmount.toString(),
        remainingAmount: remainingAmount.toString(),
        interestRate: interestRate.toString(),
        duration,
        remainingMonths,
        nextPaymentDate: new Date(nextPaymentDate),
        paymentDay,
        isActive: true,
        createdBy
      });

      res.json(credit);
    } catch (error) {
      console.error("Error creating credit:", error);
      res.status(500).json({ error: "Failed to create credit" });
    }
  });

  // GET /api/credits/:userId - Get credits for user
  app.get("/api/credits/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const credits = await storage.getCreditsByUserId(userId);
      res.json(credits);
    } catch (error) {
      console.error("Error getting credits:", error);
      res.status(500).json({ error: "Failed to get credits" });
    }
  });

  // PUT /api/credits/:creditId - Update credit details (advisor only)
  app.put("/api/credits/:creditId", async (req, res) => {
    try {
      const { creditId } = req.params;
      const { totalAmount, monthlyAmount, remainingAmount, nextPaymentDate, paymentDay } = req.body;
      
      const updateData: any = {};
      if (totalAmount) updateData.totalAmount = totalAmount.toString();
      if (monthlyAmount) updateData.monthlyAmount = monthlyAmount.toString();
      if (remainingAmount) updateData.remainingAmount = remainingAmount.toString();
      if (nextPaymentDate) updateData.nextPaymentDate = new Date(nextPaymentDate);
      if (paymentDay) updateData.paymentDay = paymentDay;
      
      const credit = await storage.updateCredit(creditId, updateData);
      res.json(credit);
    } catch (error) {
      console.error("Error updating credit:", error);
      res.status(500).json({ error: "Failed to update credit" });
    }
  });

  // DELETE /api/credits/:creditId - Delete credit (advisor only)
  app.delete("/api/credits/:creditId", async (req, res) => {
    try {
      const { creditId } = req.params;
      await storage.deleteCredit(creditId);
      res.json({ success: true, message: "Credit deleted successfully" });
    } catch (error) {
      console.error("Error deleting credit:", error);
      res.status(500).json({ error: "Failed to delete credit" });
    }
  });

  // PUT /api/cards/:cardId/block - Block card (client opposition)
  app.put("/api/cards/:cardId/block", async (req, res) => {
    try {
      const { cardId } = req.params;
      
      // Get card details for notification
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ error: "Card not found" });
      }

      // Get account details for user ID
      const account = await storage.getAccount(card.accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const updatedCard = await storage.updateCard(cardId, { isBlocked: true });
      
      // Create notification for card blocking
      await storage.createNotification({
        userId: account.userId,
        title: "Carte bloquée",
        message: `Votre carte •••• •••• •••• ${card.cardNumber.slice(-4)} a été bloquée suite à votre demande d'opposition.`,
        type: "card_blocked",
        isRead: false
      });
      
      res.json(updatedCard);
    } catch (error) {
      console.error("Error blocking card:", error);
      res.status(500).json({ error: "Failed to block card" });
    }
  });

  // PUT /api/cards/:cardId/unblock - Unblock card (advisor only)
  app.put("/api/cards/:cardId/unblock", async (req, res) => {
    try {
      const { cardId } = req.params;
      
      const card = await storage.updateCard(cardId, { isBlocked: false });
      res.json(card);
    } catch (error) {
      console.error("Error unblocking card:", error);
      res.status(500).json({ error: "Failed to unblock card" });
    }
  });

  // DELETE /api/cards/:cardId - Delete card (advisor only)
  app.delete("/api/cards/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      
      await storage.deleteCard(cardId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Failed to delete card" });
    }
  });

  // Route moved above to avoid conflicts with parameterized routes

  // PUT /api/cards/:cardId - Update card details (advisor only)
  app.put("/api/cards/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const { holderName, expiryDate, pin, isVirtual } = req.body;
      
      const updateData: any = {};
      if (holderName) updateData.holderName = holderName;
      if (expiryDate) updateData.expiryDate = expiryDate;
      if (pin) updateData.pin = pin;
      if (typeof isVirtual === 'boolean') updateData.isVirtual = isVirtual;
      
      const card = await storage.updateCard(cardId, updateData);
      res.json(card);
    } catch (error) {
      console.error("Error updating card:", error);
      res.status(500).json({ error: "Failed to update card" });
    }
  });

  // Helper functions for card generation
  function generateCardNumber(): string {
    return "4532" + Math.random().toString().slice(2, 14);
  }

  function generateExpiryDate(): string {
    const now = new Date();
    const expiry = new Date(now.getFullYear() + 3, now.getMonth());
    return `${(expiry.getMonth() + 1).toString().padStart(2, '0')}/${expiry.getFullYear().toString().slice(-2)}`;
  }

  function generateCVV(): string {
    return Math.floor(Math.random() * 900 + 100).toString();
  }

  function generateCardPin(): string {
    return Math.floor(Math.random() * 9000 + 1000).toString();
  }

  function generateIBAN(): string {
    // Format: FR76 1234 5678 9012 3456 7890 123
    const bankCode = "1234";
    const branchCode = "5678";
    const accountNumber = Math.random().toString().slice(2, 13).padStart(11, '0');
    const checkDigits = "76";
    return `FR${checkDigits} ${bankCode} ${branchCode} ${accountNumber.slice(0, 4)} ${accountNumber.slice(4, 8)} ${accountNumber.slice(8)} 123`;
  }

  // === API RIB (1 RIB par utilisateur) ===
  
  // GET /api/user-rib/:userId - Récupérer le RIB d'un utilisateur
  app.get("/api/user-rib/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const rib = await storage.getUserRib(userId);
      res.json(rib || null);
    } catch (error) {
      console.error("Error getting user RIB:", error);
      res.status(500).json({ error: "Failed to get RIB" });
    }
  });



  // POST /api/user-rib - Créer un nouveau RIB pour un utilisateur
  app.post("/api/user-rib", async (req, res) => {
    try {
      const { userId, bankName, bankCode, branchCode, accountNumber, ribKey } = req.body;
      
      if (!userId || !accountNumber) {
        return res.status(400).json({ error: "User ID and account number are required" });
      }

      // Vérifier si l'utilisateur a déjà un RIB
      const existingRib = await storage.getUserRib(userId);
      if (existingRib) {
        return res.status(400).json({ error: "User already has a RIB. Use PUT to update." });
      }

      // Générer l'IBAN automatiquement avec MB MARIE BANQUE
      const iban = `FR${ribKey || '76'}${bankCode || '30066'}${branchCode || '10126'}${accountNumber}`;

      console.log(`[RIB CREATE] Creating RIB for user ${userId}:`, { userId, iban, bankName, bankCode, branchCode, accountNumber, ribKey });
      
      const rib = await storage.createUserRib({
        userId,
        iban,
        bankName: bankName || "MB MARIE BANQUE",
        bankCode: bankCode || "30066",
        branchCode: branchCode || "10126",
        accountNumber,
        ribKey: ribKey || "76",
        bic: "CMCIFR2A"
      });

      console.log(`[RIB CREATE] Created RIB result:`, rib);
      res.json(rib);
    } catch (error) {
      console.error("Error creating user RIB:", error);
      res.status(500).json({ error: "Failed to create RIB" });
    }
  });

  // PUT /api/user-rib/:userId - Modifier le RIB d'un utilisateur
  app.put("/api/user-rib/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { bankName, bankCode, branchCode, accountNumber, ribKey, bic } = req.body;
      
      const updateData: any = {};
      
      if (bankName) updateData.bankName = bankName;
      if (bankCode) updateData.bankCode = bankCode;
      if (branchCode) updateData.branchCode = branchCode;
      if (accountNumber) updateData.accountNumber = accountNumber;
      if (ribKey) updateData.ribKey = ribKey;
      if (bic) updateData.bic = bic;
      
      // Régénérer l'IBAN si les composants ont changé
      if (bankCode || branchCode || accountNumber || ribKey) {
        const currentRib = await storage.getUserRib(userId);
        if (currentRib) {
          const newBankCode = bankCode || currentRib.bankCode;
          const newBranchCode = branchCode || currentRib.branchCode;
          const newAccountNumber = accountNumber || currentRib.accountNumber;
          const newRibKey = ribKey || currentRib.ribKey;
          updateData.iban = `FR${newRibKey}${newBankCode}${newBranchCode}${newAccountNumber}`;
        }
      }

      console.log(`[RIB UPDATE] Updating RIB for user ${userId}:`, updateData);
      const rib = await storage.updateUserRib(userId, updateData);
      console.log(`[RIB UPDATE] Updated RIB result:`, rib);
      
      res.json(rib);
    } catch (error) {
      console.error("Error updating user RIB:", error);
      res.status(500).json({ error: "Failed to update RIB" });
    }
  });

  // POST /api/advisor/create-rib - Créer un RIB pour un client (via conseiller)
  app.post("/api/advisor/create-rib", async (req, res) => {
    try {
      const { userId, bankName, bankCode, branchCode, accountNumber, ribKey, bic } = req.body;
      
      if (!userId || !accountNumber) {
        return res.status(400).json({ error: "User ID and account number are required" });
      }

      // Vérifier si l'utilisateur a déjà un RIB
      const existingRib = await storage.getUserRib(userId);
      if (existingRib) {
        // Si RIB existe, faire une mise à jour
        console.log(`[ADVISOR RIB] Updating existing RIB for user ${userId}`);
        const updateData: any = {};
        if (bankName) updateData.bankName = bankName;
        if (bankCode) updateData.bankCode = bankCode;
        if (branchCode) updateData.branchCode = branchCode;
        if (accountNumber) updateData.accountNumber = accountNumber;
        if (ribKey) updateData.ribKey = ribKey;
        if (bic) updateData.bic = bic;
        
        // Régénérer l'IBAN
        if (bankCode || branchCode || accountNumber || ribKey) {
          const newBankCode = bankCode || existingRib.bankCode;
          const newBranchCode = branchCode || existingRib.branchCode;
          const newAccountNumber = accountNumber || existingRib.accountNumber;
          const newRibKey = ribKey || existingRib.ribKey;
          updateData.iban = `FR${newRibKey}${newBankCode}${newBranchCode}${newAccountNumber}`;
        }
        
        const updatedRib = await storage.updateUserRib(userId, updateData);
        console.log(`[ADVISOR RIB] Updated RIB result:`, updatedRib);
        return res.json(updatedRib);
      }

      // Créer nouveau RIB
      const iban = `FR${ribKey || '76'}${bankCode || '30066'}${branchCode || '10126'}${accountNumber}`;
      console.log(`[ADVISOR RIB] Creating new RIB for user ${userId}:`, { userId, iban, bankName, bankCode, branchCode, accountNumber, ribKey, bic });
      
      const rib = await storage.createUserRib({
        userId,
        iban,
        bankName: bankName || "MB MARIE BANQUE",
        bankCode: bankCode || "30066",
        branchCode: branchCode || "10126",
        accountNumber,
        ribKey: ribKey || "76",
        bic: bic || "CMCIFR2A"
      });

      console.log(`[ADVISOR RIB] Created RIB result:`, rib);
      res.json(rib);
    } catch (error) {
      console.error("Error creating/updating user RIB via advisor:", error);
      res.status(500).json({ error: "Failed to create/update RIB" });
    }
  });

  // GET /api/user-transactions/:userId - Get transactions for user (new endpoint to avoid cache)
  app.get("/api/user-transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get all transactions and filter by user accounts
      const allTransactions = await storage.getAllTransactions();
      const userAccounts = await storage.getAccountsByUserId(userId);
      const accountIds = userAccounts.map(a => a.id);
      
      // Filter transactions that involve any of the user's accounts
      const userTransactions = allTransactions.filter(t => 
        (t.fromAccountId && accountIds.includes(t.fromAccountId)) || 
        (t.toAccountId && accountIds.includes(t.toAccountId))
      );
      
      // Enhance transactions with sender/recipient names
      const enhancedTransactions = await Promise.all(
        userTransactions.map(async (transaction) => {
          let senderName = null;
          let recipientName = transaction.recipientName;
          
          // Get sender name if from internal account
          if (transaction.fromAccountId) {
            const fromAccount = await storage.getAccount(transaction.fromAccountId);
            if (fromAccount) {
              const fromUser = await storage.getUser(fromAccount.userId);
              if (fromUser) {
                senderName = fromUser.name;
              }
            }
          }
          
          // Get recipient name if to internal account
          if (transaction.toAccountId && !recipientName) {
            const toAccount = await storage.getAccount(transaction.toAccountId);
            if (toAccount) {
              const toUser = await storage.getUser(toAccount.userId);
              if (toUser) {
                recipientName = toUser.name;
              }
            }
          }
          
          return {
            ...transaction,
            senderName,
            recipientName
          };
        })
      );
      
      // Sort by date descending
      enhancedTransactions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(enhancedTransactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // GET /api/transactions/:userId - Get transactions for user  
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get all transactions and filter by user accounts
      const allTransactions = await storage.getAllTransactions();
      const userAccounts = await storage.getAccountsByUserId(userId);
      const accountIds = userAccounts.map(a => a.id);
      
      // Filter transactions that involve any of the user's accounts
      const userTransactions = allTransactions.filter(t => 
        (t.fromAccountId && accountIds.includes(t.fromAccountId)) || 
        (t.toAccountId && accountIds.includes(t.toAccountId))
      );
      
      // Sort by date descending
      userTransactions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(userTransactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // PUT /api/notifications/mark-read/:userId - Mark all notifications as read
  app.put("/api/notifications/mark-read/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.markNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // DELETE /api/notifications/:notificationId - Delete notification
  app.delete("/api/notifications/:notificationId", async (req, res) => {
    try {
      const { notificationId } = req.params;
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // PUT /api/accounts/:accountId/name - Rename account (advisor only)
  app.put("/api/accounts/:accountId/name", async (req, res) => {
    try {
      const { accountId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Account name is required" });
      }

      const account = await storage.updateAccountName(accountId, name);
      res.json(account);
    } catch (error) {
      console.error("Error updating account name:", error);
      res.status(500).json({ error: "Failed to update account name" });
    }
  });

  // DELETE /api/user-rib/:userId - Supprimer le RIB d'un utilisateur
  app.delete("/api/user-rib/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUserRib(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user RIB:", error);
      res.status(500).json({ error: "Failed to delete RIB" });
    }
  });

  // === API SUPPRESSION DE COMPTES ===
  
  // DELETE /api/account/:accountId - Supprimer un compte bancaire
  app.delete("/api/account/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      
      // Vérifier que le compte existe
      const account = await storage.getAccount(accountId);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Vérifier que le solde est à zéro (optionnel - retirer pour permettre suppression avec solde)
      if (parseFloat(account.balance) !== 0) {
        return res.status(400).json({ error: "Cannot delete account with non-zero balance" });
      }

      await storage.deleteAccount(accountId);
      res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Get all transactions for advisor dashboard
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Update account name for client customization
  app.put("/api/accounts/:accountId/name", async (req, res) => {
    try {
      const { accountId } = req.params;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }
      
      const account = await storage.updateAccountName(accountId, name.trim());
      res.json(account);
    } catch (error) {
      console.error("Error updating account name:", error);
      res.status(500).json({ error: "Failed to update account name" });
    }
  });

  // === NOTIFICATIONS API ===
  
  // GET /api/notifications/:userId - Get notifications for user
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // POST /api/notifications - Create notification (advisor to client)
  app.post("/api/notifications", async (req, res) => {
    try {
      const { userId, title, message, type, amount } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ error: "userId, title and message are required" });
      }
      
      const notification = await storage.createNotification({
        userId,
        title,
        message,
        type: type || "info",
        amount: amount || null,
      });
      
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // PUT /api/notifications/:notificationId/read - Mark notification as read
  app.put("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const { notificationId } = req.params;
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // === MESSAGES API ===
  
  // GET /api/messages/:user1Id/:user2Id - Get messages between two users
  app.get("/api/messages/:user1Id/:user2Id", async (req, res) => {
    try {
      const { user1Id, user2Id } = req.params;
      const messages = await storage.getMessagesBetweenUsers(user1Id, user2Id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // POST /api/messages - Send message
  app.post("/api/messages", async (req, res) => {
    try {
      const { senderId, receiverId, message } = req.body;
      
      if (!senderId || !receiverId || !message) {
        return res.status(400).json({ error: "senderId, receiverId and message are required" });
      }
      
      const newMessage = await storage.createMessage({
        senderId,
        receiverId,
        message,
      });
      
      res.json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // PUT /api/messages/:messageId/read - Mark message as read
  app.put("/api/messages/:messageId/read", async (req, res) => {
    try {
      const { messageId } = req.params;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // Beneficiary routes
  app.get("/api/beneficiaries/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const beneficiaries = await storage.getBeneficiariesByUserId(userId);
      res.json(beneficiaries);
    } catch (error) {
      console.error("Error getting beneficiaries:", error);
      res.status(500).json({ error: "Failed to get beneficiaries" });
    }
  });

  app.post("/api/beneficiaries", async (req, res) => {
    try {
      const beneficiaryData = req.body;
      
      // Générer un UUID manuellement pour éviter les problèmes de contrainte
      const beneficiaryId = crypto.randomUUID();
      
      // Check if it's an internal client (exists in our database)
      const isInternal = false; // For now, we'll handle this when checking IBAN
      
      const newBeneficiary = await storage.createBeneficiary({
        ...beneficiaryData,
        id: beneficiaryId,
        isInternal
      });
      
      res.json(newBeneficiary);
    } catch (error) {
      console.error("Error creating beneficiary:", error);
      res.status(500).json({ error: "Failed to create beneficiary" });
    }
  });

  app.put("/api/beneficiaries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedBeneficiary = await storage.updateBeneficiary(id, updateData);
      res.json(updatedBeneficiary);
    } catch (error) {
      console.error("Error updating beneficiary:", error);
      res.status(500).json({ error: "Failed to update beneficiary" });
    }
  });

  app.delete("/api/beneficiaries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBeneficiary(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting beneficiary:", error);
      res.status(500).json({ error: "Failed to delete beneficiary" });
    }
  });

  // === OVERDRAFT FEES API ===
  
  // GET /api/overdraft-fees/:accountId - Get overdraft fees for an account
  app.get("/api/overdraft-fees/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      const fees = await storage.getOverdraftFeesByAccountId(accountId);
      res.json(fees);
    } catch (error) {
      console.error("Error getting overdraft fees:", error);
      res.status(500).json({ error: "Failed to get overdraft fees" });
    }
  });

  // POST /api/check-overdraft/:accountId - Check and charge overdraft fees manually
  app.post("/api/check-overdraft/:accountId", async (req, res) => {
    try {
      const { accountId } = req.params;
      const fee = await storage.checkAndChargeOverdraftFees(accountId);
      
      if (fee) {
        // Créer une notification pour le conseiller
        const account = await storage.getAccount(accountId);
        if (account) {
          await storage.createNotification({
            userId: "fb7b4ab0-5bff-4c36-bb05-67cd97e6a5f8", // ID du conseiller par défaut
            title: "Frais de découvert facturés",
            message: `Frais de 5€ facturés pour le compte de ${account.name} (7 jours en découvert)`,
            type: "warning",
            amount: "5.00"
          });
        }
        
        res.json({ fee, charged: true });
      } else {
        res.json({ fee: null, charged: false });
      }
    } catch (error) {
      console.error("Error checking overdraft fees:", error);
      res.status(500).json({ error: "Failed to check overdraft fees" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
