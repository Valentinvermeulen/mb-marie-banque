import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCurrentUser, clearStoredUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, User, MessageCircle, Phone, Mail, MapPin, LogOut, Send, Fingerprint, Scan, Shield, Settings, Copy, Eye, EyeOff, Building2, CreditCard } from "lucide-react";
import type { BankInfo, Account } from "../../../shared/schema";

export default function MyAccount() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showBiometricSettings, setShowBiometricSettings] = useState(false);
  const [showFullIban, setShowFullIban] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "advisor", message: "Bonjour ! Comment puis-je vous aider aujourd'hui ?", time: "14:30" },
    { id: 2, sender: "client", message: "J'aimerais savoir comment augmenter mon plafond de carte", time: "14:32" },
    { id: 3, sender: "advisor", message: "Je peux vous aider avec ça. Quel montant souhaiteriez-vous ?", time: "14:33" },
  ]);
  const user = getCurrentUser();
  const { toast } = useToast();

  const { data: bankInfo } = useQuery<BankInfo>({
    queryKey: ["/api/client/bank-info", user?.id],
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds to get latest advisor updates
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts", user?.id],
    enabled: !!user?.id,
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

  const documents = [
    { id: 1, name: "Contrat de compte courant", date: "15/03/2024", type: "PDF" },
    { id: 2, name: "Conditions générales", date: "01/01/2024", type: "PDF" },
    { id: 3, name: "Relevé de compte - Décembre", date: "31/12/2024", type: "PDF" },
    { id: 4, name: "Convention de compte", date: "15/03/2024", type: "PDF" },
  ];

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
            // Detect device type to determine biometric method
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isApple) {
              setBiometricType("face"); // Face ID on iOS
            } else if (isMobile) {
              setBiometricType("fingerprint"); // Touch ID on Android
            } else {
              setBiometricType("fingerprint"); // Windows Hello, etc.
            }
            
            // Check if user has already enabled biometric login
            if (user?.username) {
              const biometricData = localStorage.getItem(`biometric_${user.username}`);
              if (biometricData) {
                const data = JSON.parse(biometricData);
                setBiometricEnabled(data.enabled || false);
              } else {
                // Fallback to legacy check
                const hasEnabledBiometric = localStorage.getItem('biometricEnabled') === 'true';
                setBiometricEnabled(hasEnabledBiometric);
              }
            }
          }
        } catch (error) {
          setBiometricType(null);
        }
      }
    };
    
    checkBiometricSupport();
  }, [user, setLocation]);

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

  const handleLogout = () => {
    clearStoredUser();
    setLocation("/");
  };

  const handleBiometricToggle = async () => {
    if (!biometricType) {
      toast({
        title: "Authentification biométrique indisponible",
        description: "Votre appareil ne supporte pas cette fonctionnalité",
        variant: "destructive",
      });
      return;
    }

    if (biometricEnabled) {
      // Disable biometric authentication for this user
      if (user?.username) {
        localStorage.removeItem(`biometric_${user.username}`);
      }
      
      // Clean up legacy keys if no other biometric users exist
      const hasOtherBiometricUsers = Object.keys(localStorage)
        .some(key => key.startsWith('biometric_') && key !== `biometric_${user?.username}`);
      
      if (!hasOtherBiometricUsers) {
        localStorage.removeItem('biometricEnabled');
        localStorage.removeItem('biometricSetup');
        localStorage.removeItem('biometricUsername');
      }
      
      setBiometricEnabled(false);
      toast({
        title: "Authentification biométrique désactivée",
        description: "Vous devrez utiliser votre mot de passe pour vous connecter",
      });
    } else {
      // Enable biometric authentication - Simplified version
      try {
        toast({
          title: "Configuration en cours...",
          description: "Veuillez utiliser votre biométrie quand demandé",
        });

        // Real WebAuthn biometric setup
        try {
          // Generate random values for WebAuthn
          const challenge = crypto.getRandomValues(new Uint8Array(32));
          const userId = crypto.getRandomValues(new Uint8Array(64));
          
          toast({
            title: "Configuration en cours...",
            description: `${biometricType === 'face' ? 'Utilisez Face ID' : 'Utilisez votre empreinte'} quand demandé`,
          });

          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: challenge,
              rp: { 
                name: "CIC Banque",
                id: window.location.hostname
              },
              user: {
                id: userId,
                name: user?.username || "user",
                displayName: user?.name || "Utilisateur CIC"
              },
              pubKeyCredParams: [
                { alg: -7, type: "public-key" },
                { alg: -257, type: "public-key" }
              ],
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
                requireResidentKey: false
              },
              timeout: 60000,
              attestation: "none"
            }
          });

          if (credential) {
            // Store credential ID for future authentication
            const credentialId = Array.from(new Uint8Array((credential as any).rawId))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
            
            // Store biometric data per user
            const biometricData = {
              enabled: true,
              credentialId: credentialId,
              displayName: user?.name || user?.username || 'Utilisateur',
              lastUsed: Date.now()
            };
            
            localStorage.setItem(`biometric_${user?.username}`, JSON.stringify(biometricData));
            
            // Keep legacy keys for backward compatibility
            localStorage.setItem('biometricEnabled', 'true');
            localStorage.setItem('biometricSetup', 'true');
            localStorage.setItem('biometricUsername', user?.username || '');
            setBiometricEnabled(true);
            
            toast({
              title: "Authentification biométrique activée",
              description: `${biometricType === 'face' ? 'Face ID' : 'Touch ID'} configuré avec succès`,
            });
          }
        } catch (setupError: any) {
          console.error('Biometric setup error:', setupError);
          let errorMessage = "Impossible de configurer l'authentification biométrique";
          
          if (setupError.name === 'NotSupportedError') {
            errorMessage = "Votre navigateur ne supporte pas cette fonctionnalité";
          } else if (setupError.name === 'NotAllowedError') {
            errorMessage = "Accès refusé. Veuillez autoriser l'authentification biométrique";
          } else if (setupError.name === 'AbortError') {
            errorMessage = "Configuration annulée par l'utilisateur";
          } else if (setupError.name === 'SecurityError') {
            errorMessage = "Erreur de sécurité. Vérifiez que vous utilisez HTTPS";
          } else if (setupError.name === 'InvalidStateError') {
            errorMessage = "Un authenticateur est déjà enregistré pour ce compte";
          }
          
          toast({
            title: "Configuration échouée",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        // Return early to prevent the catch block
        return;
      } catch (error: any) {
        console.error('Biometric setup error:', error);
        let errorMessage = "Impossible de configurer l'authentification biométrique";
        
        if (error.name === 'NotSupportedError') {
          errorMessage = "Votre navigateur ne supporte pas cette fonctionnalité";
        } else if (error.name === 'NotAllowedError') {
          errorMessage = "Accès refusé. Veuillez autoriser l'authentification biométrique";
        } else if (error.name === 'AbortError') {
          errorMessage = "Configuration annulée";
        } else if (error.name === 'SecurityError') {
          errorMessage = "Erreur de sécurité. Vérifiez que vous utilisez HTTPS";
        }
        
        toast({
          title: "Configuration échouée", 
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="cic-gradient px-4 pt-12 pb-4 text-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => setLocation("/client-dashboard")}
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
          {/* Menu de navigation avec les boutons demandés */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setActiveTab("agency")}
              variant={activeTab === "agency" ? "default" : "outline"}
              className="flex flex-col items-center p-6 h-auto space-y-2"
            >
              <Building2 className="h-8 w-8 text-[var(--cic-teal)]" />
              <span className="text-sm font-medium">Informations Agence</span>
            </Button>
            
            <Button
              onClick={() => setActiveTab("advisor")}
              variant={activeTab === "advisor" ? "default" : "outline"}
              className="flex flex-col items-center p-6 h-auto space-y-2"
            >
              <MessageCircle className="h-8 w-8 text-[var(--cic-teal)]" />
              <span className="text-sm font-medium">Contacter Conseiller</span>
            </Button>
            
            <Button
              onClick={() => setActiveTab("rib")}
              variant={activeTab === "rib" ? "default" : "outline"}
              className="flex flex-col items-center p-6 h-auto space-y-2"
            >
              <CreditCard className="h-8 w-8 text-[var(--cic-teal)]" />
              <span className="text-sm font-medium">Espace RIB/IBAN</span>
            </Button>
            
            <Button
              onClick={() => setActiveTab("settings")}
              variant={activeTab === "settings" ? "default" : "outline"}
              className="flex flex-col items-center p-6 h-auto space-y-2"
            >
              <Settings className="h-8 w-8 text-[var(--cic-teal)]" />
              <span className="text-sm font-medium">Paramètres</span>
            </Button>
          </div>

          {/* Contenu selon l'onglet actif */}
          {activeTab === "agency" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                  Informations sur l'agence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nom de la banque</p>
                  <p className="font-semibold">{advisor.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Adresse de l'agence</p>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div className="whitespace-pre-line text-sm text-gray-700">
                      {advisor.address}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="font-semibold">{advisor.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="font-semibold">{advisor.advisorEmail}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "advisor" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                  Mon conseiller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[var(--cic-teal)] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {advisor.advisorName.split(" ").map((n: string) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{advisor.advisorName}</h3>
                    <p className="text-sm text-gray-500">Conseiller clientèle</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{advisor.advisorEmail}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{advisor.phone}</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setShowChat(true)}
                  className="w-full bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)] text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Démarrer une conversation
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "rib" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                  Mes RIB et IBAN
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accounts.length > 0 ? (
                  accounts.map((account: any) => (
                    <div key={account.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">{account.name}</h4>
                        <span className="text-sm text-gray-500 capitalize">{account.type}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">IBAN</p>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1">
                              {showFullIban === account.id ? account.iban : `•••• •••• ••${account.iban.slice(-4)}`}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowFullIban(showFullIban === account.id ? null : account.id)}
                              className="h-8 w-8 p-0"
                            >
                              {showFullIban === account.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(account.iban);
                                  toast({
                                    title: "IBAN copié",
                                    description: "L'IBAN a été copié dans le presse-papiers",
                                  });
                                } catch (err) {
                                  toast({
                                    title: "Erreur",
                                    description: "Impossible de copier l'IBAN",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Solde</p>
                          <p className="font-semibold text-lg">
                            {parseFloat(account.balance).toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                            })} €
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun compte disponible</p>
                    <p className="text-sm">Contactez votre conseiller pour ouvrir un compte</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <>
              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <User className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                    Mes informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nom</p>
                      <p className="font-semibold">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom d'utilisateur</p>
                    <p className="font-semibold">{user.username}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Authentification biométrique */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Shield className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                    Sécurité et authentification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {biometricType === "face" ? (
                        <Scan className="h-6 w-6 text-[var(--cic-teal)]" />
                      ) : (
                        <Fingerprint className="h-6 w-6 text-[var(--cic-teal)]" />
                      )}
                      <div>
                        <h4 className="font-medium">
                          {biometricType === "face" ? "Face ID" : "Touch ID"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {biometricEnabled ? "Activé" : "Désactivé"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleBiometricToggle}
                      variant={biometricEnabled ? "destructive" : "default"}
                      size="sm"
                      disabled={!biometricType}
                    >
                      {biometricEnabled ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                  
                  {!biometricType && (
                    <div className="text-sm text-gray-500 text-center p-4 bg-yellow-50 rounded-lg">
                      L'authentification biométrique n'est pas disponible sur votre appareil
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Mon conseiller */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                Mon conseiller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[var(--cic-teal)] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {advisor.advisorName.split(" ").map((n: string) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{advisor.advisorName}</h3>
                  <p className="text-sm text-gray-500">Conseiller clientèle - {advisor.bankName}</p>
                </div>
                <Button
                  onClick={() => setShowChat(true)}
                  size="sm"
                  className="bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)] text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{advisor.advisorEmail}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{advisor.phone}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm whitespace-pre-line">{advisor.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mes documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                Mes documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{doc.name}</h4>
                        <p className="text-xs text-gray-500">{doc.date} • {doc.type}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-[var(--cic-teal)]">
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Paramètres de sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Settings className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
                Paramètres de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Biometric Authentication Settings */}
              {biometricType && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {biometricType === "face" ? (
                      <Scan className="h-5 w-5 text-[var(--cic-teal)]" />
                    ) : (
                      <Fingerprint className="h-5 w-5 text-[var(--cic-teal)]" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">
                        {biometricType === "face" ? "Reconnaissance faciale" : "Empreinte digitale"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Connexion rapide et sécurisée
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleBiometricToggle}
                    size="sm"
                    variant={biometricEnabled ? "destructive" : "default"}
                    className={biometricEnabled ? "" : "bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)] text-white"}
                  >
                    {biometricEnabled ? "Désactiver" : "Activer"}
                  </Button>
                </div>
              )}
              
              {!biometricType && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl opacity-50">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm text-gray-500">Authentification biométrique</p>
                      <p className="text-xs text-gray-400">Non disponible sur cet appareil</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" disabled>
                    Indisponible
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Biometric Settings Modal */}
      <Dialog open={showBiometricSettings} onOpenChange={setShowBiometricSettings}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {biometricType === "face" ? (
                <Scan className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
              ) : (
                <Fingerprint className="h-5 w-5 mr-2 text-[var(--cic-teal)]" />
              )}
              {biometricType === "face" ? "Reconnaissance faciale" : "Empreinte digitale"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[var(--cic-teal)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {biometricType === "face" ? (
                  <Scan className="h-8 w-8 text-[var(--cic-teal)]" />
                ) : (
                  <Fingerprint className="h-8 w-8 text-[var(--cic-teal)]" />
                )}
              </div>
              <h3 className="font-semibold mb-2">
                {biometricEnabled ? "Authentification activée" : "Activer l'authentification biométrique"}
              </h3>
              <p className="text-sm text-gray-600">
                {biometricEnabled 
                  ? `${biometricType === "face" ? "La reconnaissance faciale" : "L'empreinte digitale"} est configurée pour votre compte.`
                  : `Utilisez ${biometricType === "face" ? "votre visage" : "votre empreinte"} pour vous connecter rapidement et en toute sécurité.`
                }
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowBiometricSettings(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  handleBiometricToggle();
                  setShowBiometricSettings(false);
                }}
                className={`flex-1 ${biometricEnabled ? "bg-red-600 hover:bg-red-700" : "bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)]"} text-white`}
              >
                {biometricEnabled ? "Désactiver" : "Activer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Modal */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="w-full max-w-md mx-auto h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b bg-[var(--cic-teal)] text-white rounded-t-lg">
            <DialogTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat avec {advisor.advisorName}
            </DialogTitle>
          </DialogHeader>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === "client"
                      ? "bg-[var(--cic-teal)] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === "client" ? "text-white/70" : "text-gray-500"
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Tapez votre message..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                size="sm"
                className="bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)] text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}