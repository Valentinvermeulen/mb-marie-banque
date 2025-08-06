import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentUser, clearStoredUser } from "@/lib/auth";
import type { User, Account, Card, Transaction, Credit } from "../../../shared/schema";
import { Button } from "@/components/ui/button";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, CreditCard, Plus, Settings, LogOut, Search, Filter, 
  Eye, EyeOff, CheckCircle, XCircle, AlertCircle, TrendingUp,
  DollarSign, UserCheck, UserX, Mail, Phone, Calendar,
  BarChart3, PieChart, Activity, Wallet, ArrowUpRight, ArrowDownRight,
  Banknote, Minus, Edit, Trash2, Building2, Clock, Receipt,
  Euro, Percent, CalendarDays, Hash, FileText, MapPin, Save, 
  RefreshCw, X, ChevronRight, ChevronDown, Send, MessageCircle
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AdvisorMessageModal from "@/components/modals/advisor-message-modal";

interface ClientManagementForm {
  userId: string;
  amount: string;
  description: string;
  type: "add" | "remove";
}

interface AccountForm {
  userId: string;
  accountName: string;
  accountType: "courant" | "epargne";
}

interface CreditForm {
  userId: string;
  accountId: string;
  creditName: string;
  totalAmount: string;
  monthlyAmount: string;
  interestRate: string;
  duration: string;
  paymentDay: string;
}

