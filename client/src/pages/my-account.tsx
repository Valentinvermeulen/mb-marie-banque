import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCurrentUser, clearStoredUser } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, LogOut, Building2, Mail, Phone, MapPin, MessageCircle, CreditCard, Settings, Copy, Eye, EyeOff, Send, Fingerprint, Scan, Shield, Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { BankInfo, Account } from "../../../shared/schema";

export default function MyAccount() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("agency");
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [showFullIban, setShowFullIban] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showEditRibModal, setShowEditRibModal] = useState(false);
  const [editRibForm, setEditRibForm] = useState({
    bankName: "",
    bankCode: "",
    branchCode: "",
    accountNumber: "",
    ribKey: "",
  });
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "advisor", message: "Bonjour ! Comment puis-je vous aider aujourd'hui ?", time: "14:30" },
    { id: 2, sender: "client", message: "J'aimerais savoir comment augmenter mon plafond de carte", time: "14:32" },
    { id: 3, sender: "advisor", message: "Je peux vous aider avec ça. Quel montant souhaiteriez-vous ?", time: "14:33" },
  ]);
  const user = getCurrentUser();
  const { toast } = useToast();

  const { data: bankInfo, refetch: refetchBankInfo } = useQuery<BankInfo>({
    queryKey: ["/api/client/bank-info", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Plus fréquent pour mettre à jour le nom conseiller
  });

  const { data: userRib, refetch: refetchUserRib } = useQuery({
    queryKey: ["/api/user-rib", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh RIB data every 5 seconds
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", user?.id],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refresh accounts every 5 seconds
  });

  // Default advisor info if no data
  const defaultAdvisor = { 
    advisorName: 'Mme Stephanie Amick', 
    advisorEmail: 's.amick@cic.fr',
    agencyEmail: 'contact@cic-lille.fr',
    phone: '03 20 12 34 56', 
    address: 'Agence CIC Lille Centre\n15 Place Rihour\n59000 Lille',
    bankName: 'CIC - Crédit Industriel et Commercial'
  };
  const advisor = bankInfo || defaultAdvisor;

  const handleLogout = () => {
    clearStoredUser();
    setLocation("/");
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        sender: "client" as const,
        message: chatMessage,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage("");
      
      // Simulation d'une réponse automatique du conseiller
      setTimeout(() => {
        const advisorResponse = {
          id: chatMessages.length + 2,
          sender: "advisor" as const,
          message: "Merci pour votre message. Je vais traiter votre demande et vous répondre rapidement.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        };
        setChatMessages(prev => [...prev, advisorResponse]);
      }, 2000);
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricType || !user) {
      toast({
        title: "Authentification biométrique indisponible",
        description: "Votre appareil ne supporte pas cette fonctionnalité",
        variant: "destructive",
      });
      return;
    }

    if (biometricEnabled) {
      // Disable biometric authentication
      localStorage.removeItem(`biometric_${user.username}`);
      setBiometricEnabled(false);
      toast({
        title: "Authentification biométrique désactivée",
        description: "Vous devrez utiliser votre mot de passe pour vous connecter",
      });
    } else {
      // Enable biometric authentication
      try {
        toast({
          title: "Configuration en cours...",
          description: `Utilisez ${biometricType === 'face' ? 'Face ID' : 'votre empreinte'} pour configurer l'authentification`,
        });

        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: {
              name: "CIC Banking",
              id: window.location.hostname,
            },
            user: {
              id: new TextEncoder().encode(user.username),
              name: user.username,
              displayName: user.name || user.username,
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              requireResidentKey: false,
            },
            timeout: 60000,
          },
        });

        if (credential) {
          // Store biometric credential info
          const credentialId = Array.from(new Uint8Array(credential.rawId))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          const biometricData = {
            enabled: true,
            credentialId: credentialId,
            displayName: user.name || user.username,
            lastUsed: Date.now(),
          };

          localStorage.setItem(`biometric_${user.username}`, JSON.stringify(biometricData));
          setBiometricEnabled(true);
          
          toast({
            title: "Authentification biométrique activée",
            description: `${biometricType === 'face' ? 'Face ID' : 'Touch ID'} configuré avec succès`,
          });
        }
      } catch (error: any) {
        console.error('Biometric setup failed:', error);
        toast({
          title: "Erreur de configuration",
          description: error.name === 'NotAllowedError' 
            ? "L'utilisateur a annulé l'opération" 
            : "Impossible de configurer l'authentification biométrique",
          variant: "destructive",
        });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Le texte a été copié dans le presse-papier",
    });
  };

  // Check biometric support on component mount
  useEffect(() => {
    if (!user || user.role !== "client") {
      setLocation("/");
      return;
    }

    const checkBiometricSupport = async () => {
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (available) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isApple) {
              setBiometricType("face");
            } else if (isMobile) {
              setBiometricType("fingerprint");
            } else {
              setBiometricType("fingerprint");
            }

            // Check if biometric is already enabled for this user
            const biometricData = localStorage.getItem(`biometric_${user?.username}`);
            if (biometricData) {
              const data = JSON.parse(biometricData);
              setBiometricEnabled(data.enabled || false);
            }
          }
        } catch (error) {
          console.log('Biometric not available:', error);
        }
      }
    };

    checkBiometricSupport();
  }, [user, setLocation]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* Fixed Header */}
      <div className="mb-header-gradient px-4 pt-12 pb-4 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setLocation("/client")}
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Mon Profil</h1>
          <Button
            onClick={handleLogout}
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>

        {/* User Info */}
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold">{user?.name}</h2>
          <p className="text-white/80 text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="grid grid-cols-4 gap-2">
          <Button
            onClick={() => setActiveTab("agency")}
            variant={activeTab === "agency" ? "default" : "outline"}
            className={`flex flex-col items-center p-4 h-auto space-y-2 ${
              activeTab === "agency" 
                ? "bg-white/20 text-white border-white/30" 
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
            }`}
            size="sm"
          >
            <Building2 className="h-5 w-5 text-blue-400" />
            <span className="text-xs font-medium">Agence</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("advisor")}
            variant={activeTab === "advisor" ? "default" : "outline"}
            className={`flex flex-col items-center p-4 h-auto space-y-2 ${
              activeTab === "advisor" 
                ? "bg-white/20 text-white border-white/30" 
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
            }`}
            size="sm"
          >
            <MessageCircle className="h-5 w-5 text-green-400" />
            <span className="text-xs font-medium">Conseiller</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("rib")}
            variant={activeTab === "rib" ? "default" : "outline"}
            className={`flex flex-col items-center p-4 h-auto space-y-2 ${
              activeTab === "rib" 
                ? "bg-white/20 text-white border-white/30" 
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
            }`}
            size="sm"
          >
            <CreditCard className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-medium">RIB/IBAN</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("settings")}
            variant={activeTab === "settings" ? "default" : "outline"}
            className={`flex flex-col items-center p-4 h-auto space-y-2 ${
              activeTab === "settings" 
                ? "bg-white/20 text-white border-white/30" 
                : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
            }`}
            size="sm"
          >
            <Settings className="h-5 w-5 text-orange-400" />
            <span className="text-xs font-medium">Paramètres</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Informations sur l'agence */}
        {activeTab === "agency" && (
          <Card className="mb-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-white">
                <Building2 className="h-5 w-5 mr-2 text-blue-400" />
                Informations sur l'agence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-white/60">Nom de la banque</p>
                <p className="font-semibold text-white">{advisor.bankName}</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Adresse de l'agence</p>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-white/60 mt-1" />
                  <div className="whitespace-pre-line text-sm text-white/80">
                    {advisor.address}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Téléphone</p>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-white/60" />
                    <p className="font-semibold text-white">{advisor.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-white/60">Email</p>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-white/60" />
                    <p className="font-semibold text-white">{advisor.agencyEmail || advisor.advisorEmail}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacter le conseiller */}
        {activeTab === "advisor" && (
          <Card className="mb-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-white">
                <User className="h-5 w-5 mr-2 text-green-400" />
                Mon conseiller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {advisor.advisorName.split(" ").map((n: string) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{advisor.advisorName}</h3>
                  <p className="text-sm text-white/60">Conseiller clientèle - {advisor.bankName}</p>
                </div>
                <Button
                  onClick={() => setShowChat(true)}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-0"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  CONTACTER
                </Button>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/80">{advisor.advisorEmail}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/80">{advisor.phone}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-white/60 mt-0.5" />
                  <span className="text-sm whitespace-pre-line text-white/80">{advisor.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RIB/IBAN */}
        {activeTab === "rib" && (
          <Card className="mb-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-white">
                <CreditCard className="h-5 w-5 mr-2 text-purple-400" />
                Mes RIB/IBAN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="p-4 border border-white/20 rounded-lg space-y-3 bg-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{account.name}</h4>
                    <span className="text-sm text-white/60 uppercase">{account.type}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* IBAN */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">IBAN</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-white">
                          {showFullIban === account.id 
                            ? (userRib?.iban || `FR76 3008 1000 0100 ${account.id.slice(0, 11)} 54`)
                            : `FR** **** **** **** **** **54`
                          }
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/60 hover:text-white hover:bg-white/10"
                          onClick={() => setShowFullIban(showFullIban === account.id ? null : account.id)}
                        >
                          {showFullIban === account.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/60 hover:text-white hover:bg-white/10"
                          onClick={() => copyToClipboard(userRib?.iban || `FR76300810000100${account.id.replace(/-/g, '').slice(0, 11)}54`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Code Banque */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Code Banque</span>
                      <span className="font-mono text-sm text-white">{userRib?.bankCode || "30081"}</span>
                    </div>

                    {/* Code Guichet */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Code Guichet</span>
                      <span className="font-mono text-sm text-white">{userRib?.branchCode || "00001"}</span>
                    </div>

                    {/* Numéro de Compte */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">N° de Compte</span>
                      <span className="font-mono text-sm text-white">
                        {showFullIban === account.id 
                          ? (userRib?.accountNumber || `00${account.id.slice(0, 11)}`)
                          : `** **** ***** **`
                        }
                      </span>
                    </div>

                    {/* Clé RIB */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">Clé RIB</span>
                      <span className="font-mono text-sm text-white">{userRib?.ribKey || "54"}</span>
                    </div>

                    {/* BIC/SWIFT */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60">BIC/SWIFT</span>
                      <span className="font-mono text-sm text-white">{userRib?.bic || "CMCIFR2A"}</span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Solde</span>
                        <span className="font-semibold text-white">
                          {parseFloat(account.balance).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                          })} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Paramètres de sécurité */}
        {activeTab === "settings" && (
          <Card className="mb-glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-white">
                <Shield className="h-5 w-5 mr-2 text-orange-400" />
                Paramètres de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Biometric Authentication Settings */}
              {biometricType && (
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/20">
                  <div className="flex items-center space-x-3">
                    {biometricType === "face" ? (
                      <Scan className="h-5 w-5 text-orange-400" />
                    ) : (
                      <Fingerprint className="h-5 w-5 text-orange-400" />
                    )}
                    <div>
                      <p className="font-semibold text-sm text-white">
                        {biometricType === "face" ? "Reconnaissance faciale" : "Empreinte digitale"}
                      </p>
                      <p className="text-xs text-white/60">
                        Connexion rapide et sécurisée
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleBiometricToggle}
                    size="sm"
                    variant={biometricEnabled ? "destructive" : "default"}
                    className={biometricEnabled ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"}
                  >
                    {biometricEnabled ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              )}
              
              {!biometricType && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl opacity-50 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-white/40" />
                    <div>
                      <p className="font-semibold text-sm text-white/50">Authentification biométrique</p>
                      <p className="text-xs text-white/40">Non disponible sur cet appareil</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" disabled className="text-white/40">
                    Indisponible
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Modal */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="w-full max-w-md mx-auto h-[600px] flex flex-col p-0 mb-glass-modal">
          <DialogHeader className="p-4 border-b border-white/10 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
            <DialogTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat avec {advisor.advisorName}
            </DialogTitle>
          </DialogHeader>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === "client"
                      ? "bg-gradient-to-r from-green-500 to-teal-500 text-white"
                      : "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === "client" ? "text-white/70" : "text-white/60"
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-white/10 bg-background">
            <div className="flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Tapez votre message..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}