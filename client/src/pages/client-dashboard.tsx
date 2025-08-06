import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCurrentUser, clearStoredUser } from "@/lib/auth";
import { Account, Card } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Wallet, PiggyBank, TrendingUp, ArrowRightLeft, CreditCard, Lock, Menu, Home, Shield, MoreVertical, LogOut, Copy, Eye, EyeOff, User, Trash2, Building2, ArrowUpRight, ArrowDownRight, X, AlertTriangle, Info, CheckCircle, Euro, BarChart3, Activity, Target, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import NumericKeypad from "@/components/ui/numeric-keypad";
import AccountCard from "@/components/ui/account-card";
import BottomNavigation from "@/components/ui/bottom-navigation";
import DesktopSidebar from "@/components/ui/desktop-sidebar";
import TransferModal from "@/components/modals/transfer-modal";
import CardModal from "@/components/modals/card-modal";
import PinModal from "@/components/modals/pin-modal";

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("home");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showCardPin, setShowCardPin] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountTransactions, setShowAccountTransactions] = useState(false);
  const user = getCurrentUser();
  const { toast } = useToast();
  const device = useDeviceDetection();

  useEffect(() => {
    if (!user || user.role !== "client") {
      setLocation("/");
      return;
    }
    if (!user.pin) {
      setLocation("/setup-pin");
      return;
    }
    if (!user.isApproved) {
      setLocation("/pending-approval");
      return;
    }
  }, [user, setLocation]);

  // Mark notifications as read when opening modal
  const markNotificationsAsRead = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", `/api/notifications/mark-read/${user?.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      toast({
        title: "✓ Notifications marquées comme lues",
        description: "Toutes vos notifications ont été marquées comme lues",
      });
    },
  });

  // Delete all notifications
  const deleteAllNotifications = useMutation({
    mutationFn: async () => {
      if (!Array.isArray(notifications)) return;
      
      // Delete all notifications one by one
      const deletePromises = notifications.map(notification => 
        apiRequest("DELETE", `/api/notifications/${notification.id}`, {})
      );
      
      await Promise.all(deletePromises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      toast({
        title: "🗑️ Toutes les notifications supprimées",
        description: "Toutes vos notifications ont été effacées définitivement",
      });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${notificationId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notifications/${user?.id}`] });
      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès",
      });
    },
  });

  // Handle opening notifications
  const handleOpenNotifications = () => {
    setShowNotifications(true);
  };

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", user?.id],
    enabled: !!user?.id,
  });

  const { data: cards = [] } = useQuery<Card[]>({
    queryKey: ["/api/cards", accounts[0]?.id],
    enabled: !!accounts[0]?.id,
  });

  const { data: advisor } = useQuery({
    queryKey: ["/api/advisor", user?.id],
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds to get latest advisor updates
  });

  const { data: bankInfo } = useQuery({
    queryKey: ["/api/client/bank-info", user?.id],
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds to get latest advisor updates
  });

  // Get client's RIB data
  const { data: clientRib } = useQuery({
    queryKey: ["/api/user-rib", user?.id],
    enabled: !!user?.id,
    refetchInterval: 3000, // Refresh every 3 seconds for real-time sync with advisor changes
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache to prevent sync issues
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/user-transactions", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: credits = [] } = useQuery({
    queryKey: ["/api/credits", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Requête pour récupérer les frais de découvert des comptes
  const { data: overdraftFees = [] } = useQuery({
    queryKey: [`/api/overdraft-fees`, accounts?.[0]?.id],
    enabled: !!accounts && accounts.length > 0 && parseFloat(accounts[0]?.balance || "0") < 0,
    refetchInterval: 10000, // Vérifier toutes les 10 secondes si le compte est en découvert
  });

  // Fix for navigation issue
  const handleMyAccountNavigation = () => {
    try {
      setLocation("/my-account");
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation
      window.location.href = "/my-account";
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    setLocation("/");
  };



  const handlePinKeyPress = (key: string) => {
    if (pinInput.length < 6) {
      setPinInput(pinInput + key);
    }
  };

  const handlePinBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  const verifyPin = () => {
    if (pinInput === user?.pin) {
      setIsPinVerified(true);
      setShowPinVerification(false);
      setShowCardDetails(true);
      setPinInput("");
    } else {
      setPinInput("");
      // Could add error toast here
    }
  };

  const handleBlockCard = () => {
    // Implementation for blocking card
    setShowCardDetails(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountTransactions(true);
  };



  const getTransactionIcon = (transaction: any, accountId: string) => {
    if (transaction.type === "deposit") {
      return <ArrowDownRight className="h-4 w-4 text-green-600" />;
    } else if (transaction.type === "withdrawal") {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
    } else if (transaction.type === "transfer") {
      return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowRightLeft className="h-4 w-4 text-gray-600" />;
  };

  const getTransactionAmount = (transaction: any, accountId: string) => {
    // For deposits, always show +
    if (transaction.type === 'deposit') {
      return `+${parseFloat(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
    }
    
    // For transfers, check if it's outgoing or incoming
    if (transaction.type === 'transfer') {
      if (transaction.fromAccountId === accountId) {
        // Outgoing transfer
        return `-${parseFloat(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
      } else if (transaction.toAccountId === accountId) {
        // Incoming transfer
        return `+${parseFloat(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
      }
    }
    
    // Default for other types
    return `${parseFloat(transaction.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
  };

  const getTransactionColor = (transaction: any, accountId: string) => {
    // For deposits, always green
    if (transaction.type === 'deposit') {
      return "text-green-400";
    }
    
    // For transfers, check if it's outgoing or incoming
    if (transaction.type === 'transfer') {
      if (transaction.fromAccountId === accountId) {
        // Outgoing transfer - red
        return "text-red-400";
      } else if (transaction.toAccountId === accountId) {
        // Incoming transfer - green
        return "text-green-400";
      }
    }
    
    // Default
    return "text-blue-400";
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

  // Helper function to get account type label
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "courant": return "Compte courant";
      case "epargne": return "Compte épargne";
      case "pel": return "Plan Épargne Logement";
      default: return type;
    }
  };

  // Handle card click for details display
  const handleCardClick = (card: any) => {
    setSelectedCard(card);
    setShowPinVerification(true);
  };

  // Handle card opposition
  const handleCardOpposition = (card: any) => {
    if (card.isBlocked) return;
    
    // Redirection vers la page des cartes pour utiliser le système sécurisé en 3 étapes
    setLocation("/my-cards");
  };

  // Card opposition mutation
  const cardOppositionMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await apiRequest("PUT", `/api/cards/${cardId}/block`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Opposition effectuée",
        description: "Votre carte a été bloquée avec succès. Votre conseiller en sera informé.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de bloquer la carte. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Handle PIN verification for card details
  const handlePinVerification = useMutation({
    mutationFn: async (pin: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-pin", {
        userId: user?.id,
        pin: pin,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsPinVerified(true);
      setShowPinVerification(false);
      setShowCardDetails(true);
      setPinInput("");
      toast({
        title: "PIN vérifié",
        description: "Accès autorisé aux détails de la carte.",
      });
    },
    onError: () => {
      setPinInput("");
      toast({
        title: "PIN incorrect",
        description: "Le PIN saisi est incorrect. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const mainAccount = accounts.find(acc => acc.type === "courant");
  const savingsAccount = accounts.find(acc => acc.type === "epargne");
  const pelAccount = accounts.find(acc => acc.type === "pel");

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "courant":
        return <Wallet className="text-[var(--cic-teal)]" />;
      case "epargne":
        return <PiggyBank className="text-green-600" />;
      case "pel":
        return <TrendingUp className="text-blue-600" />;
      default:
        return <Wallet className="text-[var(--cic-teal)]" />;
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      {device.isDesktop && (
        <DesktopSidebar 
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "transfers") setLocation("/transfers");
            if (tab === "account") handleMyAccountNavigation();
          }}
          user={user}
          unreadCount={unreadCount}
          onNotificationsOpen={handleOpenNotifications}
        />
      )}

      <div className={`${device.isMobile ? 'pb-20' : 'pb-0'} min-h-screen bg-background relative ${device.isDesktop ? 'ml-56' : 'w-full max-w-lg mx-auto'}`}>
        {/* Logo mobile seulement */}
        {device.isMobile && (
          <div className="fixed top-4 left-4 z-20 opacity-100">
            <img 
              src="/mb-logo-simple.png"
              alt="MB"
              className="h-8 w-auto"
            />
          </div>
        )}
        {/* Header adapté selon device */}
        <div className={`mb-header-gradient ${device.isDesktop ? 'px-6 pt-6 pb-6' : 'px-4 pt-16 pb-6'} text-white relative overflow-hidden`}>
          
          <div className={`flex items-center justify-between ${device.isDesktop ? 'mb-8' : 'mb-4'} ${device.isDesktop ? 'mt-4' : 'mt-6'}`}>
            <div>
              <h2 className={`font-medium text-white/80 ${device.isDesktop ? 'text-xl' : 'text-base'}`}>Bonjour,</h2>
              <p className={`font-bold text-white ${device.isDesktop ? 'text-4xl' : 'text-xl'}`}>{user.name}</p>
            </div>
            {/* Boutons header seulement sur mobile */}
            {device.isMobile && (
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 relative mb-transition mb-glow"
                  onClick={handleOpenNotifications}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0 animate-pulse">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 mb-transition"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Compte Principal Moderne */}
          {mainAccount && (
            <div className={`mb-glass-card rounded-2xl mb-4 mb-transition hover:scale-105 ${device.isDesktop ? 'p-8' : 'p-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/90 text-sm font-medium">{mainAccount.name}</span>
                <span className="text-white/70 text-xs font-mono">
                  •••• •••• ••{mainAccount.id ? mainAccount.id.slice(-4) : "••••"}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white">
                  {parseFloat(mainAccount.balance).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xl ml-2 text-white/80">€</span>
              </div>
              <div className="mt-3 text-xs text-white/60">
                Solde disponible
              </div>
            </div>
          )}
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === "home" && (
          <>
            {/* Actions Rapides Futuristes - adapté selon device */}
            <div className={`${device.isDesktop ? 'px-6' : 'px-4'} ${device.isDesktop ? '-mt-8' : '-mt-6'} mb-6 relative z-10`}>
              <div className={`rotating-border mb-glass-card rounded-2xl shadow-2xl ${device.isDesktop ? 'p-10' : 'p-4'}`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">⚡</span>
                  ACTIONS RAPIDES
                </h3>
                <div className={`grid ${device.isDesktop ? 'grid-cols-3 gap-6' : 'grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'}`}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowTransferModal(true)}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <ArrowRightLeft className="text-blue-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Virement</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/card-view")}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl hover:from-green-500/30 hover:to-teal-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <CreditCard className="text-green-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Ma Carte</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPinModal(true)}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <Lock className="text-purple-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Code PIN</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Mini-Dashboard de Santé Financière */}
            <div className={`${device.isDesktop ? 'px-6' : 'px-4'} mb-6`}>
              <div className="mb-glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <Activity className="mr-3 text-green-400" />
                    SANTÉ FINANCIÈRE
                  </h3>
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Solde Total */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <Wallet className="h-5 w-5 text-blue-400" />
                      <span className="text-xs text-blue-300 font-medium">SOLDE TOTAL</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {(accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) || 0).toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })} €
                    </div>
                    <div className="text-xs text-white/60">
                      {accounts?.length || 0} compte(s)
                    </div>
                  </div>

                  {/* Dépenses du Mois */}
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-4 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <ArrowDownRight className="h-5 w-5 text-orange-400" />
                      <span className="text-xs text-orange-300 font-medium">CE MOIS</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {transactions
                        ?.filter(t => {
                          const isThisMonth = new Date(t.createdAt).getMonth() === new Date().getMonth();
                          const isOutgoing = accounts?.some(acc => acc.id === t.fromAccountId);
                          return isThisMonth && (t.type === 'withdrawal' || (t.type === 'transfer' && isOutgoing));
                        })
                        ?.reduce((sum, t) => sum + parseFloat(t.amount), 0)
                        ?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0,00'} €
                    </div>
                    <div className="text-xs text-white/60">
                      {transactions?.filter(t => {
                        const isThisMonth = new Date(t.createdAt).getMonth() === new Date().getMonth();
                        const isOutgoing = accounts?.some(acc => acc.id === t.fromAccountId);
                        return isThisMonth && (t.type === 'withdrawal' || (t.type === 'transfer' && isOutgoing));
                      })?.length || 0} transaction(s)
                    </div>
                  </div>

                  {/* Score de Santé */}
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="h-5 w-5 text-green-400" />
                      <span className="text-xs text-green-300 font-medium">SCORE</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {(() => {
                        const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) || 0;
                        const hasNegativeBalance = accounts?.some(acc => parseFloat(acc.balance) < 0);
                        if (hasNegativeBalance) return "⚠️ 45";
                        if (totalBalance > 5000) return "💪 95";
                        if (totalBalance > 1000) return "👍 85";
                        return "📈 75";
                      })()}/100
                    </div>
                    <div className="text-xs text-white/60">
                      {(() => {
                        const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) || 0;
                        const hasNegativeBalance = accounts?.some(acc => parseFloat(acc.balance) < 0);
                        if (hasNegativeBalance) return "À améliorer";
                        if (totalBalance > 5000) return "Excellent";
                        if (totalBalance > 1000) return "Très bien";
                        return "Bien";
                      })()}
                    </div>
                  </div>
                </div>

                {/* Conseils Rapides */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-purple-300 mb-1">Conseil du jour</h4>
                      <p className="text-xs text-white/80">
                        {(() => {
                          const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) || 0;
                          const hasNegativeBalance = accounts?.some(acc => parseFloat(acc.balance) < 0);
                          const thisMonthSpending = transactions
                            ?.filter(t => {
                              const isThisMonth = new Date(t.createdAt).getMonth() === new Date().getMonth();
                              const isOutgoing = accounts?.some(acc => acc.id === t.fromAccountId);
                              return isThisMonth && (t.type === 'withdrawal' || (t.type === 'transfer' && isOutgoing));
                            })
                            ?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
                          
                          if (hasNegativeBalance) {
                            return "🔴 Votre compte est en découvert. Régularisez rapidement votre situation pour éviter des frais supplémentaires.";
                          }
                          if (thisMonthSpending > totalBalance * 0.8) {
                            return "⚠️ Attention à vos dépenses ce mois-ci ! Vous avez dépensé plus de 80% de votre solde.";
                          }
                          if (totalBalance > 10000) {
                            return "💡 Excellent solde ! Pensez à optimiser vos placements avec votre conseiller.";
                          }
                          if (transactions?.length === 0) {
                            return "🏁 Première transaction ? Commencez par explorer vos options de virement et de carte bancaire.";
                          }
                          return "✅ Votre situation financière est stable. Continuez à bien gérer vos comptes !";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerte de découvert - si le compte est en négatif */}
            {mainAccount && parseFloat(mainAccount.balance) < 0 && (
              <div className={`${device.isDesktop ? 'px-6' : 'px-4'} mb-6`}>
                <div className="mb-glass-card rounded-2xl p-6 border-2 border-red-500/50 bg-red-500/10">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-400 text-lg mb-2">Compte en découvert</h4>
                      <p className="text-white/90 text-sm mb-3">
                        Votre compte présente un solde négatif de <span className="font-bold text-red-400">
                        {Math.abs(parseFloat(mainAccount.balance)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                        </span>
                      </p>
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
                        <p className="text-yellow-300 text-xs font-medium">⚠️ IMPORTANT</p>
                        <p className="text-white/80 text-xs mt-1">
                          • Les virements sont <span className="font-bold text-red-400">temporairement bloqués</span> jusqu'à régularisation
                        </p>
                        <p className="text-white/80 text-xs">
                          • Des frais de découvert de <span className="font-bold">5€</span> seront appliqués après 7 jours
                        </p>
                      </div>
                      <p className="text-white/70 text-xs">
                        Régularisez rapidement votre situation ou contactez votre conseiller pour assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mon conseiller - adapté selon device */}
            {bankInfo && (
              <div className={`${device.isDesktop ? 'px-6' : 'px-4'} mb-6`}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  👤 MON CONSEILLER
                </h3>
                <div className="mb-glass-card rounded-2xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center mb-glow">
                      <span className="text-white font-bold text-lg">
                        {(bankInfo as any)?.advisorName?.split(" ").map((n: string) => n[0]).join("") || "SA"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">{(bankInfo as any)?.advisorName || "Mme Stephanie Amick"}</h4>
                      <p className="text-sm text-white/70">Conseiller clientèle - {(bankInfo as any)?.bankName || "MB MARIE BANQUE"}</p>
                      <p className="text-xs text-white/60">{(bankInfo as any)?.advisorEmail || "s.amick@mbmariebanque.fr"} • {(bankInfo as any)?.phone || "03 20 12 34 56"}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleMyAccountNavigation}
                      className="mb-btn bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                    >
                      💬 Contacter
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Récentes */}
            <div className="px-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                📈 DERNIÈRES TRANSACTIONS
              </h3>
              <div className="mb-glass-card rounded-2xl overflow-hidden">
                {!Array.isArray(transactions) || transactions.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-white/70 text-lg">💸 Aucune transaction récente</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {Array.isArray(transactions) && transactions.slice(0, 5).map((transaction: any) => (
                      <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-white/5 mb-transition">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            transaction.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 
                            transaction.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {transaction.type === 'deposit' ? '↓' : 
                             transaction.type === 'withdrawal' ? '↑' : '→'}
                          </div>
                          <div>
                            <p className="font-bold text-white">
                              {transaction.type === 'transfer' ? (
                                // Check if this is the user's account sending or receiving
                                accounts.some(acc => acc.id === transaction.fromAccountId) ? 
                                  `Vers ${transaction.recipientName || 'Externe'}` : 
                                  `De ${transaction.senderName || 'Externe'}`
                              ) : transaction.description}
                            </p>
                            {transaction.type === 'transfer' && (
                              <p className="text-xs text-white/60">{transaction.description}</p>
                            )}
                            <p className="text-sm text-white/60">
                              {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            transaction.type === 'deposit' ? 'text-green-400' : 
                            transaction.type === 'withdrawal' ? 'text-red-400' : 
                            transaction.type === 'transfer' ? (
                              accounts.some(acc => acc.id === transaction.fromAccountId) ? 'text-red-400' : 'text-green-400'
                            ) : 'text-blue-400'
                          }`}>
                            {transaction.type === 'deposit' ? '+' : 
                             transaction.type === 'withdrawal' ? '-' :
                             transaction.type === 'transfer' ? (
                               accounts.some(acc => acc.id === transaction.fromAccountId) ? '-' : '+'
                             ) : ''}
                            {parseFloat(transaction.amount).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mes Comptes Tab */}
        {activeTab === "accounts" && (
          <div className="px-6 space-y-6 -mt-6">
            {/* Comptes courants */}
            {accounts.filter(acc => acc.type === "courant").length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  🏦 COMPTES COURANTS
                </h3>
                <div className="space-y-3">
                  {accounts.filter(acc => acc.type === "courant").map((account) => (
                    <div key={account.id} 
                         className="mb-glass-card rounded-2xl p-6 cursor-pointer mb-transition hover:scale-102"
                         onClick={() => {
                           setSelectedAccount(account);
                           setShowAccountTransactions(true);
                         }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center mb-glow">
                            <Wallet className="h-8 w-8 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{account.name}</h4>
                            <p className="text-sm text-white/70 font-mono">
                              •••• •••• ••{account.id.slice(-4)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white mb-glow">
                            {parseFloat(account.balance).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                          <p className="text-sm text-white/60">Solde disponible</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comptes d'épargne */}
            {accounts.filter(acc => acc.type === "epargne").length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  💰 COMPTES D'ÉPARGNE
                </h3>
                <div className="space-y-3">
                  {accounts.filter(acc => acc.type === "epargne").map((account) => (
                    <div key={account.id} 
                         className="mb-glass-card rounded-2xl p-6 cursor-pointer mb-transition hover:scale-102"
                         onClick={() => {
                           setSelectedAccount(account);
                           setShowAccountTransactions(true);
                         }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-glow">
                            <PiggyBank className="h-8 w-8 text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{account.name}</h4>
                            <p className="text-sm text-white/70">Livret A</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white mb-glow">
                            {parseFloat(account.balance).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                          <p className="text-sm text-white/60">Solde disponible</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PEL */}
            {accounts.filter(acc => acc.type === "pel").length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  🏠 PLAN ÉPARGNE LOGEMENT
                </h3>
                <div className="space-y-3">
                  {accounts.filter(acc => acc.type === "pel").map((account) => (
                    <div key={account.id} 
                         className="mb-glass-card rounded-2xl p-6 cursor-pointer mb-transition hover:scale-102"
                         onClick={() => {
                           setSelectedAccount(account);
                           setShowAccountTransactions(true);
                         }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center mb-glow">
                            <TrendingUp className="h-8 w-8 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{account.name}</h4>
                            <p className="text-sm text-white/70">PEL</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white mb-glow">
                            {parseFloat(account.balance).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                          <p className="text-sm text-white/60">Solde disponible</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crédits actifs */}
            {Array.isArray(credits) && credits.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  💳 CRÉDITS EN COURS
                </h3>
                <div className="space-y-3">
                  {credits.map((credit: any) => (
                    <div key={credit.id} className="mb-glass-card rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center mb-glow">
                            <TrendingUp className="h-8 w-8 text-orange-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg">{credit.creditName}</h4>
                            <p className="text-sm text-white/70">
                              Créé le {new Date(credit.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={credit.isActive ? "default" : "secondary"} className={credit.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}>
                          {credit.isActive ? "✅ Actif" : "⏹️ Terminé"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/60">Montant total</p>
                          <p className="font-bold text-white text-lg">
                            {parseFloat(credit.totalAmount).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Restant à payer</p>
                          <p className="font-bold text-orange-400 text-lg">
                            {parseFloat(credit.remainingAmount).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Mensualité</p>
                          <p className="font-bold text-white text-lg">
                            {parseFloat(credit.monthlyAmount).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                            })} €/mois
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Mois restants</p>
                          <p className="font-bold text-white text-lg">
                            {credit.remainingMonths} / {credit.duration} mois
                          </p>
                        </div>
                      </div>
                      
                      {credit.nextPaymentDate && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-sm text-white/80 font-medium">
                            🗓️ Prochaine échéance : {new Date(credit.nextPaymentDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section RIB/IBAN */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                🏛️ MES INFORMATIONS BANCAIRES
              </h3>
              <div className="mb-glass-card rounded-2xl p-6">
                {clientRib ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-glow">
                          <Building2 className="h-8 w-8 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">RIB & IBAN</h4>
                          <p className="text-sm text-white/70">{(clientRib as any)?.bankName || "MB MARIE BANQUE"}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText((clientRib as any)?.iban || "");
                          toast({ title: "IBAN copié dans le presse-papiers" });
                        }}
                        className="mb-btn-glass text-green-400 border-green-400/30 hover:bg-green-500/20"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copier IBAN
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div>
                          <p className="text-white/60 mb-1">IBAN</p>
                          <p className="font-mono text-white font-bold bg-white/10 p-3 rounded-lg border border-white/20">
                            {(clientRib as any)?.iban || "Non défini"}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">Code Banque</p>
                          <p className="font-mono text-white font-semibold">{(clientRib as any)?.bankCode || "Non défini"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">Code Guichet</p>
                          <p className="font-mono text-white font-semibold">{(clientRib as any)?.branchCode || "Non défini"}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-white/60 mb-1">N° de Compte</p>
                          <p className="font-mono text-white font-semibold">{(clientRib as any)?.accountNumber || "Non défini"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">Clé RIB</p>
                          <p className="font-mono text-white font-semibold">{(clientRib as any)?.ribKey || "Non défini"}</p>
                        </div>
                        <div>
                          <p className="text-white/60 mb-1">BIC/SWIFT</p>
                          <p className="font-mono text-white font-semibold">{(clientRib as any)?.bic || "Non défini"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                      <p className="text-xs text-white/60">
                        🔄 Ces informations se synchronisent automatiquement avec votre conseiller
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 mb-glow">
                      <AlertTriangle className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h4 className="font-bold text-white mb-2">RIB non configuré</h4>
                    <p className="text-sm text-white/70 mb-4">
                      Votre conseiller n'a pas encore configuré vos informations bancaires RIB/IBAN.
                    </p>
                    <p className="text-xs text-white/60">
                      Contactez votre conseiller pour obtenir votre RIB/IBAN.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mes Cartes Tab */}
        {activeTab === "cards" && (
          <div className="px-6 space-y-6 -mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mes cartes bancaires</h3>
            
            {!Array.isArray(cards) || cards.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Aucune carte disponible</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Votre conseiller n'a pas encore créé de carte pour votre compte.
                </p>
                <p className="text-xs text-gray-400">
                  Contactez votre conseiller pour demander une nouvelle carte bancaire.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card: any) => (
                  <div key={card.id} className="bg-white rounded-2xl p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--cic-teal)] to-[var(--cic-dark-teal)] rounded-full flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{card.name}</h4>
                          <p className="text-sm text-gray-500">
                            {card.type === "virtual" ? "Carte virtuelle" : "Carte physique"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={card.isBlocked ? "destructive" : "default"} className={
                        card.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                      }>
                        {card.isBlocked ? "Bloquée" : "Active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Numéro de carte</p>
                        <p className="font-mono text-sm text-gray-800">
                          •••• •••• •••• {card.cardNumber?.slice(-4) || "••••"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expire le</p>
                        <p className="font-mono text-sm text-gray-800">
                          {card.expiryDate || "••/••"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCardClick(card)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les détails
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCardOpposition(card)}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={card.isBlocked}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {card.isBlocked ? "Opposition faite" : "Faire opposition"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Navigation */}
      {/* Navigation Bottom uniquement sur Mobile */}
      {device.isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "transfers") setLocation("/transfers");
            if (tab === "account") handleMyAccountNavigation();
          }}
          tabs={[
            { id: "home", label: "Accueil", icon: Home },
            { id: "accounts", label: "Mes Comptes", icon: Wallet },
            { id: "cards", label: "Mes Cartes", icon: CreditCard },
            { id: "transfers", label: "Virements", icon: ArrowRightLeft },
            { id: "account", label: "Mon Compte", icon: User },
          ]}
        />
      )}

      {/* Modals */}
      <TransferModal
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        accounts={accounts}
        userId={user.id}
      />

      <CardModal
        open={showCardModal}
        onOpenChange={setShowCardModal}
        cards={cards}
      />

      <PinModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        title="Code de sécurité"
        description="Saisissez votre code PIN à 6 chiffres"
        onSuccess={() => {
          setShowPinModal(false);
        }}
        userId={user.id}
      />

      {/* PIN Verification Modal */}
      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent className="w-full max-w-sm mx-auto bg-[var(--cic-dark-teal)] border-none">
          <DialogHeader>
            <DialogTitle className="text-white text-center">
              Vérification PIN
            </DialogTitle>
            <p className="text-white/80 text-sm text-center">
              Saisissez votre code PIN pour voir les détails de la carte
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* PIN Input Display */}
            <div className="flex justify-center space-x-3">
              {Array(6).fill(0).map((_, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 bg-white/20 backdrop-blur-sm border-2 rounded-xl flex items-center justify-center ${
                    index < pinInput.length 
                      ? "border-white bg-white/30" 
                      : "border-white/30"
                  }`}
                >
                  {index < pinInput.length && (
                    <span className="text-2xl font-bold text-white">•</span>
                  )}
                </div>
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((key, index) => {
                if (key === null) return <div key={`empty-${index}`} />;
                
                if (key === "⌫") {
                  return (
                    <Button
                      key="backspace"
                      variant="ghost"
                      onClick={handlePinBackspace}
                      className="h-14 text-2xl font-bold text-white bg-black/80 backdrop-blur-sm rounded-xl hover:bg-black/90 active:bg-black transition-colors active:scale-95 border border-white/30"
                    >
                      ⌫
                    </Button>
                  );
                }

                return (
                  <Button
                    key={`key-${key}`}
                    variant="ghost"
                    onClick={() => handlePinKeyPress(key.toString())}
                    className="h-14 text-2xl font-bold text-white bg-black/80 backdrop-blur-sm rounded-xl hover:bg-black/90 active:bg-black transition-colors active:scale-95 border border-white/30"
                  >
                    {key}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={verifyPin}
              disabled={pinInput.length !== 6}
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 border border-white/50"
            >
              Valider
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Details Modal - Design moderne complet */}
      <Dialog open={showCardDetails} onOpenChange={setShowCardDetails}>
        <DialogContent className="w-full max-w-md mx-auto p-0 border-none bg-transparent">
          <div className="relative p-6 bg-gradient-to-br from-gray-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-2xl rounded-3xl border border-white/10">
            {/* Titre moderne */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Détails de la carte</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            {selectedCard && (
              <div className="space-y-8">
                {/* Carte bancaire moderne avec animation de bordure VISIBLE */}
                <div className="relative mx-auto w-80 h-52 modern-card-container">
                  {/* La carte bancaire moderne */}
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl modern-card-inner">
                    {/* Effets de reflet modernes */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30"></div>
                    <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent"></div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-purple-400/15 to-transparent rounded-full blur-2xl animate-pulse"></div>
                    
                    {/* Contenu de la carte moderne */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-6">
                      {/* En-tête avec logo et type */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                            <img 
                              src="/mb-logo-simple.png"
                              alt="Logo"
                              className="h-8 w-auto"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {selectedCard.isVirtual ? "CARTE VIRTUELLE" : "CARTE PHYSIQUE"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">
                            {(bankInfo as any)?.bankName || "MB MARIE"}
                          </div>
                          <div className="text-xs text-white/70">BANQUE</div>
                        </div>
                      </div>

                      {/* Puce de carte moderne */}
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                          <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded opacity-80"></div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/60">Sans contact</div>
                          <div className="flex space-x-1 mt-1">
                            <div className="w-3 h-3 rounded-full border border-white/40"></div>
                            <div className="w-3 h-3 rounded-full border border-white/40"></div>
                            <div className="w-3 h-3 rounded-full border border-white/40"></div>
                          </div>
                        </div>
                      </div>

                      {/* Numéro de carte avec effet holographique */}
                      <div className="text-center my-4">
                        <div className="text-xl font-mono tracking-[0.3em] font-bold">
                          <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent animate-pulse">
                            {selectedCard.cardNumber}
                          </span>
                        </div>
                      </div>

                      {/* Informations du titulaire */}
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-xs text-white/60 mb-1 font-medium">TITULAIRE</div>
                          <div className="text-sm font-bold text-white tracking-wide">
                            {selectedCard.holderName}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-white/60 mb-1 font-medium">EXPIRE FIN</div>
                          <div className="text-sm font-bold text-white">{selectedCard.expiryDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/60 mb-1 font-medium">CVV</div>
                          <div className="text-sm font-bold text-white">{selectedCard.cvv}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations détaillées modernes */}
                <div className="space-y-4">
                  {/* Informations du titulaire */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Informations du titulaire
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-white/60 mb-1">Nom</div>
                        <div className="text-white font-medium">{selectedCard.holderName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-1">Nom d'utilisateur</div>
                        <div className="text-white font-medium">{user?.username}</div>
                      </div>
                    </div>
                  </div>

                  {/* Codes de sécurité */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      🔒 PIN de la carte
                    </h3>
                    <div className="flex items-center justify-between bg-black/20 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-white font-mono text-lg">
                          {showCardPin ? selectedCard.pin : "••••"}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowCardPin(!showCardPin)}
                          className="text-white hover:bg-white/20"
                        >
                          {showCardPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {showCardPin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedCard.pin)}
                          className="text-white hover:bg-white/20"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-yellow-400 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Ne partagez jamais votre PIN avec personne
                    </div>
                  </div>

                  {/* Statut de la carte */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Statut de la carte
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${selectedCard.isBlocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <div className="text-white">
                          {selectedCard.isBlocked ? "Bloquée" : "Active"}
                        </div>
                      </div>
                      <Button
                        onClick={handleBlockCard}
                        variant="outline"
                        className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {selectedCard.isBlocked ? "Débloquer" : "Faire opposition"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bouton de fermeture moderne */}
                <div className="text-center pt-4">
                  <Button
                    onClick={() => setShowCardDetails(false)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Modal - Style futuriste */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="w-full max-w-md mx-auto bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mb-glow">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Notifications</h3>
                <p className="text-xs text-white/60">Messages de votre conseiller</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {!Array.isArray(notifications) || notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 mb-glow">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-white/70 text-sm">Aucune notification</p>
                <p className="text-white/50 text-xs mt-1">Votre conseiller ne vous a envoyé aucun message</p>
              </div>
            ) : (
              Array.isArray(notifications) && notifications.map((notification: any) => {
                // Fonction pour obtenir l'icône et la couleur selon le type
                const getNotificationStyle = (type: string) => {
                  switch (type) {
                    case 'warning':
                      return {
                        icon: <AlertTriangle className="h-5 w-5 text-orange-400" />,
                        bgColor: 'bg-orange-500/10',
                        borderColor: 'border-orange-500/30',
                        glowColor: 'shadow-orange-500/20',
                        titleColor: 'text-orange-400'
                      };
                    case 'success':
                      return {
                        icon: <CheckCircle className="h-5 w-5 text-green-400" />,
                        bgColor: 'bg-green-500/10',
                        borderColor: 'border-green-500/30',
                        glowColor: 'shadow-green-500/20',
                        titleColor: 'text-green-400'
                      };
                    default: // info
                      return {
                        icon: <Info className="h-5 w-5 text-blue-400" />,
                        bgColor: 'bg-blue-500/10',
                        borderColor: 'border-blue-500/30',
                        glowColor: 'shadow-blue-500/20',
                        titleColor: 'text-blue-400'
                      };
                  }
                };

                const style = getNotificationStyle(notification.type || 'info');

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border-2 mb-transition hover:scale-105 ${style.bgColor} ${style.borderColor} ${style.glowColor} shadow-lg relative overflow-hidden`}
                  >
                    {/* Effet de brillance si non lu */}
                    {!notification.isRead && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      {/* Icône avec glow */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${style.bgColor} border ${style.borderColor} mb-glow flex-shrink-0`}>
                        {style.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* En-tête avec titre et badge de statut */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-bold ${style.titleColor}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            
                            {/* Message principal */}
                            <p className="text-sm text-white/90 leading-relaxed">
                              {notification.message}
                            </p>
                            
                            {/* Montant si présent */}
                            {notification.amount && (
                              <div className="mt-2 flex items-center space-x-1">
                                <Euro className="h-3 w-3 text-yellow-400" />
                                <span className="text-yellow-400 font-bold text-sm">
                                  {parseFloat(notification.amount).toLocaleString('fr-FR', {
                                    minimumFractionDigits: 2,
                                  })} €
                                </span>
                              </div>
                            )}
                            
                            {/* Date avec style futuriste */}
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-xs text-white/50 font-mono">
                                {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              
                              {/* Badge de type */}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                notification.type === 'warning' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                notification.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {notification.type === 'warning' ? '⚠️ ALERTE' :
                                 notification.type === 'success' ? '✅ SUCCÈS' :
                                 '📋 INFO'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Bouton supprimer avec style futuriste */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification.mutate(notification.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 w-8 p-0 ml-2 rounded-full border border-red-500/30 mb-glow"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {Array.isArray(notifications) && notifications.length > 0 && (
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={() => markNotificationsAsRead.mutate()}
                disabled={markNotificationsAsRead.isPending}
                className="flex-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 mb-glow mb-transition"
              >
                {markNotificationsAsRead.isPending ? "Marquage..." : "✓ Marquer comme lues"}
              </Button>
              <Button
                onClick={() => deleteAllNotifications.mutate()}
                disabled={deleteAllNotifications.isPending}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 mb-glow mb-transition"
              >
                {deleteAllNotifications.isPending ? "Suppression..." : "🗑️ Effacer tout"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Account Transactions Modal */}
      <Dialog open={showAccountTransactions} onOpenChange={setShowAccountTransactions}>
        <DialogContent className="w-full max-w-lg mx-auto bg-white border-none">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-gray-800">
                Historique des transactions
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAccountTransactions(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {selectedAccount && (
              <div className="text-sm text-gray-600 mt-2">
                {selectedAccount.name} • {getAccountTypeLabel(selectedAccount.type)}
              </div>
            )}
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedAccount && Array.isArray(transactions) && 
             transactions.filter(t => t.fromAccountId === selectedAccount.id || t.toAccountId === selectedAccount.id).length > 0 ? (
              <div className="divide-y divide-gray-100">
                {transactions
                  .filter(t => t.fromAccountId === selectedAccount.id || t.toAccountId === selectedAccount.id)
                  .map((transaction: any) => (
                    <div key={transaction.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction, selectedAccount.id)}
                        <div>
                          <p className="font-medium text-white">
                            {transaction.fromAccountId === selectedAccount.id ? 
                              `Virement vers ${transaction.recipientName || 'Externe'}` : 
                              `Virement de ${transaction.senderName || 'Externe'}`
                            }
                          </p>
                          <p className="text-sm text-white/60">{transaction.description}</p>
                          <p className="text-sm text-white/70">
                            {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(transaction, selectedAccount.id)}`}>
                          {getTransactionAmount(transaction, selectedAccount.id)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/70">
                <p>Aucune transaction trouvée pour ce compte</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Modal for Card Details */}
      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent className="w-full max-w-sm mx-auto bg-gray-900 border border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-white">
              Vérification PIN
            </DialogTitle>
            <p className="text-center text-sm text-white/80 mt-2">
              Veuillez saisir votre PIN pour accéder aux détails de la carte
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < pinInput.length
                        ? "bg-blue-500 border-blue-500"
                        : "border-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <NumericKeypad
              onKeyPress={(num: string) => {
                if (pinInput.length < 6) {
                  const newPin = pinInput + num;
                  setPinInput(newPin);
                  if (newPin.length === 6) {
                    handlePinVerification.mutate(newPin);
                  }
                }
              }}
              onBackspace={() => {
                setPinInput(pinInput.slice(0, -1));
              }}
              disabled={handlePinVerification.isPending}
            />

            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPinVerification(false);
                  setPinInput("");
                  setSelectedCard(null);
                }}
                disabled={handlePinVerification.isPending}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Details Modal */}
      <Dialog open={showCardDetails} onOpenChange={() => {
        setShowCardDetails(false);
        setIsPinVerified(false);
        setSelectedCard(null);
      }}>
        <DialogContent className="w-full max-w-md mx-auto bg-gray-900 border border-white/20 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">
                Détails de la carte
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCardDetails(false);
                  setIsPinVerified(false);
                  setSelectedCard(null);
                }}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedCard && (
            <div className="space-y-6">
              {/* Card Visual */}
              <div className="bg-gradient-to-br from-[var(--cic-teal)] to-[var(--cic-dark-teal)] rounded-xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedCard.holderName}</h3>
                      <p className="text-white/80 text-sm">
                        {selectedCard.isVirtual ? "Carte virtuelle" : "Carte physique"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-xs">CIC</p>
                      <p className="text-white/80 text-xs">Banque</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-white/80 text-xs mb-1">Numéro de carte</p>
                      <p className="font-mono text-lg tracking-wider">
                        {selectedCard.cardNumber || "•••• •••• •••• ••••"}
                      </p>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-white/80 text-xs mb-1">Expire le</p>
                        <p className="font-mono">{selectedCard.expiryDate || "••/••"}</p>
                      </div>
                      <div>
                        <p className="text-white/80 text-xs mb-1">CVV</p>
                        <p className="font-mono">{selectedCard.cvv || "•••"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="bg-gray-800 rounded-xl p-4 border border-white/20">
                <h4 className="font-semibold text-white mb-3">Informations du titulaire</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Nom</span>
                    <span className="font-medium text-white">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Nom d'utilisateur</span>
                    <span className="font-medium text-white">{user.username}</span>
                  </div>
                </div>
              </div>

              {/* PIN Display */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lock className="h-4 w-4 text-yellow-400" />
                  <h4 className="font-semibold text-yellow-200">PIN de la carte</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono tracking-wider text-white">
                    {selectedCard.pin || "••••"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCard.pin || "");
                      toast({
                        title: "PIN copié",
                        description: "Le PIN a été copié dans le presse-papiers.",
                      });
                    }}
                    className="border-yellow-500/50 text-yellow-200 hover:bg-yellow-500/20"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </Button>
                </div>
                <p className="text-xs text-yellow-300 mt-2">
                  ⚠️ Ne partagez jamais votre PIN avec personne
                </p>
              </div>

              {/* Card Status */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-white/20">
                <span className="text-white/70">Statut de la carte</span>
                <Badge variant={selectedCard.isBlocked ? "destructive" : "default"} className={
                  selectedCard.isBlocked ? "bg-red-900/30 text-red-200 border border-red-500/30" : "bg-green-900/30 text-green-200 border border-green-500/30"
                }>
                  {selectedCard.isBlocked ? "Bloquée" : "Active"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