// Credit Management Component
function ClientCreditsManager({ client }: { client: User }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [editForm, setEditForm] = useState({
    totalAmount: "",
    monthlyAmount: "",
    remainingAmount: "",
    nextPaymentDate: "",
    paymentDay: ""
  });

  const { data: clientCredits = [] } = useQuery({
    queryKey: [`/api/credits/${client.id}`],
  });

  const updateCreditMutation = useMutation({
    mutationFn: (data: { creditId: string; updateData: any }) =>
      apiRequest(`/api/credits/${data.creditId}`, {
        method: "PUT",
        body: JSON.stringify(data.updateData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/credits/${client.id}`] });
      setEditingCredit(null);
      toast({
        title: "Crédit modifié",
        description: "Les informations du crédit ont été mises à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le crédit",
        variant: "destructive",
      });
    },
  });

  const deleteCreditMutation = useMutation({
    mutationFn: (creditId: string) =>
      apiRequest(`/api/credits/${creditId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/credits/${client.id}`] });
      toast({
        title: "Crédit supprimé",
        description: "Le crédit a été supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le crédit",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (credit: Credit) => {
    setEditingCredit(credit);
    setEditForm({
      totalAmount: credit.totalAmount,
      monthlyAmount: credit.monthlyAmount,
      remainingAmount: credit.remainingAmount,
      nextPaymentDate: credit.nextPaymentDate ? new Date(credit.nextPaymentDate).toISOString().split('T')[0] : "",
      paymentDay: credit.paymentDay.toString()
    });
  };

  const handleSave = () => {
    if (!editingCredit) return;

    const updateData: any = {};
    if (editForm.totalAmount) updateData.totalAmount = parseFloat(editForm.totalAmount);
    if (editForm.monthlyAmount) updateData.monthlyAmount = parseFloat(editForm.monthlyAmount);
    if (editForm.remainingAmount) updateData.remainingAmount = parseFloat(editForm.remainingAmount);
    if (editForm.nextPaymentDate) {
      const date = new Date(editForm.nextPaymentDate);
      date.setHours(12, 0, 0, 0); // 12h pour éviter les problèmes de fuseau horaire
      updateData.nextPaymentDate = date.toISOString();
    }
    if (editForm.paymentDay) updateData.paymentDay = parseInt(editForm.paymentDay);

    updateCreditMutation.mutate({
      creditId: editingCredit.id,
      updateData
    });
  };

  const handleDelete = (credit: Credit) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le crédit "${credit.creditName}" ?`)) {
      deleteCreditMutation.mutate(credit.id);
    }
  };

  if (clientCredits.length === 0) return null;

  return (
    <div className="border border-white/20 rounded-lg p-4 bg-white/5 backdrop-blur-sm">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <h3 className="font-semibold text-lg text-white">{client.name}</h3>
          <p className="text-sm text-white/70">{clientCredits.length} crédit(s) actif(s)</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-white/30 text-white">{clientCredits.length}</Badge>
          {isExpanded ? <ChevronDown className="h-4 w-4 text-white" /> : <ChevronRight className="h-4 w-4 text-white" />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {clientCredits.map((credit: Credit) => (
            <div key={credit.id} className="border border-white/20 rounded-lg p-4 bg-white/5 backdrop-blur-sm">
              {editingCredit?.id === credit.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-400">{credit.creditName}</h4>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave} disabled={updateCreditMutation.isPending} className="bg-blue-500 hover:bg-blue-600 text-white">
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCredit(null)} className="border-white/30 text-white hover:bg-white/10">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-white/80">Montant total (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.totalAmount}
                        onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                        className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white/80">Mensualité (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.monthlyAmount}
                        onChange={(e) => setEditForm({ ...editForm, monthlyAmount: e.target.value })}
                        className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white/80">Montant restant (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.remainingAmount}
                        onChange={(e) => setEditForm({ ...editForm, remainingAmount: e.target.value })}
                        className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-white/80">Jour de prélèvement</Label>
                      <Select value={editForm.paymentDay} onValueChange={(value) => setEditForm({ ...editForm, paymentDay: value })}>
                        <SelectTrigger className="h-8 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/20">
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-white/10">
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-white/80">Prochaine échéance</Label>
                    <Input
                      type="date"
                      value={editForm.nextPaymentDate}
                      onChange={(e) => setEditForm({ ...editForm, nextPaymentDate: e.target.value })}
                      className="h-8 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-400">{credit.creditName}</h4>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(credit)} className="border-white/30 text-white hover:bg-white/10">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-white/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Supprimer le crédit</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/70">
                              Êtes-vous sûr de vouloir supprimer le crédit "{credit.creditName}" ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(credit)} className="bg-red-500 hover:bg-red-600 text-white">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Montant total</p>
                      <p className="font-semibold text-white">
                        {parseFloat(credit.totalAmount).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })} €
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Mensualité</p>
                      <p className="font-semibold text-white">
                        {parseFloat(credit.monthlyAmount).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })} €
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Restant</p>
                      <p className="font-semibold text-orange-400">
                        {parseFloat(credit.remainingAmount).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })} €
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Mois restants</p>
                      <p className="font-semibold text-white">{credit.remainingMonths} / {credit.duration}</p>
                    </div>
                  </div>

                  {credit.nextPaymentDate && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-white/60">Prochaine échéance</p>
                          <p className="font-medium text-white">
                            {new Date(credit.nextPaymentDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60">Jour de prélèvement</p>
                          <p className="font-medium text-white">Le {credit.paymentDay} de chaque mois</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdvisorDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [showEditRibModal, setShowEditRibModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  // Form states
  const [moneyForm, setMoneyForm] = useState<ClientManagementForm>({
    userId: "",
    amount: "",
    description: "",
    type: "add"
  });
  
  const [accountForm, setAccountForm] = useState<AccountForm>({
    userId: "",
    accountName: "",
    accountType: "courant"
  });
  
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedClientForRib, setSelectedClientForRib] = useState<User | null>(null);
  const [editCardForm, setEditCardForm] = useState({
    holderName: "",
    expiryDate: "",
    pin: "",
    isVirtual: true,
  });
  const [editRibForm, setEditRibForm] = useState({
    bankName: "",
    bankCode: "",
    branchCode: "",
    accountNumber: "",
    ribKey: "",
    bic: "",
  });

  const [creditForm, setCreditForm] = useState<CreditForm>({
    userId: "",
    accountId: "",
    creditName: "",
    totalAmount: "",
    monthlyAmount: "",
    interestRate: "",
    duration: "",
    paymentDay: "1"
  });
  
  const [cardForm, setCardForm] = useState({
    userId: "",
    accountId: "",
    isVirtual: true,
    holderName: ""
  });

  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const { toast } = useToast();
  const user = getCurrentUser();
  
  // Query for advisor settings to get bank info
  const { data: advisorSettings } = useQuery({
    queryKey: ["/api/advisor/bank-info", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!user || user.role !== "advisor") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Queries
  const { data: clients = [], refetch: refetchClients } = useQuery<User[]>({
    queryKey: [`/api/advisor/${user?.id}/clients`],
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const { data: pendingUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-users"],
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/advisor/stats"],
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ["/api/admin/transactions"],
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  // Client accounts query for selected client
  const { data: clientAccounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", selectedClient?.id],
    enabled: !!selectedClient?.id,
    refetchInterval: 5000, // Refresh accounts every 5 seconds
  });

  // Accounts for card form (when client is selected in card form)
  const { data: cardFormAccounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", cardForm.userId],
    enabled: !!cardForm.userId,
    refetchInterval: 5000,
  });

  // Accounts for credit form (when client is selected in credit form)
  const { data: creditFormAccounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", creditForm.userId],
    enabled: !!creditForm.userId,
    refetchInterval: 5000,
  });

  // Client RIB query with enhanced synchronization
  const { data: clientRib, refetch: refetchClientRib } = useQuery({
    queryKey: ["/api/user-rib", selectedClient?.id],
    enabled: !!selectedClient?.id,
    refetchInterval: 3000, // More frequent refresh for real-time sync
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 0, // Don't cache to prevent sync issues
  });

  // Query for blocked cards
  const { data: blockedCardsResponse = [], refetch: refetchBlockedCards } = useQuery({
    queryKey: ["/api/advisor/blocked-cards"],
    enabled: !!user?.id,
    refetchInterval: 3000,
  });

  // Ensure blockedCards is always an array
  const blockedCards = Array.isArray(blockedCardsResponse) ? blockedCardsResponse : [];

  // Client cards query
  const { data: clientCards = [] } = useQuery<Card[]>({
    queryKey: ["/api/cards", clientAccounts[0]?.id],
    enabled: !!clientAccounts[0]?.id,
    refetchInterval: 5000, // Refresh cards every 5 seconds
  });

  // Client credits query  
  const { data: clientCredits = [] } = useQuery<Credit[]>({
    queryKey: ["/api/credits", selectedClient?.id],
    enabled: !!selectedClient?.id,
  });

  // Mutations
  const addMoneyMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; description: string }) => {
      return apiRequest("POST", "/api/advisor/add-money", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Argent ajouté avec succès" });
      setShowMoneyModal(false);
      setMoneyForm({ userId: "", amount: "", description: "", type: "add" });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de l'ajout d'argent", variant: "destructive" });
    }
  });

  const removeMoneyMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; description: string }) => {
      return apiRequest("POST", "/api/advisor/remove-money", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Argent retiré avec succès" });
      setShowMoneyModal(false);
      setMoneyForm({ userId: "", amount: "", description: "", type: "add" });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors du retrait d'argent", variant: "destructive" });
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: { userId: string; name: string; type: string }) => {
      return apiRequest("POST", "/api/advisor/create-account", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Compte créé avec succès (RIB généré automatiquement)" });
      setShowAccountModal(false);
      setAccountForm({ userId: "", accountName: "", accountType: "courant" });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de la création du compte", variant: "destructive" });
    }
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: { userId: string; accountId: string; isVirtual: boolean; holderName: string }) => {
      return apiRequest("POST", "/api/advisor/create-card", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Carte bancaire créée avec succès" });
      setShowCardModal(false);
      setCardForm({ userId: "", accountId: "", isVirtual: true, holderName: "" });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de la création de la carte", variant: "destructive" });
    }
  });

  const createCreditMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/advisor/create-credit", data);
    },
    onSuccess: () => {
      toast({ title: "✅ Crédit bancaire créé avec succès" });
      setShowCreditModal(false);
      setCreditForm({
        userId: "",
        accountId: "",
        creditName: "",
        totalAmount: "",
        monthlyAmount: "",
        interestRate: "",
        duration: "",
        paymentDay: "1"
      });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de la création du crédit", variant: "destructive" });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return apiRequest("DELETE", `/api/account/${accountId}`);
    },
    onSuccess: () => {
      toast({ title: "✅ Compte supprimé avec succès" });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erreur lors de la suppression", 
        description: error?.message || "Impossible de supprimer le compte",
        variant: "destructive" 
      });
    }
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/approve-user/${userId}`, {
        advisorId: user?.id // Include advisor ID to assign client
      });
    },
    onSuccess: () => {
      toast({ title: "✅ Client approuvé et assigné avec succès" });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de l'approbation", variant: "destructive" });
    }
  });

  // Mutations for editing cards and RIB
  const editCardMutation = useMutation({
    mutationFn: async (data: { cardId: string; holderName: string; expiryDate: string; pin: string; isVirtual: boolean }) => {
      const { cardId, ...updateData } = data;
      return apiRequest("PUT", `/api/cards/${cardId}`, updateData);
    },
    onSuccess: () => {
      toast({ title: "✅ Carte modifiée avec succès" });
      setShowEditCardModal(false);
      setSelectedCard(null);
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de la modification de la carte", variant: "destructive" });
    }
  });

  const editRibMutation = useMutation({
    mutationFn: async (data: { userId: string; bankName: string; bankCode: string; branchCode: string; accountNumber: string; ribKey: string; bic: string }) => {
      const { userId, ...updateData } = data;
      return apiRequest("PUT", `/api/user-rib/${userId}`, updateData);
    },
    onSuccess: (data, variables) => {
      toast({ title: "✅ RIB modifié avec succès - Synchronisation en cours..." });
      setShowEditRibModal(false);
      setSelectedClientForRib(null);
      // Reset form
      setEditRibForm({
        bankName: "",
        bankCode: "",
        branchCode: "",
        accountNumber: "",
        ribKey: "",
        bic: "",
      });
      
      // Force immediate synchronization across all interfaces
      queryClient.invalidateQueries({ queryKey: ["/api/user-rib", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-rib"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advisor"] });
      
      // Force refetch with a slight delay to ensure backend sync
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/user-rib", variables.userId] });
        if (refetchClientRib) {
          refetchClientRib();
        }
        toast({ title: "🔄 Données RIB synchronisées" });
      }, 1000);
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de la modification du RIB", variant: "destructive" });
    }
  });

  // Card management mutations
  const unblockCardMutation = useMutation({
    mutationFn: (cardId: string) => apiRequest("PUT", `/api/cards/${cardId}/unblock`, {}),
    onSuccess: () => {
      toast({ title: "✅ Carte débloquée avec succès" });
      refetchBlockedCards();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors du déblocage", variant: "destructive" });
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) => apiRequest("DELETE", `/api/cards/${cardId}`, {}),
    onSuccess: () => {
      toast({ title: "✅ Carte supprimée avec succès" });
      refetchBlockedCards();
    },
    onError: () => {
      toast({ title: "❌ Erreur lors de la suppression", variant: "destructive" });
    }
  });

  const handleLogout = () => {
    clearStoredUser();
    setLocation("/");
  };

  // Edit card function
  const handleEditCard = (card: Card) => {
    setSelectedCard(card);
    setEditCardForm({
      holderName: card.holderName,
      expiryDate: card.expiryDate,
      pin: card.pin,
      isVirtual: card.isVirtual,
    });
    setShowEditCardModal(true);
  };

  // Edit RIB function
  const handleEditRib = async (client: User) => {
    setSelectedClientForRib(client);
    
    // Fetch current RIB data
    try {
      const ribData = await apiRequest("GET", `/api/user-rib/${client.id}`);
      if (ribData) {
        setEditRibForm({
          bankName: ribData.bankName || "",
          bankCode: ribData.bankCode || "",
          branchCode: ribData.branchCode || "",
          accountNumber: ribData.accountNumber || "",
          ribKey: ribData.ribKey || "",
          bic: ribData.bic || "",
        });
      } else {
        // Default values for new RIB
        setEditRibForm({
          bankName: "CIC - Crédit Industriel et Commercial",
          bankCode: "30066",
          branchCode: "10126",
          accountNumber: "",
          ribKey: "76",
          bic: "CMCIFR2A",
        });
      }
    } catch (error) {
      // Default values on error
      setEditRibForm({
        bankName: "CIC - Crédit Industriel et Commercial",
        bankCode: "30066",
        branchCode: "10126",
        accountNumber: "",
        ribKey: "76",
        bic: "CMCIFR2A",
      });
    }
    
    setShowEditRibModal(true);
  };

  const handleSaveCard = () => {
    if (!selectedCard) return;
    
    editCardMutation.mutate({
      cardId: selectedCard.id,
      ...editCardForm,
    });
  };

  const handleSaveRib = () => {
    if (!selectedClientForRib) return;
    
    editRibMutation.mutate({
      userId: selectedClientForRib.id,
      ...editRibForm,
    });
  };

  const handleAddMoney = () => {
    if (!moneyForm.userId || !moneyForm.amount || !moneyForm.description) {
      toast({ title: "⚠️ Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    const amount = parseFloat(moneyForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "⚠️ Montant invalide", variant: "destructive" });
      return;
    }

    if (moneyForm.type === "add") {
      addMoneyMutation.mutate({
        userId: moneyForm.userId,
        amount,
        description: moneyForm.description
      });
    } else {
      removeMoneyMutation.mutate({
        userId: moneyForm.userId,
        amount,
        description: moneyForm.description
      });
    }
  };

  const handleCreateAccount = () => {
    if (!accountForm.userId || !accountForm.accountName) {
      toast({ title: "⚠️ Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    // Vérifier la limite de comptes courants (max 2)
    if (accountForm.accountType === "courant") {
      const clientAccounts = accounts.filter(acc => acc.userId === accountForm.userId);
      const currentAccountsCount = clientAccounts.filter(acc => acc.type === "courant").length;
      
      if (currentAccountsCount >= 2) {
        toast({ 
          title: "⚠️ Limite atteinte", 
          description: "Un client ne peut avoir que 2 comptes courants maximum.",
          variant: "destructive" 
        });
        return;
      }
    }

    createAccountMutation.mutate({
      userId: accountForm.userId,
      name: accountForm.accountName,
      type: accountForm.accountType
    });
  };

  const handleCreateCard = () => {
    if (!cardForm.userId || !cardForm.accountId || !cardForm.holderName) {
      toast({ title: "⚠️ Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    createCardMutation.mutate(cardForm);
  };

  const handleDeleteAccount = (accountId: string, balance: string) => {
    const accountBalance = parseFloat(balance);
    
    if (accountBalance !== 0) {
      toast({
        title: "Suppression impossible",
        description: "Le solde du compte doit être à zéro pour le supprimer.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  const handleCreateCredit = () => {
    if (!creditForm.userId || !creditForm.accountId || !creditForm.creditName || 
        !creditForm.totalAmount || !creditForm.monthlyAmount || !creditForm.interestRate || 
        !creditForm.duration) {
      toast({ title: "⚠️ Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    const totalAmount = parseFloat(creditForm.totalAmount);
    const monthlyAmount = parseFloat(creditForm.monthlyAmount);
    const interestRate = parseFloat(creditForm.interestRate);
    const duration = parseInt(creditForm.duration);
    const paymentDay = parseInt(creditForm.paymentDay);

    if (isNaN(totalAmount) || isNaN(monthlyAmount) || isNaN(interestRate) || 
        isNaN(duration) || isNaN(paymentDay)) {
      toast({ title: "⚠️ Valeurs numériques invalides", variant: "destructive" });
      return;
    }

    createCreditMutation.mutate({
      userId: creditForm.userId,
      accountId: creditForm.accountId,
      creditName: creditForm.creditName,
      totalAmount,
      monthlyAmount,
      remainingAmount: totalAmount,
      interestRate,
      duration,
      remainingMonths: duration,
      paymentDay,
      nextPaymentDate: (() => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        // Obtenir le dernier jour du mois suivant
        const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        // Utiliser le jour demandé ou le dernier jour du mois si le jour n'existe pas
        const actualPaymentDay = Math.min(paymentDay, lastDayOfNextMonth);
        // Créer la date à 12h pour éviter les problèmes de fuseau horaire
        return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), actualPaymentDay, 12, 0, 0);
      })(),
      createdBy: user?.id
    });
  };

  // Combine clients and pending users for complete list
  const allClients = [...clients, ...pendingUsers.filter(pending => 
    !clients.find(client => client.id === pending.id)
  )];
  
  const filteredClients = allClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "approved") return matchesSearch && client.isApproved;
    if (filterStatus === "pending") return matchesSearch && !client.isApproved;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden flex">
      {/* Animated Background - Same as client space */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/50 via-blue-800/50 to-indigo-800/50 animate-gradient-shift"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,hsl(280,70%,40%),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(240,80%,50%),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,hsl(260,90%,35%),transparent_50%)]"></div>
      </div>

      {/* Sidebar Navigation - Style client avec glassmorphism */}
      <div className="relative z-10 w-80 mb-glass-card border-r border-white/10 h-screen">
        <div className="p-6 h-full flex flex-col">
          {/* Logo et infos conseiller */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="mb-logo">
              <img 
                src="/mb-logo-simple.png"
                alt="MB MARIE BANQUE"
                className="h-16 w-auto"
              />
            </div>
          </div>

          {/* Info conseiller */}
          <div className="mb-8">
            <p className="text-sm text-white/70 mb-1">Bonjour,</p>
            <p className="text-xl font-semibold text-white">{advisorSettings?.advisorName || user?.name}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-transition ${
                activeTab === "overview" 
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Accueil</span>
            </button>

            <button
              onClick={() => setActiveTab("clients")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-transition ${
                activeTab === "clients" 
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Mes Clients</span>
            </button>

            <button
              onClick={() => setActiveTab("blocked-cards")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-transition ${
                activeTab === "blocked-cards" 
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
              <span>Cartes Bloquées</span>
            </button>

            <button
              onClick={() => setActiveTab("operations")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-transition ${
                activeTab === "operations" 
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Virements</span>
            </button>

            <button
              onClick={() => setActiveTab("credits")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-transition ${
                activeTab === "credits" 
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Receipt className="h-5 w-5" />
              <span>Crédits</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-transition ${
                activeTab === "settings" 
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Mon Compte</span>
            </button>
          </nav>

          {/* Notifications et déconnexion */}
          <div className="space-y-2 mt-8">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white mb-transition">
              <AlertCircle className="h-5 w-5" />
              <span>Notifications</span>
            </button>
            
            <Button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 mb-btn bg-red-600 hover:bg-red-700 text-white font-bold border-none"
            >
              <LogOut className="h-4 w-4" />
              <span>Se déconnecter</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 p-8 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {activeTab === "overview" ? (
            // Interface d'accueil moderne style client
            <div className="space-y-8">
              {/* Message de bienvenue */}
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Bonjour,
                </h1>
                <h1 className="text-4xl font-bold text-white">
                  {advisorSettings?.advisorName || user?.name}
                </h1>
              </div>

              {/* Statistiques principales - Style espace client */}
              <div className="mb-glass-card rounded-2xl p-6 mb-transition hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/90 text-sm font-medium">Portefeuille Client</span>
                  <span className="text-white/70 text-xs font-mono">
                    •••• •••• ••{user?.id ? user.id.slice(-4) : "7864"}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">
                    {stats?.totalClients || 0}
                  </span>
                  <span className="text-xl ml-2 text-white/80">clients</span>
                </div>
                <div className="mt-3 text-xs text-white/60">
                  Clients approuvés actifs
                </div>
              </div>

              {/* Actions rapides - Style espace client avec bordure rotative */}
              <div className="rotating-border mb-glass-card rounded-2xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">⚡</span>
                  ACTIONS RAPIDES
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAccountModal(true)}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <Wallet className="text-blue-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Nouveau Compte</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCardModal(true)}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-xl hover:from-green-500/30 hover:to-teal-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <CreditCard className="text-green-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Nouvelle Carte</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreditModal(true)}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <Receipt className="text-purple-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Nouveau Crédit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowMessageModal(true)}
                    className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl hover:from-orange-500/30 hover:to-red-500/30 mb-transition border border-white/10 mb-glow"
                  >
                    <MessageCircle className="text-orange-400 text-2xl mb-2" />
                    <span className="text-xs text-white font-medium">Message Client</span>
                  </Button>
                </div>
              </div>

              {/* Informations conseiller - Style espace client */}
              <div className="mb-glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  👤 MON PROFIL CONSEILLER
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full flex items-center justify-center mb-glow">
                    <span className="text-white font-bold text-lg">
                      {(advisorSettings?.advisorName || user?.name)?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg">{advisorSettings?.advisorName || user?.name}</h4>
                    <p className="text-sm text-white/70">Conseiller clientèle - {advisorSettings?.bankName || 'MB MARIE BANQUE'}</p>
                    <p className="text-xs text-white/60">{advisorSettings?.email || user?.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("settings")}
                    className="mb-btn bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                  >
                    ⚙️ Paramètres
                  </Button>
                </div>
              </div>

              {/* Activité récente - Style espace client */}
              <div className="mb-glass-card rounded-2xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    📈 ACTIVITÉ RÉCENTE
                  </h3>
                </div>
                <div className="divide-y divide-white/10">
                  <div className="p-4 flex items-center justify-between hover:bg-white/5 mb-transition">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-green-500/20 text-green-400">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-white">Clients approuvés</p>
                        <p className="text-sm text-white/60">Aujourd'hui</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-400">
                        {stats?.approvedClients || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 flex items-center justify-between hover:bg-white/5 mb-transition">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold bg-orange-500/20 text-orange-400">
                        ⏳
                      </div>
                      <div>
                        <p className="font-bold text-white">En attente d'approbation</p>
                        <p className="text-sm text-white/60">À traiter</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-orange-400">
                        {pendingUsers?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Interface onglets avec style client
            <div>
              <div className="mb-glass-card rounded-2xl p-4 mb-8">
                <div className="grid grid-cols-6 gap-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg mb-transition ${
                      activeTab === "overview" 
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Vue d'ensemble</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("clients")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg mb-transition ${
                      activeTab === "clients" 
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Gestion Clients</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("blocked-cards")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg mb-transition ${
                      activeTab === "blocked-cards" 
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Cartes Bloquées</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("operations")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg mb-transition ${
                      activeTab === "operations" 
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">Opérations</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("credits")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg mb-transition ${
                      activeTab === "credits" 
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">Crédits</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg mb-transition ${
                      activeTab === "settings" 
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white mb-glow" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Paramètres</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="mb-glass-card rounded-2xl p-6 mb-transition hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Clients Total</p>
                    <p className="text-3xl font-bold text-white">{stats?.totalClients || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="mb-glass-card rounded-2xl p-6 mb-transition hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Clients Approuvés</p>
                    <p className="text-3xl font-bold text-white">{stats?.approvedClients || 0}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-400" />
                </div>
              </div>

              <div className="mb-glass-card rounded-2xl p-6 mb-transition hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">En Attente</p>
                    <p className="text-3xl font-bold text-white">{pendingUsers.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-400" />
                </div>
              </div>

              <div className="mb-glass-card rounded-2xl p-6 mb-transition hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium">Comptes Totaux</p>
                    <p className="text-3xl font-bold text-white">{stats?.totalAccounts || 0}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            {/* Info message for pending clients */}
            {filteredClients.some(client => !client.isApproved) && (
              <div className="mb-glass-card rounded-2xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-white text-sm">
                    <strong>Clients en attente d'approbation :</strong> Cliquez sur "Approuver" pour permettre aux nouveaux clients de se connecter à leur compte.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 mb-glass-card border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 mb-glass-card border-white/20 text-white">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent className="mb-glass-card border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">Tous les clients</SelectItem>
                  <SelectItem value="approved" className="text-white hover:bg-white/10">Approuvés</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-white/10">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <div key={client.id} className="mb-glass-card rounded-2xl p-6 mb-transition hover:scale-105 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {client.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{client.name}</h3>
                        <p className="text-sm text-white/70">{client.email}</p>
                        <Badge 
                          variant={client.isApproved ? "default" : "secondary"}
                          className={client.isApproved ? "bg-green-500/20 text-green-400 border-green-400/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-400/30"}
                        >
                          {client.isApproved ? "Approuvé" : "En attente"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      {!client.isApproved ? (
                        <Button
                          size="sm"
                          onClick={() => approveUserMutation.mutate(client.id)}
                          disabled={approveUserMutation.isPending}
                          className="flex-1 mb-btn bg-green-600 hover:bg-green-700 text-white font-bold border-none"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {approveUserMutation.isPending ? "Approbation..." : "Approuver"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowClientDetailsModal(true);
                          }}
                          className="flex-1 mb-btn bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                      )}
                    </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="mb-glass-card rounded-2xl p-6 text-center cursor-pointer mb-transition hover:scale-105" onClick={() => setShowMoneyModal(true)}>
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Euro className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Gérer l'Argent</h3>
                <p className="text-sm text-white/70">Ajouter ou retirer de l'argent des comptes clients</p>
              </div>

              <div className="mb-glass-card rounded-2xl p-6 text-center cursor-pointer mb-transition hover:scale-105" onClick={() => setShowAccountModal(true)}>
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Créer un Compte</h3>
                <p className="text-sm text-white/70">Comptes courants, Livret A (RIB auto-généré)</p>
              </div>

              <div className="mb-glass-card rounded-2xl p-6 text-center cursor-pointer mb-transition hover:scale-105" onClick={() => setShowCardModal(true)}>
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Créer une Carte</h3>
                <p className="text-sm text-white/70">Cartes virtuelles et physiques</p>
              </div>

              <div className="mb-glass-card rounded-2xl p-6 text-center cursor-pointer mb-transition hover:scale-105" onClick={() => setShowCreditModal(true)}>
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Créer un Crédit</h3>
                <p className="text-sm text-white/70">Prêts avec prélèvement automatique</p>
              </div>
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-6">
            <div className="mb-glass-card rounded-2xl p-6">
              <h2 className="flex items-center text-white text-xl font-bold mb-4">
                <Receipt className="h-5 w-5 mr-2 text-blue-400" />
                Gestion des Crédits Bancaires
              </h2>
              <p className="text-white/70 mb-4">
                Gérez tous les crédits de vos clients : modifier les échéances, ajuster les montants, supprimer des prêts.
              </p>
              <Button onClick={() => setShowCreditModal(true)} className="mb-btn bg-blue-600 hover:bg-blue-700 text-white font-bold border-none">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Crédit
              </Button>
            </div>

            {/* Credits Management Table */}
            <div className="mb-glass-card rounded-2xl p-6">
              <h3 className="text-white text-lg font-bold mb-4">Crédits Actifs</h3>
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">Aucun client avec des crédits actifs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clients.map((client) => (
                    <ClientCreditsManager key={client.id} client={client} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Blocked Cards Tab */}
          <TabsContent value="blocked-cards" className="space-y-6">
            <div className="mb-glass-card rounded-2xl p-6">
              <h2 className="flex items-center text-xl text-white font-bold mb-4">
                <AlertCircle className="h-6 w-6 mr-2 text-red-400" />
                Cartes Bloquées ({blockedCards.length})
              </h2>
              <p className="text-white/70 mb-6">Gérez les cartes bloquées par les clients avec opposition</p>
                  {blockedCards.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto text-white/40 mb-4" />
                      <p className="text-white text-lg">Aucune carte bloquée</p>
                      <p className="text-white/60 text-sm">Les cartes bloquées par les clients apparaîtront ici</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blockedCards.map((card: any) => (
                        <div key={card.id} className="mb-glass-card rounded-xl p-4 border border-red-400/30">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <CreditCard className="h-5 w-5 text-red-400" />
                                <h3 className="font-semibold text-lg text-white">{card.holderName}</h3>
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-400/30">BLOQUÉE</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-white/60">Client:</span>
                                  <p className="font-medium text-white">{card.userName}</p>
                                </div>
                                <div>
                                  <span className="text-white/60">Numéro:</span>
                                  <p className="font-mono text-white">**** **** **** {card.cardNumber.slice(-4)}</p>
                                </div>
                                <div>
                                  <span className="text-white/60">Expiration:</span>
                                  <p className="text-white">{card.expiryDate}</p>
                                </div>
                                <div>
                                  <span className="text-white/60">Type:</span>
                                  <p className="text-white">{card.isVirtual ? "Virtuelle" : "Physique"}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <Button
                                size="sm"
                                className="mb-btn bg-green-600 hover:bg-green-700 text-white font-bold border-none"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir débloquer cette carte ?")) {
                                    unblockCardMutation.mutate(card.id);
                                  }
                                }}
                                disabled={unblockCardMutation.isPending}
                              >
                                {unblockCardMutation.isPending ? "..." : "Débloquer"}
                              </Button>
                              <Button
                                size="sm"
                                className="mb-btn bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                                onClick={() => {
                                  // Create new card for the same account
                                  setCardForm({
                                    userId: card.userId,
                                    accountId: card.accountId,
                                    holderName: card.holderName,
                                    isVirtual: card.isVirtual
                                  });
                                  setShowCardModal(true);
                                }}
                              >
                                Créer Nouvelle
                              </Button>
                              <Button
                                size="sm"
                                className="mb-btn bg-red-600 hover:bg-red-700 text-white font-bold border-none"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer définitivement cette carte ? Cette action est irréversible.")) {
                                    deleteCardMutation.mutate(card.id);
                                  }
                                }}
                                disabled={deleteCardMutation.isPending}
                              >
                                {deleteCardMutation.isPending ? "..." : "Supprimer"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Advisor Information */}
              <div className="mb-glass-card rounded-2xl p-6">
                <h3 className="flex items-center text-lg text-white font-bold mb-4">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-400" />
                  Informations Conseiller
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-white/60">Nom du conseiller</label>
                    <p className="text-sm font-semibold text-white">{advisorSettings?.advisorName || user?.name || 'Non défini'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Email</label>
                    <p className="text-sm text-white">{advisorSettings?.advisorEmail || 'Non défini'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Téléphone</label>
                    <p className="text-sm text-white">{advisorSettings?.phone || 'Non défini'}</p>
                  </div>
                </div>
              </div>

              {/* Agency Information */}
              <div className="mb-glass-card rounded-2xl p-6">
                <h3 className="flex items-center text-lg text-white font-bold mb-4">
                  <Building2 className="h-5 w-5 mr-2 text-blue-400" />
                  Informations Agence
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-white/60">Nom de la banque</label>
                    <p className="text-sm font-semibold text-white">{advisorSettings?.bankName || 'MB MARIE BANQUE'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Email agence</label>
                    <p className="text-sm text-white">{advisorSettings?.agencyEmail || 'Non défini'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/60">Adresse</label>
                    <p className="text-sm whitespace-pre-line text-white">{advisorSettings?.address || 'Non définie'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2 mb-glass-card rounded-2xl p-6">
                <h3 className="flex items-center text-lg text-white font-bold mb-4">
                  <Trash2 className="h-5 w-5 mr-2 text-red-400" />
                  Actions de Suppression
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="flex items-center space-x-2 mb-btn bg-red-600 hover:bg-red-700 text-white font-bold border-none"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer toutes les cartes bancaires ? Cette action est irréversible.")) {
                          toast({ title: "Fonctionnalité en développement", description: "Suppression massive des cartes bientôt disponible" });
                        }
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Supprimer toutes les cartes</span>
                    </Button>
                    
                    <Button 
                      className="flex items-center space-x-2 mb-btn bg-red-600 hover:bg-red-700 text-white font-bold border-none"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer tous les comptes avec solde zéro ? Cette action est irréversible.")) {
                          toast({ title: "Fonctionnalité en développement", description: "Suppression massive des comptes bientôt disponible" });
                        }
                      }}
                    >
                      <Activity className="h-4 w-4" />
                      <span>Supprimer comptes vides</span>
                    </Button>
                    
                    <Button 
                      className="flex items-center space-x-2 mb-btn bg-red-600 hover:bg-red-700 text-white font-bold border-none"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer tous les RIB ? Cette action est irréversible.")) {
                          toast({ title: "Fonctionnalité en développement", description: "Suppression massive des RIB bientôt disponible" });
                        }
                      }}
                    >
                      <Receipt className="h-4 w-4" />
                      <span>Supprimer tous les RIB</span>
                    </Button>
                  </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Money Management Modal */}
      <Dialog open={showMoneyModal} onOpenChange={setShowMoneyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Euro className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
              Gestion des Fonds
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={moneyForm.type === "add" ? "default" : "outline"}
                onClick={() => setMoneyForm({ ...moneyForm, type: "add" })}
                className="flex items-center justify-center"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button
                variant={moneyForm.type === "remove" ? "default" : "outline"}
                onClick={() => setMoneyForm({ ...moneyForm, type: "remove" })}
                className="flex items-center justify-center"
              >
                <ArrowDownRight className="h-4 w-4 mr-2" />
                Retirer
              </Button>
            </div>

            <div>
              <Label>Client</Label>
              <Select value={moneyForm.userId} onValueChange={(value) => setMoneyForm({ ...moneyForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.isApproved).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Montant (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={moneyForm.amount}
                onChange={(e) => setMoneyForm({ ...moneyForm, amount: e.target.value })}
              />
            </div>

            <div>
              <Label>Description de la transaction</Label>
              <Input
                placeholder={moneyForm.type === "add" ? "Ex: Virement de 100€ - Cadeau famille" : "Ex: Paiement carte Auchan - 45.67€"}
                value={moneyForm.description}
                onChange={(e) => setMoneyForm({ ...moneyForm, description: e.target.value })}
              />
            </div>

            <Button 
              onClick={handleAddMoney} 
              className="w-full bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)]"
              disabled={addMoneyMutation.isPending || removeMoneyMutation.isPending}
            >
              {addMoneyMutation.isPending || removeMoneyMutation.isPending ? "Traitement..." : `${moneyForm.type === "add" ? "Ajouter" : "Retirer"} ${moneyForm.amount}€`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Creation Modal */}
      <Dialog open={showAccountModal} onOpenChange={setShowAccountModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
              Créer un Nouveau Compte
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={accountForm.userId} onValueChange={(value) => setAccountForm({ ...accountForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.isApproved).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type de compte</Label>
              <Select value={accountForm.accountType} onValueChange={(value: "courant" | "epargne") => setAccountForm({ ...accountForm, accountType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courant">Compte Courant (max 2/client)</SelectItem>
                  <SelectItem value="epargne">Livret A (pas de RIB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nom du compte</Label>
              <Input
                placeholder="Ex: Compte Principal, Épargne Vacances..."
                value={accountForm.accountName}
                onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
              />
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>⚠️ Règles importantes :</strong><br/>
                • Maximum 2 comptes courants par client<br/>
                • Pas de RIB automatique - vous devez le créer séparément<br/>
                • 1 seul RIB par client (pour tous ses comptes)<br/>
                • Aucun RIB pour les livrets A
              </p>
            </div>

            <Button 
              onClick={handleCreateAccount} 
              className="w-full bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)]"
              disabled={createAccountMutation.isPending}
            >
              {createAccountMutation.isPending ? "Création..." : "Créer le Compte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Creation Modal */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
              Créer une Carte Bancaire
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Client</Label>
              <Select value={cardForm.userId} onValueChange={(value) => setCardForm({ ...cardForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.isApproved).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Compte associé</Label>
              <Select value={cardForm.accountId} onValueChange={(value) => setCardForm({ ...cardForm, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {cardFormAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nom du porteur</Label>
              <Input
                placeholder="Nom et prénom du porteur"
                value={cardForm.holderName}
                onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
              />
            </div>

            <div>
              <Label>Type de carte</Label>
              <Select value={cardForm.isVirtual ? "virtual" : "physical"} onValueChange={(value) => setCardForm({ ...cardForm, isVirtual: value === "virtual" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Carte Virtuelle</SelectItem>
                  <SelectItem value="physical">Carte Physique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCreateCard} 
              className="w-full bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)]"
              disabled={createCardMutation.isPending}
            >
              {createCardMutation.isPending ? "Création..." : "Créer la Carte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Creation Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
              Créer un Crédit Bancaire
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <Select value={creditForm.userId} onValueChange={(value) => setCreditForm({ ...creditForm, userId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => c.isApproved).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Compte de prélèvement</Label>
                <Select value={creditForm.accountId} onValueChange={(value) => setCreditForm({ ...creditForm, accountId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditFormAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Nom du crédit</Label>
              <Input
                placeholder="Ex: Crédit Auto, Prêt Personnel, Crédit Immobilier..."
                value={creditForm.creditName}
                onChange={(e) => setCreditForm({ ...creditForm, creditName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant total (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="15000.00"
                  value={creditForm.totalAmount}
                  onChange={(e) => setCreditForm({ ...creditForm, totalAmount: e.target.value })}
                />
              </div>

              <div>
                <Label>Mensualité (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="250.00"
                  value={creditForm.monthlyAmount}
                  onChange={(e) => setCreditForm({ ...creditForm, monthlyAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taux d'intérêt (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="3.5"
                  value={creditForm.interestRate}
                  onChange={(e) => setCreditForm({ ...creditForm, interestRate: e.target.value })}
                />
              </div>

              <div>
                <Label>Durée (mois)</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={creditForm.duration}
                  onChange={(e) => setCreditForm({ ...creditForm, duration: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Jour de prélèvement du mois</Label>
              <Select value={creditForm.paymentDay} onValueChange={(value) => setCreditForm({ ...creditForm, paymentDay: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>⚠️ Prélèvement automatique:</strong> Le montant sera automatiquement débité chaque mois du compte sélectionné à la date choisie.
              </p>
            </div>

            <Button 
              onClick={handleCreateCredit} 
              className="w-full bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)]"
              disabled={createCreditMutation.isPending}
            >
              {createCreditMutation.isPending ? "Création..." : "Créer le Crédit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Details Modal */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <Eye className="h-5 w-5 mr-2 text-blue-400" />
              Détails du client
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-white/60">Nom complet</Label>
                  <p className="text-sm font-semibold text-white">{selectedClient.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-white/60">Email</Label>
                  <p className="text-sm text-white">{selectedClient.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-white/60">Statut</Label>
                  <Badge variant={selectedClient.isApproved ? "default" : "secondary"} className={selectedClient.isApproved ? "bg-green-500/20 text-green-400 border-green-400/30" : "bg-orange-500/20 text-orange-400 border-orange-400/30"}>
                    {selectedClient.isApproved ? "Approuvé" : "En attente"}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-white">Comptes bancaires</h4>
                <div className="space-y-2">
                  {clientAccounts.map((account) => (
                    <div key={account.id} className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="text-sm text-white/60">{account.type.toUpperCase()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <p className="font-semibold text-lg text-white">
                          {parseFloat(account.balance).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                          })} €
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAccount(account.id, account.balance)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 border-red-400/30"
                          disabled={parseFloat(account.balance) !== 0}
                          title={parseFloat(account.balance) !== 0 ? "Le solde doit être à zéro pour supprimer le compte" : "Supprimer le compte"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-white">Cartes bancaires</h4>
                <div className="space-y-2">
                  {clientCards.map((card) => (
                    <div key={card.id} className="flex justify-between items-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-white">{card.holderName}</p>
                        <p className="text-sm text-white/60">
                          {card.cardNumber} • {card.isVirtual ? "Virtuelle" : "Physique"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCard(card)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border-blue-400/30"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-white">RIB/IBAN</h4>
                <div className="p-3 bg-green-500/10 backdrop-blur-sm rounded-lg border border-green-400/20">
                  {clientRib ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-white">Informations bancaires actuelles</p>
                          <div className="mt-2 space-y-1 text-sm text-white/70">
                            <p><strong className="text-white">IBAN:</strong> {(clientRib as any)?.iban || "Non défini"}</p>
                            <p><strong className="text-white">Code Banque:</strong> {(clientRib as any)?.bankCode || "Non défini"}</p>
                            <p><strong className="text-white">Code Guichet:</strong> {(clientRib as any)?.branchCode || "Non défini"}</p>
                            <p><strong className="text-white">N° Compte:</strong> {(clientRib as any)?.accountNumber || "Non défini"}</p>
                            <p><strong className="text-white">Clé RIB:</strong> {(clientRib as any)?.ribKey || "Non défini"}</p>
                            <p><strong className="text-white">BIC/SWIFT:</strong> {(clientRib as any)?.bic || "Non défini"}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRib(selectedClient)}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/20 border-green-400/30"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white">Informations bancaires</p>
                        <p className="text-sm text-white/60">Aucun RIB configuré - Créer le RIB du client</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRib(selectedClient)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20 border-green-400/30"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Créer RIB
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-white">Crédits en cours</h4>
                <div className="space-y-2">
                  {clientCredits.map((credit) => (
                    <div key={credit.id} className="p-3 bg-orange-500/10 backdrop-blur-sm rounded-lg border border-orange-400/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{credit.creditName}</p>
                          <p className="text-sm text-white/60">
                            {credit.monthlyAmount}€/mois - {credit.remainingMonths} mois restants
                          </p>
                        </div>
                        <p className="font-semibold text-orange-400">
                          {parseFloat(credit.remainingAmount).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                          })} € restants
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Card Modal */}
      <Dialog open={showEditCardModal} onOpenChange={setShowEditCardModal}>
        <DialogContent className="max-w-md bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <Edit className="h-5 w-5 mr-2 text-blue-400" />
              Modifier la Carte Bancaire
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCard && (
              <div className="bg-blue-500/10 backdrop-blur-sm p-3 rounded-lg border border-blue-400/20">
                <p className="text-sm text-blue-400">
                  <strong className="text-white">Carte:</strong> {selectedCard.cardNumber}
                </p>
              </div>
            )}

            <div>
              <Label className="text-white/80">Nom du porteur</Label>
              <Input
                placeholder="Ex: Jean Dupont"
                value={editCardForm.holderName}
                onChange={(e) => setEditCardForm({ ...editCardForm, holderName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label className="text-white/80">Date d'expiration (MM/YY)</Label>
              <Input
                placeholder="12/28"
                value={editCardForm.expiryDate}
                onChange={(e) => setEditCardForm({ ...editCardForm, expiryDate: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label className="text-white/80">Code PIN (4 chiffres)</Label>
              <Input
                type="password"
                placeholder="1234"
                value={editCardForm.pin}
                onChange={(e) => setEditCardForm({ ...editCardForm, pin: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label className="text-white/80">Type de carte</Label>
              <Select 
                value={editCardForm.isVirtual.toString()} 
                onValueChange={(value) => setEditCardForm({ ...editCardForm, isVirtual: value === "true" })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="true" className="text-white hover:bg-white/10">Carte Virtuelle</SelectItem>
                  <SelectItem value="false" className="text-white hover:bg-white/10">Carte Physique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowEditCardModal(false)}
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveCard} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={editCardMutation.isPending}
              >
                {editCardMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit RIB Modal */}
      <Dialog open={showEditRibModal} onOpenChange={setShowEditRibModal}>
        <DialogContent className="max-w-md bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center text-white">
              <Building2 className="h-5 w-5 mr-2 text-green-400" />
              Modifier le RIB/IBAN
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedClientForRib && (
              <div className="bg-green-500/10 backdrop-blur-sm p-3 rounded-lg border border-green-400/20">
                <p className="text-sm text-green-400">
                  <strong className="text-white">Client:</strong> {selectedClientForRib.name}
                </p>
              </div>
            )}

            <div>
              <Label className="text-white/80">Nom de la banque</Label>
              <Input
                placeholder="CIC - Crédit Industriel et Commercial"
                value={editRibForm.bankName}
                onChange={(e) => setEditRibForm({ ...editRibForm, bankName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80">Code banque</Label>
                <Input
                  placeholder="30066"
                  value={editRibForm.bankCode}
                  onChange={(e) => setEditRibForm({ ...editRibForm, bankCode: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <Label className="text-white/80">Code guichet</Label>
                <Input
                  placeholder="10126"
                  value={editRibForm.branchCode}
                  onChange={(e) => setEditRibForm({ ...editRibForm, branchCode: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/80">Numéro de compte</Label>
              <Input
                placeholder="00123456789"
                value={editRibForm.accountNumber}
                onChange={(e) => setEditRibForm({ ...editRibForm, accountNumber: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label className="text-white/80">Clé RIB</Label>
              <Input
                placeholder="76"
                value={editRibForm.ribKey}
                onChange={(e) => setEditRibForm({ ...editRibForm, ribKey: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label className="text-white/80">BIC/SWIFT</Label>
              <Input
                placeholder="CMCIFR2A"
                value={editRibForm.bic}
                onChange={(e) => setEditRibForm({ ...editRibForm, bic: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="bg-yellow-500/10 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/20">
              <p className="text-sm text-yellow-400">
                <strong className="text-white">📋 IBAN généré:</strong> FR{editRibForm.ribKey}{editRibForm.bankCode}{editRibForm.branchCode}{editRibForm.accountNumber}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowEditRibModal(false)}
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveRib} 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={editRibMutation.isPending}
              >
                {editRibMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <AdvisorMessageModal
        open={showMessageModal}
        onOpenChange={setShowMessageModal}
        clients={clients.filter(c => c.isApproved)}
      />
    </div>
  );
}