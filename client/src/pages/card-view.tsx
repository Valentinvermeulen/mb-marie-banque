import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Copy, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NumericKeypad from "@/components/ui/numeric-keypad";

export default function CardView() {
  const [, setLocation] = useLocation();
  const [showPin, setShowPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const { toast } = useToast();
  const user = getCurrentUser();

  if (!user) {
    setLocation("/login");
    return null;
  }

  const { data: accounts = [] } = useQuery({
    queryKey: [`/api/accounts/${user.id}`],
  });

  const { data: cards = [] } = useQuery({
    queryKey: [`/api/cards/${(accounts as any)[0]?.id}`],
    enabled: !!(accounts as any)[0]?.id,
  });

  const { data: bankInfo } = useQuery({
    queryKey: [`/api/client/bank-info/${user.id}`],
  });

  const card = Array.isArray(cards) ? cards[0] : null;
  


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Informations copiées dans le presse-papier",
    });
  };

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Aucune carte trouvée</h2>
          <Button onClick={() => setLocation("/client")} className="bg-blue-600 hover:bg-blue-700">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 sm:p-6 lg:p-8 max-w-lg mx-auto">
      {/* Header responsive */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <Button
          onClick={() => setLocation("/client")}
          variant="ghost"
          className="text-white hover:bg-white/20 p-2 sm:px-4 sm:py-2"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
        <h1 className="text-lg sm:text-2xl font-bold text-white text-center">Ma Carte Bancaire</h1>
        <div className="w-8 sm:w-0"></div>
      </div>

      {/* Carte bancaire moderne futuriste - responsive */}
      <div className="flex justify-center mb-6 sm:mb-8 px-2">
        <div className="realistic-bank-card rotating-border">
          <div className="card-inner">
            <div className="card-content">
              {/* Effets holographiques */}
              <div className="absolute top-6 right-6 w-20 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>
              <div className="absolute bottom-8 left-8 w-24 h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
              
              {/* En-tête minimaliste */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <img 
                    src="/mb-logo-simple.png"
                    alt="MB Logo"
                    className="h-16 w-auto opacity-90 filter brightness-110"
                  />
                  <div className="text-xs font-light text-white/70 uppercase tracking-widest">
                    {card.isVirtual ? "Virtual" : "Physical"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-light text-white/90 tracking-wider">MB MARIE</div>
                  <div className="text-xs text-white/50 font-light tracking-widest">BANQUE</div>
                </div>
              </div>

              {/* Puce moderne */}
              <div className="flex items-start justify-between mb-10">
                <div className="relative">
                  <div className="w-12 h-9 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded-lg shadow-xl border border-slate-100/20">
                    <div className="absolute inset-1 bg-gradient-to-br from-slate-100 to-slate-300 rounded-md">
                      <div className="grid grid-cols-3 gap-px p-1 h-full">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="bg-slate-400/60 rounded-sm"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Symbole NFC futuriste */}
                <div className="text-right">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute border border-white/40 rounded-full`}
                          style={{
                            width: `${(i + 1) * 15}px`,
                            height: `${(i + 1) * 15}px`,
                            top: `${10 - (i + 1) * 2.5}px`,
                            left: `${16 - (i + 1) * 7.5}px`,
                          }}
                        />
                      ))}
                      <div className="absolute top-2 right-0 w-4 h-4 border-l-2 border-white/40"></div>
                    </div>
                  </div>
                  <div className="text-xs text-white/40 mt-2 font-light">Contactless</div>
                </div>
              </div>

              {/* Numéro de carte futuriste */}
              <div className="mb-8 text-center px-4">
                <div className="text-lg font-mono font-light text-white tracking-[0.3em] opacity-90 break-all">
                  {card.cardNumber.replace(/(\d{4})/g, '$1 ').trim()}
                </div>
                <div className="mt-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>

              {/* Informations élégantes */}
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/40 mb-1 font-light tracking-[0.2em]">HOLDER</div>
                  <div className="text-sm font-bold text-white tracking-wide truncate uppercase">
                    VERMEULEN VALENTIN
                  </div>
                </div>
                <div className="text-center mx-4">
                  <div className="text-xs text-white/40 mb-1 font-light tracking-[0.2em]">EXPIRES</div>
                  <div className="text-sm font-light text-white/90">{card.expiryDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40 mb-1 font-light tracking-[0.2em]">CVV</div>
                  <div className="text-sm font-light text-white/90">{card.cvv}</div>
                </div>
              </div>

              {/* Logo Mastercard moderne */}
              <div className="absolute bottom-6 right-6">
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 bg-red-500 rounded-full opacity-80"></div>
                  <div className="w-5 h-5 bg-orange-400 rounded-full opacity-80 -ml-2"></div>
                </div>
              </div>

              {/* Lignes décoratives */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/3 left-0 w-1/3 h-px bg-gradient-to-r from-transparent to-white/10"></div>
                <div className="absolute bottom-1/3 right-0 w-1/4 h-px bg-gradient-to-l from-transparent to-white/10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations détaillées - responsive */}
      <div className="max-w-md mx-auto space-y-4 px-2">
        {/* PIN de la carte */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            🔒 PIN de la carte
          </h3>
          <div className="flex items-center justify-between bg-black/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="text-white font-mono text-lg">
                {showPin ? card.pin : "••••"}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPin(!showPin)}
                className="text-white hover:bg-white/20"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {showPin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(card.pin)}
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

        {/* Statut */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            Statut de la carte
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${card.isBlocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <div className="text-white">
                {card.isBlocked ? "Bloquée" : "Active"}
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-red-600/20 border-red-400/30 text-white hover:bg-red-600/30"
            >
              <Shield className="h-4 w-4 mr-2" />
              {card.isBlocked ? "Débloquer" : "Faire opposition"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal PIN pour accéder à la carte */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-80 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4 text-center">
              Saisissez votre code PIN
            </h3>
            <p className="text-white/70 text-sm text-center mb-6">
              Pour accéder aux détails de votre carte
            </p>
            
            <div className="mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < pinInput.length ? 'bg-blue-500 border-blue-500' : 'border-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            <NumericKeypad
              onKeyPress={(key: string) => {
                if (pinInput.length < 6) {
                  const newPin = pinInput + key;
                  setPinInput(newPin);
                  
                  if (newPin.length === 6) {
                    setTimeout(() => {
                      if (newPin === user?.pin) {
                        setShowPinModal(false);
                        toast({
                          title: "Accès autorisé",
                          description: "PIN correct, affichage de la carte",
                        });
                      } else {
                        setPinInput("");
                        toast({
                          title: "PIN incorrect",
                          description: "Veuillez réessayer",
                          variant: "destructive",
                        });
                      }
                    }, 300);
                  }
                }
              }}
              onBackspace={() => {
                setPinInput(pinInput.slice(0, -1));
              }}
            />
            
            <Button
              variant="outline"
              onClick={() => setLocation("/client")}
              className="w-full mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}