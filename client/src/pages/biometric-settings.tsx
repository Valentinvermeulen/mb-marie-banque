import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Fingerprint, Scan, Shield, AlertTriangle } from "lucide-react";

export default function BiometricSettings() {
  const [, setLocation] = useLocation();
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
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
            
            const hasSetupBiometric = localStorage.getItem('biometricSetup') === 'true';
            setBiometricEnabled(hasSetupBiometric);
          }
        } catch (error) {
          setBiometricType(null);
        }
      }
    };

    checkBiometricSupport();
  }, [user, setLocation]);

  const handleToggleBiometric = async () => {
    if (!biometricType) return;

    setIsLoading(true);
    
    try {
      if (!biometricEnabled) {
        // Enable biometric authentication
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
          setBiometricEnabled(true);
          
          toast({
            title: "Authentification biométrique activée",
            description: `${biometricType === 'face' ? 'Reconnaissance faciale' : 'Authentification par empreinte'} configurée avec succès`,
          });
        }
      } else {
        // Disable biometric authentication
        localStorage.removeItem('biometricSetup');
        setBiometricEnabled(false);
        
        toast({
          title: "Authentification biométrique désactivée",
          description: "Vous devrez utiliser votre mot de passe pour vous connecter",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: biometricEnabled 
          ? "Impossible de désactiver l'authentification biométrique" 
          : "Impossible d'activer l'authentification biométrique",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="cic-gradient px-6 pt-12 pb-6 text-white">
        <div className="flex items-center mb-6">
          <Button
            onClick={() => setLocation("/my-account")}
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20 mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Sécurité</h1>
            <p className="text-white/80">Authentification biométrique</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {biometricType ? (
          <>
            {/* Main Biometric Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {biometricType === "face" ? (
                    <Scan className="h-6 w-6 mr-3 text-blue-600" />
                  ) : (
                    <Fingerprint className="h-6 w-6 mr-3 text-blue-600" />
                  )}
                  {biometricType === "face" ? "Face ID" : "Touch ID"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {biometricType === "face" ? "Reconnaissance faciale" : "Authentification par empreinte"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {biometricEnabled 
                        ? "Activée - Vous pouvez vous connecter rapidement" 
                        : "Désactivée - Connexion par mot de passe uniquement"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={biometricEnabled}
                    onCheckedChange={handleToggleBiometric}
                    disabled={isLoading}
                  />
                </div>

                {biometricEnabled && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Authentification sécurisée activée
                        </p>
                        <p className="text-xs text-green-600">
                          Vos données biométriques restent sur votre appareil
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-6 w-6 mr-3 text-gray-600" />
                  Sécurité et confidentialité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Vos données biométriques ne quittent jamais votre appareil</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>L'authentification utilise les standards de sécurité WebAuthn</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Vous pouvez toujours utiliser votre mot de passe en cas de besoin</p>
                </div>
              </CardContent>
            </Card>

            {/* Test Biometric */}
            {biometricEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Tester l'authentification</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.credentials.get({
                          publicKey: {
                            challenge: new Uint8Array(32),
                            allowCredentials: [],
                            userVerification: "required"
                          }
                        });
                        
                        toast({
                          title: "Test réussi",
                          description: "Votre authentification biométrique fonctionne correctement",
                        });
                      } catch (error) {
                        toast({
                          title: "Test échoué",
                          description: "Problème avec l'authentification biométrique",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    {biometricType === "face" ? (
                      <Scan className="h-4 w-4 mr-2" />
                    ) : (
                      <Fingerprint className="h-4 w-4 mr-2" />
                    )}
                    Tester {biometricType === "face" ? "Face ID" : "Touch ID"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* No Biometric Support */
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">
                Authentification biométrique indisponible
              </h3>
              <p className="text-sm text-gray-500">
                Votre appareil ne supporte pas l'authentification biométrique ou 
                aucune donnée biométrique n'est configurée sur votre appareil.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}