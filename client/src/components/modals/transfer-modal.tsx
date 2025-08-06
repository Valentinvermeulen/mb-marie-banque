import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Account, Beneficiary } from "@shared/schema";
import { X, BookOpen, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PinModal from "./pin-modal";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  userId: string;
}

export default function TransferModal({ open, onOpenChange, accounts, userId }: TransferModalProps) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientIban, setRecipientIban] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [transferType, setTransferType] = useState<"internal" | "external">("internal");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [newBeneficiaryName, setNewBeneficiaryName] = useState("");
  const [newBeneficiaryIban, setNewBeneficiaryIban] = useState("");
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Charger les bénéficiaires enregistrés
  const { data: beneficiaries = [] } = useQuery<Beneficiary[]>({
    queryKey: [`/api/beneficiaries/${userId}`],
    enabled: open && transferType === "external"
  });

  const transferMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await apiRequest("POST", "/api/transfer", transferData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Virement effectué",
        description: "Le virement a été traité avec succès",
      });
      resetForm();
      onOpenChange(false);
      setShowPinModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-transactions/${userId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Le virement a échoué",
        variant: "destructive",
      });
    },
  });

  // Mutation pour ajouter un bénéficiaire
  const addBeneficiaryMutation = useMutation({
    mutationFn: async (beneficiaryData: any) => {
      const response = await apiRequest("POST", "/api/beneficiaries", beneficiaryData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bénéficiaire ajouté",
        description: "Le bénéficiaire a été enregistré avec succès",
      });
      setShowAddBeneficiary(false);
      setNewBeneficiaryName("");
      setNewBeneficiaryIban("");
      queryClient.invalidateQueries({ queryKey: [`/api/beneficiaries/${userId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le bénéficiaire",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDescription("");
    setRecipientIban("");
    setSelectedBeneficiary("");
    setNewBeneficiaryName("");
    setNewBeneficiaryIban("");
    setShowAddBeneficiary(false);
    setTransferType("internal");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleProcessTransfer = () => {
    // Validation selon le type de virement
    if (!fromAccountId || !amount) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le compte et le montant",
        variant: "destructive",
      });
      return;
    }

    if (transferType === "internal" && !toAccountId) {
      toast({
        title: "Champs requis",
        description: "Veuillez sélectionner un compte de destination",
        variant: "destructive",
      });
      return;
    }

    if (transferType === "external" && !recipientIban) {
      toast({
        title: "Champs requis",
        description: "Veuillez saisir l'IBAN pour le virement externe",
        variant: "destructive",
      });
      return;
    }

    setShowPinModal(true);
  };

  const handlePinSuccess = (pin: string) => {
    const transferData = {
      fromAccountId,
      toAccountId: transferType === "internal" ? toAccountId : undefined,
      amount: parseFloat(amount).toFixed(2),
      description: description || undefined,
      recipientIban: transferType === "external" ? recipientIban : undefined,
      userId,
      pin,
    };

    transferMutation.mutate(transferData);
  };

  const handleBeneficiarySelection = (beneficiaryId: string) => {
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    if (beneficiary) {
      setRecipientIban(beneficiary.iban);
      setSelectedBeneficiary(beneficiaryId);
    }
  };

  const handleAddBeneficiary = () => {
    if (!newBeneficiaryName || !newBeneficiaryIban) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le nom et l'IBAN",
        variant: "destructive",
      });
      return;
    }

    addBeneficiaryMutation.mutate({
      userId,
      name: newBeneficiaryName,
      iban: newBeneficiaryIban,
      isInternal: false
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-white">
              Nouveau virement
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClose}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={transferType} onValueChange={(value) => setTransferType(value as "internal" | "external")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="internal" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Virement interne
              </TabsTrigger>
              <TabsTrigger value="external" className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Virement externe
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 mt-4">
              {/* Compte débiteur */}
              <div>
                <Label htmlFor="fromAccount" className="text-white">Compte débiteur</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="text-white focus:bg-gray-700">
                        {account.name} - {parseFloat(account.balance).toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                        })} €
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination selon le type */}
              <TabsContent value="internal" className="mt-0">
                <div>
                  <Label htmlFor="toAccount" className="text-white">Compte bénéficiaire</Label>
                  <Select value={toAccountId} onValueChange={setToAccountId}>
                    <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Sélectionner un compte de destination" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {accounts
                        .filter(account => account.id !== fromAccountId)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id} className="text-white focus:bg-gray-700">
                            {account.name} - {parseFloat(account.balance).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })} €
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="external" className="mt-0 space-y-4">
                {/* Bénéficiaires enregistrés */}
                {beneficiaries.length > 0 && (
                  <div>
                    <Label className="text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Bénéficiaires enregistrés
                    </Label>
                    <Select value={selectedBeneficiary} onValueChange={handleBeneficiarySelection}>
                      <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Choisir un bénéficiaire" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {beneficiaries.map((beneficiary) => (
                          <SelectItem key={beneficiary.id} value={beneficiary.id} className="text-white focus:bg-gray-700">
                            {beneficiary.name} - {beneficiary.iban}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* IBAN manuel */}
                <div>
                  <Label htmlFor="recipientIban" className="text-white">
                  IBAN du bénéficiaire
                  <span className="text-sm text-gray-400 ml-2">
                    (Valentin: FR76 3006 6101 2600 0000 0042 123)
                  </span>
                </Label>
                  <Input
                    id="recipientIban"
                    value={recipientIban}
                    onChange={(e) => setRecipientIban(e.target.value)}
                    placeholder="Ex: FR76 3006 6101 2600 0000 0042 123"
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Ajouter bénéficiaire */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddBeneficiary(!showAddBeneficiary)}
                    className="w-full border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showAddBeneficiary ? "Annuler" : "Enregistrer ce bénéficiaire"}
                  </Button>
                </div>

                {showAddBeneficiary && (
                  <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
                    <div>
                      <Label htmlFor="newBeneficiaryName" className="text-white">Nom du bénéficiaire</Label>
                      <Input
                        id="newBeneficiaryName"
                        value={newBeneficiaryName}
                        onChange={(e) => setNewBeneficiaryName(e.target.value)}
                        placeholder="Nom complet"
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newBeneficiaryIban" className="text-white">IBAN</Label>
                      <Input
                        id="newBeneficiaryIban"
                        value={newBeneficiaryIban}
                        onChange={(e) => setNewBeneficiaryIban(e.target.value)}
                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                        className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <Button
                      onClick={handleAddBeneficiary}
                      disabled={addBeneficiaryMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {addBeneficiaryMutation.isPending ? "Enregistrement..." : "Enregistrer le bénéficiaire"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Montant */}
              <div>
                <Label htmlFor="amount" className="text-white">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Description - Optionnelle */}
              <div>
                <Label htmlFor="description" className="text-white">Motif du virement <span className="text-gray-400">(optionnel)</span></Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motif du virement (optionnel)"
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />
              </div>

              {/* Bouton de validation */}
              <Button
                onClick={handleProcessTransfer}
                disabled={transferMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {transferMutation.isPending ? "Traitement..." : "Valider le virement"}
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PinModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        title="Validation du virement"
        description="Veuillez saisir votre code PIN pour valider le virement"
        onSuccess={(pin?: string) => handlePinSuccess(pin || "")}
        userId={userId}
      />
    </>
  );
}