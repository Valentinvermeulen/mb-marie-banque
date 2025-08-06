import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import type { Account, Card } from "../../../shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import NumericKeypad from "@/components/ui/numeric-keypad";
import { ArrowLeft, CreditCard, Eye, EyeOff, Copy, Shield, Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MyCards() {
  const [, setLocation] = useLocation();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [showBlockConfirmation, setShowBlockConfirmation] = useState(false);
  const [showBlockPinVerification, setShowBlockPinVerification] = useState(false);
  const [showFinalBlockConfirmation, setShowFinalBlockConfirmation] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardToBlock, setCardToBlock] = useState<Card | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [blockPinInput, setBlockPinInput] = useState("");
  const [showCardPin, setShowCardPin] = useState(false);
  const [verificationAction, setVerificationAction] = useState<"view" | "block">("view");
  const user = getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || user.role !== "client") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Block card mutation
  const blockCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      console.log("🚫 BLOCAGE CARTE: Envoi de la requête de blocage pour", cardId);
      const response = await apiRequest("PUT", `/api/cards/${cardId}/block`, {});
      return response;
    },
    onSuccess: () => {
      console.log("✅ BLOCAGE CARTE: Carte bloquée avec succès");
      toast({ title: "✅ Carte bloquée avec succès" });
      
      // Fermer tous les modals
      setShowBlockPinVerification(false);
      setShowFinalBlockConfirmation(false);
      setCardToBlock(null);
      setBlockPinInput("");
      
      // Force refresh immédiat de toutes les données
      console.log("🔄 MISE À JOUR: Actualisation forcée des données");
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/advisor/blocked-cards"] });
      
      // Refetch immédiat pour mise à jour instantanée
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/cards"] });
        queryClient.refetchQueries({ queryKey: ["/api/notifications"] });
      }, 100);
    },
    onError: (error) => {
      console.error("❌ BLOCAGE CARTE: Erreur lors du blocage", error);
      toast({ title: "❌ Erreur lors du blocage", variant: "destructive" });
      setShowBlockPinVerification(false);
      setShowFinalBlockConfirmation(false);
      setCardToBlock(null);
      setBlockPinInput("");
    }
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", user?.id],
    enabled: !!user?.id,
  });

  const { data: cards = [] } = useQuery<Card[]>({
    queryKey: ["/api/cards", accounts[0]?.id],
    enabled: !!accounts[0]?.id,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setVerificationAction("view");
    setShowPinVerification(true);
    setPinInput("");
  };

  const handleBlockCard = (card: Card) => {
    console.log("🔴 ÉTAPE 1: Initialisation du processus pour la carte", card.cardNumber.slice(-4));
    setCardToBlock(card);
    setShowBlockConfirmation(true);
  };

  const confirmBlockCard = () => {
    console.log("🔴 ÉTAPE 1: Utilisateur confirme - passage à la saisie PIN");
    setShowBlockConfirmation(false);
    setTimeout(() => {
      setShowBlockPinVerification(true);
      setBlockPinInput("");
    }, 200);
  };

  const handleBlockPinKeyPress = (key: string) => {
    if (blockPinInput.length < 6) {
      setBlockPinInput(blockPinInput + key);
    }
  };

  const handleBlockPinBackspace = () => {
    setBlockPinInput(blockPinInput.slice(0, -1));
  };

  const verifyBlockPin = async () => {
    console.log("🔐 ÉTAPE 2: Vérification du PIN en cours...");
    
    if (blockPinInput.length !== 6) {
      toast({ title: "❌ Veuillez saisir un code PIN de 6 chiffres", variant: "destructive" });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/auth/verify-pin", {
        userId: user?.id,
        pin: blockPinInput
      });
      
      const result = await response.json();
      
      if (result.success && cardToBlock) {
        console.log("✅ ÉTAPE 2: PIN correct - passage à la confirmation finale");
        setShowBlockPinVerification(false);
        setTimeout(() => {
          setShowFinalBlockConfirmation(true);
        }, 200);
      } else {
        setBlockPinInput("");
        toast({ title: "❌ Code PIN incorrect", variant: "destructive" });
      }
    } catch (error) {
      setBlockPinInput("");
      toast({ title: "❌ Code PIN incorrect", variant: "destructive" });
    }
  };

  const finalConfirmBlock = () => {
    console.log("🔒 ÉTAPE 3: Confirmation finale - blocage définitif");
    if (cardToBlock) {
      blockCardMutation.mutate(cardToBlock.id);
    }
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
      setShowPinVerification(false);
      if (verificationAction === "view") {
        setShowCardDetails(true);
      }
      setPinInput("");
    } else {
      setPinInput("");
      toast({ title: "❌ Code PIN incorrect", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Logo discret en haut à gauche fixe */}
      <div className="fixed top-4 left-4 z-20 opacity-100">
        <img 
          src="/mb-logo-simple.png"
          alt="MB"
          className="h-16 w-auto max-w-40"
        />
      </div>
      {/* Header avec Logo */}
      <div className="mb-header-gradient px-6 pt-12 pb-6 text-white relative overflow-hidden">

        
        <div className="flex items-center justify-between mb-6 mt-8">
          <Button
            onClick={() => setLocation("/client")}
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/30 mb-transition w-12 h-12 rounded-full bg-white/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold mb-glow">💳 MES CARTES</h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Liste des Cartes Modernes */}
      <div className="px-6 py-6 space-y-6">
        {cards.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-glass-card rounded-2xl p-8 mb-transition">
              <CreditCard className="h-20 w-20 text-white/50 mx-auto mb-6 mb-glow" />
              <h3 className="text-xl font-bold text-white mb-3">
                Aucune carte bancaire
              </h3>
              <p className="text-white/70 mb-8">
                Contactez votre conseiller MB MARIE BANQUE pour commander votre première carte
              </p>
              <Button
                onClick={() => setLocation("/client")}
                className="mb-btn px-8 py-3 rounded-xl"
              >
                ← Retour à l'accueil
              </Button>
            </div>
          </div>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="mb-virtual-card rounded-2xl p-6 cursor-pointer mb-transition hover:scale-105 hover:shadow-2xl relative overflow-hidden"
            >
              {/* Logo sur la carte */}
              <div className="absolute top-4 right-4 opacity-40">
                <img 
                  src="/mb-logo-simple.png"
                  alt="MB MARIE BANQUE"
                  className="h-4 w-auto max-w-18"
                />
              </div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-glow">
                    <CreditCard className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg font-mono">
                      •••• •••• •••• {card.cardNumber.slice(-4)}
                    </h3>
                    <p className="text-white/80 text-sm font-medium">{card.holderName}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {card.isVirtual && (
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Virtuelle
                    </Badge>
                  )}
                  {card.isBlocked ? (
                    <Badge variant="destructive" className="text-xs bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
                      🔒 Bloquée
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                      ✅ Active
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm font-mono">
                  Exp: {card.expiryDate}
                </div>
                {!card.isBlocked && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBlockCard(card);
                    }}
                    className="text-red-300 border-red-500/30 hover:bg-red-500/20 mb-transition bg-red-500/10"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Bloquer
                  </Button>
                )}
              </div>
              
              {/* Effet de brillance sur la carte */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full mb-shimmer"></div>
            </div>
          ))
        )}
      </div>

      {/* PIN Verification Modal */}
      <Dialog open={showPinVerification} onOpenChange={setShowPinVerification}>
        <DialogContent className="w-full max-w-sm mx-auto mb-glass-card border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-center text-xl font-bold">
              🔐 Code PIN
            </DialogTitle>
            <p className="text-white/80 text-sm text-center">
              Saisissez votre code PIN sécurisé pour accéder aux détails de votre carte MB
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-white/30 flex items-center justify-center"
                >
                  {pinInput[i] && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              ))}
            </div>

            <NumericKeypad 
              onKeyPress={handlePinKeyPress}
              onBackspace={handlePinBackspace}
            />

            <div className="space-y-2">
              <Button
                onClick={verifyPin}
                disabled={pinInput.length !== 6}
                className="w-full mb-btn py-3 rounded-xl font-bold"
              >
                CONFIRMER
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPinVerification(false);
                  setPinInput("");
                }}
                className="w-full border-white/30 text-white hover:bg-white/10 mb-transition"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card Details Modal */}
      <Dialog open={showCardDetails} onOpenChange={setShowCardDetails}>
        <DialogContent className="w-full max-w-sm mx-auto p-0 border-none bg-transparent">
          <div className="relative">
            {selectedCard && (
              <div className="relative">
                {/* Rotating Animation Ring */}
                <div className="absolute inset-0 -m-4 rounded-3xl animate-spin-slow">
                  <div className="w-full h-full rounded-3xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-20 blur-sm"></div>
                </div>
                <div className="absolute inset-0 -m-2 rounded-2xl animate-pulse">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-30 blur-xs"></div>
                </div>

                {/* Main Card with Magnetic Background */}
                <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-6 text-white shadow-2xl overflow-hidden">
                  {/* Magnetic Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
                  <div className="absolute top-1/4 right-0 w-32 h-32 bg-gradient-radial from-blue-400/30 to-transparent rounded-full blur-xl"></div>
                  <div className="absolute bottom-1/4 left-0 w-24 h-24 bg-gradient-radial from-purple-400/30 to-transparent rounded-full blur-xl"></div>
                  
                  {/* Reflective Surface Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  <div className="absolute top-1/3 right-0 w-px h-1/3 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                  {/* Card Content */}
                  <div className="relative z-10 space-y-6">
                    {/* Logo and Card Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center space-x-2">
                        <img 
                          src="/mb-logo-simple.png"
                          alt="MB"
                          className="h-6 w-auto opacity-90"
                        />
                        <div className="text-sm font-medium opacity-90">
                          {selectedCard.isVirtual ? "VIRTUELLE" : "PHYSIQUE"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-75 font-semibold">MB MARIE</div>
                        <div className="text-xs opacity-75 font-semibold">BANQUE</div>
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="mb-6">
                      <div className="text-2xl font-mono tracking-wider">
                        {selectedCard.cardNumber}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <div className="text-xs opacity-75 mb-1">TITULAIRE</div>
                        <div className="text-sm font-semibold">
                          {selectedCard.holderName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs opacity-75 mb-1">EXPIRE FIN</div>
                        <div className="text-sm font-semibold">
                          {selectedCard.expiryDate}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Code CVV</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedCard.cvv)}
                          className="text-white hover:bg-white/20 h-6 px-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {selectedCard.cvv}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Code PIN</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowCardPin(!showCardPin)}
                            className="text-white hover:bg-white/20 h-6 px-2"
                          >
                            {showCardPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <span className="font-mono">
                            {showCardPin ? selectedCard.pin : "••••"}
                          </span>
                          {showCardPin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(selectedCard.pin)}
                              className="text-white hover:bg-white/20 h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!selectedCard.isBlocked && (
                      <Button
                        variant="outline"
                        onClick={handleBlockCard}
                        className="w-full bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Faire opposition
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ÉTAPE 1: Block Confirmation Modal */}
      <Dialog open={showBlockConfirmation} onOpenChange={setShowBlockConfirmation}>
        <DialogContent className="w-full max-w-sm mx-auto mb-glass-card border border-red-500/30 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-white" />
            <DialogTitle className="text-xl font-bold text-white">
              Opposition de Carte
            </DialogTitle>
            <p className="text-red-100 text-sm mt-2">
              Confirmation requise
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-red-200 font-medium text-base">
                  Êtes-vous sûr de vouloir bloquer cette carte ?
                </p>
                <p className="text-red-300 text-sm mt-2 leading-relaxed">
                  Cette action bloquera immédiatement tous les paiements. Vous devrez contacter votre conseiller pour débloquer la carte.
                </p>
              </div>

              {cardToBlock && (
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Numéro :</span>
                      <span className="font-mono text-sm text-white">•••• •••• •••• {cardToBlock.cardNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Titulaire :</span>
                      <span className="font-semibold text-sm text-white">{cardToBlock.holderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Type :</span>
                      <span className="text-sm text-white">{cardToBlock.isVirtual ? "Virtuelle" : "Physique"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockConfirmation(false);
                  setCardToBlock(null);
                }}
                className="flex-1 border-white/30 text-white hover:bg-white/10 py-3 font-medium mb-transition"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmBlockCard}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 font-bold rounded-lg shadow-lg"
              >
                Continuer
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Étape 1/3 - Une notification sera envoyée après le blocage
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ÉTAPE 2: Block PIN Verification Modal */}
      <Dialog open={showBlockPinVerification} onOpenChange={setShowBlockPinVerification}>
        <DialogContent className="w-full max-w-sm mx-auto bg-gradient-to-br from-red-600 to-red-700 border-none shadow-2xl rounded-2xl">
          <div className="text-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-white text-xl font-bold mb-2">
              Code de Sécurité
            </DialogTitle>
            <p className="text-white/90 text-sm leading-relaxed">
              Saisissez votre code PIN à 6 chiffres pour confirmer le blocage de votre carte bancaire
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border-2 border-white/30 flex items-center justify-center"
                >
                  {blockPinInput[i] && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              ))}
            </div>

            <NumericKeypad 
              onKeyPress={handleBlockPinKeyPress}
              onBackspace={handleBlockPinBackspace}
            />

            <div className="space-y-2">
              <Button
                onClick={verifyBlockPin}
                disabled={blockPinInput.length !== 6}
                className="w-full bg-white text-red-600 font-semibold py-3 rounded-xl hover:bg-gray-50"
              >
                Vérifier le PIN
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlockPinVerification(false);
                  setBlockPinInput("");
                  setCardToBlock(null);
                }}
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                Annuler
              </Button>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/70">
                Étape 2/3 - Vérification de sécurité
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ÉTAPE 3: Final Block Confirmation Modal */}
      <Dialog open={showFinalBlockConfirmation} onOpenChange={setShowFinalBlockConfirmation}>
        <DialogContent className="w-full max-w-sm mx-auto bg-white border border-green-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 text-white text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Confirmation Finale
            </DialogTitle>
            <p className="text-green-100 text-sm mt-2">
              PIN vérifié avec succès
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 font-bold text-base mb-2">
                  ✅ Code PIN vérifié
                </p>
                <p className="text-green-700 text-sm leading-relaxed">
                  Confirmez-vous le blocage définitif de cette carte ? Cette action sera immédiate et sécurisée.
                </p>
              </div>

              {cardToBlock && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-600 text-sm font-medium">Carte à bloquer :</span>
                      <span className="font-mono text-sm">•••• {cardToBlock.cardNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 text-sm font-medium">Titulaire :</span>
                      <span className="font-semibold text-sm">{cardToBlock.holderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 text-sm font-medium">Action :</span>
                      <span className="text-sm font-bold text-red-700">BLOCAGE DÉFINITIF</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFinalBlockConfirmation(false);
                  setCardToBlock(null);
                  setBlockPinInput("");
                }}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 font-medium"
              >
                Annuler
              </Button>
              <Button
                onClick={finalConfirmBlock}
                disabled={blockCardMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 font-bold rounded-lg shadow-lg"
              >
                {blockCardMutation.isPending ? "Blocage..." : "BLOQUER DÉFINITIVEMENT"}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Étape 3/3 - Procédure sécurisée terminée
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}