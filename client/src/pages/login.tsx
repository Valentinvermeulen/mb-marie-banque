import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { storeUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import cicLogo from "@assets/cic_tiledouble_1754343403486.png";
import { Eye, EyeOff, Lock, User as UserIcon, Fingerprint, Scan } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [savedUsernames, setSavedUsernames] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAccounts, setBiometricAccounts] = useState<Array<{username: string, displayName: string, lastUsed: number}>>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const { toast } = useToast();
  const device = useDeviceDetection();

  // Check biometric support on component mount
  useEffect(() => {
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
            
            // Check for multiple biometric accounts
            const allBiometricAccounts = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('biometric_')) {
                const username = key.replace('biometric_', '');
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.enabled) {
                  allBiometricAccounts.push({
                    username,
                    displayName: data.displayName || username,
                    lastUsed: data.lastUsed || 0
                  });
                }
              }
            }
            
            // Sort by last used
            allBiometricAccounts.sort((a, b) => b.lastUsed - a.lastUsed);
            setBiometricAccounts(allBiometricAccounts);
            
            const hasEnabledBiometric = allBiometricAccounts.length > 0;
            setBiometricEnabled(hasEnabledBiometric);
            
            // Auto-fill username if only one biometric account or use most recent
            if (allBiometricAccounts.length > 0 && !username) {
              setUsername(allBiometricAccounts[0].username);
            }
          }
          
          // Get all saved usernames (biometric + regular saved logins)
          const savedLogins = localStorage.getItem('savedUsernames');
          if (savedLogins) {
            const usernames = JSON.parse(savedLogins);
            setSavedUsernames(usernames);
            
            // If no username set yet and we have saved usernames, use the most recent
            if (!username && usernames.length > 0) {
              setUsername(usernames[0]);
            }
          }
        } catch (error) {
          setBiometricType(null);
        }
      }
    };
    
    checkBiometricSupport();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      storeUser(data.user);
      
      // Save username for future logins
      const savedLogins = localStorage.getItem('savedUsernames');
      let usernames = savedLogins ? JSON.parse(savedLogins) : [];
      
      // Remove username if it exists and add it to the front
      usernames = usernames.filter((u: string) => u !== username);
      usernames.unshift(username);
      
      // Keep only last 5 usernames
      usernames = usernames.slice(0, 5);
      localStorage.setItem('savedUsernames', JSON.stringify(usernames));
      
      if (data.user.role === "advisor") {
        setLocation("/advisor");
      } else {
        // Check if client needs PIN setup
        if (!data.user.pin) {
          setLocation("/setup-pin");
        } else if (!data.user.isApproved) {
          setLocation("/pending-approval");
        } else {
          setLocation("/client");
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants incorrects",
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez saisir votre identifiant et mot de passe",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({ username, password });
  };

  const handleBiometricLogin = async (selectedUsername?: string) => {
    if (!biometricType || !biometricEnabled) return;

    // If multiple accounts exist and no specific account selected, show selection
    if (!selectedUsername && biometricAccounts.length > 1) {
      setShowAccountSelection(true);
      return;
    }

    // Use selected username or the only available account
    const usernameToUse = selectedUsername || biometricAccounts[0]?.username;
    
    if (!usernameToUse) {
      toast({
        title: "Erreur de configuration",
        description: "Aucun compte associé à l'authentification biométrique",
        variant: "destructive",
      });
      return;
    }

    try {
      // Real WebAuthn biometric authentication
      try {
        const biometricData = localStorage.getItem(`biometric_${usernameToUse}`);
        const credentialId = biometricData ? JSON.parse(biometricData).credentialId : null;
        if (!credentialId) {
          toast({
            title: "Configuration manquante",
            description: "Veuillez reconfigurer l'authentification biométrique",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Authentification en cours...",
          description: `${biometricType === 'face' ? 'Utilisez Face ID' : 'Utilisez votre empreinte'} pour vous connecter`,
        });

        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        // Convert credential ID back to Uint8Array
        const credentialIdBytes = new Uint8Array(
          credentialId.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
        );

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            allowCredentials: [{
              id: credentialIdBytes,
              type: "public-key",
              transports: ["internal"]
            }],
            userVerification: "required",
            timeout: 60000
          }
        });

        if (credential) {
          // Biometric authentication successful - update last used
          const biometricData = JSON.parse(localStorage.getItem(`biometric_${usernameToUse}`) || '{}');
          biometricData.lastUsed = Date.now();
          localStorage.setItem(`biometric_${usernameToUse}`, JSON.stringify(biometricData));
          
          const response = await apiRequest("POST", "/api/auth/login", { 
            username: usernameToUse, 
            password: "biometric_auth",
            biometric: true 
          });
          const data = await response.json();
          storeUser(data.user);
          
          toast({
            title: "Connexion réussie",
            description: `${biometricType === 'face' ? 'Face ID' : 'Touch ID'} validé`,
          });
          
          if (data.user.role === "advisor") {
            setLocation("/advisor");
          } else {
            setLocation("/client");
          }
        }
      } catch (authError: any) {
        console.error('Biometric auth error:', authError);
        let errorMessage = "Authentification biométrique échouée";
        
        if (authError.name === 'NotAllowedError') {
          errorMessage = "Authentification annulée ou accès refusé";
        } else if (authError.name === 'AbortError') {
          errorMessage = "Authentification annulée par l'utilisateur";
        } else if (authError.name === 'SecurityError') {
          errorMessage = "Erreur de sécurité lors de l'authentification";
        } else if (authError.name === 'InvalidStateError') {
          errorMessage = "Aucun authenticateur configuré";
        } else if (authError.name === 'NotSupportedError') {
          errorMessage = "Authentification biométrique non supportée";
        }
        
        toast({
          title: "Connexion échouée",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      let errorMessage = "Impossible de vous authentifier avec la biométrie";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Authentification annulée ou accès refusé";
      } else if (error.name === 'AbortError') {
        errorMessage = "Authentification annulée";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Erreur de sécurité lors de l'authentification";
      }
      
      toast({
        title: "Authentification échouée",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`min-h-screen mb-header-gradient relative overflow-hidden ${
      device.isDesktop 
        ? 'flex items-center justify-center px-8' 
        : 'flex flex-col items-center justify-center px-6 max-w-lg mx-auto'
    }`}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Desktop Layout */}
      {device.isDesktop ? (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Side - Logo and Title */}
          <div className="text-left flex flex-col justify-center">
            <div className="mb-logo mb-4">
              <img 
                src="/mb-logo-simple.png"
                alt="MB MARIE BANQUE"
                className="h-24 w-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-white text-2xl font-bold mb-3 leading-tight">
              MB MARIE BANQUE
            </h1>
            <p className="text-white/80 text-sm mb-3">
              Votre banque numérique moderne
            </p>
            <div className="text-white/70 text-xs space-y-1">
              <p>✓ Gestion de comptes en temps réel</p>
              <p>✓ Virements instantanés</p>
              <p>✓ Sécurité renforcée</p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md">
            <h2 className="text-white text-xl font-bold mb-6 text-center">Connexion</h2>
            
            {/* Biometric Login Button - Show prominently if available */}
            {biometricType && biometricEnabled && (
              <div className="mb-4">
                <Button
                  onClick={() => handleBiometricLogin()}
                  className="w-full mb-btn text-white font-semibold py-3 h-12 rounded-xl shadow-lg hover:shadow-xl mb-transition"
                >
                  <div className="flex items-center justify-center space-x-3">
                    {biometricType === "face" ? (
                      <Scan className="h-6 w-6" />
                    ) : (
                      <Fingerprint className="h-6 w-6" />
                    )}
                    <span>
                      {biometricType === "face" ? "Connexion Face ID" : "Connexion Touch ID"}
                    </span>
                    {biometricAccounts.length > 1 && (
                      <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
                        {biometricAccounts.length}
                      </span>
                    )}
                  </div>
                </Button>
              </div>
            )}

            {/* Traditional Login Separator */}
            {biometricType && biometricEnabled && (
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 h-px bg-white/30"></div>
                <span className="text-white/70 text-sm">ou mot de passe</span>
                <div className="flex-1 h-px bg-white/30"></div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5 crisp-icon" />
                <input
                  list="saved-usernames"
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 py-3 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:bg-white/30"
                  required
                />
                <datalist id="saved-usernames">
                  {savedUsernames.map((savedUsername) => (
                    <option key={savedUsername} value={savedUsername} />
                  ))}
                </datalist>
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5 crisp-icon" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:border-white focus:bg-white/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full mb-btn text-white font-semibold py-3 h-12 rounded-xl shadow-lg hover:shadow-xl mb-transition"
              >
                {loginMutation.isPending ? "CONNEXION..." : "SE CONNECTER"}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm">
                Nouveau client ?{" "}
                <button
                  onClick={() => setLocation("/register")}
                  className="text-white underline font-semibold hover:text-white/80"
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile Layout Compact */
        <div className="min-h-screen flex flex-col justify-center px-4 py-6 overflow-x-hidden">
          <div className="w-full max-w-xs mx-auto space-y-4">
            {/* Logo et titre compact */}
            <div className="text-center">
              <div className="mb-2">
                <img 
                  src="/mb-logo-simple.png"
                  alt="MB"
                  className="h-20 w-auto mx-auto"
                />
              </div>
              <h1 className="text-white text-lg font-bold mb-1">Connexion</h1>
              <p className="text-white/70 text-xs">MB MARIE BANQUE</p>
            </div>

            {/* Biometric Login Button */}
            {biometricType && biometricEnabled && (
              <Button
                onClick={() => handleBiometricLogin()}
                className="w-full mb-btn text-white font-semibold py-3 h-11 rounded-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  {biometricType === "face" ? (
                    <Scan className="h-5 w-5" />
                  ) : (
                    <Fingerprint className="h-5 w-5" />
                  )}
                  <span className="text-sm">
                    {biometricType === "face" ? "Face ID" : "Touch ID"}
                  </span>
                </div>
              </Button>
            )}

            {/* Divider */}
            {biometricType && biometricEnabled && (
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-px bg-white/30"></div>
                <span className="text-white/60 text-xs">ou</span>
                <div className="flex-1 h-px bg-white/30"></div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4 crisp-icon" />
                <input
                  list="saved-usernames"
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:border-white focus:bg-white/30 text-sm"
                  required
                />
                <datalist id="saved-usernames">
                  {savedUsernames.map((savedUsername) => (
                    <option key={savedUsername} value={savedUsername} />
                  ))}
                </datalist>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4 crisp-icon" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 h-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/70 focus:border-white focus:bg-white/30 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 crisp-icon" /> : <Eye className="h-4 w-4 crisp-icon" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full mb-btn text-white font-semibold py-2 h-10 rounded-lg text-sm"
              >
                {loginMutation.isPending ? "CONNEXION..." : "SE CONNECTER"}
              </Button>
            </form>

            {/* Register link */}
            <div className="text-center pt-4">
              <p className="text-white/70 text-xs">
                Pas encore client ?{" "}
                <button
                  onClick={() => setLocation("/register")}
                  className="text-white font-semibold underline hover:no-underline"
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Selection Modal */}
      {showAccountSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Choisir un compte</h3>
            <p className="text-sm text-gray-600 mb-6">Sélectionnez le compte à utiliser pour l'authentification biométrique :</p>
            
            <div className="space-y-3">
              {biometricAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => {
                    setShowAccountSelection(false);
                    handleBiometricLogin(account.username);
                  }}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-[var(--cic-teal)] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {account.displayName.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{account.displayName}</div>
                    <div className="text-sm text-gray-500">@{account.username}</div>
                    {account.lastUsed > 0 && (
                      <div className="text-xs text-gray-400">
                        Dernier accès : {new Date(account.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {biometricType === "face" ? (
                      <Scan className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Fingerprint className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowAccountSelection(false)}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}