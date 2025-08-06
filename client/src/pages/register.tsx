import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Mail, Lock, ArrowLeft } from "lucide-react";
import { registerSchema } from "@shared/schema";
import { z } from "zod";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

type RegisterData = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const { toast } = useToast();
  const device = useDeviceDetection();

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé. En attente d'approbation du conseiller.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      let errorMessage = "L'inscription a échoué";
      
      // Handle different error formats
      if (error.message) {
        if (error.message.includes("Username already exists")) {
          errorMessage = "Ce nom d'utilisateur est déjà utilisé. Essayez un nom différent comme : " + formData.username + "2025, " + formData.username + ".mb, ou " + formData.username + "_client";
          // Generate suggestions based on current username
          const suggestions = [
            formData.username + "2025",
            formData.username + ".mb", 
            formData.username + "_client",
            formData.username + "." + formData.name.split(' ')[0].toLowerCase()
          ];
          setSuggestedUsernames(suggestions);
        } else if (error.message.includes("Email already exists")) {
          errorMessage = "Cette adresse email est déjà utilisée. Veuillez en choisir une autre.";
        } else if (error.message.includes("Registration failed")) {
          errorMessage = "L'inscription a échoué. Veuillez vérifier vos informations.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear suggestions when username changes
    if (field === "username") {
      setSuggestedUsernames([]);
    }
  };

  return (
    <div className={`h-screen mb-header-gradient relative overflow-hidden ${
      device.isDesktop 
        ? 'flex items-center justify-center px-8' 
        : 'flex flex-col items-center justify-center px-6 max-w-lg mx-auto'
    }`}>
      {/* Fond animé */}
      <div className="absolute inset-0 mb-gradient opacity-20"></div>
      
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
              Rejoignez MB MARIE BANQUE
            </h1>
            <p className="text-white/80 text-sm mb-3">
              Créez votre compte en quelques minutes
            </p>
            <div className="text-white/70 text-xs space-y-1">
              <p>✓ Ouverture de compte gratuite</p>
              <p>✓ Accès immédiat après validation</p>
              <p>✓ Support client dédié</p>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mb-4 text-white hover:bg-white/30 mb-transition rounded-full w-10 h-10 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <h2 className="text-white text-xl font-bold mb-6 text-center">Créer un compte</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70 crisp-icon" />
                <Input
                  type="text"
                  placeholder="Nom complet"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-12 pr-4 py-3 h-12 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/30 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70 crisp-icon" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-12 pr-4 py-3 h-12 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/30 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70"
                  required
                />
              </div>

              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70 crisp-icon" />
                <Input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="pl-12 pr-4 py-3 h-12 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/30 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70 crisp-icon" />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-12 pr-4 py-3 h-12 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-white/30 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70"
                  required
                />
              </div>

              {/* Username suggestions desktop */}
              {suggestedUsernames.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-3">Suggestions de noms d'utilisateur :</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedUsernames.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleInputChange("username", suggestion)}
                        className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm hover:bg-white/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full mb-btn text-white font-semibold py-3 h-12 rounded-xl shadow-lg hover:shadow-xl mb-transition"
              >
                {registerMutation.isPending ? "CRÉATION..." : "CRÉER MON COMPTE"}
              </Button>
            </form>

            <div className="text-center mt-4">
              <p className="text-white/70 text-sm">
                Déjà un compte ?{" "}
                <button
                  onClick={() => setLocation("/")}
                  className="text-white underline font-semibold"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile Layout Compact */
        <div className="min-h-screen flex flex-col justify-center px-4 py-6 overflow-x-hidden">
          <div className="w-full max-w-xs mx-auto space-y-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="self-start text-white hover:bg-white/20 rounded-full w-9 h-9 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Logo et titre compact */}
            <div className="text-center">
              <div className="mb-2">
                <img 
                  src="/mb-logo-simple.png"
                  alt="MB"
                  className="h-16 w-auto mx-auto"
                />
              </div>
              <h1 className="text-white text-lg font-bold mb-1">Créer un compte</h1>
              <p className="text-white/70 text-xs">Rejoignez MB MARIE BANQUE</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 crisp-icon" />
                <Input
                  type="text"
                  placeholder="Nom complet"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10 pr-4 py-2 h-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:border-white focus:bg-white/30 text-sm"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 crisp-icon" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 pr-4 py-2 h-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:border-white focus:bg-white/30 text-sm"
                  required
                />
              </div>

              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 crisp-icon" />
                <Input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="pl-10 pr-4 py-2 h-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:border-white focus:bg-white/30 text-sm"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 crisp-icon" />
                <Input
                  type="password"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-4 py-2 h-10 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:border-white focus:bg-white/30 text-sm"
                  required
                />
              </div>

              {/* Username suggestions mobile */}
              {suggestedUsernames.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                  <p className="text-white/70 text-xs mb-2">Suggestions de noms d'utilisateur :</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedUsernames.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleInputChange("username", suggestion)}
                        className="px-3 py-1 bg-white/20 border border-white/30 rounded-md text-white text-xs hover:bg-white/30 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full mb-btn text-white font-semibold py-2 h-10 rounded-lg text-sm mt-3"
              >
                {registerMutation.isPending ? "CRÉATION..." : "CRÉER MON COMPTE"}
              </Button>
            </form>

            {/* Login link */}
            <div className="text-center pt-4">
              <p className="text-white/70 text-xs">
                Déjà un compte ?{" "}
                <button
                  onClick={() => setLocation("/")}
                  className="text-white underline font-semibold"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}