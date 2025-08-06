import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Lock, Fingerprint, Scan, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, storeUser } from "@/lib/auth";

export default function SetupPin() {
  const [, setLocation] = useLocation();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"set" | "confirm" | "biometric">("set");
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | null>(null);
  const { toast } = useToast();
  const user = getCurrentUser();

  const setPinMutation = useMutation({
    mutationFn: async (pinData: { userId: string; pin: string }) => {
      const response = await apiRequest("POST", "/api/auth/set-pin", pinData);
      return response.json();
    },
    onSuccess: async () => {
      toast({
        title: "PIN créé avec succès",
        description: "Votre compte est maintenant configuré",
      });
      
      // Update user in localStorage with PIN
      if (user) {
        storeUser({ ...user, pin });
      }

      // Check if biometric authentication is available
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (available) {
            // Detect device type to determine biometric method
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isApple) {
              setBiometricType("face");
            } else if (isMobile) {
              setBiometricType("fingerprint");
            } else {
              setBiometricType("fingerprint");
            }
            
            setStep("biometric");
            return; // Don't redirect yet, show biometric setup
          }
        } catch (error) {
          console.log("Biometric check failed:", error);
        }
      }
      
      // Check if user is approved before redirecting
      if (user && !user.isApproved) {
        setLocation("/pending-approval");
      } else {
        setLocation("/client");
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le PIN",
        variant: "destructive",
      });
    },
  });

  const handleKeyPress = (key: string) => {
    const currentPin = step === "set" ? pin : confirmPin;
    const setCurrentPin = step === "set" ? setPin : setConfirmPin;
    
    if (currentPin.length < 6) {
      setCurrentPin(currentPin + key);
    }
  };

  const handleBackspace = () => {
    const currentPin = step === "set" ? pin : confirmPin;
    const setCurrentPin = step === "set" ? setPin : setConfirmPin;
    
    setCurrentPin(currentPin.slice(0, -1));
  };

  const handleContinue = () => {
    if (step === "set" && pin.length === 6) {
      setStep("confirm");
    } else if (step === "confirm" && confirmPin.length === 6) {
      if (pin === confirmPin) {
        if (user) {
          setPinMutation.mutate({ userId: user.id, pin });
        }
      } else {
        toast({
          title: "Erreur",
          description: "Les codes PIN ne correspondent pas",
          variant: "destructive",
        });
        setPin("");
        setConfirmPin("");
        setStep("set");
      }
    }
  };

  const handleBiometricSetup = async () => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: { name: "CIC Banque" },
          user: {
            id: new Uint8Array(16),
            name: user?.email || "user@cic.fr",
            displayName: user?.name || "Utilisateur CIC"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          }
        }
      });

      if (credential) {
        localStorage.setItem('biometricSetup', 'true');
        
        toast({
          title: "Authentification biométrique activée",
          description: `${biometricType === 'face' ? 'Reconnaissance faciale' : 'Empreinte digitale'} configurée avec succès`,
        });
        
        // Check if user is approved before redirecting
        if (user && !user.isApproved) {
          setLocation("/pending-approval");
        } else {
          setLocation("/client");
        }
      }
    } catch (error) {
      toast({
        title: "Configuration échouée",
        description: "Impossible de configurer l'authentification biométrique",
        variant: "destructive",
      });
      // Check if user is approved before redirecting
      if (user && !user.isApproved) {
        setLocation("/pending-approval");
      } else {
        setLocation("/client");
      }
    }
  };

  const handleSkipBiometric = () => {
    setLocation("/client");
  };

  const currentPin = step === "set" ? pin : confirmPin;

  if (!user) {
    setLocation("/");
    return null;
  }

  // Biometric setup screen
  if (step === "biometric") {
    return (
      <div className="h-screen cic-gradient flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              {biometricType === "face" ? (
                <Scan className="text-white text-3xl" />
              ) : (
                <Fingerprint className="text-white text-3xl" />
              )}
            </div>
            <h1 className="text-white text-2xl font-semibold mb-3">
              Authentification sécurisée
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Votre appareil supporte {biometricType === "face" ? "la reconnaissance faciale" : "l'authentification par empreinte"}. 
              Activez-la pour vous connecter rapidement et en toute sécurité.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="h-5 w-5 text-white" />
              <span className="text-white font-semibold text-sm">Sécurité garantie</span>
            </div>
            <ul className="space-y-2 text-white/80 text-xs">
              <li>• Vos données biométriques restent sur votre appareil</li>
              <li>• Authentification instantanée et sécurisée</li>
              <li>• Vous pouvez toujours utiliser votre mot de passe</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleBiometricSetup}
              className="w-full animated-border bg-transparent text-white hover:text-gray-200 font-semibold py-4 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 relative z-10"
            >
              {biometricType === "face" ? (
                <Scan className="h-5 w-5 mr-2" />
              ) : (
                <Fingerprint className="h-5 w-5 mr-2" />
              )}
              Activer {biometricType === "face" ? "Face ID" : "Touch ID"}
            </Button>
            
            <Button
              onClick={handleSkipBiometric}
              variant="ghost"
              className="w-full text-white/70 hover:text-white hover:bg-white/10"
            >
              Passer cette étape
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PIN setup screens
  return (
    <div className="h-screen cic-gradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white text-2xl" />
          </div>
          <h1 className="text-white text-2xl font-semibold mb-2">
            {step === "set" ? "Créez votre code PIN" : "Confirmez votre code PIN"}
          </h1>
          <p className="text-white/80 text-sm">
            {step === "set" 
              ? "Choisissez un code à 6 chiffres pour sécuriser vos transactions"
              : "Saisissez à nouveau votre code PIN"
            }
          </p>
        </div>

        {/* PIN Input Display */}
        <div className="flex justify-center space-x-3 mb-8">
          {Array(6).fill(0).map((_, index) => (
            <div
              key={index}
              className={`w-12 h-12 bg-white/20 backdrop-blur-sm border-2 rounded-xl flex items-center justify-center ${
                index < currentPin.length 
                  ? "border-white bg-white/30" 
                  : "border-white/30"
              }`}
            >
              {index < currentPin.length && (
                <span className="text-2xl font-bold text-white">•</span>
              )}
            </div>
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((key, index) => {
              if (key === "") return <div key={index} />;
              
              if (key === "⌫") {
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    onClick={handleBackspace}
                    className="h-14 text-xl font-semibold text-white bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors active:scale-95"
                  >
                    {key}
                  </Button>
                );
              }

              return (
                <Button
                  key={key}
                  variant="ghost"
                  onClick={() => handleKeyPress(key.toString())}
                  className="h-14 text-xl font-semibold text-white bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors active:scale-95"
                >
                  {key}
                </Button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={currentPin.length !== 6 || setPinMutation.isPending}
          className="w-full animated-border bg-transparent text-white hover:text-gray-200 font-semibold py-4 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 relative z-10"
        >
          {step === "set" ? "Continuer" : setPinMutation.isPending ? "Création..." : "Confirmer"}
        </Button>
      </div>
    </div>
  );
}