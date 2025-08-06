import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@shared/schema";
import { Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: Card[];
}

export default function CardModal({ open, onOpenChange, cards }: CardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const card = cards[0]; // Display first card

  const blockCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await apiRequest("PATCH", `/api/cards/${cardId}/status`, {
        isBlocked: true,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Carte bloquée",
        description: "Votre carte a été bloquée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    },
  });

  const copyPin = () => {
    if (card?.pin) {
      navigator.clipboard.writeText(card.pin);
      toast({
        title: "Code copié",
        description: "Le code PIN a été copié dans le presse-papiers",
      });
    }
  };

  if (!card) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Ma Carte Virtuelle
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-white/80">Vous n'avez pas encore de carte bancaire</p>
            <p className="text-sm text-white/60 mt-2">Contactez votre conseiller pour en commander une</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Ma Carte Virtuelle
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Virtual Card Display */}
        <div className="cic-gradient rounded-2xl p-6 text-white mb-6 transform hover:scale-105 transition-transform duration-200">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm opacity-80">CIC Digital</p>
              <p className="text-xs opacity-60">Carte Virtuelle</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">MC</div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xl font-mono tracking-widest">
              {card.cardNumber.replace(/(.{4})/g, '$1 ').trim()}
            </p>
          </div>

          <div className="flex justify-between">
            <div>
              <p className="text-xs opacity-60">Titulaire</p>
              <p className="text-sm font-medium">{card.holderName}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Expire</p>
              <p className="text-sm font-medium">{card.expiryDate}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">CVV</p>
              <p className="text-sm font-medium">{card.cvv}</p>
            </div>
          </div>
        </div>

        {/* PIN Display */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Code PIN</p>
              <p className="text-lg font-mono font-bold text-white">{card.pin}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyPin}
              className="text-[var(--cic-teal)] hover:text-[var(--cic-dark-teal)]"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => blockCardMutation.mutate(card.id)}
            disabled={blockCardMutation.isPending || (card.isBlocked ?? false)}
            className="flex-1 py-3 text-red-600 border-red-200 hover:bg-red-50"
          >
            {card.isBlocked ? "Bloquée" : "Bloquer"}
          </Button>
          <Button className="flex-1 py-3 bg-[var(--cic-teal)] hover:bg-[var(--cic-dark-teal)]">
            Paramètres
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
