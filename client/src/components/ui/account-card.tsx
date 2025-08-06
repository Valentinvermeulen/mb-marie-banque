import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Account } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

interface AccountCardProps {
  account: Account;
  icon: React.ReactNode;
}

export default function AccountCard({ account, icon }: AccountCardProps) {
  const [showFullIban, setShowFullIban] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(account.name);
  const { toast } = useToast();
  const user = getCurrentUser();

  const getPercentageChange = (type: string) => {
    switch (type) {
      case "courant":
        return "+2,5%";
      case "epargne":
        return "+1,2%";
      case "pel":
        return "+3,1%";
      default:
        return "+0,0%";
    }
  };

  const { data: userRib } = useQuery({
    queryKey: ["/api/user-rib", account.userId],
    enabled: !!account.userId,
    refetchInterval: 5000, // Refresh to get updated RIB info
  });

  const generateIban = (accountId: string) => {
    // Use real RIB data if available, otherwise fallback
    if (userRib && 'iban' in userRib && userRib.iban) {
      return userRib.iban;
    }
    // Fallback: Generate a realistic French IBAN from account ID
    const cleanId = accountId.replace(/-/g, '').slice(0, 11);
    return `FR76300810000100${cleanId.padEnd(11, '0')}54`;
  };

  const copyIban = async () => {
    try {
      const iban = generateIban(account.id);
      await navigator.clipboard.writeText(iban);
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
  };

  const handleSaveName = async () => {
    if (newName.trim() === account.name || !newName.trim()) {
      setIsEditing(false);
      setNewName(account.name);
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${account.id}/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update account name');
      }

      setIsEditing(false);
      toast({
        title: "Nom mis à jour",
        description: "Le nom de votre compte a été modifié avec succès",
      });
      
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le nom du compte",
        variant: "destructive",
      });
      setNewName(account.name);
      setIsEditing(false);
    }
  };

  return (
    <Card className="shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mr-4">
              {icon}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') {
                        setIsEditing(false);
                        setNewName(account.name);
                      }
                    }}
                    className="h-7 text-sm font-semibold"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-white">{account.name}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-6 w-6 p-0 text-white/60 hover:text-white"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <p className="text-sm text-white/70 font-mono">
                  {showFullIban ? generateIban(account.id) : `•••• •••• ••${account.id.slice(-4)}`}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFullIban(!showFullIban)}
                  className="h-6 w-6 p-0 text-white/60 hover:text-white"
                >
                  {showFullIban ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyIban}
                  className="h-6 w-6 p-0 text-white/60 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-white">
              {parseFloat(account.balance).toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })} €
            </p>
            <p className="text-xs text-green-600">{getPercentageChange(account.type)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
