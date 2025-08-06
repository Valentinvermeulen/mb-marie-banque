import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getCurrentUser, clearStoredUser, storeUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function PendingApproval() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = getCurrentUser();

  // Check approval status periodically
  const { data: currentUser, refetch } = useQuery({
    queryKey: [`/api/user/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 5000, // Check every 5 seconds
  }) as { data: any, refetch: () => void };

  useEffect(() => {
    if (!user || user.role !== "client") {
      setLocation("/");
      return;
    }

    // If user is approved, update stored user and redirect to dashboard
    if (currentUser?.isApproved === true) {
      // Update localStorage with the latest user data
      storeUser(currentUser);
      
      toast({
        title: "✅ Compte approuvé !",
        description: "Votre compte a été approuvé par votre conseiller.",
      });
      setLocation("/client");
    }
  }, [user, currentUser, setLocation, toast]);

  const handleLogout = () => {
    clearStoredUser();
    setLocation("/");
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"></div>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/mb-logo-simple.png"
              alt="MB MARIE BANQUE"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h1 className="text-white text-2xl font-bold">MB MARIE BANQUE</h1>
          </div>

          {/* Main Card */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <CardTitle className="text-white text-xl">
                Compte en attente d'approbation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div>
                <h2 className="text-white text-lg font-semibold mb-2">
                  Bienvenue {user.name} !
                </h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  Votre compte a été créé avec succès. Votre conseiller bancaire 
                  doit maintenant approuver votre demande d'ouverture de compte.
                </p>
              </div>

              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">Étapes suivantes</span>
                </div>
                <div className="space-y-2 text-white/80 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Compte créé avec succès</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Code PIN configuré</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span>En attente d'approbation du conseiller</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-200 text-sm">
                  <strong>Délai habituel :</strong> L'approbation prend généralement 
                  quelques minutes pendant les heures d'ouverture.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>

              <div className="text-center">
                <p className="text-white/60 text-xs">
                  Vous recevrez une notification dès que votre compte sera approuvé.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}