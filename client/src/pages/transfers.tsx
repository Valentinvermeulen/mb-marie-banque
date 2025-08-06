import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import { Account, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Send, History, Plus, Users, ArrowRightLeft, Wallet } from "lucide-react";

export default function Transfers() {
  const [, setLocation] = useLocation();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<"internal" | "external" | "scheduled">("internal");
  const { toast } = useToast();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "client") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", user?.id],
    enabled: !!user?.id,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/user-transactions", user?.id],
    enabled: !!user?.id,
  });

  const transferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await apiRequest("POST", "/api/transfers", transferData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Virement effectué",
        description: "Votre virement a été traité avec succès",
      });
      setShowTransferModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-transactions"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le virement",
        variant: "destructive",
      });
    },
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    transferMutation.mutate({
      fromAccountId: formData.get("fromAccount"),
      toAccountId: transferType === "internal" ? formData.get("toAccount") : null,
      recipientIban: transferType === "external" ? formData.get("recipientIban") : null,
      recipientName: transferType === "external" ? formData.get("recipientName") : null,
      amount: formData.get("amount"),
      description: formData.get("description"),
      pin: formData.get("pin"),
      type: transferType === "internal" ? "transfer" : "withdrawal",
    });
  };

  const recentTransactions = Array.isArray(transactions) ? transactions.slice(0, 5) : [];

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-header-gradient px-6 pt-12 pb-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => setLocation("/client")}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold">Virements</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Actions rapides */}
          <div className="grid grid-cols-3 gap-4">
            <Button
              onClick={() => {
                setTransferType("internal");
                setShowTransferModal(true);
              }}
              variant="ghost"
              className="flex flex-col items-center p-4 h-auto mb-glass-card rounded-xl hover:scale-105 mb-transition"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 mb-glow">
                <ArrowRightLeft className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-xs text-white/80 text-center">Virement interne</span>
            </Button>

            <Button
              onClick={() => {
                setTransferType("external");
                setShowTransferModal(true);
              }}
              variant="ghost"
              className="flex flex-col items-center p-4 h-auto mb-glass-card rounded-xl hover:scale-105 mb-transition"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2 mb-glow">
                <Send className="h-6 w-6 text-green-400" />
              </div>
              <span className="text-xs text-white/80 text-center">Virement externe</span>
            </Button>

            <Button
              onClick={() => {
                setTransferType("scheduled");
                setShowTransferModal(true);
              }}
              variant="ghost"
              className="flex flex-col items-center p-4 h-auto mb-glass-card rounded-xl hover:scale-105 mb-transition"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2 mb-glow">
                <Plus className="h-6 w-6 text-purple-400" />
              </div>
              <span className="text-xs text-white/80 text-center">Virement programmé</span>
            </Button>
          </div>

          {/* Mes comptes */}
          <Card className="mb-glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white mb-glow">💰 MES COMPTES</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 mb-transition hover:bg-white/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center mb-glow">
                        <Wallet className="h-5 w-5 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{account.name}</h3>
                        <p className="text-sm text-white/70">•••• {account.id.slice(-4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {parseFloat(account.balance).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Historique récent */}
          <Card className="mb-glass-card border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-white mb-glow">
                <History className="h-5 w-5 mr-2 text-blue-400" />
                📈 TRANSACTIONS RÉCENTES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-white/70 text-center py-4">Aucune transaction récente</p>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 mb-transition hover:bg-white/20"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-glow ${
                        transaction.type === "deposit" ? "bg-green-500/20" : 
                        transaction.type === "withdrawal" ? "bg-red-500/20" : "bg-blue-500/20"
                      }`}>
                        {transaction.type === "deposit" ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-400" />
                        ) : transaction.type === "withdrawal" ? (
                          <ArrowUpRight className="h-5 w-5 text-red-400" />
                        ) : (
                          <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm">
                          {transaction.description}
                        </h4>
                        <p className="text-xs text-white/70">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString("fr-FR") : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${
                          transaction.type === "deposit" ? "text-green-400" : 
                          transaction.type === "withdrawal" ? "text-red-400" : "text-blue-400"
                        }`}>
                          {transaction.type === "deposit" ? "+" : transaction.type === "withdrawal" ? "-" : ""}
                          {parseFloat(transaction.amount).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>
              {transferType === "internal" && "Virement interne"}
              {transferType === "external" && "Virement externe"}
              {transferType === "scheduled" && "Virement programmé"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fromAccount">Compte de débit</Label>
              <Select name="fromAccount" required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {parseFloat(account.balance).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {transferType === "internal" && (
              <div>
                <Label htmlFor="toAccount">Compte de crédit</Label>
                <Select name="toAccount" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {transferType === "external" && (
              <>
                <div>
                  <Label htmlFor="recipientName">Nom du bénéficiaire</Label>
                  <Input name="recipientName" placeholder="Nom du bénéficiaire" required />
                </div>
                <div>
                  <Label htmlFor="recipientIban">IBAN du bénéficiaire</Label>
                  <Input name="recipientIban" placeholder="FR76 1234 5678 9012 3456 7890 12" required />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="amount">Montant (€)</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input name="description" placeholder="Description du virement" required />
            </div>

            <div>
              <Label htmlFor="pin">Code PIN</Label>
              <Input name="pin" type="password" maxLength={6} placeholder="Votre code PIN" required />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="flex-1 bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)] text-white"
              >
                {transferMutation.isPending ? "Traitement..." : "Effectuer le virement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTransferModal(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}